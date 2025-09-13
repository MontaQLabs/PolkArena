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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Award,
  CheckCircle,
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
  organizer_id: string;
  status: string;
  organizer: {
    name: string;
    email: string;
  };
}

export default function JoinHackathonPage() {
  const params = useParams();
  const router = useRouter();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

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
          toast.error("Please sign in to join a hackathon");
          router.push("/auth/signin");
          return;
        }

        // Fetch hackathon
        const { data: hackathonData, error: hackathonError } = await supabase
          .from("hackathons")
          .select(
            `
            *,
            organizer:users(name, email)
          `
          )
          .eq("id", hackathonId)
          .single();

        if (hackathonError) {
          console.error("Error fetching hackathon:", hackathonError);
          toast.error("Failed to load hackathon");
          router.push("/hackathons");
          return;
        }

        setHackathon(hackathonData);

        // Check if user is already registered
        const { data: registration } = await supabase
          .from("hackathon_registrations")
          .select("id")
          .eq("hackathon_id", hackathonId)
          .eq("user_id", user.id)
          .single();

        setIsRegistered(!!registration);
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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !hackathon) return;

    setJoining(true);
    try {
      // Register for hackathon
      const { error } = await supabase.from("hackathon_registrations").insert({
        hackathon_id: hackathon.id,
        user_id: user.id,
        motivation: motivation.trim() || null,
        status: "registered",
      });

      if (error) {
        console.error("Error registering for hackathon:", error);
        toast.error("Failed to register for hackathon");
        return;
      }

      toast.success("Successfully registered for the hackathon!");
      setIsRegistered(true);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to register for hackathon");
    } finally {
      setJoining(false);
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

  // Check if registration is allowed
  const canRegister =
    hackathon.status === "registration_open" ||
    hackathon.status === "in_progress";
  const isPastDeadline = new Date() > new Date(hackathon.registration_deadline);

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
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Join {hackathon.title}
                </h1>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    hackathon.status
                  )}`}
                >
                  {hackathon.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <p className="text-muted-foreground">
                {hackathon.short_description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Registration Form */}
              {isRegistered ? (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      Already Registered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-700 mb-4">
                      You are already registered for this hackathon. You can now
                      create or join a team to start building!
                    </p>
                    <div className="flex gap-2">
                      <Button
                        asChild
                        className="bg-crucible-orange hover:bg-crucible-orange/90"
                      >
                        <Link href={`/hackathons/${hackathon.id}/teams/create`}>
                          Create Team
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/hackathons/${hackathon.id}/teams`}>
                          Browse Teams
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : !canRegister ? (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800">
                      Registration Not Available
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700">
                      {hackathon.status === "draft" &&
                        "This hackathon is still in draft mode and not open for registration yet."}
                      {hackathon.status === "completed" &&
                        "This hackathon has already ended."}
                      {isPastDeadline &&
                        "The registration deadline has passed."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Register for Hackathon</CardTitle>
                    <CardDescription>
                      Join this exciting hackathon and start building amazing
                      projects with the Polkadot ecosystem.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleJoin} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="motivation">
                          Why do you want to join this hackathon? (Optional)
                        </Label>
                        <Textarea
                          id="motivation"
                          placeholder="Tell us about your motivation, skills, or what you hope to learn..."
                          value={motivation}
                          onChange={(e) => setMotivation(e.target.value)}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          This helps organizers understand your interests and
                          may help with team matching.
                        </p>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button
                          type="submit"
                          disabled={joining}
                          className="bg-crucible-orange hover:bg-crucible-orange/90"
                        >
                          {joining ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Join Hackathon
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            router.push(`/hackathons/${hackathon.id}`)
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Hackathon Details */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Hackathon</CardTitle>
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
                          <p className="font-bold text-crucible-orange">
                            {prize.amount} {prize.currency}
                          </p>
                        </div>
                      </div>
                    ))}
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
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted rounded text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
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
