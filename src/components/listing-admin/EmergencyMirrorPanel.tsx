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
      setTimeout(checkStatus, 3000);
    } catch (e: any) {
      toast.error("Failed to start emergency mirror: " + e.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner — Champagne */}
      <div className="bg-amber-50/80 border-2 border-gold/40 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-black font-semibold text-sm">Emergency Data Mirror — Use Before API Key Expires</p>
          <p className="text-zinc-600 text-xs mt-1">
            This tool extracts ALL missing data from the Reelly API (bedrooms, prices, images, documents, amenities) and mirrors everything to local storage. 
            Run this immediately to ensure all project data is preserved before the API key is disconnected.
          </p>
        </div>
      </div>

      {/* Status Check */}
      <Card className="bg-white border-2 border-gold/30 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-black text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-gold" />
            Current Data Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkStatus} disabled={isCheckingStatus} className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 text-black hover:border-gold">
            {isCheckingStatus ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Check Current Status
          </Button>

          {status && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20 rounded-lg p-4 text-center">
                <p className="text-zinc-500 text-xs mb-1">Total Reelly Projects</p>
                <p className="text-black text-2xl font-bold">{status.total_reelly_projects?.toLocaleString()}</p>
              </div>
              <div className={`rounded-lg p-4 text-center border ${status.needs_bedrooms > 0 ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BedDouble className="w-3 h-3 text-zinc-500" />
                  <p className="text-zinc-500 text-xs">Missing Bedrooms</p>
                </div>
                <p className={`text-2xl font-bold ${status.needs_bedrooms > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {status.needs_bedrooms?.toLocaleString()}
                </p>
              </div>
              <div className={`rounded-lg p-4 text-center border ${status.needs_price > 0 ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-3 h-3 text-zinc-500" />
                  <p className="text-zinc-500 text-xs">Missing Price</p>
                </div>
                <p className={`text-2xl font-bold ${status.needs_price > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {status.needs_price?.toLocaleString()}
                </p>
              </div>
              <div className={`rounded-lg p-4 text-center border ${status.needs_cover > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Image className="w-3 h-3 text-zinc-500" />
                  <p className="text-zinc-500 text-xs">Missing Cover</p>
                </div>
                <p className={`text-2xl font-bold ${status.needs_cover > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {status.needs_cover?.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {status && status.needs_bedrooms > 0 && (
            <p className="text-zinc-600 text-sm">
              Estimated <span className="text-black font-semibold">{status.estimated_batches_needed}</span> orchestrator calls needed 
              ({Math.ceil(status.estimated_batches_needed / 10)} runs of this tool) to fully enrich all projects.
            </p>
          )}

          {status && status.needs_bedrooms === 0 && status.needs_price === 0 && status.needs_cover === 0 && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300">All projects fully enriched</Badge>
          )}
        </CardContent>
      </Card>

      {/* Start Mirror */}
      <Card className="bg-white border-2 border-gold/30 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-black text-base flex items-center gap-2">
            <Play className="w-4 h-4 text-gold" />
            Start Emergency Mirror
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-600 text-sm">
            This will fire up to <strong className="text-black">100 projects</strong> per run with full image mirroring enabled. 
            Run this multiple times to process all projects. Each run takes ~10 minutes to complete in the background.
          </p>
          
          <Button 
            onClick={startMirror} 
            disabled={isRunning}
            className="bg-gold hover:bg-gold/90 text-black font-semibold border-0"
          >
            {isRunning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting Mirror...</>
            ) : (
              <><AlertTriangle className="w-4 h-4 mr-2" /> Start Emergency Mirror (100 projects)</>
            )}
          </Button>

          {lastResult && (
            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20 rounded-lg p-4 space-y-2">
              <p className="text-emerald-700 text-sm font-semibold">Mirror Dispatched Successfully</p>
              <div className="text-zinc-600 text-xs space-y-1">
                <p>Projects queued: <span className="text-black font-medium">{lastResult.projects_queued}</span></p>
                <p>Batches fired: <span className="text-black font-medium">{lastResult.batches_fired}</span></p>
                {lastResult.status_before && (
                  <>
                    <p>Before — Missing bedrooms: <span className="text-red-600">{lastResult.status_before.needs_bedrooms}</span></p>
                    <p>Before — Missing prices: <span className="text-red-600">{lastResult.status_before.needs_price}</span></p>
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
