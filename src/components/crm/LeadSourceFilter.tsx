import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database, Globe, Upload, Users, Megaphone, UserPlus, Link2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// GLOBAL LEAD SOURCES - All sources must be clickable and functional
const LEAD_SOURCES = [
  { value: "all", label: "All Sources", icon: Database, color: "text-white/70" },
  { value: "website", label: "Website", icon: Globe, color: "text-emerald-500" },
  { value: "imported", label: "Database Import", icon: Upload, color: "text-blue-500" },
  { value: "broker", label: "Broker", icon: Users, color: "text-purple-500" },
  { value: "referral", label: "Referral", icon: UserPlus, color: "text-amber-500" },
  { value: "campaign", label: "Campaign", icon: Megaphone, color: "text-pink-500" },
  { value: "manual", label: "Manual Entry", icon: UserPlus, color: "text-cyan-500" },
  { value: "third_party", label: "Third-party Platform", icon: Link2, color: "text-orange-500" },
] as const;

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

  const selectedSource = LEAD_SOURCES.find(s => s.value === value) || LEAD_SOURCES[0];
  const SelectedIcon = selectedSource.icon;

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 min-w-[220px] max-w-[320px] bg-zinc-900 border-[#1A1A1A] text-white">
          <div className="flex items-center gap-2">
            <SelectedIcon className={`h-4 w-4 ${selectedSource.color}`} />
            <SelectValue placeholder="Select Source" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-[#1A1A1A]">
          {/* Main Sources - All Clickable */}
          <div className="px-2 py-1.5 text-xs font-bold text-white/70 uppercase tracking-wide border-b border-[#1A1A1A]/50">
            Lead Sources
          </div>
          {LEAD_SOURCES.map((source) => {
            const Icon = source.icon;
            return (
              <SelectItem 
                key={source.value} 
                value={source.value}
                className="text-white hover:bg-[#1A1A1A] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${source.color}`} />
                  <span>{source.label}</span>
                </div>
              </SelectItem>
            );
          })}

          {/* Recent Imports - If Available */}
          {importOptions.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-bold text-white/70 uppercase tracking-wide border-t border-[#1A1A1A]/50 mt-1">
                Recent Imports
              </div>
              {importOptions.map((s) => (
                <SelectItem 
                  key={s.id} 
                  value={`source:${s.id}`}
                  className="text-white hover:bg-[#1A1A1A] cursor-pointer pl-4"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-3 w-3 text-blue-400" />
                    <span className="text-white/70">{s.source_group}</span>
                    <span>·</span>
                    <span>{s.source_name}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LeadSourceFilter;

