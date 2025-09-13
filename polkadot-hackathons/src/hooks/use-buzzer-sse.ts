import { useEffect, useRef, useCallback } from 'react';

interface SSEMessage {
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
}

interface UseBuzzerSSEProps {
  roomId: string;
  onRoomUpdate?: (data: SSEMessage) => void;
  onBuzz?: (data: SSEMessage) => void;
  onStatusChange?: (data: SSEMessage) => void;
  onReset?: (data: SSEMessage) => void;
}

export function useBuzzerSSE({
  roomId,
  onRoomUpdate,
  onBuzz,
  onStatusChange,
  onReset
}: UseBuzzerSSEProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep latest handlers in refs to avoid reconnects on every render
  const onRoomUpdateRef = useRef<typeof onRoomUpdate | undefined>(undefined);
  const onBuzzRef = useRef<typeof onBuzz | undefined>(undefined);
  const onStatusChangeRef = useRef<typeof onStatusChange | undefined>(undefined);
  const onResetRef = useRef<typeof onReset | undefined>(undefined);

  useEffect(() => {
    onRoomUpdateRef.current = onRoomUpdate;
    onBuzzRef.current = onBuzz;
    onStatusChangeRef.current = onStatusChange;
    onResetRef.current = onReset;
  }, [onRoomUpdate, onBuzz, onStatusChange, onReset]);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    // Don't connect if roomId is empty
    if (!roomId) {
      return;
    }

    try {
      const eventSource = new EventSource(`/api/tools/buzzer/rooms/${roomId}/events`);
      
      eventSource.onopen = () => {
        console.log('SSE connected to buzzer server');
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'room_update':
              onRoomUpdateRef.current?.(message);
              break;
            case 'buzz':
              onBuzzRef.current?.(message);
              break;
            case 'status_change':
              onStatusChangeRef.current?.(message);
              break;
            case 'reset_room':
              onResetRef.current?.(message);
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
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
      console.error('Failed to create SSE connection:', error);
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
