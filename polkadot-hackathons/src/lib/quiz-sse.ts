import { Database } from '@/lib/database.types';

type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
type QuizParticipant = Database["public"]["Tables"]["quiz_participants"]["Row"];
type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];

// Store active SSE connections for quiz rooms
const connections = new Map<string, ReadableStreamDefaultController[]>();

// Function to broadcast to all connections in a quiz room
export function broadcastToQuizRoom(roomId: string, data: {
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
}) {
  const roomConnections = connections.get(roomId);
  if (roomConnections) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    roomConnections.forEach(controller => {
      try {
        controller.enqueue(message);
      } catch (error) {
        console.error('Error sending quiz SSE message:', error);
      }
    });
  }
}

// Function to add a connection to a quiz room
export function addQuizConnection(roomId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(roomId)) {
    connections.set(roomId, []);
  }
  connections.get(roomId)!.push(controller);
}

// Function to remove a connection from a quiz room
export function removeQuizConnection(roomId: string, controller: ReadableStreamDefaultController) {
  const roomConnections = connections.get(roomId);
  if (roomConnections) {
    const index = roomConnections.indexOf(controller);
    if (index > -1) {
      roomConnections.splice(index, 1);
    }
    if (roomConnections.length === 0) {
      connections.delete(roomId);
    }
  }
}
