import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Upload, Loader2, Sparkles, Download,
  FileSpreadsheet, ArrowLeft, X, FileText, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { exportPremiumXlsx } from "@/utils/exportXlsx";

interface ManualProject {
  id: string;
  name: string;
  developer: string;
  location: string;
  emirate: string;
  priceFrom: string;
  priceTo: string;
  bedrooms: string;
  sizeRange: string;
  handover: string;
  amenities: string; // comma separated
  views: string;
  paymentPlan: string;
  files: { name: string; path: string; size: number; url?: string }[];
}

const blank = (): ManualProject => ({
  id: crypto.randomUUID(),
  name: "",
  developer: "",
  location: "",
  emirate: "Dubai",
  priceFrom: "",
  priceTo: "",
  bedrooms: "",
  sizeRange: "",
  handover: "",
  amenities: "",
  views: "",
  paymentPlan: "",
  files: [],
});

const CompareManual = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ManualProject[]>([blank(), blank()]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<ManualProject>) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addProject = () => {
    if (projects.length >= 25) {
      toast.error("Maximum 25 projects per comparison.");
      return;
    }
    setProjects((prev) => [...prev, blank()]);
  };
  const removeProject = (id: string) =>
    setProjects((prev) => (prev.length > 2 ? prev.filter((p) => p.id !== id) : prev));

  const handleFiles = async (projectId: string, fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    if (!user) {
      toast.error("Please sign in to attach documents.");
      navigate("/auth");
      return;
    }
    setUploadingId(projectId);
    try {
      const uploaded: ManualProject["files"] = [];
      for (const file of Array.from(fileList)) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from("comparison-assets")
          .upload(path, file, { upsert: false, cacheControl: "3600" });
        if (error) throw error;
        uploaded.push({ name: file.name, path, size: file.size });
      }
      const target = projects.find((p) => p.id === projectId);
      update(projectId, { files: [...(target?.files ?? []), ...uploaded] });
      toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} attached`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const removeFile = (projectId: string, path: string) => {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return;
    update(projectId, { files: p.files.filter((f) => f.path !== path) });
    supabase.storage.from("comparison-assets").remove([path]).catch(() => {});
  };

  const generate = async () => {
    const filled = projects.filter((p) => p.name.trim().length > 0);
    if (filled.length < 2) {
      toast.error("Add at least 2 projects with a name to compare.");
      return;
    }
    if (!user) {
      toast.error("Please sign in to generate AI comparison.");
      navigate("/auth");
      return;
    }
    setIsGenerating(true);
    try {
      const payload = filled.map((p) => ({
        name: p.name.trim(),
        developer: p.developer.trim() || "Unknown",
        location: p.location.trim(),
        emirate: p.emirate.trim() || "Dubai",
        priceFrom: Number(p.priceFrom) || 0,
        priceTo: p.priceTo ? Number(p.priceTo) : undefined,
        bedrooms: p.bedrooms.trim(),
        sizeRange: p.sizeRange.trim(),
        handover: p.handover.trim() || undefined,
        amenities: p.amenities.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30),
        views: p.views.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
        paymentPlan: p.paymentPlan.trim() || undefined,
      }));

      const response = await supabase.functions.invoke("compare-projects", {
        body: { projects: payload },
      });
      if (response.error) throw response.error;
      setAnalysis(response.data?.analysis ?? response.data);
      toast.success("AI comparison ready");
      setTimeout(() => {
        document.getElementById("comparison-results")?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to generate comparison");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadExcel = () => {
    if (!analysis?.projectDetailsTable?.length) {
      toast.error("Generate the comparison first.");
      return;
    }
    const rows = analysis.projectDetailsTable.map((row: any) => ({
      project: row.projectName,
      developer: row.developer,
      location: row.location,
      price_range: row.priceRange,
      price_per_sqft: row.pricePerSqft,
      bedrooms: row.bedrooms,
      size_range: row.sizeRange,
      handover: row.handover,
      payment_plan: row.paymentPlan,
      furnished: row.furnishedStatus,
      views: (row.views || []).join(", "),
      amenities: (row.keyAmenities || []).join(", "),
      facilities: (row.keyFacilities || []).join(", "),
      usps: (row.uniqueSellingPoints || []).join(", "),
      investment_type: row.investmentType,
      target_buyer: row.targetBuyer,
    }));
    exportPremiumXlsx(rows, {
      filename: "JBJ-Property-Comparison",
      sheetName: "Comparison",
      title: "JBJ GLOBAL REAL ESTATE",
      subtitle: "AI Property Comparison",
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-[112px] pb-24">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A] mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back to home
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 text-xs uppercase tracking-wider text-[#1A1A1A]/80 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Manual entry
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">
              AI Property Comparison
            </h1>
            <p className="text-[#1A1A1A]/70 mt-2 max-w-xl">
              Enter up to 25 projects, attach brochures or PDFs, and generate a side-by-side
              comparison with ROI, amenities and verdict.
            </p>
          </div>
          <Link to="/properties?compareMode=1">
            <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/40 hover:bg-[#EFE6D6] transition text-sm font-semibold">
              <Building2 className="w-4 h-4" /> Pick from listings instead
            </button>
          </Link>
        </div>

        {/* Project cards */}
        <div className="space-y-5">
          {projects.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-5 md:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1A1A1A]">
                  Project {idx + 1}
                </h3>
                {projects.length > 2 && (
                  <button
                    onClick={() => removeProject(p.id)}
                    className="text-[#1A1A1A]/60 hover:text-red-600 transition"
                    aria-label="Remove project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Project name *">
                  <Input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} placeholder="e.g. Emaar Alterra" />
                </Field>
                <Field label="Developer">
                  <Input value={p.developer} onChange={(e) => update(p.id, { developer: e.target.value })} placeholder="e.g. Emaar Properties" />
                </Field>
                <Field label="Location / community">
                  <Input value={p.location} onChange={(e) => update(p.id, { location: e.target.value })} placeholder="e.g. The Valley" />
                </Field>
                <Field label="Emirate">
                  <Input value={p.emirate} onChange={(e) => update(p.id, { emirate: e.target.value })} placeholder="Dubai" />
                </Field>
                <Field label="Price from (AED)">
                  <Input type="number" value={p.priceFrom} onChange={(e) => update(p.id, { priceFrom: e.target.value })} placeholder="1500000" />
                </Field>
                <Field label="Price to (AED)">
                  <Input type="number" value={p.priceTo} onChange={(e) => update(p.id, { priceTo: e.target.value })} placeholder="3500000" />
                </Field>
                <Field label="Bedrooms">
                  <Input value={p.bedrooms} onChange={(e) => update(p.id, { bedrooms: e.target.value })} placeholder="2-4 BR" />
                </Field>
                <Field label="Size range (sqft)">
                  <Input value={p.sizeRange} onChange={(e) => update(p.id, { sizeRange: e.target.value })} placeholder="1100 - 2400" />
                </Field>
                <Field label="Handover">
                  <Input value={p.handover} onChange={(e) => update(p.id, { handover: e.target.value })} placeholder="Q4 2027" />
                </Field>
                <Field label="Payment plan">
                  <Input value={p.paymentPlan} onChange={(e) => update(p.id, { paymentPlan: e.target.value })} placeholder="60/40 post-handover" />
                </Field>
                <Field label="Amenities (comma separated)">
                  <Input value={p.amenities} onChange={(e) => update(p.id, { amenities: e.target.value })} placeholder="Pool, Gym, Beach access" />
                </Field>
                <Field label="Views (comma separated)">
                  <Input value={p.views} onChange={(e) => update(p.id, { views: e.target.value })} placeholder="Sea, Skyline" />
                </Field>
              </div>

              {/* Files */}
              <div className="mt-5">
                <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">
                  Brochures & documents
                </Label>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40 cursor-pointer hover:bg-[#E5DAC4] transition text-sm font-medium text-[#1A1A1A]">
                    {uploadingId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Attach files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        handleFiles(p.id, e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {p.files.map((f) => (
                    <div
                      key={f.path}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FDFBF7] border border-[#B89555]/30 text-xs text-[#1A1A1A]/80"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
                      <span className="max-w-[180px] truncate">{f.name}</span>
                      <button
                        onClick={() => removeFile(p.id, f.path)}
                        className="text-[#1A1A1A]/50 hover:text-red-600"
                        aria-label="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={addProject}
            className="border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add another project
          </Button>
          <button
            onClick={generate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1A1A1A] text-[#FDFBF7] border border-[#B89555]/60 hover:bg-[#2a2a2a] disabled:opacity-60 transition font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#B89555]" /> Generate AI comparison
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {analysis && (
          <section id="comparison-results" className="mt-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Comparison results</h2>
              <button
                onClick={downloadExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/40 hover:bg-[#EFE6D6] transition text-sm font-semibold"
              >
                <FileSpreadsheet className="w-4 h-4" /> Download Excel
              </button>
            </div>

            {analysis.summary && (
              <div className="mb-6 p-5 rounded-xl bg-[#EFE6D6]/60 border border-[#B89555]/40">
                <p className="text-[#1A1A1A]/90 leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            {/* Premium table */}
            {analysis.projectDetailsTable?.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA]">
                <table className="w-full text-sm">
                  <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold border-b border-[#B89555]/40">Field</th>
                      {analysis.projectDetailsTable.map((p: any) => (
                        <th key={p.projectName} className="text-left px-4 py-3 font-semibold border-b border-[#B89555]/40">
                          {p.projectName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-[#1A1A1A]/90">
                    {[
                      ["Developer", "developer"],
                      ["Location", "location"],
                      ["Price range", "priceRange"],
                      ["Bedrooms", "bedrooms"],
                      ["Size", "sizeRange"],
                      ["Handover", "handover"],
                      ["Payment plan", "paymentPlan"],
                      ["Investment type", "investmentType"],
                      ["Target buyer", "targetBuyer"],
                    ].map(([label, key]) => (
                      <tr key={key} className="border-b border-[#B89555]/20 last:border-0">
                        <td className="px-4 py-3 font-medium text-[#1A1A1A]/70">{label}</td>
                        {analysis.projectDetailsTable.map((p: any) => (
                          <td key={p.projectName} className="px-4 py-3">
                            {p[key] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {analysis.recommendation && (
              <div className="mt-6 p-6 rounded-2xl bg-[#1A1A1A] text-[#FDFBF7] border border-[#B89555]/40">
                <div className="text-xs uppercase tracking-wider text-[#B89555] mb-1">Top choice</div>
                <div className="text-xl font-bold mb-2">{analysis.recommendation.topChoice}</div>
                <p className="text-[#FDFBF7]/80 leading-relaxed">
                  {analysis.recommendation.reasoning}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">{label}</Label>
    <div className="mt-1.5">{children}</div>
  </div>
);

export default CompareManual;
