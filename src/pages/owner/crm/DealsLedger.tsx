/**
 * DealsLedger — "My Deals"
 * Two tabs: CITI Developers (sales rep role) and JBJ Global (brokerage role).
 * Each row = client, project, developer, brokerage/broker, deal value,
 * commission %, auto commission amount, status, close date.
 * Insights strip: MoM revenue, MoM commission, YTD totals, avg deal size,
 * top developer, top broker, pending commissions.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, TrendingUp, Wallet, Trophy, Building2 } from "lucide-react";
import { toast } from "sonner";

type Portfolio = "citi_developers" | "jbj_global";
type DealStatus =
  | "draft"
  | "signed"
  | "invoiced"
  | "commission_received"
  | "cancelled";

type Deal = {
  id: string;
  owner_id: string;
  portfolio: Portfolio;
  client_name: string;
  client_contact: string | null;
  project_name: string | null;
  developer_name: string | null;
  brokerage_name: string | null;
  broker_name: string | null;
  deal_value_aed: number;
  commission_pct: number;
  commission_amount_aed: number;
  status: DealStatus;
  close_date: string | null;
  notes: string | null;
};

const STATUS_LABEL: Record<DealStatus, string> = {
  draft: "Draft",
  signed: "Signed",
  invoiced: "Invoiced",
  commission_received: "Commission received",
  cancelled: "Cancelled",
};

function fmtAED(n: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function monthKey(d: string | null) {
  if (!d) return "";
  return d.slice(0, 7);
}

export default function DealsLedger() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio>("citi_developers");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("crm_my_deals")
      .select("*")
      .eq("owner_id", user.id)
      .order("close_date", { ascending: false, nullsFirst: false });
    if (error) toast.error(error.message);
    setDeals((data as Deal[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const scoped = useMemo(
    () => deals.filter((d) => d.portfolio === portfolio),
    [deals, portfolio]
  );

  const insights = useMemo(() => {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastDate.toISOString().slice(0, 7);
    const yearPrefix = now.getFullYear().toString();

    const closedThisMonth = scoped.filter(
      (d) => monthKey(d.close_date) === thisMonth && d.status !== "cancelled"
    );
    const closedLastMonth = scoped.filter(
      (d) => monthKey(d.close_date) === lastMonth && d.status !== "cancelled"
    );
    const ytd = scoped.filter(
      (d) =>
        (d.close_date || "").startsWith(yearPrefix) && d.status !== "cancelled"
    );
    const sum = (arr: Deal[], k: keyof Deal) =>
      arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);

    const pending = scoped
      .filter((d) => d.status === "signed" || d.status === "invoiced")
      .reduce((s, r) => s + (r.commission_amount_aed || 0), 0);

    const byKey = (k: "developer_name" | "broker_name") => {
      const map = new Map<string, number>();
      scoped.forEach((d) => {
        const key = (d[k] || "").trim();
        if (!key) return;
        map.set(key, (map.get(key) || 0) + (d.deal_value_aed || 0));
      });
      const top = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
      return top ? { name: top[0], total: top[1] } : null;
    };

    return {
      momRevenue: sum(closedThisMonth, "deal_value_aed"),
      momRevenuePrev: sum(closedLastMonth, "deal_value_aed"),
      momCommission: sum(closedThisMonth, "commission_amount_aed"),
      ytdRevenue: sum(ytd, "deal_value_aed"),
      ytdCommission: sum(ytd, "commission_amount_aed"),
      avgSize: ytd.length ? sum(ytd, "deal_value_aed") / ytd.length : 0,
      topDeveloper: byKey("developer_name"),
      topBroker: byKey("broker_name"),
      pending,
      count: scoped.length,
    };
  }, [scoped]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-normal text-[#0F1A16]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            My Deals
          </h1>
          <p className="text-sm text-[#4B5D55]">
            Personal ledger — CITI Developers (sales rep) and JBJ Global
            (brokerage) revenue &amp; commission.
          </p>
        </div>
        <NewDealDialog
          open={open}
          onOpenChange={setOpen}
          defaultPortfolio={portfolio}
          onCreated={load}
        />
      </div>

      <Tabs
        value={portfolio}
        onValueChange={(v) => setPortfolio(v as Portfolio)}
      >
        <TabsList className="bg-white border border-emerald-900/15">
          <TabsTrigger
            value="citi_developers"
            className="data-[state=active]:bg-[#064E3B] data-[state=active]:text-white"
          >
            CITI Developers
          </TabsTrigger>
          <TabsTrigger
            value="jbj_global"
            className="data-[state=active]:bg-[#064E3B] data-[state=active]:text-white"
          >
            JBJ Global
          </TabsTrigger>
        </TabsList>

        <TabsContent value={portfolio} className="mt-4 space-y-5">
          {/* Insights strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <InsightCard
              icon={<TrendingUp className="size-4" />}
              label="Revenue MoM"
              value={fmtAED(insights.momRevenue)}
              sub={`vs ${fmtAED(insights.momRevenuePrev)} last month`}
            />
            <InsightCard
              icon={<Wallet className="size-4" />}
              label="Commission MoM"
              value={fmtAED(insights.momCommission)}
              sub={`YTD ${fmtAED(insights.ytdCommission)}`}
            />
            <InsightCard
              icon={<Trophy className="size-4" />}
              label="Top developer"
              value={insights.topDeveloper?.name || "—"}
              sub={
                insights.topDeveloper
                  ? fmtAED(insights.topDeveloper.total)
                  : "No deals yet"
              }
            />
            <InsightCard
              icon={<Building2 className="size-4" />}
              label="Pending commission"
              value={fmtAED(insights.pending)}
              sub={`Avg deal ${fmtAED(insights.avgSize)}`}
            />
          </div>

          {/* Deals table */}
          <Card className="border-emerald-900/10">
            <CardHeader className="border-b border-emerald-900/10">
              <CardTitle className="text-base text-[#0F1A16]">
                {insights.count} deal{insights.count === 1 ? "" : "s"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-sm text-[#4B5D55]">Loading…</div>
              ) : scoped.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#4B5D55]">
                  No deals yet. Add your first deal.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-emerald-900/5 text-[#0F1A16]">
                      <tr className="text-left">
                        <th className="px-4 py-2">Client</th>
                        <th className="px-4 py-2">Project</th>
                        <th className="px-4 py-2">Developer</th>
                        <th className="px-4 py-2">Broker</th>
                        <th className="px-4 py-2 text-right">Value</th>
                        <th className="px-4 py-2 text-right">Commission</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoped.map((d) => (
                        <tr
                          key={d.id}
                          className="border-t border-emerald-900/10 hover:bg-emerald-900/5"
                        >
                          <td className="px-4 py-2 font-medium text-[#0F1A16]">
                            {d.client_name}
                          </td>
                          <td className="px-4 py-2 text-[#0F1A16]">
                            {d.project_name || "—"}
                          </td>
                          <td className="px-4 py-2 text-[#0F1A16]">
                            {d.developer_name || "—"}
                          </td>
                          <td className="px-4 py-2 text-[#0F1A16]">
                            {d.broker_name || d.brokerage_name || "—"}
                          </td>
                          <td className="px-4 py-2 text-right text-[#0F1A16]">
                            {fmtAED(d.deal_value_aed)}
                          </td>
                          <td className="px-4 py-2 text-right text-[#0F1A16]">
                            {fmtAED(d.commission_amount_aed)}
                            <span className="text-[#4B5D55] text-xs">
                              {" "}
                              ({d.commission_pct}%)
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <Badge className="bg-[#064E3B] text-white border-0">
                              {STATUS_LABEL[d.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-[#4B5D55]">
                            {d.close_date || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="border-emerald-900/10 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[#4B5D55] text-xs uppercase tracking-wider">
          <span className="inline-grid place-items-center size-6 rounded-md bg-[#064E3B] text-white">
            {icon}
          </span>
          {label}
        </div>
        <div className="mt-2 text-lg font-semibold text-[#0F1A16] truncate">
          {value}
        </div>
        {sub && <div className="text-xs text-[#4B5D55] mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function NewDealDialog({
  open,
  onOpenChange,
  defaultPortfolio,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultPortfolio: Portfolio;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    portfolio: defaultPortfolio,
    client_name: "",
    client_contact: "",
    project_name: "",
    developer_name: "",
    brokerage_name: "",
    broker_name: "",
    deal_value_aed: 0,
    commission_pct: 0,
    status: "draft" as DealStatus,
    close_date: "",
    notes: "",
  });

  useEffect(() => {
    setForm((f) => ({ ...f, portfolio: defaultPortfolio }));
  }, [defaultPortfolio]);

  const save = async () => {
    if (!user) return;
    if (!form.client_name.trim()) {
      toast.error("Client name is required");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("crm_my_deals").insert({
      owner_id: user.id,
      portfolio: form.portfolio,
      client_name: form.client_name.trim(),
      client_contact: form.client_contact.trim() || null,
      project_name: form.project_name.trim() || null,
      developer_name: form.developer_name.trim() || null,
      brokerage_name: form.brokerage_name.trim() || null,
      broker_name: form.broker_name.trim() || null,
      deal_value_aed: Number(form.deal_value_aed) || 0,
      commission_pct: Number(form.commission_pct) || 0,
      status: form.status,
      close_date: form.close_date || null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deal added");
    onOpenChange(false);
    setForm({
      portfolio: defaultPortfolio,
      client_name: "",
      client_contact: "",
      project_name: "",
      developer_name: "",
      brokerage_name: "",
      broker_name: "",
      deal_value_aed: 0,
      commission_pct: 0,
      status: "draft",
      close_date: "",
      notes: "",
    });
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-[#064E3B] hover:bg-[#042c1c] text-white">
          <Plus className="size-4 mr-1.5 text-white" />
          Add deal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#0F1A16]">New deal</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Portfolio">
            <Select
              value={form.portfolio}
              onValueChange={(v) =>
                setForm({ ...form, portfolio: v as Portfolio })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="citi_developers">CITI Developers</SelectItem>
                <SelectItem value="jbj_global">JBJ Global</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm({ ...form, status: v as DealStatus })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {(Object.keys(STATUS_LABEL) as DealStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Client name *">
            <Input
              value={form.client_name}
              onChange={(e) =>
                setForm({ ...form, client_name: e.target.value })
              }
              className="bg-white"
            />
          </Field>
          <Field label="Client contact">
            <Input
              value={form.client_contact}
              onChange={(e) =>
                setForm({ ...form, client_contact: e.target.value })
              }
              className="bg-white"
            />
          </Field>
          <Field label="Project">
            <Input
              value={form.project_name}
              onChange={(e) =>
                setForm({ ...form, project_name: e.target.value })
              }
              className="bg-white"
            />
          </Field>
          <Field label="Developer">
            <Input
              value={form.developer_name}
              onChange={(e) =>
                setForm({ ...form, developer_name: e.target.value })
              }
              className="bg-white"
            />
          </Field>
          <Field label="Brokerage">
            <Input
              value={form.brokerage_name}
              onChange={(e) =>
                setForm({ ...form, brokerage_name: e.target.value })
              }
              className="bg-white"
            />
          </Field>
          <Field label="Broker">
            <Input
              value={form.broker_name}
              onChange={(e) =>
                setForm({ ...form, broker_name: e.target.value })
              }
              className="bg-white"
            />
          </Field>
          <Field label="Deal value (AED)">
            <Input
              type="number"
              value={form.deal_value_aed}
              onChange={(e) =>
                setForm({
                  ...form,
                  deal_value_aed: Number(e.target.value),
                })
              }
              className="bg-white"
            />
          </Field>
          <Field label="Commission %">
            <Input
              type="number"
              step="0.01"
              value={form.commission_pct}
              onChange={(e) =>
                setForm({
                  ...form,
                  commission_pct: Number(e.target.value),
                })
              }
              className="bg-white"
            />
          </Field>
          <Field label="Close date">
            <Input
              type="date"
              value={form.close_date}
              onChange={(e) =>
                setForm({ ...form, close_date: e.target.value })
              }
              className="bg-white"
            />
          </Field>
          <Field label="Notes" full>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="bg-white"
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-[#064E3B] hover:bg-[#042c1c] text-white"
          >
            {saving ? "Saving…" : "Save deal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2 space-y-1" : "space-y-1"}>
      <Label className="text-xs text-[#4B5D55]">{label}</Label>
      {children}
    </div>
  );
}
