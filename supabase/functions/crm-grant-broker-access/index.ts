// CRM: Grant a broker view/edit access to a specific source database.
// - Owner/admin only.
// - Creates broker auth user if email doesn't yet have an account.
// - Ensures broker_profiles + hr_user_roles rows exist.
// - Upserts crm_database_grants row.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type NewBrokerProfile = {
  full_name?: string | null;
  phone_e164?: string | null;
  current_company?: string | null;
  nationality?: string | null;
  languages?: string[] | null;
  role_title?: string | null;
  current_brokerage_name?: string | null;
  notes?: string | null;
};

type Body = {
  source_database_id: string;
  broker_email: string;
  broker_display_name?: string;
  permission_level?: "view" | "edit";
  broker_scope?: "internal" | "external";
  expires_at?: string | null;
  notes?: string | null;
  send_invite?: boolean;
  new_broker_profile?: NewBrokerProfile | null;
  // Phase 3 — visibility rule
  visibility_direction?: "broker_to_owner_only" | "bidirectional";
  date_window_mode?: "all" | "today" | "last_7" | "last_30" | "custom" | "from_date";
  date_window_start?: string | null;
  date_window_end?: string | null;
  lead_ids?: string[] | null;
  status_filter?: string[] | null;
  // Phase 3 visibility flags
  visible_notes?: boolean;
  visible_files?: boolean;
  visible_activities?: boolean;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing Authorization" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const caller = userRes?.user;
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Authorization: owner of the database OR admin/owner role
    const body = (await req.json()) as Body;
    if (!body?.source_database_id || !body?.broker_email) {
      return json({ error: "source_database_id and broker_email required" }, 400);
    }
    const email = body.broker_email.trim().toLowerCase();

    const { data: db, error: dbErr } = await admin
      .from("crm_source_databases")
      .select("id, owner_user_id, name")
      .eq("id", body.source_database_id)
      .maybeSingle();
    if (dbErr || !db) return json({ error: "Database not found" }, 404);

    const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
      admin.rpc("has_role", { _user_id: caller.id, _role: "admin" }),
      admin.rpc("has_role", { _user_id: caller.id, _role: "owner" }),
    ]);
    const allowed = db.owner_user_id === caller.id || !!isAdmin || !!isOwner;
    if (!allowed) return json({ error: "Forbidden" }, 403);

    // Find or create the broker user via Admin API
    let brokerUserId: string | null = null;
    const { data: existing } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const match = existing?.users?.find(
      (u: any) => (u.email ?? "").toLowerCase() === email,
    );
    let created = false;
    if (match) {
      brokerUserId = match.id;
    } else {
      const tempPassword = crypto.randomUUID().replace(/-/g, "") + "Aa!1";
      const { data: createRes, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            display_name: body.broker_display_name ?? email.split("@")[0],
            invited_as_broker: true,
          },
        });
      if (createErr || !createRes?.user) {
        return json({ error: createErr?.message ?? "Could not create user" }, 500);
      }
      brokerUserId = createRes.user.id;
      created = true;
    }

    // Ensure broker_profiles row exists
    const { data: bp } = await admin
      .from("broker_profiles")
      .select("id")
      .eq("user_id", brokerUserId!)
      .maybeSingle();
    if (!bp) {
      await admin.from("broker_profiles").insert({
        user_id: brokerUserId,
        display_name: body.broker_display_name ?? email.split("@")[0],
        email,
        broker_type: body.broker_scope === "internal" ? "internal" : "external",
        is_active: true,
      });
    }

    // Ensure hr_user_roles row exists (broker_member)
    const { data: hr } = await admin
      .from("hr_user_roles")
      .select("id")
      .eq("user_id", brokerUserId!)
      .maybeSingle();
    if (!hr) {
      await admin
        .from("hr_user_roles")
        .insert({ user_id: brokerUserId, role: "broker_member", is_active: true });
    }

    // Phase 4 — ensure a crm_brokers directory row exists and is linked to this user
    const { data: existingBroker } = await admin
      .from("crm_brokers")
      .select("id")
      .or(`user_id.eq.${brokerUserId},email_lower.eq.${email}`)
      .maybeSingle();
    if (existingBroker) {
      await admin
        .from("crm_brokers")
        .update({
          user_id: brokerUserId,
          email_lower: email,
          full_name: body.broker_display_name ?? undefined,
          broker_type: body.broker_scope === "internal" ? "both" : (undefined as any),
          last_active_at: new Date().toISOString(),
        })
        .eq("id", existingBroker.id);
    } else {
      const np = body.new_broker_profile ?? {};
      await admin.from("crm_brokers").insert({
        user_id: brokerUserId,
        owner_id: caller.id,
        email_lower: email,
        full_name: np.full_name ?? body.broker_display_name ?? email.split("@")[0],
        phone_e164: np.phone_e164 ?? null,
        current_company: np.current_company ?? null,
        nationality: np.nationality ?? null,
        languages: np.languages?.length ? np.languages : null,
        role_title: np.role_title ?? null,
        notes: np.notes ?? null,
        broker_type: body.broker_scope === "internal" ? "both" : null,
        employment_type: body.broker_scope === "internal" ? "full_time" : "contract",
        join_date: new Date().toISOString().slice(0, 10),
      });
    }

    // Send branded invitation email (best-effort) when requested and broker was just created
    if (created && body.send_invite !== false) {
      try {
        const { error: linkErr } = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: `${SUPABASE_URL.replace(/\.supabase\.co.*$/, ".lovable.app")}/reset-password` },
        });
        if (linkErr) console.warn("invite link generation failed:", linkErr.message);
      } catch (e) {
        console.warn("invite email best-effort failed:", e);
      }
    }

    // Upsert grant (with Phase 3 visibility rule)
    const permission_level = body.permission_level === "edit" ? "edit" : "view";
    const { data: grant, error: grantErr } = await admin
      .from("crm_database_grants")
      .upsert(
        {
          source_database_id: body.source_database_id,
          broker_user_id: brokerUserId,
          permission_level,
          granted_by: caller.id,
          expires_at: body.expires_at ?? null,
          notes: body.notes ?? null,
          revoked_at: null,
          suspended_at: null,
          suspend_reason: null,
          visibility_direction: body.visibility_direction ?? "broker_to_owner_only",
          date_window_mode: body.date_window_mode ?? "all",
          date_window_start: body.date_window_start ?? null,
          date_window_end: body.date_window_end ?? null,
          lead_ids: body.lead_ids ?? null,
          status_filter: body.status_filter ?? null,
        },
        { onConflict: "source_database_id,broker_user_id" },
      )
      .select()
      .single();
    if (grantErr) return json({ error: grantErr.message }, 500);

    // Update the database's assigned broker for display
    await admin
      .from("crm_source_databases")
      .update({
        broker_owner_user_id: brokerUserId,
        broker_scope: body.broker_scope ?? null,
      })
      .eq("id", body.source_database_id);

    return json({
      ok: true,
      broker_user_id: brokerUserId,
      broker_created: created,
      grant,
    });
  } catch (e) {
    console.error("crm-grant-broker-access error:", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
