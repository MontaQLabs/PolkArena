"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { Plus, Share2, Twitter, ArrowUpRight } from "lucide-react";
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

  const platformIcons: Record<string, React.ReactNode> = {
    twitter: <Twitter className="w-4 h-4" />,
    instagram: <span className="text-sm font-bold">IG</span>,
    linkedin: <span className="text-sm font-bold">in</span>,
    facebook: <span className="text-sm font-bold">f</span>,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sui-ocean font-bold text-xl uppercase tracking-widest">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-sui-ocean py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-walrus-teal p-3">
                <Share2 className="h-8 w-8 text-white" />
              </div>
              <span className="text-white/80 font-bold uppercase tracking-widest text-sm">
                Event Tool
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mb-6">
              SOCIAL QUEST
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mb-8">
              Create viral social media campaigns with AI-powered messaging. Organizers craft engaging quests and participants get ready-to-share content.
            </p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-walrus-teal hover:bg-white hover:text-sui-ocean text-white font-bold uppercase tracking-wide px-8 py-6 rounded-none transition-all duration-150">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Quest
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl rounded-none border-4 border-sui-ocean">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-sui-ocean uppercase">Create Social Quest</DialogTitle>
                  <DialogDescription className="text-sui-ocean/60">
                    Create an engaging social media campaign with AI-generated messages.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="font-bold uppercase text-sm">Quest Title</Label>
                    <Input
                      id="title"
                      value={newQuest.title}
                      onChange={(e) => setNewQuest(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter quest title"
                      className="rounded-none border-2 border-sui-ocean"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="font-bold uppercase text-sm">Description</Label>
                    <Textarea
                      id="description"
                      value={newQuest.description}
                      onChange={(e) => setNewQuest(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your social quest"
                      rows={2}
                      className="rounded-none border-2 border-sui-ocean"
                    />
                  </div>
                  <div>
                    <Label htmlFor="context" className="font-bold uppercase text-sm">Campaign Context</Label>
                    <Textarea
                      id="context"
                      value={newQuest.context}
                      onChange={(e) => setNewQuest(prev => ({ ...prev, context: e.target.value }))}
                      placeholder="What should people share about?"
                      rows={2}
                      className="rounded-none border-2 border-sui-ocean"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hashtags" className="font-bold uppercase text-sm">Hashtags</Label>
                    <Input
                      id="hashtags"
                      value={newQuest.hashtags}
                      onChange={(e) => setNewQuest(prev => ({ ...prev, hashtags: e.target.value }))}
                      placeholder="#Sui #Hackathon #Web3"
                      className="rounded-none border-2 border-sui-ocean"
                    />
                  </div>
                  <div>
                    <Label className="font-bold uppercase text-sm">Social Platforms</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['twitter', 'instagram', 'linkedin', 'facebook'].map((platform) => (
                        <Button
                          key={platform}
                          type="button"
                          onClick={() => {
                            const updated = newQuest.social_platforms.includes(platform)
                              ? newQuest.social_platforms.filter(p => p !== platform)
                              : [...newQuest.social_platforms, platform];
                            setNewQuest(prev => ({ ...prev, social_platforms: updated }));
                          }}
                          className={`justify-start rounded-none font-bold uppercase ${
                            newQuest.social_platforms.includes(platform) 
                              ? 'bg-sui-sea text-white' 
                              : 'bg-gray-100 text-sui-ocean hover:bg-sui-ocean hover:text-white'
                          }`}
                        >
                          {platformIcons[platform]}
                          <span className="ml-2">{platform}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={createQuest} className="w-full bg-walrus-teal hover:bg-sui-ocean text-white font-bold uppercase rounded-none py-6">
                    Create Quest
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* My Quests Section */}
      {myQuests.length > 0 && (
        <section className="py-16 bg-walrus-teal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-8">My Quests</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myQuests.map((quest) => (
                <div 
                  key={quest.id} 
                  className="bg-white p-6 border-4 border-white hover:border-sui-ocean transition-colors"
                >
                  <h3 className="text-xl font-black text-sui-ocean uppercase tracking-wide mb-2">
                    {quest.title}
                  </h3>
                  <p className="text-sui-ocean/60 mb-4 line-clamp-2">
                    {quest.description || "No description"}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quest.social_platforms.map((platform) => (
                      <span key={platform} className="bg-sui-ocean/10 text-sui-ocean text-xs font-bold uppercase px-2 py-1">
                        {platform}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-sui-ocean/50 mb-4 line-clamp-2">
                    <strong>Context:</strong> {quest.context}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild className="bg-walrus-teal hover:bg-sui-ocean text-white font-bold uppercase text-sm rounded-none px-4 py-2">
                      <Link href={`/tools/social-quest/${quest.id}`}>View</Link>
                    </Button>
                    <Button asChild className="bg-sui-ocean/10 hover:bg-sui-ocean text-sui-ocean hover:text-white font-bold uppercase text-sm rounded-none px-4 py-2">
                      <Link href={`/tools/social-quest/${quest.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Available Quests Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-sui-ocean uppercase tracking-tight mb-8">Available Quests</h2>
          {quests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quests.map((quest) => (
                <div 
                  key={quest.id} 
                  className="bg-white border-4 border-sui-ocean p-6 hover:bg-sui-ocean hover:text-white group transition-colors"
                >
                  <h3 className="text-xl font-black text-sui-ocean group-hover:text-white uppercase tracking-wide mb-2">
                    {quest.title}
                  </h3>
                  <p className="text-sui-ocean/60 group-hover:text-white/70 mb-4 line-clamp-2">
                    {quest.description || "No description"}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quest.social_platforms.map((platform) => (
                      <span key={platform} className="bg-sui-ocean/10 group-hover:bg-white/20 text-sui-ocean group-hover:text-white text-xs font-bold uppercase px-2 py-1">
                        {platform}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-sui-ocean/50 group-hover:text-white/60 mb-4 line-clamp-2">
                    <strong>Context:</strong> {quest.context}
                  </p>
                  <Button asChild className="w-full bg-walrus-teal group-hover:bg-white group-hover:text-sui-ocean text-white font-bold uppercase rounded-none">
                    <Link href={`/tools/social-quest/${quest.id}`} className="flex items-center justify-center gap-2">
                      Join Quest
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border-4 border-dashed border-sui-ocean/30 p-12 text-center">
              <Share2 className="h-12 w-12 text-sui-ocean/30 mx-auto mb-4" />
              <p className="text-sui-ocean/50 font-bold uppercase tracking-wide mb-2">No social quests available yet</p>
              <p className="text-sui-ocean/40">Be the first to create a viral campaign!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
