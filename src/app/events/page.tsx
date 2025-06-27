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
import { Search, Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
  organizer: {
    name: string;
    email: string;
  };
}

function EventCard({ event }: { event: Event }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500";
      case "live":
        return "bg-green-500";
      case "registration_open":
        return "bg-purple-500";
      case "published":
        return "bg-indigo-500";
      case "draft":
        return "bg-gray-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Upcoming";
      case "live":
        return "Live Now";
      case "registration_open":
        return "Registration Open";
      case "published":
        return "Published";
      case "draft":
        return "Draft";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTechnologies = (technologies: string[]) => {
    return technologies || [];
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-storm-200 hover:border-polkadot-pink/50 bg-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`${getStatusColor(
                  event.status
                )} text-white px-2 py-1 rounded-full text-xs font-medium`}
              >
                {getStatusText(event.status)}
              </span>
              <span className="text-sm text-muted-foreground">
                by {event.organizer?.name || "Anonymous"}
              </span>
            </div>
            <CardTitle className="group-hover:text-polkadot-pink transition-colors">
              {event.title}
            </CardTitle>
            <CardDescription className="line-clamp-3">
              {event.short_description || event.description}
            </CardDescription>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {getTechnologies(event.technologies).map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
            >
              {tech}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(event.start_date)} -{" "}
              {formatDate(event.end_date)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {event.is_online ? "Online" : event.location || "TBD"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {event.max_participants
                ? `Max ${event.max_participants} participants`
                : "Unlimited participants"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs bg-accent px-2 py-1 rounded">
              {event.event_type}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-polkadot-pink hover:bg-polkadot-pink/90"
          >
            <Link href={`/events/${event.id}`}>View Details</Link>
          </Button>
          {event.status === "live" ||
          event.status === "registration_open" ? (
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/events/${event.id}/register`}>Register Now</Link>
            </Button>
          ) : null}
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
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        // Fetch events with organizer info
        const { data, error } = await supabase
          .from("events")
          .select(
            `
            *,
            organizer:users(name, email)
          `
          )
          .order("created_at", { ascending: false });

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
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="registration_open">Registration Open</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <EventsLoading />
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "No events found matching your criteria."
              : "No events found."}
          </div>
          {searchTerm || statusFilter !== "all" ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
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