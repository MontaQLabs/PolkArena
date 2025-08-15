"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];
type QuizParticipant = Database["public"]["Tables"]["quiz_participants"]["Row"];

export default function HostQuizPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [room, setRoom] = useState<QuizRoom | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    if (user && quizId) {
      fetchQuizData();
    }
  }, [user, quizId]);

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
            setRoom(payload.new as QuizRoom);
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
          fetchParticipants();
        })
        .subscribe();

      return () => {
        roomSubscription.unsubscribe();
        participantSubscription.unsubscribe();
      };
    }
  }, [room]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (quizError || !quizData) {
        router.push("/quiz");
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

      // Check if there's already an active room for this quiz
      const { data: existingRoom } = await supabase
        .from("quiz_rooms")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("host_id", user?.id)
        .eq("status", "waiting")
        .single();

      if (existingRoom) {
        setRoom(existingRoom);
        fetchParticipants();
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!room) return;

    try {
      const { data } = await supabase
        .from("quiz_participants")
        .select("*")
        .eq("room_id", room.id)
        .order("joined_at", { ascending: true });

      if (data) {
        setParticipants(data);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const createRoom = async () => {
    if (!user || !roomName.trim() || questions.length === 0) return;

    try {
      setCreatingRoom(true);

      // Generate a unique PIN
      const { data: pinData } = await supabase.rpc('generate_quiz_pin');
      const pin = pinData || Math.floor(100000 + Math.random() * 900000).toString();

      const { data, error } = await supabase
        .from("quiz_rooms")
        .insert({
          quiz_id: quizId,
          host_id: user.id,
          room_name: roomName,
          pin: pin,
          status: "waiting"
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setRoom(data);
        setRoomName("");
      }
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const startQuiz = async () => {
    if (!room) return;

    try {
      const { error } = await supabase
        .from("quiz_rooms")
        .update({
          status: "active",
          started_at: new Date().toISOString()
        })
        .eq("id", room.id);

      if (error) throw error;

      // Navigate to the quiz room
      router.push(`/quiz/room/${room.id}`);
    } catch (error) {
      console.error("Error starting quiz:", error);
    }
  };

  const endRoom = async () => {
    if (!room) return;

    try {
      const { error } = await supabase
        .from("quiz_rooms")
        .update({
          status: "finished",
          ended_at: new Date().toISOString()
        })
        .eq("id", room.id);

      if (error) throw error;

      setRoom(null);
      setParticipants([]);
    } catch (error) {
      console.error("Error ending room:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Quiz not found</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Questions Added</h1>
          <p className="text-gray-600 mb-4">You need to add questions to your quiz before hosting.</p>
          <Button onClick={() => router.push(`/quiz/${quizId}/edit`)}>
            Add Questions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-gray-600">{quiz.description}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/quiz")}>
          Back to Quizzes
        </Button>
      </div>

      {!room ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create Quiz Room</CardTitle>
            <CardDescription>
              Create a room to host your quiz. Participants will join using a 6-digit PIN.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="room_name">Room Name</Label>
              <Input
                id="room_name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>Questions: {questions.length}</p>
              <p>Total Points: {questions.reduce((sum, q) => sum + q.points, 0)}</p>
            </div>
            <Button 
              onClick={createRoom} 
              disabled={!roomName.trim() || creatingRoom}
              className="w-full"
            >
              {creatingRoom ? "Creating..." : "Create Room"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Room Info */}
          <Card>
            <CardHeader>
              <CardTitle>Room Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Room Name</Label>
                <p className="text-lg font-semibold">{room.room_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">PIN Code</Label>
                <p className="text-3xl font-mono font-bold text-center bg-gray-100 p-4 rounded">
                  {room.pin}
                </p>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Share this PIN with participants to join
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className={`font-semibold ${
                  room.status === 'waiting' ? 'text-yellow-600' : 
                  room.status === 'active' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {room.status === 'waiting' ? 'Waiting for participants' :
                   room.status === 'active' ? 'Quiz in progress' : 'Finished'}
                </p>
              </div>
              <div className="flex gap-2">
                {room.status === 'waiting' && (
                  <Button onClick={startQuiz} className="flex-1">
                    Start Quiz
                  </Button>
                )}
                <Button variant="destructive" onClick={endRoom} className="flex-1">
                  End Room
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle>Participants ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No participants have joined yet
                </p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{participant.display_name}</span>
                      <span className="text-sm text-gray-500">
                        Score: {participant.score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
