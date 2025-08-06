"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, MapPin, Users, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { formatEventDuration } from "@/lib/utils";
import { useEventCache } from "@/lib/cache";
import { ErrorDisplay, LoadingWithTimeout } from "@/components/ui/error-boundary";

interface Event {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  organizer_id: string;
  organizer_name: string;
  banner_image_url: string | null;
  location: string | null;
  is_online: boolean;
  participant_limit: number | null;
  tags: string[] | null;
  custom_fields: CustomField[] | null;
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
  _count?: {
    registrations: number;
  };
}

interface CustomField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
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

function EventCard({ event }: { event: Event }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventStatus = () => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    const registrationDeadline = event.registration_deadline 
      ? new Date(event.registration_deadline) 
      : startTime;

    if (now > endTime) return { status: "completed", color: "bg-gray-500 dark:bg-gray-700" };
    if (now >= startTime && now <= endTime) return { status: "live", color: "bg-green-500 dark:bg-green-700" };
    if (now > registrationDeadline) return { status: "registration_closed", color: "bg-red-500 dark:bg-red-700" };
    return { status: "upcoming", color: "bg-blue-500 dark:bg-blue-700" };
  };

  const { status, color } = getEventStatus();

  const getStatusText = (status: string) => {
    switch (status) {
      case "live": return "Live Now";
      case "upcoming": return "Upcoming";
      case "registration_closed": return "Registration Closed";
      case "completed": return "Completed";
      default: return "Unknown";
    }
  };

  // Get banner image URL from storage path
  const bannerUrl = getEventBannerUrl(event.banner_image_url);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-storm-200 hover:border-polkadot-pink/50 bg-white dark:bg-gray-900">
      {/* Show banner image at the top if available */}
      {bannerUrl && (
        <div className="w-full h-48 overflow-hidden rounded-t-lg">
          <img
            src={bannerUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className={`${color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                {getStatusText(status)}
              </span>
            </div>
            <CardTitle className="group-hover:text-polkadot-pink transition-colors dark:text-white">
              {event.name}
            </CardTitle>
            <CardDescription className="line-clamp-3 dark:text-gray-300">
              {event.description}
            </CardDescription>
          </div>
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {event.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(event.start_time)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>
              Duration: {formatEventDuration(event.start_time, event.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>
              {event.is_online ? "Online Event" : event.location || "TBD"}
            </span>
          </div>
          {event.participant_limit && (
            <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>
                Max {event.participant_limit} participants
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-polkadot-pink hover:bg-polkadot-pink/90"
          >
            <Link href={`/events/${event.id}`}>View Details</Link>
          </Button>
          {status === "upcoming" && (
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/events/${event.id}/register`}>Register Now</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}



export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // Use cache for upcoming events
  const {
    data: events,
    loading: upcomingLoading,
    error: upcomingError,
    refetch: refetchUpcoming
  } = useEventCache(
    "events_list",
    async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select(`
            *,
            organizer:organizer_id(name, email)
          `)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true });

        if (error) {
          console.error("Error fetching upcoming events:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        return data || [];
      } catch (err) {
        console.error("Critical error in events fetch:", err);
        throw err;
      }
    },
    2 * 60 * 1000 // 2 minutes cache
  );

  // Use cache for past events
  const {
    data: pastEvents,
    loading: pastLoading,
    error: pastError,
    refetch: refetchPast
  } = useEventCache(
    "past_events_list",
    async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select(`
            *,
            organizer:organizer_id(name, email)
          `)
          .lt("start_time", new Date().toISOString())
          .order("start_time", { ascending: false })
          .limit(20); // Limit past events to avoid overwhelming the page

        if (error) {
          console.error("Error fetching past events:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        return data || [];
      } catch (err) {
        console.error("Critical error in past events fetch:", err);
        throw err;
      }
    },
    10 * 60 * 1000 // 10 minutes cache
  );

  const loading = upcomingLoading || pastLoading;
  const eventsData = events || [];
  const pastEventsData = pastEvents || [];

  const filteredEvents = (activeTab === "upcoming" ? eventsData : pastEventsData).filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || 
      (typeFilter === "online" && event.is_online) ||
      (typeFilter === "offline" && !event.is_online);
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">
            Discover and join amazing Polkadot ecosystem events
          </p>
        </div>
        <Button asChild className="bg-polkadot-pink hover:bg-polkadot-pink/90">
          <Link href="/events/create">
            <ArrowRight className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            aria-label="Filter by type"
          >
            <option value="all">All Events</option>
            <option value="online">Online</option>
            <option value="offline">In-Person</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "upcoming"
              ? "border-polkadot-pink text-polkadot-pink"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Upcoming Events ({eventsData.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "past"
              ? "border-polkadot-pink text-polkadot-pink"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Past Events ({pastEventsData.length})
        </button>
      </div>

      {/* Error Handling */}
      {(upcomingError || pastError) && (
        <ErrorDisplay
          error={activeTab === "upcoming" ? upcomingError : pastError}
          onRetry={activeTab === "upcoming" ? refetchUpcoming : refetchPast}
          title={`Failed to load ${activeTab} events`}
        />
      )}

      {/* Events Grid */}
      {loading ? (
        <LoadingWithTimeout
          isLoading={loading}
          message="Server is experiencing high load. Please wait..."
        />
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || typeFilter !== "all"
              ? "No events found matching your criteria."
              : activeTab === "upcoming" 
                ? "No upcoming events found."
                : "No past events found."}
          </div>
          {searchTerm || typeFilter !== "all" ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          ) : activeTab === "upcoming" ? (
            <Button asChild>
              <Link href="/events/create">Create the First Event</Link>
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              Past events will appear here once they are completed.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
