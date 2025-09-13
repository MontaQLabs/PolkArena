"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  Plus,
  Mail,
  Github,
} from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Team {
  id: string;
  name: string;
  description: string;
  slug: string;
  created_at: string;
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}

interface Hackathon {
  id: string;
  title: string;
  status: string;
}

export default function TeamsPage() {
  const params = useParams();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hackathonId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        // Fetch hackathon
        const { data: hackathonData, error: hackathonError } = await supabase
          .from("hackathons")
          .select("id, title, status")
          .eq("id", hackathonId)
          .single();

        if (hackathonError) {
          console.error("Error fetching hackathon:", hackathonError);
          toast.error("Failed to load hackathon");
          router.push("/hackathons");
          return;
        }

        setHackathon(hackathonData);

        // Fetch teams with members
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select(
            `
            *,
            members:team_members(
              id,
              user_id,
              role,
              joined_at,
              user:users(name, email)
            )
          `
          )
          .eq("hackathon_id", hackathonId)
          .order("created_at", { ascending: false });

        if (teamsError) {
          console.error("Error fetching teams:", teamsError);
          toast.error("Failed to load teams");
          return;
        }

        // console.log("Fetched teams:", teamsData);
        setTeams(teamsData || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load teams");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const isUserInTeam = (team: Team) => {
    if (!user) return false;
    return team.members.some((member) => member.user_id === user.id);
  };

  const isUserTeamLeader = (team: Team) => {
    if (!user) return false;
    const isLeader = team.members.some(
      (member) => member.user_id === user.id && member.role === "leader"
    );
    // console.log(
    //   "Team:",
    //   team.name,
    //   "User ID:",
    //   user.id,
    //   "Is Leader:",
    //   isLeader,
    //   "Members:",
    //   team.members
    // );
    return isLeader;
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-crucible-orange" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Hackathon Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The hackathon you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/hackathons">Back to Hackathons</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm">
                <Link href={`/hackathons/${hackathon.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Hackathon
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Teams</h1>
                <p className="text-muted-foreground">
                  Browse teams for {hackathon.title}
                </p>
              </div>
              <Button
                asChild
                className="bg-crucible-orange hover:bg-crucible-orange/90"
              >
                <Link href={`/hackathons/${hackathon.id}/teams/create`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Link>
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Teams Grid */}
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Teams Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No teams match your search criteria."
                  : "No teams have been created yet for this hackathon."}
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href={`/hackathons/${hackathon.id}/teams/create`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create the First Team
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team) => {
                const userInTeam = isUserInTeam(team);
                const userIsLeader = isUserTeamLeader(team);
                // console.log(
                //   `Team ${team.name}: User in team: ${userInTeam}, User is leader: ${userIsLeader}`
                // );

                return (
                  <Card
                    key={team.id}
                    className="group hover:shadow-lg transition-all duration-200"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="group-hover:text-crucible-orange transition-colors">
                          {team.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {team.members.length} member
                          {team.members.length !== 1 ? "s" : ""}
                        </span>
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {team.description || "No description available"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Team Members */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Team Members</h4>
                        <div className="space-y-1">
                          {team.members.slice(0, 3).map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {member.user?.name ||
                                  member.user?.email ||
                                  "Unknown"}
                                {member.role === "leader" && (
                                  <span className="ml-2 text-xs bg-crucible-orange text-white px-1 rounded">
                                    Leader
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                          {team.members.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{team.members.length - 3} more member
                              {team.members.length - 3 !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 space-y-2">
                        {userInTeam ? (
                          <div className="space-y-2">
                            <Button
                              disabled
                              variant="outline"
                              className="w-full"
                            >
                              Already a Member
                            </Button>
                            {userIsLeader && (
                              <Button
                                asChild
                                variant="outline"
                                className="w-full"
                              >
                                <Link href={`/teams/${team.id}/invite`}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Invite Members
                                </Link>
                              </Button>
                            )}
                            <Button
                              asChild
                              variant="outline"
                              className="w-full"
                            >
                              <Link href={`/teams/${team.id}/submit`}>
                                <Github className="h-4 w-4 mr-2" />
                                Submit Project
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            asChild
                            variant="outline"
                            className="w-full"
                            disabled={!user}
                          >
                            <Link href={`/teams/${team.id}/invite`}>
                              <Mail className="h-4 w-4 mr-2" />
                              Request to Join
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
