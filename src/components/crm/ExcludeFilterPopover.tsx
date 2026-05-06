// Exclusion filter for Brokerage / Developer relationship sections.
// Owner can pick agencies/developers to exclude, save the list under a name,
// and reload it later. Excluded ids flow back to parent via onChange.

import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Save, RotateCcw, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExcludeOption { id: string; name: string }

interface SavedFilter {
  id: string;
  name: string;
  excluded_ids: string[];
}

interface Props {
  scope: "brokerage" | "developer";
  options: ExcludeOption[];
  excludedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function ExcludeFilterPopover({ scope, options, excludedIds, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Set<string>>(new Set(excludedIds));
  const [saved, setSaved] = useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string>("");
  const [saveName, setSaveName] = useState("");

  useEffect(() => { if (open) setDraft(new Set(excludedIds)); }, [open, excludedIds]);

  const loadSaved = async () => {
    const { data, error } = await (supabase as any)
      .from("crm_saved_filters")
      .select("id,name,excluded_ids")
      .eq("scope", scope)
      .order("created_at", { ascending: false });
    if (error) return;
    setSaved((data || []) as SavedFilter[]);
  };
  useEffect(() => { loadSaved(); }, [scope]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  const toggle = (id: string) => {
    setDraft((d) => { const n = new Set(d); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const apply = () => { onChange(new Set(draft)); setOpen(false); };
  const reset = () => { setDraft(new Set()); setActiveFilterId(""); };

  const saveFilter = async () => {
    const name = saveName.trim();
    if (!name) { toast.error("Name your filter first"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in required"); return; }
    const ids = Array.from(draft);
    const names = options.filter((o) => draft.has(o.id)).map((o) => o.name);
    const { error } = await (supabase as any).from("crm_saved_filters").insert({
      user_id: user.id, scope, name, excluded_ids: ids, excluded_names: names,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Filter "${name}" saved`);
    setSaveName("");
    loadSaved();
  };

  const loadFilter = (id: string) => {
    setActiveFilterId(id);
    if (!id) { setDraft(new Set()); return; }
    const f = saved.find((s) => s.id === id);
    if (f) setDraft(new Set(f.excluded_ids || []));
  };

  const deleteFilter = async (id: string) => {
    if (!confirm("Delete this saved filter?")) return;
    await (supabase as any).from("crm_saved_filters").delete().eq("id", id);
    loadSaved();
    if (activeFilterId === id) setActiveFilterId("");
  };

  const count = excludedIds.size;
  const draftCount = draft.size;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={count ? "border-[#B89555] text-[#1A1A1A]" : ""}
          title="Exclude specific agencies / developers (saved filters)"
        >
          <Filter className="w-4 h-4 mr-2" />
          {count ? `Excluding ${count}` : "Exclude"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 bg-[#FDFBF7] border border-[#B89555]/40" align="end">
        <div className="p-3 border-b border-[#B89555]/30">
          <div className="text-sm font-semibold text-[#1A1A1A] mb-2">
            Exclude {scope === "brokerage" ? "agencies" : "developers"}
          </div>
          <Select
            value={activeFilterId || "__none"}
            onValueChange={(v) => loadFilter(v === "__none" ? "" : v)}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Load saved filter…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— None —</SelectItem>
              {saved.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name} ({f.excluded_ids?.length || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilterId && (
            <Button size="sm" variant="ghost" className="mt-1 h-7 text-xs text-red-700"
              onClick={() => deleteFilter(activeFilterId)}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete saved filter
            </Button>
          )}
        </div>

        <div className="p-3 border-b border-[#B89555]/30">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search to tick…"
            className="h-8 text-sm"
          />
        </div>

        <div className="max-h-[260px] overflow-y-auto p-2">
          {filteredOptions.length === 0 ? (
            <div className="text-xs text-[#1A1A1A]/60 p-4 text-center">No matches</div>
          ) : filteredOptions.slice(0, 200).map((o) => (
            <label key={o.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F7F2EA] cursor-pointer">
              <Checkbox checked={draft.has(o.id)} onCheckedChange={() => toggle(o.id)} />
              <span className="text-sm text-[#1A1A1A] truncate">{o.name}</span>
            </label>
          ))}
          {filteredOptions.length > 200 && (
            <div className="text-[10px] text-[#1A1A1A]/50 text-center py-1">
              {filteredOptions.length - 200} more — refine search
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[#B89555]/30 space-y-2 bg-[#F7F2EA]">
          <div className="flex items-center gap-2">
            <Input
              value={saveName} onChange={(e) => setSaveName(e.target.value)}
              placeholder="Save as… (e.g. Tier-1 partners)" className="h-8 text-xs"
            />
            <Button size="sm" variant="outline" onClick={saveFilter} disabled={!saveName.trim() || draftCount === 0}>
              <Save className="w-3 h-3 mr-1" /> Save
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[#1A1A1A]/70">{draftCount} excluded</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={reset}>
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </Button>
              <Button size="sm" variant="gold" onClick={apply}>
                <Check className="w-3 h-3 mr-1" /> Done
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
