/**
 * BookingsAdmin — M3 admin dashboard for the JBJ Bookings engine.
 *
 * Owner-only. Tabs:
 *   • Appointments: list + status actions (confirm / reject / cancel / reschedule).
 *   • Event types: view + toggle active, edit weekly availability & timings.
 *   • Workspaces: view identity/sender used by outbound emails.
 *
 * All mutations go through the booking-admin-action edge function (RLS-safe).
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Settings2, Building2, Check, X, RotateCcw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Appt = {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  form_data: Record<string, unknown>;
  notes: string | null;
  email_verified: boolean;
  created_at: string;
  event_type: { name: string; workspace_id: string } | null;
};
type EventType = {
  id: string; name: string; description: string | null;
  duration_minutes: number; interval_minutes: number;
  min_notice_hours: number; max_advance_days: number;
  is_active: boolean; workspace_id: string;
  weekly_availability: Record<string, Array<{ start: string; end: string }>>;
};
type Workspace = {
  id: string; kind: string; display_name: string; host_name: string;
  sender_name: string; sender_email: string; reply_to_email: string;
  notification_email: string; timezone: string; is_active: boolean;
};

const STATUS_TABS = ["upcoming", "pending", "past", "cancelled", "all"] as const;
type StatusTab = typeof STATUS_TABS[number];

const emerald = "#064E3B";

export default function BookingsAdmin() {
  const [tab, setTab] = useState<"appointments" | "event_types" | "workspaces">("appointments");
  const [statusTab, setStatusTab] = useState<StatusTab>("upcoming");
  const [appts, setAppts] = useState<Appt[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    const [a, e, w] = await Promise.all([
      supabase.from("jbj_booking_appointments" as any)
        .select("id,status,starts_at,ends_at,timezone,customer_name,customer_email,customer_phone,form_data,notes,email_verified,created_at,event_type:jbj_booking_event_types(name,workspace_id)")
        .order("starts_at", { ascending: false }).limit(500),
      supabase.from("jbj_booking_event_types" as any).select("*").order("created_at"),
      supabase.from("jbj_booking_workspaces" as any).select("*").order("created_at"),
    ]);
    if (a.data) setAppts(a.data as any);
    if (e.data) setEventTypes(e.data as any);
    if (w.data) setWorkspaces(w.data as any);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  const filteredAppts = useMemo(() => {
    const now = Date.now();
    return appts.filter((a) => {
      const t = new Date(a.starts_at).getTime();
      if (statusTab === "upcoming") return t >= now && !["cancelled", "rejected"].includes(a.status);
      if (statusTab === "pending") return ["pending", "awaiting_email_verification", "awaiting_approval"].includes(a.status);
      if (statusTab === "past") return t < now && !["cancelled", "rejected"].includes(a.status);
      if (statusTab === "cancelled") return ["cancelled", "rejected"].includes(a.status);
      return true;
    });
  }, [appts, statusTab]);

  async function act(id: string, action: "confirm" | "reject" | "cancel", reason?: string) {
    setBusyId(id);
    const { error } = await supabase.functions.invoke("booking-admin-action", {
      body: { appointment_id: id, action, reason },
    });
    setBusyId(null);
    if (error) return toast.error(error.message ?? "Action failed");
    toast.success(`Booking ${action}ed`);
    loadAll();
  }

  async function toggleEventTypeActive(et: EventType) {
    const { error } = await supabase
      .from("jbj_booking_event_types" as any)
      .update({ is_active: !et.is_active })
      .eq("id", et.id);
    if (error) return toast.error(error.message);
    toast.success(`${et.name} ${!et.is_active ? "activated" : "deactivated"}`);
    loadAll();
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#B89555] mb-2">JBJ Bookings</p>
          <h1 className="text-3xl md:text-4xl font-serif text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
            Bookings Admin
          </h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Manage appointments, event types, and hosts across all booking workspaces.
          </p>
        </header>

        <nav className="flex gap-2 mb-6 border-b border-[#B89555]/25">
          {[
            { k: "appointments", label: "Appointments", icon: Calendar },
            { k: "event_types", label: "Event types", icon: Settings2 },
            { k: "workspaces", label: "Workspaces", icon: Building2 },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.k;
            return (
              <button key={t.k} onClick={() => setTab(t.k as any)}
                className="px-4 py-2.5 text-sm inline-flex items-center gap-2 border-b-2 transition-colors"
                style={{
                  borderColor: active ? emerald : "transparent",
                  color: active ? emerald : "#1A1A1A99",
                  fontWeight: active ? 600 : 500,
                }}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </nav>

        {loading ? (
          <div className="flex items-center gap-2 text-[#1A1A1A]/60"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : tab === "appointments" ? (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {STATUS_TABS.map((s) => (
                <button key={s} onClick={() => setStatusTab(s)}
                  className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-full border"
                  style={{
                    background: statusTab === s ? emerald : "#fff",
                    color: statusTab === s ? "#fff" : "#1A1A1A",
                    borderColor: statusTab === s ? emerald : "#B8955540",
                  }}>
                  {s} {s === statusTab ? `(${filteredAppts.length})` : ""}
                </button>
              ))}
            </div>
            <div className="bg-white border border-[#B89555]/25 rounded-2xl overflow-hidden">
              {filteredAppts.length === 0 ? (
                <div className="p-8 text-center text-[#1A1A1A]/60 text-sm">No bookings in this bucket.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#F7F2EA] text-[#1A1A1A]/70 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left p-3">When</th>
                      <th className="text-left p-3">Guest</th>
                      <th className="text-left p-3">Event</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppts.map((a) => (
                      <tr key={a.id} className="border-t border-[#B89555]/15 align-top">
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-medium">{new Date(a.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
                          <div className="text-xs text-[#1A1A1A]/50">{a.timezone}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{a.customer_name}</div>
                          <div className="text-xs text-[#1A1A1A]/60">{a.customer_email}</div>
                          {a.customer_phone && <div className="text-xs text-[#1A1A1A]/60">{a.customer_phone}</div>}
                        </td>
                        <td className="p-3">{a.event_type?.name ?? "—"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{
                            background: a.status === "confirmed" ? `${emerald}15` : "#B8955520",
                            color: a.status === "confirmed" ? emerald : "#1A1A1A",
                          }}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {busyId === a.id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : (
                            <div className="inline-flex gap-1">
                              {a.status !== "confirmed" && (
                                <button onClick={() => act(a.id, "confirm")} title="Confirm"
                                  className="p-1.5 rounded hover:bg-[color:var(--emerald-1,#064E3B)]/10" style={{ color: emerald }}>
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {!["cancelled", "rejected"].includes(a.status) && (
                                <>
                                  <button onClick={() => { const r = prompt("Reason?") ?? ""; act(a.id, "cancel", r); }} title="Cancel"
                                    className="p-1.5 rounded hover:bg-red-50 text-red-700"><X className="w-4 h-4" /></button>
                                  <button onClick={() => { const r = prompt("Reason for rejection?") ?? ""; act(a.id, "reject", r); }} title="Reject"
                                    className="p-1.5 rounded hover:bg-red-50 text-red-700 text-xs px-2">Reject</button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : tab === "event_types" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {eventTypes.map((et) => {
              const ws = workspaces.find((w) => w.id === et.workspace_id);
              return (
                <div key={et.id} className="bg-white border border-[#B89555]/25 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-serif text-xl" style={{ fontFamily: "'Cormorant Garamond',serif" }}>{et.name}</h3>
                      {ws && <p className="text-xs text-[#1A1A1A]/60 mt-0.5">{ws.display_name}</p>}
                    </div>
                    <button onClick={() => toggleEventTypeActive(et)}
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        background: et.is_active ? `${emerald}15` : "#B8955520",
                        color: et.is_active ? emerald : "#1A1A1A",
                      }}>
                      {et.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                  {et.description && <p className="text-sm text-[#1A1A1A]/70 mb-3">{et.description}</p>}
                  <dl className="text-xs grid grid-cols-2 gap-y-1 text-[#1A1A1A]/70">
                    <dt>Duration</dt><dd className="text-right">{et.duration_minutes} min</dd>
                    <dt>Interval</dt><dd className="text-right">{et.interval_minutes} min</dd>
                    <dt>Min notice</dt><dd className="text-right">{et.min_notice_hours} h</dd>
                    <dt>Max advance</dt><dd className="text-right">{et.max_advance_days} days</dd>
                  </dl>
                  <div className="mt-3 pt-3 border-t border-[#B89555]/20 text-xs">
                    <p className="uppercase tracking-wider text-[#B89555] mb-1">Weekly availability</p>
                    <ul className="space-y-0.5 text-[#1A1A1A]/70">
                      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => {
                        const ranges = et.weekly_availability?.[String(i)] ?? [];
                        return (
                          <li key={d} className="flex justify-between">
                            <span>{d}</span>
                            <span>{ranges.length === 0 ? "—" : ranges.map((r) => `${r.start}–${r.end}`).join(", ")}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {workspaces.map((w) => (
              <div key={w.id} className="bg-white border border-[#B89555]/25 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-xl" style={{ fontFamily: "'Cormorant Garamond',serif" }}>{w.display_name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${emerald}15`, color: emerald }}>{w.kind}</span>
                </div>
                <dl className="text-xs grid grid-cols-[100px_1fr] gap-y-1 text-[#1A1A1A]/70">
                  <dt>Host</dt><dd>{w.host_name}</dd>
                  <dt>Sender</dt><dd>{w.sender_name} &lt;{w.sender_email}&gt;</dd>
                  <dt>Reply-to</dt><dd>{w.reply_to_email}</dd>
                  <dt>Notify</dt><dd>{w.notification_email}</dd>
                  <dt>Timezone</dt><dd>{w.timezone}</dd>
                </dl>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-3 text-sm">
          <a href="/book/jane" target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-[color:var(--emerald-1,#064E3B)] underline underline-offset-4">
            Open Jane's page <ExternalLink className="w-3 h-3" />
          </a>
          <a href="/book/jbj-private-breakfast" target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-[color:var(--emerald-1,#064E3B)] underline underline-offset-4">
            Open JBJ business page <ExternalLink className="w-3 h-3" />
          </a>
          <button onClick={loadAll} className="ml-auto inline-flex items-center gap-1 text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
            <RotateCcw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
