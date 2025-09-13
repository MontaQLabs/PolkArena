import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quizWsServer } from '@/server/quiz-websocket-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is host of the room
    const { data: room, error: roomError } = await supabase
      .from('quiz_rooms')
      .select('*')
      .eq('id', id)
      .eq('host_id', user.id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found or not authorized' }, { status: 404 });
    }

    // Get updated scores
    const { data: participants, error: participantsError } = await supabase
      .from('quiz_participants')
      .select('*')
      .eq('room_id', id)
      .order('score', { ascending: false });

    if (participantsError) {
      return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
    }

    // Broadcast score update to all participants
    quizWsServer.broadcastScoreUpdate(id, participants || []);

    return NextResponse.json({ success: true, scores: participants });
  } catch (error) {
    console.error('Error updating scores:', error);
    return NextResponse.json({ error: 'Failed to update scores' }, { status: 500 });
  }
}

