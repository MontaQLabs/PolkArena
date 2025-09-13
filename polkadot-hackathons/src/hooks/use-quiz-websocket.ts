"use client";

import { useEffect, useRef, useCallback } from 'react';

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[] | null;
  correct_answer: string;
  points: number;
  time_limit: number;
  order_index: number;
  created_at: string;
}

interface QuizParticipant {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  score: number;
  joined_at: string;
}

interface QuizRoom {
  id: string;
  quiz_id: string;
  host_id: string;
  room_name: string;
  pin: string;
  status: 'waiting' | 'active' | 'finished';
  current_question_index: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

interface QuizWebSocketMessage {
  type: 'question_start' | 'question_end' | 'answer_submitted' | 'participant_joined' | 'participant_left' | 'score_update' | 'room_status_change' | 'room_update';
  roomId: string;
  data: {
    questionIndex?: number;
    question?: QuizQuestion;
    timeLeft?: number;
    userId?: string;
    participantName?: string;
    answer?: string;
    isCorrect?: boolean;
    pointsEarned?: number;
    timeTaken?: number;
    scores?: QuizParticipant[];
    status?: string;
    room?: QuizRoom;
  };
}

interface UseQuizWebSocketProps {
  roomId: string;
  userId: string;
  participantName: string;
  isHost: boolean;
  onQuestionStart: (data: { questionIndex: number; question: QuizQuestion; timeLeft?: number }) => void;
  onQuestionEnd: (data: { questionIndex: number }) => void;
  onAnswerSubmitted: (data: { userId: string; participantName: string; answer: string; isCorrect: boolean; pointsEarned: number; timeTaken: number }) => void;
  onParticipantJoined: (data: { userId: string; participantName: string }) => void;
  onParticipantLeft: (data: { userId: string; participantName: string }) => void;
  onScoreUpdate: (data: { scores: QuizParticipant[] }) => void;
  onRoomStatusChange: (data: { status: string }) => void;
  onRoomUpdate: (data: { room: QuizRoom }) => void;
}

export function useQuizWebSocket({
  roomId,
  userId,
  participantName,
  isHost,
  onQuestionStart,
  onQuestionEnd,
  onAnswerSubmitted,
  onParticipantJoined,
  onParticipantLeft,
  onScoreUpdate,
  onRoomStatusChange,
  onRoomUpdate
}: UseQuizWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/tools/quiz/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Quiz WebSocket connected');
        reconnectAttempts.current = 0;
        
        // Send join room message
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'join_room',
            roomId,
            data: {
              userId,
              participantName,
              isHost
            }
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: QuizWebSocketMessage = JSON.parse(event.data);
          
          if (message.roomId !== roomId) {
            return; // Ignore messages for other rooms
          }

          switch (message.type) {
            case 'question_start':
              if (message.data.question) {
                onQuestionStart({
                  questionIndex: message.data.questionIndex || 0,
                  question: message.data.question,
                  timeLeft: message.data.timeLeft
                });
              }
              break;
            case 'question_end':
              if (message.data.questionIndex !== undefined) {
                onQuestionEnd({
                  questionIndex: message.data.questionIndex
                });
              }
              break;
            case 'answer_submitted':
              if (message.data.userId && message.data.participantName && message.data.answer !== undefined && 
                  message.data.isCorrect !== undefined && message.data.pointsEarned !== undefined && 
                  message.data.timeTaken !== undefined) {
                onAnswerSubmitted({
                  userId: message.data.userId,
                  participantName: message.data.participantName,
                  answer: message.data.answer,
                  isCorrect: message.data.isCorrect,
                  pointsEarned: message.data.pointsEarned,
                  timeTaken: message.data.timeTaken
                });
              }
              break;
            case 'participant_joined':
              if (message.data.userId && message.data.participantName) {
                onParticipantJoined({
                  userId: message.data.userId,
                  participantName: message.data.participantName
                });
              }
              break;
            case 'participant_left':
              if (message.data.userId && message.data.participantName) {
                onParticipantLeft({
                  userId: message.data.userId,
                  participantName: message.data.participantName
                });
              }
              break;
            case 'score_update':
              if (message.data.scores) {
                onScoreUpdate({
                  scores: message.data.scores
                });
              }
              break;
            case 'room_status_change':
              if (message.data.status) {
                onRoomStatusChange({
                  status: message.data.status
                });
              }
              break;
            case 'room_update':
              if (message.data.room) {
                onRoomUpdate({
                  room: message.data.room
                });
              }
              break;
            default:
              console.warn('Unknown quiz WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing quiz WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Quiz WebSocket disconnected');
        
        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current - 1); // Exponential backoff
          
          console.log(`Attempting to reconnect quiz WebSocket in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max quiz WebSocket reconnection attempts reached');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Quiz WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error creating quiz WebSocket connection:', error);
    }
  }, [roomId, userId, participantName, isHost, onQuestionStart, onQuestionEnd, onAnswerSubmitted, onParticipantJoined, onParticipantLeft, onScoreUpdate, onRoomStatusChange, onRoomUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // Send leave room message
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'leave_room',
          roomId
        }));
      }
      
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [roomId]);

  const sendMessage = useCallback((message: QuizWebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Quiz WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    disconnect
  };
}
