import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, RefreshCw, Database, Building, MapPin, Eye, Zap, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface PendingUpdate {
  id: string;
  listing_id: string | null;
  listing_table: string;
  field_name: string;
  current_value: string | null;
  proposed_value: string;
  change_type: string;
  confidence_score: number;
  match_method: string;
  status: string;
  created_at: string;
  source?: {
    name: string;
  };
}

interface ParsedProject {
  project_name?: string;
  emirate?: string;
  status?: string;
  developer?: string;
  area?: string;
  price_from?: number;
  price_to?: number;
  bedrooms?: string;
  property_type?: string;
}

interface PendingUpdatesQueueProps {
  onRefresh?: () => void;
}

export function PendingUpdatesQueue({ onRefresh }: PendingUpdatesQueueProps) {
  const [updates, setUpdates] = useState<PendingUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStats, setMigrationStats] = useState<{ pending: number; migrated: number; total: number } | null>(null);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const stopMigrationRef = useRef(false);
  const { toast } = useToast();

  const addMigrationLog = useCallback((msg: string) => {
    setMigrationLog(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Fetch migration stats
  const fetchMigrationStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("enrich-pending-imports", {
        body: { action: "stats" },
      });
      if (!error && data) {
        setMigrationStats(data);
      }
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    fetchMigrationStats();
  }, []);

  // Start migration & enrichment
  const startMigration = async () => {
    stopMigrationRef.current = false;
    setIsMigrating(true);
    setMigrationLog([]);
    setMigrationProgress(0);
    addMigrationLog("[START] Starting migration & enrichment from Provident...");

    let totalProcessed = 0;
    let totalEnriched = 0;
    let batch = 0;

    while (!stopMigrationRef.current) {
      batch++;
      addMigrationLog(`[BATCH] Batch #${batch} starting...`);

      try {
        const { data, error } = await supabase.functions.invoke("enrich-pending-imports", {
          body: { action: "migrate", batch_size: 10 },
        });

        if (error) throw error;
        if (!data) break;

        totalProcessed += data.processed || 0;
        totalEnriched += data.enriched || 0;

        for (const r of (data.results || [])) {
          const icon = r.status === "enriched" ? "[OK]" : "[WARN]";
          addMigrationLog(`  ${icon} ${r.name}: ${r.slug_matched || "no match"} (${r.images} imgs, ${r.docs} docs)`);
        }

        addMigrationLog(`[BATCH] Batch #${batch} done: ${data.processed} processed, ${data.remaining} remaining`);

        if (data.remaining === 0 || data.processed === 0) {
          addMigrationLog("[COMPLETE] All pending updates migrated successfully.");
          break;
        }

        const total = migrationStats?.total || (totalProcessed + data.remaining);
        setMigrationProgress(Math.round((totalProcessed / total) * 100));

        // Brief pause
        await new Promise(r => setTimeout(r, 2000));
      } catch (err: any) {
        addMigrationLog(`[ERROR] Batch #${batch} error: ${err.message}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    if (stopMigrationRef.current) {
      addMigrationLog("[PAUSED] Migration paused.");
    }

    setIsMigrating(false);
    setMigrationProgress(100);
    fetchMigrationStats();
    fetchPendingUpdates();
    onRefresh?.();
    toast({ title: "Migration Complete", description: `${totalProcessed} processed, ${totalEnriched} enriched` });
  };

  const fetchPendingUpdates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("listing_pending_updates")
        .select(`
          *,
          source:external_data_sources(name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error fetching pending updates:", error);
      toast({
        title: "Error",
        description: "Failed to load pending updates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUpdates();
  }, []);

  const parseProposedValue = (value: string): ParsedProject => {
    try {
      return JSON.parse(value);
    } catch {
      return { project_name: value };
    }
  };

  const handleApprove = async (update: PendingUpdate) => {
    setProcessingIds(prev => new Set(prev).add(update.id));
    try {
      if (update.change_type === "create" && update.field_name === "new_project") {
        const parsed = parseProposedValue(update.proposed_value);
        const projectName = parsed.project_name || "Unnamed Project";
        const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        const { error: insertError } = await supabase
          .from("projects")
          .insert({
            name: projectName,
            slug: slug,
            emirate: parsed.emirate || "Dubai",
            status: parsed.status || "Off-Plan",
            is_published: false,
            source: "provident_discovery",
          });

        if (insertError) throw insertError;
      } else {
        // Field update logic
        const updateData: Record<string, any> = {};
        if (update.field_name === "amenities_additions" && update.listing_table === "projects") {
          const { data: listing } = await supabase
            .from("projects")
            .select("amenities")
            .eq("id", update.listing_id!)
            .single();
          const existingAmenities = (listing as any)?.amenities || [];
          const newAmenities = JSON.parse(update.proposed_value);
          updateData.amenities = [...existingAmenities, ...newAmenities];
        } else {
          updateData[update.field_name] = update.proposed_value;
        }

        if (update.listing_table === "projects") {
          const { error } = await supabase.from("projects").update(updateData).eq("id", update.listing_id!);
          if (error) throw error;
        }
      }

      const { error: statusError } = await supabase
        .from("listing_pending_updates")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", update.id);

      if (statusError) throw statusError;

      setUpdates(prev => prev.filter(u => u.id !== update.id));
      toast({ title: "Approved", description: `${parseProposedValue(update.proposed_value).project_name || update.field_name} approved` });
      onRefresh?.();
    } catch (error) {
      console.error("Error approving:", error);
      toast({ title: "Error", description: "Failed to approve", variant: "destructive" });
    } finally {
      setProcessingIds(prev => { const n = new Set(prev); n.delete(update.id); return n; });
    }
  };

  const handleReject = async (update: PendingUpdate) => {
    setProcessingIds(prev => new Set(prev).add(update.id));
    try {
      const { error } = await supabase
        .from("listing_pending_updates")
        .update({ status: "rejected", reviewed_at: new Date().toISOString(), review_notes: "Rejected by admin" })
        .eq("id", update.id);
      if (error) throw error;

      setUpdates(prev => prev.filter(u => u.id !== update.id));
      toast({ title: "Rejected", description: "Project has been rejected" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject", variant: "destructive" });
    } finally {
      setProcessingIds(prev => { const n = new Set(prev); n.delete(update.id); return n; });
    }
  };

  const handleApproveAll = async () => {
    setBatchProcessing(true);
    let approved = 0;
    for (const update of updates) {
      try {
        await handleApprove(update);
        approved++;
      } catch { /* continue */ }
    }
    setBatchProcessing(false);
    toast({ title: "Batch Complete", description: `${approved} projects approved` });
    fetchPendingUpdates();
  };

  const totalPending = updates.length;

  // Separate new project discoveries from field updates
  const newProjects = updates.filter(u => u.change_type === "create" && u.field_name === "new_project");
  const fieldUpdates = updates.filter(u => !(u.change_type === "create" && u.field_name === "new_project"));

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Database className="h-5 w-5 text-gold" />
            Pending Projects & Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gold" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Database className="h-5 w-5 text-gold" />
          Pending Projects & Updates
          {totalPending > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-sm">{totalPending}</Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {newProjects.length > 5 && (
            <Button
              size="sm"
              onClick={handleApproveAll}
              disabled={batchProcessing}
              className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border border-gold/40 hover:border-gold/60"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve All ({newProjects.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchPendingUpdates} className="border-gold/30 hover:bg-gold/10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
         {totalPending === 0 && !migrationStats?.pending ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mb-4 text-emerald-500" />
            <p className="text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-sm">No pending projects or updates require your review</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ===== MIGRATION PANEL ===== */}
            {(migrationStats?.pending ?? 0) > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-amber-900 font-bold text-base flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-600" />
                      Migrate & Enrich Legacy Queue
                    </h3>
                    <p className="text-amber-700 text-sm mt-1">
                      {migrationStats.pending} unenriched project shells need migration to the approval queue with full Provident data extraction.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isMigrating ? (
                      <Button
                        onClick={startMigration}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Migrate & Enrich All
                      </Button>
                    ) : (
                      <Button
                        onClick={() => { stopMigrationRef.current = true; }}
                        variant="destructive"
                      >
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Stop
                      </Button>
                    )}
                  </div>
                </div>
                {migrationProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-amber-700">
                      <span>Migration Progress</span>
                      <span>{migrationProgress}%</span>
                    </div>
                    <Progress value={migrationProgress} className="h-2" />
                  </div>
                )}
                {migrationStats.migrated > 0 && (
                  <p className="text-xs text-amber-600">{migrationStats.migrated} already migrated</p>
                )}
              </div>
            )}

            {/* Migration Log */}
            {migrationLog.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800">
                  <span className="text-zinc-300 text-xs font-semibold">Migration Log</span>
                </div>
                <div className="max-h-48 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
                  {migrationLog.map((line, i) => (
                    <div key={i} className={`${
                      line.includes("[ERROR]") ? "text-red-400" :
                      line.includes("[OK]") || line.includes("[COMPLETE]") ? "text-emerald-400" :
                      line.includes("[START]") ? "text-yellow-300" :
                      line.includes("[WARN]") ? "text-amber-400" :
                      "text-zinc-400"
                    }`}>{line}</div>
                  ))}
                </div>
              </div>
            )}

            {/* New Project Discoveries */}
            {newProjects.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4 text-gold" />
                  New Project Discoveries
                  <Badge className="bg-gold/20 text-gold border border-gold/30 text-xs">{newProjects.length}</Badge>
                </h3>
                <ScrollArea className="h-[600px] pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {newProjects.map((update) => {
                      const parsed = parseProposedValue(update.proposed_value);
                      const isProcessing = processingIds.has(update.id);

                      return (
                        <div
                          key={update.id}
                          className="border-2 border-gold/30 rounded-xl bg-white overflow-hidden shadow-[0_4px_20px_rgba(200,167,102,0.15)] hover:shadow-[0_12px_40px_rgba(200,167,102,0.3)] hover:scale-[1.01] transition-all duration-300"
                        >
                          {/* Image / Placeholder - full card style */}
                          <div className="relative aspect-[4/3] bg-gradient-to-br from-muted via-muted/80 to-muted/60">
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                              <Building className="h-12 w-12 text-muted-foreground/30" />
                              <span className="text-xs text-amber-600 font-medium">Needs Migration & Enrichment</span>
                            </div>
                            {/* Status badge overlay */}
                            <div className="absolute top-3 right-3">
                              <Badge className={`text-xs px-2.5 py-1 ${
                                parsed.status === "Off-Plan"
                                  ? "bg-blue-600 text-white"
                                  : parsed.status === "Ready"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-foreground/80 text-background"
                              }`}>
                                {parsed.status || "Off-Plan"}
                              </Badge>
                            </div>
                            {parsed.property_type && (
                              <div className="absolute top-3 left-3">
                                <div className="rounded bg-foreground/80 text-background px-2.5 py-1 text-[11px] font-medium backdrop-blur">
                                  {parsed.property_type}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card Content - matches portal card style */}
                          <div className="p-4 space-y-3">
                            <h4 className="font-semibold text-foreground text-base line-clamp-2 min-h-[44px]">
                              {parsed.project_name || "Unnamed Project"}
                            </h4>

                            {parsed.developer && (
                              <p className="text-sm text-gold truncate">by {parsed.developer}</p>
                            )}

                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                {parsed.area || parsed.emirate || "Dubai"}
                              </span>
                              {parsed.bedrooms && (
                                <span className="flex items-center gap-1 flex-shrink-0">
                                  {parsed.bedrooms}
                                </span>
                              )}
                            </div>

                            {/* Price */}
                            <div className="text-sm">
                              <span className="text-muted-foreground">From </span>
                              {parsed.price_from ? (
                                <span className="font-semibold text-foreground">
                                  AED {parsed.price_from.toLocaleString()}
                                </span>
                              ) : (
                                <span className="font-semibold text-gold">POA</span>
                              )}
                            </div>

                            {/* Source & Date */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                              <span>{update.source?.name || "External Source"}</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(update.created_at), "MMM d, yyyy")}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(update)}
                                disabled={isProcessing}
                                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 h-9 text-xs"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(update)}
                                disabled={isProcessing}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Field Updates (if any) */}
            {fieldUpdates.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 mb-3">
                  Field Updates
                  <Badge className="ml-2 bg-zinc-100 text-zinc-600 text-xs">{fieldUpdates.length}</Badge>
                </h3>
                <ScrollArea className="h-[300px] pr-2">
                  <div className="space-y-3">
                    {fieldUpdates.map((update) => (
                      <div key={update.id} className="border border-gold/20 rounded-lg p-4 bg-white/50">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-zinc-900 text-sm">
                            {update.field_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <Clock className="h-3 w-3" />
                            {format(new Date(update.created_at), "MMM d, h:mm a")}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-[10px] text-zinc-500 mb-1">Current</p>
                            <div className="bg-white border border-zinc-200 rounded p-2 text-xs text-zinc-900">
                              {update.current_value || <span className="text-zinc-400 italic">Empty</span>}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 mb-1">Proposed</p>
                            <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs text-zinc-900">
                              {update.proposed_value}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleReject(update)} disabled={processingIds.has(update.id)} className="border-red-200 text-red-600 hover:bg-red-50 h-7 text-xs">
                            <X className="h-3 w-3 mr-1" /> Reject
                          </Button>
                          <Button size="sm" onClick={() => handleApprove(update)} disabled={processingIds.has(update.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs">
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
