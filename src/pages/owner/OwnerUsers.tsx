import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Search, Users as UsersIcon, TrendingUp, Handshake, Building2, UserX, Home, KeyRound, DoorOpen, Briefcase, Wrench, Newspaper, HelpCircle } from "lucide-react";

type Category =
  | "investor" | "broker" | "developer" | "buyer" | "seller"
  | "landlord" | "tenant" | "partner" | "service_provider" | "media" | "other" | "unassigned";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  category: Category;
  created_at: string;
  last_login_at: string | null;
  total_login_days: number | null;
  sessions_count: number;
  total_minutes: number;
  days_active_30d: number;
  country: string | null;
  device: string | null;
}

interface DetailPayload {
  sessions: Array<{ started_at: string; ended_at: string | null; duration_seconds: number; device_type: string | null; country: string | null; pages_visited: number }>;
  events: Array<{ event_time: string; event_name: string; page_path: string | null; metadata: any }>;
  daily: Array<{ day_date: string; sessions_count: number; total_duration_seconds: number; total_events: number }>;
  crm_profile: any | null;
  profile: any | null;
  roles: string[];
  activity: Array<{ created_at: string; activity_type?: string; description?: string; metadata?: any }>;
}

const CATEGORY_META: Record<Category, { label: string; icon: any; cls: string }> = {
  investor: { label: "Investor", icon: TrendingUp, cls: "bg-[#064E3B]/10 text-[#064E3B] border-[#064E3B]/30" },
  broker: { label: "Broker", icon: Handshake, cls: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40" },
  developer: { label: "Developer", icon: Building2, cls: "bg-purple-500/15 text-purple-700 border-purple-500/40" },
  buyer: { label: "Buyer", icon: Home, cls: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  seller: { label: "Seller", icon: KeyRound, cls: "bg-amber-500/15 text-amber-800 border-amber-500/40" },
  landlord: { label: "Landlord", icon: Building2, cls: "bg-teal-500/15 text-teal-800 border-teal-500/40" },
  tenant: { label: "Tenant", icon: DoorOpen, cls: "bg-sky-500/15 text-sky-800 border-sky-500/40" },
  partner: { label: "Partner", icon: Briefcase, cls: "bg-indigo-500/15 text-indigo-800 border-indigo-500/40" },
  service_provider: { label: "Service Provider", icon: Wrench, cls: "bg-rose-500/15 text-rose-800 border-rose-500/40" },
  media: { label: "Media", icon: Newspaper, cls: "bg-slate-500/15 text-slate-800 border-slate-500/40" },
  other: { label: "Other", icon: HelpCircle, cls: "bg-[#1A1A1A]/10 text-[#1A1A1A]/80 border-[#1A1A1A]/25" },
  unassigned: { label: "Unassigned", icon: UserX, cls: "bg-[#1A1A1A]/10 text-[#1A1A1A]/70 border-[#1A1A1A]/20" },
};

function fmtDuration(seconds: number) {
  if (!seconds || seconds < 60) return `${seconds || 0}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function OwnerUsers() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("owner-users-analytics", { body: {} });
      if (error) throw error;
      setRows((data as any)?.rows ?? []);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  }

  async function openUser(u: UserRow) {
    setSelected(u);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("owner-user-detail", { body: { user_id: u.id } });
      if (error) throw error;
      setDetail(data as DetailPayload);
    } catch (e) {
      console.error("Failed to load detail", e);
    } finally {
      setDetailLoading(false);
    }
  }

  const counts = useMemo(() => {
    const c: Record<Category, number> = {
      investor: 0, broker: 0, developer: 0, buyer: 0, seller: 0,
      landlord: 0, tenant: 0, partner: 0, service_provider: 0, media: 0, other: 0, unassigned: 0,
    };
    for (const r of rows) c[r.category]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.category !== filter) return false;
      if (!q) return true;
      return (r.full_name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q);
    });
  }, [rows, filter, search]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              All registered users, segmented by category, with full activity insights.
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Refresh
          </Button>
        </header>

        {/* Segment summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["investor", "broker", "developer", "unassigned"] as Category[]).map((c) => {
            const meta = CATEGORY_META[c];
            const Icon = meta.icon;
            const active = filter === c;
            return (
              <button
                key={c}
                onClick={() => setFilter(active ? "all" : c)}
                className={`text-left p-4 rounded-xl border bg-[#F7F2EA] transition-all hover:border-[#B89555] ${
 active ? "border-[#B89555] ring-2 ring-[#B89555]/30" : "border-[#B89555]/30"
 }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">{meta.label}s</span>
                  <Icon className="w-4 h-4 text-[#1A1A1A]/60" />
                </div>
                <div className="text-3xl font-bold mt-2">{counts[c]}</div>
              </button>
            );
          })}
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="pl-9 bg-[#FDFBF7] border-[#B89555]/30"
            />
          </div>
          {filter !== "all" && (
            <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
              Clear filter
            </Button>
          )}
          <span className="text-xs text-[#1A1A1A]/60 ml-auto">{filtered.length} of {rows.length}</span>
        </div>

        {/* Users table */}
        <Card className="overflow-hidden bg-[#F7F2EA] border-[#B89555]/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#EFE6D6] text-[#1A1A1A]/80">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Registered</th>
                  <th className="px-4 py-3 font-semibold">Last seen</th>
                  <th className="px-4 py-3 font-semibold text-right">Sessions</th>
                  <th className="px-4 py-3 font-semibold text-right">Time on site</th>
                  <th className="px-4 py-3 font-semibold text-right">Days (30d)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-[#1A1A1A]/60">No users found.</td></tr>
                ) : filtered.map((u) => {
                  const meta = CATEGORY_META[u.category];
                  const revealed = revealedIds.has(u.id);
                  return (
                    <tr
                      key={u.id}
                      className="border-t border-[#B89555]/20 hover:bg-[#EFE6D6]/50 cursor-pointer"
                      onClick={() => openUser(u)}
                    >
                      <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{maskEmail(u.email, revealed)}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleReveal(u.id); }}
                            className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                            title={revealed ? "Hide email" : "Reveal email"}
                          >
                            {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className={meta.cls}>{meta.label}</Badge></td>
                      <td className="px-4 py-3 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-right">{u.sessions_count}</td>
                      <td className="px-4 py-3 text-right">{fmtDuration(u.total_minutes * 60)}</td>
                      <td className="px-4 py-3 text-right">{u.days_active_30d}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#FDFBF7] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.full_name || "User"}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Email" value={selected.email || "—"} mono />
                  <Field label="Category" value={CATEGORY_META[selected.category].label} />
                  <Field label="Registered" value={new Date(selected.created_at).toLocaleString()} />
                  <Field label="Last seen" value={selected.last_login_at ? new Date(selected.last_login_at).toLocaleString() : "—"} />
                  <Field label="Total sessions" value={String(selected.sessions_count)} />
                  <Field label="Time on site" value={fmtDuration(selected.total_minutes * 60)} />
                  <Field label="Days active (30d)" value={String(selected.days_active_30d)} />
                  <Field label="Country" value={selected.country || "—"} />
                </div>

                {detailLoading && (
                  <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
                )}

                {detail && (
                  <>
                    <section>
                      <h3 className="font-semibold text-sm mb-2 uppercase tracking-wider text-[#1A1A1A]/70">Daily activity (last 30d)</h3>
                      <div className="flex items-end gap-1 h-16 border border-[#B89555]/30 rounded p-2 bg-[#F7F2EA]">
                        {detail.daily.slice(0, 30).reverse().map((d, i) => {
                          const max = Math.max(...detail.daily.map((x) => x.total_duration_seconds), 1);
                          const h = Math.max(4, (d.total_duration_seconds / max) * 56);
                          return <div key={i} title={`${d.day_date}: ${fmtDuration(d.total_duration_seconds)}`} className="flex-1 bg-[#B89555]/70 rounded-sm" style={{ height: `${h}px` }} />;
                        })}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-semibold text-sm mb-2 uppercase tracking-wider text-[#1A1A1A]/70">Sessions ({detail.sessions.length})</h3>
                      <div className="border border-[#B89555]/30 rounded divide-y divide-[#B89555]/20 bg-[#F7F2EA] max-h-60 overflow-y-auto">
                        {detail.sessions.map((s, i) => (
                          <div key={i} className="px-3 py-2 text-xs flex justify-between gap-2">
                            <span>{new Date(s.started_at).toLocaleString()}</span>
                            <span className="text-[#1A1A1A]/70">{s.device_type || "—"} · {s.country || "—"} · {s.pages_visited}p</span>
                            <span className="font-medium">{fmtDuration(s.duration_seconds)}</span>
                          </div>
                        ))}
                        {detail.sessions.length === 0 && <div className="px-3 py-4 text-xs text-[#1A1A1A]/60 text-center">No sessions recorded.</div>}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-semibold text-sm mb-2 uppercase tracking-wider text-[#1A1A1A]/70">Recent events ({detail.events.length})</h3>
                      <div className="border border-[#B89555]/30 rounded divide-y divide-[#B89555]/20 bg-[#F7F2EA] max-h-60 overflow-y-auto">
                        {detail.events.map((e, i) => (
                          <div key={i} className="px-3 py-2 text-xs flex justify-between gap-2">
                            <span className="font-mono">{e.event_name}</span>
                            <span className="text-[#1A1A1A]/70 truncate flex-1 mx-2">{e.page_path}</span>
                            <span>{new Date(e.event_time).toLocaleString()}</span>
                          </div>
                        ))}
                        {detail.events.length === 0 && <div className="px-3 py-4 text-xs text-[#1A1A1A]/60 text-center">No events.</div>}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-0.5">{label}</div>
      <div className={mono ? "font-mono text-xs break-all" : "font-medium"}>{value}</div>
    </div>
  );
}
