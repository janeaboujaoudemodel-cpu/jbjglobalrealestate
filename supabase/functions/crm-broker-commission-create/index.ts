// Owner-only: create a broker commission split agreement.
// Validates splits sum to 100, renders a JBJ-letterhead HTML, optionally emails the broker.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";
import { sendViaResend } from "../_shared/resendClient.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_BASE = "https://jbj.ae";

interface Split {
  party: string;
  role?: string;
  percent: number;
}
interface Body {
  broker_id: string;            // crm_brokers.id
  broker_user_id: string;       // auth user
  broker_email: string;
  broker_name?: string;
  deal_ref?: string;
  title?: string;
  splits: Split[];
  send_email?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const body = (await req.json()) as Body;
    if (!body.broker_user_id || !body.broker_email || !Array.isArray(body.splits) || body.splits.length === 0) {
      return json({ error: "broker_user_id, broker_email, splits required" }, 400);
    }
    const total = body.splits.reduce((s, x) => s + Number(x.percent || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      return json({ error: `splits must total 100% (got ${total})` }, 400);
    }
    for (const s of body.splits) {
      if (!s.party || typeof s.percent !== "number" || s.percent <= 0) {
        return json({ error: "each split needs party + positive percent" }, 400);
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const title = body.title?.trim() || "Commission Split Agreement";
    const html = renderAgreementHtml({
      title,
      deal_ref: body.deal_ref,
      splits: body.splits,
      broker_name: body.broker_name || body.broker_email,
    });

    const { data: agreement, error: aErr } = await admin
      .from("crm_broker_commission_agreements")
      .insert({
        owner_id: auth.userId,
        broker_user_id: body.broker_user_id,
        broker_id: body.broker_id ?? null,
        deal_ref: body.deal_ref ?? null,
        title,
        splits: body.splits,
        agreement_html: html,
        status: body.send_email ? "sent" : "draft",
        sent_at: body.send_email ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (aErr || !agreement) return json({ error: aErr?.message ?? "insert failed" }, 500);

    const signUrl = `${PUBLIC_BASE}/broker/agreement/${agreement.id}`;

    if (body.send_email) {
      try {
        await sendViaResend({
          to: body.broker_email,
          subject: `${title} — JBJ GLOBAL REAL ESTATE`,
          html: emailShell({ title, signUrl, splits: body.splits, deal_ref: body.deal_ref }),
        });
      } catch (e) {
        console.error("commission email failed", e);
      }
    }

    await admin.from("crm_audit_logs").insert({
      actor_id: auth.userId,
      action: "broker_commission_create",
      entity_type: "crm_broker_commission_agreement",
      entity_id: agreement.id,
      details: { broker_user_id: body.broker_user_id, splits: body.splits, sent: !!body.send_email },
    });

    return json({ ok: true, agreement_id: agreement.id, sign_url: signUrl });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function renderAgreementHtml(args: { title: string; deal_ref?: string; splits: Split[]; broker_name: string }) {
  const rows = args.splits
    .map(
      (s) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #EFE6D6;">${escape(s.party)}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #EFE6D6;color:#1A1A1A;">${escape(s.role ?? "")}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #EFE6D6;text-align:right;font-weight:600;">${s.percent}%</td></tr>`
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escape(args.title)}</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#FDFBF7;color:#1A1A1A;margin:0;padding:32px;">
  <div style="max-width:720px;margin:0 auto;background:#FFFFFF;border:1px solid #EFE6D6;">
    <div style="padding:24px 32px;border-bottom:1px solid #B89555;">
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1A1A1A;">JBJ GLOBAL REAL ESTATE</div>
      <h1 style="font-size:22px;margin:8px 0 0;font-weight:600;">${escape(args.title)}</h1>
      ${args.deal_ref ? `<div style="font-size:12px;color:#1A1A1A;opacity:.7;margin-top:4px;">Deal reference: ${escape(args.deal_ref)}</div>` : ""}
    </div>
    <div style="padding:24px 32px;">
      <p style="margin:0 0 16px;">This agreement records the agreed commission split between the parties named below for the transaction referenced above.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #EFE6D6;">
        <thead><tr style="background:#F7F2EA;"><th style="text-align:left;padding:8px 12px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Party</th>
        <th style="text-align:left;padding:8px 12px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Role</th>
        <th style="text-align:right;padding:8px 12px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Share</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:24px 0 8px;font-size:13px;color:#1A1A1A;opacity:.8;">By signing, the broker (${escape(args.broker_name)}) acknowledges these terms and confirms binding acceptance.</p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #EFE6D6;font-size:11px;color:#1A1A1A;opacity:.6;">© JBJ GLOBAL REAL ESTATE · Generated electronically</div>
  </div>
</body></html>`;
}

function emailShell(args: { title: string; signUrl: string; splits: Split[]; deal_ref?: string }) {
  return `<div style="font-family:Inter,Arial,sans-serif;background:#FDFBF7;padding:32px;color:#1A1A1A;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #EFE6D6;padding:32px;">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</div>
      <h1 style="font-size:20px;margin:8px 0 16px;">${escape(args.title)}</h1>
      <p style="margin:0 0 16px;">A commission split agreement has been prepared for your review and signature.</p>
      ${args.deal_ref ? `<p style="margin:0 0 8px;font-size:13px;">Deal: <strong>${escape(args.deal_ref)}</strong></p>` : ""}
      <p style="margin:0 0 24px;font-size:13px;">Total split: ${args.splits.map((s) => `${escape(s.party)} ${s.percent}%`).join(" · ")}</p>
      <a href="${args.signUrl}" style="display:inline-block;padding:12px 22px;background:#1A1A1A;color:#FFFFFF;text-decoration:none;border:1px solid #B89555;font-size:13px;letter-spacing:.06em;text-transform:uppercase;">Review &amp; sign</a>
      <p style="margin:24px 0 0;font-size:11px;color:#1A1A1A;opacity:.6;">If the button does not work, open: ${args.signUrl}</p>
    </div>
  </div>`;
}

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
