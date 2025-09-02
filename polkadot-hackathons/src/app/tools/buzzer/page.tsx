"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Zap, Users, Clock } from "lucide-react";
import Link from "next/link";

import { buzzerStorage } from "@/lib/buzzer-storage";

export default function BuzzerPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Array<{
    id: string;
    room_name: string;
    host_id: string;
    host_name: string;
    pin: string;
    status: 'waiting' | 'active' | 'finished';
    participant_count: number;
    created_at: Date;
  }>>([]);
  const [myRooms, setMyRooms] = useState<Array<{
    id: string;
    room_name: string;
    host_id: string;
    host_name: string;
    pin: string;
    status: 'waiting' | 'active' | 'finished';
    participant_count: number;
    created_at: Date;
  }>>([]);
  const [loading] = useState(false);
  const [joinPin, setJoinPin] = useState("");
  const [joinError, setJoinError] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_name: "",
    description: ""
  });

  const updateRoomsList = useCallback(() => {
    const roomsArray = buzzerStorage.getAllRooms().map(room => ({
      id: room.id,
      room_name: room.room_name,
      host_id: room.host_id,
      host_name: room.host_name,
      pin: room.pin,
      status: room.status,
      participant_count: room.participants.size,
      created_at: room.created_at
    }));

    setRooms(roomsArray.filter(room => room.status === 'waiting'));
    
    if (user) {
      const myRoomsArray = roomsArray.filter(room => room.host_id === user.id);
      setMyRooms(myRoomsArray);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      updateRoomsList();
    }
  }, [user, updateRoomsList]);

  const createRoom = async () => {
    if (!user || !newRoom.room_name.trim()) return;

    const hostName = profile?.name || user.email?.split("@")[0] || "Anonymous";

    const newRoomData = buzzerStorage.createRoom({
      room_name: newRoom.room_name,
      description: newRoom.description || undefined,
      host_id: user.id,
      host_name: hostName,
      status: 'waiting',
      participants: new Map([[user.id, { name: hostName, buzzed: false }]])
    });
    
    setNewRoom({ room_name: "", description: "" });
    setCreateDialogOpen(false);
    updateRoomsList();
    
    // Redirect to room
    router.push(`/tools/buzzer/room/${newRoomData.id}`);
  };

  const joinRoom = async () => {
    if (!user || !joinPin.trim()) return;

    try {
      setJoinError("");
      
      // Find room by PIN
      const room = buzzerStorage.getRoomByPin(joinPin);
      
      if (!room || room.status !== 'waiting') {
        setJoinError("Invalid PIN or room not found");
        return;
      }

      // Check if user is already in the room
      if (room.participants.has(user.id)) {
        router.push(`/tools/buzzer/room/${room.id}`);
        return;
      }

      // Join the room
      const displayName = profile?.name || user.email?.split("@")[0] || "Anonymous";
      buzzerStorage.addParticipant(room.id, user.id, { name: displayName, buzzed: false });
      
      updateRoomsList();
      router.push(`/tools/buzzer/room/${room.id}`);
    } catch (error) {
      console.error("Error joining buzzer room:", error);
      setJoinError("Failed to join room");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-polkadot-pink">⚡ Buzzer</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Quick-fire buzzer rooms for fast-paced competitions</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-polkadot-pink hover:bg-polkadot-pink/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Buzzer Room</DialogTitle>
              <DialogDescription>
                Create a new buzzer room that others can join and compete in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="room_name">Room Name</Label>
                <Input
                  id="room_name"
                  value={newRoom.room_name}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, room_name: e.target.value }))}
                  placeholder="Enter room name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter room description"
                />
              </div>
              <Button onClick={createRoom} className="w-full">
                Create Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Join Room Section */}
      <Card className="mb-8 border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-polkadot-pink" />
            Join Buzzer Room
          </CardTitle>
          <CardDescription>Enter a 6-digit PIN to join an active buzzer room</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value)}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
              {joinError && <p className="text-red-500 text-sm mt-2">{joinError}</p>}
            </div>
            <Button onClick={joinRoom} disabled={joinPin.length !== 6} className="bg-polkadot-pink hover:bg-polkadot-pink/90">
              Join Room
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Rooms Section */}
      {myRooms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-polkadot-pink">My Rooms</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myRooms.map((room) => (
              <Card key={room.id} className="border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-polkadot-pink" />
                    {room.room_name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="text-sm">PIN: {room.pin}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Users className="h-4 w-4" />
                      {room.participant_count} participants
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="h-4 w-4" />
                      {room.created_at.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="bg-polkadot-pink hover:bg-polkadot-pink/90">
                      <Link href={`/tools/buzzer/room/${room.id}`}>Enter Room</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Rooms Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-polkadot-pink">Available Rooms</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-polkadot-pink" />
                  {room.room_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span className="text-sm">Hosted by {room.host_name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="h-4 w-4" />
                    {room.participant_count} participants
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="h-4 w-4" />
                    {room.created_at.toLocaleDateString()}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={`/tools/buzzer/room/${room.id}`}>Join Room</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {rooms.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No buzzer rooms available. Create the first one!
          </div>
        )}
      </div>
    </div>
  );
}
