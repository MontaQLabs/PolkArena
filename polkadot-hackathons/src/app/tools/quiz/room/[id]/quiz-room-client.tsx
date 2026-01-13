"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { useQuizSSE } from "@/hooks/use-quiz-sse";
import { Clock, Users, Trophy, CheckCircle, XCircle, Play, Square } from "lucide-react";

type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];
type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
type QuizParticipant = Database["public"]["Tables"]["quiz_participants"]["Row"];

interface QuizRoomClientProps {
  roomId: string;
}

export default function QuizRoomClient({ roomId }: QuizRoomClientProps) {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<QuizRoom | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<QuizParticipant | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionActive, setQuestionActive] = useState(false);

  // Load participants helper (defined early so callbacks can depend on it)
  const loadParticipants = useCallback(async () => {
    if (!roomId) return;

    try {
      const { data: participantsData } = await supabase
        .from("quiz_participants")
        .select("*")
        .eq("room_id", roomId)
        .order("score", { ascending: false });

      if (participantsData) {
        setParticipants(participantsData);
      }
    } catch (error) {
      console.error("Error loading participants:", error);
    }
  }, [roomId]);

  // SSE handlers
  const handleQuestionStart = useCallback((data: { questionIndex?: number; question?: QuizQuestion; timeLeft?: number }) => {
    if (data.questionIndex !== undefined && data.question) {
      setCurrentQuestionIndex(data.questionIndex);
      setCurrentQuestion(data.question);
      setQuestionActive(true);
      setTimeLeft(data.timeLeft || data.question.time_limit || 30);
      setQuestionStartTime(Date.now());
      setHasAnswered(false);
      setSelectedAnswer("");
      setShowResults(false);
    }
  }, []);

  const handleQuestionEnd = useCallback((data: { questionIndex?: number }) => {
    if (data.questionIndex !== undefined) {
      setQuestionActive(false);
      setShowResults(true);
    }
  }, []);

  const handleAnswerSubmitted = useCallback((data: { userId?: string; participantName?: string; answer?: string; isCorrect?: boolean; pointsEarned?: number; timeTaken?: number }) => {
    if (data.userId && data.pointsEarned !== undefined) {
      // Update participants list to reflect new scores
      setParticipants(prev => prev.map(p => 
        p.user_id === data.userId 
          ? { ...p, score: p.score + data.pointsEarned! }
          : p
      ));
    }
  }, []);

  const handleParticipantJoined = useCallback((data: { userId?: string; participantName?: string }) => {
    if (data.userId) {
      // Refresh participants list
      loadParticipants();
    }
  }, [loadParticipants]);

  const handleParticipantLeft = useCallback((data: { userId?: string; participantName?: string }) => {
    if (data.userId) {
      // Refresh participants list
      loadParticipants();
    }
  }, [loadParticipants]);

  const handleScoreUpdate = useCallback((data: { scores?: QuizParticipant[] }) => {
    if (data.scores) {
      setParticipants(data.scores);
    }
  }, []);

  const handleRoomStatusChange = useCallback((data: { status?: string }) => {
    if (data.status) {
      setRoom(prev => prev ? { ...prev, status: data.status as 'waiting' | 'active' | 'finished' } : null);
    }
  }, []);

  const handleRoomUpdate = useCallback((data: { room?: QuizRoom }) => {
    if (data.room) {
      setRoom(data.room);
    }
  }, []);

  // Initialize SSE connection
  const { isConnected } = useQuizSSE({
    roomId,
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
    if (user && roomId) {
      const loadRoomData = async () => {
        try {
          // Fetch room
          const { data: roomData, error: roomError } = await supabase
            .from("quiz_rooms")
            .select("*")
            .eq("id", roomId)
            .single();

          if (roomError || !roomData) {
            router.push("/tools/quiz");
            return;
          }

          setRoom(roomData);
          setCurrentQuestionIndex(roomData.current_question_index);
          setIsHost(roomData.host_id === user?.id);

          // Fetch questions
          const { data: questionsData } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", roomData.quiz_id)
            .order("order_index", { ascending: true });

          if (questionsData) {
            setQuestions(questionsData);
            if (questionsData.length > 0) {
              setCurrentQuestion(questionsData[roomData.current_question_index] || questionsData[0]);
            }
          }

          // Load participants
          await loadParticipants();

          // Check if user is already a participant
          const { data: participantData } = await supabase
            .from("quiz_participants")
            .select("*")
            .eq("room_id", roomId)
            .eq("user_id", user?.id)
            .single();

          if (participantData) {
            setCurrentParticipant(participantData);
          } else {
            // Join as participant
            const { data: newParticipant, error: joinError } = await supabase
              .from("quiz_participants")
              .insert({
                room_id: roomId,
                user_id: user.id,
                display_name: profile?.name || user.user_metadata?.full_name || user.email || 'Anonymous'
              })
              .select()
              .single();

            if (newParticipant && !joinError) {
              setCurrentParticipant(newParticipant);
              await loadParticipants();
            }
          }

          // Check if user has already answered the current question
          if (participantData || currentParticipant) {
            const participantId = participantData?.id || currentParticipant?.id;
            if (participantId && questionsData && questionsData.length > 0) {
              const currentQ = questionsData[roomData.current_question_index] || questionsData[0];
              const { data: answerData } = await supabase
                .from("quiz_answers")
                .select("*")
                .eq("room_id", roomId)
                .eq("question_id", currentQ.id)
                .eq("participant_id", participantId)
                .single();

              if (answerData) {
                setHasAnswered(true);
                setSelectedAnswer(answerData.answer);
              }
            }
          }

        } catch (error) {
          console.error("Error loading room data:", error);
        } finally {
          setLoading(false);
        }
      };

      loadRoomData();
    }
  }, [user, roomId, router, profile, loadParticipants, currentParticipant]);

  const submitAnswer = useCallback(async () => {
    if (!currentQuestion || !currentParticipant || hasAnswered) return;

    const timeTaken = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;

    try {
      const response = await fetch(`/api/tools/quiz/rooms/${roomId}/submit-answer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`,
          'X-User-Name': profile?.name || user?.user_metadata?.full_name || user?.email || 'Anonymous'
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: selectedAnswer,
          timeTaken
        })
      });

      if (response.ok) {
        const data = await response.json();
        setHasAnswered(true);
        
        // Update local participant score
        if (currentParticipant) {
          setCurrentParticipant(prev => prev ? { ...prev, score: prev.score + data.pointsEarned } : null);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer');
    }
  }, [currentQuestion, currentParticipant, hasAnswered, questionStartTime, roomId, user?.id, profile?.name, user?.user_metadata?.full_name, user?.email, selectedAnswer]);

  // Timer effect
  useEffect(() => {
    if (questionActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (questionActive && timeLeft === 0) {
      // Time's up - auto-submit if not answered
      if (!hasAnswered && selectedAnswer) {
        submitAnswer();
      }
    }
  }, [questionActive, timeLeft, hasAnswered, selectedAnswer, submitAnswer]);

  const startQuestion = async () => {
    if (!room || !isHost) return;

    const question = questions[currentQuestionIndex];
    if (!question) return;

    try {
      const response = await fetch(`/api/tools/quiz/rooms/${roomId}/start-question`, {
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
    if (!room || !isHost) return;

    try {
      const response = await fetch(`/api/tools/quiz/rooms/${roomId}/end-question`, {
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
    if (!room || !isHost || currentQuestionIndex >= questions.length - 1) return;

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setCurrentQuestion(questions[nextIndex]);
    setShowResults(false);
    setHasAnswered(false);
    setSelectedAnswer("");

    // Update room in database
    await supabase
      .from("quiz_rooms")
      .update({ current_question_index: nextIndex })
      .eq("id", roomId);
  };

  const leaveRoom = () => {
    router.push('/tools/quiz');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sui-sea mx-auto mb-4"></div>
          <p>Loading quiz room...</p>
        </div>
      </div>
    );
  }

  if (!room || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Room not found or you need to be signed in
          </p>
          <Button onClick={leaveRoom} variant="outline">
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-sui-sea mb-4">
            🧠 {room.room_name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <Badge variant="secondary" className="text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4" />
              <span>{participants.length} participants</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600 dark:text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <Card className="mb-6 border-2 border-storm-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Host Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {!questionActive && !showResults && (
                  <Button onClick={startQuestion} className="bg-sui-sea hover:bg-sui-sea/90">
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
                  <Button onClick={() => setRoom(prev => prev ? { ...prev, status: 'finished' } : null)} variant="outline">
                    Finish Quiz
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Question */}
        {currentQuestion && (
          <Card className="mb-6 border-2 border-storm-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Question {currentQuestionIndex + 1}</span>
                {questionActive && (
                  <div className="flex items-center gap-2 text-sui-sea">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono text-lg">{timeLeft}s</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {currentQuestion.question_type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'} • {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-6">{currentQuestion.question_text}</p>
              
              {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === option ? "default" : "outline"}
                      className={`w-full justify-start h-12 text-left ${
                        selectedAnswer === option 
                          ? 'bg-sui-sea hover:bg-sui-sea/90' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => !hasAnswered && setSelectedAnswer(option)}
                      disabled={hasAnswered}
                    >
                      <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              {currentQuestion.question_type === 'true_false' && (
                <div className="space-y-3">
                  <Button
                    variant={selectedAnswer === 'true' ? "default" : "outline"}
                    className={`w-full h-12 ${
                      selectedAnswer === 'true' 
                        ? 'bg-sui-sea hover:bg-sui-sea/90' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => !hasAnswered && setSelectedAnswer('true')}
                    disabled={hasAnswered}
                  >
                    True
                  </Button>
                  <Button
                    variant={selectedAnswer === 'false' ? "default" : "outline"}
                    className={`w-full h-12 ${
                      selectedAnswer === 'false' 
                        ? 'bg-sui-sea hover:bg-sui-sea/90' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => !hasAnswered && setSelectedAnswer('false')}
                    disabled={hasAnswered}
                  >
                    False
                  </Button>
                </div>
              )}

              {!hasAnswered && selectedAnswer && questionActive && (
                <div className="mt-6">
                  <Button 
                    onClick={submitAnswer} 
                    className="w-full h-12 bg-sui-sea hover:bg-sui-sea/90 text-lg font-semibold"
                  >
                    Submit Answer
                  </Button>
                </div>
              )}

              {hasAnswered && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedAnswer === currentQuestion.correct_answer ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-semibold">
                      {selectedAnswer === currentQuestion.correct_answer ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Your answer: {selectedAnswer}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Correct answer: {currentQuestion.correct_answer}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="border-2 border-storm-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div 
                  key={participant.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    participant.user_id === user?.id 
                      ? 'bg-sui-sea/10 border-2 border-sui-sea/30' 
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
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
                    {participant.user_id === user?.id && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{participant.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leave Room Button */}
        <div className="mt-6 text-center">
          <Button onClick={leaveRoom} variant="outline" className="h-12 px-8">
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}
