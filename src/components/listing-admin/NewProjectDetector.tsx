import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, Download, RefreshCw, CheckCircle2, MapPin, DollarSign, Building2 } from "lucide-react";
import { toast } from "sonner";

interface UnpublishedProject {
  id: string;
  name: string;
  reelly_id: number | null;
  cover_image_url: string | null;
  developer_name: string | null;
  area_name: string | null;
  location: string | null;
  price_from: number | null;
  sale_status: string | null;
  slug: string;
  source_url?: string | null;
}

export function NewProjectDetector() {
  const [projects, setProjects] = useState<UnpublishedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchUnpublishedProjects();
  }, []);

  const fetchUnpublishedProjects = async () => {
    setIsLoading(true);
    try {
      // Count total
      const { count } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", false)
        .not("reelly_id", "is", null);

      setTotalCount(count || 0);

      // Fetch first 50 unpublished Reelly projects (stubs from markers sync)
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, reelly_id, cover_image_url, developer_name, area_name, location, price_from, sale_status, slug")
        .eq("is_published", false)
        .not("reelly_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setProjects((data || []) as UnpublishedProject[]);
    } catch (err) {
      console.error("Error fetching unpublished projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportProject = async (project: UnpublishedProject) => {
    setImporting(prev => new Set(prev).add(project.id));
    try {
      // First extract full data from Reelly if we have a reelly_id
      if (project.reelly_id) {
        const { data: extractResult } = await supabase.functions.invoke("reelly-complete-offline-save", {
          body: { mode: "specific", project_ids: [project.reelly_id], mirror_images: false },
        });
        if (extractResult?.success) {
          toast.success(`Extracted data for ${project.name}`);
        }
      }

      // Publish the project
      const { error } = await supabase
        .from("projects")
        .update({ is_published: true, published_at: new Date().toISOString() })
        .eq("id", project.id);

      if (error) throw error;

      toast.success(`✅ "${project.name}" is now published!`);
      setProjects(prev => prev.filter(p => p.id !== project.id));
      setTotalCount(prev => prev - 1);
    } catch (err: any) {
      toast.error(err.message || `Failed to publish ${project.name}`);
    } finally {
      setImporting(prev => {
        const next = new Set(prev);
        next.delete(project.id);
        return next;
      });
    }
  };

  const handleImportAll = async () => {
    if (!confirm(`Import & publish all ${projects.length} new projects? This will extract data from Reelly for each.`)) return;
    
    try {
      const { data } = await supabase.functions.invoke("bulk-approve-imports", {
        body: { approve_all: true },
      });
      if (data?.success) {
        toast.success(`Published ${data.approved || projects.length} new projects!`);
        fetchUnpublishedProjects();
      }
    } catch (err: any) {
      toast.error(err.message || "Bulk import failed");
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    if (price >= 1_000_000) return `AED ${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `AED ${(price / 1_000).toFixed(0)}K`;
    return `AED ${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-blue-200 bg-blue-50/30 mb-6">
        <CardContent className="py-8 flex items-center justify-center gap-3 text-blue-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Scanning for new projects...</span>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) return null;

  return (
    <Card className="border-2 border-blue-300 bg-blue-50/50 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900">New Projects Ready to Publish</span>
            <Badge className="bg-emerald-600 text-white border-0 ml-1">
              {totalCount} NEW
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fetchUnpublishedProjects} className="border-blue-300 text-blue-700 hover:bg-blue-100">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            {projects.length > 1 && (
              <Button size="sm" onClick={handleImportAll} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Publish All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
          {projects.map(project => (
            <div
              key={project.id}
              className="flex flex-col rounded-xl bg-white border border-blue-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Cover Image */}
              <div className="relative w-full h-36 bg-zinc-100 flex-shrink-0">
                {project.cover_image_url ? (
                  <img
                    src={project.cover_image_url}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                    <Building2 className="w-10 h-10 text-blue-400" />
                  </div>
                )}
                {project.sale_status && (
                  <div className="absolute top-2 left-2">
                    <Badge className="text-[10px] bg-blue-600/90 text-white border-0 backdrop-blur-sm">
                      {project.sale_status}
                    </Badge>
                  </div>
                )}
                {project.reelly_id && (
                  <div className="absolute top-2 right-2">
                    <Badge className="text-[10px] bg-black/50 text-white border-0 backdrop-blur-sm">
                      #{project.reelly_id}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col gap-1 flex-1">
                <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{project.name}</p>
                {project.developer_name && (
                  <p className="text-xs text-zinc-500">{project.developer_name}</p>
                )}
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  {(project.area_name || project.location) && (
                    <>
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{project.area_name || project.location}</span>
                    </>
                  )}
                </div>
                {project.price_from && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <DollarSign className="w-3 h-3 flex-shrink-0" />
                    From {formatPrice(project.price_from)}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="px-3 pb-3">
                <Button
                  size="sm"
                  onClick={() => handleImportProject(project)}
                  disabled={importing.has(project.id)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                >
                  {importing.has(project.id) ? (
                    <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />Extracting & Publishing...</>
                  ) : (
                    <><CheckCircle2 className="w-3 h-3 mr-1.5" />Extract & Publish</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
        {totalCount > projects.length && (
          <p className="text-center text-xs text-zinc-400 mt-3">
            Showing {projects.length} of {totalCount} new projects. Use "Publish All" to publish everything.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
