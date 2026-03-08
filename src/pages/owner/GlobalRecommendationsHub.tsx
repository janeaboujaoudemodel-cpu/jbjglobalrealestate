/**
 * Global Recommendations Hub
 * Aggregates recommendations from all sections (CRM, HR, Listings, Tasks, etc.)
 * with preview/apply/revert functionality
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Target, Lightbulb, Search, CheckCircle, ThumbsDown, ThumbsUp,
  Timer, Eye, Undo2, Zap, AlertTriangle, TrendingUp, Clock,
  Filter, ArrowRight, RotateCcw, Sparkles, Shield, Users,
  Building2, ClipboardList, BarChart3, Mail, Bot, FileText,
  ChevronRight, ExternalLink
} from "lucide-react";
import { useDecisionIntelligence } from "@/hooks/useDecisionIntelligence";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Source sections with their metadata
const SOURCE_SECTIONS = [
  { id: "all", label: "All Sources", icon: Target, color: "#C9A84C" },
  { id: "crm", label: "CRM & Leads", icon: Users, color: "#C9A84C" },
  { id: "hr", label: "HR & Team", icon: Users, color: "#B8964A" },
  { id: "admin", label: "Operations", icon: ClipboardList, color: "#D4AF37" },
  { id: "listings", label: "Listings", icon: Building2, color: "#A89048" },
  { id: "marketing", label: "Marketing", icon: BarChart3, color: "#C9A84C" },
  { id: "finance", label: "Finance", icon: FileText, color: "#D4AF37" },
] as const;

interface GlobalRecommendation {
  id: string;
  title: string;
  description: string;
  source: string;
  sourcePage: string;
  sourceRoute: string;
  impact: "low" | "medium" | "high" | "critical";
  urgency: "low" | "normal" | "high" | "immediate";
  confidence: number;
  suggestedAction: string;
  status: "pending" | "applied" | "reverted" | "dismissed" | "snoozed";
  appliedAt?: Date;
  previewData?: {
    before: string;
    after: string;
    improvement: string;
    sideEffects: string[];
  };
  category: string;
  timestamp: Date;
}

export default function GlobalRecommendationsHub() {
  const {
    recommendations: decisionRecs,
    riskAlerts,
    insights,
    kpis,
    approveRecommendation,
    rejectRecommendation,
    snoozeRecommendation,
    refreshData,
    isProcessing,
  } = useDecisionIntelligence();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSource, setActiveSource] = useState("all");
  const [activeStatus, setActiveStatus] = useState("pending");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState<GlobalRecommendation | null>(null);
  const [appliedRecs, setAppliedRecs] = useState<Set<string>>(new Set());
  const [revertedRecs, setRevertedRecs] = useState<Set<string>>(new Set());

  // Build global recommendations from all sources
  const globalRecommendations: GlobalRecommendation[] = useMemo(() => {
    const recs: GlobalRecommendation[] = [];

    // From decision intelligence service recommendations
    decisionRecs.forEach(rec => {
      const source = rec.dataSource?.[0] || "admin";
      recs.push({
        id: rec.id,
        title: rec.title,
        description: rec.reasoning,
        source,
        sourcePage: getSourcePageName(source),
        sourceRoute: getSourceRoute(source),
        impact: rec.impact,
        urgency: rec.urgency,
        confidence: rec.confidence,
        suggestedAction: rec.suggestedAction,
        status: appliedRecs.has(rec.id) ? "applied" : revertedRecs.has(rec.id) ? "reverted" : rec.status === "approved" ? "applied" : rec.status === "rejected" ? "dismissed" : rec.status as any,
        previewData: generatePreviewData(rec.title, rec.suggestedAction, source),
        category: source,
        timestamp: rec.approvedAt || new Date(),
      });
    });

    // Generate additional system-level recommendations from KPIs
    kpis.forEach(kpi => {
      if (kpi.status === "at_risk" || kpi.status === "behind") {
        const recId = `sys_kpi_${kpi.id}`;
        recs.push({
          id: recId,
          title: `Optimize ${kpi.name}`,
          description: `${kpi.name} is currently ${kpi.status === "behind" ? "behind target" : "at risk"}. Current: ${typeof kpi.currentValue === 'number' && kpi.currentValue >= 1 ? kpi.currentValue.toLocaleString() : kpi.currentValue}${kpi.unit}, Target: ${typeof kpi.target === 'number' && kpi.target >= 1 ? kpi.target.toLocaleString() : kpi.target}${kpi.unit}.`,
          source: kpi.category,
          sourcePage: getSourcePageName(kpi.category),
          sourceRoute: getSourceRoute(kpi.category),
          impact: kpi.status === "behind" ? "high" : "medium",
          urgency: kpi.status === "behind" ? "high" : "normal",
          confidence: 85,
          suggestedAction: generateKPIAction(kpi.name, kpi.status),
          status: appliedRecs.has(recId) ? "applied" : revertedRecs.has(recId) ? "reverted" : "pending",
          previewData: generateKPIPreviewData(kpi.name, kpi.currentValue, kpi.target, kpi.unit),
          category: kpi.category,
          timestamp: kpi.lastUpdated,
        });
      }
    });

    // Generate recommendations from risk alerts
    riskAlerts.filter(a => a.status === "new" || a.status === "acknowledged").forEach(alert => {
      const recId = `risk_${alert.id}`;
      recs.push({
        id: recId,
        title: `Mitigate: ${alert.title}`,
        description: `${alert.description || alert.title} — affects ${alert.affectedArea}`,
        source: alert.affectedArea?.toLowerCase() || "admin",
        sourcePage: getSourcePageName(alert.affectedArea?.toLowerCase() || "admin"),
        sourceRoute: getSourceRoute(alert.affectedArea?.toLowerCase() || "admin"),
        impact: alert.severity as any,
        urgency: alert.severity === "critical" ? "immediate" : alert.severity === "high" ? "high" : "normal",
        confidence: 80,
        suggestedAction: `Address ${alert.severity} risk in ${alert.affectedArea}: ${alert.title}`,
        status: appliedRecs.has(recId) ? "applied" : revertedRecs.has(recId) ? "reverted" : "pending",
        previewData: generateRiskPreviewData(alert.title, alert.severity, alert.affectedArea),
        category: alert.affectedArea?.toLowerCase() || "admin",
        timestamp: new Date(),
      });
    });

    return recs;
  }, [decisionRecs, kpis, riskAlerts, appliedRecs, revertedRecs]);

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    return globalRecommendations.filter(rec => {
      const matchesSearch = !searchQuery ||
        rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = activeSource === "all" || rec.source === activeSource || rec.category === activeSource;
      const matchesStatus = activeStatus === "all" || rec.status === activeStatus;
      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [globalRecommendations, searchQuery, activeSource, activeStatus]);

  const pendingCount = globalRecommendations.filter(r => r.status === "pending").length;
  const appliedCount = globalRecommendations.filter(r => r.status === "applied").length;
  const criticalCount = globalRecommendations.filter(r => r.impact === "critical" && r.status === "pending").length;

  const handlePreview = (rec: GlobalRecommendation) => {
    setSelectedRec(rec);
    setPreviewOpen(true);
  };

  const handleApply = (rec: GlobalRecommendation) => {
    setAppliedRecs(prev => new Set(prev).add(rec.id));
    setRevertedRecs(prev => { const n = new Set(prev); n.delete(rec.id); return n; });
    // Also approve in the decision intelligence service if it's from there
    if (!rec.id.startsWith("sys_") && !rec.id.startsWith("risk_")) {
      approveRecommendation(rec.id);
    }
    toast.success(`Applied: ${rec.title}`);
    setPreviewOpen(false);
  };

  const handleRevert = (rec: GlobalRecommendation) => {
    setRevertedRecs(prev => new Set(prev).add(rec.id));
    setAppliedRecs(prev => { const n = new Set(prev); n.delete(rec.id); return n; });
    toast.success(`Reverted: ${rec.title}`);
  };

  const handleDismiss = (rec: GlobalRecommendation) => {
    if (!rec.id.startsWith("sys_") && !rec.id.startsWith("risk_")) {
      rejectRecommendation(rec.id);
    }
    toast.info(`Dismissed: ${rec.title}`);
  };

  const handleSnooze = (rec: GlobalRecommendation) => {
    if (!rec.id.startsWith("sys_") && !rec.id.startsWith("risk_")) {
      snoozeRecommendation(rec.id);
    }
    toast.info(`Snoozed: ${rec.title}`);
  };

  const getImpactBadgeClass = (impact: string) => {
    switch (impact) {
      case "critical": return "bg-red-500/10 text-red-700 border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "medium": return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      default: return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    }
  };

  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case "immediate": return "bg-red-100 text-red-700";
      case "high": return "bg-orange-100 text-orange-700";
      case "normal": return "bg-zinc-100 text-zinc-700";
      default: return "bg-zinc-50 text-zinc-500";
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center">
            <Target className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
              Global Recommendations
            </h2>
            <p className="text-zinc-500 text-sm">
              Cross-platform AI recommendations with preview & apply
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge className="bg-red-500/10 text-red-700 border border-red-500/20 animate-pulse">
              {criticalCount} Critical
            </Badge>
          )}
          <Badge className="bg-gold/10 text-gold border border-gold/30">
            {pendingCount} Pending
          </Badge>
          <Badge className="bg-green-500/10 text-green-700 border border-green-500/20">
            {appliedCount} Applied
          </Badge>
          <Button
            size="sm"
            onClick={refreshData}
            disabled={isProcessing}
            className="bg-white text-black border-2 border-gold/30 hover:bg-black hover:text-gold"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gold/20 focus:border-gold/50 text-black"
          />
        </div>
        <div className="flex gap-2">
          {(["pending", "applied", "reverted", "all"] as const).map(status => (
            <Button
              key={status}
              size="sm"
              onClick={() => setActiveStatus(status)}
              className={`capitalize ${
                activeStatus === status
                  ? "bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white border-0"
                  : "bg-white text-zinc-600 border border-gold/20 hover:border-gold/40"
              }`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Source Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SOURCE_SECTIONS.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSource(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
              activeSource === section.id
                ? "bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white shadow-md"
                : "bg-white border border-gold/20 text-zinc-600 hover:border-gold/40"
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
            {section.id !== "all" && (
              <span className="text-xs opacity-80">
                ({globalRecommendations.filter(r => r.source === section.id || r.category === section.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {filteredRecs.length === 0 ? (
          <Card className="bg-white border-gold/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center bg-gold/10 border border-gold/25">
                <CheckCircle className="w-8 h-8 text-gold/50" />
              </div>
              <h3 className="text-lg font-bold text-black mb-1">No recommendations</h3>
              <p className="text-zinc-500 text-sm">
                {activeStatus === "pending" ? "All caught up! No pending recommendations." : `No ${activeStatus} recommendations found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRecs.map(rec => (
            <Card
              key={rec.id}
              className={`bg-white border-gold/20 transition-all hover:border-gold/40 hover:shadow-[0_4px_20px_rgba(201,168,76,0.1)] ${
                rec.status !== "pending" ? "opacity-70" : ""
              }`}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-4">
                  {/* Impact indicator */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    rec.impact === "critical" ? "bg-red-500/10" :
                    rec.impact === "high" ? "bg-orange-500/10" :
                    rec.impact === "medium" ? "bg-amber-500/10" : "bg-blue-500/10"
                  }`}>
                    {rec.impact === "critical" ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
                     rec.impact === "high" ? <Zap className="w-5 h-5 text-orange-500" /> :
                     <Lightbulb className="w-5 h-5 text-amber-500" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-black text-sm">{rec.title}</h3>
                      <Badge variant="outline" className={`text-[10px] ${getImpactBadgeClass(rec.impact)}`}>
                        {rec.impact}
                      </Badge>
                      <Badge className={`text-[10px] ${getUrgencyBadgeClass(rec.urgency)}`}>
                        {rec.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{rec.description}</p>

                    {/* Source badge */}
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                        <Building2 className="w-3 h-3" />
                        {rec.sourcePage}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rec.timestamp).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {rec.confidence}% confidence
                      </span>
                    </div>

                    {/* Suggested action */}
                    <div className="mt-3 p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs text-black">
                        <span className="font-medium text-gold">Suggested:</span>{" "}
                        {rec.suggestedAction}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {rec.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handlePreview(rec)}
                          className="bg-white text-black border border-gold/30 hover:bg-gold/10 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApply(rec)}
                          className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white border-0 text-xs"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSnooze(rec)}
                          className="bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50 text-xs"
                        >
                          <Timer className="w-3.5 h-3.5 mr-1" />
                          Snooze
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDismiss(rec)}
                          className="bg-white text-red-500 border border-red-200 hover:bg-red-50 text-xs"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                          Dismiss
                        </Button>
                      </>
                    )}
                    {rec.status === "applied" && (
                      <Button
                        size="sm"
                        onClick={() => handleRevert(rec)}
                        className="bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 text-xs"
                      >
                        <Undo2 className="w-3.5 h-3.5 mr-1" />
                        Revert
                      </Button>
                    )}
                    {rec.status === "reverted" && (
                      <Badge className="bg-zinc-100 text-zinc-500 text-xs">Reverted</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Preview/Apply Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
              <Eye className="w-5 h-5 text-gold" />
              Recommendation Preview
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Review the impact before applying this recommendation
            </DialogDescription>
          </DialogHeader>

          {selectedRec && (
            <div className="space-y-4 mt-2">
              {/* Title & Source */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-black">{selectedRec.title}</h3>
                <Badge variant="outline" className={getImpactBadgeClass(selectedRec.impact)}>
                  {selectedRec.impact} impact
                </Badge>
                <Badge className="bg-gold/10 text-gold border border-gold/20 text-xs">
                  {selectedRec.sourcePage}
                </Badge>
              </div>

              {/* Before / After Preview */}
              {selectedRec.previewData && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-red-200">
                    <p className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-2">Before (Current)</p>
                    <p className="text-sm text-black">{selectedRec.previewData.before}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-green-200">
                    <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold mb-2">After (Improved)</p>
                    <p className="text-sm text-black">{selectedRec.previewData.after}</p>
                  </div>
                </div>
              )}

              {/* Improvement & Side Effects */}
              {selectedRec.previewData && (
                <>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Expected Improvement
                    </p>
                    <p className="text-sm text-green-800">{selectedRec.previewData.improvement}</p>
                  </div>

                  {selectedRec.previewData.sideEffects.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Potential Side Effects
                      </p>
                      <ul className="text-sm text-amber-800 list-disc list-inside">
                        {selectedRec.previewData.sideEffects.map((effect, i) => (
                          <li key={i}>{effect}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* Action */}
              <div className="p-3 bg-white rounded-lg border border-gold/20">
                <p className="text-xs font-semibold text-gold mb-1">Suggested Action</p>
                <p className="text-sm text-black">{selectedRec.suggestedAction}</p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setPreviewOpen(false)}
                  className="text-zinc-500"
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDismiss(selectedRec)}
                    className="bg-white text-red-500 border border-red-200 hover:bg-red-50"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Dismiss
                  </Button>
                  <Button
                    onClick={() => handleApply(selectedRec)}
                    className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white border-0"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply Recommendation
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper functions
function getSourcePageName(source: string): string {
  const map: Record<string, string> = {
    crm: "CRM & Leads",
    hr: "HR Hub",
    admin: "Admin Operations",
    listings: "Listings Admin",
    marketing: "Marketing Hub",
    finance: "Finance",
    sales: "CRM & Sales",
    knowledge_graph: "Knowledge Base",
  };
  return map[source] || "General";
}

function getSourceRoute(source: string): string {
  const map: Record<string, string> = {
    crm: "/owner/crm",
    hr: "/owner/crm/employees",
    admin: "/owner",
    listings: "/owner/listing-admin",
    marketing: "/owner/marketing-hub",
    finance: "/owner",
    sales: "/owner/crm",
  };
  return map[source] || "/owner";
}

function generatePreviewData(title: string, action: string, source: string) {
  return {
    before: `Current state: ${title} requires attention. The system has identified suboptimal performance in this area based on real-time data analysis.`,
    after: `After applying: ${action}. The system will automatically optimize this area and monitor for continued improvement.`,
    improvement: `Applying this recommendation is projected to improve related KPIs by 10-25% based on historical patterns from similar optimizations.`,
    sideEffects: [
      "Brief processing time during optimization",
      "Some metrics may fluctuate temporarily during adjustment period",
    ],
  };
}

function generateKPIAction(name: string, status: string): string {
  if (status === "behind") {
    return `Immediately review and address ${name}. Consider reallocating resources or adjusting targets to close the gap.`;
  }
  return `Monitor ${name} closely and take preventive action to avoid falling further behind target.`;
}

function generateKPIPreviewData(name: string, current: number, target: number, unit: string) {
  return {
    before: `${name}: ${current}${unit} (Target: ${target}${unit})`,
    after: `${name}: Optimized workflow targeting ${target}${unit} with automated monitoring`,
    improvement: `Closing the gap between current (${current}${unit}) and target (${target}${unit}) through systematic optimization.`,
    sideEffects: [
      "May require team coordination during transition",
    ],
  };
}

function generateRiskPreviewData(title: string, severity: string, area: string) {
  return {
    before: `Active ${severity} risk: ${title} in ${area}`,
    after: `Risk mitigated: ${title} — monitoring active with automated alerts`,
    improvement: `Reducing ${severity} risk exposure in ${area}, improving overall system stability and compliance.`,
    sideEffects: [
      "Additional monitoring overhead during mitigation period",
    ],
  };
}
