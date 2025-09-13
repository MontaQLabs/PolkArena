"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, UserPlus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Hackathon {
  id: string;
  title: string;
  organizer_id: string;
  status: string;
}

interface Judge {
  id: string;
  user_id: string;
  assigned_at: string;
  user: {
    name: string;
    email: string;
  };
}

export default function JudgesPage() {
  const params = useParams();
  const router = useRouter();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [addingJudge, setAddingJudge] = useState(false);
  const [judgeEmail, setJudgeEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hackathonId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          toast.error("Please sign in to access judge management");
          router.push("/auth/signin");
          return;
        }

        // Fetch hackathon
        const { data: hackathonData, error: hackathonError } = await supabase
          .from("hackathons")
          .select("id, title, organizer_id, status")
          .eq("id", hackathonId)
          .single();

        if (hackathonError) {
          console.error("Error fetching hackathon:", hackathonError);
          toast.error("Failed to load hackathon");
          router.push("/hackathons");
          return;
        }

        setHackathon(hackathonData);

        // Check if user is organizer
        setIsOrganizer(user.id === hackathonData.organizer_id);

        if (user.id !== hackathonData.organizer_id) {
          toast.error("Only the hackathon organizer can manage judges");
          router.push(`/hackathons/${hackathonId}`);
          return;
        }

        // Fetch judges
        const { data: judgesData, error: judgesError } = await supabase
          .from("judges")
          .select(
            `
            *,
            user:users(name, email)
          `
          )
          .eq("hackathon_id", hackathonId)
          .order("assigned_at", { ascending: false });

        if (judgesError) {
          console.error("Error fetching judges:", judgesError);
          toast.error("Failed to load judges");
          return;
        }

        setJudges(judgesData || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load judge data");
        router.push("/hackathons");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !hackathon) return;

    if (!judgeEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    setAddingJudge(true);
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", judgeEmail.trim().toLowerCase())
        .single();

      if (userError || !userData) {
        toast.error("User not found. Please make sure they have an account.");
        return;
      }

      // Check if already a judge
      const { data: existingJudge } = await supabase
        .from("judges")
        .select("id")
        .eq("hackathon_id", hackathon.id)
        .eq("user_id", userData.id)
        .single();

      if (existingJudge) {
        toast.error("This user is already a judge for this hackathon");
        return;
      }

      // Add judge
      const { error } = await supabase.from("judges").insert({
        hackathon_id: hackathon.id,
        user_id: userData.id,
      });

      if (error) {
        console.error("Error adding judge:", error);
        toast.error("Failed to add judge");
        return;
      }

      toast.success("Judge added successfully!");
      setJudgeEmail("");

      // Refresh judges list
      const { data: updatedJudges } = await supabase
        .from("judges")
        .select(
          `
          *,
          user:users(name, email)
        `
        )
        .eq("hackathon_id", hackathon.id)
        .order("assigned_at", { ascending: false });

      setJudges(updatedJudges || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to add judge");
    } finally {
      setAddingJudge(false);
    }
  };

  const handleRemoveJudge = async (judgeId: string) => {
    try {
      const { error } = await supabase
        .from("judges")
        .delete()
        .eq("id", judgeId);

      if (error) {
        console.error("Error removing judge:", error);
        toast.error("Failed to remove judge");
        return;
      }

      toast.success("Judge removed successfully");
      setJudges((prev) => prev.filter((judge) => judge.id !== judgeId));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to remove judge");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-crucible-orange" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Hackathon Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The hackathon you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/hackathons">Back to Hackathons</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-4">
            Only the hackathon organizer can manage judges.
          </p>
          <Button asChild>
            <Link href={`/hackathons/${hackathon.id}`}>Back to Hackathon</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm">
                <Link href={`/hackathons/${hackathon.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Hackathon
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Manage Judges
              </h1>
              <p className="text-muted-foreground">
                Assign judges for {hackathon.title}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Judge Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add Judge
                  </CardTitle>
                  <CardDescription>
                    Add a judge by entering their email address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddJudge} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="judgeEmail">Judge Email</Label>
                      <Input
                        id="judgeEmail"
                        type="email"
                        placeholder="judge@example.com"
                        value={judgeEmail}
                        onChange={(e) => setJudgeEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        The user must have an account on this platform
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={addingJudge || !judgeEmail.trim()}
                      className="w-full bg-crucible-orange hover:bg-crucible-orange/90"
                    >
                      {addingJudge ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Add Judge
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Judges List */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Assigned Judges ({judges.length})
                  </CardTitle>
                  <CardDescription>
                    Judges who can review and score submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {judges.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No judges assigned yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {judges.map((judge) => (
                        <div
                          key={judge.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {judge.user?.name || "Unknown User"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {judge.user?.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Added{" "}
                              {new Date(judge.assigned_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveJudge(judge.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Judge Access Link */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Judge Access</CardTitle>
                <CardDescription>
                  Share this link with your judges to access the judging
                  interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/hackathons/${hackathon.id}/judge`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/hackathons/${hackathon.id}/judge`
                      );
                      toast.success("Link copied to clipboard");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
