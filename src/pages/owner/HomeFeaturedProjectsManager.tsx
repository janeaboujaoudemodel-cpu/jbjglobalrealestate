import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Home, Loader2, Monitor, Plus, Smartphone, Star, Tablet, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Device = "mobile" | "tablet" | "desktop";
type Surface = "home" | "gate" | "website";
const SURFACES: { id: Surface; label: string; hint: string }[] = [
  { id: "home",    label: "Homepage",     hint: "Handpicked strap on jbj.ae" },
  { id: "gate",    label: "Access Gate",  hint: "Property strap on /access" },
  { id: "website", label: "Website Feed", hint: "General site placements" },
];
const DEVICES: { id: Device; label: string; width: number; icon: typeof Smartphone }[] = [
  { id: "mobile",  label: "Mobile",  width: 390,  icon: Smartphone },
  { id: "tablet",  label: "Tablet",  width: 834,  icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
];

type ProjectOption = {
  id: string;
  name: string;
  slug: string | null;
  developer_name: string | null;
  location: string | null;
  cover_image_url: string | null;
};

type ManualProject = {
  id: string;
  title: string;
  developer_name: string | null;
  emirate: string | null;
  community: string | null;
  starting_price: string | null;
  hero_image_url: string | null;
  cta_url: string | null;
  owner_details: string | null;
};

type FeaturedRow = {
  id: string;
  project_id: string | null;
  manual_project_id: string | null;
  device: Device;
  surface: Surface;
  display_order: number;
  is_visible: boolean;
  owner_details: string | null;
  auto_mode: string | null;
  auto_count: number | null;
  refresh_interval_days: number | null;
  project: ProjectOption | null;
  manual: ManualProject | null;
};

const featuredSelect = `
  id, project_id, manual_project_id, device, surface, display_order, is_visible, owner_details,
  auto_mode, auto_count, refresh_interval_days,
  project:projects(id, name, slug, developer_name, location, cover_image_url),
  manual:home_featured_manual_projects(id, title, developer_name, emirate, community, starting_price, hero_image_url, cta_url, owner_details)
`;

export default function HomeFeaturedProjectsManager() {
  const qc = useQueryClient();
  const [surface, setSurface] = useState<Surface>("home");
  const [tab, setTab] = useState<Device>("desktop");

  const { data: featured = [], isLoading } = useQuery({
    queryKey: ["owner-home-featured-projects-v2", surface],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_featured_projects" as any)
        .select(featuredSelect)
        .eq("surface", surface)
        .order("device", { ascending: true })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as FeaturedRow[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["owner-featured-project-options-v2"],
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

  const invalidate = () => qc.invalidateQueries({ queryKey: ["owner-home-featured-projects-v2"] });

  const byDevice = (d: Device) => featured.filter((f) => f.device === d).sort((a, b) => a.display_order - b.display_order);

  const addProject = useMutation({
    mutationFn: async ({ device, projectId, manualId }: { device: Device; projectId?: string; manualId?: string }) => {
      const rows = byDevice(device);
      const nextOrder = rows.length ? Math.max(...rows.map((r) => r.display_order || 0)) + 1 : 1;
      const { error } = await supabase.from("home_featured_projects" as any).insert({
        device,
        surface,
        project_id: projectId ?? null,
        manual_project_id: manualId ?? null,
        display_order: nextOrder,
        is_visible: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Slot added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRow = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<FeaturedRow> }) => {
      const { error } = await supabase.from("home_featured_projects" as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("home_featured_projects" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Slot removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createManual = useMutation({
    mutationFn: async ({ device, manual }: { device: Device; manual: Omit<ManualProject, "id"> }) => {
      const { data, error } = await supabase
        .from("home_featured_manual_projects" as any)
        .insert(manual)
        .select("id")
        .single();
      if (error) throw error;
      const rows = byDevice(device);
      const nextOrder = rows.length ? Math.max(...rows.map((r) => r.display_order || 0)) + 1 : 1;
      const { error: linkErr } = await supabase.from("home_featured_projects" as any).insert({
        device, surface, project_id: null, manual_project_id: (data as any).id, display_order: nextOrder, is_visible: true,
      });
      if (linkErr) throw linkErr;
    },
    onSuccess: () => { invalidate(); toast.success("Manual project created and added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = async (device: Device, index: number, dir: -1 | 1) => {
    const rows = byDevice(device);
    const other = index + dir;
    if (other < 0 || other >= rows.length) return;
    await Promise.all([
      updateRow.mutateAsync({ id: rows[index].id, patch: { display_order: rows[other].display_order } }),
      updateRow.mutateAsync({ id: rows[other].id, patch: { display_order: rows[index].display_order } }),
    ]);
  };

  const copyFromDesktop = useMutation({
    mutationFn: async (target: Device) => {
      const source = byDevice("desktop");
      const targetRows = byDevice(target);
      for (const r of targetRows) {
        await supabase.from("home_featured_projects" as any).delete().eq("id", r.id);
      }
      for (let i = 0; i < source.length; i++) {
        const s = source[i];
        await supabase.from("home_featured_projects" as any).insert({
          device: target,
          surface,
          project_id: s.project_id,
          manual_project_id: s.manual_project_id,
          display_order: i + 1,
          is_visible: s.is_visible,
          owner_details: s.owner_details,
        });
      }
    },
    onSuccess: () => { invalidate(); toast.success("Desktop layout copied"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-fill from newest N published projects
  const autoFillNewest = useMutation({
    mutationFn: async ({ device, count, intervalDays }: { device: Device; count: number; intervalDays: number | null }) => {
      const { data: newest, error: e1 } = await supabase
        .from("projects")
        .select("id")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(count);
      if (e1) throw e1;

      const targetRows = byDevice(device);
      for (const r of targetRows) {
        await supabase.from("home_featured_projects" as any).delete().eq("id", r.id);
      }
      const rows = (newest || []).map((p, i) => ({
        device, surface,
        project_id: p.id,
        manual_project_id: null,
        display_order: i + 1,
        is_visible: true,
        auto_mode: "newest",
        auto_count: count,
        refresh_interval_days: intervalDays,
        last_auto_refresh_at: new Date().toISOString(),
      }));
      if (rows.length) {
        const { error: e2 } = await supabase.from("home_featured_projects" as any).insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => { invalidate(); toast.success("Auto-filled with newest projects"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="rounded-[28px] border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <span data-surface="emerald" data-ink-emerald-opt-out className="shrink-0 size-12 rounded-2xl jj-emerald-metallic flex items-center justify-center">
              <Star className="size-5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] font-black text-[#B89555]">Owner Backend · Homepage</p>
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Featured Projects</h1>
              <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">
                Pick the exact projects shown in <span className="font-bold">Handpicked For You</span> on Mobile, Tablet and Desktop independently. No cap — add as many slots as you want, reorder, hide, or create a manual project that isn't in the catalog yet.
              </p>
            </div>
          </div>
          <Button onClick={() => window.open("/", "_blank")} variant="outline" size="sm">
            <Home className="size-4 mr-1" /> View homepage
          </Button>
        </div>
      </div>

      {/* Surface selector — choose which public strap you're editing */}
      <div className="rounded-2xl border border-[#B89555]/35 bg-white p-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.22em] font-black text-[#1A1A1A]/60 pr-2">Surface</span>
        {SURFACES.map((s) => {
          const active = s.id === surface;
          return (
            <button
              key={s.id}
              onClick={() => setSurface(s.id)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${active ? "bg-[#064E3B] text-white" : "bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]"}`}
            >
              {s.label}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20" : "bg-[#B89555]/20 text-[#1A1A1A]"}`}>{s.hint}</span>
            </button>
          );
        })}
      </div>

      {/* Automation panel — auto-fill newest N with refresh interval, per surface + current device */}
      <AutomationPanel
        device={tab}
        rows={byDevice(tab)}
        onAutoFill={(count, intervalDays) => autoFillNewest.mutate({ device: tab, count, intervalDays })}
      />

      {/* Device tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Device)}>

        <TabsList data-surface="emerald" className="jj-emerald-metallic p-1 rounded-xl inline-flex gap-1">
          {DEVICES.map((d) => {
            const Icon = d.icon;
            const count = byDevice(d.id).length;
            return (
              <TabsTrigger
                key={d.id}
                value={d.id}
                className="data-[state=active]:bg-white/15 data-[state=active]:text-white rounded-lg px-4 py-2 text-white font-bold text-sm flex items-center gap-2"
              >
                <Icon className="size-4" />
                {d.label}
                <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-black">{count}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {DEVICES.map((d) => (
          <TabsContent key={d.id} value={d.id} className="mt-5 space-y-4">
            <DeviceFrameToolbar
              device={d.id}
              width={d.width}
              rows={byDevice(d.id)}
              projects={projects}
              onAdd={(projectId) => addProject.mutate({ device: d.id, projectId })}
              onCreateManual={(manual) => createManual.mutate({ device: d.id, manual })}
              onCopyDesktop={d.id !== "desktop" ? () => copyFromDesktop.mutate(d.id) : undefined}
            />

            {/* Live preview */}
            <div className="rounded-2xl border border-[#B89555]/35 bg-[#F7F2EA] p-4 overflow-x-auto">
              <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#1A1A1A]/60 mb-3">Preview @ {d.width}px</p>
              <div className="mx-auto rounded-xl border border-[#B89555]/20 bg-white shadow-inner overflow-hidden" style={{ width: Math.min(d.width, 1200) }}>
                <div className={`grid gap-3 p-3 ${d.id === "mobile" ? "grid-cols-1" : d.id === "tablet" ? "grid-cols-2" : "grid-cols-3"}`}>
                  {byDevice(d.id).filter((r) => r.is_visible).map((row) => {
                    const cover = row.project?.cover_image_url || row.manual?.hero_image_url;
                    const title = row.project?.name || row.manual?.title || "Untitled";
                    const dev = row.project?.developer_name || row.manual?.developer_name || "Developer";
                    const loc = row.project?.location || [row.manual?.community, row.manual?.emirate].filter(Boolean).join(" · ") || "";
                    return (
                      <div key={row.id} className="rounded-lg border border-[#B89555]/30 overflow-hidden bg-white">
                        <div className="aspect-[4/3] bg-[#EFE6D6]">
                          {cover ? <img src={cover} alt={title} className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full place-items-center text-xs text-[#1A1A1A]/50">No cover</div>}
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-black text-[#1A1A1A] truncate">{title}</p>
                          <p className="text-[11px] text-[#1A1A1A]/60 truncate">{dev}{loc ? ` · ${loc}` : ""}</p>
                        </div>
                      </div>
                    );
                  })}
                  {byDevice(d.id).length === 0 && (
                    <div className="col-span-full py-10 text-center text-sm text-[#1A1A1A]/50">No slots for {d.label} yet. Add one above, or copy from Desktop.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Editable slot list */}
            <div className="space-y-3">
              {isLoading ? (
                <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-10 text-center"><Loader2 className="mx-auto size-6 animate-spin text-[#064E3B]" /></Card>
              ) : byDevice(d.id).length === 0 ? null : byDevice(d.id).map((row, index) => {
                const title = row.project?.name || row.manual?.title || "Deleted";
                const dev = row.project?.developer_name || row.manual?.developer_name || "Developer";
                const loc = row.project?.location || [row.manual?.community, row.manual?.emirate].filter(Boolean).join(" · ") || "Location pending";
                const cover = row.project?.cover_image_url || row.manual?.hero_image_url;
                return (
                  <Card key={row.id} className="bg-[#F7F2EA] border-[#B89555]/40 p-4 rounded-xl">
                    <div className="grid gap-4 lg:grid-cols-[auto_96px_1fr_auto] lg:items-start">
                      <div className="flex lg:flex-col items-center gap-2 pt-1">
                        <span className="text-xs font-black text-[#1A1A1A]">#{index + 1}</span>
                      </div>
                      <div className="h-24 w-24 overflow-hidden rounded-xl border border-[#B89555]/35 bg-[#EFE6D6]">
                        {cover ? <img src={cover} alt={title} className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full place-items-center text-[10px] text-[#1A1A1A]/50">No cover</div>}
                      </div>
                      <div className="min-w-0 space-y-3">
                        <div>
                          <h2 className="text-lg font-black text-[#1A1A1A] leading-tight">{title}</h2>
                          <p className="text-sm text-[#1A1A1A]/65">{dev} · {loc}</p>
                          {row.manual_project_id && <span className="inline-block mt-1 text-[10px] uppercase tracking-widest font-black text-[#B89555]">Manual entry</span>}
                        </div>
                        <Textarea
                          defaultValue={row.owner_details || ""}
                          placeholder="Owner note for this slot (internal only)"
                          className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"
                          onBlur={(e) => updateRow.mutate({ id: row.id, patch: { owner_details: e.target.value } })}
                        />
                      </div>
                      <div className="flex flex-wrap lg:flex-col gap-2 lg:items-stretch">
                        <div className="flex items-center gap-2 rounded-xl border border-[#B89555]/35 bg-[#FDFBF7] px-3 py-2">
                          {row.is_visible ? <Eye className="size-4 text-[#064E3B]" /> : <EyeOff className="size-4 text-[#1A1A1A]/50" />}
                          <span className="text-xs font-bold text-[#1A1A1A]">Visible</span>
                          <Switch checked={row.is_visible} onCheckedChange={(c) => updateRow.mutate({ id: row.id, patch: { is_visible: c } })} />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => move(d.id, index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp className="size-4" /></Button>
                          <Button variant="outline" size="icon" onClick={() => move(d.id, index, 1)} disabled={index === byDevice(d.id).length - 1} aria-label="Move down"><ArrowDown className="size-4" /></Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => deleteRow.mutate(row.id)}>
                          <Trash2 className="size-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function DeviceFrameToolbar({
  device, width, rows, projects, onAdd, onCreateManual, onCopyDesktop,
}: {
  device: Device;
  width: number;
  rows: FeaturedRow[];
  projects: ProjectOption[];
  onAdd: (projectId: string) => void;
  onCreateManual: (manual: Omit<ManualProject, "id">) => void;
  onCopyDesktop?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState<Omit<ManualProject, "id">>({
    title: "", developer_name: "", emirate: "", community: "", starting_price: "", hero_image_url: "", cta_url: "", owner_details: "",
  });

  const usedIds = useMemo(() => new Set(rows.map((r) => r.project_id).filter(Boolean) as string[]), [rows]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => !usedIds.has(p.id) && (!q || [p.name, p.developer_name, p.location].some((v) => String(v || "").toLowerCase().includes(q))));
  }, [projects, usedIds, search]);

  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-4 md:p-5 rounded-xl">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[#1A1A1A]/70">
            <span className="font-black">{rows.length}</span> slot{rows.length === 1 ? "" : "s"} on <span className="font-black capitalize">{device}</span> ({width}px). Add unlimited slots below.
          </p>
          {onCopyDesktop && (
            <Button variant="outline" size="sm" onClick={onCopyDesktop}>
              <Copy className="size-4 mr-1" /> Copy layout from Desktop
            </Button>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_auto_auto] lg:items-end">
          <div>
            <Label className="text-[#1A1A1A]">Find a project</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search project, developer, location" className="mt-1 bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]" />
          </div>
          <div>
            <Label className="text-[#1A1A1A]">Add live project</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="mt-1 bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {filtered.slice(0, 120).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} · {p.developer_name || "Developer"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!selected}
            onClick={() => { onAdd(selected); setSelected(""); setSearch(""); }}
          >
            <Plus className="size-4 mr-1" /> Add
          </Button>
          <Dialog open={manualOpen} onOpenChange={setManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="size-4 mr-1" /> New manual project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create manual project for {device}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                {([
                  ["title", "Title *"],
                  ["developer_name", "Developer"],
                  ["emirate", "Emirate"],
                  ["community", "Community"],
                  ["starting_price", "Starting price"],
                  ["hero_image_url", "Hero image URL"],
                  ["cta_url", "CTA URL"],
                ] as const).map(([k, lbl]) => (
                  <div key={k}>
                    <Label>{lbl}</Label>
                    <Input value={(manual as any)[k] || ""} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} className="mt-1" />
                  </div>
                ))}
                <div>
                  <Label>Owner note</Label>
                  <Textarea value={manual.owner_details || ""} onChange={(e) => setManual({ ...manual, owner_details: e.target.value })} className="mt-1" />
                </div>
                <Button
                  disabled={!manual.title.trim()}
                  onClick={() => {
                    onCreateManual(manual);
                    setManual({ title: "", developer_name: "", emirate: "", community: "", starting_price: "", hero_image_url: "", cta_url: "", owner_details: "" });
                    setManualOpen(false);
                  }}
                >
                  Create & add to {device}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}

function AutomationPanel({
  device, rows, onAutoFill,
}: {
  device: Device;
  rows: FeaturedRow[];
  onAutoFill: (count: number, intervalDays: number | null) => void;
}) {
  const [count, setCount] = useState<number>(6);
  const [interval, setInterval] = useState<string>("lifetime");
  const auto = rows.find((r) => r.auto_mode === "newest");

  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-4 rounded-xl">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] font-black text-[#1A1A1A]/60">Automation · {device}</p>
          <p className="text-sm text-[#1A1A1A]/75">
            {auto
              ? `Auto: newest ${auto.auto_count || count}, refresh ${auto.refresh_interval_days ? `${auto.refresh_interval_days}d` : "lifetime"}`
              : "Off · currently manual selection"}
          </p>
        </div>
        <div>
          <Label className="text-[#1A1A1A]">Newest</Label>
          <Input type="number" min={1} max={30} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} className="mt-1 w-24 bg-white border-[#B89555]/40 text-[#1A1A1A]" />
        </div>
        <div>
          <Label className="text-[#1A1A1A]">Refresh</Label>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="mt-1 w-40 bg-white border-[#B89555]/40 text-[#1A1A1A]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">Every 15 days</SelectItem>
              <SelectItem value="30">Every 30 days</SelectItem>
              <SelectItem value="60">Every 60 days</SelectItem>
              <SelectItem value="lifetime">Lifetime (until I change)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => onAutoFill(count, interval === "lifetime" ? null : Number(interval))}
          className="bg-[#064E3B] text-white hover:bg-[#053f30]"
        >
          Replace with newest {count}
        </Button>
      </div>
    </Card>
  );
}
