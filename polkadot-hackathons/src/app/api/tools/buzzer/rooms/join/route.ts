import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buzzerStorage } from '@/server/buzzer-storage';
import { wsServer } from '@/server/websocket-server';

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

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Room is not accepting participants' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const participantName = profile?.full_name || user.email || 'Anonymous';
    
    // Check if user is already in the room (Record-based participants)
    if (room.participants[user.id]) {
      return NextResponse.json({ error: 'Already in room' }, { status: 400 });
    }
    
    const success = buzzerStorage.addParticipant(room.id, user.id, participantName);
    
    if (success) {
      // Broadcast room update to all connected clients
      wsServer.broadcastRoomUpdate(room.id);
      
      return NextResponse.json({ room: { id: room.id, pin: room.pin } });
    } else {
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
