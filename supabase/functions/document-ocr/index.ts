import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { file_base64, file_type, action, find_text, replace_text, prompt } = await req.json();

    if (!file_base64) throw new Error("Missing file_base64");

    const mimeType = file_type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${file_base64}`;

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "extract") {
      systemPrompt = "You are a professional OCR and document extraction engine. Extract ALL text from the uploaded document/image exactly as written. Preserve paragraphs, headings, lists, and structure. Do NOT include any images or image descriptions. Return ONLY the extracted text with proper formatting (use markdown for structure). If text is in multiple languages, preserve all languages.";
      userPrompt = "Extract all text from this document. Preserve formatting and structure. Return only the text content, no descriptions of images or layouts.";
    } else if (action === "find_replace") {
      systemPrompt = "You are a document editing assistant. Extract all text from the document, then perform the requested find-and-replace operation. Return the modified text with proper formatting preserved.";
      userPrompt = `Extract all text from this document. Then replace every occurrence of "${find_text}" with "${replace_text}". Return ONLY the modified text with formatting preserved (use markdown for structure).`;
    } else if (action === "prompt_edit") {
      systemPrompt = "You are an AI document editor. Extract the text from the document, apply the user's editing instructions, and return the modified document text. Preserve formatting and structure.";
      userPrompt = `Extract all text from this document and apply this instruction: ${prompt}\n\nReturn ONLY the modified document text with formatting preserved (use markdown for structure).`;
    } else {
      throw new Error("Invalid action. Use 'extract', 'find_replace', or 'prompt_edit'");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI extraction failed");
    }

    const aiData = await response.json();
    const text = aiData.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ text, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("document-ocr error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "OCR failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
