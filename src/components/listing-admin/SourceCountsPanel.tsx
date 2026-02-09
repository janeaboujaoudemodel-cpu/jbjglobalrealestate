import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, RefreshCw, Database, CheckCircle, Clock, XCircle } from "lucide-react";
import { useSyncJobs } from "@/hooks/useSyncJobs";
import { useNavigate } from "react-router-dom";

interface SourceCountsPanelProps {
  reellyApiTotal?: number | null;
  providentExpected?: number;
}

/**
 * SEPARATED COUNTS PANEL
 * 
 * Shows Reelly vs Provident counts SEPARATELY - never merged or averaged.
 * Each source has its own:
 * - Expected count (from API)
 * - Total count (in queue)
 * - Approved count
 * - Pending count
 */
export function SourceCountsPanel({ reellyApiTotal, providentExpected = 1336 }: SourceCountsPanelProps) {
  const { liveCounts, refreshCounts } = useSyncJobs();
  const navigate = useNavigate();

  const handleViewProjects = (source: 'reelly' | 'provident', status: 'pending' | 'approved') => {
    // Navigate to approval queue with source filter
    navigate(`/listing-admin?view=data-ops&syncTab=approvals&source=${source}&status=${status}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* REELLY SOURCE */}
      <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Globe className="w-5 h-5" />
            Reelly API Source
            <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300">
              Primary
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <div 
              className="text-center p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors"
              title="Expected from Reelly API"
            >
              <p className="text-xs text-blue-600 mb-1 font-medium">Expected</p>
              <p className="text-xl font-bold text-blue-800">
                {reellyApiTotal?.toLocaleString() || liveCounts?.reelly_total_api?.toLocaleString() || "—"}
              </p>
            </div>
            
            <div 
              className="text-center p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => handleViewProjects('reelly', 'pending')}
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
              className="text-center p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => handleViewProjects('reelly', 'approved')}
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
            
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 mb-1 font-medium">Total</p>
              <p className="text-xl font-bold text-blue-800">
                {((liveCounts?.reelly_pending_queue || 0) + (liveCounts?.reelly_approved || 0)).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Sync Status */}
          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>Data from Reelly REST API</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshCounts()}
              className="h-6 text-xs text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PROVIDENT SOURCE */}
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Database className="w-5 h-5" />
            Provident Scrape Source
            <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-700 border-amber-300">
              Secondary
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scrape Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <div 
              className="text-center p-3 bg-white rounded-lg border border-amber-200"
              title="Expected from Provident website"
            >
              <p className="text-xs text-amber-600 mb-1 font-medium">Expected</p>
              <p className="text-xl font-bold text-amber-800">
                {providentExpected.toLocaleString()}
              </p>
            </div>
            
            <div 
              className="text-center p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:border-amber-400 transition-colors"
              onClick={() => handleViewProjects('provident', 'pending')}
              title="Click to view pending Provident projects"
            >
              <p className="text-xs text-amber-600 mb-1 font-medium flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </p>
              <p className="text-xl font-bold text-amber-700">
                {liveCounts?.provident_pending_queue?.toLocaleString() || "0"}
              </p>
            </div>
            
            <div 
              className="text-center p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:border-amber-400 transition-colors"
              onClick={() => handleViewProjects('provident', 'approved')}
              title="Click to view approved Provident projects"
            >
              <p className="text-xs text-emerald-600 mb-1 font-medium flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Approved
              </p>
              <p className="text-xl font-bold text-emerald-700">
                {liveCounts?.provident_approved?.toLocaleString() || "0"}
              </p>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
              <p className="text-xs text-amber-600 mb-1 font-medium">Total</p>
              <p className="text-xl font-bold text-amber-800">
                {((liveCounts?.provident_pending_queue || 0) + (liveCounts?.provident_approved || 0)).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Scrape Status */}
          <div className="flex items-center justify-between text-xs text-amber-600">
            <span>Data scraped from Provident website</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshCounts()}
              className="h-6 text-xs text-amber-600 hover:text-amber-800"
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
