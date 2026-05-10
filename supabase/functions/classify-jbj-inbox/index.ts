// Pulls the latest Gmail messages, filters to JBJ-related ones, classifies
// into categories (contracts, registrations, opportunities, partnerships,
// careers, other) with action status, and upserts into email_inbox_items.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

interface GmailHeader { name: string; value: string }
interface GmailPart {
  filename?: string;
  mimeType?: string;
  body?: { attachmentId?: string; data?: string; size?: number };
  parts?: GmailPart[];
}

const JBJ_TOKENS = [
  "jbj",
  "jbjglobal",
  "jbj global",
  "jbj global real estate",
  "jane aboujaoude",
  "info@jbj.ae",
  "contact@jbj.ae",
  "jbj.ae",
];

type Category =
  | "contracts"
  | "registrations"
  | "brokerages"
  | "new_launches"
  | "projects_inventory"
  | "commission"
  | "events"
  | "opportunities"
  | "partnerships"
  | "careers"
  | "other";

// Order matters — first match wins. More specific buckets come first.
const CATEGORY_RULES: Array<{ category: Category; patterns: RegExp[] }> = [
  {
    category: "contracts",
    patterns: [
      /^\s*signed\s*[:\-–]/i,
      /\bsigned\b[^.\n]{0,40}\b(agreement|contract|mou|addendum|authori[sz]ation)\b/i,
      /\b(agreement|contract|mou|addendum)\b[^.\n]{0,40}\bsigned\b/i,
      /\bfully executed\b/i,
      /\bexecuted (agreement|contract)\b/i,
      /\bcountersigned\b/i,
      /\bdocusign\b.*\b(completed|signed|finalized)\b/i,
      /\badobesign\b/i,
      /\becho ?sign\b/i,
      /\bpandadoc\b/i,
    ],
  },
  {
    category: "commission",
    patterns: [
      /\bcommission (structure|sheet|slab|breakdown|payout|update)\b/i,
      /\b(\d+(\.\d+)?\s?%)\s*commission\b/i,
      /\bcommission\b[^.\n]{0,40}\b(approved|paid|invoice|claim)\b/i,
      /\bpayout (statement|schedule)\b/i,
    ],
  },
  {
    category: "events",
    patterns: [
      /\b(invite|invitation) to\b[^.\n]{0,40}\b(launch|event|site visit|preview|broker event)\b/i,
      /\bbroker event\b/i,
      /\bsite visit\b/i,
      /\bproject preview\b/i,
      /\bsales gallery (visit|tour)\b/i,
      /\brsvp\b[^.\n]{0,40}\b(launch|event)\b/i,
    ],
  },
  {
    category: "new_launches",
    patterns: [
      /\bnew (launch|tower|phase|release)\b/i,
      /\bpre[- ]launch\b/i,
      /\bgrand launch\b/i,
      /\boff[- ]plan launch\b/i,
      /\bcoming soon\b[^.\n]{0,40}\b(project|tower|phase)\b/i,
    ],
  },
  {
    category: "projects_inventory",
    patterns: [
      /\b(inventory|availability) (sheet|list|update)\b/i,
      /\b(price|payment) plan\b/i,
      /\bbrochure\b/i,
      /\bfact ?sheet\b/i,
      /\bunit (mix|list|availability)\b/i,
      /\bfloor ?plan(s)?\b/i,
      /\bmaster ?plan\b/i,
    ],
  },
  {
    category: "registrations",
    patterns: [
      /\b(broker|agency|agent) registration\b/i,
      /\bregistration (form|certificate|confirmation)\b/i,
      /\bregister (your )?(agency|company|brokerage)\b/i,
      /\bprincipal broker\b/i,
      /\brera\b/i,
      /\bregistered (with|as)\b/i,
      /\bonboarded\b/i,
      /\bchannel partner\b/i,
    ],
  },
  {
    category: "brokerages",
    patterns: [
      /\b(brokerage|agency)\b[^.\n]{0,60}\b(register|registration|partner|onboard|cooperat)/i,
      /\bco[- ]?brok(e|ing)\b/i,
      /\bsub[- ]?broker\b/i,
      /\bagency cooperation\b/i,
    ],
  },
  {
    category: "opportunities",
    patterns: [
      /\beoi\b/i,
      /\ballocation\b/i,
      /\bproject brief\b/i,
      /\boff[- ]plan opportunity\b/i,
      /\bexclusive (deal|allocation|inventory)\b/i,
    ],
  },
  {
    category: "partnerships",
    patterns: [
      /\bpartnership\b/i,
      /\bcollaborat(e|ion)\b/i,
      /\bmou\b/i,
      /\bjoint venture\b/i,
      /\breferral (program|agreement)\b/i,
    ],
  },
  {
    category: "careers",
    patterns: [
      /\b(cv|resume|curriculum vitae)\b/i,
      /\bapplication for\b/i,
      /\bjob (application|opening|opportunity)\b/i,
      /\bhiring\b/i,
      /\brecruiter\b/i,
      /\bcandidate\b/i,
    ],
  },
];

const AWAITING_YOU = [
  /\bplease (sign|review|confirm|complete|return)\b/i,
  /\bkindly (sign|review|confirm|complete)\b/i,
  /\bawaiting (your|the) (signature|response|reply)\b/i,
  /\bneed (your|us) (?:to )?(sign|review|confirm)\b/i,
  /\baction required\b/i,
  /\bcould you (please )?(send|share|forward)\b/i,
];
const AWAITING_THEM = [
  /\bwe (?:have|'ve) received\b/i,
  /\bwill (?:revert|come back|get back)\b/i,
  /\bunder review\b/i,
  /\bthank you for (?:your|the)\b/i,
];

const REGISTERED_HINTS = [
  /\byou are (?:now )?(?:registered|listed|approved|active)\b/i,
  /\bregistration (?:is )?(?:complete|approved|confirmed|active)\b/i,
  /\bsuccessfully registered\b/i,
  /\bwelcome to (?:our|the) (?:broker|agency) (?:portal|network)\b/i,
];

function header(headers: GmailHeader[], name: string) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function collectAttachments(p: GmailPart | undefined): Array<{ filename: string; mimeType: string }> {
  if (!p) return [];
  const out: Array<{ filename: string; mimeType: string }> = [];
  const walk = (n: GmailPart) => {
    if (n.filename) out.push({ filename: n.filename, mimeType: n.mimeType || "" });
    n.parts?.forEach(walk);
  };
  walk(p);
  return out;
}

// Real-estate positive signals — any one is enough.
const RE_SIGNALS: RegExp[] = [
  /\b(real ?estate|property|properties|listing|listings)\b/i,
  /\b(developer|agency|brokerage|broker)\b/i,
  /\b(project|tower|community|villa|apartment|penthouse|townhouse)\b/i,
  /\b(launch|pre[- ]launch|off[- ]plan|inventory|allocation|eoi|payment plan)\b/i,
  /\b(brochure|fact ?sheet|floor ?plan|master ?plan|unit mix)\b/i,
  /\b(commission|payout|registration|mou|agreement|contract|addendum|authori[sz]ation)\b/i,
  /\b(rera|dld|adrec|dubai land department|trakheesi)\b/i,
  /\b(handover|service charge|escrow)\b/i,
  /\b(site visit|sales gallery|broker event)\b/i,
];

// Domains / sender patterns that are never real-estate.
const NOISE_DOMAINS = new Set([
  "linkedin.com", "google.com", "googlemail.com", "accounts.google.com",
  "apple.com", "microsoft.com", "office365.com", "amazon.com", "amazonses.com",
  "facebook.com", "facebookmail.com", "instagram.com", "tiktok.com", "x.com", "twitter.com",
  "youtube.com", "spotify.com", "netflix.com",
  "uber.com", "careem.com", "talabat.com", "noon.com", "amazon.ae",
  "paypal.com", "stripe.com", "intuit.com", "revolut.com",
  "github.com", "gitlab.com", "atlassian.com", "notion.so", "figma.com",
  "openai.com", "anthropic.com",
]);
const NOISE_SUBJECT = [
  /\b(newsletter|unsubscribe|verify your email|password reset|security alert|sign[- ]in (attempt|alert))\b/i,
  /\b(receipt|invoice number|your order|shipment|tracking)\b/i,
  /\b(weekly digest|monthly digest|daily digest)\b/i,
  /\b(promo code|coupon|black friday|sale ends)\b/i,
];

function isJbjRelated(
  haystack: string,
  knownDeveloperDomains: Set<string>,
  fromDomain: string,
  subject: string,
): boolean {
  const h = haystack.toLowerCase();
  // Hard blocklist first.
  if (fromDomain && NOISE_DOMAINS.has(fromDomain)) return false;
  if (NOISE_SUBJECT.some((p) => p.test(subject))) return false;

  // Strong signals: JBJ tokens OR known developer domain (always pass).
  if (JBJ_TOKENS.some((t) => h.includes(t))) return true;
  if (fromDomain && knownDeveloperDomains.has(fromDomain)) return true;

  // Otherwise require an explicit real-estate signal in subject/snippet.
  return RE_SIGNALS.some((p) => p.test(h));
}

function classify(subject: string, snippet: string, attachments: Array<{ filename: string }>): Category {
  const text = `${subject}\n${snippet}`;
  // Attachments with contract-like names
  if (attachments.some((a) => /contract|agreement|signed|executed/i.test(a.filename))) {
    if (/sign(ed)?|executed|complete/i.test(text)) return "contracts";
  }
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.category;
  }
  return "other";
}

function inferStatus(subject: string, snippet: string, category: Category): { status: string; action_required: string | null } {
  const text = `${subject}\n${snippet}`;
  if (category === "contracts" && /signed|executed|completed/i.test(text)) {
    return { status: "signed", action_required: null };
  }
  if (REGISTERED_HINTS.some((p) => p.test(text))) {
    return { status: "registered", action_required: null };
  }
  if (AWAITING_YOU.some((p) => p.test(text))) {
    return { status: "awaiting_you", action_required: "Reply or sign" };
  }
  if (AWAITING_THEM.some((p) => p.test(text))) {
    return { status: "awaiting_them", action_required: null };
  }
  return { status: "info_only", action_required: null };
}

function parseFromHeader(raw: string) {
  const m = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { name: "", email: raw.trim().toLowerCase() };
}

function tokenise(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((t) => t.length >= 3);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (!LOVABLE_API_KEY || !GMAIL_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "Gmail is not connected." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load developers for matching + domains
    const { data: devs } = await admin
      .from("crm_developer_registry")
      .select("id, developer_name, developer_email, channel_department_email")
      .eq("owner_id", user.id);
    const developers = devs || [];
    const devDomains = new Set<string>();
    for (const d of developers) {
      for (const e of [d.developer_email, d.channel_department_email]) {
        const dom = (e || "").split("@")[1]?.toLowerCase();
        if (dom) devDomains.add(dom);
      }
    }

    // Pull recent inbox
    const q = "newer_than:60d";
    const listRes = await fetch(`${GATEWAY}/users/me/messages?maxResults=100&q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GMAIL_KEY },
    });
    if (!listRes.ok) {
      const t = await listRes.text();
      return new Response(JSON.stringify({ ok: false, error: `Gmail list failed: ${t}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const listJson = await listRes.json() as { messages?: Array<{ id: string; threadId: string }> };
    const ids = (listJson.messages || []).map((m) => m.id);

    let scanned = 0;
    let inserted = 0;
    let skipped = 0;

    for (const id of ids) {
      scanned++;
      const { data: existing } = await admin
        .from("email_inbox_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("gmail_message_id", id)
        .maybeSingle();
      if (existing) { skipped++; continue; }

      const detRes = await fetch(`${GATEWAY}/users/me/messages/${id}?format=full`, {
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GMAIL_KEY },
      });
      if (!detRes.ok) continue;
      const det = await detRes.json();
      const headers = (det.payload?.headers ?? []) as GmailHeader[];
      const subject = header(headers, "Subject") || "(no subject)";
      const fromRaw = header(headers, "From");
      const { name, email } = parseFromHeader(fromRaw);
      const fromDomain = email.split("@")[1] || "";
      const snippet: string = det.snippet || "";
      const attachments = collectAttachments(det.payload);
      const receivedAt = det.internalDate ? new Date(parseInt(det.internalDate, 10)).toISOString() : new Date().toISOString();

      const haystack = `${subject}\n${snippet}\n${name} ${email}`;
      const jbj = isJbjRelated(haystack, devDomains, fromDomain);
      if (!jbj) { continue; }

      const category = classify(subject, snippet, attachments);
      const { status, action_required } = inferStatus(subject, snippet, category);

      // Match developer (token overlap + email/domain)
      let linkedDev: string | null = null;
      let bestScore = 0;
      for (const d of developers) {
        const devEmail = (d.developer_email || "").toLowerCase();
        const devDom = devEmail.split("@")[1] || "";
        const devTokens = tokenise(d.developer_name || "");
        let score = 0;
        if (devEmail && haystack.toLowerCase().includes(devEmail)) score += 0.7;
        if (devDom && devDom === fromDomain) score += 0.5;
        if (devTokens.length) {
          const hits = devTokens.filter((t) => haystack.toLowerCase().includes(t)).length;
          score += Math.min(0.5, (hits / devTokens.length) * 0.5);
        }
        if (score > bestScore) { bestScore = score; linkedDev = d.id; }
      }
      const confidence = Math.min(1, bestScore);
      const linkUrl = (snippet.match(/https?:\/\/[^\s<>"')]+/) || [])[0] || null;

      await admin.from("email_inbox_items").insert({
        user_id: user.id,
        gmail_message_id: id,
        gmail_thread_id: det.threadId,
        category,
        status,
        action_required,
        suggested_reply: null,
        linked_developer_id: bestScore >= 0.5 ? linkedDev : null,
        linked_contract_url: category === "contracts" ? linkUrl : null,
        confidence,
        received_at: receivedAt,
        raw_subject: subject,
        from_email: email,
        from_name: name,
        snippet: snippet.slice(0, 500),
        attachments,
        is_jbj_related: true,
      });
      inserted++;

      // If REGISTERED reply detected and linked to a developer → update CRM
      if (status === "registered" && bestScore >= 0.5 && linkedDev) {
        await admin
          .from("crm_developer_registry")
          .update({
            registration_status: "registered",
            registered_at: new Date().toISOString(),
          })
          .eq("id", linkedDev)
          .is("registered_at", null);
        await admin.from("developer_registration_sync_logs").insert({
          user_id: user.id,
          developer_id: linkedDev,
          gmail_message_id: id,
          gmail_thread_id: det.threadId,
          direction: "in",
          outcome: "registered",
          parsed_intent: "registered",
          detail: { subject, from: email },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, scanned, inserted, skipped }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
