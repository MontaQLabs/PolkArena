"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal, Award, Users, Calendar } from "lucide-react";
import Link from "next/link";

interface Winner {
  id: string;
  team_id: string;
  hackathon_id: string;
  rank: number;
  prize_text: string;
  announced_at: string;
  team: {
    name: string;
    description: string;
    hackathon_id: string;
  };
  hackathon: {
    title: string;
    start_date: string;
    end_date: string;
  };
}

export default function LeaderboardPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHackathon, setSelectedHackathon] = useState<string>("all");

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("winners")
          .select(
            `
            *,
            team:teams(name, description, hackathon_id),
            hackathon:hackathons(title, start_date, end_date)
          `
          )
          .order("rank", { ascending: true });

        if (error) {
          console.error("Error fetching winners:", error);
          toast.error("Failed to load leaderboard");
          return;
        }

        setWinners(data || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <span className="h-6 w-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
            #{rank}
          </span>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-500 to-amber-700 text-white";
      default:
        return "bg-muted";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredWinners =
    selectedHackathon === "all"
      ? winners
      : winners.filter((winner) => winner.hackathon_id === selectedHackathon);

  const uniqueHackathons = Array.from(
    new Set(winners.map((w) => w.hackathon_id))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-crucible-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Leaderboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Celebrating the best projects from Polkadot hackathons
            </p>
          </div>

          {/* Filter */}
          {uniqueHackathons.length > 0 && (
            <div className="flex justify-center mb-8">
              <div className="flex gap-2">
                <Button
                  variant={selectedHackathon === "all" ? "default" : "outline"}
                  onClick={() => setSelectedHackathon("all")}
                  className={
                    selectedHackathon === "all"
                      ? "bg-crucible-orange hover:bg-crucible-orange/90"
                      : ""
                  }
                >
                  All Hackathons
                </Button>
                {uniqueHackathons.map((hackathonId) => {
                  const hackathon = winners.find(
                    (w) => w.hackathon_id === hackathonId
                  )?.hackathon;
                  return (
                    <Button
                      key={hackathonId}
                      variant={
                        selectedHackathon === hackathonId
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setSelectedHackathon(hackathonId)}
                      className={
                        selectedHackathon === hackathonId
                          ? "bg-crucible-orange hover:bg-crucible-orange/90"
                          : ""
                      }
                    >
                      {hackathon?.title || "Unknown Hackathon"}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Winners Grid */}
          {filteredWinners.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Winners Yet</h3>
              <p className="text-muted-foreground mb-4">
                {selectedHackathon === "all"
                  ? "No hackathons have been completed yet. Check back soon for winners!"
                  : "This hackathon hasn't been completed yet."}
              </p>
              <Button asChild>
                <Link href="/hackathons">Browse Hackathons</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWinners.map((winner) => (
                <Card
                  key={winner.id}
                  className="group hover:shadow-lg transition-all duration-200"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div
                        className={`${getRankColor(
                          winner.rank
                        )} p-3 rounded-lg`}
                      >
                        {getRankIcon(winner.rank)}
                      </div>
                      <Badge variant="secondary">
                        {winner.rank === 1
                          ? "1st Place"
                          : winner.rank === 2
                          ? "2nd Place"
                          : winner.rank === 3
                          ? "3rd Place"
                          : `${winner.rank}th Place`}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">
                      {winner.team?.name || "Unknown Team"}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {winner.team?.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Hackathon</h4>
                      <p className="text-sm text-muted-foreground">
                        {winner.hackathon?.title || "Unknown Hackathon"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Event Period</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {winner.hackathon?.start_date &&
                          winner.hackathon?.end_date
                            ? `${formatDate(
                                winner.hackathon.start_date
                              )} - ${formatDate(winner.hackathon.end_date)}`
                            : "Dates not available"}
                        </span>
                      </div>
                    </div>

                    {winner.prize_text && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Prize</h4>
                        <p className="text-sm text-muted-foreground">
                          {winner.prize_text}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/hackathons/${winner.hackathon_id}`}>
                          View Hackathon
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats */}
          {winners.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-center mb-6">
                Leaderboard Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="text-center pt-6">
                    <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                      {winners.filter((w) => w.rank === 1).length}
                    </p>
                    <p className="text-muted-foreground">First Place Winners</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center pt-6">
                    <Users className="h-8 w-8 text-crucible-orange mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                      {uniqueHackathons.length}
                    </p>
                    <p className="text-muted-foreground">
                      Hackathons Completed
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center pt-6">
                    <Award className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{winners.length}</p>
                    <p className="text-muted-foreground">Total Winners</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
