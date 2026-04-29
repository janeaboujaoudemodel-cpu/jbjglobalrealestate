// Translate a batch of strings into a target language using Lovable AI.
// Caches every (source_hash, target_lang) pair in public.translations_cache so
// each unique string is only ever translated once globally.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const LANG_NAMES: Record<string, string> = {
  ar: "Arabic", es: "Spanish", fr: "French", ru: "Russian",
  zh: "Simplified Chinese", hi: "Hindi", fa: "Persian (Farsi)",
  tr: "Turkish", de: "German", it: "Italian", nl: "Dutch",
  he: "Hebrew", pl: "Polish", ja: "Japanese",
};

// Locked Latin strings — never translated, even if AI suggests otherwise.
const LATIN_LOCKED = new Set<string>([
  "JBJ", "JBJ GLOBAL REAL ESTATE", "JBJ Global Real Estate",
]);

// Curated proper-noun overrides keyed by source -> { lang -> translated }.
// Mirrors src/translations/proper-nouns.ts and authoritatively writes to cache,
// so the AI can never overwrite a canonical brand/personal-name transliteration.
const PROPER_NOUN_OVERRIDES: Record<string, Record<string, string>> = {
  "Jane Bou Jaoude": {
    ar: "جاين بو جودة", fa: "جاین بو ژودِه", he: "ג'יין בו ז'אודה",
    ru: "Джейн Бу Жауд", zh: "簡·博·喬德", ja: "ジェーン・ブー・ジャウデ",
    hi: "जेन बू जौदे",
  },
  "Founder & CEO": {
    ar: "المؤسِّسة والرئيسة التنفيذية",
    fr: "Fondatrice et Présidente-Directrice Générale",
    es: "Fundadora y Directora Ejecutiva", de: "Gründerin & CEO",
    it: "Fondatrice e Amministratrice Delegata", nl: "Oprichtster & CEO",
    pl: "Założycielka i Dyrektor Generalny",
    ru: "Основательница и Генеральный директор", tr: "Kurucu ve CEO",
    fa: "بنیان‌گذار و مدیرعامل", he: "מייסדת ומנכ״לית",
    zh: "創辦人兼執行長", ja: "創業者兼CEO", hi: "संस्थापक और सीईओ",
  },
  "Dubai": { ar: "دبي", fa: "دبی", he: "דובאי", ru: "Дубай", zh: "迪拜", ja: "ドバイ", hi: "दुबई" },
  "Abu Dhabi": { ar: "أبوظبي", fa: "ابوظبی", he: "אבו דאבי", ru: "Абу-Даби", zh: "阿布扎比", ja: "アブダビ", hi: "अबू धाबी" },
  "United Arab Emirates": {
    ar: "الإمارات العربية المتحدة", fa: "امارات متحده عربی",
    he: "איחוד האמירויות הערביות", ru: "Объединённые Арабские Эмираты",
    zh: "阿拉伯聯合大公國", ja: "アラブ首長国連邦", hi: "संयुक्त अरब अमीरात",
  },
};

function getOverride(text: string, lang: string): string | null {
  const t = text.trim();
  if (LATIN_LOCKED.has(t)) return t;
  return PROPER_NOUN_OVERRIDES[t]?.[lang] ?? null;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildSystemPrompt(targetLang: string, domain: string): string {
  const langName = LANG_NAMES[targetLang] ?? targetLang;
  return [
    `You are a senior localization editor for a Hermès-grade luxury real-estate maison called JBJ Global Real Estate.`,
    `Translate the supplied English strings into ${langName}.`,
    `Hard rules:`,
    `- Output a JSON array of strings, EXACTLY the same length and order as the input array. No commentary.`,
    `- Preserve the brand wordmark "JBJ GLOBAL REAL ESTATE" in Latin letters. Translate the surrounding tagline.`,
    `- Personal names: transliterate into the target script (e.g. Jane Bou Jaoude → جاين بو جودة in Arabic, ジェーン・ブー・ジャウデ in Japanese).`,
    `- Keep numbers, prices, currencies (AED, USD, EUR), email addresses, phone numbers, URLs, ISO dates, and HTML tags exactly as-is.`,
    `- Match the register of a discreet, refined luxury house — never aggressive marketing voice. No exclamation marks unless present in source.`,
    `- For RTL languages (Arabic, Persian, Hebrew) use natural right-to-left phrasing; do not insert direction markers.`,
    `- Domain context for these strings: "${domain}". Use vocabulary appropriate to that context.`,
    `- If a string is a single proper noun already common in the target language (e.g. "Dubai" → "دبي"), use the established native form.`,
    `- Never add quotation marks, prefixes, or explanations around any output string.`,
  ].join("\n");
}

async function translateWithAI(
  strings: string[],
  targetLang: string,
  domain: string,
): Promise<string[]> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: buildSystemPrompt(targetLang, domain) },
        { role: "user", content: JSON.stringify(strings) },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_translations",
            description: "Return ordered array of translated strings.",
            parameters: {
              type: "object",
              properties: {
                translations: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["translations"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_translations" } },
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (resp.status === 402) {
      throw new Error("PAYMENT_REQUIRED");
    }
    const t = await resp.text();
    console.error("AI gateway error", resp.status, t);
    throw new Error("AI_GATEWAY_ERROR");
  }

  const data = await resp.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("AI_NO_TOOLCALL");
  const args = JSON.parse(call.function.arguments);
  const translations: string[] = args.translations ?? [];
  if (translations.length !== strings.length) {
    console.warn("Length mismatch, padding with originals");
    while (translations.length < strings.length) translations.push(strings[translations.length]);
  }
  return translations;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const rawStrings: unknown = body?.strings;
    const targetLang: string = String(body?.targetLang ?? "");
    const domain: string = String(body?.domain ?? "ui");

    if (!Array.isArray(rawStrings) || !targetLang) {
      return new Response(JSON.stringify({ error: "strings[] and targetLang required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (targetLang === "en") {
      return new Response(JSON.stringify({ translations: rawStrings }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize, dedupe
    const inputs: string[] = rawStrings
      .map((s) => (typeof s === "string" ? s : ""))
      .map((s) => s);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // Hash each, find unique non-empty
    const hashes = await Promise.all(inputs.map((s) => sha256Hex(s)));
    const uniqueMap = new Map<string, { text: string; hash: string }>();
    for (let i = 0; i < inputs.length; i++) {
      const text = inputs[i];
      if (!text || !text.trim()) continue;
      uniqueMap.set(hashes[i], { text, hash: hashes[i] });
    }
    const uniqueHashes = Array.from(uniqueMap.keys());

    // Lookup cache
    const cacheLookup = new Map<string, string>();
    if (uniqueHashes.length > 0) {
      const { data: cached, error } = await supabase
        .from("translations_cache")
        .select("source_hash, translated_text")
        .eq("target_lang", targetLang)
        .in("source_hash", uniqueHashes);
      if (error) console.error("cache lookup error", error);
      for (const row of cached ?? []) {
        cacheLookup.set(row.source_hash, row.translated_text);
      }
    }

    // Strings still needing translation (after cache + override pass)
    const missing: { text: string; hash: string }[] = [];
    const overrideRows: Array<{ source_hash: string; source_text: string; target_lang: string; translated_text: string; domain: string }> = [];
    for (const [hash, entry] of uniqueMap) {
      if (cacheLookup.has(hash)) continue;
      const ov = getOverride(entry.text, targetLang);
      if (ov !== null) {
        cacheLookup.set(hash, ov);
        overrideRows.push({
          source_hash: hash,
          source_text: entry.text,
          target_lang: targetLang,
          translated_text: ov,
          domain,
        });
      } else {
        missing.push(entry);
      }
    }

    // Persist override rows so all clients see the canonical value.
    if (overrideRows.length > 0) {
      const { error: ovErr } = await supabase
        .from("translations_cache")
        .upsert(overrideRows, { onConflict: "source_hash,target_lang" });
      if (ovErr) console.error("override upsert error", ovErr);
    }

    if (missing.length > 0) {
      // Chunk into batches of 50
      const chunkSize = 50;
      for (let i = 0; i < missing.length; i += chunkSize) {
        const chunk = missing.slice(i, i + chunkSize);
        const translated = await translateWithAI(
          chunk.map((c) => c.text),
          targetLang,
          domain,
        );
        const rows = chunk.map((c, idx) => ({
          source_hash: c.hash,
          source_text: c.text,
          target_lang: targetLang,
          translated_text: translated[idx] ?? c.text,
          domain,
        }));
        const { error: upsertErr } = await supabase
          .from("translations_cache")
          .upsert(rows, { onConflict: "source_hash,target_lang" });
        if (upsertErr) console.error("cache upsert error", upsertErr);
        for (const r of rows) cacheLookup.set(r.source_hash, r.translated_text);
      }
    }

    // Map back in original order
    const out = inputs.map((text, i) => {
      if (!text || !text.trim()) return text;
      return cacheLookup.get(hashes[i]) ?? text;
    });

    return new Response(JSON.stringify({ translations: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "RATE_LIMIT" ? 429 : msg === "PAYMENT_REQUIRED" ? 402 : 500;
    console.error("translate-batch error", e);
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
