"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, ArrowUpRight, Users } from "lucide-react";
import Link from "next/link";

// Hardcoded Sui hackathons for Feb/March 2026
const HACKATHONS = [
  {
    id: "sui-overflow-hk-2026",
    title: "SUI OVERFLOW HONG KONG",
    description: "The largest Sui hackathon in Asia. Build the future of decentralized applications with Move.",
    location: "Hong Kong",
    is_online: false,
    start_date: "2026-02-15",
    end_date: "2026-02-17",
    prize_total: 100000,
    currency: "USD",
    status: "registration_open",
    technologies: ["Sui", "Move", "Walrus"],
    participants: 500,
  },
  {
    id: "walrus-storage-hack-singapore",
    title: "WALRUS STORAGE HACK",
    description: "48-hour hackathon focused on decentralized storage solutions. Build on Walrus protocol.",
    location: "Singapore",
    is_online: false,
    start_date: "2026-02-22",
    end_date: "2026-02-24",
    prize_total: 75000,
    currency: "USD",
    status: "registration_open",
    technologies: ["Walrus", "Sui", "DeFi"],
    participants: 300,
  },
  {
    id: "sui-defi-india",
    title: "SUI DEFI SUMMIT HACKATHON",
    description: "Build the next generation of DeFi protocols on Sui. Bangalore edition.",
    location: "Bangalore, India",
    is_online: false,
    start_date: "2026-03-01",
    end_date: "2026-03-03",
    prize_total: 50000,
    currency: "USD",
    status: "registration_open",
    technologies: ["Sui", "DeFi", "Move"],
    participants: 400,
  },
  {
    id: "sui-gaming-hk",
    title: "SUI GAMING JAM",
    description: "Create blockchain games on Sui. 72 hours to build the next hit web3 game.",
    location: "Hong Kong",
    is_online: false,
    start_date: "2026-03-08",
    end_date: "2026-03-11",
    prize_total: 80000,
    currency: "USD",
    status: "upcoming",
    technologies: ["Sui", "Gaming", "NFT"],
    participants: 250,
  },
  {
    id: "sui-move-bootcamp-mumbai",
    title: "MOVE BOOTCAMP MUMBAI",
    description: "Learn and build with Move. Perfect for developers new to Sui ecosystem.",
    location: "Mumbai, India",
    is_online: false,
    start_date: "2026-03-15",
    end_date: "2026-03-16",
    prize_total: 25000,
    currency: "USD",
    status: "upcoming",
    technologies: ["Move", "Sui", "Education"],
    participants: 200,
  },
  {
    id: "sui-global-online",
    title: "SUI GLOBAL HACK",
    description: "Online hackathon open to developers worldwide. Build anything on Sui.",
    location: "Online",
    is_online: true,
    start_date: "2026-03-20",
    end_date: "2026-03-27",
    prize_total: 150000,
    currency: "USD",
    status: "upcoming",
    technologies: ["Sui", "Move", "Walrus", "DeFi"],
    participants: 1000,
  },
];

function HackathonCard({ hackathon }: { hackathon: typeof HACKATHONS[0] }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration_open":
        return "bg-walrus-teal";
      case "upcoming":
        return "bg-sui-sea";
      case "in_progress":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "registration_open":
        return "REGISTRATION OPEN";
      case "upcoming":
        return "COMING SOON";
      case "in_progress":
        return "LIVE NOW";
      default:
        return status.toUpperCase();
    }
  };

  return (
    <div className="bg-white border-2 border-sui-ocean group hover:bg-sui-ocean transition-colors duration-150">
      {/* Status bar */}
      <div className={`${getStatusColor(hackathon.status)} px-4 py-2`}>
        <span className="text-white text-xs font-bold uppercase tracking-widest">
          {getStatusText(hackathon.status)}
        </span>
      </div>

      <div className="p-6">
        {/* Title */}
        <h3 className="text-2xl font-black text-sui-ocean group-hover:text-white uppercase tracking-tight mb-3 transition-colors">
          {hackathon.title}
        </h3>

        {/* Description */}
        <p className="text-sui-ocean/70 group-hover:text-white/70 mb-6 transition-colors">
          {hackathon.description}
        </p>

        {/* Meta info */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-sui-ocean/60 group-hover:text-white/60 transition-colors">
            <MapPin className="h-4 w-4" />
            <span className="font-bold uppercase tracking-wide">
              {hackathon.is_online ? "ONLINE" : hackathon.location}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-sui-ocean/60 group-hover:text-white/60 transition-colors">
            <Calendar className="h-4 w-4" />
            <span className="font-bold uppercase tracking-wide">
              {formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}, 2026
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-sui-ocean/60 group-hover:text-white/60 transition-colors">
            <Users className="h-4 w-4" />
            <span className="font-bold uppercase tracking-wide">
              {hackathon.participants} BUILDERS
            </span>
          </div>
        </div>

        {/* Prize */}
        <div className="mb-6">
          <div className="text-3xl font-black text-sui-sea group-hover:text-walrus-teal transition-colors">
            ${hackathon.prize_total.toLocaleString()}
          </div>
          <div className="text-xs font-bold text-sui-ocean/50 group-hover:text-white/50 uppercase tracking-widest transition-colors">
            In Prizes
          </div>
        </div>

        {/* Technologies */}
        <div className="flex flex-wrap gap-2 mb-6">
          {hackathon.technologies.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-sui-ocean/10 group-hover:bg-white/10 text-sui-ocean group-hover:text-white text-xs font-bold uppercase tracking-wide transition-colors"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-sui-sea hover:bg-walrus-teal text-white font-bold uppercase tracking-wide rounded-none"
          >
            <Link href={`/hackathons/${hackathon.id}`}>
              View Details
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          {hackathon.status === "registration_open" && (
            <Button
              asChild
              variant="outline"
              className="flex-1 border-2 border-sui-ocean group-hover:border-white text-sui-ocean group-hover:text-white font-bold uppercase tracking-wide rounded-none hover:bg-transparent transition-colors"
            >
              <Link href={`/hackathons/${hackathon.id}/join`}>Register</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HackathonsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredHackathons = HACKATHONS.filter((hackathon) => {
    const matchesSearch =
      hackathon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hackathon.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hackathon.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || hackathon.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-sui-ocean py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <span className="text-walrus-teal font-bold uppercase tracking-widest text-sm">
              Build on Sui
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mt-4 mb-6">
              HACKATHONS
            </h1>
            <p className="text-xl text-white/60 max-w-2xl">
              Join the most exciting Sui ecosystem hackathons. Ship products, win prizes, build the future.
            </p>
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
                placeholder="SEARCH HACKATHONS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-none border-2 border-sui-ocean font-bold uppercase tracking-wide placeholder:text-sui-ocean/40"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 px-4 border-2 border-sui-ocean bg-white text-sui-ocean font-bold uppercase tracking-wide rounded-none"
            >
              <option value="all">ALL STATUS</option>
              <option value="registration_open">REGISTRATION OPEN</option>
              <option value="upcoming">COMING SOON</option>
              <option value="in_progress">LIVE NOW</option>
            </select>
            <Button
              asChild
              className="h-12 bg-sui-sea hover:bg-walrus-teal text-white font-bold uppercase tracking-wide rounded-none px-8"
            >
              <Link href="/hackathons/create">
                + HOST HACKATHON
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Hackathons Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {filteredHackathons.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sui-ocean/60 font-bold uppercase tracking-wide mb-4">
                No hackathons found
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="rounded-none border-2 border-sui-ocean font-bold uppercase"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHackathons.map((hackathon) => (
                <HackathonCard key={hackathon.id} hackathon={hackathon} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
