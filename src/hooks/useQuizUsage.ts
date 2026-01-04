import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_USAGE_KEY = "jj_quiz_free_used";

export function useQuizUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check localStorage for guest users
  const [guestHasUsedFree, setGuestHasUsedFree] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(FREE_USAGE_KEY) === "true";
    }
    return false;
  });

  // Check database for authenticated users
  const { data: quizResponse, isLoading } = useQuery({
    queryKey: ["quiz-usage", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("quiz_responses")
        .select("id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const hasUsedFreeQuiz = user ? !!quizResponse : guestHasUsedFree;

  // Mark free quiz as used
  const markFreeUsed = () => {
    if (!user) {
      localStorage.setItem(FREE_USAGE_KEY, "true");
      setGuestHasUsedFree(true);
    }
    // For authenticated users, it's automatically tracked via quiz_responses table
  };

  // Reset for testing (admin use)
  const resetFreeUsage = () => {
    localStorage.removeItem(FREE_USAGE_KEY);
    setGuestHasUsedFree(false);
  };

  return {
    hasUsedFreeQuiz,
    isLoading,
    markFreeUsed,
    resetFreeUsage,
  };
}
