import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useModuleTests } from "@/hooks/useModuleTests";
import { CheckCircle, XCircle, RotateCcw, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestResultsProps {
  moduleId: string;
  moduleName: string;
  score: number;
  passed: boolean;
  showAnswers: boolean;
  onRetake: () => void;
  className?: string;
}

export function TestResults({ 
  moduleId, 
  moduleName, 
  score, 
  passed, 
  showAnswers,
  onRetake,
  className 
}: TestResultsProps) {
  const { attempts, getIncorrectAnswers } = useModuleTests(moduleId);
  const latestAttempt = attempts[0];
  const incorrectAnswers = latestAttempt ? getIncorrectAnswers(latestAttempt.id) : [];

  return (
    <Card className={cn("bg-[#1A1A1A]/40 border-[#B89555]/20", className)}>
      <CardHeader className="text-center pb-4">
        <div className={cn(
          "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
          passed ? "bg-emerald-500/20" : "bg-red-500/20"
        )}>
          {passed ? (
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          ) : (
            <XCircle className="w-10 h-10 text-red-400" />
          )}
        </div>
        <CardTitle className={cn(
          "text-2xl",
          passed ? "text-emerald-400" : "text-red-400"
        )}>
          {passed ? "Congratulations!" : "Not Quite"}
        </CardTitle>
        <p className="text-white/70 mt-2">
          {passed 
            ? `You passed the ${moduleName} assessment!`
            : `You scored ${Math.round(score)}%. You need 70% to pass.`
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Card */}
        <div className={cn(
          "rounded-xl p-6 text-center",
          passed ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-red-500/10 border border-red-500/30"
        )}>
          <div className={cn(
            "text-5xl font-bold mb-2",
            passed ? "text-emerald-400" : "text-red-400"
          )}>
            {Math.round(score)}%
          </div>
          <Badge className={passed 
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            : "bg-red-500/20 text-red-300 border-red-500/30"
          }>
            {passed ? "PASSED" : "FAILED"}
          </Badge>
        </div>

        {/* Show incorrect answers (without correct answers unless 3+ fails) */}
        {!passed && incorrectAnswers.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#1A1A1A]" />
              Questions You Missed ({incorrectAnswers.length})
            </h4>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {incorrectAnswers.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-[#FDFBF7]/5 rounded-lg p-4 border border-white/10"
                >
                  <p className="text-white/80 text-sm mb-2">
                    {item.question.question_text}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="border-red-500/50 text-red-400">
                      Your answer: {item.question.options[item.userAnswer]}
                    </Badge>
                  </div>
                  
                  {item.showCorrect && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                        Correct: {item.question.options[item.correctAnswer]}
                      </Badge>
                      {item.question.explanation && (
                        <p className="text-white/90 text-xs mt-2">
                          {item.question.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!showAnswers && (
              <p className="text-white/90 text-sm text-center">
                Correct answers are hidden. Review the material and try again.
                {attempts.filter(a => !a.passed).length < 3 && (
                  <span className="block mt-1 text-[#1A1A1A]/70">
                    Answers will be revealed after {3 - attempts.filter(a => !a.passed).length} more failed attempt(s).
                  </span>
                )}
              </p>
            )}

            {showAnswers && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-[#1A1A1A] mx-auto mb-2" />
                <p className="text-amber-300 text-sm">
                  When you fail three times, we give you the answers of the test, 
                  and you will have to study and pass the test again.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {passed ? (
            <Button className="flex-1 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
              Continue to Next Module
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={onRetake}
                className="flex-1 border-white/20 text-white hover:bg-[#FDFBF7]/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Test
              </Button>
              <Button className="flex-1 bg-[#EFE6D6]/20 text-[#1A1A1A] hover:bg-[#EFE6D6]/30">
                Review Material
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
