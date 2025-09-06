"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Crown, Play, Square, RotateCcw, LogOut } from "lucide-react";
import { useBuzzerWebSocket } from "@/hooks/use-buzzer-websocket";

interface BuzzerParticipant {
  name: string;
  buzzed: boolean;
  order?: number;
}

interface BuzzerRoom {
  id: string;
  room_name: string;
  host_id: string;
  host_name: string;
  pin: string;
  status: 'waiting' | 'active' | 'finished';
  participants: Record<string, BuzzerParticipant>;
  created_at: string;
}

interface WebSocketData {
  room?: {
    id: string;
    room_name: string;
    host_id: string;
    host_name: string;
    pin: string;
    status: 'waiting' | 'active' | 'finished';
    participants: Record<string, BuzzerParticipant>;
    created_at: string;
  };
  participantCount?: number;
  status?: string;
  participantName?: string;
  order?: number;
}

interface BuzzerRoomClientProps {
  roomId: string;
}

export default function BuzzerRoomClient({ roomId }: BuzzerRoomClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<BuzzerRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantsArray, setParticipantsArray] = useState<Array<[string, BuzzerParticipant]>>([]);

  // WebSocket handlers
  const handleRoomUpdate = useCallback((data: WebSocketData) => {
    if (data.room) {
      setRoom(data.room);
      // Convert Record to array for rendering via Map
      const participantsMap = new Map(Object.entries(data.room.participants)) as Map<string, BuzzerParticipant>;
      setParticipantsArray(Array.from(participantsMap.entries()));
    }
  }, []);

  const handleBuzz = useCallback((data: WebSocketData) => {
    // Update the participant who buzzed
    if (room && data.participantName && data.order !== undefined) {
      setRoom(prevRoom => {
        if (!prevRoom) return prevRoom;
        const updatedRoom = { ...prevRoom };
        const participantsMap = new Map(Object.entries(updatedRoom.participants));
        
        // Find and update the participant who buzzed
        for (const [userId, participant] of participantsMap.entries()) {
          if (participant.name === data.participantName) {
            participantsMap.set(userId, { ...participant, buzzed: true, order: data.order });
            break;
          }
        }
        
        updatedRoom.participants = Object.fromEntries(participantsMap.entries());
        setParticipantsArray(Array.from(participantsMap.entries()));
        return updatedRoom;
      });
    }
  }, [room]);

  const handleStatusChange = useCallback((data: WebSocketData) => {
    if (data.status) {
      setRoom(prevRoom => prevRoom ? { ...prevRoom, status: data.status as 'waiting' | 'active' | 'finished' } : null);
    }
  }, []);

  const handleReset = useCallback(() => {
    setRoom(prevRoom => {
      if (!prevRoom) return prevRoom;
      const updatedRoom = { ...prevRoom, status: 'waiting' as const };
      const participantsMap = new Map(Object.entries(updatedRoom.participants));
      
      // Reset all participants
      for (const [userId, participant] of participantsMap.entries()) {
        participantsMap.set(userId, { ...participant, buzzed: false, order: undefined });
      }
      
      updatedRoom.participants = Object.fromEntries(participantsMap.entries());
      setParticipantsArray(Array.from(participantsMap.entries()));
      return updatedRoom;
    });
  }, []);

  // Initialize WebSocket connection
  const { isConnected } = useBuzzerWebSocket({
    roomId,
    userId: user?.id || '',
    onRoomUpdate: handleRoomUpdate,
    onBuzz: handleBuzz,
    onStatusChange: handleStatusChange,
    onReset: handleReset
  });

  // Load initial room data
  useEffect(() => {
    const loadRoomData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/tools/buzzer/rooms/${roomId}`);
        
        if (response.ok) {
          const data = await response.json();
          setRoom(data.room);
          // Convert Record to array for rendering via Map
          const participantsMap = new Map(Object.entries(data.room.participants)) as Map<string, BuzzerParticipant>;
          setParticipantsArray(Array.from(participantsMap.entries()));
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load room');
        }
      } catch (error) {
        console.error('Error loading room:', error);
        setError('Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [user, roomId]);

  const startRoom = async () => {
    if (!room || room.host_id !== user?.id) return;
    
    try {
      const response = await fetch(`/api/tools/buzzer/rooms/${roomId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });

      if (response.ok) {
        setRoom(prevRoom => prevRoom ? { ...prevRoom, status: 'active' as const } : null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start room');
      }
    } catch (error) {
      console.error('Error starting room:', error);
      alert('Failed to start room');
    }
  };

  const stopRoom = async () => {
    if (!room || room.host_id !== user?.id) return;
    
    try {
      const response = await fetch(`/api/tools/buzzer/rooms/${roomId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finished' })
      });

      if (response.ok) {
        setRoom(prevRoom => prevRoom ? { ...prevRoom, status: 'finished' as const } : null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to stop room');
      }
    } catch (error) {
      console.error('Error stopping room:', error);
      alert('Failed to stop room');
    }
  };

  const resetRoom = async () => {
    if (!room || room.host_id !== user?.id) return;
    
    try {
      const response = await fetch(`/api/tools/buzzer/rooms/${roomId}/reset`, {
        method: 'POST'
      });

      if (response.ok) {
        setRoom(prevRoom => {
          if (!prevRoom) return prevRoom;
          const updatedRoom = { ...prevRoom, status: 'waiting' as const };
          const participantsMap = new Map(Object.entries(updatedRoom.participants));
          
          // Reset all participants
          for (const [userId, participant] of participantsMap.entries()) {
            participantsMap.set(userId, { ...participant, buzzed: false, order: undefined });
          }
          
          updatedRoom.participants = Object.fromEntries(participantsMap.entries());
          setParticipantsArray(Array.from(participantsMap.entries()));
          return updatedRoom;
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reset room');
      }
    } catch (error) {
      console.error('Error resetting room:', error);
      alert('Failed to reset room');
    }
  };

  const buzz = async () => {
    if (!room || room.status !== 'active') return;
    
    try {
      const response = await fetch(`/api/tools/buzzer/rooms/${roomId}/buzz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buzzed: true })
      });

      if (response.ok) {
        // The WebSocket will handle the update
        console.log('Buzzed in successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to buzz in');
      }
    } catch (error) {
      console.error('Error buzzing in:', error);
      alert('Failed to buzz in');
    }
  };

  const leaveRoom = () => {
    router.push('/tools/buzzer');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-polkadot-pink mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || 'Room not found'}
          </p>
          <Button onClick={leaveRoom} variant="outline">
            Back to Buzzer
          </Button>
        </div>
      </div>
    );
  }

  const isHost = room.host_id === user?.id;
  const currentParticipant = room.participants[user?.id || ''];
  const hasBuzzed = currentParticipant?.buzzed || false;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-polkadot-pink mb-2">⚡ {room.room_name}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Room PIN: <span className="font-mono font-bold">{room.pin}</span>
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant={room.status === 'waiting' ? 'secondary' : room.status === 'active' ? 'default' : 'destructive'}>
            {room.status.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{Object.keys(room.participants).length} participants</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Host Controls */}
      {isHost && (
        <Card className="mb-6 border-2 border-storm-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Host Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {room.status === 'waiting' && (
                <Button onClick={startRoom} className="bg-polkadot-pink hover:bg-polkadot-pink/90">
                  <Play className="h-4 w-4 mr-2" />
                  Start Room
                </Button>
              )}
              {room.status === 'active' && (
                <Button onClick={stopRoom} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Room
                </Button>
              )}
              <Button onClick={resetRoom} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Room
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participant Controls */}
      {!isHost && room.status === 'active' && (
        <Card className="mb-6 border-2 border-storm-200">
          <CardHeader>
            <CardTitle>Your Buzzer</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={buzz} 
              disabled={hasBuzzed}
              className={`w-full h-20 text-xl font-bold ${
                hasBuzzed 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-polkadot-pink hover:bg-polkadot-pink/90 hover:scale-105 transition-transform'
              }`}
            >
              {hasBuzzed ? `BUZZED! (${currentParticipant?.order})` : 'BUZZ IN!'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Participants List */}
      <Card className="border-2 border-storm-200">
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participantsArray.map(([userId, participant]) => (
              <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {room.host_id === userId && <Crown className="h-4 w-4 text-yellow-500" />}
                  <span className="font-medium">{participant.name}</span>
                  {participant.buzzed && (
                    <Badge variant="default" className="bg-polkadot-pink">
                      #{participant.order}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {participant.buzzed ? (
                    <Zap className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave Room Button */}
      <div className="mt-6 text-center">
        <Button onClick={leaveRoom} variant="outline">
          <LogOut className="h-4 w-4 mr-2" />
          Leave Room
        </Button>
      </div>
    </div>
  );
}
