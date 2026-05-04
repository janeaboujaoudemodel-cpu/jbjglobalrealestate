import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

type Deal = {
  id: string;
  counterparty_type: "developer" | "brokerage";
  counterparty_id: string;
  project_name: string;
  gross_value_aed: number;
  commission_amount_aed: number;
  status: string;
  closed_at: string;
};

export default function OwnerRelationshipsRevenue() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: d }, { data: p }] = await Promise.all([
        (supabase as any).from("rel_deals").select("*").order("closed_at", { ascending: false }),
        (supabase as any).from("rel_deal_payments").select("*"),
      ]);
      setDeals(d ?? []);
      setPayments(p ?? []);
      setLoading(false);
    })();
  }, []);

  const paidByDeal = new Map<string, number>();
  for (const p of payments) paidByDeal.set(p.deal_id, (paidByDeal.get(p.deal_id) ?? 0) + Number(p.amount_aed));

  const calc = (filter: (d: Deal) => boolean) => {
    const subset = deals.filter(filter);
    const gross = subset.reduce((s, d) => s + Number(d.commission_amount_aed), 0);
    const paid = subset.reduce((s, d) => s + (paidByDeal.get(d.id) ?? 0), 0);
    return { count: subset.length, gross, paid, pending: gross - paid };
  };

  const devSide = calc((d) => d.counterparty_type === "developer");
  const brkSide = calc((d) => d.counterparty_type === "brokerage");
  const total = calc(() => true);

  if (loading) return <div className="p-8 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;

  return (
    <div className="p-6 space-y-6 bg-[#FDFBF7] min-h-screen">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Revenue Ledger</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pending AED", value: total.pending, tone: "amber" },
          { label: "Collected", value: total.paid, tone: "emerald" },
          { label: "Gross commission", value: total.gross, tone: "blue" },
          { label: "Open deals", value: total.count, tone: "ink", isCount: true },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#B89555]/30 bg-[#F7F2EA] p-4">
            <div className="text-xs text-[#1A1A1A]/70">{k.label}</div>
            <div className="text-2xl font-bold text-[#1A1A1A] mt-1">
              {k.isCount ? k.value : `AED ${fmt(k.value)}`}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { title: "Developers owe us (brokerage commissions)", side: devSide, filter: (d: Deal) => d.counterparty_type === "developer" },
          { title: "We owe brokerages (Citi Developers)", side: brkSide, filter: (d: Deal) => d.counterparty_type === "brokerage" },
        ].map((col) => (
          <div key={col.title} className="border border-[#B89555]/30 rounded-md bg-white">
            <div className="p-3 border-b border-[#B89555]/20 bg-[#EFE6D6]">
              <div className="font-semibold text-[#1A1A1A]">{col.title}</div>
              <div className="text-xs text-[#1A1A1A]/70 mt-0.5">
                Pending AED {fmt(col.side.pending)} · {col.side.count} deals
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
                <tr>
                  <th className="p-2 text-left">Project</th>
                  <th className="p-2 text-right">Commission</th>
                  <th className="p-2 text-right">Paid</th>
                  <th className="p-2 text-right">Pending</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {deals.filter(col.filter).map((d) => {
                  const paid = paidByDeal.get(d.id) ?? 0;
                  return (
                    <tr key={d.id} className="border-t border-[#B89555]/15">
                      <td className="p-2">{d.project_name}</td>
                      <td className="p-2 text-right">{fmt(Number(d.commission_amount_aed))}</td>
                      <td className="p-2 text-right">{fmt(paid)}</td>
                      <td className="p-2 text-right font-semibold">{fmt(Number(d.commission_amount_aed) - paid)}</td>
                      <td className="p-2">{d.status}</td>
                    </tr>
                  );
                })}
                {deals.filter(col.filter).length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-[#1A1A1A]/60 text-sm">No deals yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
