import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "lucide-react";

interface LeadSourceFilterProps {
  value: string;
  onChange: (value: string) => void;
}

interface ImportSourceOption {
  id: string;
  source_group: string;
  source_name: string;
  created_at: string;
}

const LeadSourceFilter = ({ value, onChange }: LeadSourceFilterProps) => {
  const [sources, setSources] = useState<ImportSourceOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchSources = async () => {
      const { data, error } = await supabase
        .from("crm_lead_sources")
        .select("id, source_group, source_name, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (cancelled) return;

      if (!error && data) {
        setSources(data as ImportSourceOption[]);
      }
    };

    fetchSources();

    return () => {
      cancelled = true;
    };
  }, []);

  const importOptions = useMemo(() => {
    // Hide website group in this list; website has its own dedicated option.
    return sources.filter((s) => (s.source_group || "").toLowerCase() !== "website");
  }, [sources]);

  return (
    <div className="flex items-center gap-2">
      <Database className="h-4 w-4 text-gold" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 max-w-[320px] px-3 rounded-md border border-border bg-card text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">All Sources</option>
        <option value="website">website · Web Form</option>
        <option value="imported">All Imports</option>

        {importOptions.length > 0 && (
          <optgroup label="Recent Imports">
            {importOptions.map((s) => (
              <option key={s.id} value={`source:${s.id}`}>
                {s.source_group} · {s.source_name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
};

export default LeadSourceFilter;

