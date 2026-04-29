import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANG_LABEL: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  fr: "French",
  es: "Spanish",
};

interface Body {
  lead?: {
    full_name?: string;
    lead_type?: string;
    preferred_language?: string;
    preferred_project?: string;
    preferred_location?: string;
    pipeline_stage?: string;
    notes?: string;
    nationality?: string;
    budget_min?: number | null;
    budget_max?: number | null;
    budget_currency?: string;
  };
  message_type?: string;
  channel?: "WhatsApp" | "Email" | "SMS" | string;
  language?: string;
  tone?: string;
  custom_instruction?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const body = (await req.json()) as Body;
    const lead = body.lead || {};
    const messageType = body.message_type || "First Contact";
    const channel = body.channel || "WhatsApp";
    const lang = (body.language || lead.preferred_language || "en").toLowerCase();
    const langLabel = LANG_LABEL[lang] || body.language || "English";
    const tone = body.tone || "Professional";

    const channelGuidance: Record<string, string> = {
      WhatsApp: "Keep under 80 words. Friendly opener, clear single ask, no markdown, no signature block.",
      Email: "Use a short subject line on the first line prefixed with 'Subject:'. Then a two-paragraph body with greeting, value statement, and a clear call-to-action. Sign off with [Your Name].",
      SMS: "Strictly under 320 characters. One sentence, one CTA, no greeting fluff.",
    };

    const budgetLine =
      lead.budget_min || lead.budget_max
        ? `Budget: ${lead.budget_currency || "AED"} ${lead.budget_min ?? "?"} – ${lead.budget_max ?? "?"}.`
        : "";

    const systemPrompt = `You are an elite real-estate relationship writer for JBJ GLOBAL REAL ESTATE in Dubai.
Write a single ready-to-send ${channel} message in ${langLabel}.
Tone: ${tone}. Message type: ${messageType}.
${channelGuidance[channel] || channelGuidance.WhatsApp}
Never invent prices, never promise returns, never claim legal/tax advice.
Address the lead by first name only. Output ONLY the message text — no explanations, no quotes, no preamble.`;

    const userPrompt = [
      `Lead name: ${lead.full_name || "(unknown)"}`,
      `Lead type: ${lead.lead_type || "Buyer"}`,
      lead.nationality ? `Nationality: ${lead.nationality}` : "",
      lead.preferred_project ? `Interested in project: ${lead.preferred_project}` : "",
      lead.preferred_location ? `Preferred location: ${lead.preferred_location}` : "",
      budgetLine,
      lead.pipeline_stage ? `Current pipeline stage: ${lead.pipeline_stage}` : "",
      lead.notes ? `Recent notes: ${lead.notes.slice(0, 400)}` : "",
      body.custom_instruction ? `Extra instruction: ${body.custom_instruction}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit reached, please retry shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const message: string = data?.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lead-message error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
