import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, RefreshCw, Database, CheckCircle, Clock, Layers, AlertTriangle } from "lucide-react";
import { useSyncJobs } from "@/hooks/useSyncJobs";
import { useNavigate } from "react-router-dom";

interface SourceCountsPanelProps {
  reellyApiTotal?: number | null;
  onSourceChange?: (source: string) => void;
  activeSource?: string;
}

type SourceSelection = "none" | "source-a" | "source-b";

export function SourceCountsPanel({ reellyApiTotal, onSourceChange, activeSource }: SourceCountsPanelProps) {
  const { liveCounts, refreshCounts } = useSyncJobs();
  const navigate = useNavigate();
  // Default to Provident Portal (left card) selected
  const [selectedSource, setSelectedSource] = useState<SourceSelection>("source-b");

  const handleSourceSelect = (source: SourceSelection) => {
    setSelectedSource(source);
    if (source === "source-b") onSourceChange?.("provident");
    else if (source === "source-a") onSourceChange?.("reelly");
  };

  const handleViewProjects = (status: 'pending' | 'approved', source: string) => {
    navigate(`/listing-admin?view=data-ops&syncTab=approvals&source=${source}&status=${status}`);
  };

  return (
    <div className="space-y-4">
      {/* Source Selector — Source Portal (left/primary), Realporter API (right) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Source Portal (Primary — left side) */}
        <Card
          className={`cursor-pointer transition-all border-2 ${
            selectedSource === "source-b"
              ? "border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-lg"
              : "border-border hover:border-gold/40 bg-card"
          }`}
          onClick={() => setSelectedSource(selectedSource === "source-b" ? "none" : "source-b")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-foreground">
              <Database className="w-4 h-4 text-gold" />
              Provident Portal
              {selectedSource === "source-b" && (
                <Badge variant="outline" className="ml-auto bg-gold/10 text-gold border-gold/40 text-[10px]">
                  Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-background/60 rounded border border-border">
                <p className="text-[10px] text-muted-foreground font-medium">Enriched</p>
                <p className="text-base font-bold text-foreground">—</p>
              </div>
              <div
                className="text-center p-2 bg-background/60 rounded border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleViewProjects('pending', 'provident'); }}
              >
                <p className="text-[10px] text-amber-600 font-medium flex items-center justify-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> Pending
                </p>
                <p className="text-base font-bold text-amber-700">0</p>
              </div>
              <div
                className="text-center p-2 bg-background/60 rounded border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleViewProjects('approved', 'provident'); }}
              >
                <p className="text-[10px] text-emerald-600 font-medium flex items-center justify-center gap-0.5">
                  <CheckCircle className="w-2.5 h-2.5" /> Approved
                </p>
                <p className="text-base font-bold text-emerald-700">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Realporter API (right side — minimized/disabled) */}
        <Card
          className={`cursor-pointer transition-all border-2 ${
            selectedSource === "source-a"
              ? "border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-lg"
              : "border-border hover:border-gold/40 bg-card opacity-75"
          }`}
          onClick={() => setSelectedSource(selectedSource === "source-a" ? "none" : "source-a")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-foreground">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Reelly Portal
              <Badge variant="outline" className="ml-auto border-muted-foreground/30 text-muted-foreground text-[10px] flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Disabled
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-background/60 rounded border border-border">
                <p className="text-[10px] text-muted-foreground font-medium">Expected</p>
                <p className="text-base font-bold text-foreground">
                  {reellyApiTotal?.toLocaleString() || liveCounts?.reelly_total_api?.toLocaleString() || "—"}
                </p>
              </div>
              <div
                className="text-center p-2 bg-background/60 rounded border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleViewProjects('pending', 'reelly'); }}
              >
                <p className="text-[10px] text-amber-600 font-medium flex items-center justify-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> Pending
                </p>
                <p className="text-base font-bold text-amber-700">
                  {liveCounts?.reelly_pending_queue?.toLocaleString() || "0"}
                </p>
              </div>
              <div
                className="text-center p-2 bg-background/60 rounded border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleViewProjects('approved', 'reelly'); }}
              >
                <p className="text-[10px] text-emerald-600 font-medium flex items-center justify-center gap-0.5">
                  <CheckCircle className="w-2.5 h-2.5" /> Approved
                </p>
                <p className="text-base font-bold text-emerald-700">
                  {liveCounts?.reelly_approved?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          Select a source above to view detailed sync data
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refreshCounts()}
          className="h-6 text-xs text-gold hover:text-gold/80 hover:bg-gold/10"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

export default SourceCountsPanel;
