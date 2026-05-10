import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, ArrowLeft, BookOpen, PlayCircle, CheckCircle, 
  XCircle, ChevronRight, AlertCircle, Trophy
} from "lucide-react";
import { toast } from "sonner";
import { AIStudyTutor } from "@/components/onboarding/AIStudyTutor";

interface Module {
  id: string;
  track: "company_knowledge" | "real_estate_basics";
  title: string;
  content: string;
  video_url?: string;
  key_points: string[];
}

interface QuizQuestion {
  id: string;
  question_type: "mcq" | "true_false" | "short_answer";
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

interface QuizAttempt {
  score: number;
  passed: boolean;
  attempted_at: string;
}

export default function OnboardingModule() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<Module | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([]);
  const [passThreshold, setPassThreshold] = useState(70);
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/onboarding");
      return;
    }
    if (user && moduleId) {
      loadModuleData();
    }
  }, [user, authLoading, moduleId]);

  const loadModuleData = async () => {
    if (!user || !moduleId) return;
    setLoading(true);

    try {
      // Load module
      const { data: moduleData, error: moduleError } = await supabase
        .from("hr_modules")
        .select("*")
        .eq("id", moduleId)
        .eq("is_active", true)
        .maybeSingle();

      if (moduleError) throw moduleError;
      if (!moduleData) {
        toast.error("Module not found");
        navigate("/onboarding");
        return;
      }

      setModule({
        ...moduleData,
        key_points: Array.isArray(moduleData.key_points) ? (moduleData.key_points as string[]) : []
      });

      // Load questions
      const { data: questionsData } = await supabase
        .from("hr_quiz_questions")
        .select("*")
        .eq("module_id", moduleId)
        .eq("is_active", true)
        .order("display_order");

      setQuestions((questionsData || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as string[]) : []
      })));

      // Load previous attempts
      const { data: attemptsData } = await supabase
        .from("hr_quiz_attempts")
        .select("score, passed, attempted_at")
        .eq("user_id", user.id)
        .eq("module_id", moduleId)
        .order("attempted_at", { ascending: false })
        .limit(5);

      setPreviousAttempts(attemptsData || []);

      // Load pass threshold based on track
      const thresholdKey = moduleData.track === "company_knowledge" 
        ? "pass_threshold_company" 
        : "pass_threshold_real_estate";
      
      const { data: settingData } = await supabase
        .from("hr_settings")
        .select("setting_value")
        .eq("setting_key", thresholdKey)
        .maybeSingle();

      if (settingData?.setting_value) {
        setPassThreshold((settingData.setting_value as any).percentage || 70);
      }
    } catch (error) {
      console.error("Error loading module:", error);
      toast.error("Failed to load module");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const calculateScore = (): number => {
    if (questions.length === 0) return 0;
    
    let correctCount = 0;
    questions.forEach((q) => {
      const userAnswer = answers[q.id]?.toLowerCase().trim();
      const correctAnswer = q.correct_answer.toLowerCase().trim();
      
      if (q.question_type === "short_answer") {
        // For short answer, check if user's answer contains key words from correct answer
        const correctWords = correctAnswer.split(/\s+/);
        const matchedWords = correctWords.filter((word) => 
          userAnswer?.includes(word) || word.includes(userAnswer || "")
        );
        if (matchedWords.length >= correctWords.length * 0.5) {
          correctCount++;
        }
      } else {
        if (userAnswer === correctAnswer) {
          correctCount++;
        }
      }
    });

    return (correctCount / questions.length) * 100;
  };

  const handleSubmitQuiz = async () => {
    if (!user || !moduleId) return;
    
    setSubmitting(true);
    try {
      const score = calculateScore();
      const passed = score >= passThreshold;
      setQuizScore(score);

      // Save attempt
      const { error } = await supabase
        .from("hr_quiz_attempts")
        .insert({
          user_id: user.id,
          module_id: moduleId,
          score,
          passed,
          answers_json: answers,
        });

      if (error) throw error;

      setShowResults(true);
      toast.success(passed ? "Congratulations! You passed!" : "Quiz completed");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuizScore(0);
    setShowQuiz(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Module Not Found</h1>
          <Button asChild className="mt-4">
            <Link to="/onboarding">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Quiz Results View
  if (showResults) {
    const passed = quizScore >= passThreshold;
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              {passed ? (
                <Trophy className="h-20 w-20 text-[#1A1A1A] mx-auto mb-4" />
              ) : (
                <AlertCircle className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
              )}
              <CardTitle className="text-2xl text-foreground">
                {passed ? "Congratulations!" : "Keep Learning!"}
              </CardTitle>
              <CardDescription>
                {passed 
                  ? "You have successfully passed this module!" 
                  : "You didn't pass this time, but you can try again."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${passed ? 'text-green-500' : 'text-yellow-500'}`}>
                  {quizScore.toFixed(0)}%
                </div>
                <p className="text-muted-foreground mt-2">
                  Passing score: {passThreshold}%
                </p>
              </div>

              <Separator />

              {/* Review Answers */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Review Your Answers</h3>
                {questions.map((q, index) => {
                  const userAnswer = answers[q.id]?.toLowerCase().trim();
                  const correctAnswer = q.correct_answer.toLowerCase().trim();
                  const isCorrect = userAnswer === correctAnswer;
                  
                  return (
                    <div key={q.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {index + 1}. {q.question}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your answer: {answers[q.id] || "(no answer)"}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-green-600 mt-1">
                              Correct answer: {q.correct_answer}
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link to="/onboarding">Back to Dashboard</Link>
                </Button>
                {!passed && (
                  <Button onClick={handleRetakeQuiz} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                    Retake Quiz
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz View
  if (showQuiz) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const allAnswered = questions.every((q) => answers[q.id]);

    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => setShowQuiz(false)} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Module
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{module.title} - Quiz</h1>
            <div className="flex items-center gap-4 mt-2">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <Badge variant="outline" className="w-fit mb-2">
                {currentQuestion.question_type === "mcq" && "Multiple Choice"}
                {currentQuestion.question_type === "true_false" && "True/False"}
                {currentQuestion.question_type === "short_answer" && "Short Answer"}
              </Badge>
              <CardTitle className="text-lg text-foreground">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.question_type === "mcq" && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.question_type === "true_false" && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.question_type === "short_answer" && (
                <Input
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="bg-background"
                />
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button onClick={handleNextQuestion} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={!allAnswered || submitting}
                    className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Quiz"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Navigation */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  currentQuestionIndex === index
                    ? 'bg-[#EFE6D6] text-[#1A1A1A]'
                    : answers[q.id]
                    ? 'bg-green-500/20 text-green-500 border border-green-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Module Content View
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/onboarding">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">
                  {module.track === "company_knowledge" ? "Company Knowledge" : "Real Estate Basics"}
                </Badge>
                <CardTitle className="text-2xl text-foreground">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video embed if available */}
                {module.video_url && (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {module.video_url.includes("youtube") || module.video_url.includes("youtu.be") ? (
                      <iframe
                        src={module.video_url.replace("watch?v=", "embed/")}
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : module.video_url.includes("vimeo") ? (
                      <iframe
                        src={module.video_url.replace("vimeo.com", "player.vimeo.com/video")}
                        className="w-full h-full rounded-lg"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center">
                        <PlayCircle className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                        <a href={module.video_url} target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] hover:underline">
                          Watch Video
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Module content */}
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {module.content}
                  </div>
                </div>

                {/* Key points */}
                {module.key_points.length > 0 && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Key Points
                    </h3>
                    <ul className="space-y-2">
                      {module.key_points.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-[#1A1A1A] mt-0.5 shrink-0" />
                          <span className="text-muted-foreground text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quiz Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Module Quiz</CardTitle>
                <CardDescription>
                  Test your knowledge after completing the module
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No quiz available for this module yet.</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {questions.length} questions • Passing score: {passThreshold}%
                    </p>
                    <Button
                      onClick={() => setShowQuiz(true)}
                      className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
                    >
                      Start Quiz
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Previous Attempts */}
            {previousAttempts.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Your Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previousAttempts.map((attempt, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          {attempt.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm text-foreground">{attempt.score.toFixed(0)}%</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(attempt.attempted_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* AI Study Tutor */}
        <AIStudyTutor moduleId={moduleId} moduleName={module.title} />
      </div>
    </div>
  );
}
