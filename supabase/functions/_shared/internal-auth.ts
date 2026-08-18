/**
 * Internal-caller auth — for edge functions that are meant to be invoked only
 * by pg_cron / another edge function / a server-side job, never by a browser
 * holding the public anon key.
 *
 * Backend audit 4.2: several cron-shaped functions (`crm-purge-trash`,
 * `compute-user-scores`) shipped with no caller check at all, so any caller
 * with the public anon key could invoke a destructive hard-delete or force
 * recomputation for an arbitrary `user_id`. This module is the single shared
 * gate for that class of function, mirroring the `x-cron-secret` convention
 * already used by `crm-relationship-cron`.
 *
 * A caller is accepted when EITHER:
 *   (a) `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` — how pg_cron's
 *       `net.http_post` and function-to-function calls authenticate, or
 *   (b) `x-cron-secret` matches `CRM_CRON_SECRET`.
 *
 * Fails closed: if neither secret is configured in the environment, nothing
 * is accepted.
 */

/** Length-safe, constant-time string comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export interface InternalAuthResult {
  ok: boolean;
  /** How the caller authenticated — useful for log lines. */
  via?: "service_role" | "cron_secret";
}

export function isInternalCaller(req: Request): InternalAuthResult {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const bearer = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (serviceKey && bearer && timingSafeEqual(bearer, serviceKey)) {
    return { ok: true, via: "service_role" };
  }

  const cronSecret = Deno.env.get("CRM_CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (cronSecret && provided && timingSafeEqual(provided, cronSecret)) {
    return { ok: true, via: "cron_secret" };
  }

  return { ok: false };
}

/**
 * Returns a 403 Response when the caller is not an internal one, or `null`
 * when the call may proceed.
 */
export function requireInternalCaller(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  if (isInternalCaller(req).ok) return null;
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
