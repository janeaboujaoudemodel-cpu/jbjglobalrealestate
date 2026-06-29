import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Search, Plus, Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText, Trash2, Check, X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDisplayDate } from "@/utils/formatDate";
import { IconTile } from "@/components/ui/icon-tile";
import BrokerEmptyState from "@/components/broker-portal/BrokerEmptyState";

type Developer = { id: string; name: string; slug: string | null; logo_url: string | null };
type Visit = {
  id: string;
  developer_id: string;
  visit_date: string;
  visit_time: string | null;
  briefing_summary: string | null;
  notes: string | null;
  sales_rep_name: string | null;
  sales_rep_phone: string | null;
  sales_rep_email: string | null;
  sales_rep_details: string | null;
  created_at: string;
  developer?: Developer | null;
};

function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function nowHm() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BrokerDeveloperVisits() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Developer search dropdown state
  const [devQuery, setDevQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Developer | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Form state
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(nowHm());
  const [briefing, setBriefing] = useState("");
  const [notes, setNotes] = useState("");
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repDetails, setRepDetails] = useState("");
  const [repFeedback, setRepFeedback] = useState("");
  const RATING_CRITERIA = ["Fast", "Responsive", "Knowledgeable", "Helpful", "Professional", "Kind"] as const;
  type Criterion = typeof RATING_CRITERIA[number];
  const [repRatings, setRepRatings] = useState<Record<Criterion, number>>({
    Fast: 0, Responsive: 0, Knowledgeable: 0, Helpful: 0, Professional: 0, Kind: 0,
  });

  // Click-outside to close dropdown
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Developer search (shows full list when query is empty)
  const devs = useQuery({
    queryKey: ["dv-devs", devQuery],
    enabled: open,
    queryFn: async () => {
      const q = devQuery.trim();
      let query = supabase
        .from("developers")
        .select("id, name, slug, logo_url")
        .order("name", { ascending: true })
        .limit(q ? 50 : 500);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Developer[];
    },
  });

  // Visits list (latest first)
  const visits = useQuery({
    queryKey: ["dv-visits", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_visits")
        .select("*, developer:developers(id,name,slug,logo_url)")
        .order("visit_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Visit[];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in");
      if (!picked) throw new Error("Pick a developer first");
      if (!date) throw new Error("Pick a visit date");
      const payload = {
        broker_user_id: user.id,
        developer_id: picked.id,
        visit_date: date,
        visit_time: time || null,
        briefing_summary: briefing.trim() || null,
        notes: notes.trim() || null,
        sales_rep_name: repName.trim() || null,
        sales_rep_phone: repPhone.trim() || null,
        sales_rep_email: repEmail.trim() || null,
        sales_rep_details: (() => {
          const hasRatings = Object.values(repRatings).some((v) => v > 0);
          const fb = repFeedback.trim();
          if (!hasRatings && !fb && !repDetails.trim()) return null;
          return JSON.stringify({
            feedback: fb || null,
            ratings: repRatings,
            ...(repDetails.trim() ? { legacy: repDetails.trim() } : {}),
          });
        })(),
      };
      const { error } = await supabase.from("developer_visits").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Developer visit logged");
      // Reset form
      setPicked(null);
      setDevQuery("");
      setBriefing("");
      setNotes("");
      setRepName("");
      setRepPhone("");
      setRepEmail("");
      setRepDetails("");
      setRepFeedback("");
      setRepRatings({ Fast: 0, Responsive: 0, Knowledgeable: 0, Helpful: 0, Professional: 0, Kind: 0 });
      setDate(todayIso());
      setTime(nowHm());
      qc.invalidateQueries({ queryKey: ["dv-visits", user?.id] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to save visit"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("developer_visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Visit removed");
      qc.invalidateQueries({ queryKey: ["dv-visits", user?.id] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete"),
  });

  const totalThisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return (visits.data ?? []).filter((v) => v.visit_date.startsWith(ym)).length;
  }, [visits.data]);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 p-5 md:p-6">
        <div className="flex items-center gap-3">
          <IconTile icon={Building2} tone="emerald" size="md" className="!h-11 !w-11 !rounded-xl" iconClassName="!h-5 !w-5" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55 font-semibold">
              JBJ Global Real Estate
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-[#1A1A1A]">Developer Visits</h1>
            <p className="text-sm text-[#1A1A1A]/65 mt-0.5">
              Log every visit you make to a developer sales office. Your activity feeds straight into the
              employee tracking dashboard so your manager can see your effort.
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55 font-semibold">
              This month
            </div>
            <div className="text-2xl font-semibold text-[#1A1A1A] tabular-nums">{totalThisMonth}</div>
          </div>
        </div>
      </div>

      {/* Log visit form */}
      <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 p-5 md:p-6">
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Log a new visit</h2>

        {/* Developer picker */}
        <div ref={wrapRef} className="relative mb-4">
          <label className="block text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 font-semibold mb-1.5">
            Developer
          </label>
          {picked ? (
            <div className="flex items-center gap-3 px-3 h-12 rounded-md bg-[#FDFBF7] border border-[#B89555]/40">
              {picked.logo_url ? (
                <img src={picked.logo_url} alt={picked.name} className="h-8 w-8 object-contain rounded bg-[#EFE6D6] p-0.5" />
              ) : (
                <div data-surface="emerald" data-allow-dark-cta className="allow-white h-8 w-8 rounded-xl bg-[image:var(--jj-emerald-ombre)] border border-white/15 grid place-items-center text-[10px] font-bold text-white shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75)]">
                  {picked.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div data-developer-name className="text-sm font-medium text-[#1A1A1A] whitespace-normal break-words [overflow-wrap:anywhere] leading-snug flex-1 min-w-0">{picked.name}</div>
              <button
                type="button"
                onClick={() => { setPicked(null); setDevQuery(""); }}
                className="h-7 w-7 grid place-items-center rounded-md border border-[#B89555]/30 text-[#1A1A1A]/70 hover:bg-[#EFE6D6]"
                aria-label="Change developer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/45" />
                <Input
                  value={devQuery}
                  onChange={(e) => { setDevQuery(e.target.value); setOpen(true); }}
                  onFocus={() => setOpen(true)}
                  placeholder="Type a few letters of the developer name…"
                  className="pl-9 bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] h-12"
                />
              </div>
              {open && (
                <div className="absolute z-30 mt-1 left-0 right-0 max-h-72 overflow-auto rounded-md border border-[#B89555]/40 bg-[#FDFBF7] shadow-lg">
                  {devs.isLoading && (
                    <div className="px-3 py-2 text-xs text-[#1A1A1A]/60">Loading developers…</div>
                  )}
                  {!devs.isLoading && (devs.data?.length ?? 0) === 0 && (
                    <div className="px-3 py-3 text-xs text-[#1A1A1A]/60">No developers match that name.</div>
                  )}
                  {(devs.data ?? []).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      data-developer-option
                      onClick={() => { setPicked(d); setOpen(false); }}
                      className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-[#EFE6D6]/70 border-b last:border-b-0 border-[#B89555]/15 overflow-visible"
                    >
                      {d.logo_url ? (
                        <img src={d.logo_url} alt={d.name} className="h-7 w-7 object-contain rounded bg-[#EFE6D6] p-0.5 flex-shrink-0" />
                      ) : (
                        <div data-surface="emerald" data-allow-dark-cta className="allow-white h-8 w-8 rounded-xl bg-[image:var(--jj-emerald-ombre)] border border-white/15 grid place-items-center text-[10px] font-bold text-white flex-shrink-0 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75)]">
                          {d.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span data-developer-name className="text-sm text-[#1A1A1A] min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{d.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Date + time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 font-semibold mb-1.5">
              <CalendarIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> Visit date
            </label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] h-11" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 font-semibold mb-1.5">
              <Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> Visit time
            </label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] h-11" />
          </div>
        </div>

        {/* Briefing + notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 font-semibold mb-1.5">
              <FileText className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> Briefing summary
            </label>
            <Textarea value={briefing} onChange={(e) => setBriefing(e.target.value)}
              placeholder="What did the developer brief you on? Projects, units, pricing, incentives…"
              className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] min-h-[120px]" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 font-semibold mb-1.5">
              Personal notes
            </label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything you want to remember (next steps, client fit, follow-up date…)"
              className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] min-h-[120px]" />
          </div>
        </div>

        {/* Sales rep block */}
        <div className="rounded-xl bg-[#FDFBF7] border border-[#B89555]/25 p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 font-semibold mb-3">
            <User className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> Sales representative at the developer
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input value={repName} onChange={(e) => setRepName(e.target.value)} placeholder="Rep full name"
              className="bg-white border-[#B89555]/40 text-[#1A1A1A] h-10" />
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/45" />
              <Input value={repPhone} onChange={(e) => setRepPhone(e.target.value)} placeholder="+971 50 000 0000"
                className="pl-9 bg-white border-[#B89555]/40 text-[#1A1A1A] h-10" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/45" />
              <Input value={repEmail} onChange={(e) => setRepEmail(e.target.value)} placeholder="rep@developer.com"
                className="pl-9 bg-white border-[#B89555]/40 text-[#1A1A1A] h-10" />
            </div>
          </div>

          {/* Rate the rep */}
          <div className="mt-4 pt-4 border-t border-[#B89555]/20">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 font-semibold mb-3">
              Rate this sales representative
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {RATING_CRITERIA.map((criterion) => {
                const value = repRatings[criterion];
                return (
                  <div key={criterion} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#1A1A1A]">{criterion}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const filled = n <= value;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              setRepRatings((prev) => ({
                                ...prev,
                                [criterion]: prev[criterion] === n ? 0 : n,
                              }))
                            }
                            className="p-0.5 rounded hover:scale-110 transition-transform"
                            aria-label={`${criterion} ${n} of 5`}
                          >
                            <Star
                              className="h-5 w-5"
                              style={{
                                color: filled ? "#064E3B" : "#1A1A1A33",
                                fill: filled ? "#064E3B" : "transparent",
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback notes about the rep */}
          <div className="mt-4">
            <label className="block text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 font-semibold mb-1.5">
              Your feedback about this rep
            </label>
            <Textarea
              value={repFeedback}
              onChange={(e) => setRepFeedback(e.target.value)}
              placeholder="How was your experience with this sales representative? What stood out, what could be better…"
              className="bg-white border-[#B89555]/40 text-[#1A1A1A] min-h-[90px]"
            />
          </div>

        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={!picked || createMut.isPending}
            onClick={() => createMut.mutate()}
            className="jj-surface-emerald allow-white inline-flex items-center gap-2 h-11 px-5 rounded-md text-white text-sm font-semibold border border-white/20 hover:-translate-y-0.5 hover:brightness-110 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            data-allow-dark-cta
            data-no-contrast-guard
          >
            {createMut.isPending ? "Saving…" : (<><Check className="h-4 w-4" /> Save visit</>)}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#B89555]/20">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Your visit history</h2>
          <span className="text-xs text-[#1A1A1A]/55 tabular-nums">{visits.data?.length ?? 0} total</span>
        </div>
        {visits.isLoading ? (
          <div className="px-5 py-10 text-center text-sm text-[#1A1A1A]/60">Loading…</div>
        ) : (visits.data?.length ?? 0) === 0 ? (
          <BrokerEmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="No visits logged yet"
            description="Pick a developer above, fill in the date, briefing, and the sales rep you met — your first visit will appear here."
            className="rounded-none border-0 bg-transparent shadow-none"
          />
        ) : (
          <div className="divide-y divide-[#B89555]/15">
            {(visits.data ?? []).map((v) => (
              <div key={v.id} className="px-5 py-4 flex items-start gap-3">
                {v.developer?.logo_url ? (
                  <img src={v.developer.logo_url} alt="" className="h-9 w-9 object-contain rounded bg-[#EFE6D6] p-0.5 flex-shrink-0" />
                ) : (
                  <div data-surface="emerald" data-allow-dark-cta className="allow-white h-9 w-9 rounded-xl bg-[image:var(--jj-emerald-ombre)] border border-white/15 grid place-items-center text-[10px] font-bold text-white flex-shrink-0 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75)]">
                    {(v.developer?.name ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span data-developer-name className="text-sm font-semibold text-[#1A1A1A] whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{v.developer?.name ?? "Unknown developer"}</span>
                    <span className="text-[11px] text-[#1A1A1A]/60 tabular-nums">
                      {formatDisplayDate(v.visit_date)}{v.visit_time ? ` · ${v.visit_time.slice(0, 5)}` : ""}
                    </span>
                  </div>
                  {v.sales_rep_name && (
                    <div className="text-xs text-[#1A1A1A]/75 mt-0.5">
                      Rep: <span className="font-medium">{v.sales_rep_name}</span>
                      {v.sales_rep_phone ? ` · ${v.sales_rep_phone}` : ""}
                      {v.sales_rep_email ? ` · ${v.sales_rep_email}` : ""}
                    </div>
                  )}
                  {v.briefing_summary && (
                    <div className="text-xs text-[#1A1A1A]/80 mt-1.5 whitespace-pre-wrap">{v.briefing_summary}</div>
                  )}
                  {v.notes && (
                    <div className="text-[11px] text-[#1A1A1A]/65 mt-1 whitespace-pre-wrap italic">Note: {v.notes}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { if (confirm("Delete this visit?")) deleteMut.mutate(v.id); }}
                  className="h-8 w-8 grid place-items-center rounded-md border border-[#B89555]/30 text-[#1A1A1A]/60 hover:text-red-700 hover:bg-red-50"
                  aria-label="Delete visit"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
