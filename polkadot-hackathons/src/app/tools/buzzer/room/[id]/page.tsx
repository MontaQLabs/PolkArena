import BuzzerRoomClient from "./buzzer-room-client";

export default async function BuzzerRoomPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  
  return <BuzzerRoomClient roomId={resolvedParams.id} />;
}
