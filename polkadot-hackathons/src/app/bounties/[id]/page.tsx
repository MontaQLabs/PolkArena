"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Calendar, ExternalLink, ArrowLeft, Award, Check, X, GitPullRequest } from "lucide-react";

 type Bounty = Database["public"]["Tables"]["bounties"]["Row"];
 type Application = Database["public"]["Tables"]["bounty_applications"]["Row"];
 type Contribution = Database["public"]["Tables"]["bounty_contributions"]["Row"];
 type AwardRow = Database["public"]["Tables"]["bounty_awards"]["Row"];

export default function BountyDetailPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bountyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [awards, setAwards] = useState<AwardRow[]>([]);

  const [applyOpen, setApplyOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState<{ open: boolean; app?: Application }>({ open: false });
  const [contribOpen, setContribOpen] = useState(false);

  const [pitch, setPitch] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [awardAmount, setAwardAmount] = useState<number>(0);
  const [awardNote, setAwardNote] = useState("");

  const [contribDesc, setContribDesc] = useState("");
  const [contribPr, setContribPr] = useState("");
  const [contribCommit, setContribCommit] = useState("");

  const isPoster = useMemo(() => !!(user && bounty && bounty.poster_id === user.id), [user, bounty]);

  useEffect(() => {
    if (!bountyId) return;
    let mounted = true;
    const load = async () => {
      try {
        const { data: b, error: be } = await supabase
          .from("bounties")
          .select("*")
          .eq("id", bountyId)
          .single();
        if (be) throw be;
        if (!mounted) return;
        setBounty(b);

        const [{ data: apps }, { data: contribs }, { data: awds }] = await Promise.all([
          supabase.from("bounty_applications").select("*").eq("bounty_id", bountyId).order("created_at", { ascending: false }),
          supabase.from("bounty_contributions").select("*").eq("bounty_id", bountyId).order("created_at", { ascending: false }),
          supabase.from("bounty_awards").select("*").eq("bounty_id", bountyId).order("awarded_at", { ascending: false }),
        ]);
        if (!mounted) return;
        setApplications(apps || []);
        setContributions(contribs || []);
        setAwards(awds || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [bountyId]);

  const hasApplied = useMemo(() => !!applications.find(a => a.applicant_id === user?.id), [applications, user]);

  const submitApplication = async () => {
    if (!user || !bounty) return;
    try {
      const { error } = await supabase
        .from("bounty_applications")
        .insert({
          bounty_id: bounty.id,
          applicant_id: user.id,
          applicant_name: profile?.name || user.email?.split("@")[0] || "Anonymous",
          pitch: pitch.trim(),
          portfolio_url: portfolio || null,
          status: 'pending'
        });
      if (error) throw error;
      setApplyOpen(false);
      setPitch("");
      setPortfolio("");
      // refresh
      const { data: apps } = await supabase.from("bounty_applications").select("*").eq("bounty_id", bounty.id).order("created_at", { ascending: false });
      setApplications(apps || []);
    } catch (e) {
      console.error("Failed to apply", e);
    }
  };

  const updateApplicationStatus = async (appId: string, status: Application["status"]) => {
    try {
      const { error } = await supabase
        .from("bounty_applications")
        .update({ status })
        .eq("id", appId);
      if (error) throw error;
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    } catch (e) {
      console.error("Failed to update application", e);
    }
  };

  const awardApplicant = async () => {
    if (!bounty || !awardOpen.app || !user) return;
    try {
      const awardPayload = {
        bounty_id: bounty.id,
        recipient_id: awardOpen.app.applicant_id,
        recipient_name: awardOpen.app.applicant_name,
        award_amount: awardAmount,
        award_currency: bounty.reward_currency,
        note: awardNote || null,
      } as Database["public"]["Tables"]["bounty_awards"]["Insert"];

      const { data: awardRow, error } = await supabase
        .from("bounty_awards")
        .insert(awardPayload)
        .select()
        .single();
      if (error) throw error;

      // Optionally set bounty to awarded
      await supabase.from("bounties").update({ status: 'awarded' }).eq("id", bounty.id);

      setAwards(prev => awardRow ? [awardRow, ...prev] : prev);
      setAwardOpen({ open: false });
      setAwardAmount(0);
      setAwardNote("");
    } catch (e) {
      console.error("Failed to award", e);
    }
  };

  const addContribution = async () => {
    if (!user || !bounty) return;
    try {
      const payload = {
        bounty_id: bounty.id,
        contributor_id: user.id,
        description: contribDesc || null,
        pr_url: contribPr || null,
        commit_hash: contribCommit || null,
      } as Database["public"]["Tables"]["bounty_contributions"]["Insert"];

      const { data, error } = await supabase
        .from("bounty_contributions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      setContributions(prev => data ? [data, ...prev] : prev);
      setContribOpen(false);
      setContribDesc("");
      setContribPr("");
      setContribCommit("");
    } catch (e) {
      console.error("Failed to add contribution", e);
    }
  };

  const updateBountyStatus = async (status: Bounty["status"]) => {
    if (!bounty) return;
    try {
      const { error } = await supabase.from("bounties").update({ status }).eq("id", bounty.id);
      if (error) throw error;
      setBounty(prev => prev ? { ...prev, status } : prev);
    } catch (e) {
      console.error("Failed to update bounty", e);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bounty not found</h1>
          <Button onClick={() => router.push("/bounties")}>Back to bounties</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/bounties")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to bounties
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{bounty.title}</CardTitle>
                  <CardDescription>Posted by {bounty.poster_name}</CardDescription>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-4 h-4" /> {bounty.reward_amount} {bounty.reward_currency}
                  </div>
                  {bounty.deadline && (
                    <div className="flex items-center justify-end gap-1">
                      <Calendar className="w-4 h-4" /> {new Date(bounty.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {(bounty.tags || []).map(t => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
                <Badge variant="outline">Status: {bounty.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none whitespace-pre-wrap text-sm text-gray-800">
                {bounty.description}
              </div>
              <div className="flex items-center gap-3 mt-4">
                {bounty.repo_url && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={bounty.repo_url} target="_blank"><ExternalLink className="w-4 h-4 mr-1" />Repo</Link>
                  </Button>
                )}
                {bounty.issue_url && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={bounty.issue_url} target="_blank"><ExternalLink className="w-4 h-4 mr-1" />Issue</Link>
                  </Button>
                )}
                {bounty.attachment_url && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={bounty.attachment_url} target="_blank"><ExternalLink className="w-4 h-4 mr-1" />Attachment</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contributions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contributions</CardTitle>
                {user && (
                  <Dialog open={contribOpen} onOpenChange={setContribOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><GitPullRequest className="w-4 h-4 mr-1" /> Add contribution</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Contribution</DialogTitle>
                        <DialogDescription>Link your PR or commit and describe your work.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="pr">PR URL</Label>
                          <Input id="pr" value={contribPr} onChange={(e) => setContribPr(e.target.value)} placeholder="https://github.com/org/repo/pull/123" />
                        </div>
                        <div>
                          <Label htmlFor="commit">Commit Hash</Label>
                          <Input id="commit" value={contribCommit} onChange={(e) => setContribCommit(e.target.value)} placeholder="abcdef123..." />
                        </div>
                        <div>
                          <Label htmlFor="desc">Description</Label>
                          <textarea id="desc" value={contribDesc} onChange={(e) => setContribDesc(e.target.value)} className="w-full border rounded p-2 h-24" />
                        </div>
                        <Button onClick={addContribution} className="w-full">Submit</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {contributions.length === 0 ? (
                <div className="text-sm text-gray-500">No contributions yet.</div>
              ) : (
                <div className="space-y-3">
                  {contributions.map(c => (
                    <div key={c.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          {c.pr_url && <ExternalLink className="w-4 h-4" />}
                          {c.pr_url ? <Link href={c.pr_url} target="_blank" className="underline">Pull Request</Link> : <span>Contribution</span>}
                        </div>
                        <div className="text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
                      </div>
                      {c.description && <div className="mt-2 text-sm text-gray-700">{c.description}</div>}
                      {c.commit_hash && <div className="mt-1 text-xs font-mono text-gray-500">Commit: {c.commit_hash}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: actions */}
        <div className="space-y-4">
          {/* Apply box */}
          <Card>
            <CardHeader>
              <CardTitle>Apply</CardTitle>
              <CardDescription>Logged-in users can apply to work on this bounty.</CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="text-sm text-gray-600">Please sign in to apply.</div>
              ) : hasApplied ? (
                <div className="text-sm text-green-700">You have applied. The poster will review your application.</div>
              ) : bounty.status !== 'open' ? (
                <div className="text-sm text-gray-600">Applications are closed for this bounty.</div>
              ) : (
                <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Apply for this bounty</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply</DialogTitle>
                      <DialogDescription>Tell the poster why you&apos;re a good fit.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="pitch">Pitch</Label>
                        <textarea id="pitch" value={pitch} onChange={(e) => setPitch(e.target.value)} className="w-full border rounded p-2 h-28" />
                      </div>
                      <div>
                        <Label htmlFor="portfolio">Portfolio URL (optional)</Label>
                        <Input id="portfolio" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://..." />
                      </div>
                      <Button onClick={submitApplication} disabled={!pitch.trim()} className="w-full">Submit application</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Poster controls */}
          {isPoster && (
            <Card>
              <CardHeader>
                <CardTitle>Manage</CardTitle>
                <CardDescription>Only visible to the poster</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateBountyStatus('open')}>Mark Open</Button>
                  <Button size="sm" variant="outline" onClick={() => updateBountyStatus('in_review')}>In Review</Button>
                  <Button size="sm" variant="outline" onClick={() => updateBountyStatus('closed')}>Close</Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="font-medium">Applications ({applications.length})</div>
                  {applications.length === 0 ? (
                    <div className="text-sm text-gray-500">No applications yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {applications.map(app => (
                        <div key={app.id} className="p-3 border rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{app.applicant_name}</div>
                              <div className="text-sm text-gray-600">Status: {app.status}</div>
                              {app.portfolio_url && <Link href={app.portfolio_url} target="_blank" className="text-sm underline">Portfolio</Link>}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => updateApplicationStatus(app.id, 'accepted')}><Check className="w-4 h-4 mr-1" /> Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => updateApplicationStatus(app.id, 'rejected')}><X className="w-4 h-4 mr-1" /> Reject</Button>
                              <Button size="sm" onClick={() => { setAwardOpen({ open: true, app }); setAwardAmount(Number(bounty.reward_amount)); }}>
                                <Award className="w-4 h-4 mr-1" /> Award
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{app.pitch}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="font-medium">Awards ({awards.length})</div>
                  {awards.length === 0 ? (
                    <div className="text-sm text-gray-500">No awards yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {awards.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 border rounded text-sm">
                          <div>
                            <div className="font-medium">{a.recipient_name}</div>
                            <div className="text-gray-600">{a.award_amount} {a.award_currency}</div>
                          </div>
                          <div className="text-gray-500">{new Date(a.awarded_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Award dialog */}
      <Dialog open={awardOpen.open} onOpenChange={(o) => setAwardOpen(prev => ({ open: o, app: o ? prev.app : undefined }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award bounty</DialogTitle>
            <DialogDescription>Confirm award for {awardOpen.app?.applicant_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="amount">Amount ({bounty.reward_currency})</Label>
              <Input id="amount" type="number" value={awardAmount} onChange={(e) => setAwardAmount(parseFloat(e.target.value || '0'))} />
            </div>
            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <textarea id="note" value={awardNote} onChange={(e) => setAwardNote(e.target.value)} className="w-full border rounded p-2 h-24" />
            </div>
            <Button onClick={awardApplicant} disabled={awardAmount <= 0} className="w-full"><Award className="w-4 h-4 mr-1" /> Confirm Award</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
