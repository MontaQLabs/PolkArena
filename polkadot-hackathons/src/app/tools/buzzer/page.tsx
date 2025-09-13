"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, Users, Crown, Plus, LogIn } from "lucide-react";

interface BuzzerRoom {
  id: string;
  room_name: string;
  description?: string;
  host_id: string;
  host_name: string;
  pin: string;
  status: 'waiting' | 'active' | 'finished';
  participant_count: number;
  created_at: string;
}

export default function BuzzerPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<BuzzerRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [joinPin, setJoinPin] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const updateRoomsList = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/tools/buzzer/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      updateRoomsList();
    }
  }, [user, updateRoomsList]);

  const createRoom = async () => {
    if (!user || !newRoomName.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/tools/buzzer/rooms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
          'X-User-Name': profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Anonymous'
        },
        body: JSON.stringify({
          room_name: newRoomName.trim(),
          description: newRoomDescription.trim() || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewRoomName("");
        setNewRoomDescription("");
        setIsCreateDialogOpen(false);
        await updateRoomsList();
        // Navigate to the new room
        router.push(`/tools/buzzer/room/${data.room.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!user || !joinPin.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/tools/buzzer/rooms/join', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
          'X-User-Name': profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Anonymous'
        },
        body: JSON.stringify({ pin: joinPin.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setJoinPin("");
        setIsJoinDialogOpen(false);
        // Navigate to the joined room
        router.push(`/tools/buzzer/room/${data.room.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-crucible-orange mb-4">⚡ Buzzer</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please sign in to access the buzzer tool.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-crucible-orange/10 rounded-full mb-4 lg:mb-6">
            <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-crucible-orange" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-crucible-orange mb-3 lg:mb-4">
            ⚡ Buzzer
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Create or join buzzer rooms for real-time competitions. Hosts can start, stop, and reset rooms while participants buzz in to answer questions.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 lg:mb-12 max-w-4xl mx-auto">
          {/* Create Room */}
          <Card className="border-2 border-storm-200 hover:border-crucible-orange transition-all duration-300 group hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="p-2 bg-crucible-orange/10 rounded-lg group-hover:bg-crucible-orange/20 transition-colors">
                  <Plus className="h-5 w-5 text-crucible-orange" />
                </div>
                Create New Room
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-12 sm:h-14 bg-crucible-orange hover:bg-crucible-orange/90 text-base sm:text-lg font-semibold">
                    Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Create New Buzzer Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roomName" className="text-sm font-medium">Room Name</Label>
                      <Input
                        id="roomName"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roomDescription" className="text-sm font-medium">Description (Optional)</Label>
                      <Input
                        id="roomDescription"
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                        placeholder="Enter room description"
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={createRoom} 
                      disabled={loading || !newRoomName.trim()}
                      className="w-full h-12 bg-crucible-orange hover:bg-crucible-orange/90 text-base font-semibold"
                    >
                      {loading ? 'Creating...' : 'Create Room'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="border-2 border-storm-200 hover:border-crucible-orange transition-all duration-300 group hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <LogIn className="h-5 w-5 text-blue-500" />
                </div>
                Join Room
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                    Join Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Join Buzzer Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="joinPin" className="text-sm font-medium">Room PIN</Label>
                      <Input
                        id="joinPin"
                        value={joinPin}
                        onChange={(e) => setJoinPin(e.target.value)}
                        placeholder="Enter 6-digit PIN"
                        maxLength={6}
                        className="mt-1 text-center text-lg font-mono tracking-widest"
                      />
                    </div>
                    <Button 
                      onClick={joinRoom} 
                      disabled={loading || !joinPin.trim()}
                      className="w-full h-12 bg-crucible-orange hover:bg-crucible-orange/90 text-base font-semibold"
                    >
                      {loading ? 'Joining...' : 'Join Room'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Available Rooms */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-crucible-orange/10 rounded-lg">
              <Users className="h-5 w-5 text-crucible-orange" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-crucible-orange">Available Rooms</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crucible-orange mx-auto mb-4"></div>
              <p className="text-gray-500">Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <Card className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No rooms available</h3>
              <p className="text-gray-500">Create one to get started!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {rooms.map((room) => (
                <Card key={room.id} className="border-2 border-storm-200 hover:border-crucible-orange transition-all duration-300 group hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                      <span className="truncate pr-2">{room.room_name}</span>
                      <Crown className={`h-4 w-4 flex-shrink-0 ${room.host_id === user?.id ? 'text-yellow-500' : 'text-gray-400'}`} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {room.description && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {room.description}
                      </p>
                    )}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{room.participant_count} participants</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className={`capitalize font-medium ${
                          room.status === 'waiting' ? 'text-blue-500' :
                          room.status === 'active' ? 'text-green-500' :
                          'text-red-500'
                        }`}>
                          {room.status}
                        </span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => router.push(`/tools/buzzer/room/${room.id}`)}
                      className={`w-full h-10 text-sm font-semibold ${
                        room.host_id === user?.id 
                          ? 'bg-crucible-orange hover:bg-crucible-orange/90' 
                          : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600'
                      }`}
                    >
                      {room.host_id === user?.id ? 'Host Room' : 'Join Room'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
