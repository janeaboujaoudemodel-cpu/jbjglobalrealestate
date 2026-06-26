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
    // Require authenticated user — prevents anonymous AI credit abuse
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(
        authHeader.replace("Bearer ", ""),
      );
      if (claimsErr || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const body = await req.json().catch(() => ({}));
    const userPrompt: string = String(body?.prompt || body?.source || "").trim();
    const mode: string = String(body?.mode || "letter").trim();
    const tone: string = String(body?.tone || "formal");
    const recipientHint: string = String(body?.recipient || "").trim();
    const language: string = String(body?.language || "English");

    if (mode === "extract-fields") {
      const fieldKeys = Array.isArray(body?.fieldKeys) ? body.fieldKeys.map((x: unknown) => String(x)).filter(Boolean) : [];
      const attachment = body?.attachment;
      if (!userPrompt && !attachment?.dataUrl) {
        return new Response(JSON.stringify({ error: "source or attachment is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const extractionText = `Return strict JSON only: {"fields":{}}.
Extract and map values into these exact document field keys where possible: ${fieldKeys.join(", ")}.
If the attachment is an Emirates ID, passport, visa, CV, letter, contract, or scan, OCR it first.
Prefer legal full name, Emirates ID number, passport number, nationality, date of birth, expiry dates, email, mobile, address, job title, salary, developer/company details, unit number, property details, dates, and monetary amounts.
Do not invent missing values. Keep unknown fields omitted.
Source/template: ${body?.templateId || "unknown"}.
User/source text: ${userPrompt || "Attached file only"}`;

      const userContent = attachment?.dataUrl && String(attachment?.type || "").startsWith("image/")
        ? [
            { type: "text", text: extractionText },
            { type: "image_url", image_url: { url: attachment.dataUrl } },
          ]
        : extractionText + (attachment?.name ? `\nAttachment filename: ${attachment.name}` : "");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: "openai/gpt-5.5",
          messages: [
            { role: "system", content: "You are a secure OCR and legal document field extraction engine for UAE real estate and HR documents. Return JSON only." },
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!response.ok) {
        const t = await response.text().catch(() => "");
        return new Response(JSON.stringify({ error: `AI gateway ${response.status}: ${t.slice(0, 200)}` }), {
          status: response.status === 429 || response.status === 402 ? response.status : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content || "{}";
      let parsed: any = {};
      try { parsed = JSON.parse(content); } catch { const m = /\{[\s\S]*\}/.exec(content); if (m) try { parsed = JSON.parse(m[0]); } catch {} }
      return new Response(JSON.stringify({ fields: parsed?.fields && typeof parsed.fields === "object" ? parsed.fields : {} }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!userPrompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "generate-page") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-5.5",
          messages: [
            {
              role: "system",
              content: `Create one premium A4 document page section for JBJ GLOBAL REAL ESTATE. Return strict JSON only: {"body_html":"..."}. body_html must be safe inline HTML only, no scripts, no full html/body tags, no letterhead/footer/signature/stamp. Use Inter, ink #1A1A1A, champagne #F7F2EA/#FDFBF7, gold #B89555 only as 1px borders/dividers. Make it spacious, corporate, readable, and suitable for insertion into an existing contract page.`,
            },
            { role: "user", content: `Language: ${language}. Tone: ${tone}. Page request:\n${userPrompt}` },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!response.ok) {
        const t = await response.text().catch(() => "");
        return new Response(JSON.stringify({ error: `AI gateway ${response.status}: ${t.slice(0, 200)}` }), {
          status: response.status === 429 || response.status === 402 ? response.status : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content || "{}";
      let parsed: any = {};
      try { parsed = JSON.parse(content); } catch { parsed = {}; }
      return new Response(JSON.stringify({ body_html: String(parsed?.body_html || "").trim() }), {
        status: 200,
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
        // State-of-the-art reasoning + instruction following for legal/structured text
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
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
