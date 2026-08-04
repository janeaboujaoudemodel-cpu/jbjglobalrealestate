/**
 * ai-search-intent — resolves a free-text hero-search sentence into an app route.
 *
 * Layer 2 of the search router: the client tries deterministic rules first and
 * only calls this when they miss. Returns `{ route: null }` when the model is
 * not confident, which tells the client to hand the visitor to chat support.
 */

import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  query: z.string().min(1).max(400),
  locale: z.string().max(10).optional(),
});

const ROUTES = `
/properties?intent=buy            — properties for sale / investment search
/properties?intent=rent           — rentals
/properties?intent=off-plan       — off-plan & new launches
/services/sell-property           — the visitor wants to sell
/services/property-management     — leasing out / managing a property
/services/golden-visa             — residency / Golden Visa
/tools/property-valuation         — "what is my property worth"
/tools/mortgage-calculator        — mortgage / finance / payment plans
/developers                       — browsing developers
/areas                            — browsing areas / communities
/insights                         — market data, reports, trends
/contact                          — wants to talk to a human
`.trim();

const SYSTEM = `You route visitor sentences on a Dubai/UAE real-estate platform (JBJ Global) to ONE app route.

Available routes:
${ROUTES}

Rules:
- Reply with JSON only: {"route": string|null, "message": string, "confidence": "high"|"medium"|"low"}
- "message" is one short friendly sentence (max 90 chars) telling the visitor where they are going.
- You may append query params to /properties (areas, beds, priceMax) when the sentence names them; use lowercase hyphenated area slugs such as dubai-marina.
- If the sentence is off-topic, abusive, or you are not confident, return {"route": null, ...} so a human advisor takes over.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ route: null, message: "Let me connect you with an advisor.", confidence: "low" });

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: parsed.data.query },
        ],
      }),
    });

    if (res.status === 429) return json({ error: "rate_limited" }, 429);
    if (res.status === 402) return json({ error: "credits_exhausted" }, 402);
    if (!res.ok) {
      console.error("[ai-search-intent] gateway error", res.status, await res.text());
      return json({ route: null, message: "Let me connect you with an advisor.", confidence: "low" });
    }

    const payload = await res.json();
    const raw = payload?.choices?.[0]?.message?.content ?? "{}";
    let out: { route?: string | null; message?: string; confidence?: string };
    try {
      out = JSON.parse(raw);
    } catch {
      out = {};
    }

    const route = typeof out.route === "string" && out.route.startsWith("/") ? out.route : null;
    return json({
      route,
      message: (out.message ?? "").slice(0, 120) || "Connecting you with an advisor.",
      confidence: out.confidence === "high" || out.confidence === "medium" ? out.confidence : "low",
    });
  } catch (err) {
    console.error("[ai-search-intent] failed", err);
    return json({ route: null, message: "Let me connect you with an advisor.", confidence: "low" });
  }
});
