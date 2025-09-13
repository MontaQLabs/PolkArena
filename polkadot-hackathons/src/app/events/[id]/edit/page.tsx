"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
import { Loader2, ArrowLeft, Save, Globe, Plus, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cacheUtils } from "@/lib/cache";
import { Switch } from "@/components/ui/switch";

interface Event {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  organizer_id: string;
  organizer_name: string;
  location: string | null;
  is_online: boolean;
  participant_limit: number | null;
  tags: string[] | null;
  custom_fields: CustomField[] | null;
  registration_deadline: string | null;
  website_url: string | null;
  discord_url: string | null;
  twitter_url: string | null;
  requirements: string | null;
  banner_image_url: string | null;
  short_code: string;
  is_multi_day: boolean;
  event_days?: EventDay[];
}

interface EventDay {
  id: string;
  day_number: number;
  day_name: string;
  start_time: string;
  end_time: string;
}

interface CustomField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
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
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Get public URL for display
  const getImageUrl = (path: string) => {
    if (!path) return null;
    try {
    const { data } = supabase.storage
      .from('event-banners')
      .getPublicUrl(path);
      
      // Log for debugging
      // console.log('Generated public URL for path:', path, '→', data.publicUrl);
      
    return data.publicUrl;
    } catch (error) {
      console.error('Error generating public URL:', error);
      return null;
    }
  };

  // Load existing image if value exists
  useEffect(() => {
    if (value) {
      const url = getImageUrl(value);
      if (url) {
        setPreview(url);
      }
    } else {
      setPreview(null);
    }
  }, [value]);
  

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }
  
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
  
    setUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Set preview immediately for better UX
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
  
      // Delete old image if exists
      if (value) {
        await supabase.storage
          .from('event-banners')
          .remove([value]);
      }
  
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  
      // Upload file
      const { data, error } = await supabase.storage
        .from('event-banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
  
      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please contact support.');
        }
        throw error;
      }

      // Update preview to use the uploaded image URL
      const uploadedImageUrl = getImageUrl(data.path);
      if (uploadedImageUrl) {
        setPreview(uploadedImageUrl);
      }
  
      onChange(data.path);
      toast.success('Image uploaded successfully!');
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      // Reset preview on error
      setPreview(null);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };
  

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Delete from storage
      const { error } = await supabase.storage
        .from('event-banners')
        .remove([value]);

      if (error) {
        console.error('Delete error:', error);
      }

      onChange(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Image removed');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className="space-y-4">
      <Label>Event Banner Image</Label>
      
      {preview ? (
        <div className="relative">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
            <img
              src={preview}
              alt="Event banner preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', preview);
                console.error('Error details:', e);
              }}
              onLoad={() => {
                // console.log('Image loaded successfully:', preview);
              }}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled || uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Upload an image for your event banner
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Maximum file size: {maxSize}MB
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {preview ? 'Change Image' : 'Upload Image'}
            </>
          )}
        </Button>
        
        {preview && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            disabled={disabled || uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    is_online: false,
    participant_limit: "",
    tags: "",
    registration_deadline: "",
    website_url: "",
    discord_url: "",
    twitter_url: "",
    requirements: "",
    banner_image_url: "",
    is_multi_day: false,
  });

  const [eventDays, setEventDays] = useState<EventDay[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventId = params.id as string;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setUser(user);

        // Fetch event
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError) {
          console.error("Error fetching event:", eventError);
          toast.error("Failed to load event");
          router.push("/events");
          return;
        }

        // Check if user is the organizer
        if (eventData.organizer_id !== user.id) {
          toast.error("You can only edit events you created");
          router.push(`/events/${eventId}`);
          return;
        }

        setEvent(eventData);

        // Format datetime values for datetime-local inputs
        const formatDateTimeLocal = (dateString: string) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          // Convert to local timezone for datetime-local input
          const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
          return localDate.toISOString().slice(0, 16);
        };

        setFormData({
          name: eventData.name,
          description: eventData.description,
          start_time: formatDateTimeLocal(eventData.start_time),
          end_time: formatDateTimeLocal(eventData.end_time),
          location: eventData.location || "",
          is_online: eventData.is_online,
          participant_limit: eventData.participant_limit?.toString() || "",
          tags: eventData.tags ? eventData.tags.join(", ") : "",
          registration_deadline: eventData.registration_deadline 
            ? formatDateTimeLocal(eventData.registration_deadline) 
            : "",
          website_url: eventData.website_url || "",
          discord_url: eventData.discord_url || "",
          twitter_url: eventData.twitter_url || "",
          requirements: eventData.requirements || "",
          banner_image_url: eventData.banner_image_url || "",
          is_multi_day: eventData.is_multi_day || false,
        });

        if (eventData.custom_fields) {
          setCustomFields(eventData.custom_fields);
        }

        // Load event days if it's a multi-day event
        if (eventData.is_multi_day) {
          const { data: eventDaysData } = await supabase
            .from("event_days")
            .select("*")
            .eq("event_id", eventId)
            .order("day_number", { ascending: true });

          if (eventDaysData) {
            const formattedDays = eventDaysData.map(day => ({
              ...day,
              start_time: formatDateTimeLocal(day.start_time),
              end_time: formatDateTimeLocal(day.end_time),
            }));
            setEventDays(formattedDays);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load event");
        router.push("/events");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

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

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(fields =>
      fields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
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

  const removeCustomField = (id: string) => {
    setCustomFields(fields => fields.filter(field => field.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event) return;

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

      // Enhanced date validation with better error handling
      let startTime: Date;
      let endTime: Date;
      const now = new Date();

      if (formData.is_multi_day) {
        // For multi-day events, use the first day's start and last day's end
        const sortedDays = [...eventDays].sort((a, b) => a.day_number - b.day_number);
        startTime = new Date(sortedDays[0].start_time);
        endTime = new Date(sortedDays[sortedDays.length - 1].end_time);
        
        // console.log("Edit multi-day dates:", {
        //   start_time: startTime.toISOString(),
        //   end_time: endTime.toISOString(),
        //   days: sortedDays.length
        // });
      } else {
        // Single day event
        if (!formData.start_time || !formData.end_time) {
          toast.error("Please enter both start and end times");
          setSaving(false);
          return;
        }

        startTime = new Date(formData.start_time);
        endTime = new Date(formData.end_time);
        
        // console.log("Edit single day dates:", {
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

        // For editing existing events, allow past deadlines with warning
        if (registrationDeadline.getTime() < now.getTime()) {
          console.warn("Registration deadline is in the past - this may affect new registrations");
        }
      }

      // Validate participant limit
      let participantLimit = null;
      if (formData.participant_limit && formData.participant_limit.trim()) {
        const parsedLimit = parseInt(formData.participant_limit.trim());
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          toast.error("Participant limit must be a positive number");
          setSaving(false);
        return;
        }
        participantLimit = parsedLimit;
      }

      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // console.log("Updating event with data:", {
      //   start_time: startTime.toISOString(),
      //   end_time: endTime.toISOString(),
      //   registration_deadline: registrationDeadline?.toISOString() || null
      // });

            const updateData = {
          name: formData.name,
          description: formData.description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location: formData.location || null,
          is_online: formData.is_online,
          participant_limit: participantLimit,
          tags: tagsArray.length > 0 ? tagsArray : null,
          custom_fields: customFields.length > 0 ? customFields : null,
          registration_deadline: registrationDeadline?.toISOString() || null,
          website_url: formData.website_url || null,
          discord_url: formData.discord_url || null,
          twitter_url: formData.twitter_url || null,
          requirements: formData.requirements || null,
          banner_image_url: formData.banner_image_url || null,
          is_multi_day: formData.is_multi_day,
      };

      // console.log("About to update event with:", updateData);

      try {
        const { data, error } = await supabase
          .from("events")
          .update(updateData)
          .eq("id", event.id)
          .select();

        // console.log("Supabase update result:", { data, error });

      if (error) {
        console.error("Error updating event:", error);
          toast.error(`Failed to update event: ${error.message}`);
          setSaving(false);
        return;
      }

        if (!data || data.length === 0) {
          console.error("No data returned from update");
          toast.error("Event update failed - no data returned");
          setSaving(false);
          return;
        }

        // console.log("Event updated successfully, handling event days...");
        
        // Handle event days for multi-day events
        if (formData.is_multi_day && eventDays.length > 0) {
          try {
            // First, delete existing event days
            await supabase
              .from("event_days")
              .delete()
              .eq("event_id", event.id);

            // Then insert new event days
            const eventDaysData = eventDays.map(day => ({
              event_id: event.id,
              day_number: day.day_number,
              day_name: day.day_name || null,
              start_time: new Date(day.start_time).toISOString(),
              end_time: new Date(day.end_time).toISOString(),
            }));

            const { error: daysError } = await supabase
              .from("event_days")
              .insert(eventDaysData);

            if (daysError) {
              console.error("Error updating event days:", daysError);
              toast.error("Event updated but failed to save some day details");
            }
          } catch (daysError) {
            console.error("Error handling event days:", daysError);
            toast.error("Event updated but failed to update day details");
          }
        } else if (!formData.is_multi_day) {
          // If converting from multi-day to single day, remove existing event days
          try {
            await supabase
              .from("event_days")
              .delete()
              .eq("event_id", event.id);
          } catch (daysError) {
            console.error("Error removing event days:", daysError);
          }
        }
        
        // Invalidate cache for this event
        cacheUtils.invalidateEvent(event.id);

      toast.success("Event updated successfully!");
      router.push(`/events/${event.id}`);
      } catch (supabaseError) {
        console.error("Supabase operation failed:", supabaseError);
        const errorMessage = supabaseError instanceof Error ? supabaseError.message : 'Unknown error';
        toast.error(`Database error: ${errorMessage}`);
        setSaving(false);
        return;
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-crucible-orange" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Event Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The event you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/events">Back to Events</Link>
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
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${event.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Link>
            </Button>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Edit Event
              </h1>
              <p className="text-muted-foreground">
                Update your event details
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
                    rows={6}
                    required
                  />
                </div>

                {/* Replaced banner URL input with image upload component */}
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
                <CardTitle>Schedule & Capacity</CardTitle>
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
                    onCheckedChange={(checked: boolean) => {
                      setFormData({ ...formData, is_multi_day: checked });
                      // Reset single day times when switching to multi-day
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          start_time: "",
                          end_time: "",
                        }));
                        // If no event days exist, add one
                        if (eventDays.length === 0) {
                          setEventDays([{
                            id: "1",
                            day_number: 1,
                            day_name: "",
                            start_time: "",
                            end_time: "",
                          }]);
                        }
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
                  Manage custom fields for participant registration
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
                <Link href={`/events/${event.id}`}>Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-crucible-orange hover:bg-crucible-orange/90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Event
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
