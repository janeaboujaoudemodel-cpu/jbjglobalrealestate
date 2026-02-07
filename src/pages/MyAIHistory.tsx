import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Filter, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * My AI History Page
 * 
 * DATA OWNERSHIP POLICY:
 * - Users see ONLY their own AI outputs (RLS enforced: user_id = auth.uid())
 * - NO PII displayed - only hashed lead_ref, budget, timeline, etc.
 * - Owner has read-only visibility across all users for audit
 * 
 * Query: ai_job_master WHERE user_id = auth.uid() ORDER BY created_at DESC
 */

interface AIJob {
  id: string;
  tool_name: string;
  status: string | null;
  created_at: string | null;
  completed_at: string | null;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown> | null;
  processing_time_ms: number | null;
  intelligence_features: Record<string, unknown> | null;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  "ai-lead-qualification": "Lead Qualification",
  "ai-property-analyzer": "Property Analyzer",
  "ai-price-predictor": "Price Predictor",
  "ai-neighborhood-insights": "Neighborhood Insights",
  "ai-market-analyzer": "Market Analyzer",
  "ai-mortgage-advisor": "Mortgage Advisor",
  "ai-travel-concierge": "Travel Concierge",
  "ai-executive-assistant": "Executive Assistant",
  "ai-chat-support": "Chat Support",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Completed", icon: <CheckCircle2 className="w-3 h-3" />, variant: "default" },
  pending: { label: "Pending", icon: <Loader2 className="w-3 h-3 animate-spin" />, variant: "secondary" },
  failed: { label: "Failed", icon: <XCircle className="w-3 h-3" />, variant: "destructive" },
  processing: { label: "Processing", icon: <Loader2 className="w-3 h-3 animate-spin" />, variant: "outline" },
};

/**
 * Sanitize display of input_payload - ensure NO PII is shown
 * Only display: lead_ref (hash), budget, preferredAreas, timeline, source
 */
function getSafeInputDisplay(input: Record<string, unknown>): Record<string, string> {
  const safeFields = ["lead_ref", "budget", "preferredAreas", "timeline", "source", "propertyType", "location"];
  const result: Record<string, string> = {};
  
  for (const key of safeFields) {
    if (input[key] !== undefined && input[key] !== null) {
      const value = input[key];
      if (key === "lead_ref" && typeof value === "string") {
        // Show truncated hash for reference
        result[key] = value.substring(0, 12) + "...";
      } else {
        result[key] = String(value);
      }
    }
  }
  
  return result;
}

/**
 * Get output preview - limited fields for list display
 */
function getOutputPreview(output: Record<string, unknown> | null): string {
  if (!output) return "No output";
  
  const previewFields = ["qualificationScore", "classification", "temperature", "prediction", "analysis"];
  const parts: string[] = [];
  
  for (const key of previewFields) {
    if (output[key] !== undefined && output[key] !== null) {
      if (key === "qualificationScore") {
        parts.push(`Score: ${output[key]}`);
      } else if (key === "classification") {
        parts.push(`Type: ${output[key]}`);
      } else if (key === "temperature") {
        parts.push(`Temp: ${output[key]}`);
      }
    }
  }
  
  return parts.length > 0 ? parts.join(" | ") : "View details";
}

export default function MyAIHistory() {
  const { user, loading: authLoading } = useAuth();
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // RLS-enforced query: user sees ONLY their own data
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ["ai-job-history", user?.id, toolFilter, dateFrom, dateTo],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("ai_job_master")
        .select("id, tool_name, status, created_at, completed_at, input_payload, output_payload, processing_time_ms, intelligence_features")
        .order("created_at", { ascending: false })
        .limit(100);

      // Apply filters
      if (toolFilter !== "all") {
        query = query.eq("tool_name", toolFilter);
      }
      if (dateFrom) {
        query = query.gte("created_at", `${dateFrom}T00:00:00Z`);
      }
      if (dateTo) {
        query = query.lte("created_at", `${dateTo}T23:59:59Z`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as AIJob[];
    },
    enabled: !!user?.id,
  });

  const location = useLocation();

  // Redirect to auth if not logged in (preserving path + query)
  if (!authLoading && !user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  // Get unique tool names for filter dropdown
  const uniqueTools = [...new Set(jobs?.map(j => j.tool_name) || [])];

  return (
    <>
      <SEOHead
        title="My AI History | JBJ Global Real Estate"
        description="View your personal AI tool usage history. All data is private and owned by you."
        canonicalPath="/my-ai-history"
      />
      
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My AI History</h1>
            <p className="text-muted-foreground">
              Your personal AI tool usage. Data is private and owned by you.
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="w-full sm:w-auto">
                  <label className="text-sm text-muted-foreground mb-1 block">Tool</label>
                  <Select value={toolFilter} onValueChange={setToolFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All tools" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tools</SelectItem>
                      {uniqueTools.map(tool => (
                        <SelectItem key={tool} value={tool}>
                          {TOOL_DISPLAY_NAMES[tool] || tool}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-auto">
                  <label className="text-sm text-muted-foreground mb-1 block">From Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="pl-10 w-full sm:w-[160px]"
                    />
                  </div>
                </div>
                
                <div className="w-full sm:w-auto">
                  <label className="text-sm text-muted-foreground mb-1 block">To Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="pl-10 w-full sm:w-[160px]"
                    />
                  </div>
                </div>

                <div className="w-full sm:w-auto flex items-end">
                  <Button variant="outline" onClick={() => { setToolFilter("all"); setDateFrom(""); setDateTo(""); }}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {(authLoading || isLoading) && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-6 text-center">
                <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium">Failed to load history</p>
                <p className="text-muted-foreground text-sm mt-1">{(error as Error).message}</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4">
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && jobs?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No AI History Yet</h3>
                <p className="text-muted-foreground">
                  Your AI tool usage will appear here after you use any of our AI-powered tools.
                </p>
                <Button variant="default" className="mt-6" asChild>
                  <a href="/ai-hub">Explore AI Tools</a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Job List */}
          {!isLoading && !error && jobs && jobs.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Showing {jobs.length} record{jobs.length !== 1 ? "s" : ""}
              </p>
              
              {jobs.map((job) => {
                const statusConfig = STATUS_CONFIG[job.status || "pending"] || STATUS_CONFIG.pending;
                const safeInput = getSafeInputDisplay(job.input_payload);
                const outputPreview = getOutputPreview(job.output_payload);
                
                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Tool Name & Status */}
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">
                              {TOOL_DISPLAY_NAMES[job.tool_name] || job.tool_name}
                            </h3>
                            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                          </div>
                          
                          {/* Timestamp */}
                          <p className="text-sm text-muted-foreground mb-3">
                            {job.created_at ? format(new Date(job.created_at), "MMM d, yyyy 'at' h:mm a") : "Unknown date"}
                            {job.processing_time_ms && (
                              <span className="ml-2 text-xs">
                                ({job.processing_time_ms}ms)
                              </span>
                            )}
                          </p>
                          
                          {/* Safe Input Display (NO PII) */}
                          {Object.keys(safeInput).length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Input</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(safeInput).map(([key, value]) => (
                                  <span key={key} className="text-xs bg-muted px-2 py-1 rounded">
                                    <span className="text-muted-foreground">{key}:</span> {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Output Preview */}
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Output:</span> {outputPreview}
                          </p>
                        </div>
                        
                        {/* Intelligence Features Badge */}
                        {job.intelligence_features && Object.keys(job.intelligence_features).length > 0 && (
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {Object.keys(job.intelligence_features).length} features
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
