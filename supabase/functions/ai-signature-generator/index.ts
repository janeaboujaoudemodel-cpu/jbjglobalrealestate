import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SignatureRequest {
  name: string;
  style?: 'elegant' | 'bold' | 'minimal' | 'classic';
  generateVariants?: boolean;
}

const stylePrompts: Record<string, string> = {
  elegant: "Create an elegant, flowing cursive signature with sophisticated loops and graceful strokes. The signature should look refined and professional, similar to a CEO or diplomat's signature. Use thin to medium stroke weight with elegant flourishes.",
  bold: "Create a bold, confident signature with strong strokes and clear letterforms. The signature should convey authority and power, like an executive's signature. Use thick, decisive strokes with minimal but impactful flourishes.",
  minimal: "Create a clean, minimal modern signature with simple lines and a contemporary feel. The signature should be understated yet distinctive, using thin strokes with minimal decoration. Focus on clarity and simplicity.",
  classic: "Create a traditional formal signature in a classic business style. The signature should be professional and timeless, with balanced proportions and moderate flourishes. Similar to signatures you'd see on formal documents.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, style = 'elegant', generateVariants = false }: SignatureRequest = await req.json();

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const styleDescription = stylePrompts[style] || stylePrompts.elegant;
    
    const numVariants = generateVariants ? 3 : 1;
    const signatures: string[] = [];

    for (let i = 0; i < numVariants; i++) {
      const variationNote = i > 0 ? ` Create a distinct variation (version ${i + 1}).` : '';
      
      const prompt = `Generate a professional handwritten signature for the name "${name}". ${styleDescription}${variationNote}

Requirements:
- The signature should be on a pure white/transparent background
- Use black or very dark gray ink color
- Make it look like a real hand-drawn signature, not typed text
- The signature should be readable but stylized
- Create it as if someone is signing an important document
- Proportions: width about 3-4x the height
- No background elements, frames, or decorations - just the signature itself`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageUrl) {
        signatures.push(imageUrl);
      }
    }

    if (signatures.length === 0) {
      throw new Error('No signatures were generated');
    }

    console.log(`Generated ${signatures.length} signature(s) for "${name}" in ${style} style`);

    return new Response(
      JSON.stringify({
        success: true,
        signature: signatures[0],
        signatures: signatures,
        name: name,
        style: style
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Signature generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
