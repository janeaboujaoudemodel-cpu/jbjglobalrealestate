/**
 * CRM Email Sync — pulls unread Gmail messages, classifies the sender's
 * intent with Lovable AI, and updates matching CRM records (developers,
 * brokerages, clients) accordingly.
 *
 * Triggered by pg_cron every 15 minutes. Also callable manually by the owner.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

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

const classifyWithAI = async (subject: string, body: string): Promise<{ intent: string; confidence: number; reason: string }> => {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return { intent: "no_match", confidence: 0, reason: "No AI key" };

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
      console.error("AI classify failed", res.status, await res.text());
      return { intent: "no_match", confidence: 0, reason: "AI error" };
    }
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);
    return {
      intent: parsed.intent || "no_match",
      confidence: Number(parsed.confidence) || 0,
      reason: parsed.reason || "",
    };
  } catch (e) {
    console.error("AI classify exception", e);
    return { intent: "no_match", confidence: 0, reason: String(e) };
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GMAIL_API_KEY) {
      return new Response(JSON.stringify({ error: "Gmail connector not configured" }), { status: 500, headers: corsHeaders });
    }

    const gmailHeaders = {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GMAIL_API_KEY,
      "Content-Type": "application/json",
    };

    // 1. List recent unread inbound messages
    const listRes = await fetch(
      `${GMAIL_GATEWAY}/users/me/messages?maxResults=25&q=is:unread+newer_than:2d+in:inbox`,
      { headers: gmailHeaders },
    );
    if (!listRes.ok) {
      const t = await listRes.text();
      console.error("Gmail list failed", listRes.status, t);
      return new Response(JSON.stringify({ error: "Gmail list failed", details: t }), { status: 502, headers: corsHeaders });
    }
    const listJson = await listRes.json();
    const messages: { id: string }[] = listJson.messages || [];

    const results: any[] = [];

    for (const m of messages) {
      try {
        const detailRes = await fetch(`${GMAIL_GATEWAY}/users/me/messages/${m.id}?format=full`, { headers: gmailHeaders });
        if (!detailRes.ok) continue;
        const detail = await detailRes.json();

        const headers = detail?.payload?.headers || [];
        const getH = (n: string) => headers.find((h: any) => h.name?.toLowerCase() === n.toLowerCase())?.value || "";
        const fromRaw = getH("From");
        const subject = getH("Subject");
        const { email: fromEmail, name: fromName } = parseFromAddress(fromRaw);
        if (!fromEmail) continue;

        const body = extractBody(detail?.payload) || detail?.snippet || "";

        // 2. Match to a CRM record
        const fromDomain = fromEmail.split("@")[1] || "";
        let matched: { table: string; entityType: string; row: any } | null = null;

        // Try developer_registry by email or domain
        const { data: devs } = await service
          .from("crm_developer_registry").select("*")
          .or(`developer_email.ilike.%${fromEmail}%,developer_email.ilike.%@${fromDomain}`)
          .limit(1);
        if (devs?.[0]) matched = { table: "crm_developer_registry", entityType: "developer_registry", row: devs[0] };

        if (!matched) {
          const { data: brokers } = await service
            .from("crm_brokerages").select("*")
            .or(`primary_contact->>email.ilike.%${fromEmail}%,website.ilike.%${fromDomain}%`)
            .limit(1);
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
        const ai = await classifyWithAI(subject, body);

        // 4. Update record status if confident
        let newStatus = "";
        if (matched && ai.intent !== "no_match" && ai.confidence >= 0.5) {
          const map = matched.entityType === "developer_registry" ? STATUS_MAP_DEV
            : matched.entityType === "brokerage" ? STATUS_MAP_BROKERAGE
            : STATUS_MAP_CLIENT;
          newStatus = map[ai.intent] || "";
          if (newStatus && newStatus !== matched.row.status) {
            await service.from(matched.table).update({
              status: newStatus,
              last_interaction_at: new Date().toISOString(),
              last_email_synced_at: new Date().toISOString(),
              last_inbound_subject: subject,
              last_inbound_at: new Date().toISOString(),
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
              last_inbound_subject: subject,
              last_inbound_at: new Date().toISOString(),
            }).eq("id", matched.row.id);
          }
        }

        // 5. Log inbound message (idempotent via unique external_message_id)
        if (ownerId) {
          await service.from("crm_relationship_email_log").insert({
            owner_id: ownerId,
            entity_type: matched?.entityType || null,
            entity_id: matched?.row?.id || null,
            direction: "inbound",
            sent_via: "gmail",
            external_message_id: m.id,
            thread_id: detail?.threadId || null,
            from_email: fromEmail,
            to_emails: getH("To") ? [getH("To")] : [],
            subject,
            body_snippet: body.slice(0, 500),
            detected_status: newStatus || null,
            detected_signal: ai.intent,
            sent_at: new Date().toISOString(),
          });
        }

        // 6. Mark Gmail message as read so we don't reprocess
        await fetch(`${GMAIL_GATEWAY}/users/me/messages/${m.id}/modify`, {
          method: "POST", headers: gmailHeaders,
          body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
        });

        results.push({
          gmail_id: m.id, from: fromEmail, subject,
          matched: matched ? { type: matched.entityType, id: matched.row.id, name: matched.row.developer_name || matched.row.company_name || matched.row.full_name } : null,
          ai_intent: ai.intent, ai_confidence: ai.confidence,
          new_status: newStatus || null,
        });
      } catch (e) {
        console.error("Per-message error", e);
        results.push({ gmail_id: m.id, error: String(e) });
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
