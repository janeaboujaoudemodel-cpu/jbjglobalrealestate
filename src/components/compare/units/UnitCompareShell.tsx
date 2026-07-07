import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles, Share2, Download, FileText } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import CompareAIShell, { GradientText } from "@/components/compare/CompareAIShell";
import CompareModeToggle from "@/components/compare/CompareModeToggle";
import ProjectPicker, { type PickedProject } from "./ProjectPicker";
import AddUnitDialog, { type UnitDraft } from "./AddUnitDialog";
import PaymentPlanEditor from "./PaymentPlanEditor";
import FieldManagerPopover from "./FieldManagerPopover";
import UnitComparisonTable from "./UnitComparisonTable";
import { DEFAULT_VISIBLE, type UnitFieldId } from "@/lib/compare/unitFieldsConfig";
import { DEFAULT_PLAN_RULES, type PlanRule } from "@/lib/payment-plan/buildSchedule";
import { exportUnitComparisonPdf } from "@/lib/compare/exportUnitComparisonPdf";
import { useCompareAccess } from "@/hooks/useCompareAccess";

interface Props {
  onModeChange: (m: "projects" | "units") => void;
}

export default function UnitCompareShell({ onModeChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner } = useCompareAccess();
  const [project, setProject] = useState<PickedProject | null>(null);
  const [units, setUnits] = useState<UnitDraft[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitDraft | null>(null);
  const [sharedOn, setSharedOn] = useState(true);
  const [sharedPlan, setSharedPlan] = useState<PlanRule[]>(DEFAULT_PLAN_RULES);
  const [unitPlans, setUnitPlans] = useState<Record<string, PlanRule[]>>({});
  const [visible, setVisible] = useState<UnitFieldId[]>(DEFAULT_VISIBLE);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [brokerPhone, setBrokerPhone] = useState("");
  const [brokerEmail, setBrokerEmail] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  const previewUnits = useMemo<UnitDraft[]>(() => {
    if (!project || units.length > 0) return [];
    const base = project.price_from || 1450000;
    return [
      { id: "preview-studio", label: "Studio", bedrooms: "studio", sizeSqft: 480, priceAED: Math.round(base * 0.72), view: "Community", floor: "Mid", unitNumber: "Preview" },
      { id: "preview-1br", label: "1 BR", bedrooms: "1", sizeSqft: 780, priceAED: base, view: "Boulevard", floor: "High", unitNumber: "Preview" },
      { id: "preview-2br", label: "2 BR", bedrooms: "2", sizeSqft: 1180, priceAED: Math.round(base * 1.58), view: "Best view", floor: "High", unitNumber: "Preview" },
    ];
  }, [project, units.length]);
  const tableUnits = units.length > 0 ? units : previewUnits;
  const isPreviewTable = units.length === 0 && previewUnits.length > 0;
  const canAdd = units.length < 10;

  const saveComparison = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Please sign in.");
      if (!project) throw new Error("Pick a project first.");
      const payload = {
        owner_user_id: user.id,
        project_id: project.id,
        title: `${project.name} — ${units.length} unit(s)`,
        units: JSON.parse(JSON.stringify(tableUnits)),
        shared_plan: sharedOn ? JSON.parse(JSON.stringify(sharedPlan)) : null,
        field_preset: { visible },
      };
      const { error } = await supabase.from("unit_comparisons").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Comparison saved"),
    onError: (e: Error) => toast.error(e.message || "Save failed"),
  });

  const exportPdf = () => {
    if (!project || tableUnits.length < 1) {
      toast.error("Pick a project first.");
      return;
    }
    try {
      exportUnitComparisonPdf({
        project,
        units: tableUnits,
        visible,
        sharedPlan: sharedOn ? sharedPlan : null,
        unitPlans,
        mode: isOwner ? "owner" : "broker",
        client: (clientName || clientEmail) ? { name: clientName, email: clientEmail } : undefined,
        broker: !isOwner && (brokerName || brokerage || brokerPhone || brokerEmail)
          ? { name: brokerName, brokerage, phone: brokerPhone, email: brokerEmail }
          : undefined,
      });
      toast.success(isPreviewTable ? "Preview PDF exported" : "PDF exported");
    } catch (e) {
      toast.error((e as Error).message || "Export failed");
    }
  };

  return (
    <CompareAIShell>
      <div data-compare-units-shell data-surface="emerald" data-on-dark="true" className="container mx-auto px-4 py-10 md:py-14">
        <button
          onClick={() => navigate(-1)}
          data-no-contrast-guard
          className="inline-flex items-center gap-2 text-[#1A1A1A]/70 hover:text-[#1A1A1A] mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="flex justify-center mb-6">
          <CompareModeToggle mode="units" onChange={onModeChange} />
        </div>

        <h1 className="text-[#1A1A1A] text-center text-3xl md:text-5xl font-bold leading-[1.05] mb-4">
          Compare units inside <GradientText>one project.</GradientText>
        </h1>
        <p className="text-[#1A1A1A]/70 text-center max-w-2xl mx-auto mb-10">
          1 BR vs 2 BR vs 3 BR — price, view, payment plan side by side. The plan engine builds the
          full installment schedule automatically using each unit's own price.
        </p>

        {/* Premium card wrapping the entire flow */}
        <div
          className="rounded-2xl p-5 md:p-8"
          style={{
            background: "#FDFBF7",
            border: "1px solid rgba(184,149,85,0.55)",
            boxShadow: "0 10px 40px rgba(184,149,85,0.18)",
          }}
        >
          {/* Step 1 — project */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "rgba(184,149,85,0.18)", color: "#1A1A1A" }}>1</span>
              <h3 className="text-[#1A1A1A] font-semibold">Pick the project & developer</h3>
            </div>
            <ProjectPicker value={project} onChange={(p) => { setProject(p); setUnits([]); setEditingUnit(null); }} />
          </div>

          {project && (
            <>
              {/* Step 2 — units */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "rgba(184,149,85,0.18)", color: "#1A1A1A" }}>2</span>
                    <h3 className="text-[#1A1A1A] font-semibold">Add the units to compare</h3>
                  </div>
                  <span className="text-xs text-[#1A1A1A]/55">Up to 10 units · studio · 1BR · 2BR · exact layouts</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {units.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl"
                      style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.35)" }}
                    >
                      <div className="text-xs text-[#1A1A1A]/60">{u.bedrooms === "studio" ? "Studio" : `${u.bedrooms} BR`} · {u.sizeSqft} sqft</div>
                      <div className="text-[#1A1A1A] font-semibold mt-1 truncate">{u.label || "(no label)"}</div>
                      <div className="text-[#1A1A1A]/80 text-sm mt-1">AED {u.priceAED.toLocaleString()}</div>
                      {u.propertyType && <div className="text-[#1A1A1A]/55 text-xs mt-1">{u.propertyType}</div>}
                      {u.view && <div className="text-[#1A1A1A]/55 text-xs mt-1">{u.view}</div>}
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => { setEditingUnit(u); setAddOpen(true); }}
                          data-no-contrast-guard
                          className="text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setUnits(units.filter((x) => x.id !== u.id))}
                          data-no-contrast-guard
                          className="text-xs text-[#1A1A1A]/55 hover:text-[#1A1A1A]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {canAdd && (
                    <button
                      onClick={() => { setEditingUnit(null); setAddOpen(true); }}
                      data-no-contrast-guard
                      className="p-4 rounded-2xl flex flex-col items-center justify-center min-h-[140px] text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                      style={{ background: "#FDFBF7", border: "1px dashed rgba(184,149,85,0.55)" }}
                    >
                      <Plus className="w-6 h-6 mb-1" />
                      <span className="text-sm font-medium">Add unit</span>
                      <span className="text-[10px] text-[#1A1A1A]/55 mt-0.5">Manual · editable table</span>
                    </button>
                  )}
                </div>
                {isPreviewTable && (
                  <p className="text-xs text-[#1A1A1A]/55 mt-3">
                    A Studio, 1 BR and 2 BR preview is already live below; edit any column or add real units to replace it.
                  </p>
                )}
              </div>

              {/* Step 3 — shared plan */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "rgba(184,149,85,0.18)", color: "#1A1A1A" }}>3</span>
                  <h3 className="text-[#1A1A1A] font-semibold">Payment plan</h3>
                </div>
                <div
                  className="p-5 rounded-2xl"
                  style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.35)" }}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: "#B89555" }} />
                      <span className="text-[#1A1A1A] text-sm font-medium">Shared payment plan</span>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-[#1A1A1A]/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sharedOn}
                        onChange={(e) => setSharedOn(e.target.checked)}
                        className="accent-[#B89555]"
                      />
                      Apply to every unit
                    </label>
                  </div>
                  <p className="text-[#1A1A1A]/55 text-xs mb-3">
                    Define the plan once — the engine builds the full month-by-month schedule for every
                    unit using that unit's own price and the project's handover date.
                  </p>
                  <PaymentPlanEditor rules={sharedPlan} onChange={setSharedPlan} />
                </div>
              </div>

              {/* Recipient & sender — feeds the branded PDF */}
              <div
                className="mb-6 p-5 rounded-2xl"
                style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.35)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" style={{ color: "#B89555" }} />
                  <span className="text-[#1A1A1A] text-sm font-medium">
                    PDF cover — recipient & sender
                  </span>
                  <span className="text-[10px] text-[#1A1A1A]/55 ml-auto">
                    {isOwner ? "Locked to JBJ branding" : "Your brokerage details"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Client name"
                    data-no-contrast-guard
                    className="px-3 py-2 rounded-lg bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/55 text-sm outline-none focus:border-[#B89555]"
                  />
                  <input
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Client email"
                    data-no-contrast-guard
                    className="px-3 py-2 rounded-lg bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/55 text-sm outline-none focus:border-[#B89555]"
                  />
                  {!isOwner && (
                    <>
                      <input
                        value={brokerName}
                        onChange={(e) => setBrokerName(e.target.value)}
                        placeholder="Your name"
                        data-no-contrast-guard
                        className="px-3 py-2 rounded-lg bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/55 text-sm outline-none focus:border-[#B89555]"
                      />
                      <input
                        value={brokerage}
                        onChange={(e) => setBrokerage(e.target.value)}
                        placeholder="Brokerage name"
                        data-no-contrast-guard
                        className="px-3 py-2 rounded-lg bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/55 text-sm outline-none focus:border-[#B89555]"
                      />
                      <input
                        value={brokerPhone}
                        onChange={(e) => setBrokerPhone(e.target.value)}
                        placeholder="Phone"
                        data-no-contrast-guard
                        className="px-3 py-2 rounded-lg bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/55 text-sm outline-none focus:border-[#B89555]"
                      />
                      <input
                        value={brokerEmail}
                        onChange={(e) => setBrokerEmail(e.target.value)}
                        placeholder="Email"
                        data-no-contrast-guard
                        className="px-3 py-2 rounded-lg bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/55 text-sm outline-none focus:border-[#B89555]"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Step 4 — live table */}
              <div ref={tableRef}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "rgba(184,149,85,0.18)", color: "#1A1A1A" }}>4</span>
                    <h3 className="text-[#1A1A1A] font-semibold">Live comparison</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FieldManagerPopover visible={visible} onChange={setVisible} />
                    <button
                      data-cta="dark"
                      onClick={exportPdf}
                      disabled={tableUnits.length < 1}
                      className="jj-cta-dark inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" /> Export PDF
                    </button>
                    <button
                      data-cta="champagne"
                      onClick={() => saveComparison.mutate()}
                      disabled={saveComparison.isPending || tableUnits.length < 1}
                      className="jj-cta-champagne inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" /> Save
                    </button>
                    <button
                      data-no-contrast-guard
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#1A1A1A]"
                      style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.55)" }}
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>

                <UnitComparisonTable
                  project={project}
                  units={tableUnits}
                  visible={visible}
                  sharedPlan={sharedOn ? sharedPlan : null}
                  unitPlans={unitPlans}
                  isPreview={isPreviewTable}
                  onEditUnit={(unit) => { setEditingUnit(unit); setAddOpen(true); }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <AddUnitDialog
        open={addOpen}
        onOpenChange={(open) => { setAddOpen(open); if (!open) setEditingUnit(null); }}
        initialUnit={editingUnit}
        onAdd={(u) => {
          setUnits((arr) => [...arr, u]);
          setUnitPlans((m) => ({ ...m, [u.id]: DEFAULT_PLAN_RULES }));
        }}
        onSave={(u) => {
          const savedUnit = u.id.startsWith("preview-") ? { ...u, id: crypto.randomUUID() } : u;
          setUnits((arr) => {
            const exists = arr.some((x) => x.id === savedUnit.id);
            if (exists) return arr.map((x) => (x.id === savedUnit.id ? savedUnit : x));
            return [...arr, savedUnit];
          });
          setUnitPlans((m) => ({ ...m, [savedUnit.id]: m[u.id] || DEFAULT_PLAN_RULES }));
        }}
      />
    </CompareAIShell>
  );
}
