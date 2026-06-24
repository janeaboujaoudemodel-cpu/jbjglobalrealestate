import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { useUserMode } from "@/hooks/useUserMode";

/**
 * Preview-as-visitor is now driven entirely by the user-mode selector
 * (Mode: Owner vs Mode: Broker/Investor/Developer).
 *
 *   - Mode === 'owner'  AND user is the app owner  → Owner Mode (edit affordances)
 *   - Any other mode                               → Visitor Mode (no edit chrome)
 *
 * The legacy floating "eye" toggle and its sessionStorage flag are removed.
 */

const LEGACY_KEY = "jbj_preview_as_visitor";
const EVT = "jbj:preview-as-visitor-change";

/** @deprecated Mode now drives this. Kept as a no-op for back-compat callers. */
export function getPreviewAsVisitor(): boolean {
  return true;
}

/** @deprecated No-op shim. */
export function setPreviewAsVisitor(_on: boolean) {
  try { sessionStorage.removeItem(LEGACY_KEY); } catch {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT, { detail: { on: true } }));
  }
}

export function usePreviewAsVisitor() {
  const { mode } = useUserMode();
  const previewAsVisitor = mode !== "owner";
  // Toggle/set retained as no-ops so legacy call sites do not crash; mode
  // is the single source of truth and must be changed via the mode switcher.
  return {
    previewAsVisitor,
    toggle: () => {},
    set: (_on: boolean) => {},
  };
}

/**
 * Like useIsAppOwner but flips to FALSE unless the owner has explicitly
 * picked "Mode: Owner" in the header mode switcher.
 */
export function useEffectiveOwner() {
  const { isOwner, isLoading } = useIsAppOwner();
  const { mode } = useUserMode();
  const previewAsVisitor = mode !== "owner";
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
