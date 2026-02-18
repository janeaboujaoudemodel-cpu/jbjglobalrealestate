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
    const { pdfUrl, recipientId, recipientName } = await req.json();

    if (!pdfUrl) {
      return new Response(JSON.stringify({ error: "pdfUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date().toLocaleDateString("en-AE");

    const systemPrompt = `You are a document analysis AI specialized in identifying signature fields in legal contracts and real estate documents.
Your task is to analyze a document and identify where various form fields should be placed.
Return ONLY a JSON array of field objects. No markdown, no explanation.`;

    const userPrompt = `Analyze this document at URL: ${pdfUrl}

Identify all locations where the following field types should be placed:
- "signature": Signature lines (usually at the bottom of the document, often labeled "Signature:", "Signed by:", "_______")
- "initials": Initial boxes (short lines, usually labeled "Initials:", or small blank boxes in margins)
- "date": Date fields (labeled "Date:", "Dated:", near signature lines)
- "text": Text input areas (labeled "Name:", "Print Name:", "Title:", "Address:", "Company:", "Email:", "Phone:")

For each identified field, return a JSON object with these exact fields:
- "type": one of "signature", "initials", "date", "text"
- "x": horizontal position as percentage (0-100) of document width
- "y": vertical position as percentage (0-100) of document height
- "width": width in pixels (signature: 180, initials: 90, date: 140, text: 160)
- "height": height in pixels (signature: 52, initials: 40, date: 36, text: 36)
- "label": a short descriptive label for the field
- "suggestedValue": pre-filled value (for "text" with label "Name" use "${recipientName}", for "date" use "${today}", for "signature" and "initials" use "")
- "pageNumber": page number where the field appears (default to 1)

If you cannot analyze the PDF, return a standard real estate contract layout with these 5 fields placed at typical positions:
1. Name text field at top (x:10, y:8)
2. Title text field at top-right (x:55, y:8)
3. Date field near bottom-left (x:10, y:88)
4. Signature field at bottom-center (x:40, y:85)
5. Initials field at bottom-right (x:82, y:88)

Return ONLY the JSON array, example format:
[{"type":"text","x":10,"y":8,"width":160,"height":36,"label":"Full Name","suggestedValue":"${recipientName}","pageNumber":1}]`;

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
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON array from the AI response
    let fields: any[] = [];
    try {
      // Strip any markdown code fences if present
      const cleaned = rawContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        fields = parsed;
      }
    } catch (parseErr) {
      console.warn("Failed to parse AI response, using fallback layout:", parseErr);
      // Fallback standard layout
      fields = getStandardContractLayout(recipientName, today);
    }

    // Validate and sanitize fields
    const validTypes = ["signature", "initials", "date", "text"];
    const sanitized = fields
      .filter((f) => validTypes.includes(f.type))
      .map((f) => ({
        type: f.type,
        x: Math.max(0, Math.min(95, Number(f.x) || 10)),
        y: Math.max(0, Math.min(95, Number(f.y) || 50)),
        width: Number(f.width) || 160,
        height: Number(f.height) || 36,
        label: String(f.label || f.type),
        suggestedValue: String(f.suggestedValue || ""),
        pageNumber: Number(f.pageNumber) || 1,
      }));

    // If AI returned nothing useful, use fallback
    if (sanitized.length === 0) {
      return new Response(
        JSON.stringify({ fields: getStandardContractLayout(recipientName, today) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ fields: sanitized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("esign-auto-detect-fields error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getStandardContractLayout(recipientName: string, today: string) {
  return [
    { type: "text", x: 10, y: 8, width: 160, height: 36, label: "Full Name", suggestedValue: recipientName, pageNumber: 1 },
    { type: "text", x: 55, y: 8, width: 160, height: 36, label: "Title / Position", suggestedValue: "", pageNumber: 1 },
    { type: "text", x: 10, y: 15, width: 200, height: 36, label: "Company", suggestedValue: "", pageNumber: 1 },
    { type: "date", x: 10, y: 88, width: 140, height: 36, label: "Date", suggestedValue: today, pageNumber: 1 },
    { type: "signature", x: 38, y: 84, width: 180, height: 52, label: "Signature", suggestedValue: "", pageNumber: 1 },
    { type: "initials", x: 82, y: 88, width: 90, height: 40, label: "Initials", suggestedValue: "", pageNumber: 1 },
  ];
}
