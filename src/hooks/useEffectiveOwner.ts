import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";

const KEY = "jbj_preview_as_visitor";
const EVT = "jbj:preview-as-visitor-change";

export function getPreviewAsVisitor(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setPreviewAsVisitor(on: boolean) {
  try {
    if (on) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVT, { detail: { on } }));
}

export function usePreviewAsVisitor() {
  const [on, setOn] = useState<boolean>(() => getPreviewAsVisitor());
  useEffect(() => {
    const h = () => setOn(getPreviewAsVisitor());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return { previewAsVisitor: on, toggle: () => setPreviewAsVisitor(!on), set: setPreviewAsVisitor };
}

/**
 * Like useIsAppOwner but flips to FALSE while the owner is previewing the page
 * as a normal visitor. Use this everywhere editing affordances render.
 */
export function useEffectiveOwner() {
  const { isOwner, isLoading } = useIsAppOwner();
  const { previewAsVisitor } = usePreviewAsVisitor();
  return {
    isOwner,
    effectiveOwner: isOwner && !previewAsVisitor,
    previewAsVisitor,
    isLoading,
  };
}

/** Returns the delegate scopes JSON for the current user (empty for owners). */
export function useDelegateScopes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-delegate-scopes", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Record<string, boolean>> => {
      const { data } = await (supabase as any)
        .from("owner_delegates")
        .select("scopes")
        .eq("delegate_user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      return (data?.scopes as Record<string, boolean>) ?? {};
    },
  });
}

/**
 * True if the current user can edit the given scope.
 * - Owners/admins: always true (but suppressed while preview-as-visitor is on)
 * - Delegates: only if their scopes[scope] === true
 */
export function useCanEdit(scope?: string) {
  const { effectiveOwner } = useEffectiveOwner();
  const { data: scopes } = useDelegateScopes();
  if (effectiveOwner) return true;
  if (!scope) return false;
  return !!scopes?.[scope];
}
