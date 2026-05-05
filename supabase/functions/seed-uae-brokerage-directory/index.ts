// Seeds public.crm_brokerages with the UAE-wide brokerage directory.
// Uses Perplexity Sonar grounded search to enumerate licensed real-estate brokerages
// per emirate (DLD/RERA, Abu Dhabi DMT, Sharjah/Ajman/RAK/Fujairah/UAQ municipality lists).
// Idempotent: dedupes on (owner_id, rera_license) when a license is known, otherwise
// on (owner_id, lower(company_name)).
//
// Auth: caller must be a JBJ owner / admin. Long-running: returns a job summary.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMIRATE_SOURCES: Record<string, { authority: string; hint: string }> = {
  Dubai: {
    authority: "Dubai Land Department / RERA broker registry",
    hint: "RERA-licensed real estate brokerage offices listed on dubailand.gov.ae and trakheesi (Dubai REST app)",
  },
  "Abu Dhabi": {
    authority: "Department of Municipalities and Transport (DMT) — Abu Dhabi",
    hint: "Real estate brokerage offices licensed by the Abu Dhabi DMT, listed on tamm.abudhabi and dmt.gov.ae",
  },
  Sharjah: {
    authority: "Sharjah Real Estate Registration Department (SRERD)",
    hint: "Brokerage offices licensed by SRERD listed on srerd.gov.ae",
  },
  Ajman: {
    authority: "Ajman Real Estate Regulatory Agency (ARRA)",
    hint: "Brokerage offices licensed by ARRA listed on arra.gov.ae",
  },
  "Ras Al Khaimah": {
    authority: "RAK Municipality — Real Estate Department",
    hint: "Brokerage offices licensed by RAK Municipality listed on mun.rak.ae",
  },
  Fujairah: {
    authority: "Fujairah Municipality — Real Estate Section",
    hint: "Brokerage offices licensed by Fujairah Municipality",
  },
  "Umm Al Quwain": {
    authority: "Umm Al Quwain Municipality — Real Estate Section",
    hint: "Brokerage offices licensed by UAQ Municipality",
  },
};

type Brokerage = {
  company_name: string;
  rera_license: string | null;
  office_address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  emirate: string;
};

async function perplexityListBrokerages(
  emirate: string,
  authority: string,
  hint: string,
  offset: number,
  pageSize: number,
  key: string,
): Promise<Brokerage[]> {
  const schema = {
    type: "object",
    properties: {
      brokerages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company_name: { type: "string" },
            rera_license: { type: ["string", "null"] },
            office_address: { type: ["string", "null"] },
            phone: { type: ["string", "null"] },
            email: { type: ["string", "null"] },
            website: { type: ["string", "null"] },
          },
          required: ["company_name", "rera_license", "office_address", "phone", "email", "website"],
        },
      },
    },
    required: ["brokerages"],
  };

  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content:
            "You compile UAE REAL ESTATE SALES BROKERAGE directories from the official licensing authority (DLD/RERA Trakheesi, Abu Dhabi DMT, Sharjah/Ajman/RAK/Fujairah/UAQ municipality). ONLY include firms that hold a current real-estate sales broker permit. NEVER include banks, mortgage brokers, mortgage advisors, insurance brokers, takaful, financial advisors, law firms, legal consultancies, freight/logistics brokers, customs brokers, recruitment agencies, or pure property-management companies. Use null for fields you cannot verify. Never fabricate a license number or contact detail.",
        },
        {
          role: "user",
          content: `List up to ${pageSize} licensed REAL-ESTATE SALES brokerage offices in ${emirate} from the ${authority}. ${hint}. Skip the first ${offset} firms (they were already returned in earlier batches). Exclude banks, mortgage brokers, insurance brokers, law firms, consultancies, freight/logistics brokers and pure property-management companies. For each firm return: company_name, rera_license (the actual real-estate broker registration number if published), office_address (full street address with area/landmark), phone (international format with +971), email (sales/info), website. Use null when a field is not available from the authority.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "brokerage_directory", schema },
      },
      temperature: 0.0,
    }),
  });

  if (!resp.ok) {
    console.error("Perplexity error", emirate, resp.status, await resp.text());
    return [];
  }
  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  let parsed: { brokerages?: Brokerage[] } | null = null;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    return [];
  }
  return (parsed?.brokerages ?? []).map((b) => ({ ...b, emirate }));
}

function normalizePhone(p: string | null): string | null {
  if (!p) return null;
  const digits = p.replace(/[^0-9+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("0")) return "+971" + digits.slice(1);
  if (!digits.startsWith("+")) return "+" + digits;
  return digits;
}

function normalizeWebsite(w: string | null): string | null {
  if (!w) return null;
  const trimmed = w.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http")) return trimmed;
  return "https://" + trimmed.replace(/^\/+/, "");
}

// Reject names that are clearly NOT real-estate sales brokerages.
const NON_REALESTATE_RX =
  /\b(bank|banking|mortgage|mortgages|insurance|insurer|takaful|reinsurance|financial advisor|wealth management|capital partners|asset management|law\s|legal|advocates?|attorneys?|notary|consult(ing|ancy|ants?)|freight|logistics|cargo|shipping|customs broker|recruitment|manpower|staffing|hospitality only|property management only|facilities management)\b/i;
function isNonRealEstateBrokerage(name: string, license: string | null): boolean {
  if (license && license.trim().length >= 3) return false; // licensed firms always allowed
  return NON_REALESTATE_RX.test(name);
}
  const trimmed = w.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http")) return trimmed;
  return "https://" + trimmed.replace(/^\/+/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PERPLEXITY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate caller
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userRes.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    // Verify owner / admin
    const { data: isOwner } = await admin.rpc("is_jbj_owner", { _user_id: userId });
    if (!isOwner) {
      return new Response(JSON.stringify({ error: "Forbidden — owner role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const requested: string[] = Array.isArray(body?.emirates) && body.emirates.length
      ? body.emirates
      : Object.keys(EMIRATE_SOURCES);
    const targetPerEmirate: number = Math.min(Math.max(Number(body?.target_per_emirate) || 200, 25), 800);
    const pageSize = 50;

    const summary: Record<string, { fetched: number; inserted: number; updated: number; skipped: number }> = {};

    for (const emirate of requested) {
      const meta = EMIRATE_SOURCES[emirate];
      if (!meta) continue;
      const stat = { fetched: 0, inserted: 0, updated: 0, skipped: 0 };

      let offset = 0;
      let consecutiveEmpty = 0;
      while (offset < targetPerEmirate && consecutiveEmpty < 2) {
        const batch = await perplexityListBrokerages(
          emirate,
          meta.authority,
          meta.hint,
          offset,
          pageSize,
          PERPLEXITY,
        );
        if (!batch.length) {
          consecutiveEmpty++;
          offset += pageSize;
          continue;
        }
        consecutiveEmpty = 0;
        stat.fetched += batch.length;

        for (const b of batch) {
          const name = b.company_name?.trim();
          if (!name || name.length < 2) {
            stat.skipped++;
            continue;
          }
          const phone = normalizePhone(b.phone);
          const website = normalizeWebsite(b.website);
          const email = b.email?.trim().toLowerCase() || null;
          const license = b.rera_license?.trim() || null;

          // Dedupe — try license first, then case-insensitive name within emirate
          let existing: { id: string } | null = null;
          if (license) {
            const { data } = await admin
              .from("crm_brokerages")
              .select("id")
              .eq("owner_id", userId)
              .eq("rera_license", license)
              .maybeSingle();
            existing = data;
          }
          if (!existing) {
            const { data } = await admin
              .from("crm_brokerages")
              .select("id")
              .eq("owner_id", userId)
              .ilike("company_name", name)
              .eq("emirate", emirate)
              .maybeSingle();
            existing = data;
          }

          const fieldSourceMeta = {
            source: "perplexity",
            url: undefined as string | undefined,
            fetched_at: new Date().toISOString(),
          };

          const sources: Record<string, unknown> = {};
          if (license) sources.rera_license = fieldSourceMeta;
          if (b.office_address) sources.office_address = fieldSourceMeta;
          if (phone) sources.phone = fieldSourceMeta;
          if (email) sources.email = fieldSourceMeta;
          if (website) sources.website = fieldSourceMeta;

          const row = {
            owner_id: userId,
            company_name: name,
            rera_license: license,
            office_address: b.office_address || null,
            office_location: b.office_address || null,
            phone,
            email,
            website,
            emirate,
            entry_source: "directory" as const,
            status: "prospect" as const,
            source_detail: meta.authority,
            confidence: license && (phone || email) ? "high" : email || website ? "medium" : "low",
            last_verified_at: new Date().toISOString(),
            field_sources: sources,
          };

          if (existing) {
            // Don't overwrite curated data — only fill blanks
            const { data: cur } = await admin
              .from("crm_brokerages")
              .select("rera_license, office_address, phone, email, website, field_sources")
              .eq("id", existing.id)
              .maybeSingle();
            const patch: Record<string, unknown> = {};
            if (!cur?.rera_license && row.rera_license) patch.rera_license = row.rera_license;
            if (!cur?.office_address && row.office_address) {
              patch.office_address = row.office_address;
              patch.office_location = row.office_location;
            }
            if (!cur?.phone && row.phone) patch.phone = row.phone;
            if (!cur?.email && row.email) patch.email = row.email;
            if (!cur?.website && row.website) patch.website = row.website;
            if (Object.keys(patch).length) {
              patch.field_sources = { ...(cur?.field_sources as object ?? {}), ...sources };
              patch.last_verified_at = row.last_verified_at;
              const { error } = await admin.from("crm_brokerages").update(patch).eq("id", existing.id);
              if (error) console.error("update err", error.message);
            }
            stat.updated++;
          } else {
            const { error } = await admin.from("crm_brokerages").insert(row);
            if (error) {
              console.error("insert err", error.message);
              stat.skipped++;
            } else {
              stat.inserted++;
            }
          }
        }

        offset += batch.length;
      }
      summary[emirate] = stat;
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-uae-brokerage-directory error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
