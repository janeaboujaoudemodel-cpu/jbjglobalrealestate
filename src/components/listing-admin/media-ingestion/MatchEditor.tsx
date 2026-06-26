import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProjectLite {
  id: string;
  name: string;
  developer_name: string | null;
  developer_id: string | null;
}

interface DeveloperLite {
  id: string;
  name: string;
}

interface MatchEditorProps {
  developerId: string | null;
  projectId: string | null;
  docType: string | null;
  onApply: (patch: {
    matched_project_id: string | null;
    matched_project_name: string | null;
    detected_developer_id: string | null;
    detected_developer_name: string | null;
    detected_doc_type: string | null;
  }) => void;
}

const DOC_TYPES = [
  "brochure",
  "fact_sheet",
  "presentation",
  "floor_plan",
  "payment_plan",
  "video_tour",
  "render",
  "unknown",
];

export function MatchEditor({ developerId, projectId, docType, onApply }: MatchEditorProps) {
  const [developers, setDevelopers] = useState<DeveloperLite[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [dev, setDev] = useState<string | null>(developerId);
  const [proj, setProj] = useState<string | null>(projectId);
  const [type, setType] = useState<string>(docType ?? "unknown");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: d } = await supabase
        .from("developers")
        .select("id, name")
        .order("name")
        .limit(500);
      setDevelopers((d as DeveloperLite[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let q = supabase
        .from("projects")
        .select("id, name, developer_name, developer_id")
        .eq("is_published", true)
        .order("name")
        .limit(200);
      if (dev) q = q.eq("developer_id", dev);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data } = await q;
      setProjects((data as ProjectLite[]) ?? []);
    })();
  }, [dev, search]);

  return (
    <div className="space-y-2 p-3 rounded-lg bg-white border border-[#B89555]/30">
      <div>
        <label className="text-xs text-muted-foreground">Developer</label>
        <select
          value={dev ?? ""}
          onChange={(e) => {
            setDev(e.target.value || null);
            setProj(null);
          }}
          className="w-full min-h-10 rounded border border-[#B89555]/30 bg-white p-2 text-sm text-foreground whitespace-normal [overflow-wrap:anywhere]"
          data-developer-option
        >
          <option value="">— None —</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id} title={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Project</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search project name…"
          className="w-full rounded border border-[#B89555]/30 bg-white p-1.5 text-sm mb-1"
        />
        <select
          value={proj ?? ""}
          onChange={(e) => setProj(e.target.value || null)}
          className="w-full rounded border border-[#B89555]/30 bg-white p-1.5 text-sm text-foreground"
          size={5}
        >
          <option value="">— None —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.developer_name ? `· ${p.developer_name}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Document type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded border border-[#B89555]/30 bg-white p-1.5 text-sm text-foreground"
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => {
          const devName = developers.find((d) => d.id === dev)?.name ?? null;
          const projName = projects.find((p) => p.id === proj)?.name ?? null;
          onApply({
            matched_project_id: proj,
            matched_project_name: projName,
            detected_developer_id: dev,
            detected_developer_name: devName,
            detected_doc_type: type,
          });
        }}
        className="w-full mt-1 rounded-lg bg-[#1A1A1A] text-white py-1.5 text-sm font-medium hover:bg-[#000]"
      >
        Apply
      </button>
    </div>
  );
}
