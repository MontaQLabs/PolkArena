"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowLeft,
  Check,
  X,
  Download,
  Search,
  Filter,
  Calendar,
  Mail,
  User,
  Clock,
  MessageSquare,
  CheckSquare,
  Square,
} from "lucide-react";

import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cacheUtils } from "@/lib/cache";

interface Event {
  id: string;
  name: string;
  organizer_id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_online: boolean;
}

interface Participant {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  registered_at: string;
  registration_data: Record<string, string | number | boolean | null>;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EventParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventId = params.id as string;

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setUser(user);

        // Fetch event
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("id, name, organizer_id, start_time, end_time, location, is_online")
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
          toast.error("You can only manage participants for events you created");
          router.push(`/events/${eventId}`);
          return;
        }

        setEvent(eventData);

        // Fetch participants
        await fetchParticipants(eventId);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load data");
        router.push("/events");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const fetchParticipants = async (eventId: string) => {
    const { data, error } = await supabase
      .from("event_participants")
      .select(`
        *,
        user:user_id(id, name, email)
      `)
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });

    if (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants");
      return;
    }

    setParticipants(data || []);
  };

  const handleApprove = async (participantId: string) => {
    if (!user || !event) return;

    setProcessing(participantId);
    try {
      const { error } = await supabase
        .from("event_participants")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          rejection_reason: null,
        })
        .eq("id", participantId);

      if (error) {
        console.error("Error approving participant:", error);
        toast.error("Failed to approve participant");
        return;
      }

      // Send email notification
      try {
        const participant = participants.find(p => p.id === participantId);
        if (participant && participant.user?.email) {
          const emailData = [{
            participantName: participant.user?.name || 'Participant',
            participantEmail: participant.user?.email || '',
            eventName: event.name,
            eventDate: new Date(event.start_time).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            eventLocation: event.location || 'TBD',
            isOnline: event.is_online || false,
            eventId: event.id,
          }];

          await fetch('/api/send-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'approval', participants: emailData }),
          });
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      toast.success("Participant approved! Email notification sent.");
      
      // Invalidate cache for this event's participant count
      cacheUtils.invalidateEvent(event.id);
      
      await fetchParticipants(event.id);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to approve participant");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (participantId: string, reason: string) => {
    if (!user || !event) return;

    setProcessing(participantId);
    try {
      const { error } = await supabase
        .from("event_participants")
        .update({
          status: "rejected",
          rejection_reason: reason || "No reason provided",
          approved_at: null,
          approved_by: null,
        })
        .eq("id", participantId);

      if (error) {
        console.error("Error rejecting participant:", error);
        toast.error("Failed to reject participant");
        return;
      }

      // Send email notification
      try {
        const participant = participants.find(p => p.id === participantId);
        if (participant && participant.user?.email) {
          const emailData = [{
            participantName: participant.user?.name || 'Participant',
            participantEmail: participant.user?.email || '',
            eventName: event.name,
            eventDate: new Date(event.start_time).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            eventLocation: event.location || 'TBD',
            isOnline: event.is_online || false,
            eventId: event.id,
          }];

          await fetch('/api/send-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type: 'rejection', 
              participants: emailData,
              rejectionReason: reason || 'No specific reason provided'
            }),
          });
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      toast.success("Participant rejected. Email notification sent.");
      
      // Invalidate cache for this event's participant count
      cacheUtils.invalidateEvent(event.id);
      
      await fetchParticipants(event.id);
      setRejectionReason("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to reject participant");
    } finally {
      setProcessing(null);
    }
  };

  const toggleParticipantSelection = (participantId: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId);
    } else {
      newSelected.add(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  const toggleSelectAll = () => {
    const pendingParticipants = filteredParticipants.filter(p => p.status === 'pending');
    if (selectedParticipants.size === pendingParticipants.length) {
      // If all pending are selected, deselect all
      setSelectedParticipants(new Set());
    } else {
      // Select all pending participants
      setSelectedParticipants(new Set(pendingParticipants.map(p => p.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (!user || !event || selectedParticipants.size === 0) return;

    setBulkProcessing(true);
    try {
      const participantIds = Array.from(selectedParticipants);
      
      // Get participant details for email notifications
      const selectedParticipantDetails = participants.filter(p => 
        selectedParticipants.has(p.id)
      );

      // Update database first
      const { error } = await supabase
        .from("event_participants")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          rejection_reason: null,
        })
        .in("id", participantIds);

      if (error) {
        console.error("Error bulk approving participants:", error);
        toast.error("Failed to approve participants");
        return;
      }

      // Send email notifications (don't block the UI if this fails)
      try {
        const emailData = selectedParticipantDetails.map(participant => ({
          participantName: participant.user?.name || 'Participant',
          participantEmail: participant.user?.email || '',
          eventName: event.name,
          eventDate: new Date(event.start_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          eventLocation: event.location || 'TBD',
          isOnline: event.is_online || false,
          eventId: event.id,
        }));

        const emailResponse = await fetch('/api/send-notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'approval',
            participants: emailData,
          }),
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log('Email notifications sent:', emailResult);
          toast.success(`${participantIds.length} participant${participantIds.length > 1 ? 's' : ''} approved! Email notifications sent.`);
        } else {
          console.error('Failed to send email notifications');
          toast.success(`${participantIds.length} participant${participantIds.length > 1 ? 's' : ''} approved! (Email notifications failed)`);
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        toast.success(`${participantIds.length} participant${participantIds.length > 1 ? 's' : ''} approved! (Email notifications failed)`);
      }
      
      // Clear selection and refresh data
      setSelectedParticipants(new Set());
      
      // Invalidate cache for this event's participant count
      cacheUtils.invalidateEvent(event.id);
      
      await fetchParticipants(event.id);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to approve participants");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async (reason: string) => {
    if (!user || !event || selectedParticipants.size === 0) return;

    setBulkProcessing(true);
    try {
      const participantIds = Array.from(selectedParticipants);
      
      // Get participant details for email notifications
      const selectedParticipantDetails = participants.filter(p => 
        selectedParticipants.has(p.id)
      );

      // Update database first
      const { error } = await supabase
        .from("event_participants")
        .update({
          status: "rejected",
          rejection_reason: reason || "Bulk rejection",
          approved_at: null,
          approved_by: null,
        })
        .in("id", participantIds);

      if (error) {
        console.error("Error bulk rejecting participants:", error);
        toast.error("Failed to reject participants");
        return;
      }

      // Send email notifications (don't block the UI if this fails)
      try {
        const emailData = selectedParticipantDetails.map(participant => ({
          participantName: participant.user?.name || 'Participant',
          participantEmail: participant.user?.email || '',
          eventName: event.name,
          eventDate: new Date(event.start_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          eventLocation: event.location || 'TBD',
          isOnline: event.is_online || false,
          eventId: event.id,
        }));

        const emailResponse = await fetch('/api/send-notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'rejection',
            participants: emailData,
            rejectionReason: reason || 'No specific reason provided',
          }),
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log('Email notifications sent:', emailResult);
          toast.success(`${participantIds.length} participant${participantIds.length > 1 ? 's' : ''} rejected. Email notifications sent.`);
        } else {
          console.error('Failed to send email notifications');
          toast.success(`${participantIds.length} participant${participantIds.length > 1 ? 's' : ''} rejected. (Email notifications failed)`);
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        toast.success(`${participantIds.length} participant${participantIds.length > 1 ? 's' : ''} rejected. (Email notifications failed)`);
      }
      
      // Clear selection and refresh data
      setSelectedParticipants(new Set());
      
      // Invalidate cache for this event's participant count
      cacheUtils.invalidateEvent(event.id);
      
      await fetchParticipants(event.id);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to reject participants");
    } finally {
      setBulkProcessing(false);
    }
  };

  const exportToCSV = () => {
    if (filteredParticipants.length === 0) {
      toast.error("No participants to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Status",
      "Registration Date",
      "Approval Date",
      "Registration Data",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredParticipants.map((participant) => [
        `"${participant.user?.name || "Unknown"}"`,
        `"${participant.user?.email || "Unknown"}"`,
        `"${participant.status}"`,
        `"${new Date(participant.registered_at).toLocaleDateString()}"`,
        `"${participant.approved_at ? new Date(participant.approved_at).toLocaleDateString() : "N/A"}"`,
        `"${JSON.stringify(participant.registration_data || {}).replace(/"/g, '""')}"`,
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${event?.name || "event"}-participants.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Participant list exported!");
  };

  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch = 
      participant.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || participant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
      case "going":
        return <Badge variant="outline" className="text-green-600 border-green-600">Going (Legacy)</Badge>;
      case "not_going":
        return <Badge variant="outline" className="text-red-600 border-red-600">Not Going (Legacy)</Badge>;
      case "maybe":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Maybe (Legacy)</Badge>;
      case "invited":
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Invited (Legacy)</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-600">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-polkadot-pink" />
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

  const stats = {
    total: participants.length,
    pending: participants.filter(p => p.status === "pending").length,
    approved: participants.filter(p => p.status === "approved" || p.status === "going").length,
    rejected: participants.filter(p => p.status === "rejected" || p.status === "not_going").length,
    other: participants.filter(p => !["pending", "approved", "rejected", "going", "not_going"].includes(p.status)).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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
                Manage Participants
              </h1>
              <p className="text-muted-foreground">
                {event.name}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <p className="text-sm text-muted-foreground">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </CardContent>
            </Card>
            {stats.other > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">{stats.other}</div>
                  <p className="text-sm text-muted-foreground">Other Status</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search participants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="going">Going (Legacy)</SelectItem>
                      <SelectItem value="maybe">Maybe (Legacy)</SelectItem>
                      <SelectItem value="invited">Invited (Legacy)</SelectItem>
                      <SelectItem value="not_going">Not Going (Legacy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Bulk Actions */}
                  {stats.pending > 0 && (
                    <>
                      <Button 
                        onClick={toggleSelectAll}
                        variant="outline" 
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        {selectedParticipants.size === filteredParticipants.filter(p => p.status === 'pending').length && selectedParticipants.size > 0
                          ? <Square className="h-4 w-4 mr-2" />
                          : <CheckSquare className="h-4 w-4 mr-2" />
                        }
                        {selectedParticipants.size === filteredParticipants.filter(p => p.status === 'pending').length && selectedParticipants.size > 0
                          ? 'Deselect All'
                          : `Select All Pending (${stats.pending})`
                        }
                      </Button>
                      
                      {selectedParticipants.size > 0 && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleBulkApprove}
                            disabled={bulkProcessing}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                          >
                            {bulkProcessing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Approve {selectedParticipants.size}
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive"
                                size="sm"
                                disabled={bulkProcessing}
                                className="whitespace-nowrap"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject {selectedParticipants.size}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject {selectedParticipants.size} Participants</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting these participants. This will be sent to them via email.
                                </DialogDescription>
                              </DialogHeader>
                              <Textarea
                                placeholder="Enter rejection reason..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                              />
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleBulkReject(rejectionReason)}
                                  disabled={bulkProcessing}
                                >
                                  {bulkProcessing ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Reject Participants
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </>
                  )}
                  
                  <Button onClick={exportToCSV} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants List */}
          <div className="space-y-4">
            {filteredParticipants.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {participants.length === 0 
                      ? "No participants have registered for this event yet."
                      : "No participants match your current filters."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredParticipants.map((participant) => (
                <Card key={participant.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Selection Checkbox - only for pending participants */}
                        {participant.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 mt-1"
                            onClick={() => toggleParticipantSelection(participant.id)}
                          >
                            {selectedParticipants.has(participant.id) ? (
                              <CheckSquare className="h-4 w-4 text-polkadot-pink" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                        
                        <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{participant.user?.name || "Unknown"}</span>
                          </div>
                          {getStatusBadge(participant.status)}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{participant.user?.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Registered: {formatDate(participant.registered_at)}</span>
                        </div>

                        {participant.approved_at && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Approved: {formatDate(participant.approved_at)}</span>
                          </div>
                        )}

                        {participant.rejection_reason && (
                          <div className="flex items-start gap-2 text-sm text-red-600">
                            <MessageSquare className="h-4 w-4 mt-0.5" />
                            <span>Reason: {participant.rejection_reason}</span>
                          </div>
                        )}

                        {participant.registration_data && Object.keys(participant.registration_data).length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Registration Data:</span>
                            <div className="mt-1 p-2 bg-muted rounded text-xs">
                              {JSON.stringify(participant.registration_data, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                      {(participant.status === "pending" || participant.status === "maybe" || participant.status === "invited") && (
                        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col xl:flex-row">
                          <Button
                            onClick={() => handleApprove(participant.id)}
                            disabled={processing === participant.id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processing === participant.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            <span className="ml-2">Approve</span>
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                                <span className="ml-2">Reject</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Participant</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to reject {participant.user?.name}? 
                                  Please provide a reason for the rejection.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2">
                                <Label htmlFor="rejection_reason">Rejection Reason</Label>
                                <Textarea
                                  id="rejection_reason"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Please provide a reason for rejection..."
                                  rows={3}
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setRejectionReason("")}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleReject(participant.id, rejectionReason)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Reject Participant
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 