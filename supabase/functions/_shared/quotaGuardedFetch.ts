// Drop-in `fetch` replacement that enforces the global Resend daily/monthly
// cap WITHOUT changing how callers parse the response. Designed so existing
// edge functions can migrate by changing one identifier:
//   await fetch("https://api.resend.com/emails", init)
//   →  await quotaGuardedFetch("https://api.resend.com/emails", init)
//
// When the URL is the Resend send endpoint, we:
//   1. Atomically claim a slot via email_quota_try_claim()
//   2. If the cap is hit, return a synthetic 429 Response (no Resend call)
//   3. Throttle to honour the configured req/sec
//   4. Forward to fetch(); on non-2xx, roll the slot back
//
// For any other URL we just pass through to global fetch.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_SEND_URL = "https://api.resend.com/emails";

function admin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function throttle(lastSendAt: string | null, ratePerSec: number) {
  if (!lastSendAt || ratePerSec <= 0) return;
  const minGapMs = Math.ceil(1000 / ratePerSec);
  const elapsed = Date.now() - new Date(lastSendAt).getTime();
  const wait = minGapMs - elapsed;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function quotaGuardedFetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === "string" ? input : input.toString();
  const isResendSend = url.startsWith(RESEND_SEND_URL);

  if (!isResendSend) {
    return fetch(input, init);
  }

  const sb = admin();
  const { data: claim, error: claimErr } = await sb.rpc("email_quota_try_claim");

  if (claimErr) {
    return jsonResponse(500, {
      name: "quota_check_failed",
      message: claimErr.message,
    });
  }

  const c = claim as any;
  if (!c?.ok) {
    return jsonResponse(429, {
      name: c?.code ?? "QUOTA_REJECTED",
      message: c?.code === "DAILY_LIMIT_REACHED"
        ? `Daily email limit reached (${c?.sent_today}/${c?.daily_limit}). Resets tomorrow (UTC).`
        : c?.code === "MONTHLY_LIMIT_REACHED"
        ? `Monthly email limit reached (${c?.sent_month}/${c?.monthly_limit}).`
        : "Email quota rejected the send.",
      quota: {
        sent_today: c?.sent_today ?? 0,
        daily_limit: c?.daily_limit ?? 100,
        sent_month: c?.sent_month ?? 0,
        monthly_limit: c?.monthly_limit ?? 2900,
      },
    });
  }

  await throttle(c.last_send_at ?? null, c.rate_per_sec ?? 2);

  let resp: Response;
  try {
    resp = await fetch(input, init);
  } catch (e) {
    await sb.rpc("email_quota_record_failure");
    throw e;
  }

  if (!resp.ok) {
    // Roll back the slot so a Resend 4xx/5xx doesn't burn quota.
    sb.rpc("email_quota_record_failure").catch(() => {});
  }

  return resp;
}
