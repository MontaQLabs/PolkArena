"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setStatus("error");
          setMessage(error.message);
          toast.error("Authentication failed: " + error.message);
          return;
        }

        if (data.session) {
          // Check if user profile exists, if not create one
          const { error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.session.user.id)
            .single();

          if (profileError && profileError.code === "PGRST116") {
            // Profile doesn't exist, create one
            const { error: insertError } = await supabase.from("users").insert({
              id: data.session.user.id,
              email: data.session.user.email!,
              name:
                data.session.user.user_metadata?.full_name ||
                data.session.user.user_metadata?.name ||
                null,
              avatar_url: data.session.user.user_metadata?.avatar_url || null,
            });

            if (insertError) {
              console.error("Error creating profile:", insertError);
              setStatus("error");
              setMessage("Failed to create user profile");
              toast.error("Failed to create user profile");
              return;
            }
          }

          setStatus("success");
          setMessage("Successfully signed in!");
          toast.success("Successfully signed in!");

          // Redirect to hackathons page after a short delay
          setTimeout(() => {
            router.push("/hackathons");
          }, 1500);
        } else {
          setStatus("error");
          setMessage("No session found");
          toast.error("Authentication failed: No session found");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="h-10 w-10 rounded-lg overflow-hidden">
              <img 
                src="/logo.png" 
                alt="PolkaArena Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-bold text-2xl text-polkadot-pink">
              PolkaArena
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Authentication</CardTitle>
            <CardDescription className="text-center">
              {status === "loading" && "Completing your sign in..."}
              {status === "success" && "Sign in successful!"}
              {status === "error" && "Sign in failed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {status === "loading" && (
              <div className="space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-polkadot-pink" />
                <p className="text-muted-foreground">
                  Please wait while we complete your authentication...
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                <p className="text-green-600 font-medium">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to the hackathons page...
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <XCircle className="h-8 w-8 mx-auto text-red-500" />
                <p className="text-red-600 font-medium">{message}</p>
                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                  >
                    <Link href="/auth/login">Try Again</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">Go Home</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
