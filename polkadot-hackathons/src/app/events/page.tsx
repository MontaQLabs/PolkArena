"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, ArrowUpRight, Clock, Users } from "lucide-react";
import Link from "next/link";

// Hardcoded Sui events for Feb/March 2026
const EVENTS = [
  {
    id: "sui-meetup-hk-feb",
    name: "SUI DEVELOPER MEETUP",
    description: "Monthly gathering of Sui developers in Hong Kong. Networking, talks, and demos.",
    location: "Cyberport, Hong Kong",
    is_online: false,
    start_time: "2026-02-10T18:00:00",
    end_time: "2026-02-10T21:00:00",
    tags: ["Meetup", "Networking", "Hong Kong"],
    participant_limit: 100,
  },
  {
    id: "walrus-workshop-singapore",
    name: "WALRUS STORAGE WORKSHOP",
    description: "Hands-on workshop on building with Walrus decentralized storage. Bring your laptop!",
    location: "Block71, Singapore",
    is_online: false,
    start_time: "2026-02-12T14:00:00",
    end_time: "2026-02-12T18:00:00",
    tags: ["Workshop", "Walrus", "Technical"],
    participant_limit: 50,
  },
  {
    id: "sui-india-launch",
    name: "SUI INDIA COMMUNITY LAUNCH",
    description: "Official launch of Sui India community. Keynotes from Mysten Labs and local builders.",
    location: "Bangalore, India",
    is_online: false,
    start_time: "2026-02-18T10:00:00",
    end_time: "2026-02-18T17:00:00",
    tags: ["Conference", "Launch", "India"],
    participant_limit: 300,
  },
  {
    id: "move-lang-deep-dive",
    name: "MOVE LANGUAGE DEEP DIVE",
    description: "Advanced Move programming session. Learn about resource types and capabilities.",
    location: "Online",
    is_online: true,
    start_time: "2026-02-20T09:00:00",
    end_time: "2026-02-20T12:00:00",
    tags: ["Workshop", "Move", "Online"],
    participant_limit: null,
  },
  {
    id: "sui-defi-panel-hk",
    name: "DEFI ON SUI: PANEL DISCUSSION",
    description: "Industry leaders discuss the future of DeFi on Sui. Q&A session included.",
    location: "Central, Hong Kong",
    is_online: false,
    start_time: "2026-02-25T19:00:00",
    end_time: "2026-02-25T21:30:00",
    tags: ["Panel", "DeFi", "Hong Kong"],
    participant_limit: 80,
  },
  {
    id: "sui-mumbai-meetup",
    name: "SUI MUMBAI BUILDERS NIGHT",
    description: "Casual networking event for Sui developers and enthusiasts in Mumbai.",
    location: "WeWork BKC, Mumbai",
    is_online: false,
    start_time: "2026-03-05T18:30:00",
    end_time: "2026-03-05T21:00:00",
    tags: ["Meetup", "Networking", "India"],
    participant_limit: 75,
  },
  {
    id: "walrus-hackathon-prep",
    name: "HACKATHON PREP: WALRUS EDITION",
    description: "Get ready for Walrus Storage Hack. Learn the tools and form teams.",
    location: "Online",
    is_online: true,
    start_time: "2026-03-10T15:00:00",
    end_time: "2026-03-10T17:00:00",
    tags: ["Workshop", "Hackathon", "Walrus"],
    participant_limit: null,
  },
  {
    id: "sui-gaming-showcase",
    name: "SUI GAMING SHOWCASE",
    description: "Demo day for games built on Sui. See the latest web3 gaming innovations.",
    location: "Singapore",
    is_online: false,
    start_time: "2026-03-15T14:00:00",
    end_time: "2026-03-15T19:00:00",
    tags: ["Gaming", "Demo Day", "Singapore"],
    participant_limit: 150,
  },
];

function EventCard({ event }: { event: typeof EVENTS[0] }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = () => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    return `${hours}H`;
  };

  const isUpcoming = new Date(event.start_time) > new Date();

  return (
    <div className="bg-white border-2 border-sui-ocean group hover:bg-walrus-teal transition-colors duration-150">
      {/* Date strip */}
      <div className="bg-sui-ocean px-4 py-3 flex justify-between items-center">
        <span className="text-white text-sm font-black uppercase tracking-widest">
          {formatDate(event.start_time)}, 2026
        </span>
        <span className="text-sui-sea text-xs font-bold uppercase tracking-widest">
          {getDuration()}
        </span>
      </div>

      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-black text-sui-ocean group-hover:text-white uppercase tracking-tight mb-3 transition-colors">
          {event.name}
        </h3>

        {/* Description */}
        <p className="text-sui-ocean/70 group-hover:text-white/80 mb-6 text-sm transition-colors">
          {event.description}
        </p>

        {/* Meta info */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-sui-ocean/60 group-hover:text-white/60 transition-colors">
            <MapPin className="h-4 w-4" />
            <span className="font-bold uppercase tracking-wide">
              {event.is_online ? "ONLINE" : event.location}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-sui-ocean/60 group-hover:text-white/60 transition-colors">
            <Clock className="h-4 w-4" />
            <span className="font-bold uppercase tracking-wide">
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </span>
          </div>
          {event.participant_limit && (
            <div className="flex items-center gap-2 text-sm text-sui-ocean/60 group-hover:text-white/60 transition-colors">
              <Users className="h-4 w-4" />
              <span className="font-bold uppercase tracking-wide">
                {event.participant_limit} SPOTS
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-sui-ocean/10 group-hover:bg-white/20 text-sui-ocean group-hover:text-white text-xs font-bold uppercase tracking-wide transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-sui-sea hover:bg-sui-ocean group-hover:bg-white group-hover:text-walrus-teal text-white font-bold uppercase tracking-wide rounded-none transition-colors"
          >
            <Link href={`/events/${event.id}`}>
              {isUpcoming ? "Get NFT Ticket" : "View"}
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredEvents = EVENTS.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "online" && event.is_online) ||
      (typeFilter === "offline" && !event.is_online);
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-walrus-teal py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <span className="text-white/80 font-bold uppercase tracking-widest text-sm">
              NFT Ticketing · Proof of Attendance
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mt-4 mb-6">
              EVENTS
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mb-6">
              Workshops, meetups, and conferences across Asia. Register with ZkLogin, receive encrypted NFT tickets, and earn attendance badges.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1">
                ZkLogin
              </span>
              <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1">
                NFT Tickets
              </span>
              <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1">
                Seal Encrypted
              </span>
              <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1">
                Walrus Sites
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b-2 border-sui-ocean py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sui-ocean/40" />
              <Input
                placeholder="SEARCH EVENTS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-none border-2 border-sui-ocean font-bold uppercase tracking-wide placeholder:text-sui-ocean/40"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-12 px-4 border-2 border-sui-ocean bg-white text-sui-ocean font-bold uppercase tracking-wide rounded-none"
            >
              <option value="all">ALL EVENTS</option>
              <option value="offline">IN-PERSON</option>
              <option value="online">ONLINE</option>
            </select>
            <Button
              asChild
              className="h-12 bg-walrus-teal hover:bg-sui-ocean text-white font-bold uppercase tracking-wide rounded-none px-8"
            >
              <Link href="/events/create">
                + HOST EVENT
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sui-ocean/60 font-bold uppercase tracking-wide mb-4">
                No events found
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                }}
                className="rounded-none border-2 border-sui-ocean font-bold uppercase"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
