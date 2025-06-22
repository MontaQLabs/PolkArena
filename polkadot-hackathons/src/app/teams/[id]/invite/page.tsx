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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, Users } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Team {
  id: string;
  name: string;
  description: string;
  hackathon_id: string;
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  hackathon: {
    title: string;
  };
}

interface Invitation {
  id: string;
  invitee_email: string;
  message: string;
  status: string;
  created_at: string;
  inviter: {
    name: string;
    email: string;
  };
}

export default function TeamInvitePage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    message: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          toast.error("Please sign in to access team invitations");
          router.push("/auth/signin");
          return;
        }

        // Fetch team with members and hackathon info
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select(
            `
            *,
            members:team_members(
              id,
              user_id,
              role,
              user:users(name, email)
            ),
            hackathon:hackathons(title)
          `
          )
          .eq("id", teamId)
          .single();

        if (teamError) {
          console.error("Error fetching team:", teamError);
          toast.error("Failed to load team");
          router.push("/hackathons");
          return;
        }

        setTeam(teamData);

        // Check if user is team leader
        const isUserLeader = teamData.members.some(
          (member: { user_id: string; role: string }) =>
            member.user_id === user.id && member.role === "leader"
        );
        setIsLeader(isUserLeader);

        // Fetch existing invitations
        const { data: invitationsData } = await supabase
          .from("team_invitations")
          .select(
            `
            *,
            inviter:users(name, email)
          `
          )
          .eq("team_id", teamId)
          .order("created_at", { ascending: false });

        setInvitations(invitationsData || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load team");
        router.push("/hackathons");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !team) return;

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("team_invitations").insert({
        team_id: team.id,
        inviter_id: user.id,
        invitee_email: formData.email.trim().toLowerCase(),
        message: formData.message.trim() || null,
      });

      if (error) {
        console.error("Error sending invitation:", error);
        toast.error("Failed to send invitation");
        return;
      }

      toast.success("Invitation sent successfully!");
      setFormData({ email: "", message: "" });

      // Refresh invitations list
      const { data: invitationsData } = await supabase
        .from("team_invitations")
        .select(
          `
          *,
          inviter:users(name, email)
        `
        )
        .eq("team_id", team.id)
        .order("created_at", { ascending: false });

      setInvitations(invitationsData || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("team_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) {
        console.error("Error canceling invitation:", error);
        toast.error("Failed to cancel invitation");
        return;
      }

      toast.success("Invitation canceled");
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to cancel invitation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-polkadot-pink" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Team Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The team you&apos;re looking for doesn&apos;t exist.
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="outline" size="sm">
              <Link href={`/hackathons/${team.hackathon_id}/teams`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teams
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {isLeader ? "Invite Members" : "Request to Join"}
              </h1>
              <p className="text-muted-foreground">
                {isLeader
                  ? `Invite people to join ${team.name}`
                  : `Request to join ${team.name}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Invitation Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {isLeader ? "Send Invitation" : "Request to Join"}
                  </CardTitle>
                  <CardDescription>
                    {isLeader
                      ? "Invite someone to join your team by sending them an email invitation."
                      : "Send a request to join this team. The team leader will review your request."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendInvitation} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder={
                          isLeader
                            ? "Tell them why you'd like them to join your team..."
                            : "Tell the team leader why you'd like to join..."
                        }
                        value={formData.message}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            message: e.target.value,
                          }))
                        }
                        rows={4}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={sending || !formData.email.trim()}
                      className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      {isLeader ? "Send Invitation" : "Send Request"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Team Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {team.hackathon.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {team.description || "No description available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Current Members ({team.members.length})
                    </p>
                    <div className="mt-2 space-y-1">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {member.user?.name ||
                              member.user?.email ||
                              "Unknown"}
                          </span>
                          {member.role === "leader" && (
                            <span className="text-xs bg-polkadot-pink text-white px-1 rounded">
                              Leader
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invitations List */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Invitations</CardTitle>
                  <CardDescription>
                    {isLeader
                      ? "Invitations you have sent"
                      : "Your requests to join this team"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invitations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No invitations yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {invitation.invitee_email}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                invitation.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : invitation.status === "accepted"
                                  ? "bg-green-100 text-green-800"
                                  : invitation.status === "declined"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {invitation.status.charAt(0).toUpperCase() +
                                invitation.status.slice(1)}
                            </span>
                          </div>
                          {invitation.message && (
                            <p className="text-sm text-muted-foreground mb-2">
                              &ldquo;{invitation.message}&rdquo;
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Sent{" "}
                              {new Date(
                                invitation.created_at
                              ).toLocaleDateString()}
                            </span>
                            {isLeader && invitation.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCancelInvitation(invitation.id)
                                }
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
