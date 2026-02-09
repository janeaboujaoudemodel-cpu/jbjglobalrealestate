import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, RefreshCw, Database, CheckCircle, Clock, XCircle } from "lucide-react";
import { useSyncJobs } from "@/hooks/useSyncJobs";
import { useNavigate } from "react-router-dom";

interface SourceCountsPanelProps {
  reellyApiTotal?: number | null;
}

/**
 * REELLY-ONLY COUNTS PANEL
 * 
 * Shows ONLY Reelly API source - Provident extraction is disabled per user mandate.
 * Displays:
 * - Expected count (from API)
 * - Total count (in queue)
 * - Approved count
 * - Pending count
 */
export function SourceCountsPanel({ reellyApiTotal }: SourceCountsPanelProps) {
  const { liveCounts, refreshCounts } = useSyncJobs();
  const navigate = useNavigate();

  const handleViewProjects = (status: 'pending' | 'approved') => {
    // Navigate to approval queue with Reelly source filter
    navigate(`/listing-admin?view=data-ops&syncTab=approvals&source=reelly&status=${status}`);
  };

  return (
    <div className="space-y-4">
      {/* Reelly-Only Mode Banner */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-300/50 rounded-lg">
        <CheckCircle className="w-5 h-5 text-emerald-600" />
        <span className="text-emerald-800 font-medium text-sm">Reelly-Only Mode Active</span>
        <span className="text-emerald-600 text-xs">All project data sourced exclusively from Reelly API</span>
      </div>

      {/* REELLY SOURCE - Full Width */}
      <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-zinc-800">
            <Globe className="w-5 h-5 text-gold" />
            Reelly API Source
            <Badge variant="outline" className="ml-auto bg-gold/10 text-gold border-gold/40">
              Primary & Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <div 
              className="text-center p-3 bg-white rounded-lg border border-gold/30 cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors"
              onClick={() => navigate('/listing-admin?view=data-ops&syncTab=approvals&source=reelly')}
              title="Click to view all Reelly projects"
            >
              <p className="text-xs text-zinc-600 mb-1 font-medium">Expected</p>
              <p className="text-xl font-bold text-zinc-800">
                {reellyApiTotal?.toLocaleString() || liveCounts?.reelly_total_api?.toLocaleString() || "—"}
              </p>
            </div>
            
            <div 
              className="text-center p-3 bg-white rounded-lg border border-gold/30 cursor-pointer hover:border-gold hover:bg-amber-50/50 transition-colors"
              onClick={() => handleViewProjects('pending')}
              title="Click to view pending Reelly projects"
            >
              <p className="text-xs text-amber-600 mb-1 font-medium flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </p>
              <p className="text-xl font-bold text-amber-700">
                {liveCounts?.reelly_pending_queue?.toLocaleString() || "0"}
              </p>
            </div>
            
            <div 
              className="text-center p-3 bg-white rounded-lg border border-gold/30 cursor-pointer hover:border-gold hover:bg-emerald-50/50 transition-colors"
              onClick={() => handleViewProjects('approved')}
              title="Click to view approved Reelly projects"
            >
              <p className="text-xs text-emerald-600 mb-1 font-medium flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Approved
              </p>
              <p className="text-xl font-bold text-emerald-700">
                {liveCounts?.reelly_approved?.toLocaleString() || "0"}
              </p>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border border-gold/30">
              <p className="text-xs text-zinc-600 mb-1 font-medium">Total</p>
              <p className="text-xl font-bold text-zinc-800">
                {((liveCounts?.reelly_pending_queue || 0) + (liveCounts?.reelly_approved || 0)).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Sync Status */}
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Data from Reelly REST API • api-reelly.up.railway.app</span>
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
        </CardContent>
      </Card>
    </div>
  );
}

export default SourceCountsPanel;
