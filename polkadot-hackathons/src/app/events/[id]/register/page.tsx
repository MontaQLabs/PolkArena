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
  Clock,
  X,
} from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Event {
  id: string;
  name: string; // Changed from title
  description: string;
  location: string | null;
  is_online: boolean;
  start_time: string; // Changed from start_date
  end_time: string; // Changed from end_date
  registration_deadline: string | null;
  participant_limit: number | null; // Changed from max_participants
  tags: string[] | null; // Changed from technologies
  organizer_id: string;
  organizer_name: string;
  banner_image_url: string | null; // Added for consistency
  organizer: {
    name: string;
    email: string;
  };
}

// Helper function to get image URL from storage path
const getEventBannerUrl = (imagePath: string | null) => {
  if (!imagePath) return null;
  const { data } = supabase.storage
    .from('event-banners')
    .getPublicUrl(imagePath);
  return data.publicUrl;
};

export default function RegisterEventPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);

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
          router.push("/auth/login"); // Updated route
          return;
        }

        // Fetch event with updated query
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select(
            `
            *,
            organizer:organizer_id(name, email)
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

        // Check if user is already registered using event_participants table
        const { data: registration } = await supabase
          .from("event_participants")
          .select("id, status")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle();

        setIsRegistered(!!registration);
        setRegistrationStatus(registration?.status || null);
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
      // Register for event using event_participants table
      const { error } = await supabase.from("event_participants").insert({
        event_id: event.id,
        user_id: user.id,
        status: "pending", // Status pending for organizer approval
      });

      if (error) {
        console.error("Error registering for event:", error);
        toast.error("Failed to register for event");
        return;
      }

      toast.success("Registration submitted! Please wait for organizer approval.");
      setIsRegistered(true);
      setRegistrationStatus("pending");
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

  // Updated status logic for events
  const getEventStatus = () => {
    const now = new Date();
    const startTime = new Date(event!.start_time);
    const endTime = new Date(event!.end_time);
    const registrationDeadline = event!.registration_deadline 
      ? new Date(event!.registration_deadline) 
      : startTime;

    if (now > endTime) return { status: "completed", color: "bg-gray-100 text-gray-800" };
    if (now >= startTime && now <= endTime) return { status: "live", color: "bg-green-100 text-green-800" };
    if (now > registrationDeadline) return { status: "registration_closed", color: "bg-red-100 text-red-800" };
    return { status: "upcoming", color: "bg-blue-100 text-blue-800" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sui-sea" />
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

  // Updated registration logic
  const eventStatus = getEventStatus();
  const canRegister = eventStatus.status === "upcoming";
  const isPastDeadline = event.registration_deadline 
    ? new Date() > new Date(event.registration_deadline)
    : false;

  // Get banner image URL
  const bannerUrl = getEventBannerUrl(event.banner_image_url);

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
                  Register for {event.name}
                </h1>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${eventStatus.color}`}>
                  {eventStatus.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <p className="text-muted-foreground">
                {event.description.substring(0, 150)}...
              </p>
            </div>
          </div>

          {/* Banner Image */}
          {bannerUrl && (
            <div className="w-full h-64 rounded-lg overflow-hidden mb-8">
              <img
                src={bannerUrl}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Registration Status */}
              {isRegistered && registrationStatus ? (
                <>
                  {registrationStatus === "pending" && (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800">
                          <Clock className="h-5 w-5" />
                          Registration Pending Approval
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-yellow-700 mb-4">
                          Your registration has been submitted and is waiting for organizer approval. 
                          You&apos;ll be notified once your registration is reviewed.
                        </p>
                        <Button
                          asChild
                          className="bg-sui-sea hover:bg-sui-sea/90"
                        >
                          <Link href={`/events/${event.id}`}>
                            View Event Details
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {registrationStatus === "approved" && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          Registration Approved ✅
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-green-700 mb-4">
                          Congratulations! Your registration has been approved. 
                          You&apos;ll receive event details and updates via email.
                        </p>
                        <Button
                          asChild
                          className="bg-sui-sea hover:bg-sui-sea/90"
                        >
                          <Link href={`/events/${event.id}`}>
                            View Event Details
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {registrationStatus === "rejected" && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                          <X className="h-5 w-5" />
                          Registration Not Approved
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-red-700 mb-4">
                          Unfortunately, your registration was not approved for this event. 
                          The event may be full or may not match the requirements.
                        </p>
                        <Button
                          asChild
                          variant="outline"
                        >
                          <Link href={`/events/${event.id}`}>
                            View Event Details
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Legacy statuses */}
                  {(registrationStatus === "going" || registrationStatus === "invited") && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                          Registration Confirmed (Legacy)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-700 mb-4">
                          Your registration is confirmed. You&apos;ll receive event details and updates via email.
                    </p>
                    <Button
                      asChild
                      className="bg-sui-sea hover:bg-sui-sea/90"
                    >
                      <Link href={`/events/${event.id}`}>
                        View Event Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                  )}
                </>
              ) : !canRegister || isPastDeadline ? (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800">
                      Registration Not Available
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700">
                      {eventStatus.status === "completed" &&
                        "This event has already ended."}
                      {eventStatus.status === "live" &&
                        "This event is currently live. Registration is closed."}
                      {isPastDeadline &&
                        "The registration deadline has passed."}
                      {eventStatus.status === "registration_closed" &&
                        "Registration is closed for this event."}
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
                          className="bg-sui-sea hover:bg-sui-sea/90"
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
                      <p className="text-sm font-medium">Start Time</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.start_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">End Time</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.end_time)}
                      </p>
                    </div>
                  </div>
                  {event.registration_deadline && (
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
                  )}
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
                  {event.participant_limit && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Max Participants</p>
                        <p className="text-sm text-muted-foreground">
                          {event.participant_limit}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Organizer</p>
                      <p className="text-sm text-muted-foreground">
                        {event.organizer?.name || event.organizer_name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tags & Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted rounded text-sm"
                        >
                          {tag}
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
