"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calendar, ExternalLink } from "lucide-react";

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
        router.push(`/bounties/${data.id}`);
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Bounties</h1>
          <p className="text-gray-600">Open-source projects can post tasks, and contributors can apply.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Post Bounty
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Post a new Bounty</DialogTitle>
              <DialogDescription>
                Describe the task clearly and provide links to repositories or issues.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={newBounty.title} onChange={(e) => setNewBounty(prev => ({...prev, title: e.target.value}))} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea id="description" value={newBounty.description} onChange={(e) => setNewBounty(prev => ({...prev, description: e.target.value}))} className="w-full border rounded p-2 h-32" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" value={newBounty.tags} onChange={(e) => setNewBounty(prev => ({...prev, tags: e.target.value}))} />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" value={newBounty.deadline} onChange={(e) => setNewBounty(prev => ({...prev, deadline: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="amount">Reward Amount</Label>
                  <Input id="amount" type="number" min="0" value={newBounty.reward_amount} onChange={(e) => setNewBounty(prev => ({...prev, reward_amount: parseFloat(e.target.value || '0')}))} />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" value={newBounty.reward_currency} onChange={(e) => setNewBounty(prev => ({...prev, reward_currency: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="repo">Repo URL</Label>
                  <Input id="repo" value={newBounty.repo_url} onChange={(e) => setNewBounty(prev => ({...prev, repo_url: e.target.value}))} />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="issue">Issue URL</Label>
                  <Input id="issue" value={newBounty.issue_url} onChange={(e) => setNewBounty(prev => ({...prev, issue_url: e.target.value}))} />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="attachment">Attachment URL</Label>
                  <Input id="attachment" value={newBounty.attachment_url} onChange={(e) => setNewBounty(prev => ({...prev, attachment_url: e.target.value}))} />
                </div>
              </div>
              <Button onClick={createBounty} className="w-full">Post Bounty</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <Input placeholder="Search bounties..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {myBounties.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">My Posted Bounties</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myBounties.map((b) => (
              <Card key={b.id}>
                <CardHeader>
                  <CardTitle>{b.title}</CardTitle>
                  <CardDescription>{b.description.slice(0, 120)}{b.description.length > 120 ? '…' : ''}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {b.reward_amount} {b.reward_currency}</span>
                    {b.deadline && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(b.deadline).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(b.tags || []).map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm"><Link href={`/bounties/${b.id}`}>Manage</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link href={`/bounties/${b.id}`}>View</Link></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-3">All Bounties</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <Card key={b.id}>
              <CardHeader>
                <CardTitle>{b.title}</CardTitle>
                <CardDescription>{b.description.slice(0, 140)}{b.description.length > 140 ? '…' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {b.reward_amount} {b.reward_currency}</span>
                  {b.deadline && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(b.deadline).toLocaleDateString()}</span>}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(b.tags || []).map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline"><Link href={`/bounties/${b.id}`}>Details</Link></Button>
                  {b.repo_url && <Button asChild size="sm" variant="ghost"><Link href={b.repo_url} target="_blank"><ExternalLink className="w-4 h-4 mr-1" />Repo</Link></Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-8">No bounties match your search.</div>
        )}
      </div>
    </div>
  );
}
