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
  position?: string | null;
  has_signup_profile?: boolean;
  account_type?: string | null;
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
  preferences?: any | null;
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
  unassigned: { label: "Profile pending", icon: UserX, cls: "bg-[#1A1A1A]/10 text-[#1A1A1A]/70 border-[#1A1A1A]/20" },
};

const CATEGORY_ORDER: Category[] = [
  "investor","broker","developer","buyer","seller","landlord","tenant","partner","service_provider","media","other","unassigned",
];

const tableColumns = 7;

function summaryLabel(category: Category) {
  if (category === "unassigned") return "Profile pending";
  if (category === "buyer") return "Buyers";
  if (category === "media") return "Media";
  return `${CATEGORY_META[category].label}s`;
}

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
      return (r.full_name || "").toLowerCase().includes(q)
        || (r.email || "").toLowerCase().includes(q)
        || (r.phone || "").toLowerCase().includes(q)
        || (r.company_name || "").toLowerCase().includes(q);
    });
  }, [rows, filter, search]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] p-4 md:p-8">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">
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
        <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3">
          {CATEGORY_ORDER.filter(c => counts[c] > 0 || c === "investor" || c === "broker" || c === "developer" || c === "unassigned").map((c) => {
            const meta = CATEGORY_META[c];
            const Icon = meta.icon;
            const active = filter === c;
            return (
              <button
                key={c}
                onClick={() => setFilter(active ? "all" : c)}
                className={`text-left p-4 rounded-md border bg-[#F7F2EA] transition-all hover:border-[#B89555] min-h-[96px] overflow-hidden ${
 active ? "border-[#B89555] ring-2 ring-[#B89555]/30" : "border-[#B89555]/30"
 }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[11px] uppercase tracking-[0.08em] text-[#1A1A1A]/70 leading-tight whitespace-nowrap">{summaryLabel(c)}</span>
                  <Icon className="w-4 h-4 text-[#1A1A1A]/60 shrink-0" />
                </div>
                <div className="mt-3 text-4xl font-bold leading-none tabular-nums whitespace-nowrap tracking-normal">{counts[c]}</div>
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
              placeholder="Search name, email, phone or company…"
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
                  <th className="px-4 py-3 font-semibold min-w-[300px]">Contact</th>
                  <th className="px-4 py-3 font-semibold min-w-[170px]">Category</th>
                  <th className="px-4 py-3 font-semibold min-w-[150px]">Phone</th>
                  <th className="px-4 py-3 font-semibold min-w-[120px]">Registered</th>
                  <th className="px-4 py-3 font-semibold min-w-[180px]">Last seen</th>
                  <th className="px-4 py-3 font-semibold text-right min-w-[90px]">Sessions</th>
                  <th className="px-4 py-3 font-semibold text-right min-w-[120px]">Time on site</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={tableColumns} className="px-4 py-12 text-center">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={tableColumns} className="px-4 py-12 text-center text-[#1A1A1A]/60">No users found.</td></tr>
                ) : filtered.map((u) => {
                  const meta = CATEGORY_META[u.category];
                  return (
                    <tr
                      key={u.id}
                      className="border-t border-[#B89555]/20 hover:bg-[#EFE6D6]/50 cursor-pointer"
                      onClick={() => openUser(u)}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-[#1A1A1A]">{u.full_name || "Name not provided"}</div>
                        <a
                          href={`mailto:${u.email ?? ""}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs text-[#064E3B] hover:underline break-all"
                        >
                          {u.email || "—"}
                        </a>
                        {u.company_name && <div className="text-[11px] text-[#1A1A1A]/60 mt-0.5">{u.company_name}</div>}
                      </td>
                      <td className="px-4 py-3 align-top min-w-[170px]">
                        <span
                          className={`${meta.cls} inline-flex w-[128px] items-center justify-center rounded-md border px-3 py-1 text-[11px] font-semibold leading-none`}
                          style={{ whiteSpace: "nowrap", wordBreak: "normal", overflowWrap: "normal" }}
                        >
                          {meta.label}
                        </span>
                        {!u.has_signup_profile && <div className="text-[10px] text-[#1A1A1A]/55 mt-1 whitespace-nowrap">Account form pending</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{u.phone || "Not provided"}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-right">{u.sessions_count}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{fmtDuration(u.total_minutes * 60)}</td>
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
                  <Field label="Phone" value={selected.phone || "Not provided"} mono />
                  <Field label="Category" value={CATEGORY_META[selected.category].label} />
                  <Field label="Account form" value={selected.has_signup_profile ? "Submitted" : "Pending / social account only"} />
                  <Field label="Registered" value={new Date(selected.created_at).toLocaleString()} />
                  <Field label="Last seen" value={selected.last_login_at ? new Date(selected.last_login_at).toLocaleString() : "—"} />
                  <Field label="Total sessions" value={String(selected.sessions_count)} />
                  <Field label="Time on site" value={fmtDuration(selected.total_minutes * 60)} />
                  <Field label="Days active (30d)" value={String(selected.days_active_30d)} />
                  <Field label="Country" value={selected.country || "—"} />
                </div>

                {detailLoading && (
                  <section>
                    <h3 className="font-semibold text-sm mb-2 uppercase tracking-wider text-[#1A1A1A]/70">Account form snapshot</h3>
                    <div className="border border-[#B89555]/30 rounded bg-[#F7F2EA] p-3 grid grid-cols-2 gap-3 text-sm">
                      <Field label="Category" value={CATEGORY_META[selected.category].label} />
                      <Field label="Form status" value={selected.has_signup_profile ? "Submitted" : "Pending"} />
                      <Field label="Phone" value={selected.phone || "Not provided"} mono />
                      <Field label="Company" value={selected.company_name || "—"} />
                    </div>
                    <div className="text-center py-5"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
                  </section>
                )}

                {detail && (
                  <>
                    {detail.crm_profile && (
                      <section>
                        <h3 className="font-semibold text-sm mb-2 uppercase tracking-wider text-[#1A1A1A]/70">Signup profile</h3>
                        {detail.crm_profile._missing_signup_profile && (
                          <div className="mb-3 border border-[#B89555]/30 bg-[#EFE6D6]/60 px-3 py-2 text-xs text-[#1A1A1A]/75">
                            This account was created without completing the registration wizard, so the account form is marked pending until the user submits their category profile.
                          </div>
                        )}
                        <div className="border border-[#B89555]/30 rounded bg-[#F7F2EA] p-3 grid grid-cols-2 gap-3 text-sm">
                          <Field label="Category" value={detail.crm_profile.category || "—"} />
                          <Field label="Status" value={detail.crm_profile.status || "—"} />
                          <Field label="Phone" value={detail.crm_profile.phone || "—"} mono />
                          <Field label="WhatsApp" value={detail.crm_profile.whatsapp || "—"} mono />
                          <Field label="Country" value={detail.crm_profile.country || "—"} />
                          <Field label="Nationality" value={detail.crm_profile.nationality || "—"} />
                          <Field label="Preferred language" value={detail.crm_profile.preferred_language || "—"} />
                          <Field label="Preferred contact" value={`${detail.crm_profile.preferred_contact_method || "—"} · ${detail.crm_profile.preferred_contact_time || "—"}`} />
                          <Field label="Company" value={detail.crm_profile.company_name || "—"} />
                          <Field label="Position" value={detail.crm_profile.position || "—"} />
                          <Field label="Years of experience" value={detail.crm_profile.years_experience != null ? String(detail.crm_profile.years_experience) : "—"} />
                          <Field label="Budget" value={detail.crm_profile.budget_min || detail.crm_profile.budget_max ? `${detail.crm_profile.budget_min ?? "—"} - ${detail.crm_profile.budget_max ?? "—"}` : "—"} />
                          <div className="col-span-2">
                            <Field label="Services requested" value={(detail.crm_profile.services || []).join(", ") || "—"} />
                          </div>
                          <div className="col-span-2">
                            <Field label="Communities" value={(detail.crm_profile.communities || []).join(", ") || "—"} />
                          </div>
                          <div className="col-span-2">
                            <Field label="Notes" value={detail.crm_profile.notes || "—"} />
                          </div>
                          <div className="col-span-2">
                            <Field label="Source page" value={detail.crm_profile.source_page || "—"} mono />
                          </div>
                        </div>
                        {detail.crm_profile.category_data && Object.keys(detail.crm_profile.category_data).length > 0 && (
                          <div className="mt-3">
                            <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-1">Category-specific answers</div>
                            <div className="border border-[#B89555]/30 rounded bg-white p-3 grid grid-cols-1 gap-1.5 text-xs">
                              {Object.entries(detail.crm_profile.category_data).map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-3 border-b border-[#B89555]/15 pb-1 last:border-0">
                                  <span className="text-[#1A1A1A]/60">{k.replace(/_/g, " ")}</span>
                                  <span className="font-medium text-right break-all">{Array.isArray(v) ? v.join(", ") : (v == null ? "—" : String(v))}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>
                    )}

                    <section>
                      <h3 className="font-semibold text-sm mb-2 uppercase tracking-wider text-[#1A1A1A]/70">Roles</h3>
                      <div className="flex flex-wrap gap-2">
                        {detail.roles.length > 0 ? detail.roles.map((r) => (
                          <Badge key={r} variant="outline" className="bg-[#064E3B]/10 text-[#064E3B] border-[#064E3B]/30">{r}</Badge>
                        )) : <span className="text-xs text-[#1A1A1A]/60">No roles assigned.</span>}
                      </div>
                    </section>

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
                      <h3 className="font-semibold text-sm mb-2 uppercase tracking-wider text-[#1A1A1A]/70">Pages visited & events ({detail.events.length})</h3>
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
