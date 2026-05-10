// Scans the connected Gmail inbox for signed-agreement / signed-contract
// emails, matches them against crm_developer_registry, attaches the
// document URL to the developer, and writes an audit row to
// developer_contract_sync_logs.
//
// Triggered manually from the developer CRM section.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_BASE = "https://connector-gateway.lovable.dev";

// Gmail search query for signed contracts. Covers manual signed PDFs,
// DocuSign, Adobe Sign, PandaDoc and similar completion notifications.
const GMAIL_QUERY =
  '("signed agreement" OR "signed contract" OR "fully executed" OR "executed agreement" OR "contract signed" OR "agreement signed" OR "completed: please docusign" OR "completed via docusign" OR "completed by all parties" OR from:dse_NA1@docusign.net OR from:echosign@echosign.com OR from:adobesign@adobe.com) newer_than:90d';

interface GmailHeader { name: string; value: string }
interface GmailPart {
  filename?: string;
  mimeType?: string;
  body?: { attachmentId?: string; data?: string };
  parts?: GmailPart[];
}

async function gmailSearch(lovableKey: string, gmailKey: string, q: string, max = 50) {
  const url = `${GATEWAY_BASE}/google_mail/gmail/v1/users/me/messages?maxResults=${max}&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": gmailKey },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Gmail search failed [${r.status}]: ${JSON.stringify(j)}`);
  return (j.messages || []) as Array<{ id: string; threadId: string }>;
}

async function gmailGet(lovableKey: string, gmailKey: string, id: string) {
  const url = `${GATEWAY_BASE}/google_mail/gmail/v1/users/me/messages/${id}?format=full`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": gmailKey },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Gmail get failed [${r.status}]: ${JSON.stringify(j)}`);
  return j;
}

function header(headers: GmailHeader[], name: string) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function collectAttachmentNames(payload: GmailPart | undefined): string[] {
  if (!payload) return [];
  const out: string[] = [];
  const walk = (p: GmailPart) => {
    if (p.filename && p.filename.length > 0) out.push(p.filename);
    p.parts?.forEach(walk);
  };
  walk(payload);
  return out;
}

function extractFirstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"')]+/);
  return m ? m[0] : null;
}

function tokenise(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !["the", "and", "for", "ltd", "llc", "real", "estate", "developer", "developers", "properties"].includes(t));
}

function scoreMatch(devName: string, devEmail: string, fromEmail: string, fromName: string, subject: string, snippet: string): number {
  const haystack = `${fromEmail} ${fromName} ${subject} ${snippet}`.toLowerCase();
  let score = 0;
  if (devEmail && haystack.includes(devEmail.toLowerCase())) score += 0.7;
  // Domain match (e.g. emaar.ae)
  const domain = (devEmail || "").split("@")[1]?.toLowerCase();
  const fromDomain = (fromEmail || "").split("@")[1]?.toLowerCase();
  if (domain && fromDomain && domain === fromDomain) score += 0.5;
  // Name token overlap
  const tokens = tokenise(devName);
  const hits = tokens.filter((t) => haystack.includes(t)).length;
  if (tokens.length > 0) score += Math.min(0.5, (hits / tokens.length) * 0.5);
  return Math.min(1, score);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify caller
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY || !GMAIL_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Gmail is not connected — connect Gmail to enable signed-contract sync." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load this user's developer registry rows for matching.
    const { data: devs, error: devErr } = await admin
      .from("crm_developer_registry")
      .select("id, owner_id, developer_name, developer_email, channel_department_email")
      .eq("owner_id", user.id);
    if (devErr) throw devErr;
    const developers = devs || [];

    const messages = await gmailSearch(LOVABLE_API_KEY, GMAIL_KEY, GMAIL_QUERY, 50);

    let imported = 0;
    let matched = 0;
    let needsReview = 0;
    let duplicates = 0;
    const errors: string[] = [];

    for (const m of messages) {
      try {
        // Skip if we've already processed this Gmail message for this user.
        const { data: existing } = await admin
          .from("developer_contract_sync_logs")
          .select("id")
          .eq("user_id", user.id)
          .eq("gmail_message_id", m.id)
          .maybeSingle();
        if (existing) { duplicates++; continue; }

        const detail = await gmailGet(LOVABLE_API_KEY, GMAIL_KEY, m.id);
        const headers = (detail.payload?.headers ?? []) as GmailHeader[];
        const fromHeader = header(headers, "From");
        const subject = header(headers, "Subject") || "(no subject)";
        const snippet: string = detail.snippet || "";
        const fromEmailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
        const fromEmail = (fromEmailMatch[1] || fromHeader).trim().toLowerCase();
        const fromName = fromHeader.replace(/<.*>/, "").trim().replace(/^"|"$/g, "") || fromEmail;
        const attachmentNames = collectAttachmentNames(detail.payload);
        const documentUrl = extractFirstUrl(snippet) || extractFirstUrl(subject);

        // Find best matching developer
        let bestId: string | null = null;
        let bestName: string | null = null;
        let bestEmail: string | null = null;
        let bestScore = 0;
        for (const d of developers) {
          const s = Math.max(
            scoreMatch(d.developer_name || "", d.developer_email || "", fromEmail, fromName, subject, snippet),
            d.channel_department_email
              ? scoreMatch(d.developer_name || "", d.channel_department_email, fromEmail, fromName, subject, snippet)
              : 0
          );
          if (s > bestScore) {
            bestScore = s;
            bestId = d.id;
            bestName = d.developer_name;
            bestEmail = d.developer_email;
          }
        }

        const status =
          bestScore >= 0.7 ? "matched" :
          bestScore >= 0.35 ? "needs_review" :
          "no_match";

        await admin.from("developer_contract_sync_logs").insert({
          user_id: user.id,
          developer_id: status === "matched" ? bestId : null,
          developer_name: bestName,
          developer_email: bestEmail,
          gmail_message_id: m.id,
          gmail_thread_id: m.threadId,
          sender_email: fromEmail,
          sender_name: fromName,
          subject,
          snippet: snippet.slice(0, 500),
          attachment_names: attachmentNames,
          document_url: documentUrl,
          match_confidence: bestScore,
          status,
        });

        imported++;
        if (status === "matched" && bestId) {
          matched++;
          // Update developer with contract info (do not overwrite if already set)
          await admin
            .from("crm_developer_registry")
            .update({
              contract_signed_at: new Date().toISOString(),
              contract_document_url: documentUrl,
              contract_email_subject: subject,
              contract_email_message_id: m.id,
              contract_synced_at: new Date().toISOString(),
            })
            .eq("id", bestId)
            .is("contract_signed_at", null);
        } else if (status === "needs_review") {
          needsReview++;
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "unknown";
        errors.push(`${m.id}: ${msg}`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, scanned: messages.length, imported, matched, needs_review: needsReview, duplicates, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
