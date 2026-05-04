import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: due } = await supa.rpc("rel_followup_due_sends");
  let resent = 0;
  for (const row of (due ?? []) as Array<{ send_id: string; campaign_id: string }>) {
    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/rel-send-bulk-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ campaign_id: row.campaign_id, only_send_id: row.send_id }),
    });
    if (r.ok) resent++;
  }
  return new Response(JSON.stringify({ ok: true, resent }), {
    headers: { "Content-Type": "application/json" },
  });
});
