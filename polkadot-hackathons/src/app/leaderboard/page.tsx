"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";

// Hardcoded winners/leaderboard data
const WINNERS = [
  {
    id: "1",
    rank: 1,
    team_name: "WALRUS WARRIORS",
    project_name: "WalrusFS",
    description: "Decentralized file system built on Walrus with FUSE integration.",
    hackathon: "Sui Overflow Hong Kong 2025",
    prize: "$25,000 USDC",
    members: ["Alex Chen", "Maria Santos", "Dev Kumar"],
    technologies: ["Walrus", "Rust", "Move"],
  },
  {
    id: "2",
    rank: 2,
    team_name: "MOVE MASTERS",
    project_name: "SuiSwap Pro",
    description: "Advanced DEX with concentrated liquidity and limit orders on Sui.",
    hackathon: "Sui Overflow Hong Kong 2025",
    prize: "$15,000 USDC",
    members: ["John Smith", "Lisa Wang"],
    technologies: ["Sui", "DeFi", "Move"],
  },
  {
    id: "3",
    rank: 3,
    team_name: "BLOCKCHAIN BUILDERS",
    project_name: "NFT Marketplace",
    description: "Gas-optimized NFT marketplace with royalty enforcement.",
    hackathon: "Sui Overflow Hong Kong 2025",
    prize: "$10,000 USDC",
    members: ["Sarah Johnson", "Mike Brown", "Raj Patel"],
    technologies: ["NFT", "Move", "React"],
  },
  {
    id: "4",
    rank: 1,
    team_name: "STORAGE SQUAD",
    project_name: "WalrusDB",
    description: "Distributed database layer built on Walrus for dApps.",
    hackathon: "Walrus Hack Singapore 2025",
    prize: "$20,000 USDC",
    members: ["Emily Zhang", "Tom Lee"],
    technologies: ["Walrus", "Database", "Go"],
  },
  {
    id: "5",
    rank: 2,
    team_name: "DEFI DREAMERS",
    project_name: "SuiLend",
    description: "Overcollateralized lending protocol with dynamic interest rates.",
    hackathon: "Walrus Hack Singapore 2025",
    prize: "$12,000 USDC",
    members: ["Chris Park", "Anna Kim", "James Liu"],
    technologies: ["DeFi", "Sui", "Move"],
  },
  {
    id: "6",
    rank: 1,
    team_name: "GAMING GURUS",
    project_name: "SuiQuest",
    description: "On-chain RPG with fully composable game assets.",
    hackathon: "Sui India Hackathon 2025",
    prize: "$15,000 USDC",
    members: ["Priya Sharma", "Arun Reddy"],
    technologies: ["Gaming", "NFT", "Move"],
  },
];

const HACKATHONS = [
  { id: "all", name: "ALL HACKATHONS" },
  { id: "hk-2025", name: "Sui Overflow Hong Kong 2025" },
  { id: "sg-2025", name: "Walrus Hack Singapore 2025" },
  { id: "in-2025", name: "Sui India Hackathon 2025" },
];

function WinnerCard({ winner }: { winner: typeof WINNERS[0] }) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: "bg-yellow-400", text: "text-yellow-400", icon: Trophy };
      case 2:
        return { bg: "bg-gray-300", text: "text-gray-300", icon: Medal };
      case 3:
        return { bg: "bg-amber-600", text: "text-amber-600", icon: Award };
      default:
        return { bg: "bg-sui-ocean", text: "text-sui-ocean", icon: Award };
    }
  };

  const { bg, text, icon: RankIcon } = getRankStyle(winner.rank);

  return (
    <div className="bg-white border-2 border-sui-ocean group hover:border-sui-sea transition-colors duration-150">
      {/* Rank bar */}
      <div className={`${bg} px-4 py-3 flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <RankIcon className="h-5 w-5 text-sui-ocean" />
          <span className="text-sui-ocean text-sm font-black uppercase tracking-widest">
            {winner.rank === 1 ? "1ST PLACE" : winner.rank === 2 ? "2ND PLACE" : "3RD PLACE"}
          </span>
        </div>
        <span className="text-sui-ocean/80 text-xs font-bold">
          {winner.prize}
        </span>
      </div>

      <div className="p-6">
        {/* Team name */}
        <h3 className="text-xl font-black text-sui-ocean uppercase tracking-tight mb-1">
          {winner.team_name}
        </h3>

        {/* Project name */}
        <p className={`${text} font-bold text-lg mb-3`}>
          {winner.project_name}
        </p>

        {/* Description */}
        <p className="text-sui-ocean/70 mb-4 text-sm">
          {winner.description}
        </p>

        {/* Hackathon */}
        <p className="text-sui-ocean/50 text-xs font-bold uppercase tracking-widest mb-4">
          {winner.hackathon}
        </p>

        {/* Team members */}
        <div className="mb-4">
          <p className="text-sui-ocean/50 text-xs font-bold uppercase tracking-widest mb-2">
            Team Members
          </p>
          <div className="flex flex-wrap gap-1">
            {winner.members.map((member) => (
              <span
                key={member}
                className="px-2 py-1 bg-sui-ocean/5 text-sui-ocean text-xs font-medium"
              >
                {member}
              </span>
            ))}
          </div>
        </div>

        {/* Technologies */}
        <div className="flex flex-wrap gap-2">
          {winner.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 bg-sui-sea/10 text-sui-sea text-xs font-bold uppercase tracking-wide"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [selectedHackathon, setSelectedHackathon] = useState("all");

  const filteredWinners = selectedHackathon === "all"
    ? WINNERS
    : WINNERS.filter((w) => {
        if (selectedHackathon === "hk-2025") return w.hackathon.includes("Hong Kong");
        if (selectedHackathon === "sg-2025") return w.hackathon.includes("Singapore");
        if (selectedHackathon === "in-2025") return w.hackathon.includes("India");
        return true;
      });

  const stats = {
    totalWinners: WINNERS.length,
    totalPrize: "$97,000+",
    hackathonsCompleted: 3,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-sui-ocean py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <span className="text-walrus-teal font-bold uppercase tracking-widest text-sm">
              Hall of Fame
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mt-4 mb-6">
              LEADERBOARD
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mb-8">
              Celebrating the builders who shipped winning projects on Sui.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg">
              <div>
                <div className="text-4xl font-black text-yellow-400">{stats.totalWinners}</div>
                <div className="text-white/50 text-xs font-bold uppercase tracking-widest">Winners</div>
              </div>
              <div>
                <div className="text-4xl font-black text-sui-sea">{stats.totalPrize}</div>
                <div className="text-white/50 text-xs font-bold uppercase tracking-widest">Awarded</div>
              </div>
              <div>
                <div className="text-4xl font-black text-walrus-teal">{stats.hackathonsCompleted}</div>
                <div className="text-white/50 text-xs font-bold uppercase tracking-widest">Hackathons</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b-2 border-sui-ocean py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {HACKATHONS.map((hackathon) => (
              <Button
                key={hackathon.id}
                onClick={() => setSelectedHackathon(hackathon.id)}
                className={`rounded-none font-bold uppercase tracking-wide transition-colors ${
                  selectedHackathon === hackathon.id
                    ? "bg-sui-ocean text-white"
                    : "bg-transparent text-sui-ocean border-2 border-sui-ocean hover:bg-sui-ocean hover:text-white"
                }`}
              >
                {hackathon.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Winners Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {filteredWinners.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-16 w-16 text-sui-ocean/20 mx-auto mb-4" />
              <p className="text-sui-ocean/60 font-bold uppercase tracking-wide mb-4">
                No winners yet for this hackathon
              </p>
              <Button asChild className="rounded-none bg-sui-sea font-bold uppercase">
                <Link href="/hackathons">Browse Hackathons</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWinners.map((winner) => (
                <WinnerCard key={winner.id} winner={winner} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-walrus-teal py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-4">
            WANT TO BE HERE?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Join the next hackathon and ship a winning project on Sui.
          </p>
          <Button
            asChild
            className="bg-white text-walrus-teal hover:bg-sui-ocean hover:text-white font-bold uppercase tracking-wide rounded-none px-10 py-6 text-lg"
          >
            <Link href="/hackathons">
              Join a Hackathon
              <ArrowUpRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
