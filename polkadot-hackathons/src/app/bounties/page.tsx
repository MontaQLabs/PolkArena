"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Calendar, ArrowUpRight, ExternalLink, Github } from "lucide-react";
import Link from "next/link";

// Hardcoded Sui bounties
const BOUNTIES = [
  {
    id: "walrus-sdk-rust",
    title: "WALRUS RUST SDK IMPROVEMENTS",
    description: "Improve error handling and add async support to the official Walrus Rust SDK.",
    tags: ["Rust", "SDK", "Walrus"],
    reward_amount: 5000,
    reward_currency: "USDC",
    deadline: "2026-03-01",
    status: "open",
    poster_name: "Walrus Protocol",
    repo_url: "https://github.com/walrus-protocol/walrus-sdk",
  },
  {
    id: "sui-move-analyzer",
    title: "MOVE LANGUAGE SERVER FEATURES",
    description: "Add go-to-definition and find-references support for the Move analyzer VS Code extension.",
    tags: ["Move", "Tooling", "VSCode"],
    reward_amount: 8000,
    reward_currency: "SUI",
    deadline: "2026-02-28",
    status: "open",
    poster_name: "Mysten Labs",
    repo_url: "https://github.com/move-language/move-analyzer",
  },
  {
    id: "sui-defi-dashboard",
    title: "OPEN SOURCE DEFI DASHBOARD",
    description: "Build an open-source dashboard to track DeFi protocols on Sui. Include TVL, volume, and user metrics.",
    tags: ["DeFi", "Frontend", "Analytics"],
    reward_amount: 3000,
    reward_currency: "USDC",
    deadline: "2026-03-15",
    status: "open",
    poster_name: "Sui Foundation",
    repo_url: null,
  },
  {
    id: "walrus-pinning-service",
    title: "WALRUS PINNING SERVICE",
    description: "Create a pinning service for Walrus that integrates with IPFS gateways.",
    tags: ["Walrus", "Infrastructure", "Go"],
    reward_amount: 10000,
    reward_currency: "USDC",
    deadline: "2026-03-20",
    status: "open",
    poster_name: "Walrus Protocol",
    repo_url: null,
  },
  {
    id: "sui-gaming-framework",
    title: "MOVE GAMING FRAMEWORK",
    description: "Develop reusable Move modules for common gaming mechanics: inventory, crafting, battles.",
    tags: ["Gaming", "Move", "Framework"],
    reward_amount: 6000,
    reward_currency: "SUI",
    deadline: "2026-04-01",
    status: "open",
    poster_name: "Sui Gaming Guild",
    repo_url: null,
  },
  {
    id: "sui-mobile-wallet",
    title: "MOBILE WALLET SDK",
    description: "Create a React Native SDK for Sui wallet integration. Support Sui Wallet and other providers.",
    tags: ["Mobile", "React Native", "Wallet"],
    reward_amount: 7500,
    reward_currency: "USDC",
    deadline: "2026-03-25",
    status: "open",
    poster_name: "Community Fund",
    repo_url: null,
  },
  {
    id: "sui-docs-translation",
    title: "SUI DOCS: CHINESE TRANSLATION",
    description: "Translate the official Sui documentation to Simplified Chinese. Must maintain technical accuracy.",
    tags: ["Documentation", "Chinese", "Translation"],
    reward_amount: 2000,
    reward_currency: "USDC",
    deadline: "2026-02-20",
    status: "open",
    poster_name: "Sui Foundation",
    repo_url: "https://github.com/sui-foundation/sui-docs",
  },
  {
    id: "walrus-browser-extension",
    title: "WALRUS BROWSER EXTENSION",
    description: "Build a browser extension for easy file uploads to Walrus. Support drag-and-drop.",
    tags: ["Extension", "Walrus", "JavaScript"],
    reward_amount: 4000,
    reward_currency: "USDC",
    deadline: "2026-03-10",
    status: "open",
    poster_name: "Walrus Protocol",
    repo_url: null,
  },
];

function BountyCard({ bounty }: { bounty: typeof BOUNTIES[0] }) {
  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? `${daysLeft} DAYS LEFT` : "EXPIRED";
  };

  return (
    <div className="bg-white border-2 border-sui-ocean group hover:bg-sui-ocean transition-colors duration-150">
      {/* Reward bar */}
      <div className="bg-sui-sea px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-white" />
          <span className="text-white text-lg font-black">
            {bounty.reward_amount.toLocaleString()} {bounty.reward_currency}
          </span>
        </div>
        <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
          {formatDeadline(bounty.deadline)}
        </span>
      </div>

      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-black text-sui-ocean group-hover:text-white uppercase tracking-tight mb-3 transition-colors">
          {bounty.title}
        </h3>

        {/* Description */}
        <p className="text-sui-ocean/70 group-hover:text-white/80 mb-4 text-sm transition-colors">
          {bounty.description}
        </p>

        {/* Posted by */}
        <p className="text-sui-ocean/50 group-hover:text-white/50 text-xs font-bold uppercase tracking-widest mb-4 transition-colors">
          Posted by {bounty.poster_name}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {bounty.tags.map((tag) => (
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
            className="flex-1 bg-walrus-teal hover:bg-sui-sea text-white font-bold uppercase tracking-wide rounded-none"
          >
            <Link href={`/bounties/${bounty.id}`}>
              Apply Now
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          {bounty.repo_url && (
            <Button
              asChild
              variant="outline"
              className="border-2 border-sui-ocean group-hover:border-white text-sui-ocean group-hover:text-white font-bold uppercase tracking-wide rounded-none hover:bg-transparent transition-colors"
            >
              <a href={bounty.repo_url} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BountiesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBounties = BOUNTIES.filter((bounty) => {
    return (
      bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounty.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounty.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalRewards = BOUNTIES.reduce((sum, b) => sum + b.reward_amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-sui-sea py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <span className="text-white/80 font-bold uppercase tracking-widest text-sm">
              Earn Rewards
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mt-4 mb-6">
              BOUNTIES
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mb-8">
              Open-source tasks with real rewards. Build for the Sui ecosystem and get paid.
            </p>
            <div className="flex gap-8">
              <div>
                <div className="text-4xl font-black text-white">{BOUNTIES.length}</div>
                <div className="text-white/60 text-sm font-bold uppercase tracking-widest">Open Bounties</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white">${totalRewards.toLocaleString()}+</div>
                <div className="text-white/60 text-sm font-bold uppercase tracking-widest">Total Rewards</div>
              </div>
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
                placeholder="SEARCH BOUNTIES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-none border-2 border-sui-ocean font-bold uppercase tracking-wide placeholder:text-sui-ocean/40"
              />
            </div>
            <Button
              asChild
              className="h-12 bg-sui-ocean hover:bg-walrus-teal text-white font-bold uppercase tracking-wide rounded-none px-8"
            >
              <Link href="/bounties/create">
                + POST BOUNTY
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Bounties Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {filteredBounties.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sui-ocean/60 font-bold uppercase tracking-wide mb-4">
                No bounties found
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="rounded-none border-2 border-sui-ocean font-bold uppercase"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBounties.map((bounty) => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
