import { NextRequest } from 'next/server';
import { addQuizConnection, removeQuizConnection } from '@/lib/quiz-sse';

// Extend the controller type to include our custom property
interface ExtendedController extends ReadableStreamDefaultController {
  __roomId?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const extendedController = controller as ExtendedController;
      
      // Add this connection to the room's connections
      addQuizConnection(id, controller);
      
      // Send initial room state (you can customize this based on your quiz room structure)
      const data = {
        type: 'room_update',
        room: {
          id,
          status: 'waiting'
        }
      };
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      
      // Store controller reference for cleanup
      extendedController.__roomId = id;
    },
    cancel(controller) {
      const extendedController = controller as ExtendedController;
      // Remove this connection when client disconnects
      const roomId = extendedController.__roomId || id;
      removeQuizConnection(roomId, controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

