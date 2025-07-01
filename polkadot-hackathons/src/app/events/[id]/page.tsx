"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Clock,
  CheckCircle,
  CalendarPlus,
} from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Event {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  organizer_id: string;
  organizer_name: string;
  banner_image_url: string | null; // CHANGED: from banner_image_url to banner_image_url
  location: string | null;
  is_online: boolean;
  participant_limit: number | null;
  tags: string[] | null;
  custom_fields: any;
  registration_deadline: string | null;
  website_url: string | null;
  discord_url: string | null;
  twitter_url: string | null;
  requirements: string | null;
  created_at: string;
  organizer: {
    name: string;
    email: string;
  };
}

interface Registration {
  id: string;
  user_id: string;
  responses: any;
  registered_at: string;
  user: {
    name: string;
    email: string;
  };
}

// ADDED: Helper function to get image URL from storage path
const getEventBannerUrl = (imagePath: string | null) => {
  if (!imagePath) return null;
  const { data } = supabase.storage
    .from('event-banners')
    .getPublicUrl(imagePath);
  return data.publicUrl;
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        // CHANGED: Updated query to use correct foreign key relationship
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select(`
            *,
            organizer:organizer_id(name, email)
          `)
          .eq("id", eventId)
          .single();

        if (eventError) {
          console.error("Error fetching event:", eventError);
          toast.error("Failed to load event");
          router.push("/events");
          return;
        }

        setEvent(eventData);

        if (user) {
          // FIXED: Use maybeSingle() instead of single() to avoid 406 error
          const { data: registration } = await supabase
            .from("event_participants")
            .select("id")
            .eq("event_id", eventId)
            .eq("user_id", user.id)
            .maybeSingle(); // CHANGED: from .single() to .maybeSingle()

          setIsRegistered(!!registration);

          // If user is the organizer, fetch all registrations
          if (user.id === eventData.organizer_id) {
            const { data: registrationsData } = await supabase
              .from("event_participants")
              .select(`
                *,
                user:user_id(name, email)
              `)
              .eq("event_id", eventId)
              .order("registered_at", { ascending: false });

            setRegistrations(registrationsData || []);
          }
        }
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

    if (!user || !event) {
      toast.error("Please sign in to register");
      router.push("/auth/login");
      return;
    }

    setRegistering(true);
    try {
      // Validate required fields
      if (event.custom_fields) {
        for (const field of event.custom_fields) {
          if (field.required && !formData[field.id]) {
            toast.error(`${field.label} is required`);
            return;
          }
        }
      }

      // CHANGED: Updated to use event_participants table
      const { error } = await supabase.from("event_participants").insert({
        event_id: event.id,
        user_id: user.id,
        status: "going",
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

  const getEventStatus = () => {
    if (!event) return { status: "unknown", color: "bg-gray-500" };
    
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    const registrationDeadline = event.registration_deadline 
      ? new Date(event.registration_deadline) 
      : startTime;

    if (now > endTime) return { status: "completed", color: "bg-gray-500" };
    if (now >= startTime && now <= endTime) return { status: "live", color: "bg-green-500" };
    if (now > registrationDeadline) return { status: "registration_closed", color: "bg-red-500" };
    return { status: "upcoming", color: "bg-blue-500" };
  };

  const addToCalendar = () => {
    if (!event) return;
    
    const startDate = new Date(event.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(event.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location || 'Online')}`;
    
    window.open(calendarUrl, '_blank');
  };

  const renderCustomField = (field: any) => {
    switch (field.type) {
      case "text":
      case "email":
        return (
          <Input
            type={field.type}
            value={formData[field.id] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            required={field.required}
          />
        );
      case "textarea":
        return (
          <Textarea
            value={formData[field.id] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            required={field.required}
            rows={3}
          />
        );
      case "select":
        return (
          <Select
            value={formData[field.id] || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, [field.id]: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData[field.id] || false}
              onChange={(e) =>
                setFormData({ ...formData, [field.id]: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm">Yes</span>
          </div>
        );
      default:
        return null;
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
  const { status, color } = getEventStatus();
  const canRegister = status === "upcoming" && !isRegistered;

  // CHANGED: Get banner URL using helper function
  const bannerUrl = getEventBannerUrl(event.banner_image_url);

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
                  {event.name}
                </h1>
                <Badge className={`${color} text-white`}>
                  {status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Organized by {event.organizer?.name || event.organizer_name}
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
              {/* CHANGED: Banner Image - use bannerUrl instead of event.banner_image_url */}
              {bannerUrl && (
  <div className="w-auto h-auto rounded-lg overflow-hidden bg-gray-100">
    <img
      src={bannerUrl}
      alt={event.name}
      className="w-full h-full object-contain"
    />
  </div>
)}

              {/* Description */}
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

              {/* Requirements */}
              {event.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {event.requirements}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Registration Form */}
              {canRegister && event.custom_fields && event.custom_fields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Registration Form</CardTitle>
                    <CardDescription>
                      Please fill out the form below to register for this event
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      {event.custom_fields.map((field: any) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {renderCustomField(field)}
                        </div>
                      ))}
                      <Button
                        type="submit"
                        disabled={registering}
                        className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                      >
                        {registering ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Register for Event
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Already Registered */}
              {isRegistered && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      Registration Confirmed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-700">
                      You are registered for this event. We&apos;ll send you updates and details as the event approaches.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Participant List (Organizer Only) */}
              {isOrganizer && registrations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Participants ({registrations.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {registrations.map((registration) => (
                        <div key={registration.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">
                              {registration.user?.name || "Anonymous"}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {new Date(registration.registered_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {registration.user?.email}
                          </p>
                          {registration.responses && Object.keys(registration.responses).length > 0 && (
                            <div className="space-y-1">
                              {Object.entries(registration.responses).map(([key, value]) => {
                                const field = event.custom_fields?.find((f: any) => f.id === key);
                                return (
                                  <div key={key} className="text-sm">
                                    <span className="font-medium">{field?.label || key}:</span>{" "}
                                    <span className="text-muted-foreground">
                                      {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
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
                      <p className="text-sm font-medium">Start Time</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.start_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">End Time</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.end_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.ceil((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60 * 60))} hours
                      </p>
                    </div>
                  </div>
                  {event.registration_deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Registration Deadline</p>
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
                        {event.is_online ? "Online Event" : event.location || "TBD"}
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
                </CardContent>
              </Card>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Social Links */}
              {(event.website_url || event.discord_url || event.twitter_url) && (
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
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {canRegister ? (
                    <Button
                      onClick={() => {
                        if (!user) {
                          router.push("/auth/login");
                          return;
                        }
                        if (!event.custom_fields || event.custom_fields.length === 0) {
                          handleRegister(new Event("submit") as any);
                        } else {
                          // Scroll to registration form
                          document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                    >
                      {!user ? "Sign In to Register" : "Register for Event"}
                    </Button>
                  ) : isRegistered ? (
                    <Button disabled className="w-full">
                      Already Registered
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Registration Closed
                    </Button>
                  )}
                  
                  <Button
                    onClick={addToCalendar}
                    variant="outline"
                    className="w-full"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
