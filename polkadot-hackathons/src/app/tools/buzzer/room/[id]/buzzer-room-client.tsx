"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Crown, Play, Square, RotateCcw, LogOut } from "lucide-react";

import { buzzerStorage } from "@/lib/buzzer-storage";

interface BuzzerRoomClientProps {
  roomId: string;
}

export default function BuzzerRoomClient({ roomId }: BuzzerRoomClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<{
    id: string;
    room_name: string;
    host_id: string;
    host_name: string;
    pin: string;
    status: 'waiting' | 'active' | 'finished';
    created_at: Date;
  } | null>(null);
  const [participants, setParticipants] = useState<Array<{
    user_id: string;
    name: string;
    buzzed: boolean;
    order?: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [buzzed, setBuzzed] = useState(false);
  const [buzzedOrder, setBuzzedOrder] = useState<number | null>(null);

  useEffect(() => {
    if (user && roomId) {
      const loadRoomData = () => {
        const roomData = buzzerStorage.getRoom(roomId);

        if (!roomData) {
          router.push("/tools/buzzer");
          return;
        }

        const formattedRoom = {
          id: roomData.id,
          room_name: roomData.room_name,
          host_id: roomData.host_id,
          host_name: roomData.host_name,
          pin: roomData.pin,
          status: roomData.status,
          created_at: roomData.created_at
        };

        setRoom(formattedRoom);
        setIsHost(roomData.host_id === user?.id);

        // Format participants
        const participantsArray = Array.from(roomData.participants.entries()).map(([userId, data]) => ({
          user_id: userId,
          name: data.name,
          buzzed: data.buzzed,
          order: data.order
        }));

        setParticipants(participantsArray);
        
        const currentParticipant = participantsArray.find(p => p.user_id === user?.id);
        setIsParticipant(!!currentParticipant);
        
        if (currentParticipant) {
          setBuzzed(currentParticipant.buzzed);
          setBuzzedOrder(currentParticipant.order || null);
        }

        setLoading(false);
      };
      
      loadRoomData();
    }
  }, [user, roomId, router]);

  const updateRoomStatus = (status: 'waiting' | 'active' | 'finished') => {
    buzzerStorage.updateRoomStatus(roomId, status);
    setRoom(prev => prev ? { ...prev, status } : null);
  };

  const startRoom = () => {
    if (!isHost) return;
    updateRoomStatus("active");
  };

  const stopRoom = () => {
    if (!isHost) return;
    updateRoomStatus("finished");
  };

  const resetRoom = () => {
    if (!isHost) return;
    
    const roomData = buzzerStorage.getRoom(roomId);
    
    if (roomData) {
      // Reset all participants' buzzer state
      roomData.participants.forEach((participant) => {
        participant.buzzed = false;
        participant.order = undefined;
      });
      
      roomData.status = "waiting";
      
      // Update local state
      setRoom(prev => prev ? { ...prev, status: "waiting" } : null);
      setParticipants(prev => prev.map(p => ({ ...p, buzzed: false, order: undefined })));
      setBuzzed(false);
      setBuzzedOrder(null);
    }
  };

  const buzz = () => {
    if (!isParticipant || buzzed || room?.status !== "active") return;
    
    const roomData = buzzerStorage.getRoom(roomId);
    
    if (roomData && user) {
      const participant = roomData.participants.get(user.id);
      if (participant) {
        const buzzedOrder = Array.from(roomData.participants.values()).filter(p => p.buzzed).length + 1;
        
        participant.buzzed = true;
        participant.order = buzzedOrder;
        
        // Update local state
        setBuzzed(true);
        setBuzzedOrder(buzzedOrder);
        
        // Update participants list
        setParticipants(prev => prev.map(p => 
          p.user_id === user.id 
            ? { ...p, buzzed: true, order: buzzedOrder }
            : p
        ));
      }
    }
  };

  const leaveRoom = () => {
    const roomData = buzzerStorage.getRoom(roomId);
    
    if (roomData && user) {
      roomData.participants.delete(user.id);
      
      // If no participants left, delete the room
      if (roomData.participants.size === 0) {
        buzzerStorage.deleteRoom(roomId);
      }
    }
    
    router.push("/tools/buzzer");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Room not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-polkadot-pink">⚡ {room.room_name}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Hosted by {room.host_name} • PIN: {room.pin}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={leaveRoom}>
            <LogOut className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
          {isHost && (
            <>
              {room.status === "waiting" && (
                <Button onClick={startRoom} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Room
                </Button>
              )}
              {room.status === "active" && (
                <>
                  <Button onClick={stopRoom} className="bg-red-600 hover:bg-red-700">
                    <Square className="w-4 h-4 mr-2" />
                    End Room
                  </Button>
                  <Button onClick={resetRoom} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </>
              )}
              {room.status === "finished" && (
                <Button onClick={resetRoom} className="bg-blue-600 hover:bg-blue-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Round
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Card className="mb-8 border-2 border-storm-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-polkadot-pink" />
            Room Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge 
              variant={room.status === "active" ? "default" : room.status === "finished" ? "secondary" : "outline"}
              className={room.status === "active" ? "bg-green-600" : ""}
            >
              {room.status === "waiting" && "⏳ Waiting for Players"}
              {room.status === "active" && "🎯 Active - Buzzing Enabled"}
              {room.status === "finished" && "🏁 Round Finished"}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4" />
              {participants.length} participants
            </div>
          </div>
        </CardContent>
      </Card>

      {isParticipant && room.status === "active" && !buzzed && (
        <Card className="mb-8 border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300">
          <CardContent className="p-8 text-center">
            <Button 
              onClick={buzz}
              size="lg"
              className="h-32 w-32 rounded-full bg-polkadot-pink hover:bg-polkadot-pink/90 text-white text-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Zap className="h-16 w-16 mr-2" />
              BUZZ!
            </Button>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              Click to buzz in when you know the answer!
            </p>
          </CardContent>
        </Card>
      )}

      {isParticipant && buzzed && (
        <Card className="mb-8 border-2 border-polkadot-pink bg-polkadot-pink/10">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-polkadot-pink mb-2">
              You buzzed in #{buzzedOrder}!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Wait for the host to call on you or reset for a new round.
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-polkadot-pink">Participants</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {participants.map((participant) => (
            <Card 
              key={participant.user_id} 
              className={`border-2 transition-all duration-300 ${
                participant.buzzed 
                  ? 'border-polkadot-pink bg-polkadot-pink/10' 
                  : 'border-storm-200 hover:border-polkadot-pink'
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {participant.user_id === room.host_id && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                  {participant.name}
                  {participant.buzzed && (
                    <Badge className="bg-polkadot-pink text-white">
                      #{participant.order}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {participant.buzzed ? (
                      <span className="text-polkadot-pink font-semibold">
                        Buzzed in #{participant.order}
                      </span>
                    ) : (
                      "Waiting to buzz..."
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
