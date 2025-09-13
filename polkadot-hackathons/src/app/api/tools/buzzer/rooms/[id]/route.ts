import { NextRequest, NextResponse } from 'next/server';
import { buzzerStorage } from '@/lib/buzzer-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = buzzerStorage.getRoom(id);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      room: { 
        ...room, 
        created_at: room.created_at.toISOString(),
        participant_count: Object.keys(room.participants).length
      } 
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}
