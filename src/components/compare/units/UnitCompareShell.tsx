import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles, Share2, Download } from "lucide-react";
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

interface Props {
  onModeChange: (m: "projects" | "units") => void;
}

export default function UnitCompareShell({ onModeChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<PickedProject | null>(null);
  const [units, setUnits] = useState<UnitDraft[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [sharedOn, setSharedOn] = useState(true);
  const [sharedPlan, setSharedPlan] = useState<PlanRule[]>(DEFAULT_PLAN_RULES);
  const [unitPlans, setUnitPlans] = useState<Record<string, PlanRule[]>>({});
  const [visible, setVisible] = useState<UnitFieldId[]>(DEFAULT_VISIBLE);

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

        {/* Project picker */}
        <div className="max-w-3xl mx-auto mb-8">
          <ProjectPicker value={project} onChange={(p) => { setProject(p); setUnits([]); }} />
        </div>

        {project && (
          <>
            {/* Units row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.25)" }}
                >
                  <Plus className="w-6 h-6 mb-1" /> Add unit
                </button>
              )}
            </div>

            {/* Shared plan editor */}
            <div
              className="max-w-3xl mx-auto mb-8 p-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: "#C084FC" }} />
                  <h3 className="text-white font-semibold">Shared payment plan</h3>
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
              <p className="text-white/60 text-xs mb-3">
                Define the plan once — the engine builds the full month-by-month schedule for every
                unit using that unit's own price and the project's handover date.
              </p>
              <PaymentPlanEditor rules={sharedPlan} onChange={setSharedPlan} />
            </div>

            {/* Table */}
            {units.length >= 2 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-white text-xl font-bold">Comparison</h2>
                  <div className="flex flex-wrap gap-2">
                    <FieldManagerPopover visible={visible} onChange={setVisible} />
                    <button
                      data-no-contrast-guard data-allow-dark-cta
                      onClick={() => saveComparison.mutate()}
                      disabled={saveComparison.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #3B82F6, #7C3AED, #EC4899)" }}
                    >
                      <Download className="w-4 h-4" /> Save comparison
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

                <UnitComparisonTable
                  project={project}
                  units={units}
                  visible={visible}
                  sharedPlan={sharedOn ? sharedPlan : null}
                  unitPlans={unitPlans}
                />
              </div>
            ) : (
              <div className="text-center text-white/60 text-sm py-6">
                Add at least 2 units to see the side-by-side comparison.
              </div>
            )}
          </>
        )}
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
