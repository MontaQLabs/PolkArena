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
    const { status } = await request.json();
    
    if (!status || !['waiting', 'active', 'finished'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const room = buzzerStorage.getRoom(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only the host can change room status
    if (room.host_id !== user.id) {
      return NextResponse.json({ error: 'Only host can change room status' }, { status: 403 });
    }
    
    const success = buzzerStorage.updateRoomStatus(id, status);
    
    if (success) {
      // Broadcast status change to all connected clients
      wsServer.broadcastStatusChange(id, status);
      
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating room status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
