/**
 * RelationalHubTabs
 * --------------------------------------------------------------------------
 * Drop-in tab block for brokerage / developer / broker detail screens that
 * surfaces the unified relational CRM links:
 *
 *   • Linked People   — vw_crm_contacts rows that belong to (or reference)
 *                       this entity (by company name OR direct broker id).
 *   • Scanned Cards   — admin_scanned_cards whose card_data jsonb matches
 *                       this entity (by company / email / phone / name).
 *   • Source History  — provenance log rows already loaded by the caller
 *                       (uae_registry_log for registry pages, or
 *                       broker_company_history for broker sheets).
 *
 * Read-only on purpose. Champagne theme, ink text, no gold fills.
 * --------------------------------------------------------------------------
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ScanLine, History } from "lucide-react";

export type RelationalHubKind = "brokerage" | "developer" | "broker";

export interface RelationalHubTabsProps {
  kind: RelationalHubKind;
  entityId: string;
  /** Primary display name (legal/brand/full name). */
  name?: string | null;
  /** Optional alias names that should also count as a match (brand, legal). */
  aliases?: (string | null | undefined)[];
  /** Outreach / primary email. */
  email?: string | null;
  /** Outreach / primary phone (any format). */
  phone?: string | null;
  /**
   * Pre-loaded source-history rows. Each entry is rendered as
   * { when, who, what }. Caller supplies them so we don't re-query
   * tables the parent already has on screen.
   */
  sourceHistory?: Array<{
    id?: string | number;
    when?: string | Date | null;
    who?: string | null;
    what: string;
    detail?: string | null;
  }>;
}

function formatWhen(v: string | Date | null | undefined): string {
  if (!v) return "—";
  try {
    const d = typeof v === "string" ? new Date(v) : v;
    if (!d || Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}

function digitsOnly(s?: string | null): string {
  return (s ?? "").replace(/\D+/g, "");
}

export function RelationalHubTabs({
  kind,
  entityId,
  name,
  aliases = [],
  email,
  phone,
  sourceHistory = [],
}: RelationalHubTabsProps) {
  const allNames = useMemo(
    () =>
      Array.from(
        new Set(
          [name, ...aliases]
            .map((s) => (s ?? "").trim())
            .filter((s) => s.length > 1),
        ),
      ),
    [name, aliases],
  );
  const phoneDigits = digitsOnly(phone);
  const emailLc = (email ?? "").trim().toLowerCase();

  // ----- Linked People (vw_crm_contacts) -----
  const peopleQ = useQuery({
    queryKey: ["rel-hub-people", kind, entityId, allNames, emailLc, phoneDigits],
    enabled: !!entityId,
    queryFn: async () => {
      // Build an OR filter against vw_crm_contacts.
      const ors: string[] = [];
      if (kind === "broker") {
        ors.push(`id.eq.${entityId}`);
      }
      for (const n of allNames) {
        const safe = n.replace(/[%,()]/g, " ").trim();
        if (safe.length > 1) ors.push(`company_name.ilike.%${safe}%`);
      }
      if (emailLc) ors.push(`email.eq.${emailLc}`);
      if (!ors.length) return [];
      const { data, error } = await (supabase as any)
        .from("vw_crm_contacts")
        .select(
          "id, kind, name, email, phone, company_name, role_title, source, last_interaction_at",
        )
        .or(ors.join(","))
        .order("last_interaction_at", { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        kind: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        company_name: string | null;
        role_title: string | null;
        source: string | null;
        last_interaction_at: string | null;
      }>;
    },
  });

  // ----- Scanned Cards (admin_scanned_cards) -----
  const cardsQ = useQuery({
    queryKey: ["rel-hub-cards", kind, entityId, allNames, emailLc, phoneDigits],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_scanned_cards")
        .select("id, card_data, scan_source, scanned_at")
        .order("scanned_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        id: string;
        card_data: any;
        scan_source: string | null;
        scanned_at: string | null;
      }>;
      // Filter client-side because card_data is unstructured jsonb.
      const lcNames = allNames.map((n) => n.toLowerCase());
      return rows.filter((r) => {
        const c = r.card_data ?? {};
        const cName = String(c.full_name ?? c.name ?? "").toLowerCase();
        const cCompany = String(c.company ?? c.company_name ?? c.organization ?? "").toLowerCase();
        const cEmail = String(c.email ?? "").toLowerCase();
        const cPhone = digitsOnly(c.phone ?? c.mobile ?? c.whatsapp ?? "");
        if (emailLc && cEmail && cEmail === emailLc) return true;
        if (phoneDigits.length >= 7 && cPhone.endsWith(phoneDigits.slice(-7))) return true;
        for (const n of lcNames) {
          if (!n) continue;
          if (cCompany.includes(n) || cName.includes(n)) return true;
        }
        return false;
      });
    },
  });

  return (
    <Tabs defaultValue="people" className="w-full">
      <TabsList className="bg-[#F7F2EA] border border-[#B89555]/20">
        <TabsTrigger value="people" className="gap-1.5">
          <Users className="w-3.5 h-3.5" /> Linked People
          <Badge variant="outline" className="ml-1 border-[#B89555]/40 bg-transparent text-[#1A1A1A]">
            {peopleQ.data?.length ?? 0}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="cards" className="gap-1.5">
          <ScanLine className="w-3.5 h-3.5" /> Scanned Cards
          <Badge variant="outline" className="ml-1 border-[#B89555]/40 bg-transparent text-[#1A1A1A]">
            {cardsQ.data?.length ?? 0}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1.5">
          <History className="w-3.5 h-3.5" /> Source History
          <Badge variant="outline" className="ml-1 border-[#B89555]/40 bg-transparent text-[#1A1A1A]">
            {sourceHistory.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {/* ----- Linked People ----- */}
      <TabsContent value="people" className="mt-3">
        {peopleQ.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : peopleQ.error ? (
          <div className="text-xs text-[#1A1A1A]/70">
            Could not load linked people right now.
          </div>
        ) : !peopleQ.data?.length ? (
          <div className="text-xs text-[#1A1A1A]/70">
            No linked people found in the unified CRM yet.
          </div>
        ) : (
          <ul className="divide-y divide-[#B89555]/15 rounded-md border border-[#B89555]/20 bg-[#FDFBF7]">
            {peopleQ.data.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A]"
              >
                <span className="font-medium">{p.name || "—"}</span>
                <Badge variant="outline" className="border-[#B89555]/40 text-[10px] uppercase tracking-wider">
                  {p.kind}
                </Badge>
                {p.role_title && (
                  <span className="text-[#1A1A1A]/70">· {p.role_title}</span>
                )}
                {p.company_name && (
                  <span className="text-[#1A1A1A]/70">@ {p.company_name}</span>
                )}
                <span className="ml-auto text-xs text-[#1A1A1A]/60">
                  {p.email || p.phone || ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      {/* ----- Scanned Cards ----- */}
      <TabsContent value="cards" className="mt-3">
        {cardsQ.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : cardsQ.error ? (
          <div className="text-xs text-[#1A1A1A]/70">
            Could not load scanned cards right now.
          </div>
        ) : !cardsQ.data?.length ? (
          <div className="text-xs text-[#1A1A1A]/70">
            No scanned business cards have been matched to this record yet.
          </div>
        ) : (
          <ul className="divide-y divide-[#B89555]/15 rounded-md border border-[#B89555]/20 bg-[#FDFBF7]">
            {cardsQ.data.map((c) => {
              const d = c.card_data ?? {};
              const fullName = d.full_name ?? d.name ?? "Unknown";
              const company = d.company ?? d.company_name ?? d.organization ?? "";
              const role = d.role ?? d.title ?? d.position ?? "";
              const cEmail = d.email ?? "";
              const cPhone = d.phone ?? d.mobile ?? d.whatsapp ?? "";
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A]"
                >
                  <span className="font-medium">{fullName}</span>
                  {role && <span className="text-[#1A1A1A]/70">· {role}</span>}
                  {company && (
                    <span className="text-[#1A1A1A]/70">@ {company}</span>
                  )}
                  <span className="ml-auto text-xs text-[#1A1A1A]/60">
                    {cEmail || cPhone || ""}{c.scanned_at ? ` · ${formatWhen(c.scanned_at)}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </TabsContent>

      {/* ----- Source History ----- */}
      <TabsContent value="history" className="mt-3">
        {!sourceHistory.length ? (
          <div className="text-xs text-[#1A1A1A]/70">
            No source-history entries yet.
          </div>
        ) : (
          <ol className="space-y-2">
            {sourceHistory.map((h, i) => (
              <li
                key={h.id ?? i}
                className="rounded-md border border-[#B89555]/20 bg-[#FDFBF7] px-3 py-2 text-sm text-[#1A1A1A]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{h.what}</span>
                  <span className="ml-auto text-xs text-[#1A1A1A]/60">{formatWhen(h.when)}</span>
                </div>
                {(h.who || h.detail) && (
                  <div className="mt-0.5 text-xs text-[#1A1A1A]/70">
                    {h.who ? `by ${h.who}` : ""}
                    {h.who && h.detail ? " · " : ""}
                    {h.detail ?? ""}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </TabsContent>
    </Tabs>
  );
}

export default RelationalHubTabs;
