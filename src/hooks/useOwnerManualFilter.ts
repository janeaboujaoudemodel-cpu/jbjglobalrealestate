/**
 * Owner-only "manually verified only" toggle for public listing pages
 * (Developers, Areas, Projects). Persisted in localStorage so it survives
 * navigation. Non-owners always see everything (hook returns false).
 */
import { useEffect, useState, useCallback } from "react";
import { useIsOwner } from "@/hooks/useIsOwner";

const KEY = "jbj:owner:manualOnly";

export function useOwnerManualFilter() {
  const { isOwner } = useIsOwner();
  const [manualOnly, setManualOnlyState] = useState<boolean>(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setManualOnlyState(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setManualOnly = useCallback((v: boolean) => {
    setManualOnlyState(v);
    try {
      window.localStorage.setItem(KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  return {
    isOwner,
    manualOnly: isOwner && manualOnly,
    setManualOnly,
  };
}
