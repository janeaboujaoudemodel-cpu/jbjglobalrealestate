import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { yourName, yourTitle, jobTitle, companyName, skills, experience, tone, additionalNotes, documentType, recipientName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const toneMap: Record<string, string> = {
      professional: "formal, professional, and polished",
      confident:    "confident, assertive, and direct",
      casual:       "warm, personable, and approachable",
      enthusiastic: "enthusiastic, energetic, and passionate",
      executive:    "authoritative, strategic, and leadership-focused",
    };
    const toneDesc = toneMap[tone] || "professional and polished";

    const docTypeMap: Record<string, string> = {
      "cover-letter": "a cover letter for a job application",
      "offer-letter": "a formal job offer letter from an employer to a candidate",
      "company-letter": "a professional company letter for official communication",
      "contract": "a business contract or agreement document",
      "nda": "a non-disclosure agreement (NDA)",
      "hr-letter": "a human resources letter (e.g., promotion, transfer, warning)",
      "termination": "a professional termination or end-of-service letter",
      "recommendation": "a recommendation or reference letter",
    };
    const docDesc = docTypeMap[documentType || "cover-letter"] || "a professional business document";

    const systemPrompt = `You are an expert document writer with 20+ years of experience in corporate communications, HR, and legal drafting.
Write compelling, tailored professional documents that are specific, achievement-focused, and never generic.
Always write in first person where appropriate. Use active voice. Be concise yet impactful.
Return ONLY the document body paragraphs — no salutation, no date, no address, no sign-off. Just the body paragraphs separated by blank lines.
Write 3-5 well-structured paragraphs appropriate for the document type.
For contracts and NDAs, use numbered clauses and formal legal language.
For HR letters, maintain a balance between professionalism and empathy.`;

    const recipientLine = recipientName ? `- Recipient: ${recipientName}` : "";

    const userPrompt = `Write ${docDesc} with a ${toneDesc} tone:
- Author: ${yourName || "The Author"}${yourTitle ? ` — ${yourTitle}` : ""}
${recipientLine}
- Subject/Role: ${jobTitle || "General correspondence"}
- Company: ${companyName || "The Company"}
- Key Points: ${skills || "relevant professional qualifications"}
- Context: ${experience || "relevant professional experience"}
${additionalNotes ? `- Additional context: ${additionalNotes}` : ""}

Make it compelling, specific, and tailored. ${companyName ? `Use the company name (${companyName}) at least once.` : ""} Keep total length under 400 words.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage credits required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error: " + response.status);
    }

    const result = await response.json();
    const letter = result.choices?.[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ letter }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("cover-letter-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
