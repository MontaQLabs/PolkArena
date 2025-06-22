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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  Github,
  ExternalLink,
  Save,
  Edit,
} from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Team {
  id: string;
  name: string;
  description: string;
  hackathon_id: string;
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  hackathon: {
    title: string;
    status: string;
    end_date: string;
  };
  submission?: {
    id: string;
    github_link: string;
    demo_link: string;
    tech_stack: string[];
    description: string;
    submitted_at: string;
  };
}

export default function TeamSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [formData, setFormData] = useState({
    github_link: "",
    demo_link: "",
    tech_stack: "",
    description: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          toast.error("Please sign in to access team submissions");
          router.push("/auth/signin");
          return;
        }

        // Fetch team with members, hackathon, and submission
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select(
            `
            *,
            members:team_members(
              id,
              user_id,
              role,
              user:users(name, email)
            ),
            hackathon:hackathons(title, status, end_date),
            submission:submissions(*)
          `
          )
          .eq("id", teamId)
          .single();

        if (teamError) {
          console.error("Error fetching team:", teamError);
          toast.error("Failed to load team");
          router.push("/hackathons");
          return;
        }

        setTeam(teamData);

        // Check if user is team member
        const isMember = teamData.members.some(
          (member: { user_id: string }) => member.user_id === user.id
        );
        setIsTeamMember(isMember);

        // Load existing submission data
        if (teamData.submission) {
          setFormData({
            github_link: teamData.submission.github_link || "",
            demo_link: teamData.submission.demo_link || "",
            tech_stack: teamData.submission.tech_stack?.join(", ") || "",
            description: teamData.submission.description || "",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load team");
        router.push("/hackathons");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !team) return;

    if (!formData.github_link.trim()) {
      toast.error("GitHub repository link is required");
      return;
    }

    setSaving(true);
    try {
      const techStackArray = formData.tech_stack
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech.length > 0);

      if (team.submission) {
        // Update existing submission
        const { error } = await supabase
          .from("submissions")
          .update({
            github_link: formData.github_link.trim(),
            demo_link: formData.demo_link.trim() || null,
            tech_stack: techStackArray,
            description: formData.description.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("team_id", team.id);

        if (error) {
          console.error("Error updating submission:", error);
          toast.error("Failed to update submission");
          return;
        }
      } else {
        // Create new submission
        const { error } = await supabase.from("submissions").insert({
          team_id: team.id,
          github_link: formData.github_link.trim(),
          demo_link: formData.demo_link.trim() || null,
          tech_stack: techStackArray,
          description: formData.description.trim() || null,
        });

        if (error) {
          console.error("Error creating submission:", error);
          toast.error("Failed to create submission");
          return;
        }
      }

      toast.success("Submission saved successfully!");

      // Refresh team data
      const { data: updatedTeam } = await supabase
        .from("teams")
        .select(
          `
          *,
          members:team_members(
            id,
            user_id,
            role,
            user:users(name, email)
          ),
          hackathon:hackathons(title, status, end_date),
          submission:submissions(*)
        `
        )
        .eq("id", team.id)
        .single();

      setTeam(updatedTeam);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save submission");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = () => {
    if (!team) return false;
    return (
      team.hackathon.status === "in_progress" ||
      team.hackathon.status === "judging"
    );
  };

  const isSubmissionDeadline = () => {
    if (!team) return false;
    return new Date() > new Date(team.hackathon.end_date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-polkadot-pink" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Team Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The team you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/hackathons">Back to Hackathons</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isTeamMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-4">
            You are not a member of this team.
          </p>
          <Button asChild>
            <Link href={`/hackathons/${team.hackathon_id}/teams`}>
              Back to Teams
            </Link>
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
                <Link href={`/hackathons/${team.hackathon_id}/teams`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Teams
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Project Submission
              </h1>
              <p className="text-muted-foreground">
                Submit your project for {team.hackathon.title}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Submission Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    Project Submission
                  </CardTitle>
                  <CardDescription>
                    Submit your hackathon project with GitHub repository, demo
                    link, and description
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!canSubmit() ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        {team.hackathon.status === "draft" &&
                          "This hackathon is still in draft mode."}
                        {team.hackathon.status === "published" &&
                          "This hackathon is published but not yet started."}
                        {team.hackathon.status === "registration_open" &&
                          "This hackathon is open for registration but not yet started."}
                        {team.hackathon.status === "completed" &&
                          "This hackathon has ended."}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submissions are only allowed during the hackathon
                        period.
                      </p>
                    </div>
                  ) : isSubmissionDeadline() ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-4">
                        Submission deadline has passed
                      </p>
                      <p className="text-sm text-muted-foreground">
                        The hackathon ended on{" "}
                        {new Date(team.hackathon.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="github_link">
                          GitHub Repository Link *
                        </Label>
                        <Input
                          id="github_link"
                          type="url"
                          placeholder="https://github.com/username/repository"
                          value={formData.github_link}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              github_link: e.target.value,
                            }))
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Link to your project&apos;s GitHub repository
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="demo_link">Demo Link (Optional)</Label>
                        <Input
                          id="demo_link"
                          type="url"
                          placeholder="https://your-demo-url.com"
                          value={formData.demo_link}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              demo_link: e.target.value,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Link to a live demo of your project
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tech_stack">
                          Tech Stack (comma-separated)
                        </Label>
                        <Input
                          id="tech_stack"
                          placeholder="React, TypeScript, Solidity, Polkadot"
                          value={formData.tech_stack}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              tech_stack: e.target.value,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Technologies and frameworks used in your project
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Project Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your project, what it does, how it works, and what makes it unique..."
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Provide a detailed description of your project for
                          judges
                        </p>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button
                          type="submit"
                          disabled={saving}
                          className="bg-polkadot-pink hover:bg-polkadot-pink/90"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : team.submission ? (
                            <Save className="h-4 w-4 mr-2" />
                          ) : (
                            <Edit className="h-4 w-4 mr-2" />
                          )}
                          {team.submission
                            ? "Update Submission"
                            : "Submit Project"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Team Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {team.hackathon.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {team.description || "No description available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Team Members ({team.members.length})
                    </p>
                    <div className="mt-2 space-y-1">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {member.user?.name ||
                              member.user?.email ||
                              "Unknown"}
                          </span>
                          {member.role === "leader" && (
                            <span className="text-xs bg-polkadot-pink text-white px-1 rounded">
                              Leader
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Status */}
              {team.submission && (
                <Card>
                  <CardHeader>
                    <CardTitle>Submission Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Submitted</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Submitted on{" "}
                      {new Date(
                        team.submission.submitted_at
                      ).toLocaleDateString()}
                    </div>
                    {team.submission.github_link && (
                      <a
                        href={team.submission.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Github className="h-4 w-4" />
                        <span>View Repository</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {team.submission.demo_link && (
                      <a
                        href={team.submission.demo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View Demo</span>
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
