import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const Body = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(3).max(40),
  nationality: z.string().trim().max(100).optional().nullable(),
  preferred_language: z.string().trim().max(50).optional().nullable(),
  services: z.array(z.string().max(80)).max(20).optional().default([]),
  user_type: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  source_page: z.string().trim().max(200).optional().nullable(),
  honeypot: z.string().optional(),
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
    if (b.honeypot) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user_agent = req.headers.get("user-agent") ?? "";
    const { data, error } = await supabase
      .from("leads")
      .upsert(
        {
          full_name: b.full_name,
          email: b.email.toLowerCase(),
          phone: b.phone,
          nationality: b.nationality ?? null,
          preferred_language: b.preferred_language ?? null,
          language: b.preferred_language ?? null,
          services: b.services ?? [],
          user_type: b.user_type ?? null,
          notes: b.notes ?? null,
          source: "public_gate_lead",
          submission_source: "public_gate",
          source_page: b.source_page ?? null,
          page_source: b.source_page ?? null,
          status: "new",
          user_agent,
        },
        { onConflict: "email" },
      )
      .select("id")
      .single();
    if (error) {
      console.error("submit-lead insert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-lead unexpected", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
