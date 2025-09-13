import QuizHostClient from './quiz-host-client';

interface QuizHostPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizHostPage({ params }: QuizHostPageProps) {
  const { id } = await params;
  
  return <QuizHostClient quizId={id} />;
}