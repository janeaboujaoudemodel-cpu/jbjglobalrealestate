import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_url, document_text, document_name, language, existing_analysis } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const targetLang = language || "en";

    let systemPrompt: string;
    let userPrompt: string;

    if (existing_analysis && targetLang !== "en") {
      // Translation mode: translate existing analysis
      systemPrompt = `You are a legal document translator. Translate the following contract analysis JSON into ${targetLang}. Maintain the exact same JSON structure. Translate all string values but keep JSON keys in English. Return ONLY valid JSON.`;
      userPrompt = `Translate this contract analysis to ${targetLang}:\n\n${JSON.stringify(existing_analysis)}`;
    } else {
      // Analysis mode
      systemPrompt = `You are an expert real estate contract lawyer specializing in UAE/Dubai real estate law and international property transactions. Analyze contracts with the expertise of a senior legal counsel.

Your analysis must be thorough, practical, and actionable. Focus on:
1. Identifying risks and unfavorable clauses
2. Missing standard protections
3. Financial obligations and penalties
4. Termination conditions
5. Dispute resolution mechanisms
6. Compliance with UAE real estate regulations (RERA, DLD)

${targetLang !== "en" ? `Provide all text output in ${targetLang} language.` : ""}

Return your analysis as a JSON object with this exact structure:
{
  "summary": "Brief overall assessment of the contract",
  "overall_risk": "high" | "medium" | "low",
  "risks": [
    {
      "severity": "high" | "medium" | "low",
      "clause": "Name/reference of the problematic clause",
      "explanation": "What the issue is",
      "recommendation": "What to do about it"
    }
  ],
  "key_terms": ["List of important terms found in the contract"],
  "missing_clauses": ["List of standard clauses that are missing"],
  "recommendations": ["Actionable recommendations for the signer"]
}

Return ONLY valid JSON, no markdown fences.`;

      const contentSource = document_text 
        ? `Document content:\n\n${document_text.substring(0, 60000)}`
        : document_url 
          ? `Document URL: ${document_url}\nDocument name: ${document_name || "Unknown"}\n\nAnalyze this real estate document. If you cannot access the URL, provide analysis based on common real estate contract risks in the UAE market.`
          : "No document provided. Provide a general UAE real estate contract risk checklist.";

      userPrompt = `Analyze the following contract:\n\n${contentSource}`;
    }

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
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let analysis: any;
    try {
      const cleaned = rawContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();
      analysis = JSON.parse(cleaned);
    } catch {
      console.warn("Failed to parse AI response, using fallback");
      analysis = {
        summary: rawContent.substring(0, 500),
        overall_risk: "medium",
        risks: [],
        key_terms: [],
        missing_clauses: [],
        recommendations: ["Review the contract with a qualified legal professional before signing."],
      };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("esign-contract-analyzer error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
