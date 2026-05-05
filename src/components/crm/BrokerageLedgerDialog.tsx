import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Trash2, Loader2, Search } from "lucide-react";
import {
  groupDealsByPeriod,
  summarize,
  filterDealsByDateRange,
  type Granularity,
} from "@/lib/crm/brokerageRevenue";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import BrokerageDealModal from "./BrokerageDealModal";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brokerageId: string;
  brokerageName: string;
};

const fmtAED = (n: number) =>
  `AED ${new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n || 0)}`;

export const BrokerageLedgerDialog = ({
  open,
  onOpenChange,
  brokerageId,
  brokerageName,
}: Props) => {
  const qc = useQueryClient();
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
  const [agentFilter, setAgentFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: deals = [], isLoading, refetch } = useQuery({
    queryKey: ["brokerage-deals", brokerageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_brokerage_deals")
        .select("*")
        .eq("brokerage_id", brokerageId)
        .order("closed_on", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && !!brokerageId,
    staleTime: 30_000,
  });

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setAddOpen(false);
    }
    onOpenChange(v);
  };

  const filteredDeals = useMemo(() => {
    let d = deals as any[];
    if (range) d = filterDealsByDateRange(d, range.start, range.end) as any[];
    if (agentFilter.trim()) {
      const q = agentFilter.toLowerCase();
      d = d.filter(
        (x: any) =>
          (x.agent_name || "").toLowerCase().includes(q) ||
          (x.client_name || "").toLowerCase().includes(q) ||
          (x.unit_label || "").toLowerCase().includes(q) ||
          (x.developer_name_snapshot || "").toLowerCase().includes(q),
      );
    }
    return d;
  }, [deals, range, agentFilter]);

  const totals = summarize(filteredDeals as any);
  const rollups = useMemo(
    () => groupDealsByPeriod(filteredDeals as any, granularity),
    [filteredDeals, granularity],
  );

  const removeDeal = async (id: string) => {
    if (!confirm("Delete this deal?")) return;
    const { error } = await supabase.from("crm_brokerage_deals").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deal removed");
    qc.invalidateQueries({ queryKey: ["brokerages"] });
    refetch();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
              <Trophy className="w-5 h-5 text-[#B89555]" />
              Deal Ledger — {brokerageName}
            </DialogTitle>
          </DialogHeader>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <DateRangeFilter onRangeChange={(r) => setRange(r)} />
            <Select
              value={granularity}
              onValueChange={(v) => setGranularity(v as Granularity)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70" />
              <Input
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                placeholder="Search by agent, client, project, developer"
                className="pl-10"
              />
            </div>
            <Button variant="gold" onClick={() => setAddOpen(true)}>
              <Trophy className="w-4 h-4 mr-1" />
              Register Deal
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 items-stretch">
            {[
              { label: "Deals", value: totals.count, isCount: true },
              { label: "Gross value", value: totals.gross },
              { label: "Commission", value: totals.commission },
              { label: "Avg deal size", value: Math.round(totals.avg) },
            ].map((k) => {
              const display = k.isCount ? String(k.value) : fmtAED(Number(k.value));
              return (
                <div
                  key={k.label}
                  className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 min-h-[96px] flex flex-col items-center justify-center text-center"
                >
                  <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 font-semibold whitespace-nowrap">
                    {k.label}
                  </div>
                  <div
                    className="text-xl md:text-2xl font-bold text-[#1A1A1A] mt-1 tabular-nums leading-tight whitespace-nowrap truncate max-w-full"
                    title={display}
                  >
                    {display}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Period rollup */}
          <div className="mt-4 border border-[#B89555]/30 rounded-lg overflow-hidden bg-white">
            <div className="px-3 py-2 bg-[#EFE6D6] border-b border-[#B89555]/30 text-sm font-semibold text-[#1A1A1A]">
              Revenue by{" "}
              {granularity === "month"
                ? "month"
                : granularity === "quarter"
                  ? "quarter"
                  : "year"}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
                <tr>
                  <th className="p-2 text-left whitespace-nowrap">Period</th>
                  <th className="p-2 text-right whitespace-nowrap">Deals</th>
                  <th className="p-2 text-right whitespace-nowrap">Gross</th>
                  <th className="p-2 text-right whitespace-nowrap">Commission</th>
                </tr>
              </thead>
              <tbody>
                {rollups.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-[#1A1A1A]/60 text-sm"
                    >
                      No deals in this range yet
                    </td>
                  </tr>
                )}
                {rollups.map((r) => (
                  <tr key={r.sortKey} className="border-t border-[#B89555]/15">
                    <td className="p-2 font-medium">{r.period}</td>
                    <td className="p-2 text-right">{r.deals}</td>
                    <td className="p-2 text-right">{fmtAED(r.gross)}</td>
                    <td className="p-2 text-right font-semibold">
                      {fmtAED(r.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deals table */}
          <div className="mt-4 border border-[#B89555]/30 rounded-lg overflow-hidden bg-white">
            <div className="px-3 py-2 bg-[#EFE6D6] border-b border-[#B89555]/30 text-sm font-semibold text-[#1A1A1A]">
              Individual deals
            </div>
            {isLoading ? (
              <div className="p-6 flex items-center gap-2 text-[#1A1A1A]/70">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Agent</th>
                      <th className="p-2 text-left">Project / Unit</th>
                      <th className="p-2 text-left">Client</th>
                      <th className="p-2 text-left">Developer</th>
                      <th className="p-2 text-right">Value</th>
                      <th className="p-2 text-right">Commission</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-4 text-center text-[#1A1A1A]/60 text-sm"
                        >
                          No deals registered yet. Click "Register Deal" to add one.
                        </td>
                      </tr>
                    )}
                    {filteredDeals.map((d: any) => (
                      <tr key={d.id} className="border-t border-[#B89555]/15">
                        <td className="p-2 whitespace-nowrap">
                          {d.closed_on
                            ? new Date(d.closed_on).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="p-2">{d.agent_name || "—"}</td>
                        <td className="p-2">{d.unit_label || "—"}</td>
                        <td className="p-2">{d.client_name || "—"}</td>
                        <td className="p-2">{d.developer_name_snapshot || "—"}</td>
                        <td className="p-2 text-right">
                          {fmtAED(Number(d.deal_value_aed))}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {fmtAED(Number(d.commission_aed))}
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDeal(d.id)}
                            aria-label="Delete deal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BrokerageDealModal
        open={addOpen}
        onOpenChange={setAddOpen}
        brokerageId={brokerageId}
        brokerageName={brokerageName}
        onSaved={() => {
          refetch();
          qc.invalidateQueries({ queryKey: ["brokerages"] });
        }}
      />
    </>
  );
};

export default BrokerageLedgerDialog;
