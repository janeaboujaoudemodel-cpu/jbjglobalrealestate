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
        .eq("is_published", true)
        .limit(8);
      if (error) throw error;
      return (data || []) as unknown as PickedProject[];
    },
  });

  if (value) {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-2xl"
        style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.55)" }}
      >
        {value.developer?.logo_url ? (
          <img src={value.developer.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain bg-white p-1"  loading="lazy" decoding="async" />
        ) : (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "#F7F2EA" }}>
            <Building2 className="w-6 h-6" style={{ color: "#B89555" }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[#1A1A1A] font-semibold truncate">{value.name}</div>
          <div className="text-[#1A1A1A]/70 text-sm truncate">
            {value.developer?.name || "Unknown developer"}
            {value.location ? ` · ${value.location}` : ""}
            {value.handover_date ? ` · Handover ${value.handover_date}` : ""}
          </div>
        </div>
        <button
          onClick={() => onChange(null)}
          data-no-contrast-guard
          className="p-2 rounded-lg text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]"
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
        style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.55)" }}
      >
        <Search className="w-5 h-5" style={{ color: "#B89555" }} />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search a project (type at least 2 characters)…"
          data-no-contrast-guard
          className="flex-1 bg-transparent outline-none text-[#1A1A1A] placeholder:text-[#1A1A1A]/45"
          style={{ color: "#1A1A1A" }}
        />
      </div>
      {open && q.length >= 2 && (
        <div
          className="absolute z-30 mt-2 w-full rounded-2xl overflow-hidden shadow-xl"
          style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.55)" }}
        >
          {isFetching && <div className="p-4 text-[#1A1A1A]/65 text-sm">Searching…</div>}
          {!isFetching && (data?.length ?? 0) === 0 && (
            <div className="p-4 text-[#1A1A1A]/65 text-sm">No project matches “{q}”.</div>
          )}
          {data?.map((p) => (
            <button
              key={p.id}
              onClick={() => { onChange(p); setOpen(false); setQ(""); }}
              className="w-full flex items-start gap-3 p-3 text-left hover:bg-[#EFE6D6] border-b border-[#B89555]/15 last:border-b-0 overflow-visible"
              data-no-contrast-guard
            >
              {p.developer?.logo_url ? (
                <img src={p.developer.logo_url} alt="" className="w-9 h-9 rounded object-contain bg-white p-0.5"  loading="lazy" decoding="async" />
              ) : (
                <div className="w-9 h-9 rounded flex items-center justify-center bg-[#F7F2EA]">
                  <Building2 className="w-4 h-4 text-[#B89555]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[#1A1A1A] text-sm font-medium truncate">{p.name}</div>
                <div data-developer-name className="text-[#1A1A1A]/65 text-xs whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{p.developer?.name || "—"}{p.location ? ` · ${p.location}` : ""}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
