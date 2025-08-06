"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
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
    try {
      // Check cache first
      const cachedProfile = getCachedProfile(userId);
      if (cachedProfile) {
        setProfile(cachedProfile);
        return;
      }

      const result = await ensureUserProfile(userId);
      if (result.success && result.profile) {
        setProfile(result.profile);
        setCachedProfile(userId, result.profile);
      }
    } catch (error) {
      console.error("Error ensuring profile exists:", error);
    }
  }, [getCachedProfile, setCachedProfile]);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await ensureProfileExists(session.user.id);
          }
          setLoading(false);
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
      
      setUser(session?.user ?? null);
      if (session?.user) {
        // Ensure profile exists (especially important for OAuth users)
        await ensureProfileExists(session.user.id);
      } else {
        setProfile(null);
        // Clear cache when user signs out
        profileCache.clear();
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfileExists]);

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
    // Include name in user metadata for consistency
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          full_name: name, // Some systems use full_name
        }
      }
    });

    // If you have a database trigger, it will handle profile creation
    // If not, create profile manually
    if (!error && data.user) {
      try {
        await ensureUserProfile(data.user.id);
      } catch (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't return this as an error since auth succeeded
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
      profileCache.clear(); // Clear cache on sign out
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
        setCachedProfile(user.id, data); // Update cache
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user, setCachedProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      // Clear cache for this user to force refresh
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
