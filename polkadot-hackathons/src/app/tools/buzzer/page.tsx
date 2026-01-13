"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, Users, Crown, Plus, LogIn, ArrowUpRight } from "lucide-react";

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
      <div className="min-h-screen bg-walrus-teal flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-4">BUZZER</h1>
          <p className="text-white/70 mb-6">Please sign in to access the buzzer tool.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-walrus-teal py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white p-3">
                <Zap className="h-8 w-8 text-walrus-teal" />
              </div>
              <span className="text-white/80 font-bold uppercase tracking-widest text-sm">
                Event Tool
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mb-6">
              BUZZER
            </h1>
            <p className="text-xl text-white/70 max-w-2xl">
              Create or join buzzer rooms for real-time competitions. Hosts can start, stop, and reset while participants buzz in to answer.
            </p>
          </div>
        </div>
      </section>

      {/* Action Cards */}
      <section className="py-12 border-b-4 border-sui-ocean">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-4xl mx-auto">
            {/* Create Room */}
            <div className="bg-sui-ocean p-8">
              <div className="flex items-center gap-3 mb-4">
                <Plus className="h-6 w-6 text-sui-sea" />
                <h2 className="text-xl font-black text-white uppercase tracking-wide">Create Room</h2>
              </div>
              <p className="text-white/60 mb-6">Start a new buzzer room as host</p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-sui-sea hover:bg-white hover:text-sui-ocean text-white font-bold uppercase tracking-wide py-6 rounded-none">
                    Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-none border-4 border-sui-ocean">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-sui-ocean uppercase">Create Buzzer Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roomName" className="font-bold uppercase text-sm">Room Name</Label>
                      <Input
                        id="roomName"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="rounded-none border-2 border-sui-ocean"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roomDescription" className="font-bold uppercase text-sm">Description (Optional)</Label>
                      <Input
                        id="roomDescription"
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                        placeholder="Enter room description"
                        className="rounded-none border-2 border-sui-ocean"
                      />
                    </div>
                    <Button 
                      onClick={createRoom} 
                      disabled={loading || !newRoomName.trim()}
                      className="w-full bg-walrus-teal hover:bg-sui-ocean text-white font-bold uppercase rounded-none py-6"
                    >
                      {loading ? 'Creating...' : 'Create Room'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Join Room */}
            <div className="bg-sui-sea p-8">
              <div className="flex items-center gap-3 mb-4">
                <LogIn className="h-6 w-6 text-white" />
                <h2 className="text-xl font-black text-white uppercase tracking-wide">Join Room</h2>
              </div>
              <p className="text-white/70 mb-6">Enter a PIN to join an existing room</p>
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-white hover:bg-sui-ocean text-sui-sea hover:text-white font-bold uppercase tracking-wide py-6 rounded-none">
                    Join Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-none border-4 border-sui-ocean">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-sui-ocean uppercase">Join Buzzer Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="joinPin" className="font-bold uppercase text-sm">Room PIN</Label>
                      <Input
                        id="joinPin"
                        value={joinPin}
                        onChange={(e) => setJoinPin(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="text-center text-3xl font-mono tracking-[0.5em] rounded-none border-2 border-sui-ocean py-6"
                      />
                    </div>
                    <Button 
                      onClick={joinRoom} 
                      disabled={loading || !joinPin.trim()}
                      className="w-full bg-walrus-teal hover:bg-sui-ocean text-white font-bold uppercase rounded-none py-6"
                    >
                      {loading ? 'Joining...' : 'Join Room'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Available Rooms */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Users className="h-6 w-6 text-sui-ocean" />
            <h2 className="text-3xl font-black text-sui-ocean uppercase tracking-tight">Available Rooms</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sui-sea mx-auto mb-4"></div>
              <p className="text-sui-ocean/50 font-bold uppercase tracking-wide">Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-gray-50 border-4 border-dashed border-sui-ocean/30 p-12 text-center">
              <Zap className="h-12 w-12 text-sui-ocean/30 mx-auto mb-4" />
              <p className="text-sui-ocean/50 font-bold uppercase tracking-wide mb-2">No rooms available</p>
              <p className="text-sui-ocean/40">Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.map((room, i) => (
                <div 
                  key={room.id} 
                  className={`p-6 border-4 ${room.host_id === user?.id ? 'border-walrus-teal bg-walrus-teal/5' : 'border-sui-ocean'} hover:bg-sui-ocean hover:text-white group transition-colors`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-black text-sui-ocean group-hover:text-white uppercase tracking-wide truncate pr-2">
                      {room.room_name}
                    </h3>
                    <Crown className={`h-5 w-5 flex-shrink-0 ${room.host_id === user?.id ? 'text-walrus-teal group-hover:text-yellow-300' : 'text-sui-ocean/30 group-hover:text-white/30'}`} />
                  </div>
                  {room.description && (
                    <p className="text-sui-ocean/60 group-hover:text-white/70 text-sm mb-4 line-clamp-2">
                      {room.description}
                    </p>
                  )}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-sui-ocean/60 group-hover:text-white/60">
                      <Users className="h-4 w-4" />
                      <span>{room.participant_count} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4" />
                      <span className={`capitalize font-bold ${
                        room.status === 'waiting' ? 'text-sui-sea group-hover:text-sui-sea' :
                        room.status === 'active' ? 'text-green-500' :
                        'text-red-500'
                      }`}>
                        {room.status}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => router.push(`/tools/buzzer/room/${room.id}`)}
                    className={`w-full font-bold uppercase text-sm rounded-none ${
                      room.host_id === user?.id 
                        ? 'bg-walrus-teal group-hover:bg-white group-hover:text-walrus-teal' 
                        : 'bg-sui-sea group-hover:bg-white group-hover:text-sui-ocean'
                    } text-white`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {room.host_id === user?.id ? 'Host Room' : 'Join Room'}
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
