// src/server/buzzer-storage.ts
// This provides a shared, server-side in-memory storage instance for buzzer rooms.
// It is designed to be a singleton to ensure all API routes access the same data.

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
  participants: Record<string, BuzzerParticipant>;
  created_at: Date;
}

class BuzzerStorage {
  private rooms = new Map<string, BuzzerRoom>();

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  createRoom(roomName: string, hostId: string, hostName: string, description?: string): BuzzerRoom {
    const room: BuzzerRoom = {
      id: this.generateId(),
      room_name: roomName,
      description,
      host_id: hostId,
      host_name: hostName,
      pin: this.generatePin(),
      status: 'waiting',
      participants: {},
      created_at: new Date()
    };

    // Add host as first participant
    room.participants[hostId] = {
      name: hostName,
      buzzed: false
    };

    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId: string): BuzzerRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByPin(pin: string): BuzzerRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.pin === pin) {
        return room;
      }
    }
    return undefined;
  }

  getAllRooms(): BuzzerRoom[] {
    return Array.from(this.rooms.values()).map(room => ({
      ...room,
      created_at: room.created_at,
      participant_count: Object.keys(room.participants).length
    }));
  }

  updateRoomStatus(roomId: string, status: 'waiting' | 'active' | 'finished'): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
      return true;
    }
    return false;
  }

  addParticipant(roomId: string, userId: string, participantName: string): boolean {
    const room = this.rooms.get(roomId);
    if (room && room.status === 'waiting') {
      room.participants[userId] = {
        name: participantName,
        buzzed: false
      };
      return true;
    }
    return false;
  }

  removeParticipant(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      const removed = delete room.participants[userId];
      if (removed && Object.keys(room.participants).length === 0) {
        // Delete room if no participants left
        this.rooms.delete(roomId);
      }
      return removed;
    }
    return false;
  }

  updateParticipantBuzzer(roomId: string, userId: string, buzzed: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (room && room.status === 'active') {
      const participant = room.participants[userId];
      if (participant) {
        participant.buzzed = buzzed;
        if (buzzed) {
          // Assign order based on when they buzzed
          const buzzedParticipants = Object.values(room.participants).filter(p => p.buzzed);
          participant.order = buzzedParticipants.length;
        } else {
          participant.order = undefined;
        }
        return true;
      }
    }
    return false;
  }

  resetRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      // Reset all participants' buzzer state
      for (const participant of Object.values(room.participants)) {
        participant.buzzed = false;
        participant.order = undefined;
      }
      room.status = 'waiting';
      return true;
    }
    return false;
  }

  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  getParticipantCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room ? Object.keys(room.participants).length : 0;
  }
}

// Export a singleton instance
export const buzzerStorage = new BuzzerStorage();
