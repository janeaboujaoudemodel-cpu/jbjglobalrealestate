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

  const PRIMARY_OWNER_EMAIL = "janeaboujaoudenails@gmail.com";

  // 4. Registered owner email is the gate. A user_roles owner/admin row alone
  // must never grant access to owner edge functions.
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: ownerSetting } = await serviceClient
    .from("app_settings")
    .select("value")
    .eq("key", "owner_email")
    .maybeSingle();

  const configuredOwnerEmail = String(ownerSetting?.value || "").toLowerCase().trim();
  const registeredOwnerEmail = configuredOwnerEmail === PRIMARY_OWNER_EMAIL
    ? configuredOwnerEmail
    : PRIMARY_OWNER_EMAIL;
  if (userEmail.toLowerCase().trim() !== registeredOwnerEmail) {
    await logDenied(req, "owner_email_mismatch", userId, userEmail);
    return denied(403, "Owner-only access. This action has been logged.");
  }

  // Optional sanity check/source compatibility: registered owner email can enter
  // even during first registration before user_roles has been seeded.
  return { response: null, userId, email: userEmail };

  /* Legacy role-only gate intentionally disabled.

  const { data: roles } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const hasOwnerRole = roles?.some(
    (r: { role: string }) => r.role === "owner" || r.role === "admin"
  );

  if (hasOwnerRole) {
    return { response: null, userId, email: userEmail };
  }

  // 5. Fallback: check app_settings.owner_email
  const { data: ownerSetting } = await serviceClient
    .from("app_settings")
    .select("value")
    .eq("key", "owner_email")
    .maybeSingle();

  if (ownerSetting?.value && ownerSetting.value.toLowerCase() === userEmail.toLowerCase()) {
    return { response: null, userId, email: userEmail };
  }

  // 6. Denied — not owner
  await logDenied(req, "privilege_escalation_attempt", userId, userEmail);
  return denied(403, "Owner-only access. This action has been logged.");
  */
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
