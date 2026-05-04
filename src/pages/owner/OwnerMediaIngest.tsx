import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, FileText } from "lucide-react";

type Project = { id: string; name: string; slug: string };

const detectKind = (mime: string) =>
  mime.startsWith("video/") ? "video"
  : mime === "application/pdf" ? "brochure"
  : mime.startsWith("image/") ? "image"
  : "other";

export default function OwnerMediaIngest() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [newProject, setNewProject] = useState("");

  const load = async () => {
    const { data: p } = await (supabase as any).from("rel_projects").select("*").order("name");
    setProjects(p ?? []);
    if (p?.[0] && !projectId) setProjectId(p[0].id);
    const { data: m } = await (supabase as any).from("rel_media_assets")
      .select("*").order("created_at", { ascending: false }).limit(20);
    setRecent(m ?? []);
  };
  useEffect(() => { load(); }, []);

  const createProject = async () => {
    if (!newProject.trim()) return;
    const slug = newProject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data, error } = await (supabase as any).from("rel_projects")
      .insert({ name: newProject.trim(), slug }).select().single();
    if (error) { toast.error(error.message); return; }
    setNewProject("");
    setProjectId(data.id);
    load();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !projectId) { toast.error("Pick a project first"); return; }
    setBusy(true);
    let ok = 0, fail = 0;
    for (const file of Array.from(files)) {
      try {
        const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("rel-media").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { error: insErr } = await (supabase as any).from("rel_media_assets").insert({
          project_id: projectId,
          kind: detectKind(file.type),
          title: file.name,
          storage_path: path,
          mime_type: file.type,
          size_bytes: file.size,
          source_filename: file.name,
        });
        if (insErr) throw insErr;
        ok++;
      } catch (e: any) {
        console.error(e); fail++;
      }
    }
    toast.success(`Uploaded ${ok}${fail ? `, ${fail} failed` : ""} · auto-linked to all published listings`);
    setBusy(false);
    load();
  };

  return (
    <div className="p-6 space-y-6 bg-[#FDFBF7] min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Media Ingestion</h1>
        <p className="text-sm text-[#1A1A1A]/70">
          Drop a brochure, floor plan, image set, or video. The file is auto-attached to every
          published listing of the chosen project.
        </p>
      </div>

      <div className="border border-[#B89555]/30 rounded-md bg-[#F7F2EA] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold text-[#1A1A1A]">Project:</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="px-2 py-1 text-sm border border-[#B89555]/40 rounded bg-white min-w-[16rem]"
          >
            {projects.length === 0 && <option value="">— No projects yet —</option>}
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="mx-2 text-[#1A1A1A]/40">|</span>
          <input
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            placeholder="New project name"
            className="px-2 py-1 text-sm border border-[#B89555]/40 rounded bg-white"
          />
          <Button variant="outline" onClick={createProject} disabled={!newProject.trim()}>+ Add</Button>
        </div>
      </div>

      <label
        className={`block border-2 border-dashed rounded-md p-12 text-center cursor-pointer transition ${
          busy ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/40 hover:bg-[#F7F2EA]"
        }`}
      >
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={busy || !projectId}
        />
        {busy ? <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#B89555]" /> : <Upload className="w-8 h-8 mx-auto text-[#B89555]" />}
        <div className="mt-2 text-sm font-semibold text-[#1A1A1A]">
          {busy ? "Uploading…" : "Drop files here or click to upload"}
        </div>
        <div className="text-xs text-[#1A1A1A]/60 mt-1">PDF brochures, MP4 videos, JPG/PNG images</div>
      </label>

      <div>
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-2">Recent uploads</h2>
        <div className="border border-[#B89555]/30 rounded-md bg-white divide-y divide-[#B89555]/15">
          {recent.length === 0 && <div className="p-4 text-sm text-[#1A1A1A]/60">No uploads yet.</div>}
          {recent.map((m) => (
            <div key={m.id} className="p-3 flex items-center gap-3 text-sm">
              <FileText className="w-4 h-4 text-[#B89555]" />
              <span className="font-medium text-[#1A1A1A]">{m.title}</span>
              <span className="text-[#1A1A1A]/60">{m.kind}</span>
              <span className="ml-auto text-[#1A1A1A]/50 text-xs">
                {new Date(m.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
