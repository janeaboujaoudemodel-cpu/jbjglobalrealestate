import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projects } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!projects || projects.length < 2) {
      throw new Error("At least 2 projects required for comparison");
    }

    const projectDetails = projects.map((p: any, i: number) => `
Property ${i + 1}: ${p.name}
- Developer: ${p.developer}
- Location: ${p.location}, ${p.emirate}
- Price: AED ${((p.priceFrom || 0) / 1000000).toFixed(1)}M - ${p.priceTo ? `AED ${(p.priceTo / 1000000).toFixed(1)}M` : "TBD"}
- Bedrooms: ${p.bedrooms}
- Size: ${p.sizeRange}
- Handover: ${p.handover || "Ready"}
- Payment Plan: ${p.paymentPlan || "Standard"}
- Views: ${p.views?.join(", ") || "N/A"}
- Key Amenities: ${p.amenities?.slice(0, 5).join(", ") || "N/A"}
`).join("\n");

    const systemPrompt = `You are a luxury real estate investment advisor specializing in UAE properties. You provide concise, professional comparisons to help investors make informed decisions.

Your analysis should:
- Be objective and balanced
- Highlight investment potential and ROI considerations
- Note lifestyle factors for end-users
- Be formatted with clear sections
- Be approximately 300-400 words
- Use professional but accessible language`;

    const userPrompt = `Compare these ${projects.length} UAE properties and provide an investment-focused analysis:

${projectDetails}

Please provide:
1. **Quick Summary** - 1-2 sentences on the best choice for different buyer types
2. **Investment Potential** - Which offers better ROI, rental yield potential, capital appreciation
3. **Lifestyle & Location** - Which suits different lifestyle preferences
4. **Value Analysis** - Price per sqft comparison, what you get for the price
5. **Recommendation** - Clear guidance based on buyer priorities

Be specific with numbers where possible. Format with markdown for readability.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
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
      
      throw new Error("AI Gateway error");
    }

    const data = await response.json();
    const comparison = data.choices?.[0]?.message?.content;

    if (!comparison) {
      throw new Error("No comparison generated");
    }

    return new Response(JSON.stringify({ comparison }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("compare-projects error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
