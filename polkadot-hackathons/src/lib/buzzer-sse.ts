// Store active SSE connections for buzzer rooms
const connections = new Map<string, ReadableStreamDefaultController[]>();

// Function to broadcast to all connections in a room
export function broadcastToRoom(roomId: string, data: {
  type: 'room_update' | 'buzz' | 'status_change' | 'reset_room';
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
}) {
  const roomConnections = connections.get(roomId);
  if (roomConnections) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    roomConnections.forEach(controller => {
      try {
        controller.enqueue(message);
      } catch (error) {
        console.error('Error sending SSE message:', error);
      }
    });
  }
}

// Function to add a connection to a room
export function addConnection(roomId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(roomId)) {
    connections.set(roomId, []);
  }
  connections.get(roomId)!.push(controller);
}

// Function to remove a connection from a room
export function removeConnection(roomId: string, controller: ReadableStreamDefaultController) {
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

