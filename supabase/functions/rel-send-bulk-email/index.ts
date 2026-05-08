// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { quotaGuardedFetch } from "../_shared/quotaGuardedFetch.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const OWNER_EMAIL = (Deno.env.get("OWNER_EMAIL") ?? "janeaboujaoudenails@gmail.com").toLowerCase();

const render = (tpl: string, data: Record<string, any>) =>
  tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) =>
    k.split(".").reduce((o: any, p: string) => o?.[p], data) ?? "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Owner-only check
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.email || claims.claims.email.toLowerCase() !== OWNER_EMAIL) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { campaign_id, test_recipient } = await req.json();
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: campaign, error: cErr } = await supa
      .from("rel_email_campaigns").select("*").eq("id", campaign_id).single();
    if (cErr || !campaign) throw new Error("Campaign not found");

    let recipients: any[] = [];

    if (test_recipient) {
      recipients = [{
        counterparty_type: null, counterparty_id: null,
        recipient_email: test_recipient,
        recipient_name: "Test", recipient_company: "Test",
        merge_data: {
          developer: { name: "Test Developer", hq_emirate: "Dubai" },
          brokerage: { name: "Test Brokerage", hq_emirate: "Dubai" },
        },
      }];
    } else if (campaign.audience === "developers") {
      let q = supa.from("rel_developers").select("*");
      for (const [k, v] of Object.entries(campaign.segment_filter ?? {})) q = q.eq(k, v as any);
      const { data } = await q;
      recipients = (data ?? []).filter((r: any) => r.primary_email).map((r: any) => ({
        counterparty_type: "developer", counterparty_id: r.id,
        recipient_email: r.primary_email, recipient_name: r.name,
        recipient_company: r.name, merge_data: { developer: r, brokerage: null },
      }));
    } else if (campaign.audience === "brokerages") {
      let q = supa.from("rel_brokerages").select("*");
      for (const [k, v] of Object.entries(campaign.segment_filter ?? {})) q = q.eq(k, v as any);
      const { data } = await q;
      recipients = (data ?? []).filter((r: any) => r.primary_email).map((r: any) => ({
        counterparty_type: "brokerage", counterparty_id: r.id,
        recipient_email: r.primary_email, recipient_name: r.name,
        recipient_company: r.name, merge_data: { brokerage: r, developer: null },
      }));
    }

    if (!test_recipient) {
      await supa.from("rel_email_campaigns").update({ status: "sending" }).eq("id", campaign_id);
    }

    let sent = 0, failed = 0;
    for (const r of recipients) {
      const subject = render(campaign.subject, r.merge_data);
      const html = render(campaign.body_html, r.merge_data);

      const res = await quotaGuardedFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${campaign.sender_name} <${campaign.sender_email}>`,
          to: [r.recipient_email],
          reply_to: campaign.reply_to ?? campaign.sender_email,
          subject, html,
          attachments: campaign.attachments_json ?? [],
        }),
      });
      const body = await res.json().catch(() => ({}));

      await supa.from("rel_email_sends").insert({
        campaign_id,
        counterparty_type: r.counterparty_type,
        counterparty_id: r.counterparty_id,
        recipient_email: r.recipient_email,
        recipient_name: r.recipient_name,
        recipient_company: r.recipient_company,
        merge_data: r.merge_data,
        message_id: body?.id ?? null,
        status: res.ok ? "sent" : "failed",
        error: res.ok ? null : JSON.stringify(body),
        sent_at: res.ok ? new Date().toISOString() : null,
      });

      if (res.ok) {
        sent++;
        if (!test_recipient && r.counterparty_id) {
          if (r.counterparty_type === "developer") {
            await supa.from("rel_developers").update({
              registration_status: "submitted",
              registration_submitted_at: new Date().toISOString(),
            }).eq("id", r.counterparty_id).eq("registration_status", "not_started");
          } else if (r.counterparty_type === "brokerage") {
            await supa.from("rel_brokerages").update({
              onboarding_status: "invited",
              invited_at: new Date().toISOString(),
            }).eq("id", r.counterparty_id).eq("onboarding_status", "not_invited");
          }
        }
      } else {
        failed++;
      }
      await new Promise((res) => setTimeout(res, 120));
    }

    if (!test_recipient) {
      await supa.from("rel_email_campaigns").update({
        status: failed === 0 ? "sent" : "failed",
        sent_at: new Date().toISOString(),
      }).eq("id", campaign_id);
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, total: recipients.length }),
      { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
