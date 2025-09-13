import { WebSocketServer, WebSocket } from 'ws';
import { buzzerStorage } from './buzzer-storage';
import { quizWsServer } from './quiz-websocket-server';
import { Server } from 'http';

interface WebSocketMessage {
  type: 'join_room' | 'leave_room' | 'room_update' | 'buzz' | 'status_change' | 'reset_room';
  roomId: string;
  data?: {
    userId?: string;
    status?: string;
    participantName?: string;
    order?: number;
  };
}

interface RoomConnection {
  ws: WebSocket;
  roomId: string;
  userId: string;
}

interface WebSocketData {
  room?: {
    id: string;
    room_name: string;
    host_id: string;
    host_name: string;
    pin: string;
    status: 'waiting' | 'active' | 'finished';
    participants: Record<string, {
      name: string;
      buzzed: boolean;
      order?: number;
    }>;
    created_at: string;
  };
  participantCount?: number;
  status?: string;
  participantName?: string;
  order?: number;
}

class WebSocketServerManager {
  private wss: WebSocketServer | null = null;
  private connections: RoomConnection[] = [];

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/tools/buzzer/ws'
    });
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New Buzzer WebSocket connection established');
      
      ws.on('message', (message: string) => {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(message);
          this.handleMessage(ws, parsedMessage);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.removeConnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeConnection(ws);
      });
    });

    // Initialize quiz WebSocket server
    quizWsServer.initialize(server);
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'join_room':
        this.addConnection(ws, message.roomId, message.data?.userId || 'unknown');
        const room = buzzerStorage.getRoom(message.roomId);
        if (room) {
          this.broadcastToRoom(message.roomId, {
            type: 'room_update',
            roomId: message.roomId,
            data: {
              room: {
                ...room,
                created_at: room.created_at.toISOString(),
                participants: room.participants
              },
              participantCount: buzzerStorage.getParticipantCount(message.roomId)
            }
          });
        }
        break;
        
      case 'leave_room':
        this.removeConnection(ws);
        break;
        
      case 'buzz':
        this.broadcastToRoom(message.roomId, {
          type: 'buzz',
          roomId: message.roomId,
          data: message.data || {}
        });
        break;
        
      case 'status_change':
        this.broadcastToRoom(message.roomId, {
          type: 'status_change',
          roomId: message.roomId,
          data: message.data || {}
        });
        break;
        
      case 'reset_room':
        this.broadcastToRoom(message.roomId, {
          type: 'reset_room',
          roomId: message.roomId,
          data: message.data || {}
        });
        break;
    }
  }

  private addConnection(ws: WebSocket, roomId: string, userId: string) {
    this.removeConnection(ws); // Remove any existing connection for this WebSocket
    this.connections.push({ ws, roomId, userId });
    console.log(`User ${userId} joined room ${roomId} via WebSocket`);
  }

  private removeConnection(ws: WebSocket) {
    const index = this.connections.findIndex(conn => conn.ws === ws);
    if (index !== -1) {
      const connection = this.connections[index];
      console.log(`User ${connection.userId} left room ${connection.roomId} via WebSocket`);
      this.connections.splice(index, 1);
    }
  }

  private broadcastToRoom(roomId: string, message: { type: string; roomId: string; data: WebSocketData }) {
    const roomConnections = this.connections.filter(conn => conn.roomId === roomId);
    const messageStr = JSON.stringify(message);
    
    roomConnections.forEach(connection => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr);
      }
    });
    
    console.log(`Broadcasted to ${roomConnections.length} clients in room ${roomId}:`, message.type);
  }

  // Public methods for external use
  broadcastRoomUpdate(roomId: string) {
    const room = buzzerStorage.getRoom(roomId);
    if (room) {
      this.broadcastToRoom(roomId, {
        type: 'room_update',
        roomId,
        data: {
          room: { ...room, created_at: room.created_at.toISOString() },
          participantCount: Object.keys(room.participants).length
        }
      });
    }
  }

  broadcastStatusChange(roomId: string, status: string) {
    this.broadcastToRoom(roomId, {
      type: 'status_change',
      roomId,
      data: { status }
    });
  }

  broadcastBuzz(roomId: string, participantName: string, order: number) {
    this.broadcastToRoom(roomId, {
      type: 'buzz',
      roomId,
      data: { participantName, order }
    });
  }

  broadcastReset(roomId: string) {
    this.broadcastToRoom(roomId, {
      type: 'reset_room',
      roomId,
      data: {}
    });
  }
}

export const wsServer = new WebSocketServerManager();
