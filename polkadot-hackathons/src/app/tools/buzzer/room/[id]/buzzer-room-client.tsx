"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Crown, Play, Square, RotateCcw, LogOut } from "lucide-react";
import { useBuzzerSSE } from "@/hooks/use-buzzer-sse";

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

interface SSEData {
  type: 'room_update' | 'buzz' | 'status_change' | 'reset_room';
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
  const { user, profile } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<BuzzerRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantsArray, setParticipantsArray] = useState<Array<[string, BuzzerParticipant]>>([]);

  // SSE handlers
  const handleRoomUpdate = useCallback((data: SSEData) => {
    if (data.room) {
      setRoom(data.room);
      // Convert Record to array for rendering
      setParticipantsArray(Object.entries(data.room.participants));
    }
  }, []);

  const handleBuzz = useCallback((data: SSEData) => {
    // Update the participant who buzzed
    if (room && data.participantName && data.order !== undefined) {
      setRoom(prevRoom => {
        if (!prevRoom) return prevRoom;
        const updatedRoom = { ...prevRoom };
        
        // Find and update the participant who buzzed
        for (const [userId, participant] of Object.entries(updatedRoom.participants)) {
          if (participant.name === data.participantName) {
            updatedRoom.participants[userId] = { ...participant, buzzed: true, order: data.order };
            break;
          }
        }
        
        setParticipantsArray(Object.entries(updatedRoom.participants));
        return updatedRoom;
      });
    }
  }, [room]);

  const handleStatusChange = useCallback((data: SSEData) => {
    if (data.status) {
      setRoom(prevRoom => prevRoom ? { ...prevRoom, status: data.status as 'waiting' | 'active' | 'finished' } : null);
    }
  }, []);

  const handleReset = useCallback(() => {
    setRoom(prevRoom => {
      if (!prevRoom) return prevRoom;
      const updatedRoom = { ...prevRoom, status: 'waiting' as const };
      
      // Reset all participants
      for (const [userId, participant] of Object.entries(updatedRoom.participants)) {
        updatedRoom.participants[userId] = { ...participant, buzzed: false, order: undefined };
      }
      
      setParticipantsArray(Object.entries(updatedRoom.participants));
      return updatedRoom;
    });
  }, []);

  // Initialize SSE connection only when room is loaded
  const { isConnected } = useBuzzerSSE({
    roomId: room && !error ? roomId : '', // Only connect if room exists and no error
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
        setError(null); // Clear any previous errors
        
        // First try to load from server
        const response = await fetch(`/api/tools/buzzer/rooms/${roomId}`);
        
        if (response.ok) {
          const data = await response.json();
          setRoom(data.room);
          // Convert Record to array for rendering
          setParticipantsArray(Object.entries(data.room.participants));
          
          // Store room data in localStorage as backup
          localStorage.setItem(`buzzer-room-${roomId}`, JSON.stringify({
            ...data.room,
            created_at: data.room.created_at
          }));
        } else {
          // If server room not found, try to load from localStorage
          const localRoomData = localStorage.getItem(`buzzer-room-${roomId}`);
          if (localRoomData) {
            const localRoom = JSON.parse(localRoomData);
            setRoom(localRoom);
            setParticipantsArray(Object.entries(localRoom.participants));
            setError('Room data loaded from cache. Some features may not work until you refresh.');
          } else {
            const errorData = await response.json();
            if (response.status === 404) {
              setError('Room not found. The room may have expired or the server was restarted. Please create a new room.');
            } else {
              setError(errorData.error || 'Failed to load room');
            }
          }
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

  // Handle tab visibility changes to reload room data if needed
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !room && !loading) {
        // Tab became visible and we don't have room data, reload
        const loadRoomData = async () => {
          if (!user) return;
          
          try {
            const response = await fetch(`/api/tools/buzzer/rooms/${roomId}`);
            
            if (response.ok) {
              const data = await response.json();
              setRoom(data.room);
              setParticipantsArray(Object.entries(data.room.participants));
              setError(null);
              
              // Store room data in localStorage as backup
              localStorage.setItem(`buzzer-room-${roomId}`, JSON.stringify({
                ...data.room,
                created_at: data.room.created_at
              }));
            } else {
              // If server room not found, try to load from localStorage
              const localRoomData = localStorage.getItem(`buzzer-room-${roomId}`);
              if (localRoomData) {
                const localRoom = JSON.parse(localRoomData);
                setRoom(localRoom);
                setParticipantsArray(Object.entries(localRoom.participants));
                setError('Room data loaded from cache. Some features may not work until you refresh.');
              } else {
                const errorData = await response.json();
                if (response.status === 404) {
                  setError('Room not found. The room may have expired or the server was restarted. Please create a new room.');
                } else {
                  setError(errorData.error || 'Failed to load room');
                }
              }
            }
          } catch (error) {
            console.error('Error reloading room:', error);
            setError('Failed to load room');
          }
        };

        loadRoomData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, roomId, room, loading]);

  const startRoom = async () => {
    if (!room || room.host_id !== user?.id) return;
    
    try {
      const response = await fetch(`/api/tools/buzzer/rooms/${roomId}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
          'X-User-Name': profile?.name || (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email || 'Anonymous'
        },
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
          'X-User-Name': profile?.name || (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email || 'Anonymous'
        },
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
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.id}`,
          'X-User-Name': profile?.name || (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email || 'Anonymous'
        }
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`,
          'X-User-Name': profile?.name || (user?.user_metadata && (user?.user_metadata.full_name || user?.user_metadata.name)) || user?.email || 'Anonymous'
        },
        body: JSON.stringify({ buzzed: true })
      });

      if (response.ok) {
        // Update local state immediately for better UX
        const responseData = await response.json();
        if (responseData.order) {
          setRoom(prevRoom => {
            if (!prevRoom) return prevRoom;
            const updatedRoom = { ...prevRoom };
            const participantsMap = new Map(Object.entries(updatedRoom.participants));
            
            // Update the current user's buzz state
            if (user?.id && participantsMap.has(user.id)) {
              const participant = participantsMap.get(user.id)!;
              participantsMap.set(user.id, { ...participant, buzzed: true, order: responseData.order });
            }
            
            updatedRoom.participants = Object.fromEntries(participantsMap.entries());
            setParticipantsArray(Array.from(participantsMap.entries()));
            return updatedRoom;
          });
        }
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
    // Clean up localStorage data when leaving
    localStorage.removeItem(`buzzer-room-${roomId}`);
    router.push('/tools/buzzer');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crucible-orange mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    const retryLoadRoom = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/tools/buzzer/rooms/${roomId}`);
        
        if (response.ok) {
          const data = await response.json();
          setRoom(data.room);
          setParticipantsArray(Object.entries(data.room.participants));
          
          // Store room data in localStorage as backup
          localStorage.setItem(`buzzer-room-${roomId}`, JSON.stringify({
            ...data.room,
            created_at: data.room.created_at
          }));
        } else {
          // If server room not found, try to load from localStorage
          const localRoomData = localStorage.getItem(`buzzer-room-${roomId}`);
          if (localRoomData) {
            const localRoom = JSON.parse(localRoomData);
            setRoom(localRoom);
            setParticipantsArray(Object.entries(localRoom.participants));
            setError('Room data loaded from cache. Some features may not work until you refresh.');
          } else {
            const errorData = await response.json();
            if (response.status === 404) {
              setError('Room not found. The room may have expired or the server was restarted. Please create a new room.');
            } else {
              setError(errorData.error || 'Failed to load room');
            }
          }
        }
      } catch (error) {
        console.error('Error retrying room load:', error);
        setError('Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Room not found'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={retryLoadRoom} variant="outline" disabled={loading}>
              {loading ? 'Retrying...' : 'Retry'}
            </Button>
            <Button onClick={() => router.push('/tools/buzzer')} className="bg-crucible-orange hover:bg-crucible-orange/90">
              Create New Room
            </Button>
            <Button onClick={leaveRoom} variant="outline">
              Back to Buzzer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isHost = room.host_id === user?.id;
  const currentParticipant = room.participants[user?.id || ''];
  const hasBuzzed = currentParticipant?.buzzed || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header Section */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-crucible-orange/10 rounded-full mb-4 lg:mb-6">
            <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-crucible-orange" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-crucible-orange mb-3 lg:mb-4">
            ⚡ {room.room_name}
          </h1>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border-2 border-storm-200 max-w-md mx-auto mb-6">
            <p className="text-sm sm:text-base text-gray-600 mb-2">Room PIN</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-crucible-orange tracking-widest">
              {room.pin}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Badge 
              variant={room.status === 'waiting' ? 'secondary' : room.status === 'active' ? 'default' : 'destructive'}
              className="text-xs sm:text-sm px-3 py-1"
            >
              {room.status.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{Object.keys(room.participants).length} participants</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <Card className="mb-6 lg:mb-8 border-2 border-storm-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Crown className="h-5 w-5 text-yellow-500" />
                </div>
                Host Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {room.status === 'waiting' && (
                  <Button 
                    onClick={startRoom} 
                    className="bg-crucible-orange hover:bg-crucible-orange/90 h-12 sm:h-14 text-base sm:text-lg font-semibold col-span-1 sm:col-span-1"
                  >
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Start Room
                  </Button>
                )}
                {room.status === 'active' && (
                  <Button 
                    onClick={stopRoom} 
                    variant="destructive"
                    className="h-12 sm:h-14 text-base sm:text-lg font-semibold col-span-1 sm:col-span-1"
                  >
                    <Square className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Stop Room
                  </Button>
                )}
                <Button 
                  onClick={resetRoom} 
                  variant="outline"
                  className="h-12 sm:h-14 text-base sm:text-lg font-semibold border-2 col-span-1 sm:col-span-1"
                >
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Reset Room
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participant Controls */}
        {!isHost && room.status === 'active' && (
          <Card className="mb-6 lg:mb-8 border-2 border-storm-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="p-2 bg-crucible-orange/10 rounded-lg">
                  <Zap className="h-5 w-5 text-crucible-orange" />
                </div>
                Your Buzzer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={buzz} 
                disabled={hasBuzzed}
                className={`w-full h-20 sm:h-24 text-lg sm:text-xl font-bold transition-all duration-300 ${
                  hasBuzzed 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-crucible-orange hover:bg-crucible-orange/90 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                }`}
              >
                {hasBuzzed ? `BUZZED! (#${currentParticipant?.order})` : 'BUZZ IN!'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Participants List */}
        <Card className="border-2 border-storm-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
              <div className="p-2 bg-crucible-orange/10 rounded-lg">
                <Users className="h-5 w-5 text-crucible-orange" />
              </div>
              Participants ({participantsArray.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {participantsArray.map(([userId, participant]) => (
                <div 
                  key={userId} 
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-all duration-200 ${
                    participant.buzzed 
                      ? 'bg-crucible-orange/10 border-2 border-crucible-orange/30' 
                      : 'bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {room.host_id === userId && (
                      <div className="p-1 bg-yellow-500/20 rounded-full">
                        <Crown className="h-4 w-4 text-yellow-500" />
                      </div>
                    )}
                    <span className="font-medium text-sm sm:text-base">{participant.name}</span>
                    {participant.buzzed && (
                      <Badge variant="default" className="bg-crucible-orange text-xs sm:text-sm">
                        #{participant.order}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.buzzed ? (
                      <div className="p-2 bg-green-500/20 rounded-full">
                        <Zap className="h-4 w-4 text-green-500" />
                      </div>
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
        <div className="mt-6 lg:mt-8 text-center">
          <Button 
            onClick={leaveRoom} 
            variant="outline"
            className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold border-2 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}
