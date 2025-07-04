"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ensureUserProfile } from "@/lib/auth-utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

export default function CreateProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    created?: boolean;
  } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setResult({ success: false, message: "No authenticated user found" });
        setLoading(false);
        return;
      }
      setUser(user);
      
      // Check if profile already exists
      await checkExistingProfile(user.id);
      setLoading(false);
    };

    getUser();
  }, []);

  const checkExistingProfile = async (userId: string) => {
    try {
      const { data: existingProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (existingProfile) {
        setProfile(existingProfile);
        setResult({
          success: true,
          message: "User profile already exists!",
          created: false,
        });
      }
    } catch (error) {
      // Profile doesn't exist, which is fine
      console.log("No existing profile found", error);
    }
  };

  const handleCreateProfile = async () => {
    if (!user) return;

    setCreating(true);
    setResult(null);
    
    try {
      const response = await ensureUserProfile(user.id);
      
      if (response.success) {
        setProfile(response.profile);
        
        if (response.created) {
          setResult({
            success: true,
            message: "User profile created successfully!",
            created: true,
          });
          toast.success("User profile created successfully!");
        } else {
          setResult({
            success: true,
            message: "User profile already existed!",
            created: false,
          });
          toast.success("User profile already existed!");
        }
      }
    } catch (error: unknown) {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-polkadot-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create User Profile</CardTitle>
              <CardDescription>
                Debug page to manually create user profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">User ID:</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {user.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email:</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  {/* Show profile info if it exists */}
                  {profile && (
                    <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Profile Status</span>
                      </div>
                      <div className="text-xs text-green-600 space-y-1">
                        <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
                        <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
                        {profile.wallet_address && (
                          <p><strong>Wallet:</strong> {profile.wallet_address}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show create button only if no profile exists */}
                  {!profile && (
                    <Button
                      onClick={handleCreateProfile}
                      disabled={creating}
                      className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <User className="h-4 w-4 mr-2" />
                      )}
                      Create Profile
                    </Button>
                  )}

                  {/* Show refresh button if profile exists */}
                  {profile && (
                    <Button
                      onClick={handleCreateProfile}
                      disabled={creating}
                      variant="outline"
                      className="w-full"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Refresh Profile Status
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <p className="text-red-600">No authenticated user found</p>
                </div>
              )}

              {result && (
                <div
                  className={`p-3 rounded-lg border ${
                    result.success
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  <p className="text-sm font-medium">{result.message}</p>
                  {result.success && result.created !== undefined && (
                    <p className="text-xs mt-1">
                      {result.created ? "New profile was created" : "Profile already existed"}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
