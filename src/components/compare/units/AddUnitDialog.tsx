import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface UnitDraft {
  id: string;
  label: string;
  bedrooms: string; // "studio" | "1" | "2" | ...
  sizeSqft: number;
  priceAED: number;
  view: string;
  floor: string;
  unitNumber: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (u: UnitDraft) => void;
}

const fld: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#FFFFFF",
};

export default function AddUnitDialog({ open, onOpenChange, onAdd }: Props) {
  const [d, setD] = useState<UnitDraft>({
    id: crypto.randomUUID(),
    label: "",
    bedrooms: "1",
    sizeSqft: 800,
    priceAED: 1500000,
    view: "",
    floor: "",
    unitNumber: "",
  });

  const submit = () => {
    const autoLabel = d.bedrooms === "studio" ? "Studio" : `${d.bedrooms} BR`;
    const label = d.label.trim() || (d.view ? `${autoLabel} – ${d.view}` : autoLabel);
    if (!d.sizeSqft || !d.priceAED) return;
    onAdd({ ...d, id: crypto.randomUUID(), label });
    onOpenChange(false);
    setD({ id: crypto.randomUUID(), label: "", bedrooms: "1", sizeSqft: 800, priceAED: 1500000, view: "", floor: "", unitNumber: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" style={{ background: "#0F1020", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF" }}>
        <DialogHeader>
          <DialogTitle className="text-white">Add a unit</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Label">
            <input value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} placeholder="1BR – Sea view" className="w-full px-3 py-2 rounded-lg outline-none" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Bedrooms">
            <select value={d.bedrooms} onChange={(e) => setD({ ...d, bedrooms: e.target.value })} className="w-full px-3 py-2 rounded-lg outline-none" style={fld} data-no-contrast-guard>
              {["studio","1","2","3","4","5+"].map(b => <option key={b} value={b} style={{ color: "#1A1A1A" }}>{b === "studio" ? "Studio" : `${b} BR`}</option>)}
            </select>
          </Field>
          <Field label="Size (sqft)">
            <input type="number" value={d.sizeSqft} onChange={(e) => setD({ ...d, sizeSqft: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg outline-none" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Price (AED)">
            <input type="number" value={d.priceAED} onChange={(e) => setD({ ...d, priceAED: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg outline-none" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="View">
            <input value={d.view} onChange={(e) => setD({ ...d, view: e.target.value })} placeholder="Sea / Community / Pool" className="w-full px-3 py-2 rounded-lg outline-none" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Floor">
            <input value={d.floor} onChange={(e) => setD({ ...d, floor: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 rounded-lg outline-none" style={fld} data-no-contrast-guard />
          </Field>
          <Field label="Unit #" full>
            <input value={d.unitNumber} onChange={(e) => setD({ ...d, unitNumber: e.target.value })} placeholder="Optional (private)" className="w-full px-3 py-2 rounded-lg outline-none" style={fld} data-no-contrast-guard />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <button
            onClick={submit}
            data-no-contrast-guard data-allow-dark-cta
            className="px-4 py-2 rounded-lg font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #3B82F6, #7C3AED, #EC4899)" }}
          >
            Add unit
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs text-white/70">{label}</span>
      {children}
    </label>
  );
}
