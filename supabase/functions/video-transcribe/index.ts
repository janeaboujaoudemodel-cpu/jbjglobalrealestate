import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Full ISO 639-3 mapping for all 28 supported languages
const LANG_TO_ISO639_3: Record<string, string> = {
  en: "eng", ar: "ara", hi: "hin", ur: "urd", zh: "zho",
  es: "spa", fr: "fra", de: "deu", ru: "rus", pt: "por",
  ja: "jpn", ko: "kor", it: "ita", nl: "nld", tr: "tur",
  fa: "fas", he: "heb", pl: "pol", th: "tha", vi: "vie",
  id: "ind", ms: "msa", tl: "tgl", bn: "ben", ta: "tam",
  te: "tel", ml: "mal", sw: "swa",
};

interface WordTimestamp {
  text: string;
  start: number;
  end: number;
}

interface SubtitleSegment {
  startTime: number;
  endTime: number;
  text: string;
}

// Group ElevenLabs word timestamps into subtitle-sized segments
function groupWordsIntoSegments(words: WordTimestamp[]): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  const MAX_WORDS = 12;
  const MAX_DURATION = 7;

  let i = 0;
  while (i < words.length) {
    const segStart = words[i].start;
    const segWords: string[] = [];
    let segEnd = words[i].end;

    while (i < words.length && segWords.length < MAX_WORDS && (words[i].end - segStart) < MAX_DURATION) {
      // Skip non-speech markers
      const wordText = words[i].text.trim();
      if (wordText && !wordText.match(/^\[.*\]$/)) {
        segWords.push(wordText);
      }
      segEnd = words[i].end;
      i++;
    }

    if (segWords.length > 0) {
      segments.push({
        startTime: segStart,
        endTime: segEnd,
        text: segWords.join(" "),
      });
    }
  }

  return segments;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const { audio, mimeType = "audio/webm", language = "en" } = await req.json();

    if (!audio) {
      return new Response(JSON.stringify({ error: "No audio data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langCode = LANG_TO_ISO639_3[language] || "eng";

    // Decode base64 to binary
    const audioBytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
    const audioBlob = new Blob([audioBytes], { type: mimeType });

    // ─── Try ElevenLabs Scribe (real word timestamps) ───
    if (ELEVENLABS_API_KEY) {
      try {
        console.log(`Transcribing with ElevenLabs Scribe, lang=${langCode}, size=${audioBytes.length}`);

        const formData = new FormData();
        formData.append("file", audioBlob, `audio.${mimeType.split("/")[1] || "webm"}`);
        formData.append("model_id", "scribe_v2");
        formData.append("language_code", langCode);
        formData.append("tag_audio_events", "true");
        formData.append("timestamps_granularity", "word");

        const elevenResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": ELEVENLABS_API_KEY },
          body: formData,
        });

        if (elevenResponse.ok) {
          const result = await elevenResponse.json();
          const words: WordTimestamp[] = (result.words || []).map((w: any) => ({
            text: w.text || "",
            start: w.start ?? 0,
            end: w.end ?? 0,
          }));

          if (words.length > 0) {
            const segments = groupWordsIntoSegments(words);
            const fullText = result.text?.trim() || segments.map((s) => s.text).join(" ");

            console.log(`ElevenLabs Scribe success: ${segments.length} segments from ${words.length} words`);

            return new Response(
              JSON.stringify({ segments, fullText, provider: "elevenlabs", wordCount: words.length }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          const errText = await elevenResponse.text();
          console.error("ElevenLabs Scribe error:", elevenResponse.status, errText);
        }
      } catch (elevenError) {
        console.error("ElevenLabs Scribe exception:", elevenError);
      }
    }

    // ─── Gemini fallback with structured JSON output ───
    if (!LOVABLE_API_KEY) {
      throw new Error("No transcription service available — ELEVENLABS_API_KEY or LOVABLE_API_KEY required");
    }

    console.log("Falling back to Gemini multimodal transcription");

    const audioDataUrl = `data:${mimeType};base64,${audio}`;
    const langName = language === "ar" ? "Arabic" : language === "en" ? "English" : language;

    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcribe this audio in ${langName}. Return a JSON array of subtitle segments. Each segment must have startTime (number in seconds), endTime (number in seconds), and text (string). Estimate realistic timecodes based on speech rate (avg 2.5 words/second). Group 8-12 words per segment. If no speech is detected, return an empty array. Respond ONLY with valid JSON, no markdown, no explanation. Format: [{"startTime":0.0,"endTime":3.5,"text":"..."},...]`,
              },
              {
                type: "image_url",
                image_url: { url: audioDataUrl },
              },
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const rawContent = geminiData.choices?.[0]?.message?.content?.trim() || "[]";

    // Parse JSON from Gemini
    let segments: SubtitleSegment[] = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : rawContent;
      const parsed = JSON.parse(jsonStr);
      segments = parsed.map((s: any) => ({
        startTime: Number(s.startTime) || 0,
        endTime: Number(s.endTime) || 0,
        text: String(s.text || "").trim(),
      })).filter((s: SubtitleSegment) => s.text.length > 0);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON:", parseErr);
      // Last resort: flat text split into segments
      const words = rawContent.replace(/[\[\]{}]/g, "").split(/\s+/).filter(Boolean);
      const wordsPerSeg = 10;
      const secPerWord = 0.4;
      for (let i = 0; i < words.length; i += wordsPerSeg) {
        const segWords = words.slice(i, i + wordsPerSeg);
        segments.push({
          startTime: i * secPerWord,
          endTime: (i + segWords.length) * secPerWord,
          text: segWords.join(" "),
        });
      }
    }

    const fullText = segments.map((s) => s.text).join(" ");
    console.log(`Gemini fallback: ${segments.length} segments`);

    return new Response(
      JSON.stringify({ segments, fullText, provider: "gemini" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("video-transcribe error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Transcription failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
