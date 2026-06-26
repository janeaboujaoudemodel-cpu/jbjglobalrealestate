// Universal email send gateway — single entry point for any client/edge code
// that wants to send an email. Routes through Resend with the global daily
// + monthly cap (Resend free plan: 100/day, 3,000/month, 2 req/s).
//
// SECURITY: This endpoint is NOT publicly callable. Callers must either:
//   (a) present a valid Supabase user JWT (authenticated session), or
//   (b) present the internal service header `x-internal-secret` matching
//       the `EMAIL_GATEWAY_INTERNAL_SECRET` env var (used for cross-function
//       service-role invocations).
// Per-IP rate limiting prevents quota exhaustion attacks.

import { sendViaResend, type ResendSendInput } from "../_shared/resendClient.ts";
import { corsHeaders, requireAuthenticatedUser } from "../_shared/auth-utils.ts";
import { enforceRateLimit } from "../_shared/rate-limit-middleware.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1. Authentication: either internal service secret OR valid user JWT
  const internalSecret = Deno.env.get("EMAIL_GATEWAY_INTERNAL_SECRET");
  const providedSecret = req.headers.get("x-internal-secret");
  const isInternalCall = internalSecret && providedSecret && providedSecret === internalSecret;

  let userId: string | undefined;
  if (!isInternalCall) {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.authenticated || !auth.userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = auth.userId;
  }

  // 2. Rate limiting (skip for internal service calls)
  if (!isInternalCall) {
    const rl = await enforceRateLimit(
      req,
      { functionName: "email-send-gateway", maxRequests: 10, windowMinutes: 60, keyType: "user" },
      corsHeaders,
      userId,
    );
    if (rl.response) return rl.response;
  }

  let body: ResendSendInput;
  try {
    body = (await req.json()) as ResendSendInput;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body?.from || !body?.to || !body?.subject || (!body.html && !body.text)) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: from, to, subject, html|text" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const result = await sendViaResend(body);

  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : result.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
