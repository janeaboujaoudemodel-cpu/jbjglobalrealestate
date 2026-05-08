// Shared Resend sender — single chokepoint that enforces the
// daily/monthly cap aligned with the Resend free plan.
//
// Free plan limits (https://resend.com/pricing):
//   - 100 emails / day
//   - 3,000 emails / month
//   - 2 requests / second
//
// All outbound mail in the project should funnel through `sendViaResend`
// so the cap, throttle, and observability live in one place.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API = "https://api.resend.com/emails";

export interface ResendSendInput {
  from: string;                       // "Name <addr@domain>" or bare addr
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
  attachments?: { filename: string; content: string; type?: string }[];
}

export interface ResendSendResult {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
  quota?: {
    sent_today: number;
    daily_limit: number;
    sent_month: number;
    monthly_limit: number;
  };
}

function admin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Sleep helper to honour Resend's 2 req/s rate limit. */
async function throttle(lastSendAt: string | null, ratePerSec: number) {
  if (!lastSendAt || ratePerSec <= 0) return;
  const minGapMs = Math.ceil(1000 / ratePerSec);
  const elapsed = Date.now() - new Date(lastSendAt).getTime();
  const wait = minGapMs - elapsed;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

export async function sendViaResend(input: ResendSendInput): Promise<ResendSendResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { ok: false, status: 500, error: "RESEND_API_KEY is not configured" };
  }

  const sb = admin();

  // 1. Reserve a slot atomically (or get a structured rejection)
  const { data: claim, error: claimErr } = await sb.rpc("email_quota_try_claim");
  if (claimErr) {
    return { ok: false, status: 500, error: `quota check failed: ${claimErr.message}` };
  }
  const c = claim as any;
  if (!c?.ok) {
    return {
      ok: false,
      status: 429,
      error: c?.code ?? "QUOTA_REJECTED",
      quota: {
        sent_today: c?.sent_today ?? 0,
        daily_limit: c?.daily_limit ?? 100,
        sent_month: c?.sent_month ?? 0,
        monthly_limit: c?.monthly_limit ?? 2900,
      },
    };
  }

  // 2. Honour 2 req/s throttle
  await throttle(c.last_send_at ?? null, c.rate_per_sec ?? 2);

  // 3. Hit Resend
  let resp: Response;
  try {
    resp = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch (e) {
    await sb.rpc("email_quota_record_failure");
    return { ok: false, status: 502, error: `network error: ${(e as Error).message}` };
  }

  const text = await resp.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep raw */ }

  if (!resp.ok) {
    await sb.rpc("email_quota_record_failure");
    return {
      ok: false,
      status: resp.status,
      error: data?.message || data?.error || text || `Resend ${resp.status}`,
      data,
    };
  }

  return {
    ok: true,
    status: resp.status,
    data,
    quota: {
      sent_today: c.sent_today,
      daily_limit: c.daily_limit,
      sent_month: c.sent_month,
      monthly_limit: c.monthly_limit,
    },
  };
}
