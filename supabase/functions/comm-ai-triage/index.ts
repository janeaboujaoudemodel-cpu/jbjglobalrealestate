// Triage a comm thread: categorize, summarize, suggest reply + next step
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  "real_estate_lead",
  "real_estate_ops",
  "sales_offer",
  "marketing",
  "finance",
  "developer_documents",
  "personal",
  "spam",
  "other",
] as const;

// Deterministic fallback so obvious senders get categorized even if the AI
// gateway returns blank/invalid output.
function ruleBasedCategory(input: { from: string; subject: string }): string | null {
  const hay = `${input.from} ${input.subject}`.toLowerCase();
  if (/(shein|creator center|campaign|reversible|ruelala|farfetch|cobone|newsletter|unsubscribe|promo|sale\b|deal|coupon)/.test(hay)) return "marketing";
  if (/(emiratesnbd|enbd|hsbc|adcb|fab\b|mashreq|payroll|invoice|tax\b|vat\b|payment|bank|statement|priorit\w*banking)/.test(hay)) return "finance";
  if (/(price offer|buyer waiting|luxury closet|offer for your|sell your|resale)/.test(hay)) return "sales_offer";
  if (/(registration|mou\b|trade license|docusign|envelope|developer|brochure|inventory|listing\b|broker)/.test(hay)) return "developer_documents";
  if (/(github|uptime|monitor|alert|deploy|build failed|run failed|supabase|hostinger|verification code|otp)/.test(hay)) return "real_estate_ops";
  if (/(spam|win a prize|unsubscribed|do not reply)/.test(hay)) return "spam";
  return null;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { threadId, force } = await req.json();
    if (!threadId) {
      return new Response(JSON.stringify({ error: "threadId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: thread, error: tErr } = await admin
      .from("owner_comm_threads")
      .select("*")
      .eq("id", threadId)
      .eq("user_id", userId)
      .maybeSingle();
    if (tErr || !thread) {
      return new Response(JSON.stringify({ error: "Thread not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!force && thread.ai_processed_at) {
      return new Response(JSON.stringify({ ok: true, cached: true, thread }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: messages } = await admin
      .from("owner_comm_messages")
      .select("direction, sender_name, content, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(20);

    const transcript = (messages ?? [])
      .map((m) => `[${m.direction === "inbound" ? "Them" : "Me"} • ${m.sender_name ?? ""}] ${m.content}`)
      .join("\n");

    const sysPrompt = `You triage business communications for a luxury Dubai real estate brokerage (JBJ Global Real Estate). Output strict JSON only with this shape:
{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "priority": "low" | "medium" | "high" | "urgent",
  "summary": "<= 140 chars, neutral tone",
  "suggested_reply": "concise professional reply in same language as thread, ready to send",
  "next_step": { "type": "task" | "meeting" | "note" | "none", "title": "...", "due_in_hours": number | null, "reasoning": "short why" }
}
Categorization rules:
- real_estate_lead: prospective buyer/investor enquiring about properties, viewings, or pricing.
- real_estate_ops: developer documents requests, listings, MOU, registration, brokerage operations, system alerts (GitHub/Supabase/uptime/verification codes).
- sales_offer: someone offering to buy something the user owns (resale, luxury closet price offers, "buyer waiting").
- marketing: newsletters, promos, campaigns, creator programs, sales notifications from retail brands (SHEIN, Cobone, Rue La La, Reversible, Farfetch, etc).
- finance: banking, payments, invoices, tax, VAT, payroll (Emirates NBD, ENBD, HSBC, ADCB, FAB, Mashreq, etc).
- developer_documents: developer registration, brochures, inventory, Docusign envelopes, contract signature requests.
- personal: personal correspondence from individuals known to the user.
- spam: clear spam.
- other: anything that doesn't fit.
No prose, no markdown, JSON only.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: `Thread with ${thread.contact_name ?? thread.contact_identifier} on ${thread.channel_type}:\n\n${transcript || "(no messages)"}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    let parsed: any = {};
    if (aiRes.ok) {
      const aiJson = await aiRes.json();
      const raw = aiJson.choices?.[0]?.message?.content ?? "{}";
      try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    } else {
      console.warn("[comm-ai-triage] gateway error", aiRes.status);
    }

    // Deterministic fallback for obvious senders, applied when AI returned
    // nothing useful or guessed "other"/"personal".
    const fallbackCat = ruleBasedCategory({
      from: `${thread.contact_name ?? ""} ${thread.contact_identifier ?? ""}`,
      subject: thread.last_message_preview ?? "",
    });
    let category = CATEGORIES.includes(parsed.category) ? parsed.category : "other";
    if ((category === "other" || category === "personal") && fallbackCat) category = fallbackCat;

    const priority = ["low", "medium", "high", "urgent"].includes(parsed.priority) ? parsed.priority : "medium";

    const update = {
      ai_category: category,
      ai_priority: priority,
      ai_summary: (parsed.summary ?? thread.last_message_preview ?? "").toString().slice(0, 280),
      ai_suggested_reply: (parsed.suggested_reply ?? "").toString().slice(0, 4000),
      ai_next_step: parsed.next_step ?? null,
      ai_processed_at: new Date().toISOString(),
    };

    await admin.from("owner_comm_threads").update(update).eq("id", threadId);


    return new Response(JSON.stringify({ ok: true, ...update }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
