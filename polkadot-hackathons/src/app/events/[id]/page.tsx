"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth, useAuthReady } from "@/contexts/auth-context";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Share2,
  Copy,
  X,
} from "lucide-react";
import Link from "next/link";

import { createShareableEventURL, formatEventDuration } from "@/lib/utils";
import { 
  formatDateWithTimezone, 
  getUserTimezone, 
  createCalendarUrls, 
  downloadICSFile 
} from "@/lib/timezone-utils";
import { useEventCache, EventDay } from "@/lib/cache";

interface CustomField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  registration_data: Record<string, unknown>;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

// Helper function to get image URL from storage path
const getEventBannerUrl = (imagePath: string | null) => {
  if (!imagePath) return null;
  try {
    const { data } = supabase.storage
      .from('event-banners')
      .getPublicUrl(imagePath);
    
    // Log for debugging
    console.log('Event banner URL for path:', imagePath, '→', data.publicUrl);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error generating event banner URL:', error);
    return null;
  }
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { authReady, isAuthenticated } = useAuthReady();
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const eventId = params.id as string;
  console.log(isAuthenticated);
  // Use cache for event details
  const {
    data: event,
    loading: eventLoading
  } = useEventCache(
    `event_${eventId}`,
    async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          organizer:organizer_id(name, email)
        `)
        .eq("id", eventId)
        .single();

      if (error) {
        console.error("Error fetching event:", error);
        toast.error("Failed to load event");
        throw error;
      }

      // If it's a multi-day event, fetch the event days
      if (data && data.is_multi_day) {
        const { data: eventDays, error: daysError } = await supabase
          .from("event_days")
          .select("*")
          .eq("event_id", eventId)
          .order("day_number", { ascending: true });

        if (daysError) {
          console.error("Error fetching event days:", daysError);
          // Don't throw error, just log it
        } else {
          data.event_days = eventDays || [];
        }
      }

      return data;
    },
    5 * 60 * 1000 // 5 minutes cache
  );

  // Use cache for participant count
  const {
    data: participantCount,
    loading: participantLoading
  } = useEventCache(
    `participants_${eventId}`,
    async () => {
      const { count } = await supabase
        .from("event_participants")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["approved", "going"]);

      return count || 0;
    },
    2 * 60 * 1000 // 2 minutes cache
  );

  const loading = eventLoading || participantLoading || !authReady;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user && event) {
          // Check user registration status
          const { data: registration } = await supabase
            .from("event_participants")
            .select("id, status")
            .eq("event_id", eventId)
            .eq("user_id", user.id)
            .maybeSingle();

          setIsRegistered(!!registration);
          setRegistrationStatus(registration?.status || null);

          // If user is the organizer, fetch all registrations
          if (user.id === event.organizer_id) {
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
        toast.error("Failed to load user data");
      }
    };

    // Only fetch user data when auth is ready and we have an event
    if (event && authReady) {
      fetchUserData();
    }
  }, [event, eventId, authReady, user]);

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
            toast.error(`${field.name} is required`);
            return;
          }
        }
      }

      // CHANGED: Updated to use event_participants table
      const { error } = await supabase.from("event_participants").insert({
        event_id: event.id,
        user_id: user.id,
        status: "pending",
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
    return formatDateWithTimezone(dateString, getUserTimezone(), {
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

  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);

  const addToCalendar = (provider: 'google' | 'outlook' | 'yahoo' | 'ics') => {
    if (!event) return;
    
    const calendarUrls = createCalendarUrls({
      name: event.name,
      description: event.description,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location
    });

    if (provider === 'ics') {
      downloadICSFile({
        name: event.name,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location
      });
      toast.success("Calendar file downloaded!");
    } else {
      window.open(calendarUrls[provider], '_blank');
      toast.success(`Opening ${provider} calendar...`);
    }
    
    setCalendarDropdownOpen(false);
  };

  const shareEvent = async () => {
    if (!event) return;
    
    const shareableURL = createShareableEventURL(event.short_code);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Check out this epic battle: ${event.name}`,
          url: shareableURL,
        });
      } catch {
        // Fallback to clipboard if share fails
        copyToClipboard(shareableURL);
      }
    } else {
      copyToClipboard(shareableURL);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success("Link copied to clipboard!");
    }
  };

  const renderCustomField = (field: CustomField) => {
    switch (field.type) {
      case "text":
      case "email":
        return (
          <Input
            type={field.type}
            value={String(formData[field.id] || "")}
            onChange={(e) =>
              setFormData({ ...formData, [field.id]: e.target.value })
            }
            required={field.required}
          />
        );
      case "textarea":
        return (
          <Textarea
            value={String(formData[field.id] || "")}
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
            value={String(formData[field.id] || "")}
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
              checked={Boolean(formData[field.id])}
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
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/events">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Events
                </Link>
              </Button>
              {isOrganizer && (
                <div className="ml-auto flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${event.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Edit</span>
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
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
                  {event.name}
                </h1>
                <Badge className={`${color} text-white w-fit`}>
                  {status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Organized by {event.organizer?.name || event.organizer_name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Banner Image */}
              {bannerUrl && (
                <div className="w-full h-48 sm:h-64 lg:h-auto rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={bannerUrl}
                    alt={event.name}
                    className="w-full h-full object-cover lg:object-contain"
                    onError={(e) => {
                      console.error('Event banner failed to load:', bannerUrl);
                      console.error('Error details:', e);
                    }}
                    onLoad={() => {
                      console.log('Event banner loaded successfully:', bannerUrl);
                    }}
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
                      {event.custom_fields.map((field: CustomField) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.id}>
                            {field.name}
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

              {/* Registration Status */}
              {isRegistered && registrationStatus && (
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
                        <p className="text-yellow-700">
                          Your registration has been submitted and is waiting for organizer approval. 
                          You&apos;ll be notified once your registration is reviewed.
                        </p>
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
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Legacy statuses from before approval system */}
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
                      </CardContent>
                    </Card>
                  )}
                  
                  {registrationStatus === "maybe" && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <Clock className="h-5 w-5" />
                          Registration: Maybe (Legacy)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-blue-700">
                          You&apos;ve indicated you might attend this event. 
                          Please confirm your attendance closer to the event date.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {registrationStatus === "not_going" && (
                    <Card className="border-gray-200 bg-gray-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-800">
                          <X className="h-5 w-5" />
                          Not Attending (Legacy)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">
                          You&apos;ve indicated you won&apos;t be attending this event.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
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
                              {new Date(registration.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {registration.user?.email}
                          </p>
                          {registration.registration_data && Object.keys(registration.registration_data).length > 0 && (
                            <div className="space-y-1">
                              {Object.entries(registration.registration_data).map(([key, value]) => {
                                const field = event.custom_fields?.find((f: CustomField) => f.id === key);
                                return (
                                  <div key={key} className="text-sm">
                                    <span className="font-medium">{field?.name || key}:</span>{" "}
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
            <div className="space-y-4 lg:space-y-6">
              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Multi-day Schedule */}
                  {event.is_multi_day && event.event_days && event.event_days.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Multi-day Event Schedule</p>
                          <p className="text-sm text-muted-foreground">
                            {event.event_days.length} {event.event_days.length === 1 ? "day" : "days"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 pl-6">
                        {event.event_days.map((day: EventDay) => (
                          <div key={day.id} className="border-l-2 border-polkadot-pink/30 pl-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                Day {day.day_number}
                                {day.day_name && `: ${day.day_name}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(day.start_time)} - {formatDate(day.end_time)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Duration: {formatEventDuration(day.start_time, day.end_time)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Overall Duration</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.start_time)} - {formatDate(event.end_time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Single Day Event */
                    <>
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
                            {formatEventDuration(event.start_time, event.end_time)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Time Zone</p>
                      <p className="text-sm text-muted-foreground">
                        {getUserTimezone().replace('_', ' ')} (Your local time)
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
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current Participants</p>
                      <p className="text-sm text-muted-foreground">
                        {(participantCount || 0) > 99 ? "99+" : participantCount || 0} {(participantCount || 0) === 1 ? "participant" : "participants"}
                      </p>
                    </div>
                  </div>
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
                      {event.tags.map((tag: string, index: number) => (
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

              {/* Organizer Actions */}
              {isOrganizer && (
                <Card>
                  <CardHeader>
                    <CardTitle>Organizer Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/events/${event.id}/participants`}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Participants
                      </Link>
                    </Button>
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/events/${event.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Event
                      </Link>
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={deleting}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete Event
                    </Button>
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
                          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                          handleRegister(fakeEvent);
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
                  
                  <DropdownMenu open={calendarDropdownOpen} onOpenChange={setCalendarDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <CalendarPlus className="h-4 w-4 mr-2" />
                        Add to Calendar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56">
                      <DropdownMenuItem onClick={() => addToCalendar('google')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Google Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addToCalendar('outlook')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Outlook Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addToCalendar('yahoo')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Yahoo Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addToCalendar('ics')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Download .ics file
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    onClick={shareEvent}
                    variant="outline"
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Event
                  </Button>

                  {/* Shareable URL Display */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Shareable link:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted px-2 py-1 rounded text-muted-foreground overflow-hidden">
                        <span className="block truncate">
                          {createShareableEventURL(event.short_code).replace('https://', '')}
                        </span>
                      </code>
                      <Button
                        onClick={() => copyToClipboard(createShareableEventURL(event.short_code))}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 flex-shrink-0"
                        title="Copy link"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
