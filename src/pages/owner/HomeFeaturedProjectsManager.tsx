import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Home, Loader2, Plus, Save, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type ProjectOption = {
  id: string;
  name: string;
  slug: string | null;
  developer_name: string | null;
  location: string | null;
  cover_image_url: string | null;
};

type FeaturedRow = {
  id: string;
  project_id: string;
  display_order: number;
  is_visible: boolean;
  owner_details: string | null;
  project: ProjectOption | null;
};

const featuredSelect = `
  id,
  project_id,
  display_order,
  is_visible,
  owner_details,
  project:projects(id, name, slug, developer_name, location, cover_image_url)
`;

export default function HomeFeaturedProjectsManager() {
  const qc = useQueryClient();
  const [selectedProject, setSelectedProject] = useState("");
  const [search, setSearch] = useState("");

  const { data: featured = [], isLoading: featuredLoading } = useQuery({
    queryKey: ["owner-home-featured-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_featured_projects" as any)
        .select(featuredSelect)
        .order("display_order", { ascending: true })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as FeaturedRow[];
    },
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["owner-featured-project-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, developer_name, location, cover_image_url")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(600);
      if (error) throw error;
      return (data || []) as ProjectOption[];
    },
  });

  const selectedIds = useMemo(() => new Set(featured.map((f) => f.project_id)), [featured]);
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (selectedIds.has(p.id)) return false;
      if (!q) return true;
      return [p.name, p.developer_name, p.location].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [projects, search, selectedIds]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["owner-home-featured-projects"] });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject) throw new Error("Choose a project first");
      const nextOrder = featured.length ? Math.max(...featured.map((f) => f.display_order || 0)) + 1 : 1;
      const { error } = await supabase.from("home_featured_projects" as any).insert({
        project_id: selectedProject,
        display_order: nextOrder,
        is_visible: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedProject("");
      setSearch("");
      invalidate();
      toast.success("Featured project added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<FeaturedRow> }) => {
      const { error } = await supabase.from("home_featured_projects" as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("home_featured_projects" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Featured project removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = async (index: number, direction: -1 | 1) => {
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= featured.length) return;
    const current = featured[index];
    const other = featured[otherIndex];
    await Promise.all([
      updateMutation.mutateAsync({ id: current.id, patch: { display_order: other.display_order } }),
      updateMutation.mutateAsync({ id: other.id, patch: { display_order: current.display_order } }),
    ]);
    toast.success("Featured order updated");
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="rounded-[28px] border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] p-5 md:p-6 shadow-[0_24px_60px_-42px_rgba(26,26,26,0.45)]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <span data-surface="emerald" className="allow-white shrink-0 size-12 rounded-2xl jj-emerald-metallic flex items-center justify-center shadow-[0_16px_34px_-20px_rgba(6,78,59,0.9)]">
              <Star className="size-5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] font-black text-[#B89555]">Owner Backend · Homepage</p>
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Featured Projects</h1>
              <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">Choose the exact projects shown in Handpicked For You, control count, visibility, ordering, and owner details.</p>
            </div>
          </div>
          <Button onClick={() => window.open("/", "_blank")} variant="outline" size="sm">
            <Home className="size-4" /> View homepage
          </Button>
        </div>
      </div>

      <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-4 md:p-5 rounded-xl">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
          <div>
            <Label className="text-[#1A1A1A]">Find a project</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by project, developer, location" className="mt-1 bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]" />
          </div>
          <div>
            <Label className="text-[#1A1A1A]">Add to Handpicked For You</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject} disabled={projectsLoading}>
              <SelectTrigger className="mt-1 bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]">
                <SelectValue placeholder={projectsLoading ? "Loading projects…" : "Select project"} />
              </SelectTrigger>
              <SelectContent>
                {filteredProjects.slice(0, 120).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} · {p.developer_name || "Developer"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!selectedProject || addMutation.isPending}>
            {addMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {featuredLoading ? (
          <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-10 text-center"><Loader2 className="mx-auto size-6 animate-spin text-[#064E3B]" /></Card>
        ) : featured.length === 0 ? (
          <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-10 text-center text-[#1A1A1A]/70">No featured projects selected yet. The homepage will use its automatic fallback until you add projects here.</Card>
        ) : featured.map((row, index) => (
          <Card key={row.id} className="bg-[#F7F2EA] border-[#B89555]/40 p-4 rounded-xl">
            <div className="grid gap-4 lg:grid-cols-[auto_96px_1fr_auto] lg:items-start">
              <div className="flex lg:flex-col items-center gap-2 pt-1">
                <GripVertical className="size-4 text-[#B89555]" />
                <span className="text-xs font-black text-[#1A1A1A]">#{index + 1}</span>
              </div>
              <div className="h-24 w-24 overflow-hidden rounded-xl border border-[#B89555]/35 bg-[#EFE6D6]">
                {row.project?.cover_image_url ? <img src={row.project.cover_image_url} alt={row.project.name} className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <div className="grid h-full place-items-center text-[10px] text-[#1A1A1A]/50">No cover</div>}
              </div>
              <div className="min-w-0 space-y-3">
                <div>
                  <h2 className="text-lg font-black text-[#1A1A1A] leading-tight">{row.project?.name || "Deleted project"}</h2>
                  <p className="text-sm text-[#1A1A1A]/65">{row.project?.developer_name || "Developer"} · {row.project?.location || "Location pending"}</p>
                </div>
                <Textarea
                  defaultValue={row.owner_details || ""}
                  placeholder="Owner details or internal homepage note"
                  className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"
                  onBlur={(e) => updateMutation.mutate({ id: row.id, patch: { owner_details: e.target.value } })}
                />
              </div>
              <div className="flex flex-wrap lg:flex-col gap-2 lg:items-stretch">
                <div className="flex items-center gap-2 rounded-xl border border-[#B89555]/35 bg-[#FDFBF7] px-3 py-2">
                  {row.is_visible ? <Eye className="size-4 text-[#064E3B]" /> : <EyeOff className="size-4 text-[#1A1A1A]/50" />}
                  <span className="text-xs font-bold text-[#1A1A1A]">Visible</span>
                  <Switch checked={row.is_visible} onCheckedChange={(checked) => updateMutation.mutate({ id: row.id, patch: { is_visible: checked } })} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp className="size-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => move(index, 1)} disabled={index === featured.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: row.id, patch: { owner_details: row.owner_details || "" } })}>
                  <Save className="size-4" /> Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(row.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="size-4" /> Remove
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}