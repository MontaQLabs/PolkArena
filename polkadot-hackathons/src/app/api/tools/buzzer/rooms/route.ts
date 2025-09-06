import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buzzerStorage } from '@/server/buzzer-storage';
import { wsServer } from '@/server/websocket-server';

export async function GET() {
  try {
    const rooms = buzzerStorage.getAllRooms();
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { room_name, description } = await request.json();
    
    if (!room_name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const hostName = profile?.full_name || user.email || 'Anonymous';
    
    const room = buzzerStorage.createRoom(room_name, user.id, hostName, description);
    
    // Broadcast room update to all connected clients
    wsServer.broadcastRoomUpdate(room.id);
    
    return NextResponse.json({ room: { ...room, created_at: room.created_at.toISOString(), participant_count: room.participants.size } });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
