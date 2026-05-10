import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useModuleTests } from "@/hooks/useModuleTests";
import { Loader2, BookOpen, CheckCircle, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TestResults } from "./TestResults";

interface ModuleTestProps {
  moduleId: string;
  moduleName: string;
  onComplete?: (passed: boolean) => void;
  className?: string;
}

export function ModuleTest({ moduleId, moduleName, onComplete, className }: ModuleTestProps) {
  const {
    currentTest,
    userAnswers,
    isLoading,
    startTest,
    setAnswer,
    submitTest,
    getTestStatus,
    PASS_THRESHOLD,
  } = useModuleTests(moduleId);

  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<{ score: number; passed: boolean; showAnswers: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const status = getTestStatus();

  const handleStart = () => {
    const started = startTest();
    if (started) {
      setCurrentQuestionIndex(0);
      setShowResults(false);
      setLastResult(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await submitTest();
    setIsSubmitting(false);

    if (result.success) {
      setLastResult({
        score: result.score || 0,
        passed: result.passed || false,
        showAnswers: result.showAnswers || false,
      });
      setShowResults(true);
      onComplete?.(result.passed || false);
    }
  };

  const currentQuestion = currentTest[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const allAnswered = answeredCount === currentTest.length;

  if (isLoading) {
    return (
      <Card className={cn("bg-[#1A1A1A]/40 border-[#B89555]/20", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Show results view
  if (showResults && lastResult) {
    return (
      <TestResults
        moduleId={moduleId}
        moduleName={moduleName}
        score={lastResult.score}
        passed={lastResult.passed}
        showAnswers={lastResult.showAnswers}
        onRetake={handleStart}
        className={className}
      />
    );
  }

  // Show test start view if no active test
  if (currentTest.length === 0) {
    return (
      <Card className={cn("bg-[#1A1A1A]/40 border-[#B89555]/20", className)}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#1A1A1A]" />
            {moduleName} - Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-[#FDFBF7]/5 rounded-xl p-6 text-center">
            {status.hasPassed ? (
              <>
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">Test Passed!</h3>
                <p className="text-white/90">
                  Best score: {Math.round(status.bestScore)}%
                </p>
              </>
            ) : (
              <>
                <BookOpen className="w-12 h-12 text-[#1A1A1A] mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">Ready to Test Your Knowledge?</h3>
                <p className="text-white/90 mb-4">
                  You need {PASS_THRESHOLD}% to pass. 
                  {status.attemptCount > 0 && ` Attempts: ${status.attemptCount}`}
                </p>
                {status.failedCount >= 3 && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 mb-4">
                    Answers will be shown after this attempt
                  </Badge>
                )}
                <Button 
                  onClick={handleStart}
                  className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
                >
                  Start Test
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show active test
  return (
    <Card className={cn("bg-[#1A1A1A]/40 border-[#B89555]/20", className)}>
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">
            Question {currentQuestionIndex + 1} of {currentTest.length}
          </CardTitle>
          <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30">
            {answeredCount}/{currentTest.length} Answered
          </Badge>
        </div>
        <Progress 
          value={(currentQuestionIndex + 1) / currentTest.length * 100} 
          className="h-2 bg-[#FDFBF7]/10 mt-3"
        />
      </CardHeader>
      <CardContent className="py-6 space-y-6">
        {/* Question */}
        <div className="bg-[#FDFBF7]/5 rounded-xl p-6">
          <h3 className="text-white text-lg font-medium mb-6">
            {currentQuestion.question_text}
          </h3>

          <RadioGroup
            value={userAnswers[currentQuestion.id]?.toString()}
            onValueChange={(value) => setAnswer(currentQuestion.id, parseInt(value))}
          >
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer",
                    userAnswers[currentQuestion.id] === index
                      ? "border-[#B89555] bg-[#EFE6D6]/10"
                      : "border-white/10 hover:border-white/30 bg-[#FDFBF7]/5"
                  )}
                  onClick={() => setAnswer(currentQuestion.id, index)}
                >
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`q-${currentQuestion.id}-${index}`}
                    className="border-[#B89555] text-[#1A1A1A]"
                  />
                  <Label 
                    htmlFor={`q-${currentQuestion.id}-${index}`}
                    className="text-white cursor-pointer flex-1"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="border-white/20 text-white hover:bg-[#FDFBF7]/10"
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentTest.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={cn(
                  "w-8 h-8 rounded-full text-sm font-medium transition-all",
                  idx === currentQuestionIndex
                    ? "bg-[#EFE6D6] text-[#1A1A1A]"
                    : userAnswers[currentTest[idx].id] !== undefined
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-[#FDFBF7]/10 text-white/90 hover:bg-[#FDFBF7]/20"
                )}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex < currentTest.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              className="bg-[#EFE6D6]/20 text-[#1A1A1A] hover:bg-[#EFE6D6]/30"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Submit Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
