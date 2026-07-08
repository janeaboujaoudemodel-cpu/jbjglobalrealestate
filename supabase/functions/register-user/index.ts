// Edge function: register-user
// Public endpoint that creates the auth user, assigns client role,
// writes CRM profile, logs activity, and inserts a leads record.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CATEGORIES = [
  "investor","buyer","seller","broker","developer",
  "landlord","tenant","partner","service_provider","media","other",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { category, category_data = {}, common = {}, source_page = "" } = body ?? {};

    if (!CATEGORIES.includes(category)) {
      return json({ error: "Invalid category" }, 400);
    }
    const email = String(common.email ?? "").trim().toLowerCase();
    const password = String(common.password ?? "");
    const full_name = String(common.full_name ?? "").trim();
    const phone = String(common.phone ?? "").trim();

    if (!email || !password || password.length < 8 || !full_name || !phone) {
      return json({ error: "Missing required fields" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // 1. Create auth user (auto-confirmed for smooth UX)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, category },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Failed to create user" }, 400);
    }
    const userId = created.user.id;

    // 2. Assign client role
    await admin.from("user_roles").insert({ user_id: userId, role: "client" });

    // 3. Derive denormalized filter values
    const services: string[] = Array.isArray(common.services) ? common.services : [];
    const position = String(category_data.position ?? "");
    const company_name = String(category_data.company_name ?? "");
    const years_experience = num(category_data.years_experience);
    const investment_experience = String(category_data.investment_experience ?? "");
    const communities: string[] = Array.isArray(category_data.communities)
      ? category_data.communities : [];
    const { budget_min, budget_max } = parseBudget(category_data.budget);

    // 4. Insert CRM profile
    const profileRow = {
      user_id: userId,
      category,
      full_name,
      email,
      phone,
      whatsapp: String(common.whatsapp ?? ""),
      country: String(common.country ?? ""),
      nationality: String(common.nationality ?? category_data.nationality ?? ""),
      preferred_language: String(common.preferred_language ?? "English"),
      preferred_contact_method: String(common.preferred_contact_method ?? ""),
      preferred_contact_time: String(common.preferred_contact_time ?? ""),
      services,
      notes: String(common.notes ?? ""),
      source_page: String(source_page ?? ""),
      category_data,
      position,
      company_name,
      years_experience,
      budget_min,
      budget_max,
      investment_experience,
      communities,
    };
    const { data: profile, error: profileErr } = await admin
      .from("crm_user_profiles")
      .insert(profileRow)
      .select("id")
      .single();
    if (profileErr) {
      return json({ error: profileErr.message }, 400);
    }

    // 5. Log activity
    await admin.from("crm_profile_activity").insert({
      profile_id: profile!.id,
      actor_id: userId,
      type: "registered",
      payload: { category, source_page },
    });

    // 6. Continuity lead record (best-effort; ignore duplicate email)
    await admin.from("leads").upsert(
      {
        email,
        full_name,
        phone,
        nationality: profileRow.nationality,
        preferred_language: profileRow.preferred_language,
        user_type: category,
        services,
        notes: profileRow.notes,
        source: "registration",
        page_source: source_page,
        submission_source: "signup_wizard",
      },
      { onConflict: "email", ignoreDuplicates: true },
    );

    return json({ ok: true, user_id: userId, profile_id: profile!.id }, 200);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function num(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v); return Number.isFinite(n) ? n : null;
}
function parseBudget(v: any): { budget_min: number | null; budget_max: number | null } {
  if (!v || typeof v !== "string") return { budget_min: null, budget_max: null };
  const s = v.toLowerCase();
  const mult = (t: string) => (t.includes("m") ? 1_000_000 : t.includes("k") ? 1_000 : 1);
  const nums = Array.from(s.matchAll(/(\d+(?:\.\d+)?)\s*(m|k)?/g)).map((m) => Number(m[1]) * mult(m[2] ?? ""));
  if (s.startsWith("under") && nums[0]) return { budget_min: 0, budget_max: nums[0] };
  if (s.includes("+") && nums[0]) return { budget_min: nums[0], budget_max: null };
  if (nums.length >= 2) return { budget_min: nums[0], budget_max: nums[1] };
  if (nums.length === 1) return { budget_min: nums[0], budget_max: nums[0] };
  return { budget_min: null, budget_max: null };
}
