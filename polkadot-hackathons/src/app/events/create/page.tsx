"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
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
import { Loader2, ArrowLeft, Calendar, Globe, Plus, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { generateUniqueShortCode } from "@/lib/utils";
import { cacheUtils } from "@/lib/cache";
import { Switch } from "@/components/ui/switch";

interface CustomField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface EventDay {
  id: string;
  day_number: number;
  day_name: string;
  start_time: string;
  end_time: string;
}

// Image Upload Component
function ImageUpload({
  value,
  onChange,
  disabled = false,
  maxSize = 5,
}: {
  value?: string;
  onChange: (path: string | null) => void;
  disabled?: boolean;
  maxSize?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing image when value changes
  useEffect(() => {
    if (value && !previewUrl) {
      const loadExistingImage = async () => {
        try {
    const { data } = supabase.storage
            .from("event-banners")
            .getPublicUrl(value);
          
          // console.log("Loading existing image URL:", data.publicUrl);
          setPreviewUrl(data.publicUrl);
        } catch (error) {
          console.error("Error loading existing image:", error);
        }
      };
      
      loadExistingImage();
    }
  }, [value, previewUrl]);

  const { user } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);

    try {
      // Create immediate preview using FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("event-banners")
        .upload(filePath, file);

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

      // console.log("Upload successful:", data);

      // Get the public URL
      try {
        const { data: urlData } = supabase.storage
          .from("event-banners")
          .getPublicUrl(filePath);

        // console.log("Public URL:", urlData.publicUrl);

        // Update preview to the actual uploaded URL
        setPreviewUrl(urlData.publicUrl);
        onChange(filePath);
        toast.success("Image uploaded successfully!");
      } catch (urlError) {
        console.error("Error getting public URL:", urlError);
        onChange(filePath);
        toast.success("Image uploaded successfully!");
      }
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
      onChange(null);
      if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Choose Image"}
        </Button>
        
        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {previewUrl && (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Event banner preview"
            className="w-full h-48 object-cover rounded-lg border"
            onError={(e) => {
              console.error("Image failed to load:", previewUrl);
              console.error("Error event:", e);
            }}
            onLoad={() => {
              // console.log("Image loaded successfully:", previewUrl);
            }}
          />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Maximum file size: {maxSize}MB. Supported formats: JPG, PNG, WebP
      </p>
    </div>
  );
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_time: "",
    end_time: "",
    registration_deadline: "",
    location: "",
    is_online: false,
    participant_limit: "",
    tags: "",
    website_url: "",
    discord_url: "",
    twitter_url: "",
    requirements: "",
    banner_image_url: "",
    is_multi_day: false,
  });

  const [eventDays, setEventDays] = useState<EventDay[]>([
    {
      id: "1",
      day_number: 1,
      day_name: "",
      start_time: "",
      end_time: "",
    },
  ]);

  // Check authentication status
  useEffect(() => {
    if (!authLoading && !user) {
        router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      name: "",
      type: "text",
      required: false,
      options: [],
    };
    setCustomFields([...customFields, newField]);
  };

  const addEventDay = () => {
    const newDay: EventDay = {
      id: Date.now().toString(),
      day_number: eventDays.length + 1,
      day_name: "",
      start_time: "",
      end_time: "",
    };
    setEventDays([...eventDays, newDay]);
  };

  const removeEventDay = (id: string) => {
    if (eventDays.length <= 1) return; // Keep at least one day
    setEventDays(days => days.filter(day => day.id !== id));
  };

  const updateEventDay = (id: string, updates: Partial<EventDay>) => {
    setEventDays(days =>
      days.map(day =>
        day.id === id ? { ...day, ...updates } : day
      )
    );
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(fields =>
      fields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeCustomField = (id: string) => {
    setCustomFields(fields => fields.filter(field => field.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      if (
        !formData.name ||
        !formData.description ||
        (!formData.is_multi_day && (!formData.start_time || !formData.end_time))
      ) {
        toast.error("Please fill in all required fields");
        setSaving(false);
        return;
      }

      // Validate multi-day events
      if (formData.is_multi_day) {
        const hasIncompleteDay = eventDays.some(day => !day.start_time || !day.end_time);
        if (hasIncompleteDay) {
          toast.error("Please fill in start and end times for all event days");
          setSaving(false);
          return;
        }

        // Validate that each day's times are valid
        for (const day of eventDays) {
          const dayStart = new Date(day.start_time);
          const dayEnd = new Date(day.end_time);
          
          if (isNaN(dayStart.getTime()) || isNaN(dayEnd.getTime())) {
            toast.error(`Please enter valid times for Day ${day.day_number}`);
            setSaving(false);
            return;
          }

          if (dayEnd.getTime() <= dayStart.getTime()) {
            toast.error(`End time must be after start time for Day ${day.day_number}`);
            setSaving(false);
            return;
          }
        }
      }

      // Enhanced date validation
      let startTime: Date;
      let endTime: Date;
      const now = new Date();

      if (formData.is_multi_day) {
        // For multi-day events, use the first day's start and last day's end
        const sortedDays = [...eventDays].sort((a, b) => a.day_number - b.day_number);
        startTime = new Date(sortedDays[0].start_time);
        endTime = new Date(sortedDays[sortedDays.length - 1].end_time);
        
        // console.log("Create multi-day dates:", {
        //   start_time: startTime.toISOString(),
        //   end_time: endTime.toISOString(),
        //   days: sortedDays.length
        // });
      } else {
        // Single day event
        startTime = new Date(formData.start_time);
        endTime = new Date(formData.end_time);
        
        // console.log("Create single day dates:", {
        //   start_time: formData.start_time,
        //   end_time: formData.end_time,
        //   registration_deadline: formData.registration_deadline
        // });

        // Check for invalid dates
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          toast.error("Please enter valid start and end times");
          setSaving(false);
          return;
        }

        if (endTime.getTime() <= startTime.getTime()) {
          toast.error("End time must be after start time");
          setSaving(false);
          return;
        }
      }

      // Check if start time is in the past
      if (startTime.getTime() < now.getTime()) {
        toast.error("Start time cannot be in the past");
        setSaving(false);
        return;
      }

      // Validate registration deadline if provided
      let registrationDeadline = null;
      if (formData.registration_deadline) {
        registrationDeadline = new Date(formData.registration_deadline);
        
        if (isNaN(registrationDeadline.getTime())) {
          toast.error("Please enter a valid registration deadline");
          setSaving(false);
        return;
      }

        if (registrationDeadline.getTime() >= startTime.getTime()) {
        toast.error("Registration deadline must be before start time");
          setSaving(false);
        return;
      }

        if (registrationDeadline.getTime() < now.getTime()) {
        toast.error("Registration deadline cannot be in the past");
          setSaving(false);
        return;
        }
      }

      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Get user profile for organizer name
      const { data: userProfile } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();

      // Generate unique short code for shareable URL
      const shortCode = await generateUniqueShortCode(formData.name);

      // console.log("Creating event with data:", {
      //   start_time: startTime.toISOString(),
      //   end_time: endTime.toISOString(),
      //   registration_deadline: registrationDeadline?.toISOString() || null
      // });

      const eventData = {
        name: formData.name,
        description: formData.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        organizer_id: user.id,
        organizer_name: userProfile?.name || user.email || "Anonymous",
        location: formData.location || null,
        is_online: formData.is_online,
        participant_limit: formData.participant_limit
          ? parseInt(formData.participant_limit)
          : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        custom_fields: customFields.length > 0 ? customFields : null,
        registration_deadline: registrationDeadline?.toISOString() || null,
        website_url: formData.website_url || null,
        discord_url: formData.discord_url || null,
        twitter_url: formData.twitter_url || null,
        requirements: formData.requirements || null,
        banner_image_url: formData.banner_image_url || null,
        short_code: shortCode,
        is_multi_day: formData.is_multi_day,
      };

      const { data, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error("Error creating event:", error);
        toast.error(`Failed to create event: ${error.message}`);
        setSaving(false);
        return;
      }

      // If multi-day event, save the individual days
      if (formData.is_multi_day && eventDays.length > 0) {
        const eventDaysData = eventDays.map(day => ({
          event_id: data.id,
          day_number: day.day_number,
          day_name: day.day_name || null,
          start_time: new Date(day.start_time).toISOString(),
          end_time: new Date(day.end_time).toISOString(),
        }));

        const { error: daysError } = await supabase
          .from("event_days")
          .insert(eventDaysData);

        if (daysError) {
          console.error("Error creating event days:", daysError);
          // Don't fail the whole creation, just log the error
          toast.error("Event created but failed to save some day details");
        }
      }

      toast.success("Event created successfully!");
      
      // Invalidate cache since we added a new event
      cacheUtils.invalidateAllEvents();
      
      router.push(`/events/${data.id}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create event");
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/events">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Link>
            </Button>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Create Event
              </h1>
              <p className="text-muted-foreground">
                Organize an amazing Polkadot ecosystem event
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Provide the essential details about your event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Polkadot Developer Workshop"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your event, what participants will learn, and what to expect..."
                    rows={6}
                    required
                  />
                </div>

                {/* Image upload component */}
                <ImageUpload
                  value={formData.banner_image_url}
                  onChange={(path) =>
                    setFormData({ ...formData, banner_image_url: path || "" })
                  }
                  disabled={saving}
                  maxSize={5}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Event Format</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder={formData.is_online ? "Meeting platform (e.g., Zoom)" : "City, Country or Venue"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="e.g., workshop, beginner, substrate, defi"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Capacity */}
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
                {/* Multi-day Event Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Multi-day Event</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable for events spanning multiple non-continuous days
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_multi_day}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, is_multi_day: checked });
                      // Reset single day times when switching to multi-day
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          start_time: "",
                          end_time: "",
                        }));
                      }
                    }}
                  />
                </div>

                {/* Single Day Event */}
                {!formData.is_multi_day && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_deadline">
                      Registration Deadline
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
                    />
                  </div>
                </div>
                )}

                {/* Multi-day Event Days */}
                {formData.is_multi_day && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Event Schedule</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEventDay}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Day
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {eventDays.map((day) => (
                        <div key={day.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Day {day.day_number}</h5>
                            {eventDays.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEventDay(day.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`day_name_${day.id}`}>Day Name (Optional)</Label>
                              <Input
                                id={`day_name_${day.id}`}
                                value={day.day_name}
                                onChange={(e) =>
                                  updateEventDay(day.id, { day_name: e.target.value })
                                }
                                placeholder="e.g., Opening Day, Workshop Day"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`start_time_${day.id}`}>Start Time *</Label>
                              <Input
                                id={`start_time_${day.id}`}
                                type="datetime-local"
                                value={day.start_time}
                                onChange={(e) =>
                                  updateEventDay(day.id, { start_time: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`end_time_${day.id}`}>End Time *</Label>
                              <Input
                                id={`end_time_${day.id}`}
                                type="datetime-local"
                                value={day.end_time}
                                onChange={(e) =>
                                  updateEventDay(day.id, { end_time: e.target.value })
                                }
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Registration Deadline for Multi-day */}
                    <div className="space-y-2">
                      <Label htmlFor="registration_deadline">
                        Registration Deadline
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
                        className="max-w-md"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="participant_limit">Maximum Participants</Label>
                  <Input
                    id="participant_limit"
                    type="number"
                    value={formData.participant_limit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        participant_limit: e.target.value,
                      })
                    }
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Registration Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Form Fields</CardTitle>
                <CardDescription>
                  Add custom fields for participant registration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {customFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-3 sm:p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Field #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomField(field.id)}
                        className="text-red-600 hover:text-red-700 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove field</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Field Label</Label>
                        <Input
                          value={field.name}
                          onChange={(e) =>
                            updateCustomField(field.id, { name: e.target.value })
                          }
                          placeholder="e.g., Experience Level"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: string) =>
                            updateCustomField(field.id, { type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="textarea">Long Text</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Required</Label>
                        <Select
                          value={field.required ? "true" : "false"}
                          onValueChange={(value) =>
                            updateCustomField(field.id, { required: value === "true" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Optional</SelectItem>
                            <SelectItem value="true">Required</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {field.type === "select" && (
                      <div className="space-y-2">
                        <Label>Options (comma-separated)</Label>
                        <Input
                          value={field.options?.join(", ") || ""}
                          onChange={(e) =>
                            updateCustomField(field.id, {
                              options: e.target.value.split(",").map(opt => opt.trim()).filter(opt => opt)
                            })
                          }
                          placeholder="e.g., Beginner, Intermediate, Advanced"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomField}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Field
                </Button>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Optional details and social links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                    placeholder="Any prerequisites or requirements for participants..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      placeholder="https://your-event.com"
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
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button asChild variant="outline">
                <Link href="/events">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-crucible-orange hover:bg-crucible-orange/90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                Create Event
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
