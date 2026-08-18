import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Zero Trust Owner Auth Middleware
 * 
 * Verifies the caller is the platform Owner via:
 * 1. JWT presence + validity
 * 2. Token expiry check (prevents stale token reuse)
 * 3. Registered owner email match
 * 4. Logs denied attempts to api_security_events
 */

interface OwnerAuthResult {
  response: Response | null; // non-null = denied, return immediately
  userId: string;
  email: string;
}

export async function requireOwnerAuth(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<OwnerAuthResult> {
  const denied = (status: number, message: string): OwnerAuthResult => ({
    response: new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }),
    userId: "",
    email: "",
  });

  // 1. Extract Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    await logDenied(req, "missing_auth_header", null, null);
    return denied(401, "Authentication required");
  }

  const token = authHeader.replace("Bearer ", "");

  // 2. Decode and check token expiry (prevents stale token reuse)
  try {
    const payloadB64 = token.split(".")[1];
    if (payloadB64) {
      const payload = JSON.parse(atob(payloadB64));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        await logDenied(req, "expired_token", payload.sub || null, payload.email || null);
        return denied(401, "Token expired");
      }
    }
  } catch {
    // If we can't decode, let getUser handle it
  }

  // 3. Verify user via Supabase Auth
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    await logDenied(req, "invalid_token", null, null);
    return denied(401, "Invalid authentication token");
  }

  const userId = claimsData.claims.sub as string;
  const userEmail = (claimsData.claims.email as string) || "";

  // 4. Email allow-list is the ONLY gate — identical rule to the `verify-owner`
  //    edge function that the Owner UI (`OwnerGuard`) trusts.
  //
  //    Backend audit 2.1: this middleware previously granted access on
  //    `emailOk || roleOk`, where `roleOk` was an `owner`/`admin` row in
  //    `user_roles`. That made the Owner UI and the Owner-only backend
  //    functions disagree about what "being the owner" means: a stray
  //    `owner` role row for a non-founder account would have opened every
  //    `owner-*` function while `OwnerGuard` still refused the UI. Roles are
  //    no longer consulted for authorization here — only for the audit label
  //    recorded on a denial.
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // Keep in sync with supabase/functions/verify-owner/index.ts and
  // src/config/ownerEmails.ts (OWNER_BACKEND_EMAILS).
  const OWNER_BACKEND_EMAILS = new Set([
    "janeaboujaoudemodel@gmail.com",
    "janeaboujaoudenails@gmail.com",
    "contact@janeaboujaoude.net",
    "infoo.jane@gmail.com",
  ]);

  const { data: ownerSetting } = await serviceClient
    .from("app_settings")
    .select("value")
    .eq("key", "owner_email")
    .maybeSingle();

  // `app_settings.owner_email` can only ever NARROW or re-confirm the set —
  // a configured value is honoured only when it is already an allow-listed
  // founder inbox, so DB write access can never widen owner access.
  const configuredOwnerEmail = String(ownerSetting?.value || "").toLowerCase().trim();
  if (configuredOwnerEmail && OWNER_BACKEND_EMAILS.has(configuredOwnerEmail)) {
    OWNER_BACKEND_EMAILS.add(configuredOwnerEmail);
  }

  const normalizedEmail = userEmail.toLowerCase().trim();

  if (!OWNER_BACKEND_EMAILS.has(normalizedEmail)) {
    // A caller holding an owner/admin role row but no allow-listed email is
    // the exact privilege-escalation shape this gate exists to stop — log it
    // at the higher severity so it is visible in api_security_events.
    const { data: roles } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const hadOwnerRole = !!roles?.some(
      (r: { role: string }) => r.role === "owner" || r.role === "admin",
    );

    await logDenied(
      req,
      hadOwnerRole ? "privilege_escalation_attempt" : "owner_email_mismatch",
      userId,
      userEmail,
    );
    return denied(403, "Owner-only access. This action has been logged.");
  }

  return { response: null, userId, email: userEmail };
}

async function logDenied(
  req: Request,
  eventType: string,
  userId: string | null,
  email: string | null
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || "unknown";

    await client.from("api_security_events").insert({
      event_type: eventType,
      function_name: url.pathname.split("/").pop() || "unknown",
      severity: eventType === "privilege_escalation_attempt" ? "critical" : "high",
      user_id: userId,
      client_ip: clientIp,
      details: {
        email,
        user_agent: req.headers.get("user-agent"),
        path: url.pathname,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("Failed to log security event:", e);
  }
}
