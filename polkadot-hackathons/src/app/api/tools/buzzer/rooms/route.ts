import { NextRequest, NextResponse } from 'next/server';
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

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prefer name provided by client header; fallback to 'Anonymous'
    const providedName = request.headers.get('x-user-name');
    const hostName = providedName && providedName.trim() !== '' ? providedName : 'Anonymous';
    
    const room = buzzerStorage.createRoom(room_name, userId, hostName, description);
    
    // Broadcast room update to all connected clients
    wsServer.broadcastRoomUpdate(room.id);
    
    return NextResponse.json({ room: { ...room, created_at: room.created_at.toISOString(), participant_count: Object.keys(room.participants).length } });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
