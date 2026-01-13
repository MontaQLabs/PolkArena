"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, Calendar, ExternalLink, Gift, ArrowUpRight } from "lucide-react";

type Bounty = Database["public"]["Tables"]["bounties"]["Row"];

export default function BountiesPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [myBounties, setMyBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [newBounty, setNewBounty] = useState({
    title: "",
    description: "",
    tags: "",
    reward_amount: 100,
    reward_currency: "USD",
    repo_url: "",
    issue_url: "",
    attachment_url: "",
    deadline: ""
  });

  useEffect(() => {
    if (user) {
      const loadBounties = async () => {
        try {
          const { data: all } = await supabase
            .from("bounties")
            .select("*")
            .order("created_at", { ascending: false });

          if (all) {
            setBounties(all);
            setMyBounties(all.filter(b => b.poster_id === user?.id));
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      
      loadBounties();
    }
  }, [user]);

  const createBounty = async () => {
    if (!user || !newBounty.title.trim() || !newBounty.description.trim()) return;

    try {
      const { data, error } = await supabase
        .from("bounties")
        .insert({
          title: newBounty.title,
          description: newBounty.description,
          tags: newBounty.tags
            .split(",")
            .map(t => t.trim())
            .filter(Boolean),
          reward_amount: newBounty.reward_amount,
          reward_currency: newBounty.reward_currency,
          repo_url: newBounty.repo_url || null,
          issue_url: newBounty.issue_url || null,
          attachment_url: newBounty.attachment_url || null,
          deadline: newBounty.deadline ? new Date(newBounty.deadline).toISOString() : null,
          poster_id: user.id,
          poster_name: profile?.name || user.email?.split("@")[0] || "Anonymous",
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCreateOpen(false);
        router.push(`/tools/bounties/${data.id}`);
      }
    } catch (e) {
      console.error("Failed to create bounty", e);
    }
  };

  const filtered = bounties.filter(b =>
    [b.title, b.description, (b.tags || []).join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

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
      <section className="bg-sui-sea py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white p-3">
                <Gift className="h-8 w-8 text-sui-sea" />
              </div>
              <span className="text-white/80 font-bold uppercase tracking-widest text-sm">
                Event Tool
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mb-6">
              BOUNTIES
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mb-8">
              Open-source projects can post tasks, and contributors can apply. Earn rewards for building on Sui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white hover:bg-sui-ocean text-sui-sea hover:text-white font-bold uppercase tracking-wide px-8 py-6 rounded-none transition-all duration-150">
                    <Plus className="w-5 h-5 mr-2" />
                    Post Bounty
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl rounded-none border-4 border-sui-ocean max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-sui-ocean uppercase">Post a Bounty</DialogTitle>
                    <DialogDescription className="text-sui-ocean/60">
                      Describe the task clearly and provide links to repositories or issues.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="font-bold uppercase text-sm">Title</Label>
                      <Input 
                        id="title" 
                        value={newBounty.title} 
                        onChange={(e) => setNewBounty(prev => ({...prev, title: e.target.value}))} 
                        className="rounded-none border-2 border-sui-ocean"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="font-bold uppercase text-sm">Description</Label>
                      <textarea 
                        id="description" 
                        value={newBounty.description} 
                        onChange={(e) => setNewBounty(prev => ({...prev, description: e.target.value}))} 
                        className="w-full border-2 border-sui-ocean p-3 h-32 rounded-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tags" className="font-bold uppercase text-sm">Tags (comma separated)</Label>
                        <Input 
                          id="tags" 
                          value={newBounty.tags} 
                          onChange={(e) => setNewBounty(prev => ({...prev, tags: e.target.value}))} 
                          className="rounded-none border-2 border-sui-ocean"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deadline" className="font-bold uppercase text-sm">Deadline</Label>
                        <Input 
                          id="deadline" 
                          type="date" 
                          value={newBounty.deadline} 
                          onChange={(e) => setNewBounty(prev => ({...prev, deadline: e.target.value}))} 
                          className="rounded-none border-2 border-sui-ocean"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="amount" className="font-bold uppercase text-sm">Reward Amount</Label>
                        <Input 
                          id="amount" 
                          type="number" 
                          min="0" 
                          value={newBounty.reward_amount} 
                          onChange={(e) => setNewBounty(prev => ({...prev, reward_amount: parseFloat(e.target.value || '0')}))} 
                          className="rounded-none border-2 border-sui-ocean"
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency" className="font-bold uppercase text-sm">Currency</Label>
                        <Input 
                          id="currency" 
                          value={newBounty.reward_currency} 
                          onChange={(e) => setNewBounty(prev => ({...prev, reward_currency: e.target.value}))} 
                          className="rounded-none border-2 border-sui-ocean"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="repo" className="font-bold uppercase text-sm">Repo URL</Label>
                        <Input 
                          id="repo" 
                          value={newBounty.repo_url} 
                          onChange={(e) => setNewBounty(prev => ({...prev, repo_url: e.target.value}))} 
                          className="rounded-none border-2 border-sui-ocean"
                        />
                      </div>
                      <div>
                        <Label htmlFor="issue" className="font-bold uppercase text-sm">Issue URL</Label>
                        <Input 
                          id="issue" 
                          value={newBounty.issue_url} 
                          onChange={(e) => setNewBounty(prev => ({...prev, issue_url: e.target.value}))} 
                          className="rounded-none border-2 border-sui-ocean"
                        />
                      </div>
                      <div>
                        <Label htmlFor="attachment" className="font-bold uppercase text-sm">Attachment</Label>
                        <Input 
                          id="attachment" 
                          value={newBounty.attachment_url} 
                          onChange={(e) => setNewBounty(prev => ({...prev, attachment_url: e.target.value}))} 
                          className="rounded-none border-2 border-sui-ocean"
                        />
                      </div>
                    </div>
                    <Button onClick={createBounty} className="w-full bg-sui-sea hover:bg-sui-ocean text-white font-bold uppercase rounded-none py-6">
                      Post Bounty
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="py-8 border-b-4 border-sui-ocean">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Input 
            placeholder="Search bounties..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="max-w-xl rounded-none border-2 border-sui-ocean text-lg py-6"
          />
        </div>
      </section>

      {/* My Bounties */}
      {myBounties.length > 0 && (
        <section className="py-16 bg-sui-ocean">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-8">My Posted Bounties</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myBounties.map((b) => (
                <div key={b.id} className="bg-white p-6 border-4 border-white">
                  <h3 className="text-xl font-black text-sui-ocean uppercase tracking-wide mb-2">{b.title}</h3>
                  <p className="text-sui-ocean/60 mb-4 line-clamp-2">{b.description}</p>
                  <div className="flex items-center justify-between text-sm text-sui-ocean/60 mb-4">
                    <span className="flex items-center gap-1 font-bold text-sui-sea">
                      <DollarSign className="w-4 h-4" /> {b.reward_amount} {b.reward_currency}
                    </span>
                    {b.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {new Date(b.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(b.tags || []).map((t) => (
                      <span key={t} className="bg-sui-ocean/10 text-sui-ocean text-xs font-bold uppercase px-2 py-1">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="bg-sui-sea hover:bg-sui-ocean text-white font-bold uppercase text-sm rounded-none px-4 py-2">
                      <Link href={`/tools/bounties/${b.id}`}>Manage</Link>
                    </Button>
                    <Button asChild className="bg-sui-ocean/10 hover:bg-sui-ocean text-sui-ocean hover:text-white font-bold uppercase text-sm rounded-none px-4 py-2">
                      <Link href={`/tools/bounties/${b.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Bounties */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-sui-ocean uppercase tracking-tight mb-8">All Bounties</h2>
          {filtered.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((b) => (
                <div 
                  key={b.id} 
                  className="bg-white border-4 border-sui-ocean p-6 hover:bg-sui-ocean hover:text-white group transition-colors"
                >
                  <h3 className="text-xl font-black text-sui-ocean group-hover:text-white uppercase tracking-wide mb-2">{b.title}</h3>
                  <p className="text-sui-ocean/60 group-hover:text-white/70 mb-4 line-clamp-2">{b.description}</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="flex items-center gap-1 font-bold text-sui-sea group-hover:text-walrus-teal">
                      <DollarSign className="w-4 h-4" /> {b.reward_amount} {b.reward_currency}
                    </span>
                    {b.deadline && (
                      <span className="flex items-center gap-1 text-sui-ocean/60 group-hover:text-white/60">
                        <Calendar className="w-4 h-4" /> {new Date(b.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(b.tags || []).map((t) => (
                      <span key={t} className="bg-sui-ocean/10 group-hover:bg-white/20 text-sui-ocean group-hover:text-white text-xs font-bold uppercase px-2 py-1">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="bg-sui-sea group-hover:bg-white group-hover:text-sui-ocean text-white font-bold uppercase text-sm rounded-none px-4 py-2">
                      <Link href={`/tools/bounties/${b.id}`} className="flex items-center gap-2">
                        Details
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {b.repo_url && (
                      <Button asChild className="bg-sui-ocean/10 group-hover:bg-white/20 text-sui-ocean group-hover:text-white font-bold uppercase text-sm rounded-none px-4 py-2">
                        <Link href={b.repo_url} target="_blank" className="flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          Repo
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border-4 border-dashed border-sui-ocean/30 p-12 text-center">
              <Gift className="h-12 w-12 text-sui-ocean/30 mx-auto mb-4" />
              <p className="text-sui-ocean/50 font-bold uppercase tracking-wide">No bounties match your search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
