import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ModuleQuestion {
  id: string;
  module_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  is_active: boolean;
}

export interface TestAttempt {
  id: string;
  user_id: string;
  module_id: string;
  attempt_number: number;
  questions_shown: string[];
  answers_given: Record<string, number>;
  score_percent: number;
  passed: boolean;
  show_answers: boolean;
  completed_at: string;
}

const PASS_THRESHOLD = 70;
const QUESTIONS_PER_TEST = 10;

export function useModuleTests(moduleId: string | null) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ModuleQuestion[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [currentTest, setCurrentTest] = useState<ModuleQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!moduleId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load questions for this module
      const { data: questionsData, error: questionsError } = await supabase
        .from('module_questions')
        .select('*')
        .eq('module_id', moduleId)
        .eq('is_active', true);

      if (questionsError) throw questionsError;
      
      const typedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string || '[]')
      })) as ModuleQuestion[];
      
      setQuestions(typedQuestions);

      // Load user's attempts if logged in
      if (user) {
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('test_attempts')
          .select('*')
          .eq('user_id', user.id)
          .eq('module_id', moduleId)
          .order('attempt_number', { ascending: false });

        if (attemptsError) throw attemptsError;
        
        const typedAttempts = (attemptsData || []).map(a => ({
          ...a,
          answers_given: typeof a.answers_given === 'object' ? a.answers_given : JSON.parse(a.answers_given as string || '{}')
        })) as TestAttempt[];
        
        setAttempts(typedAttempts);
      }
    } catch (err) {
      console.error('Error loading test data:', err);
      setError('Failed to load test information');
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startTest = () => {
    if (questions.length === 0) return false;

    // Get previously shown question IDs to avoid repeating
    const previouslyShown = new Set<string>();
    attempts.forEach(attempt => {
      (attempt.questions_shown || []).forEach(id => previouslyShown.add(id));
    });

    // Filter to questions not shown before if possible
    let availableQuestions = questions.filter(q => !previouslyShown.has(q.id));
    
    // If not enough new questions, use all questions
    if (availableQuestions.length < QUESTIONS_PER_TEST) {
      availableQuestions = [...questions];
    }

    // Shuffle and select questions
    const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(QUESTIONS_PER_TEST, shuffled.length));
    
    setCurrentTest(selected);
    setUserAnswers({});
    return true;
  };

  const setAnswer = (questionId: string, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const submitTest = async (): Promise<{ 
    success: boolean; 
    score?: number; 
    passed?: boolean;
    showAnswers?: boolean;
    error?: string;
  }> => {
    if (!user || !moduleId) return { success: false, error: 'Not logged in' };
    if (currentTest.length === 0) return { success: false, error: 'No test started' };

    // Calculate score
    let correct = 0;
    currentTest.forEach(question => {
      if (userAnswers[question.id] === question.correct_index) {
        correct++;
      }
    });

    const scorePercent = (correct / currentTest.length) * 100;
    const passed = scorePercent >= PASS_THRESHOLD;
    const attemptNumber = attempts.length + 1;
    
    // After 3 failures, show answers
    const failedAttempts = attempts.filter(a => !a.passed).length;
    const showAnswers = !passed && failedAttempts >= 2; // This will be the 3rd+ failure

    try {
      const { error: insertError } = await supabase
        .from('test_attempts')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          attempt_number: attemptNumber,
          questions_shown: currentTest.map(q => q.id),
          answers_given: userAnswers,
          score_percent: scorePercent,
          passed,
          show_answers: showAnswers,
        });

      if (insertError) throw insertError;

      await loadData();
      setCurrentTest([]);
      setUserAnswers({});

      return { 
        success: true, 
        score: scorePercent, 
        passed,
        showAnswers,
      };
    } catch (err) {
      console.error('Error submitting test:', err);
      return { success: false, error: 'Failed to submit test' };
    }
  };

  const getTestStatus = () => {
    const hasPassed = attempts.some(a => a.passed);
    const failedCount = attempts.filter(a => !a.passed).length;
    const canRetake = !hasPassed;
    const showAnswersOnFail = failedCount >= 3;

    return {
      hasPassed,
      attemptCount: attempts.length,
      failedCount,
      canRetake,
      showAnswersOnFail,
      bestScore: attempts.length > 0 
        ? Math.max(...attempts.map(a => a.score_percent))
        : 0,
    };
  };

  const getIncorrectAnswers = (attemptId: string) => {
    const attempt = attempts.find(a => a.id === attemptId);
    if (!attempt) return [];

    const incorrect: Array<{
      question: ModuleQuestion;
      userAnswer: number;
      correctAnswer: number;
      showCorrect: boolean;
    }> = [];

    attempt.questions_shown.forEach(qId => {
      const question = questions.find(q => q.id === qId);
      if (question && attempt.answers_given[qId] !== question.correct_index) {
        incorrect.push({
          question,
          userAnswer: attempt.answers_given[qId],
          correctAnswer: question.correct_index,
          showCorrect: attempt.show_answers,
        });
      }
    });

    return incorrect;
  };

  return {
    questions,
    attempts,
    currentTest,
    userAnswers,
    isLoading,
    error,
    startTest,
    setAnswer,
    submitTest,
    getTestStatus,
    getIncorrectAnswers,
    refresh: loadData,
    PASS_THRESHOLD,
    QUESTIONS_PER_TEST,
  };
}
