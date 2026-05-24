// submit-verification — receives bank-grade KYC submission, validates,
// uploads files via service role, inserts row, writes audit, emails user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendViaResend } from "../_shared/resendClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE = 8 * 1024 * 1024; // 8 MB per file
const MAX_TOTAL = 40 * 1024 * 1024; // 40 MB total
const ALLOWED_DOC_TYPES = new Set([
  "passport",
  "emirates_id",
  "national_id",
  "driver_license",
]);

interface UploadItem {
  filename: string;
  contentType: string;
  base64: string; // raw base64 (no data: prefix)
}

interface SubmitBody {
  fullName: string;
  documentType: string;
  documentCountry: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationality: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  consent: {
    terms: boolean;
    dataProcessing: boolean;
    truthful: boolean;
  };
  idFront: UploadItem;
  idBack?: UploadItem | null;
  selfie: UploadItem;
  livenessFrames: UploadItem[];
  livenessChallenges: string[];
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function ext(filename: string, fallback = "jpg") {
  const e = filename.split(".").pop()?.toLowerCase();
  return e && e.length <= 5 ? e : fallback;
}

function validateUpload(u: UploadItem | null | undefined, label: string): string | null {
  if (!u) return `${label} is required`;
  if (!u.base64 || typeof u.base64 !== "string") return `${label} missing data`;
  if (!ALLOWED_MIME.has(u.contentType)) {
    return `${label} must be JPEG, PNG, or WebP`;
  }
  // Rough size check from base64 length
  const approxBytes = Math.floor((u.base64.length * 3) / 4);
  if (approxBytes > MAX_FILE) return `${label} exceeds 8 MB`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  // ---- Auth ----
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: authData, error: authErr } = await userClient.auth.getUser();
  if (authErr || !authData?.user) return jsonResponse({ error: "Unauthorized" }, 401);
  const user = authData.user;

  // ---- Body parse ----
  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  // ---- Validation ----
  const errors: string[] = [];
  if (!body.fullName?.trim() || body.fullName.length > 200) errors.push("Full name required (≤200 chars)");
  if (!ALLOWED_DOC_TYPES.has(body.documentType)) errors.push("Invalid document type");
  if (!body.documentCountry || body.documentCountry.length > 3) errors.push("Document country required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth)) errors.push("Date of birth invalid");
  if (!body.nationality) errors.push("Nationality required");
  if (!body.phone?.trim()) errors.push("Phone required");
  if (!body.address?.line1 || !body.address?.city || !body.address?.country) {
    errors.push("Address line 1, city, country required");
  }
  if (!body.consent?.terms || !body.consent?.dataProcessing || !body.consent?.truthful) {
    errors.push("All consents must be accepted");
  }

  // Age check (must be 18+)
  const dob = new Date(body.dateOfBirth);
  const ageMs = Date.now() - dob.getTime();
  if (ageMs < 18 * 365.25 * 24 * 60 * 60 * 1000) errors.push("Must be 18+");

  const fileErrors = [
    validateUpload(body.idFront, "ID front"),
    body.documentType !== "passport" ? validateUpload(body.idBack, "ID back") : null,
    validateUpload(body.selfie, "Selfie"),
  ].filter(Boolean) as string[];
  errors.push(...fileErrors);

  if (!Array.isArray(body.livenessFrames) || body.livenessFrames.length < 1) {
    errors.push("Liveness frames required");
  } else {
    for (const f of body.livenessFrames) {
      const e = validateUpload(f, "Liveness frame");
      if (e) {
        errors.push(e);
        break;
      }
    }
  }

  // Total size
  const totalBytes = [body.idFront, body.idBack, body.selfie, ...body.livenessFrames]
    .filter(Boolean)
    .reduce((acc, u) => acc + Math.floor(((u as UploadItem).base64.length * 3) / 4), 0);
  if (totalBytes > MAX_TOTAL) errors.push("Total payload exceeds 40 MB");

  if (errors.length) return jsonResponse({ error: "Validation failed", details: errors }, 400);

  // ---- Rate limit: max 3 submissions / 24h ----
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await admin
    .from("user_verifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((recentCount ?? 0) >= 3) {
    return jsonResponse({ error: "Too many submissions. Please wait 24 hours." }, 429);
  }

  // Block resubmit while one is pending
  const { data: existing } = await admin
    .from("user_verifications")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .maybeSingle();
  if (existing) {
    return jsonResponse(
      { error: `You already have a ${existing.status} verification.` },
      409,
    );
  }

  // ---- Upload all files ----
  const ts = Date.now();
  const submissionId = crypto.randomUUID();
  const folder = `${user.id}/${submissionId}`;

  async function upload(item: UploadItem, name: string): Promise<string> {
    const path = `${folder}/${name}-${ts}.${ext(item.filename)}`;
    const bytes = decodeB64(item.base64);
    const { error } = await admin.storage
      .from("verification-documents")
      .upload(path, bytes, { contentType: item.contentType, upsert: false });
    if (error) throw error;
    return path;
  }

  let idFrontPath: string, selfiePath: string;
  let idBackPath: string | null = null;
  const livenessPaths: string[] = [];
  try {
    idFrontPath = await upload(body.idFront, "id-front");
    if (body.idBack) idBackPath = await upload(body.idBack, "id-back");
    selfiePath = await upload(body.selfie, "selfie");
    for (let i = 0; i < body.livenessFrames.length; i++) {
      const p = await upload(body.livenessFrames[i], `liveness-${i}`);
      livenessPaths.push(p);
    }
  } catch (err: any) {
    console.error("[submit-verification] upload error", err);
    return jsonResponse({ error: "Upload failed", details: err?.message }, 500);
  }

  // ---- Insert row ----
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    null;
  const userAgent = req.headers.get("user-agent");

  const { data: row, error: insertErr } = await admin
    .from("user_verifications")
    .insert({
      user_id: user.id,
      full_name: body.fullName.trim(),
      document_type: body.documentType,
      document_country: body.documentCountry,
      date_of_birth: body.dateOfBirth,
      nationality: body.nationality,
      phone: body.phone.trim(),
      address: body.address,
      id_document_url: idFrontPath,
      id_back_url: idBackPath,
      selfie_url: selfiePath,
      liveness_frames: livenessPaths,
      liveness_challenges: body.livenessChallenges ?? [],
      consent_snapshot: {
        ...body.consent,
        accepted_at: new Date().toISOString(),
        ip: clientIp,
        ua: userAgent,
      },
      client_ip: clientIp,
      user_agent: userAgent,
      status: "pending",
    })
    .select("id, reference_code, status")
    .single();

  if (insertErr || !row) {
    console.error("[submit-verification] insert error", insertErr);
    return jsonResponse({ error: "Could not save submission" }, 500);
  }

  // ---- Audit ----
  await admin.from("verification_audit_log").insert({
    verification_id: row.id,
    actor_user_id: user.id,
    event: "submitted",
    payload: {
      document_type: body.documentType,
      file_count: livenessPaths.length + (idBackPath ? 3 : 2),
    },
    client_ip: clientIp,
    user_agent: userAgent,
  });

  // ---- Confirmation email (non-blocking, best effort) ----
  try {
    const email = user.email;
    if (email) {
      await sendViaResend({
        from: "JBJ Global Real Estate <verify@jbj.ae>",
        to: email,
        subject: `Your verification is being reviewed — ${row.reference_code}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FDFBF7;color:#1A1A1A;">
            <h1 style="font-size:22px;margin:0 0 12px;color:#1A1A1A;">Verification received</h1>
            <p style="font-size:14px;line-height:1.6;color:#1A1A1A;opacity:0.85;">
              Thank you, ${body.fullName.split(" ")[0]}. We received your identity verification submission and our compliance team will review it within 24–48 hours.
            </p>
            <div style="margin:24px 0;padding:16px 18px;background:#F7F2EA;border:1px solid #B89555;border-radius:12px;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1A1A1A;opacity:0.6;margin-bottom:4px;">Reference</div>
              <div style="font-size:18px;font-weight:600;color:#1A1A1A;font-family:ui-monospace,Menlo,monospace;">${row.reference_code}</div>
            </div>
            <p style="font-size:13px;line-height:1.6;color:#1A1A1A;opacity:0.75;">
              You can track the status of your verification at any time on your account page. We will email you again once a decision is made.
            </p>
            <p style="font-size:11px;line-height:1.5;color:#1A1A1A;opacity:0.55;margin-top:32px;">
              JBJ GLOBAL REAL ESTATE · Dubai, UAE
            </p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.warn("[submit-verification] email send failed", err);
  }

  return jsonResponse({
    ok: true,
    reference_code: row.reference_code,
    status: row.status,
  });
});
