import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      event_type = "success",
      email = null,
      device_fingerprint = null,
      failure_reason = null,
    } = body;

    // Extract client info from headers
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const country = req.headers.get("cf-ipcountry") || null;
    const city = req.headers.get("cf-ipcity") || null;

    // Parse browser/OS from user agent
    const browser = parseBrowser(userAgent);
    const os = parseOS(userAgent);

    // Try to get user_id from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getClaims(token);
      if (data?.claims?.sub) {
        userId = data.claims.sub as string;
      }
    }

    const anomalyReasons: string[] = [];
    let isSuspicious = false;

    // --- Anomaly Detection (only for successful logins with known user) ---
    if (userId && event_type === "success") {
      // 1. Check for new/untrusted device
      if (device_fingerprint) {
        const { data: trusted } = await serviceClient
          .from("trusted_devices")
          .select("id")
          .eq("user_id", userId)
          .eq("device_fingerprint", device_fingerprint)
          .eq("is_revoked", false)
          .gte("expires_at", new Date().toISOString())
          .maybeSingle();

        if (!trusted) {
          anomalyReasons.push("new_device");
          isSuspicious = true;
        }
      }

      // 2. Impossible travel detection
      if (country) {
        const twoHoursAgo = new Date(
          Date.now() - 2 * 60 * 60 * 1000
        ).toISOString();
        const { data: recentLogins } = await serviceClient
          .from("login_events")
          .select("country, created_at")
          .eq("user_id", userId)
          .eq("event_type", "success")
          .gte("created_at", twoHoursAgo)
          .order("created_at", { ascending: false })
          .limit(1);

        if (
          recentLogins?.length &&
          recentLogins[0].country &&
          recentLogins[0].country !== country
        ) {
          anomalyReasons.push(
            `impossible_travel:${recentLogins[0].country}->${country}`
          );
          isSuspicious = true;
        }
      }
    }

    // 3. Credential stuffing detection: >10 failures in 30 min for same email
    if (event_type === "failure" && email) {
      const thirtyMinAgo = new Date(
        Date.now() - 30 * 60 * 1000
      ).toISOString();
      const { count } = await serviceClient
        .from("login_events")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .eq("event_type", "failure")
        .gte("created_at", thirtyMinAgo);

      if (count && count >= 10) {
        anomalyReasons.push("credential_stuffing");
        isSuspicious = true;
      }
    }

    // Determine final event type
    const finalEventType = isSuspicious
      ? "suspicious"
      : event_type;

    // Insert login event (service role bypasses RLS)
    await serviceClient.from("login_events").insert({
      user_id: userId,
      email,
      client_ip: clientIp,
      device_fingerprint,
      user_agent: userAgent,
      browser,
      os,
      country,
      city,
      event_type: finalEventType,
      failure_reason,
      is_suspicious: isSuspicious,
      anomaly_reasons: anomalyReasons.length > 0 ? anomalyReasons : null,
    });

    // Log suspicious events to api_security_events
    if (isSuspicious) {
      await serviceClient.from("api_security_events").insert({
        event_type: "suspicious_login",
        function_name: "record-login-event",
        severity: anomalyReasons.includes("credential_stuffing")
          ? "critical"
          : "high",
        user_id: userId,
        client_ip: clientIp,
        details: {
          email,
          anomaly_reasons: anomalyReasons,
          device_fingerprint,
          country,
          browser,
          os,
        },
      });
    }

    return new Response(
      JSON.stringify({
        recorded: true,
        suspicious: isSuspicious,
        anomalies: anomalyReasons,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("record-login-event error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to record login event" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseBrowser(ua: string): string {
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera/")) return "Opera";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return "Unknown";
}

function parseOS(ua: string): string {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS X") || ua.includes("Macintosh")) return "macOS";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
}
