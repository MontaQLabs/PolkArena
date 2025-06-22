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

      // Create profile
      const { error: insertError } = await supabase.from("users").insert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      });

      if (insertError) {
        console.error("Error creating user profile:", insertError);
        throw new Error("Failed to create user profile");
      }

      return { success: true, created: true };
    }

    return { success: true, created: false, profile };
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    throw error;
  }
}
