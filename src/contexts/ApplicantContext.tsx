/**
 * Centralized applicant data source.
 * ----------------------------------
 * One record per active applicant, shared by the sidebar, applicant profile,
 * position page and the Document Studio editor. Implemented as a module-level
 * subscribable store (no Provider needed, so any surface can read/write it)
 * with localStorage persistence + cross-tab sync.
 *
 * Backing table: `hr_candidates`. Writes are debounced and best-effort — a
 * failed writeback never blocks the UI, the local record stays authoritative
 * for the session.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  EMPTY_APPLICANT,
  type ApplicantRecord,
  hasApplicantIdentity,
} from "@/lib/documents/applicantFieldMap";

const STORAGE_KEY = "jbj:applicant:active";
const EVENT = "jbj:applicant-changed";

let current: ApplicantRecord = readStored();
const listeners = new Set<(a: ApplicantRecord) => void>();

function readStored(): ApplicantRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const j = raw ? JSON.parse(raw) : null;
    if (j && typeof j === "object") return { ...EMPTY_APPLICANT, ...j };
  } catch { /* ignore */ }
  return { ...EMPTY_APPLICANT };
}

function persist(next: ApplicantRecord) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

function emit() {
  listeners.forEach((fn) => { try { fn(current); } catch { /* ignore */ } });
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: current })); } catch { /* ignore */ }
}

/** Read the active applicant outside React. */
export function getActiveApplicant(): ApplicantRecord {
  return current;
}

/** Merge values into the active applicant and notify every subscriber. */
export function setActiveApplicant(patch: Partial<ApplicantRecord>, opts?: { persistRemote?: boolean }) {
  const cleaned: Partial<ApplicantRecord> = {};
  (Object.keys(patch) as Array<keyof ApplicantRecord>).forEach((k) => {
    const v = patch[k];
    if (v === undefined) return;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return;
      (cleaned as any)[k] = trimmed;
    } else {
      (cleaned as any)[k] = v;
    }
  });
  // Switching to a different stored applicant replaces the record wholesale.
  const switchingRecord = !!cleaned.id && !!current.id && cleaned.id !== current.id;
  const next: ApplicantRecord = switchingRecord
    ? { ...EMPTY_APPLICANT, ...cleaned }
    : { ...current, ...cleaned };
  const changed = (Object.keys(next) as Array<keyof ApplicantRecord>).some((k) => next[k] !== current[k]);
  if (!changed) return current;
  current = next;
  persist(current);
  emit();
  if (opts?.persistRemote !== false) scheduleRemoteSync();
  return current;
}

/** Clear the active applicant (e.g. "New submission"). */
export function clearActiveApplicant() {
  current = { ...EMPTY_APPLICANT };
  persist(current);
  emit();
}

/* ── Remote writeback (debounced, best-effort) ─────────────────────── */
let syncTimer: number | null = null;
function scheduleRemoteSync() {
  if (typeof window === "undefined") return;
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => { void pushRemote(); }, 1500);
}

async function pushRemote() {
  const rec = current;
  if (!rec.id) return;
  if (!hasApplicantIdentity(rec)) return;
  const payload: Record<string, string> = {};
  if (rec.full_name) payload.candidate_name = rec.full_name;
  if (rec.email) payload.email = rec.email;
  if (rec.phone) payload.phone = rec.phone;
  if (rec.position) payload.position_applied = rec.position;
  if (!Object.keys(payload).length) return;
  try {
    await (supabase.from("hr_candidates" as any) as any).update(payload).eq("id", rec.id);
  } catch (e) {
    console.warn("[applicant] remote sync skipped", e);
  }
}

/** Load an applicant from `hr_candidates` and make it the active record. */
export async function selectApplicantById(id: string): Promise<ApplicantRecord | null> {
  try {
    const { data, error } = await (supabase.from("hr_candidates" as any) as any)
      .select("id, candidate_name, email, phone, position_applied, intake_payload")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const intake = (data.intake_payload || {}) as Record<string, any>;
    const rec: ApplicantRecord = {
      id: data.id,
      full_name: (data.candidate_name || "").trim(),
      position: (data.position_applied || "").trim(),
      email: (data.email || "").trim(),
      phone: (data.phone || "").trim(),
      address: String(intake.address || intake.address_line || intake.residential_address || "").trim(),
      applicant_ref: String(intake.username || intake.applicant_id || data.id || "").trim(),
    };
    current = rec;
    persist(current);
    emit();
    return rec;
  } catch {
    return null;
  }
}

/* ── React binding ────────────────────────────────────────────────── */
export function useApplicant() {
  const [applicant, setApplicant] = useState<ApplicantRecord>(current);

  useEffect(() => {
    const fn = (a: ApplicantRecord) => setApplicant(a);
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      current = readStored();
      setApplicant(current);
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((patch: Partial<ApplicantRecord>) => setActiveApplicant(patch), []);
  const select = useCallback((id: string) => selectApplicantById(id), []);
  const clear = useCallback(() => clearActiveApplicant(), []);

  return { applicant, update, select, clear, hasIdentity: hasApplicantIdentity(applicant) };
}

export type { ApplicantRecord };
