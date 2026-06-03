// Persists the AI Home Finder ("Matchmaker") flow to localStorage so a refresh,
// closed tab, or returned visit resumes exactly where the user left off.
import { useEffect, useState } from "react";

export const MATCHMAKER_STORAGE_KEY = "jbj.matchmaker.session.v1";

export type MatchmakerStep = "quiz" | "lead-form" | "results";

export interface MatchmakerFormData {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  preferredLanguage: string;
}

export interface MatchmakerSession {
  sessionId: string;
  step: MatchmakerStep;
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  formData: MatchmakerFormData;
  resultSlugs: string[];
  resultTiers: Array<"exact" | "close" | "nearest" | "fallback">;
  createdAt: number;
  updatedAt: number;
}

const empty: MatchmakerFormData = {
  fullName: "",
  email: "",
  phone: "",
  nationality: "",
  preferredLanguage: "",
};

export function readMatchmakerSession(): MatchmakerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MATCHMAKER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchmakerSession;
    if (!parsed || !parsed.sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeMatchmakerSession(patch: Partial<MatchmakerSession>) {
  if (typeof window === "undefined") return;
  try {
    const prev = readMatchmakerSession();
    const now = Date.now();
    const next: MatchmakerSession = {
      sessionId:
        prev?.sessionId ||
        `mm-${(crypto as any)?.randomUUID
          ? (crypto as any).randomUUID()
          : `${now}-${Math.random().toString(16).slice(2)}`}`,
      step: prev?.step ?? "quiz",
      currentQuestionIndex: prev?.currentQuestionIndex ?? 0,
      answers: prev?.answers ?? {},
      formData: prev?.formData ?? empty,
      resultSlugs: prev?.resultSlugs ?? [],
      resultTiers: prev?.resultTiers ?? [],
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
      ...patch,
    };
    localStorage.setItem(MATCHMAKER_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function clearMatchmakerSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MATCHMAKER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useMatchmakerSession() {
  const [session, setSession] = useState<MatchmakerSession | null>(() =>
    readMatchmakerSession()
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MATCHMAKER_STORAGE_KEY) setSession(readMatchmakerSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    session,
    save: (patch: Partial<MatchmakerSession>) => {
      writeMatchmakerSession(patch);
      setSession(readMatchmakerSession());
    },
    clear: () => {
      clearMatchmakerSession();
      setSession(null);
    },
  };
}
