import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Upload, FileDown, ChevronRight, ChevronLeft, X } from "lucide-react";
import { renderProjectDeckHtml, type DeckPresenter, type DeckProject, type DeckSectionKey } from "./renderDeckHtml";

interface UnitOption {
  id: string;
  label: string;
  size?: string;
  price?: string;
  bedrooms?: string;
  floorPlanUrl?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: DeckProject;
}

const ALL_SECTIONS: Array<{ key: DeckSectionKey; label: string }> = [
  { key: "cover", label: "Cover slide" },
  { key: "highlights", label: "Project highlights" },
  { key: "location", label: "Location & address" },
  { key: "amenities", label: "Amenities" },
  { key: "gallery", label: "Photo gallery" },
  { key: "units", label: "Selected units & floor plans" },
  { key: "paymentPlan", label: "Payment plan" },
  { key: "developer", label: "Developer profile" },
  { key: "offer", label: "Sales offer" },
  { key: "contact", label: "Presenter contact" },
];

const STEP_LABELS = ["Details", "Units", "Sections", "Export"] as const;

export const PresentationBuilderDialog: React.FC<Props> = ({ open, onOpenChange, project }) => {
  const [step, setStep] = React.useState(0);
  const [selectedUnits, setSelectedUnits] = React.useState<string[]>([]);
  const [presenter, setPresenter] = React.useState<DeckPresenter>({});
  const [sections, setSections] = React.useState<Record<DeckSectionKey, boolean>>(
    () => ALL_SECTIONS.reduce((acc, s) => ({ ...acc, [s.key]: true }), {} as Record<DeckSectionKey, boolean>)
  );
  const [salesOffer, setSalesOffer] = React.useState("");
  const [isExporting, setIsExporting] = React.useState(false);

  // Derive unit options from project.unit_types / floor_plan_types
  const unitOptions: UnitOption[] = React.useMemo(() => {
    const out: UnitOption[] = [];
    const ut = (project as any).unit_types as any[] | undefined;
    if (Array.isArray(ut)) {
      ut.forEach((u, i) => {
        const beds = u.bedrooms ?? u.bedroom ?? u.beds;
        const label = u.name || u.type || (beds != null ? `${beds} BR` : `Unit ${i + 1}`);
        out.push({
          id: `ut-${i}`,
          label,
          bedrooms: beds != null ? String(beds) : undefined,
          size: u.size_range || u.size || u.area,
          price: u.price_from ? `From AED ${Number(u.price_from).toLocaleString()}` : u.price,
          floorPlanUrl: u.floor_plan_url || u.image,
        });
      });
    }
    const fp = (project as any).floor_plan_types as any[] | undefined;
    if (Array.isArray(fp)) {
      fp.forEach((f, i) => {
        if (out.find((o) => o.floorPlanUrl === (f.url || f.image_url))) return;
        out.push({
          id: `fp-${i}`,
          label: f.name || f.label || `Floor plan ${i + 1}`,
          size: f.size,
          bedrooms: f.bedrooms != null ? String(f.bedrooms) : undefined,
          floorPlanUrl: f.url || f.image_url,
        });
      });
    }
    return out;
  }, [project]);

  const toggleUnit = (id: string) =>
    setSelectedUnits((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 5 ? prev : [...prev, id]
    );

  const handleImageUpload = (field: "photoDataUrl" | "logoDataUrl") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPresenter((p) => ({ ...p, [field]: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const chosenUnits = unitOptions.filter((u) => selectedUnits.includes(u.id));
      const html = renderProjectDeckHtml({
        project,
        presenter,
        sections,
        units: chosenUnits,
        salesOffer: salesOffer.trim() || undefined,
      });
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) {
        alert("Please allow pop-ups to export the presentation.");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      // Give the new window a tick to load images then trigger print
      setTimeout(() => {
        try { w.focus(); w.print(); } catch (_e) { /* user can press Cmd+P */ }
      }, 800);
    } finally {
      setIsExporting(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FDFBF7] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Generate Presentation — {project.name}</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Build a tailored project deck. Empty fields are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 pb-3 border-b border-[#B89555]/25">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] whitespace-nowrap ${
                i === step ? "text-[#1A1A1A] font-semibold" : "text-[#1A1A1A]/50"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] ${
                  i <= step ? "bg-[#1A1A1A] text-white" : "bg-[#EFE6D6] text-[#1A1A1A]"
                }`}
              >
                {i + 1}
              </span>
              {label}
              {i < STEP_LABELS.length - 1 && <ChevronRight className="w-3 h-3 text-[#1A1A1A]/30" />}
            </div>
          ))}
        </div>

        <ScrollArea className="max-h-[55vh] pr-2">
          {/* STEP 1 — Brand, presenter and client details */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-[13px] text-[#1A1A1A]/70">Review brand, presenter and client details. Empty fields are hidden in the export.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-lg bg-[#F7F2EA] border border-[#B89555]/25 p-3">
                    {presenter.logoDataUrl ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#B89555]/50 bg-white">
                        <img src={presenter.logoDataUrl} alt="" className="w-full h-full object-contain"  loading="lazy" decoding="async" />
                        <button
                          type="button"
                          onClick={() => setPresenter((p) => ({ ...p, logoDataUrl: undefined }))}
                          className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white rounded-full w-5 h-5 inline-flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-16 h-16 rounded-lg bg-white border border-dashed border-[#B89555]/50 flex flex-col items-center justify-center cursor-pointer">
                        <Upload className="w-4 h-4 text-[#1A1A1A]/60" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload("logoDataUrl")} />
                      </label>
                    )}
                    <div className="text-[12px] text-[#1A1A1A]/70">Company logo (optional)</div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-[#F7F2EA] border border-[#B89555]/25 p-3">
                  {presenter.photoDataUrl ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#B89555]/50">
                      <img src={presenter.photoDataUrl} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                      <button
                        type="button"
                        onClick={() => setPresenter((p) => ({ ...p, photoDataUrl: undefined }))}
                        className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white rounded-full w-5 h-5 inline-flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-full bg-[#F7F2EA] border border-dashed border-[#B89555]/50 flex flex-col items-center justify-center cursor-pointer">
                      <Upload className="w-4 h-4 text-[#1A1A1A]/60" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload("photoDataUrl")} />
                    </label>
                  )}
                  <div className="text-[12px] text-[#1A1A1A]/70">Photo (optional, &lt;5MB)</div>
                  </div>
                </div>
                <div>
                  <Label className="text-[#1A1A1A] text-[12px]">Full name</Label>
                  <Input value={presenter.name ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, name: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] text-[12px]">Title / role</Label>
                  <Input value={presenter.title ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, title: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] text-[12px]">Email</Label>
                  <Input type="email" value={presenter.email ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, email: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] text-[12px]">Phone</Label>
                  <Input value={presenter.phone ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, phone: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] text-[12px]">WhatsApp</Label>
                  <Input value={presenter.whatsapp ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, whatsapp: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] text-[12px]">Company</Label>
                  <Input value={presenter.company ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, company: e.target.value }))} className="bg-white border-[#B89555]/30" placeholder="JBJ Global Real Estate" />
                </div>
                <div className="col-span-2 pt-2 border-t border-[#B89555]/20">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#1A1A1A]/60 font-semibold">Client details</p>
                </div>
                <div>
                  <Label htmlFor="presentation-client-name" className="text-[#1A1A1A] text-[12px]">Client name</Label>
                  <Input id="presentation-client-name" value={presenter.clientName ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, clientName: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
                <div>
                  <Label htmlFor="presentation-client-phone" className="text-[#1A1A1A] text-[12px]">Client phone</Label>
                  <Input id="presentation-client-phone" value={presenter.clientPhone ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, clientPhone: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="presentation-client-address" className="text-[#1A1A1A] text-[12px]">Client address</Label>
                  <Input id="presentation-client-address" value={presenter.clientAddress ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, clientAddress: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
                <div>
                  <Label htmlFor="presentation-client-passport" className="text-[#1A1A1A] text-[12px]">Passport / ID</Label>
                  <Input id="presentation-client-passport" value={presenter.clientPassport ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, clientPassport: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
                <div>
                  <Label htmlFor="presentation-client-notes" className="text-[#1A1A1A] text-[12px]">Client notes</Label>
                  <Input id="presentation-client-notes" value={presenter.clientNotes ?? ""} onChange={(e) => setPresenter((p) => ({ ...p, clientNotes: e.target.value }))} className="bg-white border-[#B89555]/30" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Units */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[13px] text-[#1A1A1A]/70">Select up to 5 units to feature (optional).</p>
              {unitOptions.length === 0 ? (
                <p className="text-[13px] text-[#1A1A1A]/60 italic py-6 text-center">
                  No unit types available for this project. The deck will still include project overview, gallery, amenities and developer profile.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {unitOptions.map((u) => {
                    const active = selectedUnits.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUnit(u.id)}
                        className={`text-left p-3 rounded-lg border transition ${
                          active
                            ? "bg-[#EFE6D6] border-[#B89555]"
                            : "bg-[#F7F2EA] border-[#B89555]/25 hover:border-[#B89555]/60"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox checked={active} className="mt-0.5 pointer-events-none" />
                          <div className="flex-1">
                            <div className="text-[14px] font-semibold text-[#1A1A1A]">{u.label}</div>
                            <div className="text-[12px] text-[#1A1A1A]/70 mt-0.5">
                              {[u.bedrooms && `${u.bedrooms} BR`, u.size, u.price].filter(Boolean).join(" • ")}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Sections */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-[13px] text-[#1A1A1A]/70">Sections without underlying data are skipped automatically.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_SECTIONS.map((s) => (
                  <label
                    key={s.key}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F2EA] border border-[#B89555]/25 cursor-pointer"
                  >
                    <Checkbox
                      checked={sections[s.key]}
                      onCheckedChange={(v) => setSections((prev) => ({ ...prev, [s.key]: !!v }))}
                    />
                    <span className="text-[14px] text-[#1A1A1A]">{s.label}</span>
                  </label>
                ))}
              </div>
              <div className="pt-2">
                <Label className="text-[#1A1A1A] text-[12px]">Sales offer / closing message (optional)</Label>
                <Input
                  value={salesOffer}
                  onChange={(e) => setSalesOffer(e.target.value)}
                  placeholder="e.g. Reserve this week and receive complimentary registration fees"
                  className="bg-white border-[#B89555]/30"
                />
              </div>
            </div>
          )}

          {/* STEP 4 — Export */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#F7F2EA] border border-[#B89555]/30">
                <div className="text-[13px] uppercase tracking-[0.2em] text-[#1A1A1A]/60 mb-2">Summary</div>
                <ul className="text-[14px] text-[#1A1A1A] space-y-1">
                  <li><strong>Project:</strong> {project.name}</li>
                  <li><strong>Selected units:</strong> {selectedUnits.length || "none"}</li>
                  <li><strong>Presenter:</strong> {presenter.name || "—"} {presenter.title ? `· ${presenter.title}` : ""}</li>
                  <li><strong>Client:</strong> {presenter.clientName || "—"}</li>
                  <li><strong>Sections enabled:</strong> {Object.values(sections).filter(Boolean).length} / {ALL_SECTIONS.length}</li>
                </ul>
              </div>
              <p className="text-[13px] text-[#1A1A1A]/70">
                The deck opens in a new window. Your browser's print dialog will appear — choose <strong>Save as PDF</strong> for export, or print directly.
              </p>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white border border-[#B89555]/40"
                data-allow-dark-cta
              >
                {isExporting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building deck…</>
                ) : (
                  <><FileDown className="w-4 h-4 mr-2" /> Generate presentation</>
                )}
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Footer nav */}
        <div className="flex justify-between pt-3 border-t border-[#B89555]/25">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0}
            className="text-[#1A1A1A]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button
              onClick={next}
              className="bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white border border-[#B89555]/40"
              data-allow-dark-cta
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <span />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PresentationBuilderDialog;
