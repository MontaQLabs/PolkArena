"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { useQuizWebSocket } from "@/hooks/use-quiz-websocket";
import { Users, Play, Square, Trophy, Clock, CheckCircle } from "lucide-react";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];
type QuizParticipant = Database["public"]["Tables"]["quiz_participants"]["Row"];

interface QuizHostClientProps {
  quizId: string;
}

export default function QuizHostClient({ quizId }: QuizHostClientProps) {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [room, setRoom] = useState<QuizRoom | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionActive, setQuestionActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Load participants helper (defined early so callbacks can depend on it)
  const loadParticipants = useCallback(async () => {
    if (!room?.id) return;
    
    try {
      const { data: participantsData } = await supabase
        .from("quiz_participants")
        .select("*")
        .eq("room_id", room.id)
        .order("score", { ascending: false });

      if (participantsData) {
        setParticipants(participantsData);
      }
    } catch (error) {
      console.error("Error loading participants:", error);
    }
  }, [room?.id]);

  // WebSocket handlers
  const handleQuestionStart = useCallback((data: { questionIndex: number; question: QuizQuestion; timeLeft?: number }) => {
    setCurrentQuestionIndex(data.questionIndex);
    setQuestionActive(true);
    setTimeLeft(data.timeLeft || data.question.time_limit || 30);
    setShowResults(false);
  }, []);

  const handleQuestionEnd = useCallback(() => {
    setQuestionActive(false);
    setShowResults(true);
  }, []);

  const handleAnswerSubmitted = useCallback((_data: { userId: string; participantName: string; answer: string; isCorrect: boolean; pointsEarned: number; timeTaken: number }) => {
    // Update participants list to reflect new scores
    setParticipants(prev => prev.map(p => 
      p.user_id === _data.userId 
        ? { ...p, score: p.score + _data.pointsEarned }
        : p
    ));
  }, []);

  const handleParticipantJoined = useCallback(() => {
    // Refresh participants list
    loadParticipants();
  }, [loadParticipants]);

  const handleParticipantLeft = useCallback(() => {
    // Refresh participants list
    loadParticipants();
  }, [loadParticipants]);

  const handleScoreUpdate = useCallback((data: { scores: QuizParticipant[] }) => {
    setParticipants(data.scores);
  }, []);

  const handleRoomStatusChange = useCallback((data: { status: string }) => {
    setRoom(prev => prev ? { ...prev, status: data.status as 'waiting' | 'active' | 'finished' } : null);
  }, []);

  const handleRoomUpdate = useCallback((data: { room: QuizRoom }) => {
    setRoom(data.room);
  }, []);

  // Initialize WebSocket connection when room exists
  const { isConnected } = useQuizWebSocket({
    roomId: room?.id || '',
    userId: user?.id || '',
    participantName: profile?.name || user?.user_metadata?.full_name || user?.email || 'Anonymous',
    isHost: true,
    onQuestionStart: handleQuestionStart,
    onQuestionEnd: handleQuestionEnd,
    onAnswerSubmitted: handleAnswerSubmitted,
    onParticipantJoined: handleParticipantJoined,
    onParticipantLeft: handleParticipantLeft,
    onScoreUpdate: handleScoreUpdate,
    onRoomStatusChange: handleRoomStatusChange,
    onRoomUpdate: handleRoomUpdate
  });

  useEffect(() => {
    if (user && quizId) {
      const loadQuizData = async () => {
        try {
          // Fetch quiz
          const { data: quizData, error: quizError } = await supabase
            .from("quizzes")
            .select("*")
            .eq("id", quizId)
            .eq("host_id", user?.id)
            .single();

          if (quizError || !quizData) {
            router.push("/tools/quiz");
            return;
          }

          setQuiz(quizData);

          // Fetch questions
          const { data: questionsData } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", quizId)
            .order("order_index", { ascending: true });

          if (questionsData) {
            setQuestions(questionsData);
          }

          // Check if there's an existing room
          const { data: roomData } = await supabase
            .from("quiz_rooms")
            .select("*")
            .eq("quiz_id", quizId)
            .eq("host_id", user.id)
            .single();

          if (roomData) {
            setRoom(roomData);
            setCurrentQuestionIndex(roomData.current_question_index);
            await loadParticipants();
          }

        } catch (error) {
          console.error("Error loading quiz data:", error);
        } finally {
          setLoading(false);
        }
      };
      
      loadQuizData();
    }
  }, [user, quizId, router, loadParticipants]);

  // Timer effect for host view
  useEffect(() => {
    if (questionActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [questionActive, timeLeft]);

  const createRoom = async () => {
    if (!quiz || !roomName.trim()) return;

    setCreatingRoom(true);
    try {
      const { data: roomData, error: roomError } = await supabase
        .from("quiz_rooms")
        .insert({
          quiz_id: quiz.id,
          host_id: user?.id,
          room_name: roomName.trim(),
          pin: Math.floor(100000 + Math.random() * 900000).toString(),
          status: 'waiting'
        })
        .select()
        .single();

      if (roomError) {
        alert('Failed to create room');
        return;
      }

      setRoom(roomData);
      await loadParticipants();
    } catch (error) {
      console.error("Error creating room:", error);
      alert('Failed to create room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const startQuestion = async () => {
    if (!room || !questions[currentQuestionIndex]) return;

    const question = questions[currentQuestionIndex];
    
    try {
      const response = await fetch(`/api/tools/quiz/rooms/${room.id}/start-question`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`,
          'X-User-Name': profile?.name || user?.user_metadata?.full_name || user?.email || 'Anonymous'
        },
        body: JSON.stringify({ 
          questionIndex: currentQuestionIndex,
          timeLimit: question.time_limit
        })
      });

      if (response.ok) {
        // WebSocket will handle the update
        console.log('Question started');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start question');
      }
    } catch (error) {
      console.error('Error starting question:', error);
      alert('Failed to start question');
    }
  };

  const endQuestion = async () => {
    if (!room) return;

    try {
      const response = await fetch(`/api/tools/quiz/rooms/${room.id}/end-question`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`,
          'X-User-Name': profile?.name || user?.user_metadata?.full_name || user?.email || 'Anonymous'
        },
        body: JSON.stringify({ questionIndex: currentQuestionIndex })
      });

      if (response.ok) {
        // WebSocket will handle the update
        console.log('Question ended');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to end question');
      }
    } catch (error) {
      console.error('Error ending question:', error);
      alert('Failed to end question');
    }
  };

  const nextQuestion = async () => {
    if (!room || currentQuestionIndex >= questions.length - 1) return;

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setShowResults(false);

    // Update room in database
    await supabase
      .from("quiz_rooms")
      .update({ current_question_index: nextIndex })
      .eq("id", room.id);
  };

  const finishQuiz = async () => {
    if (!room) return;

    await supabase
      .from("quiz_rooms")
      .update({ status: 'finished' })
      .eq("id", room.id);

    setRoom(prev => prev ? { ...prev, status: 'finished' } : null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-polkadot-pink mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Quiz Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This quiz doesn&apos;t exist or you don&apos;t have permission to host it.
          </p>
          <Button onClick={() => router.push('/tools/quiz')} variant="outline">
            Back to Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-polkadot-pink mb-4">
            🧠 Host: {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {quiz.description}
            </p>
          )}
        </div>

        {!room ? (
          /* Create Room */
          <Card className="max-w-md mx-auto border-2 border-storm-200 shadow-lg">
            <CardHeader>
              <CardTitle>Create Quiz Room</CardTitle>
              <CardDescription>
                Create a room for participants to join your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={createRoom} 
                disabled={creatingRoom || !roomName.trim()}
                className="w-full bg-polkadot-pink hover:bg-polkadot-pink/90"
              >
                {creatingRoom ? 'Creating...' : 'Create Room'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Room Management */
          <div className="space-y-6">
            {/* Room Info */}
            <Card className="border-2 border-storm-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Room: {room.room_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">PIN: {room.pin}</Badge>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription>
                  Share the PIN with participants to join
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{participants.length} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Controls */}
            {questions.length > 0 && (
              <Card className="border-2 border-storm-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Question {currentQuestionIndex + 1}</span>
                    {questionActive && (
                      <div className="flex items-center gap-2 text-polkadot-pink">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-lg">{timeLeft}s</span>
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {questions[currentQuestionIndex]?.question_type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'} • {questions[currentQuestionIndex]?.points} point{questions[currentQuestionIndex]?.points !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-lg mb-6">{questions[currentQuestionIndex]?.question_text}</p>
                  
                  {questions[currentQuestionIndex]?.question_type === 'multiple_choice' && questions[currentQuestionIndex]?.options && (
                    <div className="space-y-2 mb-6">
                      {questions[currentQuestionIndex].options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="font-semibold w-6">{String.fromCharCode(65 + index)}.</span>
                          <span>{option}</span>
                          {option === questions[currentQuestionIndex].correct_answer && (
                            <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {questions[currentQuestionIndex]?.question_type === 'true_false' && (
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>True</span>
                        {questions[currentQuestionIndex].correct_answer === 'true' && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>False</span>
                        {questions[currentQuestionIndex].correct_answer === 'false' && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {!questionActive && !showResults && (
                      <Button onClick={startQuestion} className="bg-polkadot-pink hover:bg-polkadot-pink/90">
                        <Play className="h-4 w-4 mr-2" />
                        Start Question
                      </Button>
                    )}
                    {questionActive && (
                      <Button onClick={endQuestion} variant="destructive">
                        <Square className="h-4 w-4 mr-2" />
                        End Question
                      </Button>
                    )}
                    {showResults && currentQuestionIndex < questions.length - 1 && (
                      <Button onClick={nextQuestion} variant="outline">
                        Next Question
                      </Button>
                    )}
                    {showResults && currentQuestionIndex >= questions.length - 1 && (
                      <Button onClick={finishQuiz} variant="outline">
                        Finish Quiz
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participants Leaderboard */}
            <Card className="border-2 border-storm-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No participants yet</p>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant, index) => (
                      <div 
                        key={participant.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium">{participant.display_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{participant.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
