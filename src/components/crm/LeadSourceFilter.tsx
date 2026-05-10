import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Database, Globe, Upload, Users, Megaphone, UserPlus, Link2,
  MessageCircle, Phone, MapPin, Building2, Facebook, Instagram,
  Search, Linkedin, Mail, Calendar, Handshake, MoreHorizontal,
} from "lucide-react";
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

// GLOBAL LEAD SOURCES — comprehensive premium list
const LEAD_SOURCES = [
  { value: "all", label: "All Sources", icon: Database, color: "text-[#1A1A1A]/70", group: "core" },
  { value: "manual", label: "Manual Entry", icon: UserPlus, color: "text-cyan-600", group: "core" },
  { value: "imported", label: "Database (DLD)", icon: Upload, color: "text-blue-600", group: "core" },
  { value: "website", label: "Website Form", icon: Globe, color: "text-emerald-600", group: "core" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-500", group: "direct" },
  { value: "phone", label: "Phone Call", icon: Phone, color: "text-blue-500", group: "direct" },
  { value: "walkin", label: "Walk-in", icon: MapPin, color: "text-amber-600", group: "direct" },
  { value: "referral", label: "Referral", icon: UserPlus, color: "text-amber-500", group: "direct" },
  { value: "broker", label: "Broker", icon: Users, color: "text-purple-600", group: "direct" },
  { value: "bayut", label: "Bayut", icon: Building2, color: "text-red-600", group: "portal" },
  { value: "propertyfinder", label: "Property Finder", icon: Search, color: "text-orange-600", group: "portal" },
  { value: "dubizzle", label: "Dubizzle", icon: Building2, color: "text-rose-600", group: "portal" },
  { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-700", group: "social" },
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600", group: "social" },
  { value: "google_ads", label: "Google Ads", icon: Search, color: "text-blue-500", group: "social" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-sky-700", group: "social" },
  { value: "campaign", label: "Email Campaign", icon: Mail, color: "text-pink-500", group: "campaign" },
  { value: "event", label: "Event", icon: Calendar, color: "text-violet-600", group: "campaign" },
  { value: "partner", label: "Partner", icon: Handshake, color: "text-teal-600", group: "campaign" },
  { value: "third_party", label: "Third-party Platform", icon: Link2, color: "text-orange-600", group: "campaign" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-[#1A1A1A]/60", group: "campaign" },
] as const;

const GROUP_LABELS: Record<string, string> = {
  core: "Core",
  direct: "Direct",
  portal: "Property Portals",
  social: "Social & Ads",
  campaign: "Campaigns",
};

const LeadSourceFilter = ({ value, onChange }: LeadSourceFilterProps) => {
  const [sources, setSources] = useState<ImportSourceOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("crm_lead_sources")
        .select("id, source_group, source_name, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (cancelled) return;
      if (!error && data) setSources(data as ImportSourceOption[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const importOptions = useMemo(
    () => sources.filter((s) => (s.source_group || "").toLowerCase() !== "website"),
    [sources]
  );

  const selectedSource = LEAD_SOURCES.find(s => s.value === value) || LEAD_SOURCES[0];
  const SelectedIcon = selectedSource.icon;

  const grouped = useMemo(() => {
    const out: Record<string, (typeof LEAD_SOURCES)[number][]> = {};
    LEAD_SOURCES.forEach(s => { (out[s.group] ||= []).push(s); });
    return out;
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 min-w-[220px] max-w-[320px] bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6] transition-colors">
          <div className="flex items-center gap-2">
            <SelectedIcon className={`h-4 w-4 ${selectedSource.color}`} />
            <SelectValue placeholder="Select Source" />
          </div>
        </SelectTrigger>
        <SelectContent
          position="popper"
          side="bottom"
          align="start"
          sideOffset={6}
          avoidCollisions={false}
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 shadow-xl max-h-[420px] rounded-xl"
        >
          {Object.entries(grouped).map(([groupKey, items]) => (
            <div key={groupKey}>
              <div className="px-2 py-1.5 text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-wider border-t border-[#B89555]/20 first:border-t-0 mt-1 first:mt-0">
                {GROUP_LABELS[groupKey] || groupKey}
              </div>
              {items.map((source) => {
                const Icon = source.icon;
                return (
                  <SelectItem
                    key={source.value}
                    value={source.value}
                    className="text-[#1A1A1A] hover:bg-[#B89555]/10 focus:bg-[#B89555]/15 focus:text-[#1A1A1A] cursor-pointer pl-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${source.color}`} />
                      <span>{source.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          ))}

          {importOptions.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-wider border-t border-[#B89555]/20 mt-1">
                Recent Imports
              </div>
              {importOptions.map((s) => (
                <SelectItem
                  key={s.id}
                  value={`source:${s.id}`}
                  className="text-[#1A1A1A] hover:bg-[#B89555]/10 focus:bg-[#B89555]/15 focus:text-[#1A1A1A] cursor-pointer pl-4"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-3 w-3 text-blue-600" />
                    <span className="text-[#1A1A1A]/70">{s.source_group}</span>
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
