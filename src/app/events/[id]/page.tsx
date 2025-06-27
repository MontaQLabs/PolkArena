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
  Globe,
  ExternalLink,
  Edit,
  Trash2,
  Settings,
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
  website_url: string;
  discord_url: string;
  twitter_url: string;
  github_url: string;
  organizer_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  organizer: {
    name: string;
    email: string;
  };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        // Fetch event first
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError) {
          console.error("Error fetching event:", eventError);
          toast.error("Failed to load event");
          router.push("/events");
          return;
        }

        // Fetch organizer info separately
        const { data: organizerData, error: organizerError } = await supabase
          .from("users")
          .select("name, email")
          .eq("id", eventData.organizer_id)
          .single();

        // Combine the data
        const event = {
          ...eventData,
          organizer: organizerError
            ? { name: null, email: null }
            : organizerData,
        };

        setEvent(event);
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

  const handleDelete = async () => {
    if (!event || !user || user.id !== event.organizer_id) return;

    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);

      if (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
        return;
      }

      toast.success("Event deleted successfully");
      router.push("/events");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete event");
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

  const isOrganizer = user?.id === event.organizer_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="outline" size="sm">
              <Link href="/events">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {event.title}
                </h1>
                <Badge className={getStatusColor(event.status)}>
                  {event.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {event.short_description}
              </p>
            </div>
            {isOrganizer && (
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/events/${event.id}/edit`}>
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
                    {event.description}
                  </p>
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
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Event Type</p>
                      <p className="text-sm text-muted-foreground">
                        {event.event_type}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organizer */}
              <Card>
                <CardHeader>
                  <CardTitle>Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {event.organizer?.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.organizer?.email}
                  </p>
                </CardContent>
              </Card>

              {/* Social Links */}
              {(event.website_url ||
                event.discord_url ||
                event.twitter_url ||
                event.github_url) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {event.website_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <a
                          href={event.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                    {event.discord_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <a
                          href={event.discord_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Discord
                        </a>
                      </Button>
                    )}
                    {event.twitter_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <a
                          href={event.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Twitter
                        </a>
                      </Button>
                    )}
                    {event.github_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <a
                          href={event.github_url}
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
                    asChild
                    className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                    disabled={
                      event.status === "draft" ||
                      event.status === "completed"
                    }
                  >
                    <Link href={`/events/${event.id}/register`}>
                      {event.status === "draft"
                        ? "Registration Not Open"
                        : event.status === "completed"
                        ? "Event Ended"
                        : "Register for Event"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Organizer Actions */}
              {user && user.id === event.organizer_id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Organizer Actions
                    </CardTitle>
                    <CardDescription>
                      Manage your event settings and participants
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        asChild
                        variant="outline"
                        className="h-auto p-4 text-left"
                      >
                        <Link href={`/events/${event.id}/edit`}>
                          <div className="flex items-start gap-3 w-full">
                            <Edit className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">Edit Event</div>
                              <div className="text-xs text-muted-foreground">
                                Update details and settings
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
                            <div className="font-medium">Delete Event</div>
                            <div className="text-xs text-muted-foreground">
                              Permanently remove this event
                            </div>
                          </div>
                        </div>
                      </Button>
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