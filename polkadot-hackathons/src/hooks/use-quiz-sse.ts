import { useEffect, useRef, useCallback } from 'react';
import { Database } from '@/lib/database.types';

type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
type QuizParticipant = Database["public"]["Tables"]["quiz_participants"]["Row"];
type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];

interface QuizSSEMessage {
  type: 'question_start' | 'question_end' | 'answer_submitted' | 'participant_joined' | 'participant_left' | 'score_update' | 'room_status_change' | 'room_update';
  userId?: string;
  participantName?: string;
  isHost?: boolean;
  questionIndex?: number;
  question?: QuizQuestion;
  answer?: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  timeTaken?: number;
  participants?: QuizParticipant[];
  scores?: QuizParticipant[];
  status?: string;
  room?: QuizRoom;
  timeLeft?: number;
}

interface UseQuizSSEProps {
  roomId: string;
  onQuestionStart?: (data: QuizSSEMessage) => void;
  onQuestionEnd?: (data: QuizSSEMessage) => void;
  onAnswerSubmitted?: (data: QuizSSEMessage) => void;
  onParticipantJoined?: (data: QuizSSEMessage) => void;
  onParticipantLeft?: (data: QuizSSEMessage) => void;
  onScoreUpdate?: (data: QuizSSEMessage) => void;
  onRoomStatusChange?: (data: QuizSSEMessage) => void;
  onRoomUpdate?: (data: QuizSSEMessage) => void;
}

export function useQuizSSE({
  roomId,
  onQuestionStart,
  onQuestionEnd,
  onAnswerSubmitted,
  onParticipantJoined,
  onParticipantLeft,
  onScoreUpdate,
  onRoomStatusChange,
  onRoomUpdate
}: UseQuizSSEProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep latest handlers in refs to avoid reconnects on every render
  const onQuestionStartRef = useRef<typeof onQuestionStart | undefined>(undefined);
  const onQuestionEndRef = useRef<typeof onQuestionEnd | undefined>(undefined);
  const onAnswerSubmittedRef = useRef<typeof onAnswerSubmitted | undefined>(undefined);
  const onParticipantJoinedRef = useRef<typeof onParticipantJoined | undefined>(undefined);
  const onParticipantLeftRef = useRef<typeof onParticipantLeft | undefined>(undefined);
  const onScoreUpdateRef = useRef<typeof onScoreUpdate | undefined>(undefined);
  const onRoomStatusChangeRef = useRef<typeof onRoomStatusChange | undefined>(undefined);
  const onRoomUpdateRef = useRef<typeof onRoomUpdate | undefined>(undefined);

  useEffect(() => {
    onQuestionStartRef.current = onQuestionStart;
    onQuestionEndRef.current = onQuestionEnd;
    onAnswerSubmittedRef.current = onAnswerSubmitted;
    onParticipantJoinedRef.current = onParticipantJoined;
    onParticipantLeftRef.current = onParticipantLeft;
    onScoreUpdateRef.current = onScoreUpdate;
    onRoomStatusChangeRef.current = onRoomStatusChange;
    onRoomUpdateRef.current = onRoomUpdate;
  }, [onQuestionStart, onQuestionEnd, onAnswerSubmitted, onParticipantJoined, onParticipantLeft, onScoreUpdate, onRoomStatusChange, onRoomUpdate]);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      const eventSource = new EventSource(`/api/tools/quiz/rooms/${roomId}/events`);
      
      eventSource.onopen = () => {
        console.log('SSE connected to quiz server');
      };

      eventSource.onmessage = (event) => {
        try {
          const message: QuizSSEMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'question_start':
              onQuestionStartRef.current?.(message);
              break;
            case 'question_end':
              onQuestionEndRef.current?.(message);
              break;
            case 'answer_submitted':
              onAnswerSubmittedRef.current?.(message);
              break;
            case 'participant_joined':
              onParticipantJoinedRef.current?.(message);
              break;
            case 'participant_left':
              onParticipantLeftRef.current?.(message);
              break;
            case 'score_update':
              onScoreUpdateRef.current?.(message);
              break;
            case 'room_status_change':
              onRoomStatusChangeRef.current?.(message);
              break;
            case 'room_update':
              onRoomUpdateRef.current?.(message);
              break;
          }
        } catch (error) {
          console.error('Error parsing quiz SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Quiz SSE error:', error);
        eventSource.close();
        
        // Attempt to reconnect after 3 seconds, but only if we have a valid roomId
        if (roomId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to create quiz SSE connection:', error);
    }
  }, [roomId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    
    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, reconnect if needed
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, disconnect]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN
  };
}
