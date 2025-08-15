"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];

export default function EditQuizPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [addQuestionDialog, setAddQuestionDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "multiple_choice" as "multiple_choice" | "true_false",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1,
    time_limit: 30
  });

  useEffect(() => {
    if (user && quizId) {
      fetchQuizAndQuestions();
    }
  }, [user, quizId]);

  const fetchQuizAndQuestions = async () => {
    try {
      // Fetch quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .eq("host_id", user?.id)
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
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!newQuestion.question_text.trim() || !newQuestion.correct_answer.trim()) return;

    try {
      const questionData = {
        quiz_id: quizId,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        options: newQuestion.question_type === "multiple_choice" ? newQuestion.options : null,
        correct_answer: newQuestion.correct_answer,
        points: newQuestion.points,
        time_limit: newQuestion.time_limit,
        order_index: questions.length
      };

      const { data, error } = await supabase
        .from("quiz_questions")
        .insert(questionData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setQuestions(prev => [...prev, data]);
        setNewQuestion({
          question_text: "",
          question_type: "multiple_choice",
          options: ["", "", "", ""],
          correct_answer: "",
          points: 1,
          time_limit: 30
        });
        setAddQuestionDialog(false);
      }
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (error) {
      console.error("Error deleting question:", error);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-gray-600">{quiz.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-gray-500">Questions: {questions.length}</span>
            <span className="text-gray-500">Total Points: {questions.reduce((sum, q) => sum + q.points, 0)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/quiz")}>
            Back to Quizzes
          </Button>
          <Button 
            onClick={() => router.push(`/quiz/${quizId}/host`)}
            disabled={questions.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {questions.length === 0 ? 'Add Questions First' : 'Host Quiz'}
          </Button>
          <Dialog open={addQuestionDialog} onOpenChange={setAddQuestionDialog}>
            <DialogTrigger asChild>
              <Button>Add Question</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
                <DialogDescription>
                  Add a question to your quiz. You can choose between multiple choice or true/false questions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question_text">Question</Label>
                  <Textarea
                    id="question_text"
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                    placeholder="Enter your question"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="question_type">Question Type</Label>
                  <Select
                    value={newQuestion.question_type}
                    onValueChange={(value: "multiple_choice" | "true_false") => 
                      setNewQuestion(prev => ({ ...prev, question_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newQuestion.question_type === "multiple_choice" && (
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {newQuestion.options.map((option, index) => (
                        <Input
                          key={index}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index] = e.target.value;
                            setNewQuestion(prev => ({ ...prev, options: newOptions }));
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="correct_answer">Correct Answer</Label>
                  {newQuestion.question_type === "multiple_choice" ? (
                    <Select
                      value={newQuestion.correct_answer}
                      onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correct_answer: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                                             <SelectContent>
                         {newQuestion.options.map((option, index) => (
                           <SelectItem key={index} value={option || `Option ${index + 1}`}>
                             {option || `Option ${index + 1}`}
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={newQuestion.correct_answer}
                      onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correct_answer: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      value={newQuestion.points}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time_limit">Time Limit (seconds)</Label>
                    <Input
                      id="time_limit"
                      type="number"
                      min="5"
                      max="300"
                      value={newQuestion.time_limit}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                </div>

                <Button onClick={addQuestion} className="w-full">
                  Add Question
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Questions ({questions.length})</h2>
        
        {questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No questions added yet. Add your first question!</p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Question {index + 1}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {question.question_text}
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteQuestion(question.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {question.question_type === "multiple_choice" ? "Multiple Choice" : "True/False"}
                  </div>
                  <div>
                    <span className="font-medium">Points:</span> {question.points}
                  </div>
                  <div>
                    <span className="font-medium">Time Limit:</span> {question.time_limit}s
                  </div>
                  <div>
                    <span className="font-medium">Correct Answer:</span> {question.correct_answer}
                  </div>
                </div>
                
                {question.question_type === "multiple_choice" && question.options && (
                  <div className="mt-4">
                    <span className="font-medium text-sm">Options:</span>
                    <div className="mt-2 space-y-1">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="text-sm text-gray-600">
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
