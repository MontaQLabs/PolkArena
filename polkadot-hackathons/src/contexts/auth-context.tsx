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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track ongoing profile fetches to prevent race conditions
  const profileFetchingRef = useRef<Set<string>>(new Set());
  const initializationRef = useRef<boolean>(false);

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
        setProfile(cachedProfile);
        return;
      }

      console.log("Fetching profile for user:", userId);
      const result = await ensureUserProfile(userId);
      if (result.success && result.profile) {
        setProfile(result.profile);
        setCachedProfile(userId, result.profile);
        console.log("Profile loaded successfully");
      }
    } catch (error) {
      console.error("Error ensuring profile exists:", error);
    } finally {
      profileFetchingRef.current.delete(userId);
    }
  }, [getCachedProfile, setCachedProfile]);

  useEffect(() => {
    let mounted = true;

    // Prevent multiple initializations
    if (initializationRef.current) {
      return;
    }
    initializationRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log("Found existing session, loading profile...");
            await ensureProfileExists(session.user.id);
          }
          setLoading(false);
          console.log("Auth initialization complete");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event, !!session?.user);
      
      // Only handle specific events to avoid unnecessary processing
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        
        if (session?.user && event === 'SIGNED_IN') {
          // Only fetch profile on sign in, not on token refresh
          await ensureProfileExists(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          profileCache.clear();
        }
        
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
      setProfile(null);
      profileCache.clear();
    }
    return { error };
  }, []);

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
        setProfile(data);
        setCachedProfile(user.id, data);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user, setCachedProfile]);

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
