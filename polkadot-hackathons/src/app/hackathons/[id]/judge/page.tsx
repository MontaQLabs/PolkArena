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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Github,
  ExternalLink,
  Star,
  Save,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Submission {
  id: string;
  team_id: string;
  github_link: string;
  demo_link: string;
  tech_stack: string[];
  description: string;
  submitted_at: string;
  team: {
    name: string;
    description: string;
    members: Array<{
      user: {
        name: string;
        email: string;
      };
    }>;
  };
  scores?: Array<{
    id: string;
    score: number;
    comment: string;
    scored_at: string;
  }>;
}

interface Hackathon {
  id: string;
  title: string;
  status: string;
  end_date: string;
}

export default function JudgePage() {
  const params = useParams();
  const router = useRouter();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [scoreForm, setScoreForm] = useState({
    score: "",
    comment: "",
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
          toast.error("Please sign in to access judging interface");
          router.push("/auth/signin");
          return;
        }

        // Fetch hackathon
        const { data: hackathonData, error: hackathonError } = await supabase
          .from("hackathons")
          .select("id, title, status, end_date")
          .eq("id", hackathonId)
          .single();

        if (hackathonError) {
          console.error("Error fetching hackathon:", hackathonError);
          toast.error("Failed to load hackathon");
          router.push("/hackathons");
          return;
        }

        setHackathon(hackathonData);

        // Check if user is a judge for this hackathon
        const { data: judgeData } = await supabase
          .from("judges")
          .select("id")
          .eq("hackathon_id", hackathonId)
          .eq("user_id", user.id)
          .single();

        setIsJudge(!!judgeData);

        if (!judgeData) {
          toast.error("You are not assigned as a judge for this hackathon");
          router.push(`/hackathons/${hackathonId}`);
          return;
        }

        // Fetch submissions with team info and existing scores
        const { data: submissionsData, error: submissionsError } =
          await supabase
            .from("submissions")
            .select(
              `
            *,
            team:teams(
              name,
              description,
              members:team_members(
                user:users(name, email)
              )
            ),
            scores:scores(
              id,
              score,
              comment,
              scored_at
            )
          `
            )
            .eq("team.hackathon_id", hackathonId)
            .order("submitted_at", { ascending: false });

        if (submissionsError) {
          console.error("Error fetching submissions:", submissionsError);
          toast.error("Failed to load submissions");
          return;
        }

        setSubmissions(submissionsData || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load judging data");
        router.push("/hackathons");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedSubmission || !hackathon) return;

    const score = parseInt(scoreForm.score);
    if (isNaN(score) || score < 1 || score > 10) {
      toast.error("Score must be between 1 and 10");
      return;
    }

    setSaving(true);
    try {
      // Get judge ID
      const { data: judgeData } = await supabase
        .from("judges")
        .select("id")
        .eq("hackathon_id", hackathon.id)
        .eq("user_id", user.id)
        .single();

      if (!judgeData) {
        toast.error("Judge assignment not found");
        return;
      }

      // Check if score already exists
      const existingScore = selectedSubmission.scores?.find(
        (s) => s.id === judgeData.id
      );

      if (existingScore) {
        // Update existing score
        const { error } = await supabase
          .from("scores")
          .update({
            score: score,
            comment: scoreForm.comment.trim() || null,
            scored_at: new Date().toISOString(),
          })
          .eq("team_id", selectedSubmission.team_id)
          .eq("judge_id", judgeData.id);

        if (error) {
          console.error("Error updating score:", error);
          toast.error("Failed to update score");
          return;
        }
      } else {
        // Create new score
        const { error } = await supabase.from("scores").insert({
          team_id: selectedSubmission.team_id,
          judge_id: judgeData.id,
          score: score,
          comment: scoreForm.comment.trim() || null,
        });

        if (error) {
          console.error("Error creating score:", error);
          toast.error("Failed to create score");
          return;
        }
      }

      toast.success("Score submitted successfully!");
      setScoreForm({ score: "", comment: "" });
      setSelectedSubmission(null);

      // Refresh submissions data
      const { data: updatedSubmissions } = await supabase
        .from("submissions")
        .select(
          `
          *,
          team:teams(
            name,
            description,
            members:team_members(
              user:users(name, email)
            )
          ),
          scores:scores(
            id,
            score,
            comment,
            scored_at
          )
        `
        )
        .eq("team.hackathon_id", hackathon.id)
        .order("submitted_at", { ascending: false });

      setSubmissions(updatedSubmissions || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit score");
    } finally {
      setSaving(false);
    }
  };

  const getAverageScore = (submission: Submission) => {
    if (!submission.scores || submission.scores.length === 0) return null;
    const total = submission.scores.reduce(
      (sum, score) => sum + score.score,
      0
    );
    return (total / submission.scores.length).toFixed(1);
  };

  const hasUserScored = (submission: Submission) => {
    if (!user || !submission.scores) return false;
    return submission.scores.some((score) => score.id === user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sui-sea" />
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

  if (!isJudge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-4">
            You are not assigned as a judge for this hackathon.
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
        <div className="max-w-6xl mx-auto">
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
                Judging Panel
              </h1>
              <p className="text-muted-foreground">
                Review and score submissions for {hackathon.title}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Submissions List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Submissions ({submissions.length})</CardTitle>
                  <CardDescription>
                    Click on a submission to review and score
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submissions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No submissions yet
                    </p>
                  ) : (
                    submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedSubmission?.id === submission.id
                            ? "border-sui-sea bg-sui-sea/5"
                            : "border-border hover:border-sui-sea/50"
                        }`}
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {submission.team.name}
                          </h4>
                          {hasUserScored(submission) && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {submission.team.members.length} member
                          {submission.team.members.length !== 1 ? "s" : ""}
                        </p>
                        {getAverageScore(submission) && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">
                              {getAverageScore(submission)}/10
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Submission Review */}
            <div className="lg:col-span-2">
              {selectedSubmission ? (
                <div className="space-y-6">
                  {/* Submission Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedSubmission.team.name}</CardTitle>
                      <CardDescription>
                        Submitted on{" "}
                        {new Date(
                          selectedSubmission.submitted_at
                        ).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-2">
                          Project Description
                        </h4>
                        <p className="text-muted-foreground">
                          {selectedSubmission.description ||
                            "No description provided"}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Tech Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedSubmission.tech_stack.map((tech, index) => (
                            <Badge key={index} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedSubmission.github_link && (
                          <a
                            href={selectedSubmission.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                          >
                            <Github className="h-5 w-5" />
                            <span>View Repository</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {selectedSubmission.demo_link && (
                          <a
                            href={selectedSubmission.demo_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                          >
                            <ExternalLink className="h-5 w-5" />
                            <span>View Demo</span>
                          </a>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Team Members</h4>
                        <div className="space-y-1">
                          {selectedSubmission.team.members.map(
                            (member, index) => (
                              <div
                                key={index}
                                className="text-sm text-muted-foreground"
                              >
                                {member.user?.name ||
                                  member.user?.email ||
                                  "Unknown"}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scoring Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Score This Submission</CardTitle>
                      <CardDescription>
                        Rate the project from 1-10 and provide feedback
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleScoreSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="score">Score (1-10) *</Label>
                          <Input
                            id="score"
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Enter score from 1 to 10"
                            value={scoreForm.score}
                            onChange={(e) =>
                              setScoreForm((prev) => ({
                                ...prev,
                                score: e.target.value,
                              }))
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            1 = Poor, 5 = Average, 10 = Excellent
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="comment">Feedback (Optional)</Label>
                          <Textarea
                            id="comment"
                            placeholder="Provide constructive feedback about the project..."
                            value={scoreForm.comment}
                            onChange={(e) =>
                              setScoreForm((prev) => ({
                                ...prev,
                                comment: e.target.value,
                              }))
                            }
                            rows={4}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={saving}
                          className="bg-sui-sea hover:bg-sui-sea/90"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Submit Score
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Select a Submission
                    </h3>
                    <p className="text-muted-foreground">
                      Choose a submission from the list to review and score
                    </p>
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
