export async function GET() {
  // This route is for WebSocket upgrades
  // The actual WebSocket handling is done in the WebSocket server
  return new Response('WebSocket endpoint', { status: 200 });
}

// Note: WebSocket connections are handled by the WebSocket server
// This route exists to provide a valid endpoint for the frontend to connect to
