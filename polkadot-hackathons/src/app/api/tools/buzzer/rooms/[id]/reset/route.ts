import { NextRequest, NextResponse } from 'next/server';
import { buzzerStorage } from '@/server/buzzer-storage';
import { wsServer } from '@/server/websocket-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = buzzerStorage.getRoom(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only the host can reset the room
    if (room.host_id !== userId) {
      return NextResponse.json({ error: 'Only host can reset room' }, { status: 403 });
    }
    
    const success = buzzerStorage.resetRoom(id);
    
    if (success) {
      // Broadcast reset to all connected clients
      wsServer.broadcastReset(id);
      
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ error: 'Failed to reset room' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error resetting room:', error);
    return NextResponse.json({ error: 'Failed to reset room' }, { status: 500 });
  }
}
