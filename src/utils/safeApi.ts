/**
 * Permission-safe API wrapper for broker + owner surfaces.
 *
 * Goals:
 *  1. Normalise RLS / permission denials into a consistent `PermissionError`
 *     so callers never have to parse raw PostgREST strings.
 *  2. Deduplicate concurrent identical requests (by `key`) — prevents the
 *     classic "double-click submits twice / 409 conflict" footgun.
 *  3. Optionally serialise mutually-exclusive writes (by `lockKey`) so two
 *     conflicting mutations (e.g. promote + junk on the same lead) cannot
 *     race against each other.
 *
 * This is a thin wrapper — it does NOT replace Supabase. Use it from hooks:
 *
 *   const { data } = await safeCall({
 *     key: ["lead", leadId, "promote"],
 *     lockKey: `lead:${leadId}`,
 *     run: () => supabase.rpc("broker_promote_lead_to_main", { _lead_id: leadId }),
 *   });
 */

import { friendlyBackendError, FriendlyBackendError } from "./friendlyBackendError";

export class PermissionError extends Error {
  readonly kind = "permission" as const;
  readonly friendly: FriendlyBackendError;
  readonly status?: number;
  readonly code?: string;
  constructor(friendly: FriendlyBackendError) {
    super(friendly.message);
    this.name = "PermissionError";
    this.friendly = friendly;
    this.status = friendly.status;
    this.code = friendly.code;
  }
}

export class ConflictError extends Error {
  readonly kind = "conflict" as const;
  readonly friendly: FriendlyBackendError;
  constructor(friendly: FriendlyBackendError) {
    super(friendly.message);
    this.name = "ConflictError";
    this.friendly = friendly;
  }
}

export class BackendError extends Error {
  readonly kind = "backend" as const;
  readonly friendly: FriendlyBackendError;
  readonly status?: number;
  readonly code?: string;
  constructor(friendly: FriendlyBackendError) {
    super(friendly.message);
    this.name = "BackendError";
    this.friendly = friendly;
    this.status = friendly.status;
    this.code = friendly.code;
  }
}

export type AnySafeError = PermissionError | ConflictError | BackendError;

const isPermission = (f: FriendlyBackendError) =>
  f.status === 401 || f.status === 403 || f.code === "42501" || f.code === "PGRST301";
const isConflict = (f: FriendlyBackendError) => f.status === 409 || f.code === "23505";

function toSafeError(err: unknown): AnySafeError {
  if (err instanceof PermissionError || err instanceof ConflictError || err instanceof BackendError) {
    return err;
  }
  const f = friendlyBackendError(err);
  if (isPermission(f)) return new PermissionError(f);
  if (isConflict(f)) return new ConflictError(f);
  return new BackendError(f);
}

// ---------- de-dup + locking ----------

type Key = string | readonly (string | number | null | undefined)[];

const inflight = new Map<string, Promise<any>>();
const locks = new Map<string, Promise<void>>();

const k = (key: Key) => (Array.isArray(key) ? key.join("::") : String(key));

interface SafeCallOptions<T> {
  /** Stable key — concurrent calls with the same key share one in-flight promise. */
  key?: Key;
  /** Mutex key — at most one safeCall with the same lockKey runs at a time. */
  lockKey?: Key;
  /** The actual backend call. Should return `{ data, error }` (Supabase) or throw. */
  run: () => Promise<{ data: T; error: any } | T>;
}

async function acquireLock(lockKey: string): Promise<() => void> {
  while (locks.has(lockKey)) {
    try {
      await locks.get(lockKey);
    } catch {
      /* previous holder errored — that's fine, we still acquire next */
    }
  }
  let release!: () => void;
  const p = new Promise<void>((res) => {
    release = res;
  });
  locks.set(lockKey, p);
  return () => {
    locks.delete(lockKey);
    release();
  };
}

/**
 * Run a backend call with consistent error mapping, request dedup, and
 * optional mutual-exclusion locking.
 *
 * Always resolves with `{ data }` on success or throws one of:
 *   PermissionError | ConflictError | BackendError
 */
export async function safeCall<T>(opts: SafeCallOptions<T>): Promise<{ data: T }> {
  const { key, lockKey, run } = opts;

  // 1. Dedup identical concurrent calls
  if (key) {
    const id = k(key);
    const existing = inflight.get(id);
    if (existing) return existing as Promise<{ data: T }>;
    const promise = executeWithLock<T>(lockKey, run).finally(() => inflight.delete(id));
    inflight.set(id, promise);
    return promise;
  }

  return executeWithLock<T>(lockKey, run);
}

async function executeWithLock<T>(
  lockKey: Key | undefined,
  run: SafeCallOptions<T>["run"],
): Promise<{ data: T }> {
  let release: (() => void) | undefined;
  if (lockKey) release = await acquireLock(k(lockKey));
  try {
    const raw = await run();
    // Supabase shape
    if (raw && typeof raw === "object" && "error" in (raw as any)) {
      const { data, error } = raw as { data: T; error: any };
      if (error) throw toSafeError(error);
      return { data };
    }
    return { data: raw as T };
  } catch (err) {
    throw toSafeError(err);
  } finally {
    release?.();
  }
}

/** Type guard helpers for UI code */
export const isPermissionError = (e: unknown): e is PermissionError =>
  e instanceof PermissionError;
export const isConflictError = (e: unknown): e is ConflictError => e instanceof ConflictError;
export const isBackendError = (e: unknown): e is BackendError => e instanceof BackendError;

/** Convenience: pull a friendly message from any thrown value (safe or raw). */
export function describeError(err: unknown): FriendlyBackendError {
  if (err instanceof PermissionError || err instanceof ConflictError || err instanceof BackendError) {
    return err.friendly;
  }
  return friendlyBackendError(err);
}
