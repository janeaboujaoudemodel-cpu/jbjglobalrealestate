import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, UserPlus } from "lucide-react";
import { AddBrokerSheet } from "@/pages/owner/crm/BrokersRegistry";

type Mode = "salary" | "commission";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  onSaved?: () => void;
}

interface BrokerRow {
  id: string;
  full_name: string;
  current_company: string | null;
  database_source: string | null;
  is_global_broker: boolean | null;
  department: string | null;
}

const SCOPES = [
  { value: "all",     label: "All brokers" },
  { value: "company", label: "Company brokers (JBJ)" },
  { value: "global",  label: "External / global brokers" },
] as const;

export function AddPayrollEntryDialog({ open, onOpenChange, mode, onSaved }: Props) {
  const { toast } = useToast();
  const [scope, setScope] = useState<(typeof SCOPES)[number]["value"]>("all");
  const [source, setSource] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [brokers, setBrokers] = useState<BrokerRow[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [pickedBrokerId, setPickedBrokerId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- "Add new broker" -> opens canonical AddBrokerSheet ------------------
  const [addBrokerSheetOpen, setAddBrokerSheetOpen] = useState(false);
  const [brokerReloadKey, setBrokerReloadKey] = useState(0);

  // --- Payroll fields ----------------------------------------------------
  const [employeeNameOverride, setEmployeeNameOverride] = useState("");
  const [department, setDepartment] = useState("Brokerage");
  const [baseSalary, setBaseSalary] = useState("");
  const [salaryType, setSalaryType] = useState<"monthly" | "annual" | "hourly">("monthly");
  const [currency, setCurrency] = useState("AED");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [dealRef, setDealRef] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [commissionRate, setCommissionRate] = useState("0.025");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [dealClosedDate, setDealClosedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setPickedBrokerId(null);
    setEmployeeNameOverride("");
    setBaseSalary(""); setDealRef(""); setDealValue(""); setCommissionAmount(""); setNotes("");
  }, [open, mode]);

  // Auto-compute commission amount from rate × deal value
  useEffect(() => {
    if (mode !== "commission") return;
    const dv = parseFloat(dealValue);
    const rate = parseFloat(commissionRate);
    if (!isNaN(dv) && !isNaN(rate)) {
      setCommissionAmount(String((dv * rate).toFixed(2)));
    }
  }, [dealValue, commissionRate, mode]);

  // Load broker list
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      let q = (supabase as any).from("crm_brokers").select(
        "id, full_name, current_company, database_source, is_global_broker, department",
      ).order("full_name", { ascending: true }).limit(50);

      if (scope === "company") q = q.eq("is_global_broker", false);
      if (scope === "global") q = q.eq("is_global_broker", true);
      if (source !== "all") q = q.eq("database_source", source);
      if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);

      const { data, error } = await q;
      if (cancelled) return;
      if (error) {
        toast({ title: "Couldn't load brokers", description: error.message, variant: "destructive" });
        setBrokers([]);
      } else {
        setBrokers((data ?? []) as BrokerRow[]);
      }
      setLoadingList(false);
    })();
    return () => { cancelled = true; };
  }, [open, scope, source, search, toast]);

  // Load distinct sources once per open
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("crm_brokers")
        .select("database_source")
        .not("database_source", "is", null)
        .limit(500);
      const uniq = Array.from(new Set(((data ?? []) as Array<{ database_source: string }>)
        .map((r) => r.database_source)
        .filter(Boolean)));
      setSources(uniq.sort());
    })();
  }, [open]);

  const pickedBroker = useMemo(
    () => brokers.find((b) => b.id === pickedBrokerId) ?? null,
    [brokers, pickedBrokerId],
  );

  const resolvedEmployeeName =
    employeeNameOverride.trim() ||
    pickedBroker?.full_name ||
    nbName.trim() ||
    "";

  const handleCreateBrokerInline = async () => {
    if (!nbName.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return null;
    }
    const { data, error } = await (supabase as any)
      .from("crm_brokers")
      .insert({
        full_name: nbName.trim(),
        current_company: nbCompany.trim() || null,
        phone_e164: nbPhone.trim() || null,
        database_source: "manual_payroll_add",
        is_global_broker: false,
      })
      .select("id, full_name, current_company, database_source, is_global_broker, department")
      .single();
    if (error) {
      toast({ title: "Couldn't create broker", description: error.message, variant: "destructive" });
      return null;
    }
    const row = data as BrokerRow;
    setBrokers((prev) => [row, ...prev]);
    setPickedBrokerId(row.id);
    setShowNewBroker(false);
    toast({ title: "Broker added", description: row.full_name });
    return row;
  };

  const handleSave = async () => {
    if (!pickedBrokerId && !showNewBroker) {
      toast({ title: "Pick a broker first", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let brokerRow: BrokerRow | null = pickedBroker;
      if (!brokerRow && showNewBroker) {
        brokerRow = await handleCreateBrokerInline();
        if (!brokerRow) { setSaving(false); return; }
      }
      if (!brokerRow) { setSaving(false); return; }

      const empName = resolvedEmployeeName || brokerRow.full_name;
      const dept = department.trim() || brokerRow.department || "Brokerage";

      if (mode === "salary") {
        const amt = parseFloat(baseSalary);
        if (isNaN(amt) || amt <= 0) {
          toast({ title: "Enter a valid base salary", variant: "destructive" });
          setSaving(false); return;
        }
        const { error } = await (supabase as any).from("employee_salaries").insert({
          broker_id: brokerRow.id,
          employee_name: empName,
          department: dept,
          base_salary: amt,
          currency,
          salary_type: salaryType,
          effective_date: effectiveDate,
          notes: notes || null,
        });
        if (error) throw error;
        toast({ title: "Salary added", description: `${empName} · ${currency} ${amt.toLocaleString()}` });
      } else {
        const dv = parseFloat(dealValue);
        const rate = parseFloat(commissionRate);
        const amt = parseFloat(commissionAmount);
        if (isNaN(amt) || amt <= 0) {
          toast({ title: "Enter a valid commission amount", variant: "destructive" });
          setSaving(false); return;
        }
        const { error } = await (supabase as any).from("employee_commissions").insert({
          broker_id: brokerRow.id,
          employee_name: empName,
          deal_reference: dealRef || null,
          deal_value: isNaN(dv) ? 0 : dv,
          commission_rate: isNaN(rate) ? 0 : rate,
          commission_amount: amt,
          currency,
          status: "pending",
          deal_closed_date: dealClosedDate,
          notes: notes || null,
        });
        if (error) throw error;
        toast({ title: "Commission added", description: `${empName} · ${currency} ${amt.toLocaleString()}` });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] border-[#B89555]/40 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">
            {mode === "salary" ? "Add Salary" : "Add Commission"}
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Pick a broker from the CRM (company brokers, external brokers, or by source) — or
            add a brand-new broker inline. The record is wired straight into payroll.
          </DialogDescription>
        </DialogHeader>

        {/* Broker scope + source + search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={scope} onValueChange={(v: any) => setScope(v)}>
            <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/40">
              <SelectValue placeholder="Source / database" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-[#1A1A1A]/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search broker name…"
              className="pl-7 bg-[#F7F2EA] border-[#B89555]/40"
            />
          </div>
        </div>

        {/* Broker list */}
        <div className="border border-[#B89555]/30 rounded-lg max-h-48 overflow-y-auto bg-[#F7F2EA]">
          {loadingList ? (
            <div className="p-6 text-center text-[#1A1A1A]/60 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading brokers…
            </div>
          ) : brokers.length === 0 ? (
            <div className="p-6 text-center text-[#1A1A1A]/60 text-sm">
              No brokers match. Try a different scope, source, or add one below.
            </div>
          ) : (
            <ul className="divide-y divide-[#B89555]/20">
              {brokers.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => { setPickedBrokerId(b.id); setShowNewBroker(false); }}
                    className={`w-full text-left px-3 py-2 hover:bg-[#EFE6D6] transition-colors ${
                      pickedBrokerId === b.id ? "bg-[#EFE6D6] ring-1 ring-[#B89555]/60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#1A1A1A]">{b.full_name}</span>
                      <span className="text-[10px] text-[#1A1A1A]/60">
                        {b.is_global_broker ? "External" : "Company"}
                      </span>
                    </div>
                    <div className="text-xs text-[#1A1A1A]/60 truncate">
                      {[b.current_company, b.department, b.database_source].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inline "add new broker" */}
        {!showNewBroker ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowNewBroker(true); setPickedBrokerId(null); }}
            className="border-[#B89555]/40 text-[#1A1A1A]"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Add a new broker instead
          </Button>
        ) : (
          <div className="border border-[#B89555]/40 rounded-lg p-3 bg-[#F7F2EA] space-y-2">
            <p className="text-xs font-medium text-[#1A1A1A] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> New broker
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input value={nbName} onChange={(e) => setNbName(e.target.value)}
                placeholder="Full name *" className="bg-[#FDFBF7] border-[#B89555]/40" />
              <Input value={nbCompany} onChange={(e) => setNbCompany(e.target.value)}
                placeholder="Brokerage / company" className="bg-[#FDFBF7] border-[#B89555]/40" />
              <Input value={nbPhone} onChange={(e) => setNbPhone(e.target.value)}
                placeholder="Phone" className="bg-[#FDFBF7] border-[#B89555]/40" />
            </div>
            <p className="text-[10px] text-[#1A1A1A]/60">
              Saved to CRM brokers on submit and attached to this payroll record.
            </p>
          </div>
        )}

        {/* Mode-specific fields */}
        <div className="border-t border-[#B89555]/30 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-[#1A1A1A]/70">Employee display name (override)</Label>
            <Input value={employeeNameOverride} onChange={(e) => setEmployeeNameOverride(e.target.value)}
              placeholder={pickedBroker?.full_name || nbName || "Auto from broker"}
              className="bg-[#F7F2EA] border-[#B89555]/40" />
          </div>
          <div>
            <Label className="text-xs text-[#1A1A1A]/70">Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)}
              className="bg-[#F7F2EA] border-[#B89555]/40" />
          </div>

          {mode === "salary" ? (
            <>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Base salary *</Label>
                <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="e.g. 15000" className="bg-[#F7F2EA] border-[#B89555]/40" />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Type</Label>
                <Select value={salaryType} onValueChange={(v: any) => setSalaryType(v)}>
                  <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className="bg-[#F7F2EA] border-[#B89555]/40" />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Effective date</Label>
                <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)}
                  className="bg-[#F7F2EA] border-[#B89555]/40" />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Deal reference</Label>
                <Input value={dealRef} onChange={(e) => setDealRef(e.target.value)}
                  placeholder="e.g. DXB-1042 / Marina Tower 304"
                  className="bg-[#F7F2EA] border-[#B89555]/40" />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Deal value</Label>
                <Input type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)}
                  placeholder="e.g. 2500000" className="bg-[#F7F2EA] border-[#B89555]/40" />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Commission rate (decimal, e.g. 0.025 = 2.5%)</Label>
                <Input type="number" step="0.0001" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)}
                  className="bg-[#F7F2EA] border-[#B89555]/40" />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Commission amount *</Label>
                <Input type="number" value={commissionAmount} onChange={(e) => setCommissionAmount(e.target.value)}
                  className="bg-[#F7F2EA] border-[#B89555]/40" />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className="bg-[#F7F2EA] border-[#B89555]/40" />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/70">Deal closed date</Label>
                <Input type="date" value={dealClosedDate} onChange={(e) => setDealClosedDate(e.target.value)}
                  className="bg-[#F7F2EA] border-[#B89555]/40" />
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <Label className="text-xs text-[#1A1A1A]/70">Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="bg-[#F7F2EA] border-[#B89555]/40" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}
            className="border-[#B89555]/40">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} variant="gold">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {mode === "salary" ? "Save Salary" : "Save Commission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddPayrollEntryDialog;
