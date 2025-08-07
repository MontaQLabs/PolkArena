"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ensureUserProfile } from "@/lib/auth-utils";
import { Database } from "@/lib/database.types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache for profile data to avoid repeated database calls
const profileCache = new Map<string, { data: UserProfile; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Session persistence keys
const SESSION_USER_KEY = 'polka_arena_user';
const SESSION_PROFILE_KEY = 'polka_arena_profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with cached data if available
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(SESSION_USER_KEY);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(SESSION_PROFILE_KEY);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Track ongoing profile fetches to prevent race conditions
  const profileFetchingRef = useRef<Set<string>>(new Set());
  const initializationRef = useRef<boolean>(false);

  // Persist user and profile to localStorage
  const persistUser = useCallback((userData: User | null) => {
    try {
      if (userData) {
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(SESSION_USER_KEY);
      }
    } catch (error) {
      console.warn('Failed to persist user session:', error);
    }
  }, []);

  const persistProfile = useCallback((profileData: UserProfile | null) => {
    try {
      if (profileData) {
        localStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profileData));
      } else {
        localStorage.removeItem(SESSION_PROFILE_KEY);
      }
    } catch (error) {
      console.warn('Failed to persist profile session:', error);
    }
  }, []);

  const getCachedProfile = useCallback((userId: string): UserProfile | null => {
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedProfile = useCallback((userId: string, profileData: UserProfile) => {
    profileCache.set(userId, { data: profileData, timestamp: Date.now() });
  }, []);

  const updateUserState = useCallback((newUser: User | null) => {
    setUser(newUser);
    persistUser(newUser);
  }, [persistUser]);

  const updateProfileState = useCallback((newProfile: UserProfile | null) => {
    setProfile(newProfile);
    persistProfile(newProfile);
  }, [persistProfile]);

  const ensureProfileExists = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous calls for the same user
    if (profileFetchingRef.current.has(userId)) {
      return;
    }

    try {
      profileFetchingRef.current.add(userId);

      // Check cache first
      const cachedProfile = getCachedProfile(userId);
      if (cachedProfile) {
        updateProfileState(cachedProfile);
        return;
      }

      // console.log("Fetching profile for user:", userId);
      
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000); // 10 second timeout
      });

      const profilePromise = ensureUserProfile(userId);
      
      const result = await Promise.race([profilePromise, timeoutPromise]) as { success: boolean; profile?: UserProfile };
      
      if (result.success && result.profile) {
        updateProfileState(result.profile);
        setCachedProfile(userId, result.profile);
        // console.log("Profile loaded successfully");
      } else {
        console.warn("Profile fetch returned no data, but continuing...");
        // Don't throw error, just continue without profile
      }
    } catch (error) {
      console.error("Error ensuring profile exists:", error);
      // Don't throw the error, just log it and continue
      // The app should still work without profile data
    } finally {
      profileFetchingRef.current.delete(userId);
    }
  }, [getCachedProfile, setCachedProfile, updateProfileState]);

  useEffect(() => {
    let mounted = true;

    // Prevent multiple initializations
    if (initializationRef.current) {
      return;
    }
    initializationRef.current = true;

    const initializeAuth = async () => {
      try {
        // console.log("Initializing auth...");
        
        // Get session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          if (mounted) {
            updateUserState(null);
            updateProfileState(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          const sessionUser = session?.user ?? null;
          
          // Update user state
          updateUserState(sessionUser);
          
          if (sessionUser) {
            // console.log("Found existing session, loading profile...");
            
            // If we have a cached profile and it matches the user, use it immediately
            const cachedProfile = getCachedProfile(sessionUser.id);
            if (cachedProfile) {
              updateProfileState(cachedProfile);
              setLoading(false);
            } else {
              // Fetch profile but don't let it block loading state
              ensureProfileExists(sessionUser.id).finally(() => {
                if (mounted) setLoading(false);
              });
            }
          } else {
            // Clear profile if no user
            updateProfileState(null);
            setLoading(false);
          }
          
          // console.log("Auth initialization complete");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          updateUserState(null);
          updateProfileState(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // console.log("Auth state change:", event, !!session?.user);
      
      // Handle all auth events but be smart about when to fetch profile
      const sessionUser = session?.user ?? null;
      updateUserState(sessionUser);
      
             if (event === 'SIGNED_IN' && sessionUser) {
         // Fetch profile on sign in but don't block loading
         ensureProfileExists(sessionUser.id);
         setLoading(false);
       } else if (event === 'SIGNED_OUT') {
         // Clear everything on sign out
         updateProfileState(null);
         profileCache.clear();
         setLoading(false);
       } else if (event === 'TOKEN_REFRESHED' && sessionUser) {
         // Don't fetch profile on token refresh, just ensure user state is correct
         // Profile should already be available from cache or localStorage
         if (!profile) {
           const cachedProfile = getCachedProfile(sessionUser.id);
           if (cachedProfile) {
             updateProfileState(cachedProfile);
           }
         }
         setLoading(false);
       } else {
         // Fallback: always clear loading for any other events
         setLoading(false);
       }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      initializationRef.current = false;
    };
  }, []); // Empty dependency array to prevent re-runs

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    name: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          full_name: name,
        }
      }
    });

    if (!error && data.user) {
      try {
        await ensureUserProfile(data.user.id);
      } catch (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    return { error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      updateUserState(null);
      updateProfileState(null);
      profileCache.clear();
    }
    return { error };
  }, [updateUserState, updateProfileState]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error("No user logged in") };
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      if (data) {
        updateProfileState(data);
        setCachedProfile(user.id, data);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user, setCachedProfile, updateProfileState]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileCache.delete(user.id);
      await ensureProfileExists(user.id);
    }
  }, [user, ensureProfileExists]);

  const value = {
    user,
    profile,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook to wait for auth to be ready before making API calls
export function useAuthReady() {
  const { user, loading } = useAuth();
  const authReady = !loading;
  const isAuthenticated = authReady && !!user;
  
  return {
    authReady,      // True when auth initialization is complete
    isAuthenticated, // True when user is logged in and auth is ready
    user,           // Current user or null
    loading         // True during auth initialization
  };
}
