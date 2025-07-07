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
import { Search, Calendar, MapPin, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
    description: string;
  }>;
  rules: string;
  requirements: string;
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

function HackathonCard({ hackathon }: { hackathon: Hackathon }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-green-500 dark:bg-green-700";
      case "registration_open":
        return "bg-blue-500 dark:bg-blue-700";
      case "published":
        return "bg-purple-500 dark:bg-purple-700";
      case "draft":
        return "bg-gray-500 dark:bg-gray-700";
      case "completed":
        return "bg-gray-500 dark:bg-gray-700";
      case "judging":
        return "bg-yellow-500 dark:bg-yellow-700";
      default:
        return "bg-gray-500 dark:bg-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in_progress":
        return "Live Now";
      case "registration_open":
        return "Registration Open";
      case "published":
        return "Published";
      case "draft":
        return "Draft";
      case "completed":
        return "Completed";
      case "judging":
        return "Judging";
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

  const getPrizeText = (prizes: Hackathon["prizes"]) => {
    if (!prizes || prizes.length === 0) return "No prizes";
    const total = prizes.reduce((sum, prize) => sum + (prize.amount || 0), 0);
    const currency = prizes[0]?.currency || "USD";
    return `${total} ${currency}`;
  };

  const getTechnologies = (technologies: string[]) => {
    return technologies || [];
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-storm-200 hover:border-polkadot-pink/50 bg-white dark:bg-gray-900">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`${getStatusColor(
                  hackathon.status
                )} text-white px-2 py-1 rounded-full text-xs font-medium`}
              >
                {getStatusText(hackathon.status)}
              </span>
            </div>
            <CardTitle className="group-hover:text-polkadot-pink transition-colors dark:text-white">
              {hackathon.title}
            </CardTitle>
            <CardDescription className="line-clamp-3 dark:text-gray-300">
              {hackathon.short_description || hackathon.description}
            </CardDescription>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {getTechnologies(hackathon.technologies).map((tech) => (
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
          <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(hackathon.start_date)} -{" "}
              {formatDate(hackathon.end_date)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>
              {hackathon.is_online ? "Online" : hackathon.location || "TBD"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
            <Award className="h-4 w-4" />
            <span>{getPrizeText(hackathon.prizes)} in prizes</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-polkadot-pink hover:bg-polkadot-pink/90"
          >
            <Link href={`/hackathons/${hackathon.id}`}>View Details</Link>
          </Button>
          {hackathon.status === "in_progress" ||
          hackathon.status === "registration_open" ? (
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/hackathons/${hackathon.id}/join`}>Join Now</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function HackathonsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse bg-white dark:bg-gray-900">
          <CardHeader>
            <div className="h-4 bg-muted dark:bg-gray-800 rounded w-20 mb-2"></div>
            <div className="h-6 bg-muted dark:bg-gray-800 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted dark:bg-gray-800 rounded w-full mb-1"></div>
            <div className="h-4 bg-muted dark:bg-gray-800 rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-muted dark:bg-gray-800 rounded mb-4"></div>
            <div className="flex gap-2">
              <div className="h-9 bg-muted dark:bg-gray-800 rounded flex-1"></div>
              <div className="h-9 bg-muted dark:bg-gray-800 rounded flex-1"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        setLoading(true);

        // Fetch hackathons with organizer info
        const { data, error } = await supabase
          .from("hackathons")
          .select(
            `
            *,
            organizer:users(name, email)
          `
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching hackathons:", error);
          toast.error("Failed to load hackathons");
          return;
        }

        setHackathons(data || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load hackathons");
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  const filteredHackathons = hackathons.filter((hackathon) => {
    const matchesSearch =
      hackathon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hackathon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || hackathon.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hackathons</h1>
          <p className="text-muted-foreground">
            Discover and join amazing Polkadot hackathons
          </p>
        </div>
        <Button asChild className="bg-polkadot-pink hover:bg-polkadot-pink/90">
          <Link href="/hackathons/create">
            <ArrowRight className="h-4 w-4 mr-2" />
            Create Hackathon
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hackathons..."
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
            <option value="in_progress">In Progress</option>
            <option value="judging">Judging</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Hackathons Grid */}
      {loading ? (
        <HackathonsLoading />
      ) : filteredHackathons.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "No hackathons found matching your criteria."
              : "No hackathons found."}
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
              <Link href="/hackathons/create">Create the First Hackathon</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      )}
    </div>
  );
}
