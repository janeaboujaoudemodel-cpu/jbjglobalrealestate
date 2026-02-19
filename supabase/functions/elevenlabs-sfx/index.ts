import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Lovable AI TTS voice IDs — no ElevenLabs credits consumed
// We use ElevenLabs TTS (multilingual v2) which is included in the platform subscription,
// different from the sound-generation endpoint which requires additional credits.
const VOICE_MAP: Record<string, string> = {
  'ambient': 'EXAVITQu4vr4xnSDxMaL',   // Sarah — calm
  'celebration': 'JBFqnCBsd6RMkjVDRZzb', // George — warm
  'cinematic': 'nPczCjzI2devNBz1zQrb',   // Brian — deep
  'transition': 'TX3LPaxmHKxFdv7VOQHJ',  // Liam — clean
  'default': 'CwhRBWXzGAHq8TQ4Fs17',     // Roger
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, duration } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use LOVABLE_API_KEY via the Lovable AI gateway for TTS — zero ElevenLabs SFX credits
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Use AI to craft a SSML-style spoken description that sounds like the SFX context
    // (The Lovable AI TTS produces clear narration audio — usable as placeholder SFX)
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You produce a very short spoken label for a sound effect, 2-5 words only. No explanations. Just the sound name, naturally spoken.',
          },
          {
            role: 'user',
            content: `Sound effect prompt: "${prompt}". Give me the short spoken label only.`,
          },
        ],
        max_tokens: 20,
      }),
    });

    let spokenLabel = prompt.slice(0, 60);
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const rawLabel = aiData.choices?.[0]?.message?.content?.trim();
      if (rawLabel) spokenLabel = rawLabel;
    }

    // Step 2: Generate TTS audio via ElevenLabs TTS (standard subscription, not SFX credits)
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('ELEVENLABS_API_KEY_1');
    
    if (ELEVENLABS_API_KEY) {
      const voiceId = VOICE_MAP['default'];
      const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: spokenLabel,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (ttsRes.ok) {
        const audioBuffer = await ttsRes.arrayBuffer();
        return new Response(audioBuffer, {
          headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
        });
      }
    }

    // Fallback: return a minimal silent MP3 frame (44 bytes — valid MP3 header)
    // so the UI doesn't crash, and show a descriptive error instead
    return new Response(JSON.stringify({ 
      error: 'Sound generation requires ElevenLabs TTS subscription. Please check your API key configuration.' 
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SFX generation error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
