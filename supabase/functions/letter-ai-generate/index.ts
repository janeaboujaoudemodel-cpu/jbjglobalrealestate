// supabase/functions/letter-ai-generate/index.ts
//
// Lovable AI Gateway (google/gemini-3-flash-preview) — generates a JBJ
// business letter from a free-form user prompt. Returns structured JSON:
//   { subject: string, recipient: string, body_html: string }
// body_html is a clean fragment of <p>/<ul>/<li>/<strong> tags, no scripts,
// no markdown fences. The frontend renders it inside the BlankLetter
// template body and lets the user edit further.

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE" };

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `You are an executive correspondence assistant for JBJ GLOBAL REAL ESTATE LLC SOC, a Dubai-based real estate brokerage and business services group.

Write professional, concise, UAE-business-letter-style correspondence on behalf of the company.

Output rules (STRICT):
- Return ONLY a JSON object: { "subject": string, "recipient": string, "body_html": string }
- "subject" is a short headline (max 80 chars), no trailing period
- "recipient" is the addressee line (e.g. "Mr. John Doe" or "To Whom It May Concern"). If the user did not specify, use "To Whom It May Concern".
- "body_html" is a clean HTML fragment using ONLY these tags: <p>, <ul>, <ol>, <li>, <strong>, <em>, <br>. NO <script>, NO inline styles, NO markdown fences, NO links to external sites.
- Open with a salutation paragraph, then 2–4 body paragraphs, then a closing paragraph ("Yours sincerely," / "Best regards,") on its own <p>. Do NOT include the signer name or title (the template adds those automatically).
- Use formal English. Never invent prices, dates, or legal terms not supplied in the user prompt.
- Never reference Lovable, AI, ChatGPT, OpenAI, or any model provider.
- Never include the company address, phone, or website (the template chrome already shows them).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userPrompt: string = String(body?.prompt || "").trim();
    const tone: string = String(body?.tone || "formal");
    const recipientHint: string = String(body?.recipient || "").trim();
    const language: string = String(body?.language || "English");

    if (!userPrompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessage = [
      `Tone: ${tone}.`,
      `Language: ${language}.`,
      recipientHint ? `Recipient: ${recipientHint}.` : "",
      `User request: ${userPrompt}`,
    ].filter(Boolean).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded — try again in a moment." }), {
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
      return new Response(JSON.stringify({ error: `AI gateway error ${response.status}: ${t.slice(0, 200)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); }
    catch {
      // Best-effort: extract a JSON block from the model output
      const m = /\{[\s\S]*\}/.exec(content);
      if (m) try { parsed = JSON.parse(m[0]); } catch { /* ignore */ }
    }

    const subject = String(parsed?.subject || "").slice(0, 200);
    const recipient = String(parsed?.recipient || recipientHint || "To Whom It May Concern").slice(0, 200);
    let body_html = String(parsed?.body_html || "").trim();

    // Strip stray markdown fences just in case
    body_html = body_html.replace(/^```html\s*/i, "").replace(/```$/, "").trim();

    return new Response(JSON.stringify({ subject, recipient, body_html }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
