import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quizWsServer } from '@/server/quiz-websocket-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { questionIndex } = await request.json();

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

    // Broadcast question end to all participants
    quizWsServer.broadcastQuestionEnd(id, questionIndex);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending question:', error);
    return NextResponse.json({ error: 'Failed to end question' }, { status: 500 });
  }
}

