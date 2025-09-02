"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { Twitter, Instagram, Linkedin, Facebook, Copy, Check, Share2, Sparkles, Users, Target, ArrowLeft } from "lucide-react";

type SocialQuest = Database["public"]["Tables"]["social_quests"]["Row"];
type SocialQuestParticipant = Database["public"]["Tables"]["social_quest_participants"]["Row"];

export default function SocialQuestViewPage() {
  const { user, profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const questId = params.id as string;

  const [quest, setQuest] = useState<SocialQuest | null>(null);
  const [participants, setParticipants] = useState<SocialQuestParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    if (user && questId) {
      const loadQuestData = async () => {
        try {
          // Fetch quest
          const { data: questData, error: questError } = await supabase
            .from("social_quests")
            .select("*")
            .eq("id", questId)
            .eq("is_active", true)
            .single();

          if (questError || !questData) {
            router.push("/tools/social-quest");
            return;
          }

          setQuest(questData);

          // Fetch participants
          const { data: participantsData } = await supabase
            .from("social_quest_participants")
            .select("*")
            .eq("quest_id", questId)
            .order("shared_at", { ascending: false });

          if (participantsData) {
            setParticipants(participantsData);
          }

          // Check if user is already a participant
          if (user) {
            const { data: existingParticipant } = await supabase
              .from("social_quest_participants")
              .select("*")
              .eq("quest_id", questId)
              .eq("user_id", user.id)
              .single();

            setIsParticipant(!!existingParticipant);
          }
        } catch (error) {
          console.error("Error fetching quest data:", error);
        } finally {
          setLoading(false);
        }
      };
      
      loadQuestData();
    }
  }, [user, questId, router]);







  const joinQuest = async () => {
    if (!user || !quest) return;

    try {
      const { data: participant, error } = await supabase
        .from("social_quest_participants")
        .insert({
          quest_id: questId,
          user_id: user.id,
          display_name: profile?.name || user.email?.split("@")[0] || "Anonymous",
          shared_on: []
        })
        .select()
        .single();

      if (error) throw error;

      if (participant) {
        setIsParticipant(true);
        setParticipants(prev => [participant, ...prev]);
      }
    } catch (error) {
      console.error("Error joining quest:", error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      default: return <Share2 className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitter': return 'bg-blue-500 hover:bg-blue-600';
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600';
      case 'linkedin': return 'bg-blue-700 hover:bg-blue-800';
      case 'facebook': return 'bg-blue-600 hover:bg-blue-700';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-polkadot-pink"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Quest not found</h1>
            <Button onClick={() => router.push("/tools/social-quest")}>
              Back to Social Quests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/tools/social-quest")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Social Quests
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-bright-turquoise to-polkadot-pink bg-clip-text text-transparent mb-4">
              {quest.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              {quest.description}
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge variant="secondary" className="text-sm">
                <Users className="w-3 h-3 mr-1" />
                {participants.length} Participants
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <Target className="w-3 h-3 mr-1" />
                {quest.social_platforms.length} Platforms
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Quest Details */}
          <div className="space-y-6">
            <Card className="border-2 border-storm-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-polkadot-pink">Quest Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Campaign Context</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {quest.context}
                  </p>
                </div>
                
                {quest.hashtags && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Hashtags</h3>
                    <p className="text-blue-600 font-mono bg-blue-50 p-3 rounded-lg">
                      {quest.hashtags}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Organized by</h3>
                  <p className="text-gray-600">{quest.organizer_name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="border-2 border-storm-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-bright-turquoise">Participants</CardTitle>
                <CardDescription>Join the social campaign!</CardDescription>
              </CardHeader>
              <CardContent>
                {!isParticipant ? (
                  <Button 
                    onClick={joinQuest}
                    className="w-full bg-gradient-to-r from-bright-turquoise to-polkadot-pink text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Join Quest
                  </Button>
                ) : (
                  <div className="text-center">
                    <Badge className="bg-green-500 text-white mb-4">
                      ✓ You&apos;re participating!
                    </Badge>
                    <p className="text-sm text-gray-600">
                      Share the messages below on your social media platforms
                    </p>
                  </div>
                )}
                
                {participants.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-gray-700">Recent Participants</h4>
                    {participants.slice(0, 5).map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{participant.display_name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(participant.shared_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Generated Messages */}
          <div className="space-y-6">
            <Card className="border-2 border-storm-200 bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-bright-turquoise" />
                  <CardTitle className="text-2xl text-bright-turquoise">AI Generated Messages</CardTitle>
                </div>
                <CardDescription>
                  Ready-to-share content for each platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quest.social_platforms.map((platform) => {
                  const message = `🚀 ${quest.context}\n\nJoin the conversation and be part of something amazing! ${quest.hashtags || ""}`;
                  return (
                    <div key={platform} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(platform)}
                          <span className="font-semibold capitalize">{platform}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(message);
                            setCopiedPlatform(platform);
                            setTimeout(() => setCopiedPlatform(null), 2000);
                          }}
                          className={getPlatformColor(platform)}
                        >
                          {copiedPlatform === platform ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                        {message}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Share Instructions */}
            <Card className="border-2 border-storm-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-polkadot-pink">How to Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-polkadot-pink text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                    1
                  </div>
                  <p className="text-gray-600">Copy the AI-generated message for your preferred platform</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-polkadot-pink text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                    2
                  </div>
                  <p className="text-gray-600">Paste it into your social media post</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-polkadot-pink text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                    3
                  </div>
                  <p className="text-gray-600">Share and help spread the word!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
