// create-portal-session — opens the Stripe billing portal for the signed-in user.
//
// Hardened to match `create-checkout`'s pattern (backend audit 2.2):
//  - CORS is origin-checked via `getCorsHeaders` rather than a blanket `*`,
//    so a hostile page can't read the response with the caller's credentials.
//  - The portal URL is minted from the `stripe_customer_id` on the caller's own
//    verified subscription row only — never from anything in the request body.
//  - Errors are not echoed back verbatim; raw exceptions can carry Stripe and
//    internal detail.
//  - Rate limited, because each call hits Stripe's API.
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { getCorsHeaders } from "../_shared/auth-utils.ts";
import { enforceRateLimit } from "../_shared/rate-limit-middleware.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { response: rateLimited } = await enforceRateLimit(
    req,
    { functionName: "create-portal-session", maxRequests: 20, windowMinutes: 15, keyType: "ip" },
    corsHeaders,
  );
  if (rateLimited) return rateLimited;

  try {
    const { returnUrl, environment }: { returnUrl?: string; environment: StripeEnv } = await req.json();
    if (environment !== "sandbox" && environment !== "live") {
      return json({ error: "Invalid environment" }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) return json({ error: "No subscription found" }, 404);

    const stripe = createStripeClient(environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id as string,
      ...(returnUrl && { return_url: returnUrl }),
    });

    return json({ url: portal.url }, 200);
  } catch (e) {
    console.error("create-portal-session error:", e);
    return json({ error: "Unable to open the billing portal. Please try again." }, 400);
  }
});
