import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ExternalLink, Check, AlertTriangle } from "lucide-react";

interface DetectedProject {
  id: string;
  name: string;
  slug: string | null;
  source_url: string | null;
  created_at: string;
  existsOnWebsite: boolean;
  existingProjectId?: string;
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
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: recentImports, error } = await supabase
        .from("pending_project_imports")
        .select("id, name, slug, source_url, created_at")
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error || !recentImports?.length) {
        setDetected([]);
        setIsLoading(false);
        return;
      }

      // Check which slugs already exist in projects table
      const slugs = recentImports.map(i => i.slug).filter(Boolean) as string[];
      
      let existingSlugs = new Map<string, string>();
      if (slugs.length > 0) {
        const { data: existing } = await supabase
          .from("projects")
          .select("id, slug")
          .in("slug", slugs);
        
        if (existing) {
          for (const p of existing) {
            if (p.slug) existingSlugs.set(p.slug, p.id);
          }
        }
      }

      const results: DetectedProject[] = recentImports.map(imp => ({
        id: imp.id,
        name: imp.name,
        slug: imp.slug,
        source_url: imp.source_url,
        created_at: imp.created_at,
        existsOnWebsite: imp.slug ? existingSlugs.has(imp.slug) : false,
        existingProjectId: imp.slug ? existingSlugs.get(imp.slug) : undefined,
      }));

      setDetected(results);
    } catch (err) {
      console.error("Error fetching new detections:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || detected.length === 0) return null;

  const newCount = detected.filter(d => !d.existsOnWebsite).length;
  const existingCount = detected.filter(d => d.existsOnWebsite).length;

  return (
    <Card className="border-2 border-blue-300 bg-blue-50/50 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span className="text-blue-900">New Projects Detected Today</span>
          <Badge className="bg-blue-600 text-white border-0 ml-2">
            {detected.length}
          </Badge>
          {newCount > 0 && (
            <Badge className="bg-emerald-600 text-white border-0">
              {newCount} NEW
            </Badge>
          )}
          {existingCount > 0 && (
            <Badge className="bg-amber-500 text-white border-0">
              {existingCount} EXISTING
            </Badge>
          )}
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
                {project.existsOnWebsite ? (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] flex-shrink-0">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    EXISTING
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] flex-shrink-0">
                    <Check className="w-3 h-3 mr-1" />
                    NEW
                  </Badge>
                )}
                <span className="text-sm font-medium text-zinc-900 truncate">
                  {project.name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-zinc-400">
                  {new Date(project.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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
