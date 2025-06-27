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
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Event {
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
  event_type: string;
  technologies: string[];
  organizer_id: string;
  status: string;
  organizer: {
    name: string;
    email: string;
  };
}

export default function RegisterEventPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          toast.error("Please sign in to register for an event");
          router.push("/auth/signin");
          return;
        }

        // Fetch event
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select(
            `
            *,
            organizer:users(name, email)
          `
          )
          .eq("id", eventId)
          .single();

        if (eventError) {
          console.error("Error fetching event:", eventError);
          toast.error("Failed to load event");
          router.push("/events");
          return;
        }

        setEvent(eventData);

        // Check if user is already registered
        const { data: registration } = await supabase
          .from("event_registrations")
          .select("id")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .single();

        setIsRegistered(!!registration);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load event");
        router.push("/events");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !event) return;

    setRegistering(true);
    try {
      // Register for event
      const { error } = await supabase.from("event_registrations").insert({
        event_id: event.id,
        user_id: user.id,
        motivation: motivation.trim() || null,
        status: "registered",
      });

      if (error) {
        console.error("Error registering for event:", error);
        toast.error("Failed to register for event");
        return;
      }

      toast.success("Successfully registered for the event!");
      setIsRegistered(true);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to register for event");
    } finally {
      setRegistering(false);
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
      case "upcoming":
        return "bg-purple-100 text-purple-800";
      case "live":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-polkadot-pink" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Event Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The event you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if registration is allowed
  const canRegister =
    event.status === "registration_open" ||
    event.status === "upcoming" ||
    event.status === "live";
  const isPastDeadline = new Date() > new Date(event.registration_deadline);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${event.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Register for {event.title}
                </h1>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    event.status
                  )}`}
                >
                  {event.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <p className="text-muted-foreground">
                {event.short_description}
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
                      You are already registered for this event. We&apos;ll send you
                      updates and details as the event approaches.
                    </p>
                    <Button
                      asChild
                      className="bg-polkadot-pink hover:bg-polkadot-pink/90"
                    >
                      <Link href={`/events/${event.id}`}>
                        View Event Details
                      </Link>
                    </Button>
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
                      {event.status === "draft" &&
                        "This event is still in draft mode and not open for registration yet."}
                      {event.status === "completed" &&
                        "This event has already ended."}
                      {isPastDeadline &&
                        "The registration deadline has passed."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Register for Event</CardTitle>
                    <CardDescription>
                      Join this exciting event and connect with the Polkadot
                      ecosystem community.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="motivation">
                          Why do you want to attend this event? (Optional)
                        </Label>
                        <Textarea
                          id="motivation"
                          placeholder="Tell us about your interests, what you hope to learn, or how this event aligns with your goals..."
                          value={motivation}
                          onChange={(e) => setMotivation(e.target.value)}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          This helps organizers understand attendee interests
                          and may help with networking.
                        </p>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button
                          type="submit"
                          disabled={registering}
                          className="bg-polkadot-pink hover:bg-polkadot-pink/90"
                        >
                          {registering ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Register for Event
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            router.push(`/events/${event.id}`)
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                </CardContent>
              </Card>
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
                        {formatDate(event.start_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.end_date)}
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
                        {formatDate(event.registration_deadline)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {event.is_online
                          ? "Online Event"
                          : event.location || "TBD"}
                      </p>
                    </div>
                  </div>
                  {event.max_participants && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Max Participants</p>
                        <p className="text-sm text-muted-foreground">
                          {event.max_participants}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Technologies */}
              {event.technologies && event.technologies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Technologies & Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {event.technologies.map((tech, index) => (
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