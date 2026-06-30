import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, MapPin, Calendar, Edit, Check, X, Eye, FileText,
  Image as ImageIcon, Send, Clock, ChevronRight, Link as LinkIcon,
  RefreshCw, Lock, ShieldCheck
} from "lucide-react";

interface ProjectForReview {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  handover_date: string | null;
  price_from: number | null;
  price_to: number | null;
  payment_plan: string | null;
  developer_id: string | null;
  source_url: string | null;
  is_published: boolean;
  images: { image_url: string; alt_text: string }[];
  documents: { file_url: string; document_type: string; file_name: string }[];
}

interface ChangeRequest {
  id: string;
  project_id: string;
  status: string;
  changes: Record<string, { before: string; after: string }>;
  review_notes: string | null;
  created_at: string;
}

export function DeveloperProjectReview({ developerId }: { developerId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectForReview[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<ProjectForReview | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [linkUrl, setLinkUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchChangeRequests();
  }, [developerId]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data: projectData, error } = await supabase
        .from("projects")
        .select("id, name, slug, location, description, handover_date, price_from, price_to, payment_plan, developer_id, source_url, is_published")
        .eq("developer_id", developerId)
        .order("name");

      if (error) throw error;

      // Fetch images and documents for each project
      const projectsWithMedia = await Promise.all(
        (projectData || []).map(async (p) => {
          const [imgRes, docRes] = await Promise.all([
            supabase.from("project_images").select("image_url, alt_text").eq("project_id", p.id).order("display_order").limit(10),
            supabase.from("project_documents").select("file_url, document_type, file_name").eq("project_id", p.id),
          ]);
          return {
            ...p,
            images: imgRes.data || [],
            documents: docRes.data || [],
          };
        })
      );

      setProjects(projectsWithMedia);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChangeRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("project_change_requests")
      .select("*")
      .eq("requested_by", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setChangeRequests(((data || []) as unknown as ChangeRequest[]));
  };

  const startEdit = (project: ProjectForReview) => {
    setEditingProject(project);
    setEditForm({
      description: project.description || "",
      location: project.location || "",
      handover_date: project.handover_date || "",
      payment_plan: project.payment_plan || "",
      price_from: project.price_from?.toString() || "",
      price_to: project.price_to?.toString() || "",
    });
  };

  const handleExtractFromLink = async () => {
    if (!linkUrl.trim()) return;
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("universal-link-extractor", {
        body: { url: linkUrl, extractType: "project" },
      });
      if (error) throw error;

      // Auto-fill form fields from extracted data
      if (data?.extracted) {
        const ext = data.extracted;
        setEditForm((prev) => ({
          ...prev,
          description: ext.description || prev.description,
          location: ext.location || prev.location,
          handover_date: ext.handover_date || prev.handover_date,
          payment_plan: ext.payment_plan || prev.payment_plan,
          price_from: ext.price_from?.toString() || prev.price_from,
          price_to: ext.price_to?.toString() || prev.price_to,
        }));
        toast({ title: "Extraction Complete", description: "Fields populated from link" });
      }
    } catch (err) {
      toast({ title: "Extraction Failed", description: "Could not extract data from link", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  const submitChangeRequest = async () => {
    if (!editingProject || !user) return;
    setIsSubmitting(true);

    try {
      const changes: Record<string, { before: string; after: string }> = {};

      Object.entries(editForm).forEach(([key, value]) => {
        const original = (editingProject as any)[key]?.toString() || "";
        if (value !== original) {
          changes[key] = { before: original, after: value };
        }
      });

      if (Object.keys(changes).length === 0) {
        toast({ title: "No Changes", description: "No fields were modified" });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("project_change_requests").insert({
        project_id: editingProject.id,
        requested_by: user.id,
        changes,
        status: "pending",
      });

      if (error) throw error;

      // Log to audit
      await supabase.from("project_audit_logs").insert([{
        project_id: editingProject.id,
        action: "change_request_submitted",
        changed_by: user.id,
        changed_by_email: user.email,
        before_data: editingProject as any,
        after_data: changes as any,
      }]);

      toast({ title: "Change Request Submitted", description: "Your edits have been submitted for approval" });
      setEditingProject(null);
      fetchChangeRequests();
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit change request", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Live Projects */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Building2 className="h-5 w-5" />
            My Live Projects ({projects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No projects found for this developer</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="border border-[#B89555]/20 bg-card hover:shadow-md transition-shadow">
                  {/* Project Image */}
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    {project.images[0] ? (
                      <img
                        src={project.images[0].image_url}
                        alt={project.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                       loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">{project.name}</h3>
                      <Badge variant={project.is_published ? "default" : "secondary"} className="text-[10px] flex-shrink-0">
                        {project.is_published ? "Live" : "Draft"}
                      </Badge>
                    </div>

                    {project.location && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {project.location}
                      </p>
                    )}

                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <Badge variant="outline" className="gap-1">
                        <ImageIcon className="h-2.5 w-2.5" />
                        {project.images.length} imgs
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-2.5 w-2.5" />
                        {project.documents.length} docs
                      </Badge>
                      {project.handover_date && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {project.handover_date}
                        </Badge>
                      )}
                    </div>

                    {/* Description preview */}
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                    )}

                    {/* Read-only restricted fields */}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border">
                      <Lock className="h-2.5 w-2.5" />
                      <span>AI analysis & scoring managed by JBJ</span>
                    </div>

                    {/* Pending CR indicator */}
                    {changeRequests.some(cr => cr.project_id === project.id && cr.status === "pending") && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1">
                        <Clock className="h-2.5 w-2.5" />
                        Change request pending review
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => startEdit(project)}>
                        <Edit className="h-3 w-3" />
                        Edit & Submit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs"
                        onClick={() => window.open(`/project/${project.slug}`, "_blank")}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Change Requests */}
      {changeRequests.length > 0 && (
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Clock className="h-5 w-5" />
              My Change Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {changeRequests.map((cr) => (
                  <div key={cr.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-foreground">
                        {Object.keys(cr.changes).length} field(s) changed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cr.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={cr.status === "approved" ? "default" : cr.status === "rejected" ? "destructive" : "secondary"}
                    >
                      {cr.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit: {editingProject?.name}
            </DialogTitle>
          </DialogHeader>

          {editingProject && (
            <div className="space-y-4">
              {/* Link extraction */}
              <div className="flex items-end gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex-1">
                  <Label className="text-xs">Extract from link</Label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Paste project URL to auto-fill..."
                    className="mt-1"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleExtractFromLink}
                  disabled={isExtracting || !linkUrl.trim()}
                >
                  {isExtracting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                  <span className="ml-1">Extract</span>
                </Button>
              </div>

              {/* Read-only AI fields notice */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 flex-shrink-0 text-[#1A1A1A]" />
                <span>AI analysis results, project scoring, and document descriptions are managed by JBJ and cannot be edited here.</span>
              </div>

              {/* Editable fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Handover Date</Label>
                  <Input
                    value={editForm.handover_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, handover_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Price From (AED)</Label>
                  <Input
                    type="number"
                    value={editForm.price_from}
                    onChange={(e) => setEditForm((f) => ({ ...f, price_from: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Price To (AED)</Label>
                  <Input
                    type="number"
                    value={editForm.price_to}
                    onChange={(e) => setEditForm((f) => ({ ...f, price_to: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Payment Plan</Label>
                  <Input
                    value={editForm.payment_plan}
                    onChange={(e) => setEditForm((f) => ({ ...f, payment_plan: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>
              Cancel
            </Button>
            <Button onClick={submitChangeRequest} disabled={isSubmitting} className="jj-surface-emerald hover:jj-surface-emerald text-white gap-2">
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
