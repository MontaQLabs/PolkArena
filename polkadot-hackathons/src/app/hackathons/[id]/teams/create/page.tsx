"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, Users, Plus } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Hackathon {
  id: string;
  title: string;
  status: string;
}

export default function CreateTeamPage() {
  const params = useParams();
  const router = useRouter();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
  });

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
          toast.error("Please sign in to create a team");
          router.push("/auth/signin");
          return;
        }

        // Fetch hackathon
        const { data: hackathonData, error: hackathonError } = await supabase
          .from("hackathons")
          .select("id, title, status")
          .eq("id", hackathonId)
          .single();

        if (hackathonError) {
          console.error("Error fetching hackathon:", hackathonError);
          toast.error("Failed to load hackathon");
          router.push("/hackathons");
          return;
        }

        setHackathon(hackathonData);

        // Check if user is already in a team for this hackathon
        const { data: existingMembership } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .in(
            "team_id",
            (
              await supabase
                .from("teams")
                .select("id")
                .eq("hackathon_id", hackathonId)
            ).data?.map((t) => t.id) || []
          );

        if (existingMembership && existingMembership.length > 0) {
          toast.error("You are already a member of a team in this hackathon");
          router.push(`/hackathons/${hackathonId}/teams`);
          return;
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load hackathon");
        router.push("/hackathons");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !hackathon) return;

    if (!formData.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setCreating(true);
    try {
      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          slug:
            formData.slug.trim() ||
            formData.name.toLowerCase().replace(/\s+/g, "-"),
          hackathon_id: hackathon.id,
        })
        .select()
        .single();

      if (teamError) {
        console.error("Error creating team:", teamError);
        toast.error("Failed to create team");
        return;
      }

      // Add user as team leader
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: teamData.id,
          user_id: user.id,
          role: "leader",
        });

      if (memberError) {
        console.error("Error adding team member:", memberError);
        toast.error("Team created but failed to add you as leader");
        return;
      }

      toast.success("Team created successfully!");
      router.push(`/hackathons/${hackathon.id}/teams`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-polkadot-pink" />
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="outline" size="sm">
              <Link href={`/hackathons/${hackathon.id}/teams`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teams
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                Create Team
              </h1>
              <p className="text-muted-foreground">
                Create a new team for {hackathon.title}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Information
              </CardTitle>
              <CardDescription>
                Fill in the details below to create your team. You will be
                automatically added as the team leader.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter team name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your team's goals, skills, or what you're looking for in teammates"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Team Slug (Optional)</Label>
                  <Input
                    id="slug"
                    placeholder="team-name"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique identifier for your team. If left empty, it will be
                    generated from the team name.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={creating || !formData.name.trim()}
                    className="bg-polkadot-pink hover:bg-polkadot-pink/90"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Team
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(`/hackathons/${hackathon.id}/teams`)
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
