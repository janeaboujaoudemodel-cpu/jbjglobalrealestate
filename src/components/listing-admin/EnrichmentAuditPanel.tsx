import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2, Clock, AlertCircle, Eye, ArrowRight,
  FileText, Image, Loader2, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrichmentSuggestion {
  id: string;
  project_id: string | null;
  project_name: string | null;
  listing_id: string | null;
  suggestion_type: string;
  status: string;
  before_data: Record<string, any> | null;
  after_data: Record<string, any> | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface EnrichmentJob {
  id: string;
  status: string;
  total_projects: number | null;
  processed: number | null;
  images_added: number | null;
  docs_added: number | null;
  fields_updated: number | null;
  errors: number | null;
  started_at: string | null;
  completed_at: string | null;
}

// Diff viewer for before/after snapshots
const DiffViewer = ({ before, after }: { before: Record<string, any> | null; after: Record<string, any> | null }) => {
  if (!before && !after) return <p className="text-sm text-muted-foreground">No data available</p>;

  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changedKeys = Array.from(allKeys).filter(k => {
    const b = JSON.stringify((before || {})[k]);
    const a = JSON.stringify((after || {})[k]);
    return b !== a;
  });

  if (changedKeys.length === 0) return <p className="text-sm text-muted-foreground">No changes detected</p>;

  return (
    <div className="space-y-2 text-sm">
      {changedKeys.map(key => {
        const bVal = (before || {})[key];
        const aVal = (after || {})[key];
        const isNew = bVal === undefined || bVal === null || bVal === "";
        const isRemoved = aVal === undefined || aVal === null || aVal === "";
        const isArray = Array.isArray(aVal) || Array.isArray(bVal);

        return (
          <div key={key} className="rounded-lg border border-border p-2.5 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground capitalize">{key.replace(/_/g, " ")}</span>
              {isNew && <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Added</Badge>}
              {isRemoved && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">Removed</Badge>}
              {!isNew && !isRemoved && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Changed</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-red-50/50 rounded p-1.5 text-xs">
                <span className="text-muted-foreground">Before:</span>
                <div className="text-foreground mt-0.5 break-all">
                  {isArray ? `${Array.isArray(bVal) ? bVal.length : 0} items` : String(bVal ?? "—")}
                </div>
              </div>
              <div className="bg-green-50/50 rounded p-1.5 text-xs">
                <span className="text-muted-foreground">After:</span>
                <div className="text-foreground mt-0.5 break-all">
                  {isArray ? `${Array.isArray(aVal) ? aVal.length : 0} items` : String(aVal ?? "—")}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Single suggestion card with expand/collapse
const SuggestionCard = ({ item, onApprove, onReject }: { item: EnrichmentSuggestion; onApprove: (id: string) => void; onReject: (id: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const changedFieldCount = (() => {
    if (!item.before_data || !item.after_data) return 0;
    return Object.keys(item.after_data).filter(k => 
      JSON.stringify(item.before_data![k]) !== JSON.stringify(item.after_data![k])
    ).length;
  })();

  return (
    <Card className="border border-border">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{item.project_name || "Unknown Project"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px]">{item.suggestion_type}</Badge>
            <span className="text-xs text-muted-foreground">
              {changedFieldCount} field{changedFieldCount !== 1 ? "s" : ""} changed
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        {item.status === "pending" && (
          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
            <Button size="sm" variant="outline" className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50" onClick={() => onApprove(item.id)}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50" onClick={() => onReject(item.id)}>
              <AlertCircle className="w-3 h-3 mr-1" /> Reject
            </Button>
          </div>
        )}
        {item.status === "approved" && <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>}
        {item.status === "rejected" && <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>
      {expanded && (
        <CardContent className="pt-0 pb-3 px-3 border-t border-border">
          <div className="mt-2">
            <DiffViewer before={item.before_data} after={item.after_data} />
          </div>
          {item.reviewed_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Reviewed {new Date(item.reviewed_at).toLocaleString()}
              {item.reviewed_by && ` by ${item.reviewed_by}`}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export const EnrichmentAuditPanel = () => {
  const [suggestions, setSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [jobs, setJobs] = useState<EnrichmentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState<"pending" | "approved" | "rejected">("pending");

  const fetchData = async () => {
    setLoading(true);
    const [sugRes, jobRes] = await Promise.all([
      supabase
        .from("listing_enrichment_suggestions")
        .select("*")
        .eq("status", activeQueue)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("enrichment_jobs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10),
    ]);
    setSuggestions((sugRes.data as EnrichmentSuggestion[]) || []);
    setJobs((jobRes.data as EnrichmentJob[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeQueue]);

  const handleApprove = async (id: string) => {
    await supabase.from("listing_enrichment_suggestions").update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
    } as any).eq("id", id);
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleReject = async (id: string) => {
    await supabase.from("listing_enrichment_suggestions").update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
    } as any).eq("id", id);
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const pendingCount = suggestions.length;

  return (
    <div className="space-y-4">
      {/* Queue tabs */}
      <div className="flex items-center gap-2">
        {(["pending", "approved", "rejected"] as const).map(q => (
          <Button
            key={q}
            size="sm"
            variant={activeQueue === q ? "default" : "outline"}
            className={cn(
              "capitalize text-xs",
              activeQueue === q && "bg-primary text-primary-foreground"
            )}
            onClick={() => setActiveQueue(q)}
          >
            {q === "pending" && <Clock className="w-3.5 h-3.5 mr-1" />}
            {q === "approved" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
            {q === "rejected" && <AlertCircle className="w-3.5 h-3.5 mr-1" />}
            {q}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Suggestions list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : suggestions.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">No {activeQueue} enrichment suggestions</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2">
            {suggestions.map(s => (
              <SuggestionCard key={s.id} item={s} onApprove={handleApprove} onReject={handleReject} />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Recent jobs */}
      {jobs.length > 0 && (
        <Card className="border border-border mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Recent Enrichment Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobs.slice(0, 5).map(j => (
                <div key={j.id} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-muted/30 border border-border">
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    j.status === "completed" && "bg-green-50 text-green-700",
                    j.status === "running" && "bg-blue-50 text-blue-700",
                    j.status === "failed" && "bg-red-50 text-red-700",
                  )}>
                    {j.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    {j.processed ?? 0}/{j.total_projects ?? 0} projects
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Image className="w-3 h-3" /> {j.images_added ?? 0}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="w-3 h-3" /> {j.docs_added ?? 0}
                  </span>
                  {j.errors ? (
                    <span className="text-red-600">{j.errors} errors</span>
                  ) : null}
                  <span className="ml-auto text-muted-foreground">
                    {j.started_at ? new Date(j.started_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnrichmentAuditPanel;
