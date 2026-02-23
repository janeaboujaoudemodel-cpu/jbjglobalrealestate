/**
 * safe-execution.ts — Shared infrastructure protection utilities
 * 
 * Provides:
 * - Concurrency locking (prevents parallel runs of same function)
 * - Safe batch processor with backoff
 * - Hard timeout enforcement
 * - Memory-safe streaming patterns
 * - Centralized error boundary
 */

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Constants ──────────────────────────────────────────
export const MAX_BATCH_SIZE = 200;
export const DEFAULT_BATCH_SIZE = 100;
export const MAX_EXECUTION_MS = 540_000; // 9 minutes (edge function limit is 10)
export const MAX_RETRIES = 3;
export const INITIAL_BACKOFF_MS = 1000;

// ── Service Client (singleton) ─────────────────────────
let _serviceClient: SupabaseClient | null = null;
export function getServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    _serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return _serviceClient;
}

// ── Concurrency Lock ───────────────────────────────────
export async function acquireLock(functionName: string, timeoutMinutes = 10): Promise<boolean> {
  const sb = getServiceClient();
  const { data, error } = await sb.rpc("acquire_function_lock", {
    p_function_name: functionName,
    p_timeout_minutes: timeoutMinutes,
  });
  if (error) {
    console.error(`[lock] Failed to acquire lock for ${functionName}:`, error.message);
    return false;
  }
  return data === true;
}

export async function releaseLock(functionName: string, durationMs?: number): Promise<void> {
  const sb = getServiceClient();
  await sb.rpc("release_function_lock", {
    p_function_name: functionName,
    p_duration_ms: durationMs ?? null,
  });
}

// ── Execution Guard (wraps entire edge function) ───────
export interface GuardOptions {
  functionName: string;
  lockTimeoutMinutes?: number;
  maxExecutionMs?: number;
}

export interface GuardResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  skipped?: boolean;
  durationMs?: number;
}

export async function withExecutionGuard<T>(
  opts: GuardOptions,
  handler: (ctx: { startTime: number; shouldStop: () => boolean; supabase: SupabaseClient }) => Promise<T>
): Promise<GuardResult<T>> {
  const startTime = Date.now();
  const maxMs = opts.maxExecutionMs ?? MAX_EXECUTION_MS;

  // Try to acquire lock
  const gotLock = await acquireLock(opts.functionName, opts.lockTimeoutMinutes ?? 10);
  if (!gotLock) {
    console.log(`[guard] ${opts.functionName} — skipped (already running)`);
    return { success: true, skipped: true, error: "Previous execution still running" };
  }

  try {
    const result = await handler({
      startTime,
      shouldStop: () => (Date.now() - startTime) > (maxMs - 30_000), // stop 30s before hard limit
      supabase: getServiceClient(),
    });

    const durationMs = Date.now() - startTime;
    await releaseLock(opts.functionName, durationMs);
    return { success: true, data: result, durationMs };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[guard] ${opts.functionName} failed after ${durationMs}ms:`, errorMsg);
    await releaseLock(opts.functionName, durationMs);
    return { success: false, error: errorMsg, durationMs };
  }
}

// ── Safe Batch Processor ───────────────────────────────
export interface BatchOptions<T> {
  items: T[];
  batchSize?: number;
  processor: (batch: T[], batchIndex: number) => Promise<void>;
  shouldStop?: () => boolean;
  onBatchComplete?: (processed: number, total: number) => void;
  delayBetweenBatches?: number;
}

export async function processBatches<T>(opts: BatchOptions<T>): Promise<{ processed: number; total: number; aborted: boolean }> {
  const batchSize = Math.min(opts.batchSize ?? DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE);
  const total = opts.items.length;
  let processed = 0;

  for (let i = 0; i < total; i += batchSize) {
    // Check if we should stop (time limit reached)
    if (opts.shouldStop?.()) {
      console.log(`[batch] Stopping at ${processed}/${total} — time limit approaching`);
      return { processed, total, aborted: true };
    }

    const batch = opts.items.slice(i, i + batchSize);
    
    try {
      await opts.processor(batch, Math.floor(i / batchSize));
      processed += batch.length;
      opts.onBatchComplete?.(processed, total);
    } catch (err) {
      console.error(`[batch] Error processing batch ${Math.floor(i / batchSize)}:`, err);
      // Continue with next batch instead of failing entirely
      processed += batch.length;
    }

    // Delay between batches to avoid overloading
    if (opts.delayBetweenBatches && i + batchSize < total) {
      await sleep(opts.delayBetweenBatches);
    }
  }

  return { processed, total, aborted: false };
}

// ── Exponential Backoff Retry ──────────────────────────
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  initialBackoffMs = INITIAL_BACKOFF_MS
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      if (attempt < maxRetries) {
        const backoff = initialBackoffMs * Math.pow(2, attempt) + Math.random() * 500;
        console.log(`[retry] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${Math.round(backoff)}ms`);
        await sleep(backoff);
      }
    }
  }
  
  throw lastError;
}

// ── Sync Job State Management ──────────────────────────
export interface SyncJobState {
  id: string;
  job_type: string;
  status: string;
  total_records: number;
  processed_records: number;
  last_cursor: string | null;
  next_cursor: string | null;
  batch_size: number;
  stats_created: number;
  stats_updated: number;
  stats_skipped: number;
  stats_errors: number;
}

export async function getOrCreateSyncJob(jobType: string, source?: string): Promise<SyncJobState | null> {
  const sb = getServiceClient();
  
  // Check for active/paused job
  const { data: existing } = await sb
    .from("sync_jobs")
    .select("*")
    .eq("job_type", jobType)
    .in("status", ["running", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as SyncJobState;

  // Create new job
  const { data: newJob, error } = await sb
    .from("sync_jobs")
    .insert({
      job_type: jobType,
      status: "running",
      source: source || jobType,
      total_records: 0,
      processed_records: 0,
      batch_size: DEFAULT_BATCH_SIZE,
      stats_created: 0,
      stats_updated: 0,
      stats_skipped: 0,
      stats_errors: 0,
    })
    .select()
    .single();

  if (error) {
    console.error(`[sync] Failed to create sync job:`, error.message);
    return null;
  }

  return newJob as SyncJobState;
}

export async function updateSyncJob(id: string, updates: Partial<SyncJobState> & Record<string, unknown>): Promise<void> {
  const sb = getServiceClient();
  await sb
    .from("sync_jobs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
}

// ── Utility ────────────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── CORS Headers ───────────────────────────────────────
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
