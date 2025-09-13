import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quizWsServer } from '@/server/quiz-websocket-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { questionIndex, timeLimit } = await request.json();

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

    // Get the question
    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', room.quiz_id)
      .eq('order_index', questionIndex)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Broadcast question start to all participants
    quizWsServer.broadcastQuestionStart(id, questionIndex, question, timeLimit || question.time_limit);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting question:', error);
    return NextResponse.json({ error: 'Failed to start question' }, { status: 500 });
  }
}
