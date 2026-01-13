"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ensureUserProfile } from "@/lib/auth-utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Calendar, Award, Globe } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Prize {
  rank: number;
  amount: number;
  currency: string;
  description: string;
}

export default function CreateHackathonPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    short_description: "",
    location: "",
    is_online: false,
    start_date: "",
    end_date: "",
    registration_deadline: "",
    max_participants: "",
    prizes: [] as Prize[],
    rules: "",
    requirements: "",
    technologies: "",
    website_url: "",
    discord_url: "",
    twitter_url: "",
    github_url: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Ensure user profile exists
      try {
        await ensureUserProfile(user.id);
      } catch (error) {
        console.error("Error ensuring user profile:", error);
        toast.error("Failed to load user profile");
        router.push("/auth/login");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const addPrize = () => {
    const newPrize: Prize = {
      rank: formData.prizes.length + 1,
      amount: 0,
      currency: "USD",
      description: "",
    };
    setFormData({
      ...formData,
      prizes: [...formData.prizes, newPrize],
    });
  };

  const updatePrize = (
    index: number,
    field: keyof Prize,
    value: string | number
  ) => {
    const updatedPrizes = [...formData.prizes];
    updatedPrizes[index] = { ...updatedPrizes[index], [field]: value };
    setFormData({ ...formData, prizes: updatedPrizes });
  };

  const removePrize = (index: number) => {
    const updatedPrizes = formData.prizes.filter((_, i) => i !== index);
    updatedPrizes.forEach((prize, i) => {
      prize.rank = i + 1;
    });
    setFormData({ ...formData, prizes: updatedPrizes });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      if (
        !formData.title ||
        !formData.description ||
        !formData.start_date ||
        !formData.end_date
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const registrationDeadline = new Date(formData.registration_deadline);

      if (endDate <= startDate) {
        toast.error("End date must be after start date");
        return;
      }

      if (registrationDeadline >= startDate) {
        toast.error("Registration deadline must be before start date");
        return;
      }

      const technologiesArray = formData.technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech.length > 0);

      const { data, error } = await supabase
        .from("hackathons")
        .insert({
          title: formData.title,
          description: formData.description,
          short_description: formData.short_description,
          location: formData.location,
          is_online: formData.is_online,
          start_date: formData.start_date,
          end_date: formData.end_date,
          registration_deadline: formData.registration_deadline,
          max_participants: formData.max_participants
            ? parseInt(formData.max_participants)
            : null,
          prizes: formData.prizes,
          rules: formData.rules,
          requirements: formData.requirements,
          technologies: technologiesArray.length > 0 ? technologiesArray : null,
          website_url: formData.website_url || null,
          discord_url: formData.discord_url || null,
          twitter_url: formData.twitter_url || null,
          github_url: formData.github_url || null,
          organizer_id: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating hackathon:", error);
        toast.error("Failed to create hackathon");
        return;
      }

      toast.success("Hackathon created successfully!");
      router.push(`/hackathons/${data.id}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create hackathon");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sui-sea" />
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
              <Link href="/hackathons">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Hackathons
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Create Hackathon
              </h1>
              <p className="text-muted-foreground">
                Organize an amazing Sui hackathon
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Provide the essential details about your hackathon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Hackathon Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Sui DeFi Innovation Hackathon"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description *</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        short_description: e.target.value,
                      })
                    }
                    placeholder="A brief one-line description"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your hackathon, themes, goals, and what participants can expect..."
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="City, Country or Online"
                      disabled={formData.is_online}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select
                      value={formData.is_online ? "online" : "offline"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          is_online: value === "online",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="offline">In-Person</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates and Capacity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule & Capacity
                </CardTitle>
                <CardDescription>
                  Set the timeline and participant limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_deadline">
                      Registration Deadline *
                    </Label>
                    <Input
                      id="registration_deadline"
                      type="datetime-local"
                      value={formData.registration_deadline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registration_deadline: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">Maximum Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_participants: e.target.value,
                      })
                    }
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prizes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Prizes
                </CardTitle>
                <CardDescription>
                  Define the prize structure for winners
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.prizes.map((prize, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Prize #{prize.rank}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePrize(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={prize.amount}
                          onChange={(e) =>
                            updatePrize(
                              index,
                              "amount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select
                          value={prize.currency}
                          onValueChange={(value) =>
                            updatePrize(index, "currency", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="DOT">DOT</SelectItem>
                            <SelectItem value="ETH">ETH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={prize.description}
                          onChange={(e) =>
                            updatePrize(index, "description", e.target.value)
                          }
                          placeholder="e.g., First Place Prize"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPrize}
                  className="w-full"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Add Prize
                </Button>
              </CardContent>
            </Card>

            {/* Rules and Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Rules & Requirements</CardTitle>
                <CardDescription>
                  Define the rules and technical requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="rules">Rules & Guidelines</Label>
                  <Textarea
                    id="rules"
                    value={formData.rules}
                    onChange={(e) =>
                      setFormData({ ...formData, rules: e.target.value })
                    }
                    placeholder="List the rules and guidelines for participants..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                    placeholder="List any specific requirements for projects..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technologies">
                    Technologies (comma-separated)
                  </Label>
                  <Input
                    id="technologies"
                    value={formData.technologies}
                    onChange={(e) =>
                      setFormData({ ...formData, technologies: e.target.value })
                    }
                    placeholder="e.g., Sui, Substrate, React, Rust"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>
                  Add links to your hackathon&apos;s social presence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          website_url: e.target.value,
                        })
                      }
                      placeholder="https://your-hackathon.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discord_url">Discord</Label>
                    <Input
                      id="discord_url"
                      type="url"
                      value={formData.discord_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discord_url: e.target.value,
                        })
                      }
                      placeholder="https://discord.gg/your-server"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter</Label>
                    <Input
                      id="twitter_url"
                      type="url"
                      value={formData.twitter_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          twitter_url: e.target.value,
                        })
                      }
                      placeholder="https://twitter.com/your-handle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github_url">GitHub</Label>
                    <Input
                      id="github_url"
                      type="url"
                      value={formData.github_url}
                      onChange={(e) =>
                        setFormData({ ...formData, github_url: e.target.value })
                      }
                      placeholder="https://github.com/your-org"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button asChild variant="outline">
                <Link href="/hackathons">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-sui-sea hover:bg-sui-sea/90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                Create Hackathon
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
