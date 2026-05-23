/**
 * useConciergeVerification — checks localStorage for a verified support session.
 * Token format: { email, verifiedAt }. Expires after 30 days.
 */
import { useEffect, useState, useCallback } from "react";

const KEY = "jbj.concierge_verified";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type VerifiedSupport = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  verifiedAt: number;
};

function read(): VerifiedSupport | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VerifiedSupport;
    if (!parsed?.email || !parsed?.verifiedAt) return null;
    if (Date.now() - parsed.verifiedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useConciergeVerification() {
  const [verified, setVerified] = useState<VerifiedSupport | null>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setVerified(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((v: Omit<VerifiedSupport, "verifiedAt">) => {
    const payload: VerifiedSupport = { ...v, verifiedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
    setVerified(payload);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setVerified(null);
  }, []);

  return { verified, save, clear, isVerified: !!verified };
}
