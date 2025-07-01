import { supabase } from "./supabase";

export async function ensureUserProfile(userId: string) {
  try {
    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      // Profile doesn't exist, get user data from auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Failed to get user data");
      }

      // Create profile with proper data structure
      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.email?.split('@')[0] || 
                null,
          avatar_url: user.user_metadata?.avatar_url || null,
          wallet_address: null, // Initialize as null, can be updated later
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating user profile:", insertError);
        throw new Error(`Failed to create user profile: ${insertError.message}`);
      }

      return { success: true, created: true, profile: newProfile };
    } else if (profileError) {
      // Some other error occurred
      console.error("Error checking user profile:", profileError);
      throw new Error(`Failed to check user profile: ${profileError.message}`);
    }

    // Profile exists
    return { success: true, created: false, profile };
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    throw error;
  }
}

// Additional utility function for getting user profile
export async function getUserProfile(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      return null; // Profile doesn't exist
    }

    if (error) {
      throw error;
    }

    return profile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

// Utility function to update user profile
export async function updateUserProfile(userId: string, updates: {
  name?: string;
  avatar_url?: string;
  wallet_address?: string;
}) {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}
