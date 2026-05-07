import { useMemo } from "react";
import { Building2, Users, CheckCircle2, Clock, Calendar, Globe2 } from "lucide-react";
import { useAttendanceCounts } from "@/hooks/useBrokerageEvents";

interface Props {
  rows: any[];
}

export function BrokerageAnalyticsStrip({ rows }: Props) {
  const counts = useAttendanceCounts();

  const stats = useMemo(() => {
    const totalAgencies = rows.length;
    const totalBrokers = rows.reduce((s, r) => s + (Number(r.estimated_agent_count) || Number(r.active_broker_count) || 0), 0);
    const registered = rows.filter((r) => ["registered", "approved"].includes(r.registration_status)).length;
    const pending = rows.filter((r) => ["pending_documents", "documents_pending_review", "pending_registration", "under_review"].includes(r.registration_status)).length;

    let totalAttendance = 0;
    const countryMap: Record<string, number> = {};
    rows.forEach((r) => {
      totalAttendance += counts.data?.[r.id]?.total_attendance || 0;
      const c = (r.country || "").trim();
      if (c) countryMap[c] = (countryMap[c] || 0) + 1;
    });

    const avgPerAgency = totalAgencies ? (totalAttendance / totalAgencies) : 0;
    const countries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]);
    const avgPerCountry = countries.length ? (totalAgencies / countries.length) : 0;

    return { totalAgencies, totalBrokers, registered, pending, totalAttendance, avgPerAgency, countries, avgPerCountry };
  }, [rows, counts.data]);

  const tile = (label: string, value: string | number, Icon: any) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#B89555]/30 min-w-[140px]">
      <Icon className="w-4 h-4 text-[#B89555]" />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 font-semibold">{label}</div>
        <div className="text-sm font-bold text-[#1A1A1A]">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {tile("Agencies", stats.totalAgencies.toLocaleString(), Building2)}
        {tile("Est. brokers", stats.totalBrokers.toLocaleString(), Users)}
        {tile("Registered", stats.registered.toLocaleString(), CheckCircle2)}
        {tile("Pending", stats.pending.toLocaleString(), Clock)}
        {tile("Total attendance", stats.totalAttendance.toLocaleString(), Calendar)}
        {tile("Avg / agency", stats.avgPerAgency.toFixed(1), Calendar)}
        {tile("Countries", stats.countries.length.toLocaleString(), Globe2)}
        {tile("Avg / country", stats.avgPerCountry.toFixed(1), Globe2)}
      </div>
      {stats.countries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stats.countries.slice(0, 12).map(([c, n]) => (
            <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-white text-[#1A1A1A] border border-[#B89555]/30">
              {c} · {n.toLocaleString()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
