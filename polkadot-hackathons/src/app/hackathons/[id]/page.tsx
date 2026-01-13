"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Award,
  Globe,
  ExternalLink,
  Edit,
  Trash2,
  Star,
  Settings,
} from "lucide-react";
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
    description?: string;
  }>;
  rules: string;
  requirements: string;
  technologies: string[];
  website_url: string;
  discord_url: string;
  twitter_url: string;
  github_url: string;
  cover_image: string;
  tags: string[];
  organizer_id: string;
  status: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organizer: {
    name: string;
    email: string;
  };
}

export default function HackathonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hackathonId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        // Fetch hackathon first
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

        // Fetch organizer info separately
        const { data: organizerData, error: organizerError } = await supabase
          .from("users")
          .select("name, email")
          .eq("id", hackathonData.organizer_id)
          .single();

        // Combine the data
        const hackathon = {
          ...hackathonData,
          organizer: organizerError
            ? { name: null, email: null }
            : organizerData,
        };

        setHackathon(hackathon);
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

  const handleDelete = async () => {
    if (!hackathon || !user || user.id !== hackathon.organizer_id) return;

    if (
      !confirm(
        "Are you sure you want to delete this hackathon? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("hackathons")
        .delete()
        .eq("id", hackathon.id);

      if (error) {
        console.error("Error deleting hackathon:", error);
        toast.error("Failed to delete hackathon");
        return;
      }

      toast.success("Hackathon deleted successfully");
      router.push("/hackathons");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete hackathon");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "published":
        return "bg-blue-100 text-blue-800";
      case "registration_open":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "judging":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const isOrganizer = user?.id === hackathon.organizer_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="outline" size="sm">
              <Link href="/hackathons">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Hackathons
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {hackathon.title}
                </h1>
                <Badge className={getStatusColor(hackathon.status)}>
                  {hackathon.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {hackathon.short_description}
              </p>
            </div>
            {isOrganizer && (
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/hackathons/${hackathon.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 hover:text-red-700"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {hackathon.description}
                  </p>
                </CardContent>
              </Card>

              {/* Rules & Requirements */}
              {(hackathon.rules || hackathon.requirements) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Rules & Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hackathon.rules && (
                      <div>
                        <h4 className="font-medium mb-2">Rules & Guidelines</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {hackathon.rules}
                        </p>
                      </div>
                    )}
                    {hackathon.requirements && (
                      <div>
                        <h4 className="font-medium mb-2">Requirements</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {hackathon.requirements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Technologies */}
              {hackathon.technologies && hackathon.technologies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Technologies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {hackathon.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(hackathon.start_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(hackathon.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Registration Deadline
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(hackathon.registration_deadline)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {hackathon.is_online
                          ? "Online Event"
                          : hackathon.location || "TBD"}
                      </p>
                    </div>
                  </div>
                  {hackathon.max_participants && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Max Participants</p>
                        <p className="text-sm text-muted-foreground">
                          {hackathon.max_participants}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prizes */}
              {hackathon.prizes && hackathon.prizes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Prizes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hackathon.prizes.map((prize, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium">#{prize.rank} Place</p>
                          {prize.description && (
                            <p className="text-sm text-muted-foreground">
                              {prize.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sui-sea">
                            {prize.amount} {prize.currency}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Organizer */}
              <Card>
                <CardHeader>
                  <CardTitle>Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {hackathon.organizer?.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hackathon.organizer?.email}
                  </p>
                </CardContent>
              </Card>

              {/* Social Links */}
              {(hackathon.website_url ||
                hackathon.discord_url ||
                hackathon.twitter_url ||
                hackathon.github_url) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {hackathon.website_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <a
                          href={hackathon.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                    {hackathon.discord_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <a
                          href={hackathon.discord_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Discord
                        </a>
                      </Button>
                    )}
                    {hackathon.twitter_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <a
                          href={hackathon.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Twitter
                        </a>
                      </Button>
                    )}
                    {hackathon.github_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <a
                          href={hackathon.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full bg-sui-sea hover:bg-sui-sea/90"
                    disabled={
                      hackathon.status === "draft" ||
                      hackathon.status === "completed"
                    }
                  >
                    {hackathon.status === "draft"
                      ? "Registration Not Open"
                      : hackathon.status === "completed"
                      ? "Hackathon Ended"
                      : "Register for Hackathon"}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    disabled={
                      hackathon.status === "draft" ||
                      hackathon.status === "completed"
                    }
                  >
                    <Link href={`/hackathons/${hackathon.id}/teams/create`}>
                      Create Team
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    disabled={
                      hackathon.status === "draft" ||
                      hackathon.status === "completed"
                    }
                  >
                    <Link href={`/hackathons/${hackathon.id}/teams`}>
                      Browse Teams
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Organizer Actions */}
              {user && user.id === hackathon.organizer_id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Organizer Actions
                    </CardTitle>
                    <CardDescription>
                      Manage your hackathon settings and participants
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        asChild
                        variant="outline"
                        className="h-auto p-4 text-left"
                      >
                        <Link href={`/hackathons/${hackathon.id}/edit`}>
                          <div className="flex items-start gap-3 w-full">
                            <Edit className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">Edit Hackathon</div>
                              <div className="text-xs text-muted-foreground">
                                Update details and settings
                              </div>
                            </div>
                          </div>
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="h-auto p-4 text-left"
                      >
                        <Link href={`/hackathons/${hackathon.id}/judges`}>
                          <div className="flex items-start gap-3 w-full">
                            <Users className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">Manage Judges</div>
                              <div className="text-xs text-muted-foreground">
                                Assign and manage judges
                              </div>
                            </div>
                          </div>
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="h-auto p-4 text-left"
                      >
                        <Link href={`/hackathons/${hackathon.id}/teams`}>
                          <div className="flex items-start gap-3 w-full">
                            <Users className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">View Teams</div>
                              <div className="text-xs text-muted-foreground">
                                See all participating teams
                              </div>
                            </div>
                          </div>
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="h-auto p-4 text-left"
                      >
                        <div className="flex items-start gap-3 w-full">
                          {deleting ? (
                            <Loader2 className="h-5 w-5 flex-shrink-0 mt-0.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">Delete Hackathon</div>
                            <div className="text-xs text-muted-foreground">
                              Permanently remove this hackathon
                            </div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Judge Access */}
              {user && hackathon.status === "judging" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Judge Access</h3>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/hackathons/${hackathon.id}/judge`}>
                      <Star className="h-4 w-4 mr-2" />
                      Access Judging Panel
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
