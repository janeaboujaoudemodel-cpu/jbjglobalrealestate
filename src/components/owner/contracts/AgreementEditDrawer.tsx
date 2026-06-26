import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeveloperOpt { id: string; name: string }

interface AgreementRow {
  id: string;
  developer_id: string | null;
  developer_name_raw: string | null;
  contract_type: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  commission_pct: number | null;
  status: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  agreement: AgreementRow | null;
}

const TYPE_OPTIONS = [
  "Developer Registration",
  "Developer ↔ Agency (A2A)",
  "Client Sales (SPA)",
  "Client Reservation / Booking",
  "Leasing / Ejari",
  "Property Advertising",
  "NDA",
  "Service / Consulting",
  "Other",
];

export function AgreementEditDrawer({ open, onOpenChange, agreement }: Props) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contractType, setContractType] = useState("");
  const [effective, setEffective] = useState("");
  const [expiry, setExpiry] = useState("");
  const [commission, setCommission] = useState<string>("");
  const [devSearch, setDevSearch] = useState("");
  const [devOptions, setDevOptions] = useState<DeveloperOpt[]>([]);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [developerName, setDeveloperName] = useState<string>("");

  useEffect(() => {
    if (!open || !agreement) return;
    setContractType(agreement.contract_type ?? "");
    setEffective(agreement.effective_date ?? "");
    setExpiry(agreement.expiry_date ?? "");
    setCommission(agreement.commission_pct != null ? String(agreement.commission_pct) : "");
    setDeveloperId(agreement.developer_id);
    setDeveloperName(agreement.developer_name_raw ?? "");
    setDevSearch(agreement.developer_name_raw ?? "");
    setDevOptions([]);
  }, [open, agreement?.id]);

  const searchDevs = async (term: string) => {
    setDevSearch(term);
    if (term.length < 2) { setDevOptions([]); return; }
    const { data } = await supabase
      .from("developers")
      .select("id, name")
      .ilike("name", `%${term}%`)
      .limit(10);
    setDevOptions(data ?? []);
  };

  const handleSave = async () => {
    if (!agreement) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("external_agreements")
        .update({
          developer_id: developerId,
          developer_name_raw: developerName || null,
          contract_type: contractType || null,
          effective_date: effective || null,
          expiry_date: expiry || null,
          commission_pct: commission ? Number(commission) : null,
          status: developerId ? "filed" : "pending_review",
        })
        .eq("id", agreement.id);
      if (error) throw error;
      toast.success("Agreement updated");
      qc.invalidateQueries({ queryKey: ["external_agreements"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!agreement) return;
    if (!confirm("Move this agreement to the trash? You can restore it from the database.")) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("external_agreements")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", agreement.id);
      if (error) throw error;
      toast.success("Agreement removed");
      qc.invalidateQueries({ queryKey: ["external_agreements"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#FDFBF7] sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[#1A1A1A]">Edit Agreement</SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/70">
            Re-classify, correct dates, or remove a misfiled agreement.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-xs text-[#1A1A1A]/70">Developer</Label>
            <Input
              value={devSearch}
              onChange={(e) => { searchDevs(e.target.value); setDeveloperName(e.target.value); setDeveloperId(null); }}
              placeholder="Search developer…"
              className="bg-white border-[#B89555]/30 mt-1"
            />
            {devOptions.length > 0 && (
              <div className="border border-[#B89555]/20 rounded-lg bg-white max-h-40 overflow-auto mt-1">
                {devOptions.map((d) => (
                  <button
                    key={d.id}
                    data-developer-option
                    onClick={() => { setDeveloperId(d.id); setDeveloperName(d.name); setDevSearch(d.name); setDevOptions([]); }}
                    className="flex w-full items-start text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F7F2EA] overflow-visible"
                  >
                    <span data-developer-name className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{d.name}</span>
                  </button>
                ))}
              </div>
            )}
            {developerId && (
              <p className="text-[10px] text-[color:var(--emerald-1)] mt-1">Linked to canonical developer</p>
            )}
          </div>

          <div>
            <Label className="text-xs text-[#1A1A1A]/70">Contract type</Label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full mt-1 h-10 rounded-md border border-[#B89555]/30 bg-white px-3 text-sm text-[#1A1A1A]"
            >
              <option value="">— Select —</option>
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#1A1A1A]/70">Effective</Label>
              <Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} className="bg-white border-[#B89555]/30 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A]/70">Expires</Label>
              <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="bg-white border-[#B89555]/30 mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#1A1A1A]/70">Commission %</Label>
            <Input type="number" step="0.1" value={commission} onChange={(e) => setCommission(e.target.value)} className="bg-white border-[#B89555]/30 mt-1" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={handleDelete} disabled={deleting || saving} className="border-red-300 text-red-700 hover:bg-red-50">
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={saving || deleting}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
