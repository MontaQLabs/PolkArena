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
  const { user } = useAuth();
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
          <h1 className="text-2xl font-bold text-polkadot-pink mb-4">⚡ Buzzer</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please sign in to access the buzzer tool.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-polkadot-pink mb-4">⚡ Buzzer</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Create or join buzzer rooms for real-time competitions. Hosts can start, stop, and reset rooms while participants buzz in to answer questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Create Room */}
        <Card className="border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90">
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Buzzer Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Enter room name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomDescription">Description (Optional)</Label>
                    <Input
                      id="roomDescription"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      placeholder="Enter room description"
                    />
                  </div>
                  <Button 
                    onClick={createRoom} 
                    disabled={loading || !newRoomName.trim()}
                    className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                  >
                    {loading ? 'Creating...' : 'Create Room'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Join Room */}
        <Card className="border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Join Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Join Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Buzzer Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="joinPin">Room PIN</Label>
                    <Input
                      id="joinPin"
                      value={joinPin}
                      onChange={(e) => setJoinPin(e.target.value)}
                      placeholder="Enter 6-digit PIN"
                      maxLength={6}
                    />
                  </div>
                  <Button 
                    onClick={joinRoom} 
                    disabled={loading || !joinPin.trim()}
                    className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-polkadot-pink">Available Rooms</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-polkadot-pink mx-auto"></div>
          </div>
        ) : rooms.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">No rooms available. Create one to get started!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{room.room_name}</span>
                    <Crown className={`h-4 w-4 ${room.host_id === user?.id ? 'text-yellow-500' : 'text-gray-400'}`} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {room.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {room.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Users className="h-4 w-4" />
                    <span>{room.participant_count} participants</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Zap className="h-4 w-4" />
                    <span className={`capitalize ${
                      room.status === 'waiting' ? 'text-blue-500' :
                      room.status === 'active' ? 'text-green-500' :
                      'text-red-500'
                    }`}>
                      {room.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {room.host_id === user?.id ? (
                      <Button 
                        onClick={() => router.push(`/tools/buzzer/room/${room.id}`)}
                        className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                      >
                        Host Room
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => router.push(`/tools/buzzer/room/${room.id}`)}
                        variant="outline"
                        className="w-full"
                      >
                        Join Room
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
