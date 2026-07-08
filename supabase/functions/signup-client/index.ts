import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const Body = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(3).max(40),
  nationality: z.string().trim().max(100).optional().nullable(),
  preferred_language: z.string().trim().max(50).optional().nullable(),
  services: z.array(z.string().max(80)).max(20).optional().default([]),
  user_type: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  source_page: z.string().trim().max(200).optional().nullable(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const b = parsed.data;
    const email = b.email.toLowerCase();
    const user_agent = req.headers.get("user-agent") ?? "";

    // Create auth user (email confirmed so they can log in immediately)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: b.password,
      email_confirm: true,
      user_metadata: {
        full_name: b.full_name,
        phone: b.phone,
        nationality: b.nationality,
        preferred_language: b.preferred_language,
        user_type: b.user_type,
      },
    });
    if (createErr || !created?.user) {
      return new Response(
        JSON.stringify({ error: createErr?.message ?? "Signup failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const uid = created.user.id;

    // Assign 'client' role
    await supabase.from("user_roles").insert({ user_id: uid, role: "client" });

    // Lead record
    await supabase.from("leads").upsert(
      {
        full_name: b.full_name,
        email,
        phone: b.phone,
        nationality: b.nationality ?? null,
        preferred_language: b.preferred_language ?? null,
        language: b.preferred_language ?? null,
        services: b.services ?? [],
        user_type: b.user_type ?? null,
        notes: b.notes ?? null,
        source: "public_gate_signup",
        submission_source: "public_gate",
        
        page_source: b.source_page ?? null,
        status: "new",
        user_agent,
      },
      { onConflict: "email" },
    );

    return new Response(JSON.stringify({ ok: true, user_id: uid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signup-client unexpected", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
