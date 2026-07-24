/**
 * CRM Email Sync — pulls unread Gmail + Outlook messages, classifies the sender's
 * intent with Lovable AI, and updates matching CRM records (developers,
 * brokerages, clients) accordingly.
 *
 * Triggered by pg_cron every 15 minutes. Also callable manually by the owner.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_BASE = "https://connector-gateway.lovable.dev";
const GMAIL_GATEWAY = `${GATEWAY_BASE}/google_mail/gmail/v1`;
const OUTLOOK_GATEWAY = `${GATEWAY_BASE}/microsoft_outlook`;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type SyncMessage = {
  source: "gmail" | "outlook";
  id: string;
  threadId: string | null;
  fromRaw: string;
  toEmails: string[];
  subject: string;
  body: string;
  receivedAt: string | null;
  isRead: boolean;
  markRead: () => Promise<void>;
};

type SyncOptions = { maxResults: number; lookbackDays: number };

const OWN_MAILBOXES = new Set([
  "helpdesk@jbj.ae",
  "contact@jbj.ae",
  "jane@jbj.ae",
  "partnerships@maisonjane.ae",
]);

const FREE_MAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com", "aol.com", "msn.com",
]);

const normalizedDomain = (email: string) => (email.split("@")[1] || "").toLowerCase();
const usableDomain = (email: string) => {
  const domain = normalizedDomain(email);
  return domain && !FREE_MAIL_DOMAINS.has(domain) ? domain : "";
};

const decodeBase64Url = (s: string) => {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad + "=".repeat((4 - pad.length % 4) % 4);
  try {
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  } catch { return ""; }
};

const extractBody = (payload: any): string => {
  if (!payload) return "";
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  if (Array.isArray(payload.parts)) {
    // prefer text/plain, fallback to text/html stripped
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);
    const html = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (html?.body?.data) return decodeBase64Url(html.body.data).replace(/<[^>]+>/g, " ");
    for (const p of payload.parts) {
      const inner = extractBody(p);
      if (inner) return inner;
    }
  }
  return "";
};

const parseFromAddress = (raw: string): { name: string; email: string } => {
  const m = raw.match(/^(.*)<(.+?)>\s*$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ""), email: m[2].trim().toLowerCase() };
  return { name: "", email: raw.trim().toLowerCase() };
};

const stripHtml = (html: string) => html.replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ")
  .trim();

const outlookAddress = (value: any) => {
  const address = value?.emailAddress?.address || "";
  const name = value?.emailAddress?.name || "";
  return address ? `${name ? `${name} ` : ""}<${address}>` : "";
};

const STATUS_MAP_DEV: Record<string, string> = {
  registered: "registered",
  rejected: "rejected",
  pending: "under_review",
  documents_requested: "documents_required",
  no_match: "",
};

const STATUS_MAP_BROKERAGE: Record<string, string> = {
  registered: "active_partner",
  rejected: "blacklisted",
  pending: "negotiating",
  documents_requested: "negotiating",
  no_match: "",
};

const STATUS_MAP_CLIENT: Record<string, string> = {
  registered: "qualified",
  rejected: "closed_lost",
  pending: "negotiating",
  documents_requested: "negotiating",
  no_match: "",
};

const ruleBasedClassify = (subject: string, body: string): { intent: string; confidence: number; reason: string; errored: boolean } | null => {
  const text = `${subject}\n${body}`.toLowerCase();
  if (/\b(out of office|automatic reply|auto(?:matic)? response|on leave|away from office)\b/.test(text)) {
    return { intent: "no_match", confidence: 0.95, reason: "Automatic reply", errored: false };
  }
  if (/\b(successfully registered|registration approved|approved as|registered as|agency code|channel partner code|registration number|thank you for registering)\b/.test(text)) {
    return { intent: "registered", confidence: 0.9, reason: "Registration approval detected", errored: false };
  }
  if (/\b(required documents|mandatory documents|pending documents|please provide|kindly provide|share the.*documents|trade license|rera|iban certificate|visa|noc|kyc|agreement|sign(?:ed)? and stamp|brokerage agreement)\b/.test(text)) {
    return { intent: "documents_requested", confidence: 0.86, reason: "Documents or agreement requested", errored: false };
  }
  if (/\b(under review|we will review|will get back|in process|processing|submitted|received your request|acknowledge)\b/.test(text)) {
    return { intent: "pending", confidence: 0.78, reason: "Pending review detected", errored: false };
  }
  if (/\b(rejected|declined|not accepting|cannot proceed|unable to register|expired)\b/.test(text)) {
    return { intent: "rejected", confidence: 0.8, reason: "Rejection or expiry detected", errored: false };
  }
  return null;
};

const campaignEntityType = (entityType: string) => {
  if (entityType === "developer_registry") return "developer";
  if (entityType === "brokerage") return "brokerage";
  if (entityType === "client") return "client";
  return entityType;
};

const updateCampaignSpineForReply = async (
  service: any,
  matched: { table: string; entityType: string; row: any } | null,
  fromEmail: string,
  message: SyncMessage,
  ai: { intent: string; confidence: number; reason: string; errored: boolean },
) => {
  if (ai.errored || ai.intent === "no_match") return 0;

  const domain = usableDomain(fromEmail);
  let query = service
    .from("jbj_campaign_recipients")
    .select("id,metadata")
    .neq("provider", "gmail_legacy")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (matched?.row?.id) {
    query = query
      .eq("entity_type", campaignEntityType(matched.entityType))
      .eq("entity_id", matched.row.id);
  } else if (domain) {
    query = query.or(`email_norm.eq.${fromEmail},email.ilike.%@${domain}`);
  } else {
    query = query.eq("email_norm", fromEmail);
  }

  const { data: recipients, error } = await query;
  if (error) {
    console.error("Campaign reply lookup failed", error);
    return 0;
  }

  const rows = recipients ?? [];
  for (const recipient of rows) {
    const metadata = {
      ...(recipient.metadata || {}),
      latest_reply: message.body.slice(0, 1200),
      latest_reply_subject: message.subject,
      latest_reply_from: fromEmail,
      latest_reply_at: message.receivedAt || new Date().toISOString(),
      ai_summary: ai.reason,
      ai_next_action: ai.intent === "documents_requested"
        ? "Review requested documents and prepare the compliance reply."
        : ai.intent === "registered"
        ? "Confirm registration details and update the developer card."
        : "Review the response and prepare the next follow-up.",
      ai_draft_reply: ai.intent === "documents_requested"
        ? "Thank you for sharing the requirements. We will review the requested documents and send the completed pack back on this thread."
        : ai.intent === "registered"
        ? "Thank you for confirming our registration. Please share the agency code, broker portal access, WhatsApp group details, and current marketing material link."
        : "Thank you for your update. Please confirm the next step required from JBJ Global Real Estate.",
    };
    await service.from("jbj_campaign_recipients").update({
      reply_status: "human_reply",
      replied_at: message.receivedAt || new Date().toISOString(),
      thread_id: message.threadId,
      metadata,
      updated_at: new Date().toISOString(),
    }).eq("id", recipient.id);
  }
  return rows.length;
};

const listGmailMessages = async (headers: Record<string, string>, opts: SyncOptions): Promise<SyncMessage[]> => {
  const listRes = await fetch(
    `${GMAIL_GATEWAY}/users/me/messages?maxResults=${opts.maxResults}&q=newer_than:${opts.lookbackDays}d+in:inbox`,
    { headers },
  );
  if (!listRes.ok) {
    const detail = await listRes.text();
    console.error("Gmail list failed", listRes.status, detail);
    return [];
  }

  const listJson = await listRes.json();
  const messages: { id: string }[] = listJson.messages || [];
  const synced: SyncMessage[] = [];

  for (const message of messages) {
    const detailRes = await fetch(`${GMAIL_GATEWAY}/users/me/messages/${message.id}?format=full`, { headers });
    if (!detailRes.ok) continue;

    const detail = await detailRes.json();
    const rawHeaders = detail?.payload?.headers || [];
    const getH = (name: string) => rawHeaders.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
    const fromRaw = getH("From");
    if (!fromRaw) continue;
    const labels = detail?.labelIds || [];

    synced.push({
      source: "gmail",
      id: message.id,
      threadId: detail?.threadId || null,
      fromRaw,
      toEmails: getH("To") ? [getH("To")] : [],
      subject: getH("Subject"),
      body: extractBody(detail?.payload) || detail?.snippet || "",
      receivedAt: detail?.internalDate ? new Date(Number(detail.internalDate)).toISOString() : null,
      isRead: !labels.includes("UNREAD"),
      markRead: async () => {
        await fetch(`${GMAIL_GATEWAY}/users/me/messages/${message.id}/modify`, {
          method: "POST",
          headers,
          body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
        });
      },
    });
  }

  return synced;
};

const listOutlookMessages = async (headers: Record<string, string>, opts: SyncOptions): Promise<SyncMessage[]> => {
  const since = new Date(Date.now() - opts.lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    "$top": String(opts.maxResults),
    "$select": "id,conversationId,subject,from,toRecipients,body,bodyPreview,receivedDateTime,isRead",
    "$orderby": "receivedDateTime desc",
    "$filter": `receivedDateTime ge ${since}`,
  });
  const listRes = await fetch(`${OUTLOOK_GATEWAY}/me/messages?${params.toString()}`, { headers });
  if (!listRes.ok) {
    const detail = await listRes.text();
    console.error("Outlook list failed", listRes.status, detail);
    return [];
  }

  const listJson = await listRes.json();
  const messages: any[] = listJson.value || [];

  return messages.map((message) => {
    const bodyContent = message?.body?.content || message?.bodyPreview || "";
    const body = message?.body?.contentType === "html" || /<[^>]+>/.test(bodyContent)
      ? stripHtml(bodyContent)
      : bodyContent;

    return {
      source: "outlook" as const,
      id: message.id,
      threadId: message.conversationId || null,
      fromRaw: outlookAddress(message.from),
      toEmails: Array.isArray(message.toRecipients)
        ? message.toRecipients.map(outlookAddress).filter(Boolean)
        : [],
      subject: message.subject || "",
      body,
      receivedAt: message.receivedDateTime || null,
      isRead: Boolean(message.isRead),
      markRead: async () => {
        await fetch(`${OUTLOOK_GATEWAY}/me/messages/${encodeURIComponent(message.id)}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ isRead: true }),
        });
      },
    };
  }).filter((message) => message.id && message.fromRaw);
};

const classifyWithAI = async (subject: string, body: string): Promise<{ intent: string; confidence: number; reason: string; errored: boolean }> => {
  const rule = ruleBasedClassify(subject, body);
  if (rule) return rule;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return { intent: "no_match", confidence: 0, reason: "No AI key", errored: true };

  const prompt = `You classify replies from real-estate developers/brokerages to a brokerage's registration request.

Categories:
- "registered" — recipient confirms we are already registered, or grants registration / agency code now
- "rejected" — recipient declines partnership, says they are closed, or unsuitable
- "pending" — recipient acknowledges, says under review, will get back, requires waiting
- "documents_requested" — recipient asks for additional docs (Trade License, RERA, NOC, signed MOU, etc.)
- "no_match" — out-of-office, autoresponder, spam, marketing, irrelevant

Reply ONLY with strict JSON: {"intent":"...","confidence":0-1,"reason":"short"}.

Subject: ${subject}
Body (truncated):
${body.slice(0, 2000)}`;

  try {
    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("AI classify failed", res.status, detail);
      const reason = res.status === 402
        ? "AI credits depleted (402) — classification deferred"
        : res.status === 429
        ? "AI rate limited (429) — classification deferred"
        : `AI error ${res.status}`;
      return { intent: "unclassified", confidence: 0, reason, errored: true };
    }
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);
    return {
      intent: parsed.intent || "no_match",
      confidence: Number(parsed.confidence) || 0,
      reason: parsed.reason || "",
      errored: false,
    };
  } catch (e) {
    console.error("AI classify exception", e);
    return { intent: "unclassified", confidence: 0, reason: String(e), errored: true };
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Backend credentials are not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const service = createClient(supabaseUrl, serviceKey);
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const opts: SyncOptions = {
      maxResults: Math.max(5, Math.min(35, Number(body?.maxResults ?? 25))),
      lookbackDays: Math.max(1, Math.min(45, Number(body?.lookbackDays ?? 21))),
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    const OUTLOOK_API_KEY = Deno.env.get("MICROSOFT_OUTLOOK_API_KEY");
    if (!LOVABLE_API_KEY || (!GMAIL_API_KEY && !OUTLOOK_API_KEY)) {
      return new Response(JSON.stringify({ error: "No mailbox connector configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages: SyncMessage[] = [];
    if (GMAIL_API_KEY) {
      messages.push(...await listGmailMessages({
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GMAIL_API_KEY,
        "Content-Type": "application/json",
      }, opts));
    }
    if (OUTLOOK_API_KEY) {
      messages.push(...await listOutlookMessages({
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": OUTLOOK_API_KEY,
        "Content-Type": "application/json",
      }, opts));
    }

    const results: any[] = [];

    for (const message of messages) {
      try {
        const { email: fromEmail } = parseFromAddress(message.fromRaw);
        if (!fromEmail) continue;
        if (OWN_MAILBOXES.has(fromEmail)) continue;

        const externalMessageId = message.source === "gmail" ? message.id : `outlook-${message.id}`;
        const { data: existingLog } = await service
          .from("crm_relationship_email_log")
          .select("id,detected_signal")
          .eq("external_message_id", externalMessageId)
          .maybeSingle();
        if (existingLog && existingLog.detected_signal !== "unclassified") {
          results.push({ source: message.source, message_id: message.id, skipped: "already_synced" });
          continue;
        }

        // 2. Match to a CRM record
        const fromDomain = usableDomain(fromEmail);
        let matched: { table: string; entityType: string; row: any } | null = null;

        // Try developer_registry by email or domain
        let devQuery = service
          .from("crm_developer_registry").select("*")
          .or(`developer_email.ilike.%${fromEmail}%,channel_department_email.ilike.%${fromEmail}%`)
          .limit(1);
        if (fromDomain) {
          devQuery = service
            .from("crm_developer_registry").select("*")
            .or(`developer_email.ilike.%${fromEmail}%,channel_department_email.ilike.%${fromEmail}%,developer_email.ilike.%@${fromDomain},website.ilike.%${fromDomain}%`)
            .limit(1);
        }
        const { data: devs } = await devQuery;
        if (devs?.[0]) matched = { table: "crm_developer_registry", entityType: "developer_registry", row: devs[0] };

        if (!matched) {
          const { data: campaignMatches } = await service
            .from("jbj_campaign_recipients")
            .select("entity_type,entity_id,email,email_norm")
            .neq("provider", "gmail_legacy")
            .or(fromDomain ? `email_norm.eq.${fromEmail},email.ilike.%@${fromDomain}` : `email_norm.eq.${fromEmail}`)
            .not("entity_id", "is", null)
            .order("updated_at", { ascending: false })
            .limit(1);
          const campaign = campaignMatches?.[0];
          if (campaign?.entity_id && campaign.entity_type === "developer") {
            const { data: byCampaign } = await service.from("crm_developer_registry").select("*").eq("id", campaign.entity_id).limit(1);
            if (byCampaign?.[0]) matched = { table: "crm_developer_registry", entityType: "developer_registry", row: byCampaign[0] };
          } else if (campaign?.entity_id && campaign.entity_type === "brokerage") {
            const { data: byCampaign } = await service.from("crm_brokerages").select("*").eq("id", campaign.entity_id).limit(1);
            if (byCampaign?.[0]) matched = { table: "crm_brokerages", entityType: "brokerage", row: byCampaign[0] };
          } else if (campaign?.entity_id && campaign.entity_type === "client") {
            const { data: byCampaign } = await service.from("crm_clients").select("*").eq("id", campaign.entity_id).limit(1);
            if (byCampaign?.[0]) matched = { table: "crm_clients", entityType: "client", row: byCampaign[0] };
          }
        }

        if (!matched) {
          let brokerageOr = `email.ilike.%${fromEmail}%,primary_contact->>email.ilike.%${fromEmail}%`;
          if (fromDomain) brokerageOr += `,website.ilike.%${fromDomain}%`;
          const { data: brokers } = await service.from("crm_brokerages").select("*").or(brokerageOr).limit(1);
          if (brokers?.[0]) matched = { table: "crm_brokerages", entityType: "brokerage", row: brokers[0] };
        }

        if (!matched) {
          const { data: clients } = await service
            .from("crm_clients").select("*").eq("email", fromEmail).limit(1);
          if (clients?.[0]) matched = { table: "crm_clients", entityType: "client", row: clients[0] };
        }

        // Always log inbound email (even if no match)
        const ownerId = matched?.row?.owner_id || null;

        // 3. AI classification
        const ai = await classifyWithAI(message.subject, message.body);
        const updatedCampaignRows = await updateCampaignSpineForReply(service, matched, fromEmail, message, ai);

        // 4. Update record status if confident. Skip on AI errors so we don't
        //    mislabel real replies as "no_match" during an outage.
        let newStatus = "";
        if (!ai.errored && matched && ai.intent !== "no_match" && ai.confidence >= 0.5) {
          const map = matched.entityType === "developer_registry" ? STATUS_MAP_DEV
            : matched.entityType === "brokerage" ? STATUS_MAP_BROKERAGE
            : STATUS_MAP_CLIENT;
          newStatus = map[ai.intent] || "";
          if (newStatus && newStatus !== matched.row.status) {
            await service.from(matched.table).update({
              status: newStatus,
              last_interaction_at: message.receivedAt || new Date().toISOString(),
              last_email_synced_at: new Date().toISOString(),
              last_inbound_subject: message.subject,
              last_inbound_at: message.receivedAt || new Date().toISOString(),
            }).eq("id", matched.row.id);

            if (ownerId) {
              await service.from("crm_relationship_status_history").insert({
                owner_id: ownerId,
                entity_type: matched.entityType,
                entity_id: matched.row.id,
                from_status: matched.row.status,
                to_status: newStatus,
                source: "email_ai_sync",
                changed_by: null,
                notes: `AI intent=${ai.intent} (${Math.round(ai.confidence*100)}%) — ${ai.reason}`,
              });
            }
          } else if (matched) {
            await service.from(matched.table).update({
              last_email_synced_at: new Date().toISOString(),
              last_inbound_subject: message.subject,
              last_inbound_at: message.receivedAt || new Date().toISOString(),
            }).eq("id", matched.row.id);
          }
        }

        // 5. Log inbound message (idempotent via unique external_message_id).
        //    On AI error, record signal as "unclassified" so downstream views
        //    don't treat the reply as a genuine "no_match".
        if (ownerId) {
          const { error: logError } = await service.from("crm_relationship_email_log").insert({
            owner_id: ownerId,
            entity_type: matched?.entityType || null,
            entity_id: matched?.row?.id || null,
            direction: "inbound",
            sent_via: message.source,
            external_message_id: externalMessageId,
            thread_id: message.threadId,
            from_email: fromEmail,
            to_emails: message.toEmails,
            subject: message.subject,
            body_snippet: message.body.slice(0, 500),
            detected_status: newStatus || null,
            detected_signal: ai.errored ? "unclassified" : ai.intent,
            sent_at: message.receivedAt || new Date().toISOString(),
          });
          if (logError && logError.code !== "23505") console.error("email log insert failed", logError);
        }

        // 6. Mark mailbox message as read only when classification succeeded.
        //    On AI error we leave it UNREAD so the next run can retry.
        if (!ai.errored && !message.isRead) {
          await message.markRead();
        }

        results.push({
          source: message.source,
          message_id: message.id,
          from: fromEmail,
          subject: message.subject,
          matched: matched ? { type: matched.entityType, id: matched.row.id, name: matched.row.developer_name || matched.row.company_name || matched.row.full_name } : null,
          ai_intent: ai.intent, ai_confidence: ai.confidence, ai_errored: ai.errored,
          new_status: newStatus || null,
          updated_campaign_rows: updatedCampaignRows,
        });
      } catch (e) {
        console.error("Per-message error", e);
        results.push({ source: message.source, message_id: message.id, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-email-sync error", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
