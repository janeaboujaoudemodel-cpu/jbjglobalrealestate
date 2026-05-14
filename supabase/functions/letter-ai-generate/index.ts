// supabase/functions/letter-ai-generate/index.ts
//
// Lovable AI Gateway — generates a JBJ business / HR / legal letter from a
// free-form owner prompt. Returns:
//   {
//     subject:     string,
//     recipient:   string,
//     body_text:   string   // plain text, paragraph breaks preserved
//     signer_title?: string // suggested title (defaults to Founder & CEO)
//     date?:       string   // ISO date if AI inferred one
//   }
//
// The frontend renders body_text inside the JBJ letterhead template body
// inside a normal multiline text area so the user can keep editing it as
// regular typed text (not as code).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `You are the senior in-house counsel and executive correspondence drafter for JBJ GLOBAL REAL ESTATE LLC SOC, a Dubai-based real estate brokerage. You draft on behalf of the Founder & CEO.

Voice & quality:
- Premium, contract-grade, UAE business standard. Concise but never abrupt.
- Open with a salutation ("Dear <name>,") on its own paragraph.
- Body: 2 to 5 short paragraphs separated by a blank line. Each paragraph is one idea.
- Close with "Yours sincerely," (formal) or "Best regards," (semi-formal) on its own paragraph.
- Do NOT type the signer name, title, company name, address, phone, email or website — the letterhead chrome already shows them.
- Never invent prices, dates, AED amounts, RERA numbers, or legal clauses that the user did not supply. If the user left a placeholder like [Name] or [amount], keep it as a bracketed placeholder.
- Never mention Lovable, AI, GPT, OpenAI, or any model.

OUTPUT FORMAT — STRICT JSON ONLY (no markdown, no fences):
{
  "subject":     "<short headline, <=80 chars, no trailing period>",
  "recipient":   "<addressee line e.g. 'Mr. John Doe' or 'To Whom It May Concern'>",
  "body_text":   "<plain text with \\n\\n between paragraphs — NO HTML tags>",
  "signer_title":"<usually 'Founder & CEO'>",
  "date":        "<optional ISO yyyy-mm-dd if the prompt implied one>"
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userPrompt: string = String(body?.prompt || "").trim();
    const tone: string = String(body?.tone || "formal");
    const recipientHint: string = String(body?.recipient || "").trim();
    const language: string = String(body?.language || "English");

    if (!userPrompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessage = [
      `Tone: ${tone}.`,
      `Language: ${language}.`,
      recipientHint ? `Recipient hint: ${recipientHint}.` : "",
      `Owner request:`,
      userPrompt,
    ].filter(Boolean).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        // Stronger reasoning model for contract-grade prose
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.35,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit — try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted — please top up." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text().catch(() => "");
      return new Response(JSON.stringify({ error: `AI gateway ${response.status}: ${t.slice(0, 200)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); }
    catch {
      const m = /\{[\s\S]*\}/.exec(content);
      if (m) try { parsed = JSON.parse(m[0]); } catch { /* ignore */ }
    }

    // Normalise: prefer body_text. If the model returned legacy body_html,
    // strip tags down to clean plain text so the editor stays normal text.
    const subject = String(parsed?.subject || "").slice(0, 200).trim();
    const recipient = String(parsed?.recipient || recipientHint || "To Whom It May Concern").slice(0, 200).trim();
    let body_text = String(parsed?.body_text || "").trim();
    if (!body_text && parsed?.body_html) {
      body_text = String(parsed.body_html)
        .replace(/<\s*br\s*\/?\s*>/gi, "\n")
        .replace(/<\/\s*p\s*>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }
    // Strip stray markdown / fences
    body_text = body_text
      .replace(/^```(?:text|md|html)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const signer_title = String(parsed?.signer_title || "Founder & CEO").slice(0, 80);
    const date = typeof parsed?.date === "string" ? parsed.date.slice(0, 32) : "";

    return new Response(
      JSON.stringify({ subject, recipient, body_text, signer_title, date }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
