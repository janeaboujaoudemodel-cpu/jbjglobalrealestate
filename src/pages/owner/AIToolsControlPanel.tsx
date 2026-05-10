import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown, Copy, ExternalLink, Search, CheckCircle2, XCircle,
  RotateCcw, Play, Save, Clock, Shield, AlertTriangle, History,
  Eye, EyeOff, Undo2, Rocket, FileText,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── Tool Registry (mirrors AIHub.tsx) ───────────────────────────────────────
type ToolCategory = "property" | "productivity" | "marketing" | "design" | "corporate";

interface ToolDef {
  id: string;
  title: string;
  description: string;
  link: string;
  category: ToolCategory;
}

const ALL_TOOLS: ToolDef[] = [
  // Property
  { id: "ai-home-finder", title: "JBJ AI Home Finder", description: "Match buyers to listings with AI-powered filters.", link: "/quiz", category: "property" },
  { id: "property-evaluator", title: "JBJ Property Evaluator", description: "AI-driven valuation based on live market data.", link: "/property-evaluator", category: "property" },
  { id: "property-comparison", title: "JBJ Property Comparison", description: "Compare properties side-by-side with AI insights.", link: "/compare", category: "property" },
  { id: "mortgage-calculator", title: "JBJ Mortgage Calculator", description: "Estimate monthly payments and financing options.", link: "/mortgage-calculator", category: "property" },
  { id: "rental-index", title: "JBJ Rental Index Evaluator", description: "AI-powered rental estimates with market trends.", link: "/rental-index", category: "property" },
  { id: "ai-property-analyzer", title: "JBJ AI Property Analyzer", description: "Deep market analysis with price trends.", link: "/ai-property-analyzer", category: "property" },
  { id: "ai-price-predictor", title: "JBJ AI Price Predictor", description: "AI-powered price predictions.", link: "/ai-price-predictor", category: "property" },
  { id: "ai-neighborhood-insights", title: "JBJ AI Neighborhood Insights", description: "Area analysis with livability scores.", link: "/ai-neighborhood-insights", category: "property" },
  { id: "property-measurement", title: "JBJ Property Measurement", description: "Verify property sizes with AI precision.", link: "/property-measurement", category: "property" },
  { id: "ai-market-report", title: "JBJ AI Market Report", description: "Generate comprehensive market reports.", link: "/ai-market-report", category: "property" },
  { id: "ai-competitor-analysis", title: "JBJ AI Competitor Analysis", description: "Analyze competitor listings.", link: "/ai-competitor-analysis", category: "property" },
  { id: "ai-roi-calculator", title: "JBJ AI ROI Calculator", description: "Calculate investment returns.", link: "/ai-roi-calculator", category: "property" },
  { id: "ai-investment-report", title: "JBJ AI Investment Report", description: "Detailed investment analysis.", link: "/ai-investment-report", category: "property" },
  // Productivity
  { id: "content-tools", title: "JBJ Documents & Spreadsheets", description: "Rich text editor and Excel-like tools.", link: "/documents", category: "productivity" },
  { id: "video-meeting", title: "JBJ Video Meet", description: "Free unlimited video meetings.", link: "/video-meeting", category: "productivity" },
  { id: "calendar", title: "JBJ Calendar & Notes", description: "Smart scheduling and reminders.", link: "/ai-calendar", category: "productivity" },
  { id: "business-card-scanner", title: "JBJ Business Card Scanner", description: "Scan and save business cards.", link: "/business-card-scanner", category: "productivity" },
  { id: "ai-meeting-summarizer", title: "JBJ AI Meeting Summarizer", description: "Summarize meetings automatically.", link: "/ai-meeting-summarizer", category: "productivity" },
  { id: "ai-translation-hub", title: "JBJ AI Translation Hub", description: "Translate communications instantly.", link: "/ai-translation-hub", category: "productivity" },
  { id: "ai-video-tour-script", title: "JBJ AI Video Tour Script", description: "Generate video tour scripts.", link: "/toolkit/video-suite", category: "productivity" },
  { id: "ai-email-generator", title: "JBJ AI Email Generator", description: "Generate professional emails.", link: "/ai-email-generator", category: "productivity" },
  // Marketing
  { id: "ai-lead-qualification", title: "JBJ AI Lead Qualification", description: "Score leads with AI.", link: "/ai-lead-qualification", category: "marketing" },
  { id: "property-coach", title: "JBJ Property Coach", description: "Scripts, objections, roleplay.", link: "/broker-toolkit", category: "marketing" },
  { id: "ai-followup-scheduler", title: "JBJ AI Follow-up Scheduler", description: "Smart follow-up scheduling.", link: "/ai-followup-scheduler", category: "marketing" },
  { id: "ai-objection-handler", title: "JBJ AI Objection Handler", description: "AI-suggested objection responses.", link: "/ai-objection-handler", category: "marketing" },
  { id: "ai-client-matcher", title: "JBJ AI Client Matcher", description: "Match clients to properties.", link: "/ai-client-matcher", category: "marketing" },
  { id: "ai-social-media", title: "JBJ AI Social Media", description: "Generate social media content.", link: "/ai-social-media", category: "marketing" },
  { id: "ai-description-writer", title: "JBJ AI Description Writer", description: "Write property descriptions.", link: "/ai-description-writer", category: "marketing" },
  // Design
  { id: "interior-design", title: "JBJ AI Interior Design", description: "Visualize spaces with AI designs.", link: "/interior-design-ai", category: "design" },
  { id: "ai-video-studio", title: "JBJ Creative Video Suite", description: "Professional video editor.", link: "/toolkit/video-suite", category: "design" },
  { id: "video-resize-pack", title: "JBJ Video Resize + Smart Reframe", description: "Resize videos for any platform.", link: "/toolkit/video-resize-pack", category: "design" },
  { id: "voice-studio", title: "JBJ Voice Studio", description: "AI voice generation.", link: "/toolkit/voice-studio", category: "design" },
  { id: "pdf-from-photos", title: "JBJ Photo → PDF Generator", description: "Convert photos to PDFs.", link: "/toolkit/pdf-from-photos", category: "design" },
  { id: "image-resize", title: "JBJ Image Resizer + Social Sizes", description: "Resize images for social.", link: "/toolkit/image-resize", category: "design" },
  { id: "captions-translate", title: "JBJ Captions & Translation", description: "Auto-transcribe and translate.", link: "/toolkit/captions-translate", category: "design" },
  { id: "background-ai", title: "JBJ AI Background Remover", description: "Remove or replace backgrounds.", link: "/toolkit/background-ai", category: "design" },
  { id: "beauty-filters", title: "JBJ Beauty Filters", description: "Professional beauty enhancements.", link: "/toolkit/beauty-filters", category: "design" },
  { id: "virtual-staging-ai", title: "JBJ AI Virtual Staging", description: "Virtually stage properties.", link: "/virtual-staging-ai", category: "design" },
  // Corporate
  { id: "stamp-generator", title: "JBJ Smart Stamp Generator", description: "Generate professional company stamps.", link: "/toolkit/stamp-generator", category: "corporate" },
  { id: "business-card", title: "JBJ Business Card Designer", description: "Design stunning business cards.", link: "/toolkit/corporate-suite/business-card", category: "corporate" },
  { id: "cv-resume", title: "JBJ CV / Resume Builder", description: "Build a professional CV.", link: "/toolkit/corporate-suite/cv-resume", category: "corporate" },
  { id: "cover-letter", title: "JBJ Cover Letter Generator", description: "Generate tailored cover letters.", link: "/toolkit/corporate-suite/cover-letter", category: "corporate" },
  { id: "logo-creator", title: "JBJ AI Logo Creator", description: "Generate professional logos.", link: "/toolkit/corporate-suite/logo-creator", category: "corporate" },
  { id: "company-profile", title: "JBJ Company Profile Builder", description: "Build company profile PDFs.", link: "/toolkit/corporate-suite/company-profile", category: "corporate" },
  { id: "presentation-tool", title: "JBJ Presentation Builder", description: "Build professional slide decks.", link: "/presentations", category: "corporate" },
  { id: "landing-page-builder", title: "JBJ Landing Page Builder", description: "Create one-page business sites.", link: "/toolkit/corporate-suite/landing-page", category: "corporate" },
  { id: "esign", title: "JBJ E-Sign", description: "Contract signing with multi-signer workflows.", link: "/e-signature", category: "corporate" },
  { id: "scan-sign", title: "JBJ Scan & Sign", description: "Camera scan, handwritten signature & PDF export.", link: "/toolkit/scan-sign", category: "corporate" },
  { id: "spreadsheet-tool", title: "JBJ Spreadsheet", description: "Create and edit spreadsheets.", link: "/spreadsheet", category: "corporate" },
  { id: "documents-tool", title: "JBJ Documents Editor", description: "Rich text document editor.", link: "/documents", category: "corporate" },
  { id: "ai-contract-reviewer", title: "JBJ AI Contract Reviewer", description: "Review contracts and highlight clauses.", link: "/ai-contract-reviewer", category: "corporate" },
  { id: "ai-document-generator", title: "JBJ AI Document Generator", description: "Generate documents from templates.", link: "/ai-document-generator", category: "corporate" },
];

// ─── Types ───────────────────────────────────────────────────────────────────
type VersionStatus = "draft" | "applied" | "tested" | "published" | "reverted" | "error";

interface ToolVersion {
  id: string;
  tool_id: string;
  version_number: number;
  status: VersionStatus;
  changes_description: string | null;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  change_reason: string | null;
  applied_by: string | null;
  tested_at: string | null;
  test_result: string | null;
  test_notes: string | null;
  published_at: string | null;
  reverted_at: string | null;
  created_at: string;
}

interface TestLog {
  id: string;
  tool_id: string;
  version_id: string | null;
  tool_url: string | null;
  tester_id: string | null;
  result: string;
  notes: string | null;
  created_at: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  source: string;
  status: string | null;
  before_preview: string | null;
  after_preview: string | null;
  side_effects: string | null;
  impact_level: string | null;
  tool_id: string | null;
}

// ─── Status badge helper ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  published: { label: "Live", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  live: { label: "Live", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  draft: { label: "Draft", className: "bg-[#B89555]/20 text-white/85 border-[#B89555]/30/40" },
  applied: { label: "Applied – Pending Test", className: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  tested: { label: "Tested – Pending Publish", className: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  reverted: { label: "Reverted", className: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  error: { label: "Error / Broken", className: "bg-red-500/20 text-red-300 border-red-500/40" },
  needs_review: { label: "Needs Review", className: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.live;
  return <Badge className={`${cfg.className} text-xs`}>{cfg.label}</Badge>;
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  property: "Property & Investment",
  productivity: "Productivity",
  marketing: "Marketing & Sales",
  design: "Design & Media",
  corporate: "Corporate Suite",
};

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AIToolsControlPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<ToolCategory | "all">("all");
  const [versions, setVersions] = useState<ToolVersion[]>([]);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Per-tool public visibility — stored in `ai_tool_visibility`
  const [hiddenTools, setHiddenTools] = useState<Set<string>>(new Set());

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [vRes, tRes, rRes, visRes] = await Promise.all([
      (supabase.from("ai_tool_versions") as any).select("*").order("created_at", { ascending: false }),
      (supabase.from("ai_tool_test_logs") as any).select("*").order("created_at", { ascending: false }),
      supabase.from("ai_recommendations").select("*").order("created_at", { ascending: false }),
      (supabase.from("ai_tool_visibility") as any).select("tool_id, is_public"),
    ]);
    if (vRes.data) setVersions(vRes.data as ToolVersion[]);
    if (tRes.data) setTestLogs(tRes.data as TestLog[]);
    if (rRes.data) setRecommendations(rRes.data as Recommendation[]);
    if (visRes.data) {
      const next = new Set<string>();
      for (const row of visRes.data as Array<{ tool_id: string; is_public: boolean }>) {
        if (row.is_public === false) next.add(row.tool_id);
      }
      setHiddenTools(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Toggle a tool's public visibility
  const toggleVisibility = useCallback(async (toolId: string, makePublic: boolean) => {
    const { error } = await (supabase.from("ai_tool_visibility") as any).upsert({
      tool_id: toolId,
      is_public: makePublic,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tool_id" });
    if (error) {
      toast.error("Failed to update visibility");
      return;
    }
    setHiddenTools(prev => {
      const next = new Set(prev);
      if (makePublic) next.delete(toolId); else next.add(toolId);
      return next;
    });
    toast.success(makePublic ? "Tool is now public" : "Tool hidden from public");
  }, [user?.id]);


  // Get current status for a tool (latest version status, or "live" if no versions)
  const getToolStatus = useCallback((toolId: string): string => {
    const tv = versions.filter(v => v.tool_id === toolId);
    if (tv.length === 0) return "live";
    return tv[0].status;
  }, [versions]);

  // Stats
  const stats = useMemo(() => {
    const s = { live: 0, draft: 0, applied: 0, tested: 0, error: 0, reverted: 0 };
    ALL_TOOLS.forEach(t => {
      const st = getToolStatus(t.id);
      if (st === "published" || st === "live") s.live++;
      else if (st in s) (s as Record<string, number>)[st]++;
    });
    return s;
  }, [getToolStatus]);

  // Filter tools
  const filtered = useMemo(() => {
    return ALL_TOOLS.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || t.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [search, catFilter]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const getNextVersion = (toolId: string) => {
    const tv = versions.filter(v => v.tool_id === toolId);
    return tv.length > 0 ? Math.max(...tv.map(v => v.version_number)) + 1 : 1;
  };

  const applyFix = async (toolId: string, rec: Recommendation) => {
    const { error } = await (supabase.from("ai_tool_versions") as any).insert({
      tool_id: toolId,
      version_number: getNextVersion(toolId),
      status: "applied",
      changes_description: rec.description,
      before_snapshot: rec.before_preview ? { preview: rec.before_preview } : null,
      after_snapshot: rec.after_preview ? { preview: rec.after_preview } : null,
      change_reason: rec.title,
      applied_by: user?.id,
    });
    if (error) { toast.error("Failed to apply fix"); return; }
    await supabase.from("ai_recommendations").update({ status: "applied", tool_id: toolId }).eq("id", rec.id);
    toast.success("Fix applied — ready for testing");
    fetchData();
  };

  const revertFix = async (toolId: string, versionId?: string) => {
    // Find previous published version
    const prev = versions.find(v => v.tool_id === toolId && v.status === "published");
    const { error } = await (supabase.from("ai_tool_versions") as any).insert({
      tool_id: toolId,
      version_number: getNextVersion(toolId),
      status: "reverted",
      changes_description: `Reverted to ${prev ? `v${prev.version_number}` : "stable state"}`,
      before_snapshot: null,
      after_snapshot: prev?.after_snapshot ?? null,
      change_reason: "Rollback to previous stable version",
      applied_by: user?.id,
      reverted_at: new Date().toISOString(),
    });
    if (error) { toast.error("Failed to revert"); return; }
    toast.success("Reverted to previous stable version");
    fetchData();
  };

  const testTool = async (toolId: string, toolUrl: string) => {
    const latestVersion = versions.find(v => v.tool_id === toolId && (v.status === "applied" || v.status === "tested"));
    // Open tool in new tab
    window.open(toolUrl, "_blank");
    // Create test log
    const { error } = await (supabase.from("ai_tool_test_logs") as any).insert({
      tool_id: toolId,
      version_id: latestVersion?.id ?? null,
      tool_url: toolUrl,
      tester_id: user?.id,
      result: "pass", // Default to pass — owner can update
      notes: "Manual test initiated",
    });
    if (error) { toast.error("Failed to log test"); return; }
    // Update version status to tested
    if (latestVersion) {
      await (supabase.from("ai_tool_versions") as any).update({
        status: "tested",
        tested_at: new Date().toISOString(),
        test_result: "pass",
      }).eq("id", latestVersion.id);
    }
    toast.success("Test logged — review results then publish");
    fetchData();
  };

  const publishVersion = async (toolId: string) => {
    const latestVersion = versions.find(v => v.tool_id === toolId && (v.status === "tested" || v.status === "applied"));
    if (!latestVersion) { toast.error("No version ready to publish"); return; }
    const { error } = await (supabase.from("ai_tool_versions") as any).update({
      status: "published",
      published_at: new Date().toISOString(),
    }).eq("id", latestVersion.id);
    if (error) { toast.error("Failed to publish"); return; }
    toast.success("Published — tool is now live");
    fetchData();
  };

  const restoreVersion = async (toolId: string, version: ToolVersion) => {
    const { error } = await (supabase.from("ai_tool_versions") as any).insert({
      tool_id: toolId,
      version_number: getNextVersion(toolId),
      status: "published",
      changes_description: `Restored from v${version.version_number}`,
      before_snapshot: null,
      after_snapshot: version.after_snapshot,
      change_reason: `Restored from version ${version.version_number}`,
      applied_by: user?.id,
      published_at: new Date().toISOString(),
    });
    if (error) { toast.error("Failed to restore"); return; }
    toast.success(`Restored to v${version.version_number}`);
    fetchData();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied");
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] text-[#1A1A1A] p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2 flex items-center gap-3">
          <Shield className="w-7 h-7" />
          AI Tools Control Panel
        </h1>
        <p className="text-white/70 text-sm">Apply → Test → Publish workflow for every tool. Owner-only access.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Live", value: stats.live, color: "text-emerald-400" },
          { label: "Draft", value: stats.draft, color: "text-white/70" },
          { label: "Pending Test", value: stats.applied, color: "text-[#1A1A1A]" },
          { label: "Pending Publish", value: stats.tested, color: "text-blue-400" },
          { label: "Reverted", value: stats.reverted, color: "text-orange-400" },
          { label: "Error", value: stats.error, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#FDFBF7]/60 border border-[#1A1A1A] rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-white/90">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/90" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 !bg-[#FDFBF7] !border-[#1A1A1A] !text-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "property", "productivity", "marketing", "design", "corporate"] as const).map(c => (
            <Button
              key={c}
              size="sm"
              variant={catFilter === c ? "default" : "outline"}
              onClick={() => setCatFilter(c)}
              className={catFilter === c ? "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90" : "border-[#1A1A1A] text-white/70 hover:text-white"}
            >
              {c === "all" ? "All" : CATEGORY_LABELS[c]}
            </Button>
          ))}
        </div>
      </div>

      {/* Tool List */}
      {loading ? (
        <div className="text-center py-20 text-white/90">Loading tools...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tool => {
            const status = getToolStatus(tool.id);
            const fullUrl = `${ORIGIN}${tool.link}`;
            const toolVersions = versions.filter(v => v.tool_id === tool.id);
            const toolTestLogs = testLogs.filter(t => t.tool_id === tool.id);
            const toolRecs = recommendations.filter(r => r.tool_id === tool.id || (!r.tool_id && r.status === "pending"));
            const isExpanded = expandedTool === tool.id;

            return (
              <Collapsible key={tool.id} open={isExpanded} onOpenChange={() => setExpandedTool(isExpanded ? null : tool.id)}>
                <Card className="!bg-[#FDFBF7]/80 !border-[#1A1A1A] hover:!border-[#1A1A1A] transition-colors">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <ChevronDown className={`w-4 h-4 text-white/90 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                          <div className="min-w-0">
                            <CardTitle className="!text-base text-white truncate">{tool.title}</CardTitle>
                            <p className="text-xs text-white/90 mt-0.5">{tool.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Public visibility toggle */}
                          <div
                            onClick={e => e.stopPropagation()}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
                              hiddenTools.has(tool.id)
                                ? "bg-red-500/10 border-red-500/40"
                                : "bg-emerald-500/10 border-emerald-500/40"
                            }`}
                            title={hiddenTools.has(tool.id) ? "Hidden from public" : "Visible to public"}
                          >
                            {hiddenTools.has(tool.id)
                              ? <EyeOff className="w-3.5 h-3.5 text-red-400" />
                              : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                            <Switch
                              checked={!hiddenTools.has(tool.id)}
                              onCheckedChange={(checked) => toggleVisibility(tool.id, checked)}
                              aria-label={`Toggle public visibility for ${tool.title}`}
                            />
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                              {hiddenTools.has(tool.id) ? "Hidden" : "Public"}
                            </span>
                          </div>
                          <Badge className="bg-[#F7F2EA] text-white/70 border-[#1A1A1A] text-[10px]">{CATEGORY_LABELS[tool.category]}</Badge>
                          <StatusBadge status={status} />
                        </div>
                      </div>
                      {/* Direct URL row */}
                      <div className="flex items-center gap-2 mt-2 ml-7" onClick={e => e.stopPropagation()}>
                        <code className="text-xs text-white/70 bg-[#F7F2EA]/80 px-2 py-1 rounded font-mono truncate max-w-[400px]">{fullUrl}</code>
                        <Button size="sm" variant="ghost" onClick={() => copyUrl(fullUrl)} className="h-6 w-6 p-0 text-white/90 hover:text-[#1A1A1A]">
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Link to={tool.link} target="_blank">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-white/70 hover:text-[#1A1A1A] gap-1">
                            <ExternalLink className="w-3 h-3" /> Open Tool
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <Tabs defaultValue="fixes" className="w-full">
                        <TabsList className="!bg-[#F7F2EA]/60 mb-4">
                          <TabsTrigger value="fixes" className="text-xs">Fixes & Recommendations</TabsTrigger>
                          <TabsTrigger value="history" className="text-xs">Version History ({toolVersions.length})</TabsTrigger>
                          <TabsTrigger value="tests" className="text-xs">Test Logs ({toolTestLogs.length})</TabsTrigger>
                        </TabsList>

                        {/* ── Tab 1: Fixes ── */}
                        <TabsContent value="fixes">
                          {toolRecs.length === 0 ? (
                            <div className="text-center py-8 text-[#1A1A1A]/70 text-sm">No pending recommendations for this tool.</div>
                          ) : (
                            <div className="space-y-3">
                              {toolRecs.map(rec => (
                                <FixCard
                                  key={rec.id}
                                  rec={rec}
                                  toolId={tool.id}
                                  toolUrl={fullUrl}
                                  onApply={() => applyFix(tool.id, rec)}
                                  onTest={() => testTool(tool.id, fullUrl)}
                                  onPublish={() => publishVersion(tool.id)}
                                  onRevert={() => revertFix(tool.id)}
                                />
                              ))}
                            </div>
                          )}
                          {/* Quick actions for tools with applied versions */}
                          {(status === "applied" || status === "tested") && (
                            <div className="mt-4 flex gap-2 border-t border-[#1A1A1A] pt-4">
                              {status === "applied" && (
                                <Button size="sm" onClick={() => testTool(tool.id, fullUrl)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                                  <Play className="w-3 h-3" /> Test
                                </Button>
                              )}
                              {status === "tested" && (
                                <Button size="sm" onClick={() => publishVersion(tool.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                                  <Rocket className="w-3 h-3" /> Save & Publish
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => revertFix(tool.id)} className="border-[#1A1A1A] text-white/70 hover:text-red-400 gap-1">
                                <Undo2 className="w-3 h-3" /> Revert
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        {/* ── Tab 2: Version History ── */}
                        <TabsContent value="history">
                          {toolVersions.length === 0 ? (
                            <div className="text-center py-8 text-[#1A1A1A]/70 text-sm">No version history yet.</div>
                          ) : (
                            <div className="space-y-2">
                              {toolVersions.map(v => (
                                <div key={v.id} className="bg-[#F7F2EA]/50 border border-[#1A1A1A]/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-mono text-[#1A1A1A]">v{v.version_number}</span>
                                      <StatusBadge status={v.status} />
                                      <span className="text-xs text-white/90">{new Date(v.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {v.status !== "published" && (
                                        <Button size="sm" variant="ghost" onClick={() => restoreVersion(tool.id, v)} className="h-7 text-xs text-white/70 hover:text-[#1A1A1A] gap-1">
                                          <RotateCcw className="w-3 h-3" /> Restore
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {v.changes_description && <p className="text-xs text-white/70 mt-1">{v.changes_description}</p>}
                                  {v.change_reason && <p className="text-xs text-white/90 mt-0.5">Reason: {v.change_reason}</p>}
                                  {v.test_result && (
                                    <div className="flex items-center gap-1 mt-1">
                                      {v.test_result === "pass" ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                                      <span className="text-xs text-white/90">Test: {v.test_result}</span>
                                      {v.test_notes && <span className="text-xs text-[#1A1A1A]/70"> — {v.test_notes}</span>}
                                    </div>
                                  )}
                                  {/* Before/After */}
                                  {(v.before_snapshot || v.after_snapshot) && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      {v.before_snapshot && (
                                        <div className="bg-red-900/10 border border-red-900/30 rounded p-2">
                                          <span className="text-[10px] text-red-400 font-semibold">BEFORE</span>
                                          <pre className="text-[10px] text-white/70 mt-1 whitespace-pre-wrap">{JSON.stringify(v.before_snapshot, null, 2).slice(0, 200)}</pre>
                                        </div>
                                      )}
                                      {v.after_snapshot && (
                                        <div className="bg-emerald-900/10 border border-emerald-900/30 rounded p-2">
                                          <span className="text-[10px] text-emerald-400 font-semibold">AFTER</span>
                                          <pre className="text-[10px] text-white/70 mt-1 whitespace-pre-wrap">{JSON.stringify(v.after_snapshot, null, 2).slice(0, 200)}</pre>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        {/* ── Tab 3: Test Logs ── */}
                        <TabsContent value="tests">
                          {toolTestLogs.length === 0 ? (
                            <div className="text-center py-8 text-[#1A1A1A]/70 text-sm">No test logs yet.</div>
                          ) : (
                            <div className="space-y-2">
                              {toolTestLogs.map(t => (
                                <div key={t.id} className="bg-[#F7F2EA]/50 border border-[#1A1A1A]/50 rounded-lg p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {t.result === "pass" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                                    <div>
                                      <span className="text-xs text-white/85">{t.result === "pass" ? "Passed" : "Failed"}</span>
                                      {t.notes && <span className="text-xs text-white/90 ml-2">— {t.notes}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {t.tool_url && <code className="text-[10px] text-[#1A1A1A]/70 font-mono">{t.tool_url}</code>}
                                    <span className="text-[10px] text-[#1A1A1A]/70">{new Date(t.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Fix Card Component ──────────────────────────────────────────────────────
function FixCard({
  rec, toolId, toolUrl, onApply, onTest, onPublish, onRevert,
}: {
  rec: Recommendation;
  toolId: string;
  toolUrl: string;
  onApply: () => void;
  onTest: () => void;
  onPublish: () => void;
  onRevert: () => void;
}) {
  const isApplied = rec.status === "applied";
  const isTested = rec.status === "tested" || rec.status === "published";
  return (
    <div className="bg-[#F7F2EA]/40 border border-[#1A1A1A]/40 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">{rec.title}</span>
            {rec.impact_level && (
              <Badge className={`text-[10px] ${rec.impact_level === "high" ? "bg-red-500/20 text-red-300 border-red-500/40" : rec.impact_level === "medium" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30/40"}`}>
                {rec.impact_level}
              </Badge>
            )}
            {rec.status && <StatusBadge status={rec.status} />}
          </div>
          <p className="text-xs text-white/70">{rec.description}</p>
          {rec.side_effects && <p className="text-xs text-[#1A1A1A]/80 mt-1">⚠ Side effects: {rec.side_effects}</p>}
        </div>
        {/* Action Buttons — inline next to fix */}
        <div className="flex items-center gap-1 shrink-0">
          {!isApplied && !isTested && (
            <Button size="sm" onClick={onApply} className="h-7 text-xs bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90 gap-1">
              <CheckCircle2 className="w-3 h-3" /> Apply
            </Button>
          )}
          {isApplied && (
            <Button size="sm" onClick={onTest} className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1">
              <Play className="w-3 h-3" /> Test
            </Button>
          )}
          {(isApplied || isTested) && (
            <Button size="sm" onClick={onPublish} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Save className="w-3 h-3" /> Save & Publish
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onRevert} className="h-7 text-xs text-white/90 hover:text-red-400 gap-1">
            <Undo2 className="w-3 h-3" /> Revert
          </Button>
        </div>
      </div>
      {/* Before / After */}
      {(rec.before_preview || rec.after_preview) && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {rec.before_preview && (
            <div className="bg-red-900/10 border border-red-900/30 rounded p-2">
              <span className="text-[10px] text-red-400 font-semibold uppercase">Before</span>
              <p className="text-[10px] text-white/70 mt-1 whitespace-pre-wrap">{rec.before_preview}</p>
            </div>
          )}
          {rec.after_preview && (
            <div className="bg-emerald-900/10 border border-emerald-900/30 rounded p-2">
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">After</span>
              <p className="text-[10px] text-white/70 mt-1 whitespace-pre-wrap">{rec.after_preview}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
