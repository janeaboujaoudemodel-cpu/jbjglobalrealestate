import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ExternalLink, Check } from "lucide-react";

interface DetectedProject {
  id: string;
  name: string;
  reelly_id: number | null;
  source_url: string | null;
  created_at: string;
}

export function NewProjectDetector() {
  const [detected, setDetected] = useState<DetectedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNewDetections();
  }, []);

  const fetchNewDetections = async () => {
    setIsLoading(true);
    try {
      // Fetch ALL pending imports (no time filter)
      const { data: allImports, error } = await supabase
        .from("pending_project_imports")
        .select("id, name, reelly_id, source_url, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error || !allImports?.length) {
        setDetected([]);
        setIsLoading(false);
        return;
      }

      // Get all reelly_ids from imports that have one
      const importReellyIds = allImports
        .map(i => i.reelly_id)
        .filter((id): id is number => id != null);

      // Check which reelly_ids already exist in projects table
      let existingReellyIds = new Set<number>();
      if (importReellyIds.length > 0) {
        const { data: existing } = await supabase
          .from("projects")
          .select("reelly_id")
          .in("reelly_id", importReellyIds);

        if (existing) {
          for (const p of existing) {
            if (p.reelly_id != null) existingReellyIds.add(p.reelly_id);
          }
        }
      }

      // Filter to only truly new projects (reelly_id not in projects table)
      const newProjects: DetectedProject[] = allImports
        .filter(imp => imp.reelly_id != null && !existingReellyIds.has(imp.reelly_id))
        .map(imp => ({
          id: imp.id,
          name: imp.name,
          reelly_id: imp.reelly_id,
          source_url: imp.source_url,
          created_at: imp.created_at,
        }));

      setDetected(newProjects);
    } catch (err) {
      console.error("Error fetching new detections:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || detected.length === 0) return null;

  return (
    <Card className="border-2 border-blue-300 bg-blue-50/50 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span className="text-blue-900">New Projects from Reelly</span>
          <Badge className="bg-emerald-600 text-white border-0 ml-2">
            {detected.length} NEW
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {detected.map(project => (
            <div
              key={project.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-blue-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] flex-shrink-0">
                  <Check className="w-3 h-3 mr-1" />
                  NEW
                </Badge>
                <span className="text-sm font-medium text-zinc-900 truncate">
                  {project.name}
                </span>
                {project.reelly_id && (
                  <span className="text-[10px] text-zinc-400 flex-shrink-0">
                    #{project.reelly_id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-zinc-400">
                  {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                {project.source_url && (
                  <a
                    href={project.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
