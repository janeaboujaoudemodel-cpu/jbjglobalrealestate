import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EducationBook {
  id: string;
  book_number: number;
  learning_path: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  learning_objective: string | null;
  is_restricted: boolean;
  sort_order: number;
  voice_enabled?: boolean;
  voice_id?: string | null;
  voice_provider?: string | null;
}

export interface EducationModule {
  id: string;
  book_id: string;
  module_number: number;
  title: string;
  description: string | null;
  estimated_minutes: number;
  content: string | null;
  sort_order: number;
}

export interface BookProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  completedModules: number;
  totalModules: number;
}

export function useBrokerEducation() {
  const { user } = useAuth();
  const [books, setBooks] = useState<EducationBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, BookProgress>>({});

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("broker_education_books")
          .select("*")
          .order("sort_order", { ascending: true });

        if (fetchError) throw fetchError;

        setBooks(data || []);

        // Fetch progress if user is logged in
        if (user && data) {
          await fetchProgress(data);
        }
      } catch (err) {
        console.error("Error fetching education books:", err);
        setError("Failed to load education content");
      } finally {
        setLoading(false);
      }
    };

    const fetchProgress = async (bookList: EducationBook[]) => {
      try {
        // Get all modules count per book
        const { data: modules } = await supabase
          .from("broker_education_modules")
          .select("id, book_id");

        // Get user's progress
        const { data: progress } = await supabase
          .from("broker_education_progress")
          .select("*")
          .eq("user_id", user!.id);

        const progressRecord: Record<string, BookProgress> = {};

        bookList.forEach((book) => {
          const bookModules = modules?.filter((m) => m.book_id === book.id) || [];
          const completedModules = progress?.filter(
            (p) => p.book_id === book.id && p.status === 'completed'
          ).length || 0;
          const inProgressModules = progress?.filter(
            (p) => p.book_id === book.id && p.status === 'in_progress'
          ).length || 0;

          let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
          if (completedModules === bookModules.length && bookModules.length > 0) {
            status = 'completed';
          } else if (completedModules > 0 || inProgressModules > 0) {
            status = 'in_progress';
          }

          progressRecord[book.id] = {
            status,
            completedModules,
            totalModules: bookModules.length,
          };
        });

        setProgressMap(progressRecord);
      } catch (err) {
        console.error("Error fetching progress:", err);
      }
    };

    fetchBooks();
  }, [user]);

  return {
    books,
    loading,
    error,
    progressMap,
  };
}

export function useBookModules(bookId: string | null) {
  const [modules, setModules] = useState<EducationModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) {
      setModules([]);
      return;
    }

    const fetchModules = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("broker_education_modules")
          .select("*")
          .eq("book_id", bookId)
          .order("sort_order", { ascending: true });

        if (fetchError) throw fetchError;

        setModules(data || []);
      } catch (err) {
        console.error("Error fetching modules:", err);
        setError("Failed to load modules");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [bookId]);

  return { modules, loading, error };
}
