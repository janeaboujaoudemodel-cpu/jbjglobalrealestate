import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles, Share2, Download, FileText, Building2 } from "lucide-react";
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

  const canAdd = units.length < 4;

  const saveComparison = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Please sign in.");
      if (!project) throw new Error("Pick a project first.");
      const payload = {
        owner_user_id: user.id,
        project_id: project.id,
        title: `${project.name} — ${units.length} unit(s)`,
        units: JSON.parse(JSON.stringify(units)),
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
    if (!project || units.length < 1) {
      toast.error("Pick a project and add at least one unit first.");
      return;
    }
    try {
      exportUnitComparisonPdf({
        project,
        units,
        visible,
        sharedPlan: sharedOn ? sharedPlan : null,
        unitPlans,
        mode: isOwner ? "owner" : "broker",
        client: (clientName || clientEmail) ? { name: clientName, email: clientEmail } : undefined,
        broker: !isOwner && (brokerName || brokerage || brokerPhone || brokerEmail)
          ? { name: brokerName, brokerage, phone: brokerPhone, email: brokerEmail }
          : undefined,
      });
      toast.success("PDF exported");
    } catch (e) {
      toast.error((e as Error).message || "Export failed");
    }
  };

  return (
    <CompareAIShell>
      <div className="container mx-auto px-4 py-10 md:py-14">
        <button
          onClick={() => navigate(-1)}
          data-no-contrast-guard
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="flex justify-center mb-6">
          <CompareModeToggle mode="units" onChange={onModeChange} />
        </div>

        <h1 className="text-white text-center text-3xl md:text-5xl font-bold leading-[1.05] mb-4">
          Compare units inside <GradientText>one project.</GradientText>
        </h1>
        <p className="text-white/70 text-center max-w-2xl mx-auto mb-10">
          1 BR vs 2 BR vs 3 BR — price, view, payment plan side by side. The plan engine builds the
          full installment schedule automatically using each unit's own price.
        </p>

        {/* Premium card wrapping the entire flow */}
        <div
          className="rounded-2xl p-5 md:p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(192,132,252,0.35)",
            boxShadow: "0 10px 40px rgba(124,58,237,0.18)",
          }}
        >
          {/* Step 1 — project */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "rgba(192,132,252,0.2)", color: "#E9D5FF" }}>1</span>
              <h3 className="text-white font-semibold">Pick the project & developer</h3>
            </div>
            <ProjectPicker value={project} onChange={(p) => { setProject(p); setUnits([]); }} />
          </div>

          {project && (
            <>
              {/* Step 2 — units */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "rgba(192,132,252,0.2)", color: "#E9D5FF" }}>2</span>
                    <h3 className="text-white font-semibold">Add the units to compare</h3>
                  </div>
                  <span className="text-xs text-white/55">Up to 4 units · 1BR · 2BR · 3BR · etc.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {units.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      <div className="text-xs text-white/60">{u.bedrooms === "studio" ? "Studio" : `${u.bedrooms} BR`} · {u.sizeSqft} sqft</div>
                      <div className="text-white font-semibold mt-1 truncate">{u.label || "(no label)"}</div>
                      <div className="text-white/80 text-sm mt-1">AED {u.priceAED.toLocaleString()}</div>
                      {u.view && <div className="text-white/50 text-xs mt-1">{u.view}</div>}
                      <button
                        onClick={() => setUnits(units.filter((x) => x.id !== u.id))}
                        data-no-contrast-guard
                        className="text-xs text-white/50 hover:text-white mt-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {canAdd && (
                    <button
                      onClick={() => setAddOpen(true)}
                      data-no-contrast-guard
                      className="p-4 rounded-2xl flex flex-col items-center justify-center min-h-[140px] text-white/70 hover:text-white"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(192,132,252,0.5)" }}
                    >
                      <Plus className="w-6 h-6 mb-1" />
                      <span className="text-sm font-medium">Add unit</span>
                      <span className="text-[10px] text-white/45 mt-0.5">Manual · live in table</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3 — shared plan */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "rgba(192,132,252,0.2)", color: "#E9D5FF" }}>3</span>
                  <h3 className="text-white font-semibold">Payment plan</h3>
                </div>
                <div
                  className="p-5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: "#C084FC" }} />
                      <span className="text-white text-sm font-medium">Shared payment plan</span>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sharedOn}
                        onChange={(e) => setSharedOn(e.target.checked)}
                        className="accent-purple-500"
                      />
                      Apply to every unit
                    </label>
                  </div>
                  <p className="text-white/55 text-xs mb-3">
                    Define the plan once — the engine builds the full month-by-month schedule for every
                    unit using that unit's own price and the project's handover date.
                  </p>
                  <PaymentPlanEditor rules={sharedPlan} onChange={setSharedPlan} />
                </div>
              </div>

              {/* Step 4 — live table */}
              <div ref={tableRef}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "rgba(192,132,252,0.2)", color: "#E9D5FF" }}>4</span>
                    <h3 className="text-white font-semibold">Live comparison</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FieldManagerPopover visible={visible} onChange={setVisible} />
                    <button
                      data-no-contrast-guard data-allow-dark-cta
                      onClick={exportPdf}
                      disabled={units.length < 1}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #3B82F6, #7C3AED, #EC4899)" }}
                    >
                      <FileText className="w-4 h-4" /> Export PDF
                    </button>
                    <button
                      data-no-contrast-guard data-allow-dark-cta
                      onClick={() => saveComparison.mutate()}
                      disabled={saveComparison.isPending || units.length < 1}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}
                    >
                      <Download className="w-4 h-4" /> Save
                    </button>
                    <button
                      data-no-contrast-guard
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>

                {units.length >= 1 ? (
                  <UnitComparisonTable
                    project={project}
                    units={units}
                    visible={visible}
                    sharedPlan={sharedOn ? sharedPlan : null}
                    unitPlans={unitPlans}
                  />
                ) : (
                  <div
                    className="rounded-2xl p-10 text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.18)" }}
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-3 text-white/40" />
                    <p className="text-white/70 text-sm">
                      Add at least one unit above and the comparison table will appear live here.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <AddUnitDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(u) => {
          setUnits((arr) => [...arr, u]);
          setUnitPlans((m) => ({ ...m, [u.id]: DEFAULT_PLAN_RULES }));
        }}
      />
    </CompareAIShell>
  );
}
