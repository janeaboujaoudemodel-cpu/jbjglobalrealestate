/**
 * outreach-send-locked
 *
 * Retired legacy sender.
 * Re-verifies the payload_hash before sending. Never re-renders, never
 * substitutes variables, never rewrites links. The bytes in the row are
 * the bytes the recipient sees.
 *
 * Owner-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "infoo.jane@gmail.com",
];

interface SendBody {
  payload_id: string;
  /** Optional client-computed hash for extra anti-tamper check. */
  expected_hash?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.includes((user.email || "").toLowerCase())) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = (await req.json()) as SendBody;
    if (!body.payload_id) return json({ error: "payload_id required" }, 400);

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row, error: fetchErr } = await service
      .from("outreach_locked_payloads")
      .select("*")
      .eq("id", body.payload_id)
      .maybeSingle();
    if (fetchErr || !row) return json({ error: "Payload not found" }, 404);
    if (row.locked_by !== user.id) return json({ error: "Forbidden" }, 403);
    await service.from("outreach_locked_payloads").update({
      status: "failed",
      send_error: "Legacy locked Gmail sender retired. Use the Resend campaign sender.",
    }).eq("id", row.id);

    return json({ error: "Legacy locked sender retired. Use the Resend campaign sender." }, 410);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

