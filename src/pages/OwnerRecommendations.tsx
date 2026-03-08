import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, TrendingUp, AlertTriangle, CheckCircle2, RotateCcw,
  Eye, ArrowRight, BarChart3, Users, Building2, Megaphone, DollarSign,
  Briefcase, Loader2, RefreshCw, Filter, X
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Recommendation {
  id: string;
  source: string;
  title: string;
  description: string;
  impact_level: string;
  before_preview: string | null;
  after_preview: string | null;
  side_effects: string | null;
  status: string;
  applied_at: string | null;
  reverted_at: string | null;
  created_at: string;
}

const SOURCE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  crm: { icon: Users, label: "CRM", color: "bg-blue-100 text-blue-700" },
  hr: { icon: Briefcase, label: "HR", color: "bg-violet-100 text-violet-700" },
  operations: { icon: BarChart3, label: "Operations", color: "bg-emerald-100 text-emerald-700" },
  listings: { icon: Building2, label: "Listings", color: "bg-amber-100 text-amber-700" },
  marketing: { icon: Megaphone, label: "Marketing", color: "bg-pink-100 text-pink-700" },
  finance: { icon: DollarSign, label: "Finance", color: "bg-teal-100 text-teal-700" },
};

const IMPACT_COLORS: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const OwnerRecommendations = () => {
  const { user } = useAuth();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRecs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase.from("ai_recommendations").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (filterSource !== "all") q = q.eq("source", filterSource);
      if (filterStatus !== "all") q = q.eq("status", filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      setRecs((data || []) as Recommendation[]);
    } catch { toast.error("Failed to load recommendations"); }
    finally { setLoading(false); }
  }, [user, filterSource, filterStatus]);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const generateRecs = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("lovable-ai", {
        body: {
          messages: [
            { role: "system", content: `You are a business intelligence AI for JBJ Global Real Estate. Generate 5 actionable recommendations across CRM, HR, Operations, Listings, and Marketing. Each must have: title, description, impact_level (low/medium/high/critical), before_preview (current state), after_preview (improved state), side_effects (potential impacts). Return ONLY valid JSON array.` },
            { role: "user", content: `Generate 5 cross-department recommendations for improving business operations. Focus on: lead conversion, team productivity, listing optimization, marketing reach, and operational efficiency. Return JSON array with fields: source, title, description, impact_level, before_preview, after_preview, side_effects` },
          ],
        },
      });
      if (error) throw error;
      let content = data?.choices?.[0]?.message?.content?.trim() || "[]";
      content = content.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(content);
      
      for (const rec of parsed) {
        await supabase.from("ai_recommendations").insert({
          user_id: user.id,
          source: rec.source || "operations",
          title: rec.title,
          description: rec.description,
          impact_level: rec.impact_level || "medium",
          before_preview: rec.before_preview || null,
          after_preview: rec.after_preview || null,
          side_effects: rec.side_effects || null,
        });
      }
      toast.success(`Generated ${parsed.length} new recommendations`);
      fetchRecs();
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate");
    } finally { setGenerating(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
      if (status === "applied") updates.applied_at = new Date().toISOString();
      if (status === "reverted") updates.reverted_at = new Date().toISOString();
      const { error } = await supabase.from("ai_recommendations").update(updates).eq("id", id);
      if (error) throw error;
      setRecs(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast.success(`Recommendation ${status}`);
    } catch { toast.error("Failed to update"); }
  };

  const counts = {
    pending: recs.filter(r => r.status === "pending").length,
    applied: recs.filter(r => r.status === "applied").length,
    reverted: recs.filter(r => r.status === "reverted").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Header */}
      <div className="border-b-2 border-gold/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-full px-4 py-1 mb-3">
                <Sparkles className="w-4 h-4 text-[#8B7355]" />
                <span className="text-black text-sm font-medium">AI Intelligence</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-black">Global Recommendations</h1>
              <p className="text-zinc-600 mt-1">Cross-department AI-driven insights with preview, apply, and revert controls</p>
            </div>
            <Button onClick={generateRecs} disabled={generating} className="bg-black text-white hover:bg-zinc-800 self-start">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate New Recommendations</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending", count: counts.pending, icon: AlertTriangle, color: "text-amber-600" },
            { label: "Applied", count: counts.applied, icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Reverted", count: counts.reverted, icon: RotateCcw, color: "text-zinc-500" },
          ].map(s => (
            <div key={s.label} className="bg-white/80 border border-gold/20 rounded-xl p-4 flex items-center gap-3">
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-black">{s.count}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex flex-wrap gap-1 bg-white/60 border border-gold/20 rounded-lg p-1">
            {["all", ...Object.keys(SOURCE_CONFIG)].map(s => {
              const cfg = SOURCE_CONFIG[s];
              const SrcIcon = cfg?.icon;
              return (
                <button key={s} onClick={() => setFilterSource(s)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-medium transition-all ${filterSource === s ? "bg-gradient-to-r from-[#F5EBD7] to-[#D4C4A8] text-black border border-gold/40 shadow-sm" : "text-zinc-600 hover:bg-gold/10"}`}>
                  {SrcIcon && <SrcIcon className="w-3 h-3 flex-shrink-0" />}
                  {s === "all" ? "All Sources" : cfg?.label || s}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1 bg-white/60 border border-gold/20 rounded-lg p-1">
            {["all", "pending", "applied", "reverted", "dismissed"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filterStatus === s ? "bg-gradient-to-r from-[#F5EBD7] to-[#D4C4A8] text-black border border-gold/40 shadow-sm" : "text-zinc-600 hover:bg-gold/10"}`}>
                {s === "all" ? "All Status" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : recs.length === 0 ? (
          <div className="text-center py-20 bg-white/60 border border-gold/20 rounded-2xl">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gold/40" />
            <p className="text-lg font-semibold text-black">No Recommendations Yet</p>
            <p className="text-sm text-zinc-500 mt-1">Click "Generate New Recommendations" to get AI-powered insights</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recs.map(rec => {
              const srcConfig = SOURCE_CONFIG[rec.source] || SOURCE_CONFIG.operations;
              const SrcIcon = srcConfig.icon;
              const isExpanded = expandedId === rec.id;
              return (
                <div key={rec.id} className="bg-white/90 border border-gold/20 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 flex items-start gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : rec.id)}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${srcConfig.color}`}>
                      <SrcIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-black text-sm">{rec.title}</h3>
                        <Badge className={`text-[10px] ${IMPACT_COLORS[rec.impact_level]}`}>{rec.impact_level}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{rec.status}</Badge>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2">{rec.description}</p>
                    </div>
                    <Eye className={`h-4 w-4 text-zinc-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gold/10 bg-[#FDFBF7] p-5">
                      {/* Before / After Preview */}
                      {(rec.before_preview || rec.after_preview) && (
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          {rec.before_preview && (
                            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                              <p className="text-[10px] font-bold uppercase text-red-500 mb-2">Before</p>
                              <p className="text-xs text-zinc-700">{rec.before_preview}</p>
                            </div>
                          )}
                          {rec.after_preview && (
                            <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
                              <p className="text-[10px] font-bold uppercase text-green-600 mb-2">After</p>
                              <p className="text-xs text-zinc-700">{rec.after_preview}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {rec.side_effects && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 mb-4">
                          <p className="text-[10px] font-bold uppercase text-amber-600 mb-1">Potential Side Effects</p>
                          <p className="text-xs text-zinc-600">{rec.side_effects}</p>
                        </div>
                      )}
                      {/* Actions */}
                      <div className="flex gap-2">
                        {rec.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => updateStatus(rec.id, "applied")} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Apply
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(rec.id, "dismissed")} className="text-xs border-gold/30">
                              <X className="h-3 w-3 mr-1" /> Dismiss
                            </Button>
                          </>
                        )}
                        {rec.status === "applied" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(rec.id, "reverted")} className="text-xs border-gold/30">
                            <RotateCcw className="h-3 w-3 mr-1" /> Revert
                          </Button>
                        )}
                        {(rec.status === "reverted" || rec.status === "dismissed") && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(rec.id, "pending")} className="text-xs border-gold/30">
                            <RefreshCw className="h-3 w-3 mr-1" /> Re-evaluate
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerRecommendations;
