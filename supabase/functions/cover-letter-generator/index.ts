import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { yourName, yourTitle, jobTitle, companyName, skills, experience, tone, additionalNotes } = await req.json();

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

    const systemPrompt = `You are an expert cover letter writer with 20+ years of experience in HR and recruitment. 
Write compelling, tailored cover letters that get interviews. 
Your letters are specific, achievement-focused, and never generic.
Always write in first person. Use active voice. Be concise yet impactful.
Return ONLY the cover letter body paragraphs — no "Dear Hiring Manager" salutation, no date, no address, no sign-off. Just the body paragraphs separated by blank lines.
Write exactly 4 paragraphs:
1. Opening: Why this specific role at this specific company excites you
2. Key qualifications: Your top 2-3 relevant skills/achievements with numbers where possible
3. Specific achievement or project that directly relates to the role
4. Closing: Enthusiasm + call to action`;

    const userPrompt = `Write a ${toneDesc} cover letter body for:
- Applicant: ${yourName || "The Applicant"}${yourTitle ? ` — ${yourTitle}` : ""}
- Target Role: ${jobTitle} at ${companyName}
- Key Skills: ${skills || "leadership, communication, strategic thinking"}
- Experience/Achievements: ${experience || "relevant industry experience with strong results"}
${additionalNotes ? `- Additional context: ${additionalNotes}` : ""}

Make it compelling, specific, and tailored to the ${jobTitle} role. Use the company name (${companyName}) at least once. Keep total length under 320 words.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        max_tokens: 600,
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
