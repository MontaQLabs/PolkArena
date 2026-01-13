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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Save, Globe } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Hackathon {
  id: string;
  title: string;
  description: string;
  short_description: string;
  location: string;
  is_online: boolean;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: number | null;
  prizes: Array<{
    rank: number;
    amount: number;
    currency: string;
    description: string;
  }>;
  rules: string;
  requirements: string;
  technologies: string[];
  website_url: string;
  discord_url: string;
  twitter_url: string;
  github_url: string;
  organizer_id: string;
  status: string;
}

export default function EditHackathonPage() {
  const params = useParams();
  const router = useRouter();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    short_description: "",
    location: "",
    is_online: false,
    start_date: "",
    end_date: "",
    registration_deadline: "",
    max_participants: "",
    rules: "",
    requirements: "",
    technologies: "",
    website_url: "",
    discord_url: "",
    twitter_url: "",
    github_url: "",
    status: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hackathonId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setUser(user);

        // Fetch hackathon
        const { data: hackathonData, error: hackathonError } = await supabase
          .from("hackathons")
          .select("*")
          .eq("id", hackathonId)
          .single();

        if (hackathonError) {
          console.error("Error fetching hackathon:", hackathonError);
          toast.error("Failed to load hackathon");
          router.push("/hackathons");
          return;
        }

        // Check if user is the organizer
        if (hackathonData.organizer_id !== user.id) {
          toast.error("You can only edit hackathons you created");
          router.push(`/hackathons/${hackathonId}`);
          return;
        }

        setHackathon(hackathonData);
        setFormData({
          title: hackathonData.title,
          description: hackathonData.description,
          short_description: hackathonData.short_description || "",
          location: hackathonData.location || "",
          is_online: hackathonData.is_online,
          start_date: hackathonData.start_date,
          end_date: hackathonData.end_date,
          registration_deadline: hackathonData.registration_deadline,
          max_participants: hackathonData.max_participants?.toString() || "",
          rules: hackathonData.rules || "",
          requirements: hackathonData.requirements || "",
          technologies: hackathonData.technologies
            ? hackathonData.technologies.join(", ")
            : "",
          website_url: hackathonData.website_url || "",
          discord_url: hackathonData.discord_url || "",
          twitter_url: hackathonData.twitter_url || "",
          github_url: hackathonData.github_url || "",
          status: hackathonData.status,
        });
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

    setSaving(true);
    try {
      if (
        !formData.title ||
        !formData.description ||
        !formData.start_date ||
        !formData.end_date
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const registrationDeadline = new Date(formData.registration_deadline);

      if (endDate <= startDate) {
        toast.error("End date must be after start date");
        return;
      }

      if (registrationDeadline >= startDate) {
        toast.error("Registration deadline must be before start date");
        return;
      }

      const technologiesArray = formData.technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech.length > 0);

      const { error } = await supabase
        .from("hackathons")
        .update({
          title: formData.title,
          description: formData.description,
          short_description: formData.short_description,
          location: formData.location,
          is_online: formData.is_online,
          start_date: formData.start_date,
          end_date: formData.end_date,
          registration_deadline: formData.registration_deadline,
          max_participants: formData.max_participants
            ? parseInt(formData.max_participants)
            : null,
          rules: formData.rules,
          requirements: formData.requirements,
          technologies: technologiesArray.length > 0 ? technologiesArray : null,
          website_url: formData.website_url || null,
          discord_url: formData.discord_url || null,
          twitter_url: formData.twitter_url || null,
          github_url: formData.github_url || null,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", hackathon.id);

      if (error) {
        console.error("Error updating hackathon:", error);
        toast.error("Failed to update hackathon");
        return;
      }

      toast.success("Hackathon updated successfully!");
      router.push(`/hackathons/${hackathon.id}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update hackathon");
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="outline" size="sm">
              <Link href={`/hackathons/${hackathon.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Hackathon
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Edit Hackathon
              </h1>
              <p className="text-muted-foreground">
                Update your hackathon details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Hackathon Status</CardTitle>
                <CardDescription>
                  Change the status to control registration and visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (Private)</SelectItem>
                      <SelectItem value="published">
                        Published (Public)
                      </SelectItem>
                      <SelectItem value="registration_open">
                        Registration Open
                      </SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="judging">Judging</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {formData.status === "draft" &&
                      "Draft: Only you can see this hackathon"}
                    {formData.status === "published" &&
                      "Published: Public but registration not open yet"}
                    {formData.status === "registration_open" &&
                      "Registration Open: Users can register and create teams"}
                    {formData.status === "in_progress" &&
                      "In Progress: Hackathon is currently running"}
                    {formData.status === "judging" &&
                      "Judging: Projects are being evaluated"}
                    {formData.status === "completed" &&
                      "Completed: Hackathon has ended"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Hackathon Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description *</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        short_description: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      disabled={formData.is_online}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select
                      value={formData.is_online ? "online" : "offline"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          is_online: value === "online",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="offline">In-Person</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_deadline">
                      Registration Deadline *
                    </Label>
                    <Input
                      id="registration_deadline"
                      type="datetime-local"
                      value={formData.registration_deadline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registration_deadline: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">Maximum Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_participants: e.target.value,
                      })
                    }
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rules & Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Rules & Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="rules">Rules & Guidelines</Label>
                  <Textarea
                    id="rules"
                    value={formData.rules}
                    onChange={(e) =>
                      setFormData({ ...formData, rules: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technologies">
                    Technologies (comma-separated)
                  </Label>
                  <Input
                    id="technologies"
                    value={formData.technologies}
                    onChange={(e) =>
                      setFormData({ ...formData, technologies: e.target.value })
                    }
                    placeholder="e.g., Polkadot, Substrate, React, Rust"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          website_url: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discord_url">Discord</Label>
                    <Input
                      id="discord_url"
                      type="url"
                      value={formData.discord_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discord_url: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter</Label>
                    <Input
                      id="twitter_url"
                      type="url"
                      value={formData.twitter_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          twitter_url: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github_url">GitHub</Label>
                    <Input
                      id="github_url"
                      type="url"
                      value={formData.github_url}
                      onChange={(e) =>
                        setFormData({ ...formData, github_url: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button asChild variant="outline">
                <Link href={`/hackathons/${hackathon.id}`}>Cancel</Link>
              </Button>
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
                Update Hackathon
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
