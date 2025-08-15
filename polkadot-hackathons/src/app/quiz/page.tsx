"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import Link from "next/link";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
// type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];

export default function QuizPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinPin, setJoinPin] = useState("");
  const [joinError, setJoinError] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: ""
  });

  useEffect(() => {
    if (user) {
      fetchQuizzes();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    try {
      // Fetch all active quizzes
      const { data: allQuizzes } = await supabase
        .from("quizzes")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (allQuizzes) {
        setQuizzes(allQuizzes);
        
        // Filter quizzes created by current user
        const myQuizzes = allQuizzes.filter(quiz => quiz.host_id === user?.id);
        setMyQuizzes(myQuizzes);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    if (!user || !newQuiz.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from("quizzes")
        .insert({
          title: newQuiz.title,
          description: newQuiz.description || null,
          host_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMyQuizzes(prev => [data, ...prev]);
        setQuizzes(prev => [data, ...prev]);
        setNewQuiz({ title: "", description: "" });
        setCreateDialogOpen(false);
        // Redirect to edit page to add questions
        router.push(`/quiz/${data.id}/edit`);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
    }
  };

  const joinRoom = async () => {
    if (!user || !joinPin.trim()) return;

    try {
      setJoinError("");
      
      // Check if room exists and is active
      const { data: room, error } = await supabase
        .from("quiz_rooms")
        .select("*")
        .eq("pin", joinPin)
        .eq("status", "waiting")
        .single();

      if (error || !room) {
        setJoinError("Invalid PIN or room not found");
        return;
      }

      // Check if user is already in the room
      const { data: existingParticipant } = await supabase
        .from("quiz_participants")
        .select("*")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single();

      if (existingParticipant) {
        // Redirect to room
        window.location.href = `/quiz/room/${room.id}`;
        return;
      }

      // Join the room
      const { data: participant, error: joinError } = await supabase
        .from("quiz_participants")
        .insert({
          room_id: room.id,
          user_id: user.id,
          display_name: profile?.name || user.email?.split("@")[0] || "Anonymous"
        })
        .select()
        .single();

      if (joinError) throw joinError;

      if (participant) {
        window.location.href = `/quiz/room/${room.id}`;
      }
    } catch (error) {
      console.error("Error joining room:", error);
      setJoinError("Failed to join room");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-polkadot-pink to-bright-turquoise bg-clip-text text-transparent mb-4">
            🧠 Quiz Arena
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create and host interactive quizzes with real-time scoring. Challenge your friends and see who comes out on top! 🏆
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-polkadot-pink to-bright-turquoise hover:from-polkadot-pink/90 hover:to-bright-turquoise/90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-5 h-5 mr-2" />
                Create New Quiz
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>
                Create a new quiz that others can join and participate in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter quiz title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter quiz description"
                />
              </div>
              <Button onClick={createQuiz} className="w-full">
                Create Quiz
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Join Room Section */}
      <Card className="mb-8 border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300 bg-white shadow-lg hover:shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-polkadot-pink">Join Quiz Room</CardTitle>
          <CardDescription className="text-lg">Enter a 6-digit PIN to join an active quiz room</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <div className="flex-1">
              <Input
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value)}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                className="text-center text-3xl font-mono tracking-widest border-2 border-storm-400 focus:border-polkadot-pink"
              />
              {joinError && <p className="text-red-500 text-sm mt-2 text-center">{joinError}</p>}
            </div>
            <Button 
              onClick={joinRoom} 
              disabled={joinPin.length !== 6}
              className="bg-polkadot-pink hover:bg-polkadot-pink/90 text-white font-semibold"
            >
              Join Room
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Quizzes Section */}
      {myQuizzes.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-polkadot-pink">My Quizzes</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myQuizzes.map((quiz) => (
              <Card key={quiz.id} className="border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300 bg-white shadow-lg hover:shadow-xl group">
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-polkadot-pink transition-colors">{quiz.title}</CardTitle>
                  <CardDescription className="text-base">
                    {quiz.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="bg-bright-turquoise hover:bg-bright-turquoise/90 text-white">
                      <Link href={`/quiz/${quiz.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="border-polkadot-pink text-polkadot-pink hover:bg-polkadot-pink hover:text-white">
                      <Link href={`/quiz/${quiz.id}/host`}>Host Room</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Quizzes Section */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-8 text-polkadot-pink">Available Quizzes</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300 bg-white shadow-lg hover:shadow-xl group">
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-polkadot-pink transition-colors">{quiz.title}</CardTitle>
                <CardDescription className="text-base">
                  {quiz.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" variant="outline" className="border-polkadot-pink text-polkadot-pink hover:bg-polkadot-pink hover:text-white w-full">
                  <Link href={`/quiz/${quiz.id}/host`}>Join as Host</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {quizzes.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-xl mb-4">No quizzes available yet</p>
            <p className="text-lg">Be the first to create an epic quiz! 🚀</p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
