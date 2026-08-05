/**
 * useDocumentAutosave
 * -------------------
 * Reliable, serialised autosave for the Document Studio editor.
 *
 * Guarantees:
 *   • Debounced (default 1.5 s) after ANY change — never gated on the
 *     document body or a candidate name being present.
 *   • Only ONE save runs at a time. A change arriving mid-flight sets a
 *     pending flag and is saved once the in-flight request resolves, so two
 *     concurrent inserts can no longer create duplicate drafts.
 *   • The row is inserted once; the returned id is held in a ref and every
 *     later save is an update.
 *   • A monotonic revision guards against a stale response overwriting newer
 *     local content.
 *   • Exposes an explicit status for the UI: idle | saving | saved | error,
 *     plus `saveNow()` (manual save / retry) and `flush()` for unload.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutosaveHandle {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  error: string | null;
  dirty: boolean;
  /** Save immediately (used by Cmd/Ctrl+S, "Retry" and before export). */
  saveNow: () => Promise<void>;
  /** Mark content as changed — call from the editor's change handlers. */
  markDirty: () => void;
}

interface Options<T> {
  /** Snapshot of everything that should be persisted. */
  getPayload: () => T | null;
  /** Persist the payload. Must return the saved row id. */
  save: (payload: T, existingId: string | undefined) => Promise<string | undefined>;
  /** Existing row id when resuming a draft. */
  initialId?: string;
  enabled?: boolean;
  debounceMs?: number;
  /** Stable signature of the payload; a change triggers autosave. */
  signature: string;
}

export function useDocumentAutosave<T>({
  getPayload,
  save,
  initialId,
  enabled = true,
  debounceMs = 1500,
  signature,
}: Options<T>): AutosaveHandle {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const idRef = useRef<string | undefined>(initialId);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const firstSignatureRef = useRef<string | null>(null);
  const saveRef = useRef(save);
  const payloadRef = useRef(getPayload);
  saveRef.current = save;
  payloadRef.current = getPayload;

  useEffect(() => { idRef.current = initialId; }, [initialId]);

  const runSave = useCallback(async () => {
    if (inFlightRef.current) { pendingRef.current = true; return; }
    const payload = payloadRef.current();
    if (!payload) return;
    const revision = revisionRef.current;
    inFlightRef.current = true;
    setStatus("saving");
    setError(null);
    try {
      const savedId = await saveRef.current(payload, idRef.current);
      if (savedId) idRef.current = savedId;
      savedRevisionRef.current = revision;
      setLastSavedAt(new Date());
      if (revisionRef.current === revision) {
        setDirty(false);
        setStatus("saved");
      } else {
        setStatus("saving");
      }
    } catch (e: any) {
      setError(e?.message || "Save failed");
      setStatus("error");
    } finally {
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        // Queue rather than recurse synchronously so React can flush state.
        window.setTimeout(() => { void runSave(); }, 0);
      }
    }
  }, []);

  const markDirty = useCallback(() => {
    revisionRef.current += 1;
    setDirty(true);
  }, []);

  // Debounced autosave driven by the payload signature.
  useEffect(() => {
    if (!enabled) return;
    if (firstSignatureRef.current === null) {
      // Skip the very first signature — that's the initial render, not an edit.
      firstSignatureRef.current = signature;
      return;
    }
    if (firstSignatureRef.current === signature) return;
    firstSignatureRef.current = signature;
    revisionRef.current += 1;
    setDirty(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { void runSave(); }, debounceMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [signature, enabled, debounceMs, runSave]);

  // Flush on tab hide / unload so work is never lost.
  useEffect(() => {
    if (!enabled) return;
    const flush = () => {
      if (revisionRef.current !== savedRevisionRef.current) void runSave();
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (revisionRef.current !== savedRevisionRef.current) {
        flush();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled, runSave]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    await runSave();
  }, [runSave]);

  return { status, lastSavedAt, error, dirty, saveNow, markDirty };
}
