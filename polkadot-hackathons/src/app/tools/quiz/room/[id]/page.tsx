import QuizRoomClient from './quiz-room-client';

interface QuizRoomPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizRoomPage({ params }: QuizRoomPageProps) {
  const { id } = await params;
  
  return <QuizRoomClient roomId={id} />;
}