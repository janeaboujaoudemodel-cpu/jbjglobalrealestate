import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Eye, Merge, XCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DuplicateMatch {
  id: string;
  name: string;
  slug: string;
  source: "published" | "draft" | "pending";
  developer_name: string | null;
  location: string | null;
  is_published: boolean | null;
  created_at: string;
}

interface ProjectDuplicateInspectorProps {
  projectName: string;
  /** Called when user chooses an action */
  onAction?: (action: "merge" | "replace" | "stop" | "create_new", matchId?: string) => void;
  /** If true, blocks form submission when duplicates found */
  blocking?: boolean;
  className?: string;
}

export function ProjectDuplicateInspector({
  projectName,
  onAction,
  blocking = true,
  className = "",
}: ProjectDuplicateInspectorProps) {
  const [matches, setMatches] = useState<DuplicateMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  const searchDuplicates = useCallback(async (name: string) => {
    if (!name || name.trim().length < 3) {
      setMatches([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = name.trim().toLowerCase();
      const slug = searchTerm.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      // Search projects table (published + drafts)
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, slug, developer_name, location, is_published, created_at")
        .or(`name.ilike.%${searchTerm}%,slug.ilike.%${slug}%`)
        .limit(5);

      // Search pending imports
      const { data: pending } = await supabase
        .from("pending_project_imports")
        .select("id, name, slug, developer_name, location, created_at")
        .or(`name.ilike.%${searchTerm}%,slug.ilike.%${slug}%`)
        .eq("status", "pending")
        .limit(5);

      const results: DuplicateMatch[] = [];

      (projects || []).forEach((p) => {
        results.push({
          id: p.id,
          name: p.name,
          slug: p.slug,
          source: p.is_published ? "published" : "draft",
          developer_name: p.developer_name,
          location: p.location,
          is_published: p.is_published,
          created_at: p.created_at,
        });
      });

      (pending || []).forEach((p) => {
        results.push({
          id: p.id,
          name: p.name,
          slug: p.slug || "",
          source: "pending",
          developer_name: p.developer_name,
          location: p.location,
          is_published: false,
          created_at: p.created_at,
        });
      });

      setMatches(results);
      setDismissed(false);
    } catch (error) {
      console.error("Duplicate search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => searchDuplicates(projectName), 400);
    return () => clearTimeout(timer);
  }, [projectName, searchDuplicates]);

  if (dismissed || (matches.length === 0 && !isSearching)) return null;

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "published":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Published</Badge>;
      case "draft":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">Draft</Badge>;
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">Pending Import</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`border-2 border-amber-400 bg-amber-50/50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            {isSearching ? "Searching for duplicates..." : `${matches.length} existing project${matches.length !== 1 ? "s" : ""} found`}
          </span>
          {isSearching && <Loader2 className="w-3 h-3 animate-spin text-amber-600" />}
        </div>

        {matches.length > 0 && (
          <>
            <div className="space-y-2 mb-3">
              {matches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-2 rounded-lg border border-amber-200 bg-white/80">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{match.name}</span>
                      {getSourceBadge(match.source)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {match.developer_name && <span>{match.developer_name} · </span>}
                      {match.location && <span>{match.location}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {match.source === "published" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => window.open(`/project/${match.slug}`, "_blank")}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Live
                      </Button>
                    )}
                    {match.source === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => navigate(`/owner/listing-admin/preview/${match.id}`)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {blocking && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => onAction?.("merge", matches[0]?.id)}
                >
                  <Merge className="w-3 h-3 mr-1" />
                  Merge with Existing
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => onAction?.("stop")}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    setDismissed(true);
                    onAction?.("create_new");
                  }}
                >
                  Create Anyway
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ProjectDuplicateInspector;
