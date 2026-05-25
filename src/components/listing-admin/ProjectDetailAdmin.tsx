import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SafeImage } from "@/components/SafeImage";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, ExternalLink, Pencil, Trash2, Crown, Building2, MapPin,
  Bed, Calendar, FileText, Image as ImageIcon, Globe, Clock, Zap,
  DollarSign, Layers, Eye, EyeOff, CheckCircle2, AlertCircle, XCircle
} from "lucide-react";
import type { UnifiedProject } from "@/types/unifiedProject";
import { useLatestEditLog, formatRelativeTime } from "@/hooks/useAdminEditLog";

interface ProjectDetailAdminProps {
  project: UnifiedProject;
  onBack: () => void;
  onEdit: (project: UnifiedProject) => void;
  onDelete: (project: UnifiedProject) => void;
}

// Compute enrichment status
function getEnrichmentStatus(project: UnifiedProject) {
  const fields = [
    { key: "description", label: "Description", filled: !!project.description && project.description.length > 20 },
    { key: "amenities", label: "Amenities", filled: Array.isArray(project.amenities) && project.amenities.length > 0 },
    { key: "images", label: "Gallery", filled: (project.images?.length ?? 0) >= 3 },
    { key: "handover_date", label: "Handover Date", filled: !!project.handover_date },
    { key: "price_from", label: "Price", filled: !!project.price_from },
    { key: "developer", label: "Developer", filled: !!project.developer?.name || !!(project as any).developer_name },
    { key: "location", label: "Location", filled: !!project.location },
    { key: "payment_plan", label: "Payment Plan", filled: !!project.payment_plan },
    { key: "documents", label: "Documents", filled: (project.documents?.length ?? 0) > 0 },
    { key: "floor_plan_types", label: "Floor Plans", filled: !!project.floor_plan_types },
  ];
  const filled = fields.filter(f => f.filled).length;
  const total = fields.length;
  const status = filled === total ? "enriched" : filled >= 6 ? "partial" : "needs-data";
  return { fields, filled, total, status };
}

function getProjectStatus(project: UnifiedProject) {
  const enrichment = getEnrichmentStatus(project);
  if (project.is_published && enrichment.status === "enriched") return { label: "Published & Enriched", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  if (project.is_published && enrichment.status === "needs-data") return { label: "Needs Work", color: "bg-red-100 text-red-800 border-red-300" };
  if (project.is_published) return { label: "Published", color: "bg-blue-100 text-blue-800 border-blue-300" };
  if ((project as any).status === "pending") return { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-300" };
  return { label: "Draft", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30" };
}

function getSourceBadge(project: UnifiedProject) {
  const src = project.import_source || project.source || "manual";
  if (src === "provident" || src?.includes("provident")) return { label: "PROVIDENT", color: "bg-violet-100 text-violet-800 border-violet-300" };
  if (src === "reelly" || src?.includes("reelly")) return { label: "REELLY API", color: "bg-sky-100 text-sky-800 border-sky-300" };
  return { label: "MANUAL", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30" };
}

export function ProjectDetailAdmin({ project, onBack, onEdit, onDelete }: ProjectDetailAdminProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: lastEdit } = useLatestEditLog("project", project.id);
  const enrichment = getEnrichmentStatus(project);
  const status = getProjectStatus(project);
  const source = getSourceBadge(project);

  // Fetch enrichment history
  const { data: editLogs } = useQuery({
    queryKey: ["project-edit-logs", project.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("admin_edit_log")
        .select("*")
        .eq("entity_type", "project")
        .eq("entity_id", project.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Fetch enrichment suggestions
  const { data: enrichmentSuggestions } = useQuery({
    queryKey: ["project-enrichment-suggestions", project.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("listing_enrichment_suggestions")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  // Fetch documents
  const { data: documents } = useQuery({
    queryKey: ["project-documents-detail", project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const heroImage = project.cover_image_url || project.images?.[0]?.image_url;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Back + Actions Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project Hub
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.open(`/project/${project.slug}`, "_blank")}>
            <ExternalLink className="w-4 h-4 mr-2" /> View Public Listing
          </Button>
          <Button variant="primary" size="sm" onClick={() => onEdit(project)}>
            <Pencil className="w-4 h-4 mr-2" /> Edit Project
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(project)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Hero Image */}
          <div className="lg:w-2/5 aspect-[16/10] lg:aspect-auto overflow-hidden bg-muted">
            {heroImage ? (
              <SafeImage src={heroImage} alt={project.name} className="w-full h-full object-cover" fallbackSrc="/placeholder.svg" />
            ) : (
              <div className="w-full h-full min-h-[200px] flex items-center justify-center">
                <Building2 className="w-16 h-16 text-muted-foreground/60" />
              </div>
            )}
          </div>
          {/* Info */}
          <CardContent className="flex-1 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                <p className="text-muted-foreground">{project.developer?.name || (project as any).developer_name || "Unknown Developer"}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                <Badge className={`${source.color} text-xs`}>{source.label}</Badge>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {project.price_from && (
                <div className="bg-background/60 rounded-lg p-3 text-center border border-[#B89555]/20">
                  <DollarSign className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Starting</p>
                  <p className="text-sm font-bold text-price-orange">AED {(project.price_from / 1000000).toFixed(1)}M</p>
                </div>
              )}
              {(project.bedrooms_min || project.bedrooms_max) && (
                <div className="bg-background/60 rounded-lg p-3 text-center border border-[#B89555]/20">
                  <Bed className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                  <p className="text-sm font-bold text-foreground">{project.bedrooms_min}{project.bedrooms_max && project.bedrooms_max !== project.bedrooms_min ? ` - ${project.bedrooms_max}` : ""}</p>
                </div>
              )}
              {project.handover_date && (
                <div className="bg-background/60 rounded-lg p-3 text-center border border-[#B89555]/20">
                  <Calendar className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Handover</p>
                  <p className="text-sm font-bold text-foreground">{project.handover_date}</p>
                </div>
              )}
              {project.location && (
                <div className="bg-background/60 rounded-lg p-3 text-center border border-[#B89555]/20">
                  <MapPin className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-bold text-foreground truncate">{project.location.split(",")[0]}</p>
                </div>
              )}
            </div>

            {/* Enrichment bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Enrichment Coverage</span>
                <span className="font-bold text-foreground">{enrichment.filled}/{enrichment.total} fields</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${enrichment.status === "enriched" ? "bg-emerald-500" : enrichment.status === "partial" ? "bg-amber-500" : "bg-red-400"}`}
                  style={{ width: `${(enrichment.filled / enrichment.total) * 100}%` }}
                />
              </div>
            </div>

            {lastEdit && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Last edited {formatRelativeTime(lastEdit.created_at)}{lastEdit.summary ? ` · ${lastEdit.summary}` : ""}</span>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Tabs: Overview, Gallery, Enrichment Log */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gradient-to-r from-[#FDFBF7] to-[#EFE6D6] border border-[#B89555]/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Layers className="w-3.5 h-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Gallery ({project.images?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Documents ({documents?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="enrichment" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Zap className="w-3.5 h-3.5 mr-1.5" /> Enrichment Log
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Description */}
            <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/20">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Description</h3>
                {project.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{project.description}</p>
                ) : (
                  <p className="text-sm text-red-400 italic">No description available</p>
                )}
              </CardContent>
            </Card>

            {/* Enrichment Scorecard */}
            <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/20">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Field Coverage</h3>
                <div className="grid grid-cols-2 gap-2">
                  {enrichment.fields.map(f => (
                    <div key={f.key} className="flex items-center gap-2 text-xs">
                      {f.filled ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                      <span className={f.filled ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/20 lg:col-span-2">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Project Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <DetailField label="Emirate" value={project.emirate} />
                  <DetailField label="Construction Status" value={(project as any).construction_status} />
                  <DetailField label="Sale Status" value={(project as any).sale_status} />
                  <DetailField label="Furnished" value={project.furnished_status} />
                  <DetailField label="Service Charge" value={project.service_charge} />
                  <DetailField label="Payment Plan" value={project.payment_plan} />
                  <DetailField label="Total Units" value={project.total_units?.toString()} />
                  <DetailField label="ROI Estimate" value={project.roi_estimate ? `${project.roi_estimate}%` : null} />
                  <DetailField label="URL Slug" value={project.slug} />
                  <DetailField label="Source" value={project.import_source || project.source} />
                  <DetailField label="Published" value={project.is_published ? "Yes" : "No"} />
                  <DetailField label="Premium" value={project.is_premium ? "Yes" : "No"} />
                </div>

                {/* Amenities */}
                {project.amenities && project.amenities.length > 0 && (
                  <div className="pt-3 border-t border-[#B89555]/10">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.amenities.map((a, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-[#B89555]/30">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GALLERY */}
        <TabsContent value="gallery" className="mt-4">
          {project.images && project.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {project.images.map((img, i) => (
                <div key={img.id || i} className="aspect-[4/3] rounded-lg overflow-hidden border border-[#B89555]/20 bg-muted">
                  <SafeImage src={img.image_url} alt={img.alt_text || project.name} className="w-full h-full object-cover" fallbackSrc="/placeholder.svg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No images uploaded</p>
            </div>
          )}
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="mt-4">
          {documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-[#B89555]/20">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(doc.file_url, "_blank")}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No documents attached</p>
            </div>
          )}
        </TabsContent>

        {/* ENRICHMENT LOG */}
        <TabsContent value="enrichment" className="mt-4 space-y-4">
          {/* Enrichment suggestions */}
          {enrichmentSuggestions && enrichmentSuggestions.length > 0 && (
            <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/20">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#1A1A1A]" /> Enrichment Suggestions
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {enrichmentSuggestions.map((s: any) => (
                    <div key={s.id} className="p-3 bg-background/60 rounded-lg border border-[#B89555]/10 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{s.field_name || "Field update"}</span>
                        <Badge variant="outline" className="text-[10px]">{s.status || "pending"}</Badge>
                      </div>
                      {s.suggested_value && <p className="text-xs text-muted-foreground truncate">New: {String(s.suggested_value).substring(0, 120)}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(s.created_at)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit audit log */}
          <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/20">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Edit History
              </h3>
              {editLogs && editLogs.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {editLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-background/60 rounded-lg border border-[#B89555]/10">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[#EFE6D6] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{log.summary || log.action}</p>
                        {log.changed_fields && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {log.changed_fields.map((f: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] border-[#B89555]/20">{f}</Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No edit history found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground text-sm">{value || "—"}</p>
    </div>
  );
}
