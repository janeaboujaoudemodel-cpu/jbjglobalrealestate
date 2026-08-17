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
//
// SECURITY (backend audit 5.1): authentication alone was not enough. Any
// authenticated account — including a brand-new self-service signup — could
// set an arbitrary `from`, `to`, `subject` and `html`, i.e. send phishing mail
// from JBJ's own sending domain to any external address at 10/hour. Two
// constraints now bound that:
//   1. `from` must be an allow-listed JBJ sending domain (all callers,
//      internal ones included) — no impersonating another brand.
//   2. Non-staff callers may only send to their own verified account email or
//      to a JBJ internal address. Staff/owner accounts (Document Studio and
//      similar back-office tools) and internal service calls keep the ability
//      to mail arbitrary recipients.

import { sendViaResend, type ResendSendInput } from "../_shared/resendClient.ts";
import { corsHeaders, requireAuthenticatedUser, validateEmployeeAuth } from "../_shared/auth-utils.ts";
import { enforceRateLimit } from "../_shared/rate-limit-middleware.ts";

/** Domains this gateway is permitted to send *from*. */
const ALLOWED_SENDER_DOMAINS = ["jbj.ae", "notify.jbj.ae"];

/** Extracts the bare address from `Name <addr@domain>` or a bare address. */
function parseAddress(value: string): string {
  const angled = value.match(/<([^>]+)>/);
  return (angled ? angled[1] : value).trim().toLowerCase();
}

function domainOf(address: string): string {
  return address.split("@")[1] ?? "";
}

function isAllowedSender(from: string): boolean {
  const domain = domainOf(parseAddress(from));
  return ALLOWED_SENDER_DOMAINS.includes(domain);
}

function recipientList(to: ResendSendInput["to"]): string[] {
  const raw = Array.isArray(to) ? to : [to];
  return raw.filter((v): v is string => typeof v === "string").map(parseAddress);
}

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
  let callerEmail: string | undefined;
  let callerIsStaff = false;
  if (!isInternalCall) {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.authenticated || !auth.userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = auth.userId;
    callerEmail = auth.email?.toLowerCase().trim();

    // Staff/owner accounts keep unrestricted recipients (Document Studio is
    // OwnerGuard-gated and legitimately mails external clients).
    const staff = await validateEmployeeAuth(req);
    callerIsStaff = !!staff.isEmployee;
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

  // 3. Sender allow-list — applies to every caller, internal ones included.
  if (typeof body.from !== "string" || !isAllowedSender(body.from)) {
    console.warn("[email-send-gateway] rejected sender:", body.from);
    return new Response(
      JSON.stringify({ error: "Sender address is not permitted" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 4. Recipient scope for non-staff authenticated callers.
  if (!isInternalCall && !callerIsStaff) {
    const recipients = recipientList(body.to);
    if (!recipients.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: from, to, subject, html|text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const permitted = recipients.every(
      (addr) => addr === callerEmail || ALLOWED_SENDER_DOMAINS.includes(domainOf(addr)),
    );
    if (!permitted) {
      console.warn("[email-send-gateway] non-staff caller attempted external recipient", { userId });
      return new Response(
        JSON.stringify({
          error: "You may only send to your own address or a JBJ address.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const result = await sendViaResend(body);

  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : result.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
