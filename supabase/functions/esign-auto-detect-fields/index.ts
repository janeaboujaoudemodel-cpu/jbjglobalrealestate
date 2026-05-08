import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PageImage { pageNumber: number; image: string; width: number; height: number; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { pdfUrl, pdfBase64, recipientId: _rid, recipientName, recipientEmail, pageImages } =
      body as {
        pdfUrl?: string;
        pdfBase64?: string;
        recipientId?: string;
        recipientName?: string;
        recipientEmail?: string;
        pageImages?: PageImage[];
      };

    const today = new Date().toLocaleDateString("en-AE");
    const safeName = (recipientName || "").trim();
    const safeEmail = (recipientEmail || "").trim();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Best path: vision over rasterized pages ──
    if (pageImages && pageImages.length > 0) {
      const allFields: any[] = [];
      for (const pg of pageImages.slice(0, 6)) {
        const messages = [
          {
            role: "system",
            content:
              "You are a precise signing-field detector for contract pages. " +
              "STRICT RULES — failure to follow these is a critical error: " +
              "1) ONLY emit a field when there is a CLEAR visible anchor on the page: a printed underline (e.g. '____________'), an empty box, the words 'Signature:', 'Initial:', 'Date:', 'Name:', 'Title:', 'Company:', 'On behalf of:', 'By:', or a stamp/seal placeholder. " +
              "2) NEVER invent a field that has no anchor on this page. If unsure, OMIT it. " +
              "3) NEVER add 'Title' unless the page literally shows the word 'Title' followed by a blank/underline. " +
              "4) Coordinates x,y are the TOP-LEFT of the field as a percentage of page width/height (0-100). " +
              "5) Place the field DIRECTLY OVER the underline/box, not above or beside it. " +
              "Return ONLY a JSON array (no markdown, no commentary). Each item: " +
              "{ type: 'signature'|'initials'|'date'|'text'|'stamp', x: number, y: number, width: number, height: number, label: string, suggestedValue: string }",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Page ${pg.pageNumber} rendered at ${pg.width}x${pg.height} pixels. ` +
                  `Find every signing anchor on THIS page only. ` +
                  `Pre-fill suggestedValue using recipient: name="${safeName}", email="${safeEmail}", today="${today}". ` +
                  `Empty string for signature/initials/stamp. ` +
                  `Sizing: signature ~180x52, initials ~90x40, date ~140x36, text ~180x36, stamp ~110x110. ` +
                  `If the page has NO signing anchor, return [] — do NOT invent fields.`,
              },
              { type: "image_url", image_url: { url: pg.image } },
            ],
          },
        ];

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "google/gemini-2.5-pro", messages, temperature: 0.1 }),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          console.error(`AI vision error p${pg.pageNumber}:`, resp.status, txt);
          continue;
        }
        const data = await resp.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
        try {
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            for (const f of parsed) {
              allFields.push({ ...f, pageNumber: pg.pageNumber });
            }
          }
        } catch (e) {
          console.warn(`parse failed p${pg.pageNumber}`, e);
        }
      }

      const sanitized = sanitizeFields(allFields, safeName, safeEmail, today);
      // Return whatever vision found — even if empty. NEVER fall back to a guessed layout.
      return jsonResponse({ fields: sanitized });
    }

    // Only when there are no page images at all (legacy callers), return empty — do NOT invent.
    return jsonResponse({ fields: [] });
  } catch (err: any) {
    console.error("esign-auto-detect-fields error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeFields(fields: any[], name: string, email: string, today: string) {
  const valid = ["signature", "initials", "date", "text", "stamp"];
  return fields
    .filter((f) => valid.includes(f.type))
    .map((f) => {
      const label = String(f.label || f.type).toLowerCase();
      let suggested = String(f.suggestedValue ?? "");
      // Force-correct common label-based fields if AI returned junk
      if (f.type === "text") {
        if (/name/.test(label) && !suggested) suggested = name;
        else if (/email/.test(label) && !suggested) suggested = email;
        else if (/date/.test(label) && !suggested) suggested = today;
      }
      if (f.type === "date" && !suggested) suggested = today;
      // Strip any literal stray brand strings like "JBJ" if AI hallucinated them
      if (suggested === "JBJ" || suggested === "JBJ GLOBAL REAL ESTATE") suggested = name || "";
      return {
        type: f.type,
        x: clamp(Number(f.x), 0, 95),
        y: clamp(Number(f.y), 0, 95),
        width: Number(f.width) || defaultWidth(f.type),
        height: Number(f.height) || defaultHeight(f.type),
        label: String(f.label || f.type),
        suggestedValue: suggested,
        pageNumber: Number(f.pageNumber) || 1,
      };
    });
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, isFinite(v) ? v : lo)); }
function defaultWidth(t: string) { return t === "signature" ? 180 : t === "initials" ? 90 : t === "date" ? 140 : t === "stamp" ? 110 : 160; }
function defaultHeight(t: string) { return t === "signature" ? 52 : t === "initials" ? 40 : t === "date" ? 36 : t === "stamp" ? 110 : 36; }

function getStandardContractLayout(name: string, email: string, today: string) {
  return [
    { type: "text", x: 10, y: 8, width: 200, height: 36, label: "Full Name", suggestedValue: name, pageNumber: 1 },
    { type: "text", x: 55, y: 8, width: 200, height: 36, label: "Email", suggestedValue: email, pageNumber: 1 },
    { type: "date", x: 10, y: 88, width: 140, height: 36, label: "Date", suggestedValue: today, pageNumber: 1 },
    { type: "signature", x: 38, y: 84, width: 180, height: 52, label: "Signature", suggestedValue: "", pageNumber: 1 },
    { type: "initials", x: 82, y: 88, width: 90, height: 40, label: "Initials", suggestedValue: "", pageNumber: 1 },
  ];
}
