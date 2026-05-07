import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Coffee, Phone, Mail, Users, Calendar, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Booking {
  id: string;
  preferred_date: string;
  preferred_time: string;
  brokerage_name: string | null;
  brokerage_id: string | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  attendee_count: number | null;
  briefing_topics: string | null;
  partnership_focus: string | null;
  status: string;
  created_at: string;
}

export const BreakfastBookingsSection = () => {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("meeting_requests")
        .select("id, preferred_date, preferred_time, brokerage_name, brokerage_id, requester_name, requester_email, requester_phone, attendee_count, briefing_topics, partnership_focus, status, created_at")
        .eq("booking_kind", "brokerage_breakfast")
        .in("status", ["pending", "completed"])
        .order("preferred_date", { ascending: true });
      if (error) {
        // RLS forbids this account — render empty state instead of spamming 403s.
        setRows([]);
      } else {
        setRows((data as any) || []);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    let cleanup: (() => void) | undefined;
    try {
      const ch = supabase
        .channel("breakfast-bookings-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "meeting_requests", filter: "booking_kind=eq.brokerage_breakfast" },
          () => load(),
        )
        .subscribe();
      cleanup = () => { supabase.removeChannel(ch); };
    } catch {
      // realtime not available — non-fatal
    }
    return () => cleanup?.();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const visible = rows.filter((r) => {
    if (filter === "upcoming") return r.preferred_date >= today;
    if (filter === "past") return r.preferred_date < today;
    return true;
  });

  return (
    <section className="rounded-2xl border border-[#B89555]/40 bg-[#F7F2EA] p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-[#B89555]" />
          <h2 className="text-base font-bold text-[#1A1A1A]">Breakfast & Briefing Bookings</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 text-[#1A1A1A] font-semibold">
            {visible.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {(["upcoming", "past", "all"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-xs px-3 py-1 rounded-md border ${
                filter === k
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-[#FDFBF7] text-[#1A1A1A] border-[#1A1A1A]/15 hover:bg-[#EFE6D6]"
              }`}
            >
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={load} className="h-7">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-[#1A1A1A]/60">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-10 text-sm text-[#1A1A1A]/70">
          No {filter} bookings yet. When a brokerage picks a breakfast slot, it'll appear here automatically.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#B89555]/30 bg-[#FDFBF7]">
          <table className="w-full text-sm">
            <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">When</th>
                <th className="text-left px-3 py-2 font-semibold">Brokerage</th>
                <th className="text-left px-3 py-2 font-semibold">Contact</th>
                <th className="text-left px-3 py-2 font-semibold">Reach</th>
                <th className="text-left px-3 py-2 font-semibold">Pax</th>
                <th className="text-left px-3 py-2 font-semibold">Briefing</th>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-t border-[#1A1A1A]/10 hover:bg-[#F7F2EA]/40">
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-1.5 text-[#1A1A1A] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#B89555]" />
                      {format(parseISO(r.preferred_date), "EEE d MMM")}
                    </div>
                    <div className="text-xs text-[#1A1A1A]/70 ml-5">{r.preferred_time}</div>
                  </td>
                  <td className="px-3 py-2 align-top font-semibold text-[#1A1A1A]">{r.brokerage_name || "—"}</td>
                  <td className="px-3 py-2 align-top text-[#1A1A1A]">{r.requester_name}</td>
                  <td className="px-3 py-2 align-top">
                    <a href={`mailto:${r.requester_email}`} className="flex items-center gap-1 text-xs text-[#1A1A1A] hover:underline">
                      <Mail className="w-3 h-3" /> {r.requester_email}
                    </a>
                    {r.requester_phone && (
                      <a href={`tel:${r.requester_phone}`} className="flex items-center gap-1 text-xs text-[#1A1A1A] hover:underline mt-0.5">
                        <Phone className="w-3 h-3" /> {r.requester_phone}
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-[#1A1A1A]">
                    <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{r.attendee_count || 1}</span>
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-[#1A1A1A]/80 max-w-[260px]">
                    {r.briefing_topics ? <div>{r.briefing_topics}</div> : <span className="text-[#1A1A1A]/40">—</span>}
                    {r.partnership_focus && <div className="mt-1 text-[#1A1A1A]/60 italic">{r.partnership_focus}</div>}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                      r.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-[#EFE6D6] text-[#1A1A1A]"
                    }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
