import { NextRequest, NextResponse } from 'next/server';
import { buzzerStorage } from '@/lib/buzzer-storage';
import { broadcastToRoom } from '@/lib/buzzer-sse';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    
    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const room = buzzerStorage.getRoomByPin(pin);
    if (!room) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 404 });
    }

    // Allow joining when room is waiting or active; block only when finished
    if (room.status === 'finished') {
      return NextResponse.json({ error: 'Room has finished' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providedName = request.headers.get('x-user-name');
    const participantName = providedName && providedName.trim() !== '' ? providedName : 'Anonymous';
    
    // Check if user is already in the room (Record-based participants)
    if (room.participants[userId]) {
      return NextResponse.json({ error: 'Already in room' }, { status: 400 });
    }
    
    const success = buzzerStorage.addParticipant(room.id, userId, {
      name: participantName,
      buzzed: false
    });
    
    if (success) {
      // Broadcast room update to all connected clients via SSE
      const updatedRoom = buzzerStorage.getRoom(room.id);
      if (updatedRoom) {
        broadcastToRoom(room.id, {
          type: 'room_update',
          room: {
            ...updatedRoom,
            created_at: updatedRoom.created_at.toISOString(),
            participants: updatedRoom.participants
          }
        });
      }
      
      return NextResponse.json({ room: { id: room.id, pin: room.pin } });
    } else {
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
