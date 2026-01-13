"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth, useAuthReady } from "@/contexts/auth-context";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Edit,
  Save,
  X,
  Mail,
  MapPin,
  Github,
  Twitter,
  Linkedin,
  Globe,
  Briefcase,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { authReady, isAuthenticated } = useAuthReady();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    github_url: "",
    twitter_url: "",
    linkedin_url: "",
    website_url: "",
    skills: "",
  });
  // console.log(contextProfile);
  // Redirect if not authenticated
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authReady, isAuthenticated, router]);

  // Load profile data when auth is ready
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authReady || !user) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Failed to load profile");
          return;
        }

        setProfile(data);
        setFormData({
          name: data.name || "",
          bio: data.bio || "",
          location: data.location || "",
          github_url: data.github_url || "",
          twitter_url: data.twitter_url || "",
          linkedin_url: data.linkedin_url || "",
          website_url: data.website_url || "",
          skills: data.skills ? data.skills.join(", ") : "",
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authReady]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updates = {
        name: formData.name || null,
        bio: formData.bio || null,
        location: formData.location || null,
        github_url: formData.github_url || null,
        twitter_url: formData.twitter_url || null,
        linkedin_url: formData.linkedin_url || null,
        website_url: formData.website_url || null,
        skills: formData.skills
          ? formData.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
          : null,
      };

      // Use the context's updateProfile method which handles caching
      const { error } = await updateProfile(updates);

      if (error) {
        toast.error(`Failed to update profile: ${error.message}`);
        return;
      }

      // Update local state
      if (profile) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
      }

      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        github_url: profile.github_url || "",
        twitter_url: profile.twitter_url || "",
        linkedin_url: profile.linkedin_url || "",
        website_url: profile.website_url || "",
        skills: profile.skills ? profile.skills.join(", ") : "",
      });
    }
    setEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    toast.success("Signed out successfully");
  };

  // Show loading while auth is being checked
  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Profile
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage your account and preferences
              </p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start sm:self-auto"
            >
              Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Profile Card */}
            <div className="xl:col-span-1">
              <Card className="h-fit">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-xl sm:text-2xl bg-sui-sea text-white">
                        {profile?.name?.charAt(0) ||
                          user?.email?.charAt(0) ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-lg sm:text-xl break-words">
                    {profile?.name || "Anonymous User"}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center gap-2 text-sm break-all">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {profile?.location && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Member since{" "}
                      {new Date(profile?.created_at || "").toLocaleDateString()}
                    </span>
                  </div>

                  {profile?.skills && profile.skills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Links Display */}
                  {(profile?.github_url ||
                    profile?.twitter_url ||
                    profile?.linkedin_url ||
                    profile?.website_url) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Social Links</h4>
                      <div className="space-y-2">
                        {profile.github_url && (
                          <a
                            href={profile.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Github className="h-3 w-3" />
                            <span className="truncate">GitHub</span>
                          </a>
                        )}
                        {profile.twitter_url && (
                          <a
                            href={profile.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Twitter className="h-3 w-3" />
                            <span className="truncate">Twitter</span>
                          </a>
                        )}
                        {profile.linkedin_url && (
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Linkedin className="h-3 w-3" />
                            <span className="truncate">LinkedIn</span>
                          </a>
                        )}
                        {profile.website_url && (
                          <a
                            href={profile.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Globe className="h-3 w-3" />
                            <span className="truncate">Website</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Edit Form */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">
                        Profile Information
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Update your personal information and social links
                      </CardDescription>
                    </div>
                    {!editing ? (
                      <Button
                        onClick={() => setEditing(true)}
                        className="bg-sui-sea hover:bg-sui-sea/90 self-start sm:self-auto"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2 self-start sm:self-auto">
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-sui-sea hover:bg-sui-sea/90"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button onClick={handleCancel} variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled={!editing}
                        placeholder="Enter your full name"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        disabled={!editing}
                        placeholder="City, Country"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      disabled={!editing}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      value={formData.skills}
                      onChange={(e) =>
                        setFormData({ ...formData, skills: e.target.value })
                      }
                      disabled={!editing}
                      placeholder="React, TypeScript, Solidity, etc."
                      className="w-full"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium text-base">Social Links</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          value={formData.github_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              github_url: e.target.value,
                            })
                          }
                          disabled={!editing}
                          placeholder="https://github.com/username"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          value={formData.twitter_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              twitter_url: e.target.value,
                            })
                          }
                          disabled={!editing}
                          placeholder="https://twitter.com/username"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.linkedin_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              linkedin_url: e.target.value,
                            })
                          }
                          disabled={!editing}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              website_url: e.target.value,
                            })
                          }
                          disabled={!editing}
                          placeholder="https://yourwebsite.com"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
