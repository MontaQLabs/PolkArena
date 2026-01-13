"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowUpRight, Brain } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import Link from "next/link";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];

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
      const loadQuizzes = async () => {
        try {
          const { data: allQuizzes } = await supabase
            .from("quizzes")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

          if (allQuizzes) {
            setQuizzes(allQuizzes);
            const myQuizzes = allQuizzes.filter(quiz => quiz.host_id === user?.id);
            setMyQuizzes(myQuizzes);
          }
        } catch (error) {
          console.error("Error fetching quizzes:", error);
        } finally {
          setLoading(false);
        }
      };
      
      loadQuizzes();
    }
  }, [user]);

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
        router.push(`/tools/quiz/${data.id}/edit`);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
    }
  };

  const joinRoom = async () => {
    if (!user || !joinPin.trim()) return;

    try {
      setJoinError("");
      
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

      const { data: existingParticipant } = await supabase
        .from("quiz_participants")
        .select("*")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single();

      if (existingParticipant) {
        window.location.href = `/tools/quiz/room/${room.id}`;
        return;
      }

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
        window.location.href = `/tools/quiz/room/${room.id}`;
      }
    } catch (error) {
      console.error("Error joining room:", error);
      setJoinError("Failed to join room");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sui-ocean font-bold text-xl uppercase tracking-widest">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-sui-sea py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white p-3">
                <Brain className="h-8 w-8 text-sui-sea" />
              </div>
              <span className="text-white/80 font-bold uppercase tracking-widest text-sm">
                Event Tool
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mb-6">
              QUIZ
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mb-8">
              Create and host interactive quizzes with real-time scoring. Perfect for hackathon workshops and team events.
            </p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white hover:bg-sui-ocean text-sui-sea hover:text-white font-bold uppercase tracking-wide px-8 py-6 rounded-none transition-all duration-150">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none border-4 border-sui-ocean">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-sui-ocean uppercase">Create New Quiz</DialogTitle>
                  <DialogDescription className="text-sui-ocean/60">
                    Create a new quiz that others can join and participate in.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="font-bold uppercase text-sm">Quiz Title</Label>
                    <Input
                      id="title"
                      value={newQuiz.title}
                      onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter quiz title"
                      className="rounded-none border-2 border-sui-ocean"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="font-bold uppercase text-sm">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={newQuiz.description}
                      onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter quiz description"
                      className="rounded-none border-2 border-sui-ocean"
                    />
                  </div>
                  <Button onClick={createQuiz} className="w-full bg-sui-sea hover:bg-sui-ocean text-white font-bold uppercase rounded-none py-6">
                    Create Quiz
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Join Room Section */}
      <section className="py-12 border-b-4 border-sui-ocean">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-sui-ocean p-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-2">
                Join Quiz Room
              </h2>
              <p className="text-white/60 mb-6">Enter a 6-digit PIN to join an active quiz room</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="flex-1 text-center text-3xl font-mono tracking-[0.5em] bg-white border-0 rounded-none py-6"
                />
                <Button 
                  onClick={joinRoom} 
                  disabled={joinPin.length !== 6} 
                  className="bg-walrus-teal hover:bg-white hover:text-sui-ocean text-white font-bold uppercase tracking-wide px-8 py-6 rounded-none"
                >
                  Join
                </Button>
              </div>
              {joinError && <p className="text-red-300 text-sm mt-3 font-bold">{joinError}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* My Quizzes Section */}
      {myQuizzes.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black text-sui-ocean uppercase tracking-tight mb-8">My Quizzes</h2>
            <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-3">
              {myQuizzes.map((quiz, i) => (
                <div 
                  key={quiz.id} 
                  className={`p-8 border-2 border-sui-ocean ${i % 3 === 0 ? 'bg-sui-sea' : i % 3 === 1 ? 'bg-sui-ocean' : 'bg-walrus-teal'}`}
                >
                  <h3 className="text-xl font-black text-white uppercase tracking-wide mb-2">
                    {quiz.title}
                  </h3>
                  <p className="text-white/70 mb-6 line-clamp-2">
                    {quiz.description || "No description"}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild className="bg-white hover:bg-sui-ocean text-sui-ocean hover:text-white font-bold uppercase text-sm rounded-none px-4 py-2">
                      <Link href={`/tools/quiz/${quiz.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild className="bg-white/20 hover:bg-white text-white hover:text-sui-ocean font-bold uppercase text-sm rounded-none px-4 py-2">
                      <Link href={`/tools/quiz/${quiz.id}/host`}>Host</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Available Quizzes Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-sui-ocean uppercase tracking-tight mb-8">Available Quizzes</h2>
          {quizzes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <div 
                  key={quiz.id} 
                  className="bg-white border-4 border-sui-ocean p-6 hover:bg-sui-ocean hover:text-white group transition-colors"
                >
                  <h3 className="text-xl font-black text-sui-ocean group-hover:text-white uppercase tracking-wide mb-2">
                    {quiz.title}
                  </h3>
                  <p className="text-sui-ocean/60 group-hover:text-white/70 mb-6 line-clamp-2">
                    {quiz.description || "No description"}
                  </p>
                  <Button asChild className="w-full bg-sui-sea group-hover:bg-white group-hover:text-sui-ocean text-white font-bold uppercase rounded-none">
                    <Link href={`/tools/quiz/${quiz.id}/host`} className="flex items-center justify-center gap-2">
                      Join as Host
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border-4 border-dashed border-sui-ocean/30 p-12 text-center">
              <p className="text-sui-ocean/50 font-bold uppercase tracking-wide">No quizzes available. Create the first one!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
