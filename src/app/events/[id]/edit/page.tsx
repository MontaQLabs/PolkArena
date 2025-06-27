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
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
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
    event_type: "",
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
        const eventId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setUser(user);

        // Fetch event
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

        // Check if user is the organizer
        if (eventData.organizer_id !== user.id) {
          toast.error("You can only edit events you created");
          router.push(`/events/${eventId}`);
          return;
        }

        setEvent(eventData);
        setFormData({
          title: eventData.title,
          description: eventData.description,
          short_description: eventData.short_description || "",
          location: eventData.location || "",
          is_online: eventData.is_online,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          registration_deadline: eventData.registration_deadline,
          max_participants: eventData.max_participants?.toString() || "",
          event_type: eventData.event_type,
          technologies: eventData.technologies
            ? eventData.technologies.join(", ")
            : "",
          website_url: eventData.website_url || "",
          discord_url: eventData.discord_url || "",
          twitter_url: eventData.twitter_url || "",
          github_url: eventData.github_url || "",
          status: eventData.status,
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event) return;

    setSaving(true);
    try {
      if (
        !formData.title ||
        !formData.description ||
        !formData.start_date ||
        !formData.end_date ||
        !formData.event_type
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
        .from("events")
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
          event_type: formData.event_type,
          technologies: technologiesArray.length > 0 ? technologiesArray : null,
          website_url: formData.website_url || null,
          discord_url: formData.discord_url || null,
          twitter_url: formData.twitter_url || null,
          github_url: formData.github_url || null,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      if (error) {
        console.error("Error updating event:", error);
        toast.error("Failed to update event");
        return;
      }

      toast.success("Event updated successfully!");
      router.push(`/events/${event.id}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update event");
    } finally {
      setSaving(false);
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
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Edit Event
              </h1>
              <p className="text-muted-foreground">
                Update your event details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Event Status</CardTitle>
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
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="title">Event Title *</Label>
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
                    <Label htmlFor="event_type">Event Type *</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, event_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="meetup">Meetup</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="demo_day">Demo Day</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Event Format</Label>
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

            {/* Technologies */}
            <Card>
              <CardHeader>
                <CardTitle>Technologies & Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                <Link href={`/events/${event.id}`}>Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-polkadot-pink hover:bg-polkadot-pink/90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Event
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}