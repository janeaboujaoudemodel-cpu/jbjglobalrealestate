import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Trophy, Users, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDisplayDate } from "@/utils/formatDate";

type Row = {
  id: string;
  broker_user_id: string;
  visit_date: string;
  visit_time: string | null;
  briefing_summary: string | null;
  notes: string | null;
  sales_rep_name: string | null;
  sales_rep_phone: string | null;
  sales_rep_email: string | null;
  created_at: string;
  developer?: { id: string; name: string; logo_url: string | null } | null;
  broker?: { id: string; full_name: string | null; email: string | null } | null;
};

type Window = "30" | "90" | "365" | "all";

export default function OwnerBrokerVisits() {
  const [windowDays, setWindowDays] = useState<Window>("30");

  const since = useMemo(() => {
    if (windowDays === "all") return null;
    const d = new Date();
    d.setDate(d.getDate() - Number(windowDays));
    return d.toISOString().slice(0, 10);
  }, [windowDays]);

  const visits = useQuery({
    queryKey: ["owner-broker-visits", windowDays],
    queryFn: async () => {
      let q = supabase
        .from("developer_visits")
        .select("*, developer:developers(id,name,logo_url)")
        .order("visit_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1000);
      if (since) q = q.gte("visit_date", since);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as Row[];

      // Hydrate broker names via profiles (best effort)
      const ids = Array.from(new Set(rows.map((r) => r.broker_user_id)));
      if (ids.length) {
        const { data: profs } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", ids);
        const map = new Map(((profs ?? []) as any[]).map((p: any) => [p.user_id, p]));
        rows.forEach((r) => {
          const p: any = map.get(r.broker_user_id);
          r.broker = p
            ? { id: p.user_id, full_name: p.full_name ?? null, email: p.email ?? null }
            : { id: r.broker_user_id, full_name: null, email: null };
        });
      }
      return rows;
    },
  });

  // Leaderboard: top brokers by visit count in the window
  const leaderboard = useMemo(() => {
    const map = new Map<string, { broker: Row["broker"]; count: number; lastVisit: string | null }>();
    (visits.data ?? []).forEach((r) => {
      const cur = map.get(r.broker_user_id) ?? { broker: r.broker, count: 0, lastVisit: null };
      cur.count += 1;
      if (!cur.lastVisit || r.visit_date > cur.lastVisit) cur.lastVisit = r.visit_date;
      map.set(r.broker_user_id, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [visits.data]);

  // Top developers visited
  const topDevs = useMemo(() => {
    const map = new Map<string, { dev: Row["developer"]; count: number }>();
    (visits.data ?? []).forEach((r) => {
      if (!r.developer) return;
      const cur = map.get(r.developer.id) ?? { dev: r.developer, count: 0 };
      cur.count += 1;
      map.set(r.developer.id, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [visits.data]);

  const total = visits.data?.length ?? 0;
  const activeBrokers = new Set((visits.data ?? []).map((r) => r.broker_user_id)).size;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/owner/crm?section=employees" className="inline-flex items-center gap-1.5 text-xs text-[#1A1A1A]/65 hover:text-[#1A1A1A]">
            <ArrowLeft className="h-3.5 w-3.5" /> Employees
          </Link>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mt-1">Broker Developer Visits</h1>
          <p className="text-sm text-[#1A1A1A]/65 mt-1">
            Track every developer office visit logged by your brokers. See who is most active and which
            developers your team is engaging with.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-[#B89555]/40 bg-[#FDFBF7] p-0.5">
          {(["30", "90", "365", "all"] as Window[]).map((w) => (
            <button
              key={w}
              onClick={() => setWindowDays(w)}
              className={`text-[11px] px-3 py-1.5 rounded ${windowDays === w ? "bg-[#EFE6D6] text-[#1A1A1A] font-semibold" : "text-[#1A1A1A]/65"}`}
            >
              {w === "all" ? "All time" : `${w}d`}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Kpi icon={Building2} label="Total visits" value={total} />
        <Kpi icon={Users} label="Active brokers" value={activeBrokers} />
        <Kpi icon={CalendarIcon} label="Window" value={windowDays === "all" ? "All time" : `Last ${windowDays}d`} />
      </div>

      {/* Leaderboard + top developers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#B89555]/20 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#B89555]" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Top brokers by visit activity</h2>
          </div>
          {leaderboard.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[#1A1A1A]/60">No broker activity in this window yet.</div>
          ) : (
            <ol className="divide-y divide-[#B89555]/15">
              {leaderboard.map((row, i) => (
                <li key={row.broker?.id ?? i} className="px-5 py-3 flex items-center gap-3">
                  <div className={`h-8 w-8 grid place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-[#B89555] text-white" : "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/35"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1A1A1A] truncate">
                      {row.broker?.full_name || row.broker?.email || "Unknown broker"}
                    </div>
                    {row.lastVisit && (
                      <div className="text-[11px] text-[#1A1A1A]/60">Last visit {formatDisplayDate(row.lastVisit)}</div>
                    )}
                  </div>
                  <div className="text-lg font-semibold tabular-nums text-[#1A1A1A]">{row.count}</div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#B89555]/20 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#B89555]" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Most visited developers</h2>
          </div>
          {topDevs.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[#1A1A1A]/60">Nothing yet.</div>
          ) : (
            <ul className="divide-y divide-[#B89555]/15">
              {topDevs.map((row) => (
                <li key={row.dev?.id} className="px-5 py-3 flex items-center gap-3">
                  {row.dev?.logo_url ? (
                    <img src={row.dev.logo_url} alt="" className="h-8 w-8 object-contain rounded bg-[#EFE6D6] p-0.5"  loading="lazy" decoding="async" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-[#EFE6D6] border border-[#B89555]/30 grid place-items-center text-[10px] font-bold text-[#1A1A1A]">
                      {(row.dev?.name ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-sm font-medium text-[#1A1A1A] truncate">{row.dev?.name}</div>
                  <div className="text-base font-semibold tabular-nums text-[#1A1A1A]">{row.count}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Full feed */}
      <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#B89555]/20 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">All visits</h2>
          <span className="text-xs text-[#1A1A1A]/55 tabular-nums">{total} entries</span>
        </div>
        {visits.isLoading ? (
          <div className="px-5 py-10 text-center text-sm text-[#1A1A1A]/60">Loading…</div>
        ) : total === 0 ? (
          <div className="px-5 py-12 text-center">
            <Building2 className="h-8 w-8 mx-auto text-[#1A1A1A]/55 mb-3" />
            <div className="text-sm font-semibold text-[#1A1A1A]">No visits logged in this window</div>
            <p className="text-xs text-[#1A1A1A]/65 mt-1 max-w-md mx-auto">
              When a broker logs a developer visit from the Broker Portal, it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#EFE6D6]/60 text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/70">
                <tr>
                  <th className="text-left px-4 py-2.5">Broker</th>
                  <th className="text-left px-4 py-2.5">Developer</th>
                  <th className="text-left px-4 py-2.5">When</th>
                  <th className="text-left px-4 py-2.5">Sales rep</th>
                  <th className="text-left px-4 py-2.5">Briefing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B89555]/15">
                {(visits.data ?? []).map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 text-[#1A1A1A]">
                      <div className="font-medium">{r.broker?.full_name || r.broker?.email || r.broker_user_id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.developer?.logo_url ? (
                          <img src={r.developer.logo_url} alt="" className="h-6 w-6 object-contain rounded bg-[#EFE6D6] p-0.5"  loading="lazy" decoding="async" />
                        ) : null}
                        <span className="text-[#1A1A1A]">{r.developer?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80 tabular-nums whitespace-nowrap">
                      {formatDisplayDate(r.visit_date)}{r.visit_time ? ` · ${r.visit_time.slice(0, 5)}` : ""}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80">
                      <div className="font-medium">{r.sales_rep_name || "—"}</div>
                      <div className="text-[11px] text-[#1A1A1A]/60">
                        {r.sales_rep_phone}{r.sales_rep_phone && r.sales_rep_email ? " · " : ""}{r.sales_rep_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/80 max-w-md">
                      <div className="line-clamp-3 whitespace-pre-wrap">{r.briefing_summary || "—"}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 grid place-items-center rounded-md bg-[#EFE6D6] border border-[#B89555]/35">
          <Icon className="h-4 w-4 text-[#1A1A1A]" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 font-semibold">{label}</div>
          <div className="text-xl font-semibold tabular-nums text-[#1A1A1A]">{value}</div>
        </div>
      </div>
    </div>
  );
}
