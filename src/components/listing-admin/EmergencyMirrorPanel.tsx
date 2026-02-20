import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, Play, RefreshCw, Loader2, Database, Image, BedDouble, DollarSign } from "lucide-react";

interface MirrorStatus {
  total_reelly_projects: number;
  needs_bedrooms: number;
  needs_price: number;
  needs_cover: number;
  estimated_batches_needed: number;
}

export const EmergencyMirrorPanel = () => {
  const [status, setStatus] = useState<MirrorStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const checkStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("reelly-emergency-mirror", {
        body: { mode: "status" },
      });
      if (error) throw error;
      setStatus(data);
      toast.success("Status fetched successfully");
    } catch (e: any) {
      toast.error("Failed to fetch status: " + e.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const startMirror = async () => {
    if (!confirm("This will fire batches to extract ALL missing Reelly data and mirror all images to storage. This is an intensive operation. Continue?")) return;
    
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("reelly-emergency-mirror", {
        body: { mode: "start" },
      });
      if (error) throw error;
      setLastResult(data);
      toast.success(`Emergency mirror started! ${data.projects_queued} projects queued in ${data.batches_fired} batches.`);
      // Refresh status after starting
      setTimeout(checkStatus, 3000);
    } catch (e: any) {
      toast.error("Failed to start emergency mirror: " + e.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-200 font-semibold text-sm">Emergency Data Mirror — Use Before API Key Expires</p>
          <p className="text-red-300/70 text-xs mt-1">
            This tool extracts ALL missing data from the Reelly API (bedrooms, prices, images, documents, amenities) and mirrors everything to local storage. 
            Run this immediately to ensure all project data is preserved before the API key is disconnected.
          </p>
        </div>
      </div>

      {/* Status Check */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            Current Data Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkStatus} disabled={isCheckingStatus} variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800">
            {isCheckingStatus ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Check Current Status
          </Button>

          {status && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-zinc-800 rounded-lg p-4 text-center">
                <p className="text-zinc-400 text-xs mb-1">Total Reelly Projects</p>
                <p className="text-white text-2xl font-bold">{status.total_reelly_projects?.toLocaleString()}</p>
              </div>
              <div className={`rounded-lg p-4 text-center ${status.needs_bedrooms > 0 ? 'bg-red-950/60 border border-red-500/30' : 'bg-green-950/60 border border-green-500/30'}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BedDouble className="w-3 h-3 text-zinc-400" />
                  <p className="text-zinc-400 text-xs">Missing Bedrooms</p>
                </div>
                <p className={`text-2xl font-bold ${status.needs_bedrooms > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {status.needs_bedrooms?.toLocaleString()}
                </p>
              </div>
              <div className={`rounded-lg p-4 text-center ${status.needs_price > 0 ? 'bg-red-950/60 border border-red-500/30' : 'bg-green-950/60 border border-green-500/30'}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-3 h-3 text-zinc-400" />
                  <p className="text-zinc-400 text-xs">Missing Price</p>
                </div>
                <p className={`text-2xl font-bold ${status.needs_price > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {status.needs_price?.toLocaleString()}
                </p>
              </div>
              <div className={`rounded-lg p-4 text-center ${status.needs_cover > 0 ? 'bg-amber-950/60 border border-amber-500/30' : 'bg-green-950/60 border border-green-500/30'}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Image className="w-3 h-3 text-zinc-400" />
                  <p className="text-zinc-400 text-xs">Missing Cover</p>
                </div>
                <p className={`text-2xl font-bold ${status.needs_cover > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                  {status.needs_cover?.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {status && status.needs_bedrooms > 0 && (
            <p className="text-zinc-400 text-sm">
              Estimated <span className="text-white font-semibold">{status.estimated_batches_needed}</span> orchestrator calls needed 
              ({Math.ceil(status.estimated_batches_needed / 10)} runs of this tool) to fully enrich all projects.
            </p>
          )}

          {status && status.needs_bedrooms === 0 && status.needs_price === 0 && status.needs_cover === 0 && (
            <Badge className="bg-green-900 text-green-200 border-green-600">✓ All projects fully enriched!</Badge>
          )}
        </CardContent>
      </Card>

      {/* Start Mirror */}
      <Card className="bg-zinc-900 border-red-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Play className="w-4 h-4 text-red-400" />
            Start Emergency Mirror
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-400 text-sm">
            This will fire up to <strong className="text-white">100 projects</strong> per run with full image mirroring enabled. 
            Run this multiple times to process all projects. Each run takes ~10 minutes to complete in the background.
          </p>
          
          <Button 
            onClick={startMirror} 
            disabled={isRunning}
            className="bg-red-700 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/20"
          >
            {isRunning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting Mirror...</>
            ) : (
              <><AlertTriangle className="w-4 h-4 mr-2" /> Start Emergency Mirror (100 projects)</>
            )}
          </Button>

          {lastResult && (
            <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
              <p className="text-green-400 text-sm font-semibold">✓ Mirror Dispatched Successfully</p>
              <div className="text-zinc-400 text-xs space-y-1">
                <p>Projects queued: <span className="text-white">{lastResult.projects_queued}</span></p>
                <p>Batches fired: <span className="text-white">{lastResult.batches_fired}</span></p>
                {lastResult.status_before && (
                  <>
                    <p>Before — Missing bedrooms: <span className="text-red-300">{lastResult.status_before.needs_bedrooms}</span></p>
                    <p>Before — Missing prices: <span className="text-red-300">{lastResult.status_before.needs_price}</span></p>
                  </>
                )}
              </div>
              <p className="text-zinc-500 text-xs">Batches are running in background. Check status again in ~5 minutes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyMirrorPanel;
