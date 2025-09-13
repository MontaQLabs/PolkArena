import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { broadcastToQuizRoom } from '@/lib/quiz-sse';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { questionId, answer, timeTaken } = await request.json();

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get room and question details
    const { data: room, error: roomError } = await supabase
      .from('quiz_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Get participant
    const { data: participant, error: participantError } = await supabase
      .from('quiz_participants')
      .select('*')
      .eq('room_id', id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant in this room' }, { status: 403 });
    }

    // Check if already answered
    const { data: existingAnswer } = await supabase
      .from('quiz_answers')
      .select('*')
      .eq('room_id', id)
      .eq('question_id', questionId)
      .eq('participant_id', participant.id)
      .single();

    if (existingAnswer) {
      return NextResponse.json({ error: 'Already answered this question' }, { status: 400 });
    }

    // Check if answer is correct
    const isCorrect = answer === question.correct_answer;
    const pointsEarned = isCorrect ? question.points : 0;

    // Save answer
    const { data: answerData, error: answerError } = await supabase
      .from('quiz_answers')
      .insert({
        room_id: id,
        question_id: questionId,
        participant_id: participant.id,
        answer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken: timeTaken
      })
      .select()
      .single();

    if (answerError) {
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    // Update participant score
    const { error: scoreError } = await supabase
      .from('quiz_participants')
      .update({ score: participant.score + pointsEarned })
      .eq('id', participant.id);

    if (scoreError) {
      console.error('Error updating score:', scoreError);
    }

    // Broadcast answer submission to all participants via SSE
    broadcastToQuizRoom(id, {
      type: 'answer_submitted',
      userId: user.id,
      participantName: participant.display_name,
      answer,
      isCorrect,
      pointsEarned,
      timeTaken
    });

    return NextResponse.json({ 
      success: true, 
      isCorrect, 
      pointsEarned,
      answer: answerData
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}

