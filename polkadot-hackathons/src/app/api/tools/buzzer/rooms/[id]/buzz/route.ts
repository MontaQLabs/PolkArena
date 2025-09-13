import { NextRequest, NextResponse } from 'next/server';
import { buzzerStorage } from '@/lib/buzzer-storage';
import { broadcastToRoom } from '@/lib/buzzer-sse';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { buzzed } = await request.json();
    
    if (typeof buzzed !== 'boolean') {
      return NextResponse.json({ error: 'Buzzed state is required' }, { status: 400 });
    }

    const room = buzzerStorage.getRoom(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'active') {
      return NextResponse.json({ error: 'Room is not active' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a participant in the room
    if (!room.participants[userId]) {
      return NextResponse.json({ error: 'Not a participant in this room' }, { status: 403 });
    }
    
    const success = buzzerStorage.updateParticipantBuzzer(id, userId, buzzed);
    
    if (success) {
      const updatedRoom = buzzerStorage.getRoom(id);
      const participant = updatedRoom?.participants[userId];
      if (participant && buzzed) {
        // Broadcast buzz to all connected clients via SSE
        broadcastToRoom(id, {
          type: 'buzz',
          participantName: participant.name,
          order: participant.order || 0
        });
      }
      
      return NextResponse.json({ 
        ok: true, 
        order: participant?.order 
      });
    } else {
      return NextResponse.json({ error: 'Failed to update buzzer state' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating buzzer state:', error);
    return NextResponse.json({ error: 'Failed to update buzzer state' }, { status: 500 });
  }
}
