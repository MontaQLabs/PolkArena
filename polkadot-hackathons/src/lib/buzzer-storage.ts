// Simple in-memory storage for buzzer rooms
// This provides a shared storage instance across all components

export interface BuzzerParticipant {
  name: string;
  buzzed: boolean;
  order?: number;
}

export interface BuzzerRoom {
  id: string;
  room_name: string;
  description?: string;
  host_id: string;
  host_name: string;
  pin: string;
  status: 'waiting' | 'active' | 'finished';
  participants: Map<string, BuzzerParticipant>;
  created_at: Date;
}

class BuzzerStorage {
  private rooms = new Map<string, BuzzerRoom>();

  // Generate unique room ID
  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Generate 6-digit PIN
  generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create a new room
  createRoom(roomData: Omit<BuzzerRoom, 'id' | 'pin' | 'created_at'>): BuzzerRoom {
    const id = this.generateRoomId();
    const pin = this.generatePin();
    const room: BuzzerRoom = {
      ...roomData,
      id,
      pin,
      created_at: new Date()
    };
    
    this.rooms.set(id, room);
    return room;
  }

  // Get room by ID
  getRoom(id: string): BuzzerRoom | undefined {
    return this.rooms.get(id);
  }

  // Get room by PIN
  getRoomByPin(pin: string): BuzzerRoom | undefined {
    return Array.from(this.rooms.values()).find(room => room.pin === pin);
  }

  // Get all rooms
  getAllRooms(): BuzzerRoom[] {
    return Array.from(this.rooms.values());
  }

  // Get rooms by status
  getRoomsByStatus(status: BuzzerRoom['status']): BuzzerRoom[] {
    return Array.from(this.rooms.values()).filter(room => room.status === status);
  }

  // Update room status
  updateRoomStatus(id: string, status: BuzzerRoom['status']): boolean {
    const room = this.rooms.get(id);
    if (room) {
      room.status = status;
      return true;
    }
    return false;
  }

  // Add participant to room
  addParticipant(roomId: string, userId: string, participant: BuzzerParticipant): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants.set(userId, participant);
      return true;
    }
    return false;
  }

  // Remove participant from room
  removeParticipant(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants.delete(userId);
      
      // If no participants left, delete the room
      if (room.participants.size === 0) {
        this.rooms.delete(roomId);
      }
      return true;
    }
    return false;
  }

  // Update participant buzzer state
  updateParticipantBuzzer(roomId: string, userId: string, buzzed: boolean, order?: number): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      const participant = room.participants.get(userId);
      if (participant) {
        participant.buzzed = buzzed;
        participant.order = order;
        return true;
      }
    }
    return false;
  }

  // Reset room (clear all buzzer states)
  resetRoom(id: string): boolean {
    const room = this.rooms.get(id);
    if (room) {
      room.participants.forEach(participant => {
        participant.buzzed = false;
        participant.order = undefined;
      });
      room.status = 'waiting';
      return true;
    }
    return false;
  }

  // Delete room
  deleteRoom(id: string): boolean {
    return this.rooms.delete(id);
  }

  // Get participant count for a room
  getParticipantCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room ? room.participants.size : 0;
  }
}

// Export a singleton instance
export const buzzerStorage = new BuzzerStorage();
