// Candidate-self: submit the intake form. Validates the token, links the
// auth user to the candidate row, writes intake_payload + status='docs_submitted',
// auto-creates/updates an hr_job_applicants row, and back-fills the public profile.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const PassportSchema = z.object({
  country: z.string().min(2).max(80),
  number: z.string().min(2).max(40),
  file_url: z.string().url().optional(),
});

const PayloadSchema = z.object({
  intake_token: z.string().min(8).max(64),
  full_name: z.string().min(2).max(120),
  phone: z.string().min(5).max(30),
  photo_url: z.string().url().optional(),
  emirates_id_number: z.string().min(5).max(30).optional(),
  emirates_id_front_url: z.string().url().optional(),
  emirates_id_back_url: z.string().url().optional(),
  passports: z.array(PassportSchema).min(1).max(5),
  rera_number: z.string().max(40).optional().nullable(),
  rera_card_url: z.string().url().optional().nullable(),
  languages: z.array(z.string().min(2).max(40)).min(1).max(10),
  nationalities: z.array(z.string().min(2).max(60)).min(1).max(5),
  current_company: z.string().max(120).optional().nullable(),
  total_years_experience: z.number().int().min(0).max(60),
  date_of_birth: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized — please sign in" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      auth.replace("Bearer ", ""),
    );
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const raw = await req.json();
    const parsed = PayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    }
    const p = parsed.data;

    // Look up the candidate by token
    const { data: candidate, error: cErr } = await supabase
      .from("hr_candidates")
      .select("*")
      .eq("intake_token", p.intake_token)
      .maybeSingle();
    if (cErr || !candidate) return json({ error: "Invalid or expired intake link" }, 404);
    if (
      candidate.intake_token_expires_at &&
      new Date(candidate.intake_token_expires_at) < new Date()
    ) {
      return json({ error: "This intake link has expired" }, 410);
    }
    if (candidate.intake_submitted_at) {
      return json({ error: "You have already submitted your documents" }, 409);
    }

    const intakePayload = {
      photo_url: p.photo_url || null,
      emirates_id_number: p.emirates_id_number || null,
      emirates_id_front_url: p.emirates_id_front_url || null,
      emirates_id_back_url: p.emirates_id_back_url || null,
      passports: p.passports,
      rera_number: p.rera_number || null,
      rera_card_url: p.rera_card_url || null,
      languages: p.languages,
      nationalities: p.nationalities,
      current_company: p.current_company || null,
      total_years_experience: p.total_years_experience,
      date_of_birth: p.date_of_birth || null,
      gender: p.gender || null,
      submitted_via: "in_app_intake_v1",
    };

    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("hr_candidates")
      .update({
        user_id: candidate.user_id || user.id,
        candidate_name: p.full_name,
        phone: p.phone,
        status: "docs_submitted",
        intake_submitted_at: now,
        intake_payload: intakePayload,
        experience_years: p.total_years_experience,
        updated_at: now,
      })
      .eq("id", candidate.id);
    if (upErr) return json({ error: upErr.message }, 500);

    // Mirror into hr_job_applicants for the offer pipeline
    const dept = candidate.department_category || "Property Consultant";
    const { data: existingApplicant } = await supabase
      .from("hr_job_applicants")
      .select("id")
      .eq("candidate_id", candidate.id)
      .maybeSingle();

    let applicantId = existingApplicant?.id;
    if (applicantId) {
      await supabase
        .from("hr_job_applicants")
        .update({
          full_name: p.full_name,
          email: candidate.email,
          phone: p.phone,
          department: dept,
          experience_years: p.total_years_experience,
          status: "docs_received",
          updated_at: now,
        })
        .eq("id", applicantId);
    } else {
      const { data: ins } = await supabase
        .from("hr_job_applicants")
        .insert({
          candidate_id: candidate.id,
          full_name: p.full_name,
          email: candidate.email,
          phone: p.phone,
          department: dept,
          experience_years: p.total_years_experience,
          status: "docs_received",
        })
        .select("id")
        .single();
      applicantId = ins?.id;
    }

    // Back-fill the public profile so the candidate's account is also complete
    await supabase
      .from("profiles")
      .update({
        full_name: p.full_name,
        phone_number: p.phone,
        updated_at: now,
      })
      .eq("id", user.id);

    return json({
      ok: true,
      candidate_id: candidate.id,
      applicant_id: applicantId,
      status: "docs_submitted",
    });
  } catch (e) {
    console.error("hr-intake-submit error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
