"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { Plus, Share2, Twitter, Instagram, Linkedin, Facebook, Target } from "lucide-react";
import Link from "next/link";

type SocialQuest = Database["public"]["Tables"]["social_quests"]["Row"];

export default function SocialQuestPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [quests, setQuests] = useState<SocialQuest[]>([]);
  const [myQuests, setMyQuests] = useState<SocialQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    context: "",
    hashtags: "",
    social_platforms: [] as string[],
    ai_prompt: ""
  });

  useEffect(() => {
    if (user) {
      const loadQuests = async () => {
        try {
          const { data: allQuests } = await supabase
            .from("social_quests")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

          if (allQuests) {
            setQuests(allQuests);
            const myQuests = allQuests.filter(quest => quest.organizer_id === user?.id);
            setMyQuests(myQuests);
          }
        } catch (error) {
          console.error("Error fetching quests:", error);
        } finally {
          setLoading(false);
        }
      };
      
      loadQuests();
    }
  }, [user]);





  const createQuest = async () => {
    if (!user || !newQuest.title.trim() || !newQuest.context.trim()) return;

    try {
      const { data, error } = await supabase
        .from("social_quests")
        .insert({
          title: newQuest.title,
          description: newQuest.description || null,
          context: newQuest.context,
          hashtags: newQuest.hashtags,
          social_platforms: newQuest.social_platforms,
          ai_prompt: newQuest.ai_prompt || "Generate an engaging social media post",
          organizer_id: user.id,
          organizer_name: profile?.name || user.email?.split("@")[0] || "Anonymous"
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMyQuests(prev => [data, ...prev]);
        setQuests(prev => [data, ...prev]);
        setNewQuest({
          title: "",
          description: "",
          context: "",
          hashtags: "",
          social_platforms: [],
          ai_prompt: ""
        });
        setCreateDialogOpen(false);
        router.push(`/tools/social-quest/${data.id}`);
      }
    } catch (error) {
      console.error("Error creating quest:", error);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sui-sea"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-bright-turquoise to-crucible-orange rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-bright-turquoise to-crucible-orange text-white p-4 rounded-full">
                <Share2 className="w-8 h-8" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-bright-turquoise to-crucible-orange bg-clip-text text-transparent mb-4">
            Social Quest
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Create viral social media campaigns with AI-powered messaging! 
            Organizers can craft engaging quests and participants get ready-to-share content.
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-bright-turquoise to-crucible-orange hover:from-bright-turquoise/90 hover:to-crucible-orange/90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Social Quest
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Social Quest</DialogTitle>
                  <DialogDescription>
                    Create an engaging social media campaign with AI-generated messages for different platforms.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Quest Title</Label>
                    <Input
                      id="title"
                      value={newQuest.title}
                      onChange={(e) => setNewQuest(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter quest title"
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newQuest.description}
                      onChange={(e) => setNewQuest(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your social quest"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="context">Campaign Context</Label>
                    <Textarea
                      id="context"
                      value={newQuest.context}
                      onChange={(e) => setNewQuest(prev => ({ ...prev, context: e.target.value }))}
                      placeholder="What should people share about? (e.g., 'We're launching a new Sui hackathon')"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hashtags">Hashtags</Label>
                    <Input
                      id="hashtags"
                      value={newQuest.hashtags}
                      onChange={(e) => setNewQuest(prev => ({ ...prev, hashtags: e.target.value }))}
                      placeholder="#Sui #Hackathon #Web3"
                    />
                  </div>
                  <div>
                    <Label>Social Platforms</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['twitter', 'instagram', 'linkedin', 'facebook'].map((platform) => (
                        <Button
                          key={platform}
                          type="button"
                          variant={newQuest.social_platforms.includes(platform) ? "default" : "outline"}
                          onClick={() => {
                            const updated = newQuest.social_platforms.includes(platform)
                              ? newQuest.social_platforms.filter(p => p !== platform)
                              : [...newQuest.social_platforms, platform];
                            setNewQuest(prev => ({ ...prev, social_platforms: updated }));
                          }}
                          className="justify-start"
                        >
                          {platform === 'twitter' && <Twitter className="w-4 h-4 mr-2" />}
                          {platform === 'instagram' && <Instagram className="w-4 h-4 mr-2" />}
                          {platform === 'linkedin' && <Linkedin className="w-4 h-4 mr-2" />}
                          {platform === 'facebook' && <Facebook className="w-4 h-4 mr-2" />}
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={createQuest} className="w-full bg-gradient-to-r from-bright-turquoise to-crucible-orange">
                    Create Quest
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* My Quests Section */}
        {myQuests.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-walrus-teal mr-2" />
                <h2 className="text-3xl font-bold text-walrus-teal">My Quests</h2>
              </div>
              <p className="text-muted-foreground">Your created social campaigns</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myQuests.map((quest) => (
                <Card key={quest.id} className="border-2 border-storm-200 hover:border-walrus-teal transition-all duration-300 bg-white shadow-lg hover:shadow-xl group transform hover:scale-105">
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-walrus-teal transition-colors">{quest.title}</CardTitle>
                    <CardDescription className="text-base">
                      {quest.description || "No description"}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {quest.social_platforms.map((platform) => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform === 'twitter' && <Twitter className="w-3 h-3 mr-1" />}
                          {platform === 'instagram' && <Instagram className="w-3 h-3 mr-1" />}
                          {platform === 'linkedin' && <Linkedin className="w-3 h-3 mr-1" />}
                          {platform === 'facebook' && <Facebook className="w-3 h-3 mr-1" />}
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <strong>Context:</strong> {quest.context}
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" className="bg-walrus-teal hover:bg-walrus-teal/90 text-white">
                          <Link href={`/tools/social-quest/${quest.id}`}>View Quest</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/tools/social-quest/${quest.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Quests Section */}
        <div>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-2">
                                <Target className="w-6 h-6 text-sui-sea mr-2" />
              <h2 className="text-3xl font-bold text-sui-sea">Available Quests</h2>
            </div>
            <p className="text-muted-foreground">Join social campaigns and share amazing content</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quests.map((quest) => (
              <Card key={quest.id} className="border-2 border-storm-200 hover:border-sui-sea transition-all duration-300 bg-white shadow-lg hover:shadow-xl group transform hover:scale-105">
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-sui-sea transition-colors">{quest.title}</CardTitle>
                  <CardDescription className="text-base">
                    {quest.description || "No description"}
                  </CardDescription>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {quest.social_platforms.map((platform) => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform === 'twitter' && <Twitter className="w-3 h-3 mr-1" />}
                        {platform === 'instagram' && <Instagram className="w-3 h-3 mr-1" />}
                        {platform === 'linkedin' && <Linkedin className="w-3 h-3 mr-1" />}
                        {platform === 'facebook' && <Facebook className="w-3 h-3 mr-1" />}
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <strong>Context:</strong> {quest.context}
                    </div>
                    <Button asChild size="sm" variant="outline" className="border-sui-sea text-sui-sea hover:bg-sui-sea hover:text-white w-full">
                      <Link href={`/tools/social-quest/${quest.id}`}>Join Quest</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {quests.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-xl mb-4">No social quests available yet</p>
              <p className="text-lg">Be the first to create a viral campaign! 🚀</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

