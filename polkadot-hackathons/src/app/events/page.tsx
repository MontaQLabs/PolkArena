"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";

interface Event {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  organizer_id: string;
  organizer_name: string;
  banner_image_url: string | null; // Changed from banner_image_url
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
  _count?: {
    registrations: number;
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

    if (now > endTime) return { status: "completed", color: "bg-gray-500" };
    if (now >= startTime && now <= endTime) return { status: "live", color: "bg-green-500" };
    if (now > registrationDeadline) return { status: "registration_closed", color: "bg-red-500" };
    return { status: "upcoming", color: "bg-blue-500" };
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
    <Card className="group hover:shadow-lg transition-all duration-200 border-storm-200 hover:border-polkadot-pink/50 bg-white">
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
              <span className="text-sm text-muted-foreground">
                by {event.organizer?.name || event.organizer_name || "Anonymous"}
              </span>
            </div>
            <CardTitle className="group-hover:text-polkadot-pink transition-colors">
              {event.name}
            </CardTitle>
            <CardDescription className="line-clamp-3">
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(event.start_time)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Duration: {Math.ceil((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60 * 60))} hours
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {event.is_online ? "Online Event" : event.location || "TBD"}
            </span>
          </div>
          {event.participant_limit && (
            <div className="flex items-center gap-2 text-muted-foreground">
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

function EventsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse bg-white">
          <div className="w-full h-48 bg-muted rounded-t-lg"></div>
          <CardHeader>
            <div className="h-4 bg-muted rounded w-20 mb-2"></div>
            <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-full mb-1"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-muted rounded mb-4"></div>
            <div className="flex gap-2">
              <div className="h-9 bg-muted rounded flex-1"></div>
              <div className="h-9 bg-muted rounded flex-1"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        // Updated query to use the correct foreign key relationship
        const { data, error } = await supabase
          .from("events")
          .select(`
            *,
            organizer:organizer_id(name, email)
          `)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true });

        if (error) {
          console.error("Error fetching events:", error);
          toast.error("Failed to load events");
          return;
        }

        setEvents(data || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
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

      {/* Events Grid */}
      {loading ? (
        <EventsLoading />
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || typeFilter !== "all"
              ? "No events found matching your criteria."
              : "No upcoming events found."}
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
          ) : (
            <Button asChild>
              <Link href="/events/create">Create the First Event</Link>
            </Button>
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
