import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Building2 } from "lucide-react";

export interface PickedProject {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  handover_date: string | null;
  price_from: number | null;
  developer: { id: string; name: string; logo_url: string | null; founded_year: number | null; ceo_name: string | null; completed_projects: number | null; offplan_projects: number | null } | null;
}

interface Props {
  value: PickedProject | null;
  onChange: (p: PickedProject | null) => void;
}

export default function ProjectPicker({ value, onChange }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ["compare-units-project-search", q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id,name,slug,location,handover_date,price_from,developer:developers(id,name,logo_url,founded_year,ceo_name,completed_projects,offplan_projects)")
        .ilike("name", `%${q}%`)
        .limit(8);
      if (error) throw error;
      return (data || []) as unknown as PickedProject[];
    },
  });

  if (value) {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
      >
        {value.developer?.logo_url ? (
          <img src={value.developer.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain bg-white/90 p-1" />
        ) : (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "#F7F2EA" }}>
            <Building2 className="w-6 h-6" style={{ color: "#B89555" }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold truncate">{value.name}</div>
          <div className="text-white/60 text-sm truncate">
            {value.developer?.name || "Unknown developer"}
            {value.location ? ` · ${value.location}` : ""}
            {value.handover_date ? ` · Handover ${value.handover_date}` : ""}
          </div>
        </div>
        <button
          onClick={() => onChange(null)}
          data-no-contrast-guard
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Change project"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
      >
        <Search className="w-5 h-5" style={{ color: "#B89555" }} />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search a project (e.g. Amara Wellness Resort)"
          data-no-contrast-guard
          className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40"
          style={{ color: "#FFFFFF" }}
        />
      </div>
      {open && q.length >= 2 && (
        <div
          className="absolute z-30 mt-2 w-full rounded-2xl overflow-hidden"
          style={{ background: "rgba(15,16,32,0.96)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(14px)" }}
        >
          {isFetching && <div className="p-4 text-white/60 text-sm">Searching…</div>}
          {!isFetching && (data?.length ?? 0) === 0 && (
            <div className="p-4 text-white/60 text-sm">No project matches “{q}”.</div>
          )}
          {data?.map((p) => (
            <button
              key={p.id}
              onClick={() => { onChange(p); setOpen(false); setQ(""); }}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/10"
              data-no-contrast-guard
            >
              {p.developer?.logo_url ? (
                <img src={p.developer.logo_url} alt="" className="w-9 h-9 rounded object-contain bg-white/90 p-0.5" />
              ) : (
                <div className="w-9 h-9 rounded flex items-center justify-center bg-white/10">
                  <Building2 className="w-4 h-4 text-white/80" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm truncate">{p.name}</div>
                <div className="text-white/60 text-xs truncate">{p.developer?.name || "—"}{p.location ? ` · ${p.location}` : ""}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
