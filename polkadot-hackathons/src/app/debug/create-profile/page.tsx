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
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function CreateProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
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
      setLoading(false);
    };

    getUser();
  }, []);

  const handleCreateProfile = async () => {
    if (!user) return;

    setCreating(true);
    try {
      await ensureUserProfile(user.id);
      setResult({
        success: true,
        message: "User profile created successfully!",
      });
      toast.success("User profile created successfully!");
    } catch (error) {
      console.error("Error creating profile:", error);
      setResult({ success: false, message: "Failed to create user profile" });
      toast.error("Failed to create user profile");
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

                  <Button
                    onClick={handleCreateProfile}
                    disabled={creating}
                    className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Create Profile
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <p className="text-red-600">No authenticated user found</p>
                </div>
              )}

              {result && (
                <div
                  className={`p-3 rounded-lg ${
                    result.success
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <p className="text-sm">{result.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
