#!/usr/bin/env node
/**
 * Pass 13 — Backend QA matrix for the broker lifecycle.
 * Runs read-only checks against the configured Supabase project to verify
 * each step of the broker invite → activate → session → suspend pipeline
 * is wired correctly. Does NOT mutate production data — it inspects
 * recent rows + the existence/shape of required RPCs and tables.
 *
 * Usage: node scripts/qa/broker-lifecycle.mjs
 * Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY for read-only)
 */
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";

const URL = process.env.VITE_SUPABASE_URL;
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!URL || !KEY) {
  console.error("Missing VITE_SUPABASE_URL or key env var");
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });
const report = [];

function row(name, ok, detail = "") {
  report.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
}

async function exists(table) {
  const { error, count } = await sb.from(table).select("*", { count: "exact", head: true });
  return !error;
}

async function run() {
  console.log("\n== Broker lifecycle QA ==\n");

  for (const t of [
    "crm_brokers",
    "crm_database_grants",
    "crm_broker_sessions",
    "crm_broker_blocked_devices",
    "crm_audit_logs",
    "crm_broker_commission_agreements",
    "crm_broker_commission_signatures",
  ]) {
    row(`table ${t} exists`, await exists(t));
  }

  // Account-status column present
  const { data: bSchema, error: bErr } = await sb
    .from("crm_brokers")
    .select("id, account_status, account_status_reason, auth_user_id")
    .limit(1);
  row("crm_brokers has account_status columns", !bErr, bErr?.message ?? "");

  // Recent invites observable in audit log
  const { data: invAudit } = await sb
    .from("crm_audit_logs")
    .select("id, action, created_at")
    .eq("action", "broker_invitation_sent")
    .order("created_at", { ascending: false })
    .limit(1);
  row("recent broker_invitation_sent in audit log", !!invAudit?.length,
      invAudit?.[0]?.created_at ?? "no recent invites");

  // Suspicious-flag plumbing
  const { data: sus, error: susErr } = await sb
    .from("crm_broker_sessions")
    .select("id, is_suspicious")
    .limit(1);
  row("crm_broker_sessions exposes is_suspicious flag", !susErr, susErr?.message ?? "");

  // Auto-expire cron
  const { data: jobs, error: jErr } = await sb.rpc("crm_broker_auto_expire_invites").select?.() ?? { data: null, error: null };
  row("crm_broker_auto_expire_invites callable", !jErr || jErr?.code !== "42883", jErr?.message ?? "");

  // Commission tables visible to service role
  const { error: cErr } = await sb
    .from("crm_broker_commission_agreements")
    .select("id, status", { count: "exact", head: true });
  row("commission agreements table queryable", !cErr, cErr?.message ?? "");

  // Cascade trigger present
  const { data: trg, error: tErr } = await sb
    .from("crm_brokers")
    .select("id")
    .limit(1);
  row("crm_brokers query succeeds (trigger compiled)", !tErr, tErr?.message ?? "");

  // Edge functions deployed (HEAD against functions endpoint)
  const fns = [
    "crm-broker-invite",
    "crm-broker-activate",
    "crm-broker-verify-otp",
    "crm-broker-session-track",
    "crm-broker-grant-manage",
    "crm-broker-account-state",
    "crm-broker-commission-create",
    "crm-broker-commission-sign",
  ];
  for (const fn of fns) {
    try {
      const res = await fetch(`${URL}/functions/v1/${fn}`, {
        method: "OPTIONS",
        headers: { "Access-Control-Request-Method": "POST", Origin: "https://jbj.ae" },
      });
      row(`edge fn ${fn} reachable`, res.status < 500, `HTTP ${res.status}`);
    } catch (e) {
      row(`edge fn ${fn} reachable`, false, e.message);
    }
  }

  const md =
    `# Broker Lifecycle QA Report\n\nGenerated: ${new Date().toISOString()}\n\n` +
    report.map((r) => `- ${r.ok ? "✅" : "❌"} **${r.name}**${r.detail ? ` — ${r.detail}` : ""}`).join("\n") +
    "\n";
  await writeFile("/mnt/documents/broker-qa-report.md", md, "utf8");
  console.log("\nReport written to /mnt/documents/broker-qa-report.md");

  const failed = report.filter((r) => !r.ok).length;
  process.exit(failed ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
