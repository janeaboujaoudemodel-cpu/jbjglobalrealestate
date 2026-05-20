// CRM Next-Actions — owner-only AI recommendations.
// Reads up to 50 of the user's latest visible leads, asks Lovable AI for
// the top 5 next actions, and caches the answer in crm_ai_suggestions
// keyed by md5(sorted lead ids) so re-renders don't burn tokens.

import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const LeadSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable().optional(),
  pipeline_stage: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  vip: z.boolean().nullable().optional(),
});

const BodySchema = z.object({
  leads: z.array(LeadSchema).max(50),
});

const SuggestionsOutput = z.object({
  suggestions: z
    .array(
      z.object({
        leadId: z.string(),
        reason: z.string().min(4).max(180),
        action: z.enum(["call", "email", "schedule", "won", "snooze"]),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(5),
});

async function md5Hex(input: string) {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("MD5", buf).catch(() => null);
  if (digest) {
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback: SHA-1 truncated (Deno has no MD5 by default in some builds)
  const sha = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(sha))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_KEY) return json({ error: "missing LOVABLE_API_KEY" }, 500);

  // Auth — required (owner-only)
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
  const userId = userData.user.id;

  // Owner role check
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roleRows } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isOwner = (roleRows || []).some((r: any) => r.role === "owner" || r.role === "admin");
  if (!isOwner) return json({ error: "forbidden" }, 403);

  // Parse body
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    body = parsed.data;
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  if (body.leads.length === 0) {
    return json({ suggestions: [], cached: false });
  }

  const sortedIds = body.leads.map((l) => l.id).sort();
  const hash = await md5Hex(sortedIds.join("|"));

  // Cache lookup (10 min)
  const { data: cached } = await admin
    .from("crm_ai_suggestions")
    .select("payload, created_at")
    .eq("user_id", userId)
    .eq("lead_set_hash", hash)
    .maybeSingle();

  if (cached) {
    const ageMs = Date.now() - new Date(cached.created_at).getTime();
    if (ageMs < 10 * 60 * 1000) {
      return json({ ...cached.payload, cached: true });
    }
  }

  // Build a compact prompt
  const compact = body.leads.map((l) => ({
    id: l.id,
    name: l.full_name || "(unknown)",
    stage: l.pipeline_stage || "new",
    source: l.source || "",
    vip: !!l.vip,
    age_days:
      l.created_at
        ? Math.max(0, Math.round((Date.now() - new Date(l.created_at).getTime()) / 86_400_000))
        : null,
  }));

  const gateway = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": LOVABLE_KEY,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

  const model = gateway("google/gemini-3-flash-preview");

  let aiOutput: z.infer<typeof SuggestionsOutput>;
  try {
    const { text } = await generateText({
      model,
      system:
        "You are an executive CRM assistant for a luxury real-estate brokerage. " +
        "Pick up to 5 leads with the highest commercial upside RIGHT NOW and recommend ONE concrete next action per lead. " +
        "Prefer VIP, hot/negotiation/viewing/offer_sent stages, fresh website leads under 3 days old, and stale follow-ups over 7 days. " +
        "Reasons must be one short sentence (no fluff, no greetings). " +
        'Respond ONLY with minified JSON in this exact shape: {"suggestions":[{"leadId":"<uuid from input>","reason":"<sentence>","action":"call|email|schedule|won|snooze","confidence":0.0-1.0}]} ' +
        "Max 5 items. No markdown fences, no commentary.",
      prompt: "Leads:\n" + JSON.stringify(compact) + "\n\nReturn JSON only.",
    });

    let cleaned = (text || "").trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("no JSON object in AI response");
    cleaned = cleaned.slice(s, e + 1);

    const parsed = JSON.parse(cleaned);
    const validated = SuggestionsOutput.safeParse(parsed);
    if (!validated.success) {
      throw new Error("schema mismatch: " + JSON.stringify(validated.error.flatten()));
    }
    aiOutput = validated.data;
  } catch (e) {
    console.error("[crm-ai-next-actions] AI call failed", e);
    return json({ error: "ai_failed", message: String(e) }, 502);
  }

  // Cache (upsert)
  await admin
    .from("crm_ai_suggestions")
    .upsert(
      {
        user_id: userId,
        lead_set_hash: hash,
        payload: aiOutput,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lead_set_hash" },
    );

  return json({ ...aiOutput, cached: false });
});
