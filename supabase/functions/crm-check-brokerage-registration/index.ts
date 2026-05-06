/**
 * CRM Pre-Send Registration Check (Brokerage Outreach)
 *
 * Owner-only. For each brokerage in the request, returns whether they
 * are safe to send the breakfast / partnership outreach to, with reasons.
 *
 * Block reasons:
 *  - do_not_contact            (always block)
 *  - already_partner           (block when variant = brokerage_breakfast_invite,
 *                               warn when variant = brokerage_partnership_intro)
 *  - previous_breakfast_invite (same variant already sent before)
 *
 * Warn reasons:
 *  - lead_exists               (contact email matches an existing CRM lead)
 *  - client_exists             (contact email matches an existing CRM client)
 *  - registered_broker         (contact email matches a registered platform broker)
 *
 * No DB writes. Read-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "janeaboujaoudemodel@gmail.com",
  "infoo.jane@gmail.com",
];

type BrokerageVariant =
  | "brokerage_partnership_intro"
  | "brokerage_breakfast_invite";

type ReasonCode =
  | "do_not_contact"
  | "already_partner"
  | "previous_breakfast_invite"
  | "previous_partnership_intro"
  | "lead_exists"
  | "client_exists"
  | "registered_broker";

interface Reason {
  code: ReasonCode;
  label: string;
  matchedTable?: string;
  matchedId?: string;
  matchedEmail?: string;
}

interface CheckResult {
  brokerageId: string;
  status: "ok" | "warn" | "block";
  reasons: Reason[];
}

interface Body {
  brokerageIds: string[];
  variant: BrokerageVariant;
}

const collectEmails = (b: any): string[] => {
  const set = new Set<string>();
  const push = (v: any) => {
    if (typeof v === "string" && v.includes("@")) {
      set.add(v.trim().toLowerCase());
    }
  };
  push(b?.email);
  push(b?.primary_contact?.email);
  push(b?.secondary_contact?.email);
  return Array.from(set);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("NO_AUTH");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.includes(user.email || "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = (await req.json()) as Body;
    const variant: BrokerageVariant = body?.variant || "brokerage_partnership_intro";
    const ids = Array.isArray(body?.brokerageIds)
      ? body.brokerageIds.filter((x) => typeof x === "string" && x.length > 0)
      : [];
    if (ids.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (ids.length > 500) {
      return new Response(JSON.stringify({ error: "Too many ids (max 500)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load brokerages (only the columns we need)
    const { data: brks, error: brkErr } = await service
      .from("crm_brokerages")
      .select(
        "id, company_name, email, primary_contact, secondary_contact, status, outreach_stage, nda_status, do_not_contact",
      )
      .in("id", ids);
    if (brkErr) throw brkErr;
    const brokerageMap = new Map<string, any>();
    (brks || []).forEach((b: any) => brokerageMap.set(b.id, b));

    // Build a flat list of (brokerageId, email) tuples
    const allEmails = new Set<string>();
    const emailToBrokerages = new Map<string, Set<string>>();
    for (const b of brks || []) {
      for (const e of collectEmails(b)) {
        allEmails.add(e);
        if (!emailToBrokerages.has(e)) emailToBrokerages.set(e, new Set());
        emailToBrokerages.get(e)!.add(b.id);
      }
    }
    const emailList = Array.from(allEmails);

    // Parallel cross-table email lookups (chunked to stay within URL limits)
    const chunk = <T,>(arr: T[], size: number) =>
      arr.length === 0
        ? []
        : Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size),
          );

    const leadHits = new Map<string, { id: string; email: string }>();
    const clientHits = new Map<string, { id: string; email: string }>();
    const brokerHits = new Map<string, { id: string; email: string }>();

    if (emailList.length > 0) {
      // crm_leads.email_lower
      const leadChunks = chunk(emailList, 100);
      for (const c of leadChunks) {
        const { data } = await service
          .from("crm_leads")
          .select("id, email_lower")
          .in("email_lower", c)
          .limit(500);
        (data || []).forEach((r: any) => {
          if (r.email_lower) leadHits.set(r.email_lower, { id: r.id, email: r.email_lower });
        });
      }

      // crm_clients.email (case-insensitive via ilike not feasible for IN — fetch lowercase comparison clientside)
      // We pull all clients whose email is non-null and intersect locally.
      const { data: clientsData } = await service
        .from("crm_clients")
        .select("id, email")
        .not("email", "is", null)
        .limit(5000);
      (clientsData || []).forEach((r: any) => {
        const e = String(r.email || "").trim().toLowerCase();
        if (e && allEmails.has(e)) clientHits.set(e, { id: r.id, email: e });
      });

      // broker_profiles.email
      const { data: brokerData } = await service
        .from("broker_profiles")
        .select("id, email")
        .not("email", "is", null)
        .limit(5000);
      (brokerData || []).forEach((r: any) => {
        const e = String(r.email || "").trim().toLowerCase();
        if (e && allEmails.has(e)) brokerHits.set(e, { id: r.id, email: e });
      });
    }

    // Previous outreach of THIS variant
    const variantSnippetMatch =
      variant === "brokerage_breakfast_invite"
        ? "private breakfast invitation"
        : "channel-partner outreach";
    const { data: priorLogs } = await service
      .from("crm_relationship_email_log")
      .select("entity_id, body_snippet, sent_at")
      .eq("entity_type", "brokerage")
      .eq("direction", "outbound")
      .in("entity_id", ids)
      .ilike("body_snippet", `%${variantSnippetMatch}%`)
      .order("sent_at", { ascending: false });
    const priorByBrokerage = new Map<string, string>();
    (priorLogs || []).forEach((r: any) => {
      if (!priorByBrokerage.has(r.entity_id)) priorByBrokerage.set(r.entity_id, r.sent_at);
    });

    // Build per-brokerage results
    const results: CheckResult[] = ids.map((id) => {
      const b = brokerageMap.get(id);
      const reasons: Reason[] = [];
      let blocked = false;
      let warned = false;

      if (!b) {
        return {
          brokerageId: id,
          status: "block",
          reasons: [
            { code: "do_not_contact", label: "Brokerage not found in CRM" },
          ],
        };
      }

      // 1. do_not_contact
      if (b.do_not_contact) {
        blocked = true;
        reasons.push({
          code: "do_not_contact",
          label: "Marked Do Not Contact in CRM",
        });
      }

      // 2. Already partner / advanced stage
      const advancedStages = new Set([
        "responded",
        "meeting_booked",
        "partner_signed",
      ]);
      const isAdvancedStage =
        b.outreach_stage && advancedStages.has(b.outreach_stage);
      const isActivePartner = b.status === "active" || b.nda_status === "signed";
      if (isActivePartner || isAdvancedStage) {
        const reasonLabel = isActivePartner
          ? `Already ${b.status === "active" ? "an active partner" : "signed NDA"}`
          : `Outreach stage is "${b.outreach_stage}" — beyond cold intro`;
        if (variant === "brokerage_breakfast_invite") {
          blocked = true;
          reasons.push({
            code: "already_partner",
            label: reasonLabel,
            matchedTable: "crm_brokerages",
            matchedId: b.id,
          });
        } else {
          warned = true;
          reasons.push({
            code: "already_partner",
            label: reasonLabel,
            matchedTable: "crm_brokerages",
            matchedId: b.id,
          });
        }
      }

      // 3. Previous identical outreach already sent — warn (allow resend with override),
      // do not hard-block, so the owner can include them deliberately.
      const priorAt = priorByBrokerage.get(id);
      if (priorAt) {
        warned = true;
        const variantWord =
          variant === "brokerage_breakfast_invite"
            ? "breakfast invitation"
            : "partnership intro";
        reasons.push({
          code:
            variant === "brokerage_breakfast_invite"
              ? "previous_breakfast_invite"
              : "previous_partnership_intro",
          label: `This agency already received this ${variantWord} on ${new Date(priorAt).toLocaleDateString()}. Send same email again, or change template.`,
          matchedTable: "crm_relationship_email_log",
        });
      }

      // 4. Cross-table email matches (warn only)
      const emails = collectEmails(b);
      for (const e of emails) {
        const lead = leadHits.get(e);
        if (lead) {
          warned = true;
          reasons.push({
            code: "lead_exists",
            label: `Contact ${e} is already a CRM lead`,
            matchedTable: "crm_leads",
            matchedId: lead.id,
            matchedEmail: e,
          });
        }
        const client = clientHits.get(e);
        if (client) {
          warned = true;
          reasons.push({
            code: "client_exists",
            label: `Contact ${e} is already a CRM client`,
            matchedTable: "crm_clients",
            matchedId: client.id,
            matchedEmail: e,
          });
        }
        const brokerHit = brokerHits.get(e);
        if (brokerHit) {
          warned = true;
          reasons.push({
            code: "registered_broker",
            label: `Contact ${e} is a registered platform broker`,
            matchedTable: "broker_profiles",
            matchedId: brokerHit.id,
            matchedEmail: e,
          });
        }
      }

      const status: CheckResult["status"] = blocked
        ? "block"
        : warned
          ? "warn"
          : "ok";
      return { brokerageId: id, status, reasons };
    });

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-check-brokerage-registration error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
