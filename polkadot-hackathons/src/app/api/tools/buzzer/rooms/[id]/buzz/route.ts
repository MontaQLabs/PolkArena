import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buzzerStorage } from '@/server/buzzer-storage';
import { wsServer } from '@/server/websocket-server';

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

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a participant in the room
    if (!room.participants[user.id]) {
      return NextResponse.json({ error: 'Not a participant in this room' }, { status: 403 });
    }
    
    const success = buzzerStorage.updateParticipantBuzzer(id, user.id, buzzed);
    
    if (success) {
      const participant = room.participants[user.id];
      if (participant && buzzed) {
        // Broadcast buzz to all connected clients
        wsServer.broadcastBuzz(id, participant.name, participant.order || 0);
      }
      
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ error: 'Failed to update buzzer state' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating buzzer state:', error);
    return NextResponse.json({ error: 'Failed to update buzzer state' }, { status: 500 });
  }
}
