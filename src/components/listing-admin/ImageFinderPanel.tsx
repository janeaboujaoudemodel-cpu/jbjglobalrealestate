import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Image, Loader2, Play, Square, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface BatchResult {
  id: string;
  name: string;
  imageFound: boolean;
  imageUrl?: string;
}

export function ImageFinderPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [missingCount, setMissingCount] = useState<number | null>(null);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const stopRef = useRef(false);

  const loadMissingCount = async () => {
    setIsLoadingCount(true);
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .or("cover_image_url.is.null,cover_image_url.eq.");
    setMissingCount(count ?? 0);
    setIsLoadingCount(false);
  };

  // Load count on first render
  if (missingCount === null && !isLoadingCount) {
    loadMissingCount();
  }

  const runBatch = async () => {
    setIsRunning(true);
    stopRef.current = false;
    let processed = totalProcessed;
    let found = totalFound;

    while (!stopRef.current) {
      try {
        const { data, error } = await supabase.functions.invoke("find-project-images", {
          body: { batchSize: 5 },
        });

        if (error) {
          toast.error("Image search failed: " + error.message);
          break;
        }

        if (!data?.success) {
          if (data?.error === "Credits exhausted") {
            toast.error("Firecrawl credits exhausted. Stop.");
            break;
          }
          toast.error(data?.error || "Unknown error");
          break;
        }

        if (data.updated === 0 && data.total === 0) {
          toast.success("All projects have images now!");
          break;
        }

        processed += data.total;
        found += data.updated;
        setTotalProcessed(processed);
        setTotalFound(found);

        if (data.results) {
          setBatchResults((prev) => [...data.results, ...prev].slice(0, 50));
        }

        // Refresh missing count
        await loadMissingCount();

        // Small delay between batches
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err: any) {
        toast.error(err.message || "Failed");
        break;
      }
    }

    setIsRunning(false);
  };

  const stop = () => {
    stopRef.current = true;
  };

  const progressPercent =
    missingCount && missingCount > 0 && totalProcessed > 0
      ? Math.min(100, (totalFound / (missingCount + totalFound)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Card className="border-gold/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="w-5 h-5 text-gold" />
            Project Image Finder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Automatically searches the web for real project images using project name and developer. 
            Finds OG images from developer websites, real estate portals, and property listings.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {isLoadingCount ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (missingCount ?? "...")}
              </div>
              <div className="text-xs text-muted-foreground">Missing Images</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">{totalProcessed}</div>
              <div className="text-xs text-muted-foreground">Processed</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{totalFound}</div>
              <div className="text-xs text-muted-foreground">Images Found</div>
            </div>
          </div>

          {totalProcessed > 0 && (
            <Progress value={progressPercent} className="h-2" />
          )}

          <div className="flex gap-3">
            {!isRunning ? (
              <Button onClick={runBatch} className="bg-gold hover:bg-gold/90 text-white">
                <Play className="w-4 h-4 mr-2" />
                Start Image Search
              </Button>
            ) : (
              <Button onClick={stop} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
            <Button variant="outline" onClick={loadMissingCount} disabled={isLoadingCount}>
              Refresh Count
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {batchResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {batchResults.map((r, i) => (
                <div key={`${r.id}-${i}`} className="flex items-center gap-3 p-2 rounded border text-sm">
                  {r.imageFound ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{r.name}</span>
                  {r.imageFound ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">Found</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Not found</Badge>
                  )}
                  {r.imageUrl && (
                    <img src={r.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
