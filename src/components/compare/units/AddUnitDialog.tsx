import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface UnitDraft {
  id: string;
  label: string;
  bedrooms: string; // "studio" | "1" | "2" | ...
  sizeSqft: number;
  priceAED: number;
  propertyType: string;
  serviceCharge: string;
  view: string;
  floor: string;
  unitNumber: string;
  cityNumber: string;
  layout: string;
  description: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd?: (u: UnitDraft) => void;
  onSave?: (u: UnitDraft) => void;
  initialUnit?: UnitDraft | null;
}

const fld: React.CSSProperties = {
  background: "#FDFBF7",
  border: "1px solid rgba(184,149,85,0.45)",
  color: "#1A1A1A",
  caretColor: "#B89555",
};

const emptyUnit = (): UnitDraft => ({
  id: crypto.randomUUID(),
  label: "",
  bedrooms: "1",
  sizeSqft: 800,
  priceAED: 1500000,
  propertyType: "Apartment",
  serviceCharge: "",
  view: "",
  floor: "",
  unitNumber: "",
  cityNumber: "",
  layout: "",
  description: "",
});

export default function AddUnitDialog({ open, onOpenChange, onAdd, onSave, initialUnit }: Props) {
  const [d, setD] = useState<UnitDraft>({ ...emptyUnit() });

  useEffect(() => {
    if (!open) return;
    setD(initialUnit ? { ...initialUnit } : emptyUnit());
  }, [initialUnit, open]);

  const submit = () => {
    const autoLabel = d.bedrooms === "studio" ? "Studio" : `${d.bedrooms} BR`;
    const label = d.label.trim() || (d.view ? `${autoLabel} – ${d.view}` : autoLabel);
    if (!d.sizeSqft || d.sizeSqft <= 0) {
      toast.error("Enter a valid size in sqft.");
      return;
    }
    if (!d.priceAED || d.priceAED <= 0) {
      toast.error("Enter a valid price in AED.");
      return;
    }
    const next = { ...d, id: initialUnit?.id || crypto.randomUUID(), label };
    if (initialUnit) onSave?.(next);
    else onAdd?.(next);
    toast.success(initialUnit ? "Unit updated" : `Added ${label}`);
    onOpenChange(false);
    setD(emptyUnit());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.55)", color: "#1A1A1A" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">{initialUnit ? "Edit unit" : "Add a unit"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Label">
            <input value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} placeholder="1BR – Sea view" className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Bedrooms">
            <select value={d.bedrooms} onChange={(e) => setD({ ...d, bedrooms: e.target.value })} className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard>
              {["studio","1","2","3","4","5+"].map(b => <option key={b} value={b} style={{ color: "#1A1A1A" }}>{b === "studio" ? "Studio" : `${b} BR`}</option>)}
            </select>
          </Field>
          <Field label="Size (sqft)">
            <input type="number" value={d.sizeSqft} onChange={(e) => setD({ ...d, sizeSqft: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Price (AED)">
            <input type="number" value={d.priceAED} onChange={(e) => setD({ ...d, priceAED: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Property type">
            <input value={d.propertyType} onChange={(e) => setD({ ...d, propertyType: e.target.value })} placeholder="Apartment / serviced / townhouse" className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Service charge">
            <input value={d.serviceCharge} onChange={(e) => setD({ ...d, serviceCharge: e.target.value })} placeholder="AED 18/sqft" className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="View">
            <input value={d.view} onChange={(e) => setD({ ...d, view: e.target.value })} placeholder="Sea / Community / Pool" className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Floor">
            <input value={d.floor} onChange={(e) => setD({ ...d, floor: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Unit #" full>
            <input value={d.unitNumber} onChange={(e) => setD({ ...d, unitNumber: e.target.value })} placeholder="Optional (private)" className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="City number">
            <input value={d.cityNumber} onChange={(e) => setD({ ...d, cityNumber: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Layout">
            <input value={d.layout} onChange={(e) => setD({ ...d, layout: e.target.value })} placeholder="Type A / corner / high floor" className="w-full px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Description" full>
            <textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="Unit notes, management, USPs, amenities…" className="w-full min-h-20 px-3 py-2 rounded-lg outline-none focus:border-[#B89555]" style={fld} data-no-contrast-guard />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6] border border-[#B89555]/40"
          >
            Cancel
          </Button>
          <button
            onClick={submit}
            data-cta="dark"
            className="jj-cta-dark px-4 py-2 rounded-lg font-semibold"
          >
            {initialUnit ? "Save unit" : "Add unit"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs font-medium text-[#1A1A1A]/75">{label}</span>
      {children}
    </label>
  );
}
