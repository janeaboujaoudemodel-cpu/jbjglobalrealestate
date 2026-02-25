import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior HR professional at JBJ Global Real Estate, a luxury real estate brokerage in Dubai, UAE. Analyze a candidate application with PROFESSIONAL, FAIR, and THOROUGH scoring.

SCORING CRITERIA (1–10 total):
■ Experience (0–4 points):
  0 = No experience info available
  1 = Under 1 year or completely unrelated field
  2 = 1–3 years or semi-related (hospitality, retail, customer service)
  3 = 3–6 years in real estate, sales, finance, or closely related
  4 = 7+ years with real estate leadership or senior broker experience

■ Languages (0–3 points):
  0 = No language info
  1 = 1 language (English OR Arabic)
  2 = 2 languages including English
  3 = 3+ languages including English & Arabic (essential for Dubai)

■ Skills (0–3 points):
  0 = No identifiable skills
  1 = Basic transferable skills (communication, MS Office)
  2 = Relevant skills (CRM, negotiation, sales, property management)
  3 = Advanced/certified (RERA license, BRN holder, Salesforce, market analysis tools)

FINAL SCORE = Experience + Language + Skills (max 10)
Levels: 9–10 Elite | 7–8 Advanced | 5–6 Intermediate | 3–4 Developing | 1–2 Beginner

RULES:
- Be FAIR. Score only on available information.
- THOROUGHLY read the CV text content provided. Extract ALL languages mentioned ANYWHERE in the CV — including skills sections, personal info, language proficiency sections, education sections, or even just mentioned in passing (e.g. "translated documents to French").
- Count ALL languages listed, regardless of proficiency level (native, fluent, intermediate, basic, conversational, beginner). Include ALL of them in the "languages" array.
- If the candidate lists a language section, copy every single language from it — do NOT skip any.
- If CV text is provided, USE IT as the primary data source — it contains the real information.
- NEVER use words like "unreadable", "corrupted", or "malformed" in summary/flags; if extraction is limited, state that details are limited and manual review is required.
- Infer reasonable estimates from context (email domain, nationality → likely languages, location → market familiarity).
- Identify which ROLE the candidate is best suited for.
- List SPECIFIC missing items the candidate should provide.

Respond ONLY in valid JSON (no markdown, no code blocks):
{
  "experience_years": 0,
  "languages": ["English"],
  "skills": ["Skill1"],
  "ai_ranking": 3,
  "ai_summary": "Professional 2-3 sentence HR summary.",
  "department_category": "sales",
  "best_suited_role": "Junior Sales Associate",
  "flag_reason": null,
  "strengths": ["strength1"],
  "weaknesses": ["weakness1"],
  "missing_items": ["CV document", "Work history"],
  "interview_questions": ["Q1?", "Q2?", "Q3?"],
  "scoring_breakdown": {
    "experience_score": 0,
    "experience_reason": "No experience info provided",
    "language_score": 1,
    "language_reason": "English inferred from application language",
    "skills_score": 0,
    "skills_reason": "No skills data available"
  },
  "overall_recommendation": "Consider",
  "recommendation_reason": "Insufficient data for strong recommendation; request CV and interview."
}`;

function buildCandidateInfo(app: Record<string, any>, cvText: string | null): string {
  let info = `
CANDIDATE APPLICATION:
- Full Name: ${app.full_name || "N/A"}
- Email: ${app.email || "N/A"}
- Phone: ${app.phone_e164 || app.phone || "Not provided"}
- Nationality: ${app.nationality || "Not stated"}
- Preferred Language: ${app.preferred_language || "Not stated"}
- Location: ${app.current_location_city || "?"}, ${app.current_location_country || "?"}
- Position Applied For: ${app.position_applied || "Not specified"}
- Source: ${app.source || "unknown"}
- CV Uploaded: ${app.cv_url ? "Yes" : "No"}
- Applied: ${app.created_at}`.trim();

  if (cvText && cvText.trim().length > 20) {
    info += `\n\n--- CV DOCUMENT CONTENT (extracted text) ---\n${cvText.slice(0, 12000)}\n--- END CV CONTENT ---`;
    info += `\n\nIMPORTANT: The CV text above is the PRIMARY source. Extract ALL languages, skills, and experience from it. Do NOT say "unreadable" if text is provided above.`;
  } else {
    info += `\n\nNOTE: CV text extraction was limited. Provide a provisional assessment using available application data, request manual HR review, and avoid terms like unreadable/corrupted.`;
  }

  return info;
}

/**
 * Use Gemini Vision API to extract text from a PDF/image when programmatic extraction fails.
 * Sends the file as base64 to the AI gateway for OCR.
 */
async function extractWithVisionApi(
  fileBytes: Uint8Array,
  mimeType: string,
  lovableApiKey: string,
): Promise<string | null> {
  try {
    // Convert to base64
    let binary = '';
    const chunkSize = 32768;
    for (let i = 0; i < fileBytes.length; i += chunkSize) {
      const chunk = fileBytes.slice(i, i + chunkSize);
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`Vision API extraction: sending ${(fileBytes.length / 1024).toFixed(1)}KB as ${mimeType}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ALL text from this CV/Resume document. Preserve the structure. Include every section: personal info, contact details, education, work experience, skills, languages, certifications, and any other content. Return ONLY the extracted text, no commentary.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        max_tokens: 8000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Vision API error:", response.status, errText);
      return null;
    }

    const aiData = await response.json();
    const text = aiData.choices?.[0]?.message?.content?.trim() || "";
    console.log(`Vision API extracted ${text.length} chars`);
    return text.length > 20 ? text.slice(0, 12000) : null;
  } catch (err) {
    console.error("Vision API extraction error:", err);
    return null;
  }
}

/**
 * Attempt to download and extract text from the CV file.
 * Uses a two-stage approach:
 * 1. Programmatic text extraction (fast, no API cost)
 * 2. Vision API fallback for scanned/complex PDFs
 */
async function extractCvText(
  adminClient: any,
  cvUrl: string,
  lovableApiKey: string,
): Promise<string | null> {
  try {
    let fileBytes: Uint8Array | null = null;
    let fileName = cvUrl;

    // Determine if it's a full URL or a storage path
    const publicMatch = cvUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i);
    const isFullUrl = /^https?:\/\//i.test(cvUrl);

    if (publicMatch) {
      const resp = await fetch(cvUrl);
      if (resp.ok) {
        fileBytes = new Uint8Array(await resp.arrayBuffer());
        fileName = publicMatch[2];
      }
    } else if (isFullUrl) {
      const resp = await fetch(cvUrl);
      if (resp.ok) {
        fileBytes = new Uint8Array(await resp.arrayBuffer());
      }
    } else {
      const storagePath = cvUrl.replace(/^\/+/, '');
      const buckets = ['hr-documents', 'documents', 'public'];
      for (const bucket of buckets) {
        const { data, error } = await adminClient.storage.from(bucket).download(storagePath);
        if (!error && data) {
          fileBytes = new Uint8Array(await data.arrayBuffer());
          fileName = storagePath;
          break;
        }
      }
    }

    if (!fileBytes || fileBytes.length === 0) {
      console.log("Could not download CV file");
      return null;
    }

    const ext = fileName.split('?')[0].split('.').pop()?.toLowerCase() || '';
    const mimeType = ext === 'pdf' ? 'application/pdf' :
                     ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                     ext === 'doc' ? 'application/msword' :
                     'application/octet-stream';

    // Stage 1: Programmatic text extraction
    let text: string | null = null;

    if (['txt', 'md', 'csv'].includes(ext)) {
      return new TextDecoder().decode(fileBytes);
    }

    if (ext === 'pdf') {
      text = extractTextFromPdf(fileBytes);
    } else if (['doc', 'docx'].includes(ext)) {
      text = extractTextFromDoc(fileBytes);
    }

    // Quality check: does the extracted text contain meaningful content?
    if (text) {
      const cleanText = text.replace(/\s+/g, ' ').trim();
      const letterCount = (cleanText.match(/[a-zA-Z]/g) || []).length;
      const wordCount = cleanText.split(/\s+/).filter(w => w.length >= 2).length;
      
      if (letterCount > 100 && wordCount > 20) {
        console.log(`Programmatic extraction successful: ${wordCount} words, ${letterCount} letters`);
        return text;
      }
      console.log(`Programmatic extraction yielded poor results: ${wordCount} words, ${letterCount} letters - falling back to Vision API`);
    } else {
      console.log(`Programmatic extraction returned nothing for ${ext} - falling back to Vision API`);
    }

    // Stage 2: Vision API fallback (handles scanned PDFs, complex layouts, images)
    // Only for supported types
    if (['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'doc', 'docx'].includes(ext)) {
      const visionText = await extractWithVisionApi(fileBytes, mimeType, lovableApiKey);
      if (visionText) return visionText;
    }

    // Last resort: try decoding as text
    try {
      const rawText = new TextDecoder().decode(fileBytes);
      const printableRatio = rawText.split('').filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127).length / rawText.length;
      if (printableRatio > 0.7) return rawText.slice(0, 12000);
    } catch { /* ignore */ }

    return null;
  } catch (err) {
    console.error("CV text extraction error:", err);
    return null;
  }
}

/**
 * Basic PDF text extraction — finds text between BT/ET operators
 * and decodes text strings in parentheses and hex strings.
 */
function extractTextFromPdf(bytes: Uint8Array): string {
  const raw = new TextDecoder('latin1').decode(bytes);
  const textParts: string[] = [];

  // Method 1: Extract text from PDF streams (Tj, TJ operators)
  const tjRegex = /\(([^)]*)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(raw)) !== null) {
    textParts.push(match[1]);
  }

  // Method 2: Extract from TJ arrays
  const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(raw)) !== null) {
    const inner = match[1];
    const strings = inner.match(/\(([^)]*)\)/g);
    if (strings) {
      for (const s of strings) {
        textParts.push(s.slice(1, -1));
      }
    }
  }

  // Method 3: Simple text extraction from stream content
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  while ((match = streamRegex.exec(raw)) !== null) {
    const content = match[1];
    const readable = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{3,}/g, ' ')
      .trim();
    if (readable.length > 20) {
      textParts.push(readable);
    }
  }

  let text = textParts.join(' ')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If extraction yielded very little, try brute-force readable content
  if (text.length < 50) {
    const bruteText = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{3,}/g, ' ')
      .trim();
    const words = bruteText.split(/\s+/).filter(w => /^[a-zA-Z@.]{2,}$/.test(w) || /^\d{4}$/.test(w) || /^\+?\d[\d\s-]{6,}$/.test(w));
    if (words.length > 10) {
      text = words.join(' ');
    }
  }

  return text.length > 20 ? text.slice(0, 12000) : "";
}

/**
 * Basic DOC/DOCX text extraction.
 */
function extractTextFromDoc(bytes: Uint8Array): string {
  if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
    return extractTextFromDocx(bytes);
  }

  const raw = new TextDecoder('latin1').decode(bytes);
  const segments: string[] = [];
  let current = '';

  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if ((code >= 32 && code < 127) || code === 10 || code === 13 || code === 9) {
      current += raw[i];
    } else {
      if (current.trim().length > 3) {
        segments.push(current.trim());
      }
      current = '';
    }
  }
  if (current.trim().length > 3) segments.push(current.trim());

  const meaningful = segments.filter(s => {
    const wordCount = s.split(/\s+/).filter(w => /^[a-zA-Z]{2,}$/.test(w)).length;
    return wordCount >= 2 || s.length > 20;
  });

  const text = meaningful.join('\n').slice(0, 12000);
  return text.length > 20 ? text : "";
}

function extractTextFromDocx(bytes: Uint8Array): string {
  try {
    const raw = new TextDecoder('latin1').decode(bytes);
    let offset = 0;
    const files: { name: string; data: string }[] = [];

    while (offset < bytes.length - 30) {
      if (bytes[offset] !== 0x50 || bytes[offset + 1] !== 0x4B ||
          bytes[offset + 2] !== 0x03 || bytes[offset + 3] !== 0x04) {
        break;
      }

      const nameLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
      const extraLen = bytes[offset + 28] | (bytes[offset + 29] << 8);
      const compSize = bytes[offset + 18] | (bytes[offset + 19] << 8) |
                       (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
      const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);

      const nameStart = offset + 30;
      const name = new TextDecoder('latin1').decode(bytes.slice(nameStart, nameStart + nameLen));
      const dataStart = nameStart + nameLen + extraLen;

      if (compressionMethod === 0 && name.includes('document.xml')) {
        const data = new TextDecoder('utf-8').decode(bytes.slice(dataStart, dataStart + compSize));
        files.push({ name, data });
      }

      offset = dataStart + compSize;
    }

    const docFile = files.find(f => f.name.includes('word/document.xml'));
    if (docFile) {
      const text = docFile.data
        .replace(/<w:p[^>]*>/g, '\n')
        .replace(/<w:tab\/>/g, '\t')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, ' ')
        .trim();
      return text.length > 20 ? text.slice(0, 12000) : "";
    }

    const fallback = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{3,}/g, ' ')
      .trim();
    return fallback.length > 50 ? fallback.slice(0, 12000) : "";
  } catch {
    return "";
  }
}

async function analyzeApplication(
  adminClient: any,
  lovableApiKey: string,
  applicationId: string,
  source: string,
  forceReanalyze: boolean = false,
): Promise<{ success: boolean; analysis?: any; error?: string }> {
  const { data: app, error: fetchErr } = await adminClient
    .from(source)
    .select("*")
    .eq("id", applicationId)
    .single();

  if (fetchErr || !app) {
    return { success: false, error: "Application not found" };
  }

  // Skip if already analyzed (ai_ranking > 0) unless force re-analyze
  if (!forceReanalyze && app.ai_ranking && app.ai_ranking > 0) {
    return { success: true, analysis: { ai_ranking: app.ai_ranking, ai_summary: app.ai_summary, already_analyzed: true } };
  }

  // Extract CV text content with Vision API fallback
  let cvText: string | null = null;
  if (app.cv_url) {
    console.log(`Extracting CV text for ${app.full_name} from: ${app.cv_url}`);
    cvText = await extractCvText(adminClient, app.cv_url, lovableApiKey);
    console.log(`CV text extracted: ${cvText ? cvText.length + ' chars' : 'none'}`);
  }

  const candidateInfo = buildCandidateInfo(app, cvText);

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: candidateInfo },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI API error:", errText);
    return { success: false, error: "AI analysis failed" };
  }

  const aiData = await aiResponse.json();
  let rawContent = aiData.choices?.[0]?.message?.content?.trim() || "";
  rawContent = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let analysis;
  try {
    analysis = JSON.parse(rawContent);

    const cleanUnreadable = (value: unknown, fallback: string | null) => {
      if (typeof value !== "string") return fallback;
      if (/unreadable|corrupt|malformed/i.test(value)) {
        return "CV details are limited from automated extraction; manual HR review is recommended.";
      }
      return value;
    };

    analysis.ai_summary = cleanUnreadable(analysis.ai_summary, "Analysis completed.");
    analysis.flag_reason = cleanUnreadable(analysis.flag_reason, null);
  } catch {
    console.error("Failed to parse AI response:", rawContent);
    return { success: false, error: "Failed to parse AI analysis" };
  }

  // Persist to database
  const updatePayload: Record<string, unknown> = {
    experience_years: analysis.experience_years ?? 0,
    languages: analysis.languages ?? [],
    skills: analysis.skills ?? [],
    ai_ranking: Math.max(1, Math.min(10, analysis.ai_ranking ?? 1)),
    ai_summary: analysis.ai_summary ?? "Analysis completed.",
    flag_reason: analysis.flag_reason ?? null,
  };

  if (source === "hr_applications") {
    updatePayload.department_category = analysis.department_category ?? "general";
  }

  const { error: updateErr } = await adminClient.from(source).update(updatePayload).eq("id", applicationId);
  if (updateErr) {
    console.error("DB update error:", updateErr);
  }

  return { success: true, analysis };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";

    const body = await req.json();
    const { applicationId, source, mode, forceReanalyze } = body;

    // MODE: "auto" = called internally from capture-lead, no owner check needed
    // MODE: undefined/manual = called from UI, requires owner auth
    if (mode !== "auto") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authErr } = await userClient.auth.getUser();
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Auth failed" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ownerEmail = Deno.env.get("OWNER_EMAIL");
      if (!ownerEmail || user.email?.toLowerCase() !== ownerEmail.toLowerCase()) {
        return new Response(JSON.stringify({ error: "Owner access required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const internalKey = req.headers.get("x-internal-key");
      if (internalKey !== supabaseServiceKey) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!applicationId || !source) {
      return new Response(JSON.stringify({ error: "applicationId and source required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const result = await analyzeApplication(adminClient, lovableApiKey, applicationId, source, forceReanalyze === true);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, analysis: result.analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cv-ai-analyzer error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
