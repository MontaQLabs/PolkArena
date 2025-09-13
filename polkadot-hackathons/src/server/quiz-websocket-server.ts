import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[] | null;
  correct_answer: string;
  points: number;
  time_limit: number;
  order_index: number;
}

interface QuizParticipant {
  id: string;
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
  type: 'join_room' | 'leave_room' | 'room_update' | 'question_start' | 'question_end' | 'answer_submitted' | 'participant_joined' | 'participant_left' | 'score_update' | 'room_status_change';
  roomId: string;
  data?: {
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
    timeLeft?: number;
    room?: QuizRoom;
  };
}

interface QuizConnection {
  ws: WebSocket;
  userId: string;
  roomId: string;
  participantName: string;
  isHost: boolean;
}

export class QuizWebSocketServerManager {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, QuizConnection>();
  private roomConnections = new Map<string, Set<string>>(); // roomId -> Set of connectionIds

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/tools/quiz/ws'
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Quiz WebSocket connection established');
      
      ws.on('message', (data: Buffer) => {
        try {
          const message: QuizWebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing quiz WebSocket message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.removeConnection(ws);
      });

      ws.on('error', (error) => {
        console.error('Quiz WebSocket error:', error);
        this.removeConnection(ws);
      });
    });

    console.log('Quiz WebSocket server initialized');
  }

  private handleMessage(ws: WebSocket, message: QuizWebSocketMessage) {
    switch (message.type) {
      case 'join_room':
        this.addConnection(ws, message.roomId, message.data?.userId || '', message.data?.participantName || 'Anonymous', message.data?.isHost || false);
        break;
      case 'leave_room':
        this.removeConnection(ws);
        break;
      case 'question_start':
        if (message.data?.question) {
          this.broadcastQuestionStart(message.roomId, message.data.questionIndex || 0, message.data.question, message.data.timeLeft);
        }
        break;
      case 'question_end':
        this.broadcastQuestionEnd(message.roomId, message.data?.questionIndex || 0);
        break;
      case 'answer_submitted':
        this.broadcastAnswerSubmitted(message.roomId, message.data?.userId || '', message.data?.participantName || '', message.data?.answer || '', message.data?.isCorrect || false, message.data?.pointsEarned || 0, message.data?.timeTaken || 0);
        break;
      case 'participant_joined':
        this.broadcastParticipantJoined(message.roomId, message.data?.userId || '', message.data?.participantName || '');
        break;
      case 'participant_left':
        this.broadcastParticipantLeft(message.roomId, message.data?.userId || '', message.data?.participantName || '');
        break;
      case 'score_update':
        this.broadcastScoreUpdate(message.roomId, message.data?.scores || []);
        break;
      case 'room_status_change':
        this.broadcastRoomStatusChange(message.roomId, message.data?.status || 'waiting');
        break;
      default:
        console.warn('Unknown quiz WebSocket message type:', message.type);
    }
  }

  private addConnection(ws: WebSocket, roomId: string, userId: string, participantName: string, isHost: boolean) {
    const connectionId = `${userId}-${Date.now()}`;
    const connection: QuizConnection = {
      ws,
      userId,
      roomId,
      participantName,
      isHost
    };

    this.connections.set(connectionId, connection);

    // Add to room connections
    if (!this.roomConnections.has(roomId)) {
      this.roomConnections.set(roomId, new Set());
    }
    this.roomConnections.get(roomId)!.add(connectionId);

    console.log(`Quiz participant ${participantName} joined room ${roomId}`);
    
    // Notify others in the room
    this.broadcastParticipantJoined(roomId, userId, participantName);
  }

  private removeConnection(ws: WebSocket) {
    let connectionToRemove: QuizConnection | null = null;
    let connectionIdToRemove = '';

    // Find the connection
    for (const [id, connection] of this.connections.entries()) {
      if (connection.ws === ws) {
        connectionToRemove = connection;
        connectionIdToRemove = id;
        break;
      }
    }

    if (connectionToRemove) {
      const { roomId, userId, participantName } = connectionToRemove;
      
      // Remove from connections
      this.connections.delete(connectionIdToRemove);
      
      // Remove from room connections
      const roomConnections = this.roomConnections.get(roomId);
      if (roomConnections) {
        roomConnections.delete(connectionIdToRemove);
        if (roomConnections.size === 0) {
          this.roomConnections.delete(roomId);
        }
      }

      console.log(`Quiz participant ${participantName} left room ${roomId}`);
      
      // Notify others in the room
      this.broadcastParticipantLeft(roomId, userId, participantName);
    }
  }

  private broadcastToRoom(roomId: string, message: QuizWebSocketMessage) {
    const roomConnections = this.roomConnections.get(roomId);
    if (!roomConnections) return;

    const messageStr = JSON.stringify(message);
    
    for (const connectionId of roomConnections) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(messageStr);
        } catch (error) {
          console.error('Error sending quiz WebSocket message:', error);
          this.removeConnection(connection.ws);
        }
      }
    }
  }

  broadcastQuestionStart(roomId: string, questionIndex: number, question: QuizQuestion, timeLeft?: number) {
    this.broadcastToRoom(roomId, {
      type: 'question_start',
      roomId,
      data: {
        questionIndex,
        question,
        timeLeft
      }
    });
  }

  broadcastQuestionEnd(roomId: string, questionIndex: number) {
    this.broadcastToRoom(roomId, {
      type: 'question_end',
      roomId,
      data: {
        questionIndex
      }
    });
  }

  broadcastAnswerSubmitted(roomId: string, userId: string, participantName: string, answer: string, isCorrect: boolean, pointsEarned: number, timeTaken: number) {
    this.broadcastToRoom(roomId, {
      type: 'answer_submitted',
      roomId,
      data: {
        userId,
        participantName,
        answer,
        isCorrect,
        pointsEarned,
        timeTaken
      }
    });
  }

  broadcastParticipantJoined(roomId: string, userId: string, participantName: string) {
    this.broadcastToRoom(roomId, {
      type: 'participant_joined',
      roomId,
      data: {
        userId,
        participantName
      }
    });
  }

  broadcastParticipantLeft(roomId: string, userId: string, participantName: string) {
    this.broadcastToRoom(roomId, {
      type: 'participant_left',
      roomId,
      data: {
        userId,
        participantName
      }
    });
  }

  broadcastScoreUpdate(roomId: string, scores: QuizParticipant[]) {
    this.broadcastToRoom(roomId, {
      type: 'score_update',
      roomId,
      data: {
        scores
      }
    });
  }

  broadcastRoomStatusChange(roomId: string, status: string) {
    this.broadcastToRoom(roomId, {
      type: 'room_status_change',
      roomId,
      data: {
        status
      }
    });
  }

  broadcastRoomUpdate(roomId: string, roomData: QuizRoom) {
    this.broadcastToRoom(roomId, {
      type: 'room_update',
      roomId,
      data: {
        room: roomData
      }
    });
  }

  getRoomParticipantCount(roomId: string): number {
    const roomConnections = this.roomConnections.get(roomId);
    return roomConnections ? roomConnections.size : 0;
  }

  getRoomParticipants(roomId: string): QuizConnection[] {
    const roomConnections = this.roomConnections.get(roomId);
    if (!roomConnections) return [];

    const participants: QuizConnection[] = [];
    for (const connectionId of roomConnections) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        participants.push(connection);
      }
    }
    return participants;
  }
}

export const quizWsServer = new QuizWebSocketServerManager();
