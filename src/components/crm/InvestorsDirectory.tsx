/**
 * InvestorsDirectory — real investors only (from `client_investors`).
 *
 * Shows lifetime portfolio value, units owned, project, handover.
 * Click a row to open a profile drawer with full unit + activity history.
 * Owner's own email is filtered out.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Crown, Phone, Mail, Calendar, Home, Cake } from "lucide-react";
import { OWNER_EMAILS_LC } from "@/config/ownerEmails";

interface Investor {
  id: string;
  client_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  home_address: string | null;
  unit_number: string | null;
  unit_type: string | null;
  unit_size_sqft: number | null;
  project_name: string | null;
  project_id: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  handover_date: string | null;
  payment_plan: string | null;
  notes: string | null;
}

interface AggregatedInvestor {
  key: string;            // grouping key (email or name)
  name: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  totalValue: number;
  unitsCount: number;
  projects: string[];
  records: Investor[];
  isVip: boolean;
}

const fmtAed = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string | null | undefined) =>
  !s ? "—" : new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function aggregate(rows: Investor[]): AggregatedInvestor[] {
  const map = new Map<string, AggregatedInvestor>();
  for (const r of rows) {
    const key = (r.email || r.client_name || r.id).toLowerCase().trim();
    let agg = map.get(key);
    if (!agg) {
      agg = {
        key,
        name: r.client_name || r.email || "Unnamed Investor",
        email: r.email,
        phone: r.phone,
        birthday: r.date_of_birth,
        totalValue: 0,
        unitsCount: 0,
        projects: [],
        records: [],
        isVip: false,
      };
      map.set(key, agg);
    }
    agg.records.push(r);
    agg.unitsCount += 1;
    agg.totalValue += Number(r.purchase_price || 0);
    if (r.project_name && !agg.projects.includes(r.project_name)) {
      agg.projects.push(r.project_name);
    }
    if (!agg.phone && r.phone) agg.phone = r.phone;
    if (!agg.birthday && r.date_of_birth) agg.birthday = r.date_of_birth;
  }
  // VIP: 3+ units OR > 5M AED total
  for (const a of map.values()) {
    a.isVip = a.unitsCount >= 3 || a.totalValue >= 5_000_000;
  }
  return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
}

export default function InvestorsDirectory({
  ownerEmail,
  vipOnly = false,
}: {
  ownerEmail?: string;
  vipOnly?: boolean;
}) {
  const [rows, setRows] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        // Primary source: crm_leads tagged/typed as investor.
        // Fallback enrichment: any matching client_investors rows (units, prices).
        const ownerSet = new Set<string>([
          ...OWNER_EMAILS_LC,
          (ownerEmail || "").toLowerCase().trim(),
        ].filter(Boolean));

        const ownerNotIn = `(${[...ownerSet].map((e) => `"${e}"`).join(",")})`;

        const leadsRes: any = await (supabase as any)
          .from("crm_leads")
          .select("id, full_name, email_lower, phone_e164, birthday, tags, contact_type, vip, is_investor")
          .is("deleted_at", null)
          .or("contact_type.eq.investor,tags.cs.{investor},is_investor.eq.true")
          .not("email_lower", "in", ownerNotIn)
          .order("updated_at", { ascending: false })
          .limit(5000);
        if (leadsRes.error) throw leadsRes.error;

        const investorsRes: any = await supabase
          .from("client_investors")
          .select("id, client_name, email, phone, date_of_birth, home_address, unit_number, unit_type, unit_size_sqft, project_name, project_id, purchase_price, purchase_date, handover_date, payment_plan, notes")
          .order("purchase_date", { ascending: false })
          .limit(5000);
        const investorRows: any[] = (investorsRes.data || []).filter(
          (r: any) => !ownerSet.has((r.email || "").toLowerCase().trim())
        );

        // Index portfolio rows by lowercase email for enrichment.
        const portfolioByEmail = new Map<string, any[]>();
        for (const r of investorRows) {
          const k = (r.email || "").toLowerCase().trim();
          if (!k) continue;
          const arr = portfolioByEmail.get(k) || [];
          arr.push(r);
          portfolioByEmail.set(k, arr);
        }

        // Build a single Investor[] feed: one row per portfolio unit, plus a
        // synthetic placeholder row per lead with no portfolio data so the
        // count matches the section badge.
        const merged: Investor[] = [];
        const seenEmails = new Set<string>();
        for (const lead of leadsRes.data || []) {
          const k = (lead.email_lower || "").toLowerCase().trim();
          seenEmails.add(k);
          const portfolio = (k && portfolioByEmail.get(k)) || [];
          if (portfolio.length === 0) {
            merged.push({
              id: lead.id,
              client_name: lead.full_name,
              email: lead.email_lower,
              phone: lead.phone_e164,
              date_of_birth: lead.birthday,
              home_address: null,
              unit_number: null,
              unit_type: null,
              unit_size_sqft: null,
              project_name: null,
              project_id: null,
              purchase_price: null,
              purchase_date: null,
              handover_date: null,
              payment_plan: null,
              notes: null,
            });
          } else {
            for (const p of portfolio) {
              merged.push({
                ...p,
                client_name: p.client_name || lead.full_name,
                email: p.email || lead.email_lower,
                phone: p.phone || lead.phone_e164,
                date_of_birth: p.date_of_birth || lead.birthday,
              } as Investor);
            }
          }
        }
        // Include portfolio rows whose owners aren't in crm_leads yet.
        for (const r of investorRows) {
          const k = (r.email || "").toLowerCase().trim();
          if (k && seenEmails.has(k)) continue;
          merged.push(r as Investor);
        }

        if (!alive) return;
        setRows(merged);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load investors");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [ownerEmail]);

  const aggregated = useMemo(() => {
    let list = aggregate(rows);
    if (vipOnly) list = list.filter(a => a.isVip);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.phone || "").toLowerCase().includes(q) ||
        a.projects.some(p => p.toLowerCase().includes(q))
      );
    }
    return list;
  }, [rows, vipOnly, search]);

  const open = aggregated.find(a => a.key === openId) || null;

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-6 text-center">
        <p className="text-sm text-[#1A1A1A]">Could not load investors.</p>
        <p className="text-xs text-[#1A1A1A]/60 mt-1">{err}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            {vipOnly ? "VIP Investors" : "Investor Directory"}
          </h2>
          <p className="text-xs text-[#1A1A1A]/60">
            {aggregated.length.toLocaleString()} {vipOnly ? "VIP " : ""}
            investor{aggregated.length === 1 ? "" : "s"} · {rows.length.toLocaleString()} units owned
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search investor, project, email…"
          className="h-9 w-64 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
        />
      </div>

      {aggregated.length === 0 ? (
        <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-10 text-center">
          <Crown className="h-8 w-8 text-[#B89555] mx-auto mb-2" />
          <p className="text-sm text-[#1A1A1A]">
            No {vipOnly ? "VIP " : ""}investors yet. Convert a lead from the Leads tab to add them here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Investor</th>
                <th className="text-left px-4 py-2 font-semibold">Contact</th>
                <th className="text-right px-4 py-2 font-semibold">Units</th>
                <th className="text-right px-4 py-2 font-semibold">Portfolio Value</th>
                <th className="text-left px-4 py-2 font-semibold">Projects</th>
                <th className="text-left px-4 py-2 font-semibold">Birthday</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B89555]/15">
              {aggregated.map((a) => (
                <tr
                  key={a.key}
                  onClick={() => setOpenId(a.key)}
                  className="cursor-pointer hover:bg-[#F7F2EA]/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {a.isVip && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]">
                          <Crown className="h-3 w-3" /> VIP
                        </span>
                      )}
                      <span className="font-semibold text-[#1A1A1A]">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 max-w-[240px]">
                    <div className="text-xs truncate" title={a.email || ""}>{a.email || "—"}</div>
                    <div className="text-xs truncate whitespace-nowrap" title={a.phone || ""}>{a.phone || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1A1A1A]">{a.unitsCount}</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--price-orange, #E67E22)" }}>
                    {fmtAed(a.totalValue)}
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">
                    {a.projects.slice(0, 2).join(", ")}
                    {a.projects.length > 2 ? ` +${a.projects.length - 2}` : ""}
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">{fmtDate(a.birthday)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[#FDFBF7] border-l border-[#B89555]/30">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-[#1A1A1A]">
                  {open.isVip && <Crown className="h-5 w-5 text-[#B89555]" />}
                  {open.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA]/50 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">Portfolio Value</div>
                    <div className="text-lg font-bold" style={{ color: "var(--price-orange, #E67E22)" }}>
                      {fmtAed(open.totalValue)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA]/50 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">Units Owned</div>
                    <div className="text-lg font-bold text-[#1A1A1A]">{open.unitsCount}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-3 space-y-2 text-sm text-[#1A1A1A]">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#1A1A1A]/60" />{open.email || "—"}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#1A1A1A]/60" />{open.phone || "—"}</div>
                  <div className="flex items-center gap-2"><Cake className="h-3.5 w-3.5 text-[#1A1A1A]/60" />{fmtDate(open.birthday)}</div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2 flex items-center gap-2">
                    <Home className="h-4 w-4" /> Units
                  </h3>
                  <div className="space-y-2">
                    {open.records.map((r) => (
                      <div key={r.id} className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-[#1A1A1A]">
                              {r.project_name || "—"} {r.unit_number ? `· Unit ${r.unit_number}` : ""}
                            </div>
                            <div className="text-xs text-[#1A1A1A]/70">
                              {r.unit_type || "—"} {r.unit_size_sqft ? `· ${Number(r.unit_size_sqft).toLocaleString()} sqft` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold" style={{ color: "var(--price-orange, #E67E22)" }}>
                              {fmtAed(r.purchase_price)}
                            </div>
                            <div className="text-[10px] text-[#1A1A1A]/60 flex items-center gap-1 justify-end">
                              <Calendar className="h-3 w-3" />
                              {fmtDate(r.purchase_date)}
                            </div>
                          </div>
                        </div>
                        {r.handover_date && (
                          <div className="mt-2 text-xs text-[#1A1A1A]/70">
                            Handover: {fmtDate(r.handover_date)}
                          </div>
                        )}
                        {r.payment_plan && (
                          <div className="mt-1 text-xs text-[#1A1A1A]/70">Plan: {r.payment_plan}</div>
                        )}
                        {r.notes && (
                          <div className="mt-2 text-xs italic text-[#1A1A1A]/70 border-t border-[#B89555]/15 pt-2">
                            {r.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
