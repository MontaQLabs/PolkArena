"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];
type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
type QuizParticipant = Database["public"]["Tables"]["quiz_participants"]["Row"];


export default function QuizRoomPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

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
            router.push("/quiz");
            return;
          }

          setRoom(roomData);
          setCurrentQuestionIndex(roomData.current_question_index);

          // Check if user is host
          setIsHost(roomData.host_id === user?.id);

          // Fetch questions
          const { data: questionsData } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", roomData.quiz_id)
            .order("order_index", { ascending: true });

          if (questionsData) {
            setQuestions(questionsData);
          }

          // Fetch participants
          const { data: participantsData } = await supabase
            .from("quiz_participants")
            .select("*")
            .eq("room_id", roomId)
            .order("score", { ascending: false });

          if (participantsData) {
            setParticipants(participantsData);
          }

          // Check if user is already a participant
          const { data: participantData } = await supabase
            .from("quiz_participants")
            .select("*")
            .eq("room_id", roomId)
            .eq("user_id", user?.id)
            .single();

          if (participantData) {
            setCurrentParticipant(participantData);
          }

          // Check if user has already answered the current question
          if (participantData && questionsData) {
            const currentQuestion = questionsData[roomData.current_question_index];
            if (currentQuestion) {
              const { data: existingAnswer } = await supabase
                .from("quiz_answers")
                .select("*")
                .eq("room_id", roomId)
                .eq("participant_id", participantData.id)
                .eq("question_id", currentQuestion.id)
                .single();
              
              setHasAnswered(!!existingAnswer);
            }
          }

          if (roomData.status === 'finished') {
            setShowResults(true);
          }
        } catch (error) {
          console.error("Error fetching room data:", error);
        } finally {
          setLoading(false);
        }
      };
      
      loadRoomData();
    }
  }, [user, roomId, router]);

  useEffect(() => {
    if (room) {
      // Subscribe to room updates
      const roomSubscription = supabase
        .channel(`room-${room.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'quiz_rooms',
          filter: `id=eq.${room.id}`
        }, (payload) => {
          if (payload.new) {
            const updatedRoom = payload.new as QuizRoom;
            setRoom(updatedRoom);
            setCurrentQuestionIndex(updatedRoom.current_question_index);
            
            if (updatedRoom.status === 'finished') {
              setShowResults(true);
            }
          }
        })
        .subscribe();

      // Subscribe to participant updates
      const participantSubscription = supabase
        .channel(`participants-${room.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'quiz_participants',
          filter: `room_id=eq.${room.id}`
        }, (payload) => {
          console.log("participantSubscription", payload);
          const loadParticipants = async () => {
            try {
              const { data } = await supabase
                .from("quiz_participants")
                .select("*")
                .eq("room_id", roomId)
                .order("score", { ascending: false });

              if (data) {
                setParticipants(data);
              }
            } catch (error) {
              console.error("Error fetching participants:", error);
            }
          };
          loadParticipants();
        })
        .subscribe();

      return () => {
        roomSubscription.unsubscribe();
        participantSubscription.unsubscribe();
      };
    }
  }, [room, roomId]);

  useEffect(() => {
    if (room?.status === 'active' && questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        setTimeLeft(currentQuestion.time_limit);
        setQuestionStartTime(Date.now());
        setSelectedAnswer("");
        setHasAnswered(false);
      }
    }
  }, [room?.status, currentQuestionIndex, questions]);

  useEffect(() => {
    if (room?.status === 'active' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up, submit answer
            const submitAnswerNow = async () => {
              if (!currentParticipant || !questions[currentQuestionIndex] || selectedAnswer === "") return;

              const currentQuestion = questions[currentQuestionIndex];
              const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
              const isCorrect = selectedAnswer === currentQuestion.correct_answer;
              const pointsEarned = isCorrect ? currentQuestion.points : 0;

              try {
                // Save answer
                const { error: answerError } = await supabase
                  .from("quiz_answers")
                  .insert({
                    room_id: roomId,
                    question_id: currentQuestion.id,
                    participant_id: currentParticipant.id,
                    answer: selectedAnswer,
                    is_correct: isCorrect,
                    points_earned: pointsEarned,
                    time_taken: timeTaken
                  });

                if (answerError) throw answerError;

                // Update participant score
                const newScore = (currentParticipant.score || 0) + pointsEarned;
                await supabase
                  .from("quiz_participants")
                  .update({ score: newScore })
                  .eq("id", currentParticipant.id);

                setCurrentParticipant(prev => prev ? { ...prev, score: newScore } : null);
                setSelectedAnswer("");
                setHasAnswered(true);
              } catch (error) {
                console.error("Error submitting answer:", error);
              }
            };
            submitAnswerNow();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, room?.status, currentParticipant, questions, currentQuestionIndex, selectedAnswer, questionStartTime, roomId]);







  const submitAnswer = async () => {
    if (!currentParticipant || !questions[currentQuestionIndex] || selectedAnswer === "") return;

    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const pointsEarned = isCorrect ? currentQuestion.points : 0;

    try {
      // Save answer
      const { error: answerError } = await supabase
        .from("quiz_answers")
        .insert({
          room_id: roomId,
          question_id: currentQuestion.id,
          participant_id: currentParticipant.id,
          answer: selectedAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_taken: timeTaken
        });

      if (answerError) throw answerError;



      // Update participant score
      const newScore = (currentParticipant.score || 0) + pointsEarned;
      await supabase
        .from("quiz_participants")
        .update({ score: newScore })
        .eq("id", currentParticipant.id);

      setCurrentParticipant(prev => prev ? { ...prev, score: newScore } : null);
      setSelectedAnswer("");
      setHasAnswered(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  const nextQuestion = async () => {
    if (!room || currentQuestionIndex >= questions.length - 1) {
      // Quiz finished
      const { error } = await supabase
        .from("quiz_rooms")
        .update({
          status: "finished",
          ended_at: new Date().toISOString()
        })
        .eq("id", roomId);

      if (!error) {
        setShowResults(true);
      }
      return;
    }

    // Move to next question
    const { error } = await supabase
      .from("quiz_rooms")
      .update({ current_question_index: currentQuestionIndex + 1 })
      .eq("id", roomId);

    if (!error) {
      setCurrentQuestionIndex(prev => prev + 1);
      setHasAnswered(false);
      setSelectedAnswer("");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Room not found</div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Quiz Results</CardTitle>
            <CardDescription>Final scores and rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participants
                .sort((a, b) => b.score - a.score)
                .map((participant, index) => (
                  <div key={participant.id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{participant.display_name}</span>
                      {participant.id === currentParticipant?.id && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xl font-bold">{participant.score} pts</span>
                  </div>
                ))}
            </div>
            <div className="mt-6">
              <Button onClick={() => router.push("/quiz")} className="w-full">
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{room.room_name}</h1>
          <p className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Your Score</p>
          <p className="text-2xl font-bold">{currentParticipant?.score || 0} pts</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Question Area */}
        <div className="md:col-span-2">
          {room.status === 'waiting' ? (
            <Card>
              <CardContent className="text-center py-12">
                <h2 className="text-xl font-semibold mb-4">Waiting for host to start...</h2>
                <p className="text-gray-600">The quiz will begin when the host starts the session.</p>
              </CardContent>
            </Card>
          ) : room.status === 'active' && currentQuestion ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Time Left</div>
                    <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-600' : ''}`}>
                      {timeLeft}s
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-lg">{currentQuestion.question_text}</p>
                </div>

                {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                  <div className="space-y-3">
                    {(currentQuestion.options as string[]).map((option, index) => (
                      <button
                        key={index}
                        onClick={() => !hasAnswered && setSelectedAnswer(option)}
                        disabled={hasAnswered}
                        className={`w-full p-4 text-left border rounded-lg transition-colors ${
                          selectedAnswer === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'true_false' && (
                  <div className="space-y-3">
                    {['true', 'false'].map((option) => (
                      <button
                        key={option}
                        onClick={() => !hasAnswered && setSelectedAnswer(option)}
                        disabled={hasAnswered}
                        className={`w-full p-4 text-left border rounded-lg transition-colors ${
                          selectedAnswer === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="font-medium">{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {!hasAnswered && selectedAnswer && (
                  <Button onClick={submitAnswer} className="w-full">
                    Submit Answer
                  </Button>
                )}

                {hasAnswered && (
                  <div className="text-center">
                    <p className="text-green-600 font-semibold">Answer submitted!</p>
                    <p className="text-sm text-gray-600">Waiting for other participants...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <h2 className="text-xl font-semibold mb-4">Quiz Finished</h2>
                <p className="text-gray-600">The quiz has ended. Results will be shown shortly.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle>Participants ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{participant.display_name}</span>
                    <span className="text-sm font-bold">{participant.score} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Host Controls */}
          {isHost && room.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle>Host Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={nextQuestion} className="w-full">
                  {currentQuestionIndex >= questions.length - 1 ? 'End Quiz' : 'Next Question'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
