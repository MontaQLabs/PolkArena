import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: 'room_update' | 'buzz' | 'status_change' | 'reset_room';
  roomId: string;
  data: {
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
  };
}

interface UseBuzzerWebSocketProps {
  roomId: string;
  userId: string;
  onRoomUpdate?: (data: WebSocketMessage['data']) => void;
  onBuzz?: (data: WebSocketMessage['data']) => void;
  onStatusChange?: (data: WebSocketMessage['data']) => void;
  onReset?: (data: WebSocketMessage['data']) => void;
}

export function useBuzzerWebSocket({
  roomId,
  userId,
  onRoomUpdate,
  onBuzz,
  onStatusChange,
  onReset
}: UseBuzzerWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
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
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/tools/buzzer/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected to buzzer server');
        // Join the room
        ws.send(JSON.stringify({
          type: 'join_room',
          roomId,
          data: { userId }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'room_update':
              onRoomUpdateRef.current?.(message.data);
              break;
            case 'buzz':
              onBuzzRef.current?.(message.data);
              break;
            case 'status_change':
              onStatusChangeRef.current?.(message.data);
              break;
            case 'reset_room':
              onResetRef.current?.(message.data);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        if (event.code !== 1000) { // Not a normal closure
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [roomId, userId]);

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

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    sendMessage,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}
