/**
 * ResultsToolbar — Bayut-parity results header for every property listing page.
 *
 *   Properties for {purpose} in {location}   ·  N results
 *   [All | Furnished | Unfurnished]  (rent)   [All | Off-plan | Ready | Resale | Distress]  (buy)
 *   [Sort by ▾]   [List | Grid | Map]   [Create alert]
 */
import { useState } from "react";
import { Bell, LayoutGrid, List, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getRegions } from "@/data/geography";
import SavedFilterMenu from "@/components/search/SavedFilterMenu";
import {
  PROJECT_STATUSES,
  SORT_OPTIONS,
  describeSearch,
  searchToParams,
  type ProjectStatus,
  type PropertySearch,
  type ViewMode,
} from "@/lib/propertySearch";

const EMERALD_PAIR = "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)";

interface Props {
  value: PropertySearch;
  onChange: (next: PropertySearch) => void;
  total: number;
  dark?: boolean;
  /**
   * Hides the status/furnishing quick-chip row. Pages that already expose the
   * unified PropertySearchBar (with its own status + active-filter chips) pass
   * this so the same filter never appears twice on one screen.
   */
  hideQuickChips?: boolean;
}

export default function ResultsToolbar({ value: f, onChange, total, dark = false, hideQuickChips = false }: Props) {

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [saving, setSaving] = useState(false);

  const ink = dark ? "#FFFFFF" : "#1A1A1A";
  const set = (patch: Partial<PropertySearch>) => onChange({ ...f, ...patch });

  const locationName = f.region
    ? getRegions(f.country).find((r) => r.slug === f.region)?.name ?? "UAE"
    : f.country === "uae"
      ? "UAE"
      : f.country;

  const purposeWord = f.purpose === "rent" ? "rent" : f.purpose === "sell" ? "sale valuation" : "sale";

  const quickChips: { label: string; on: boolean; apply: () => void }[] =
    f.purpose === "rent"
      ? [
          { label: "All", on: f.furnishing === "any", apply: () => set({ furnishing: "any" }) },
          { label: "Furnished", on: f.furnishing === "furnished", apply: () => set({ furnishing: "furnished" }) },
          { label: "Unfurnished", on: f.furnishing === "unfurnished", apply: () => set({ furnishing: "unfurnished" }) },
        ]
      : [
          { label: "All", on: f.statuses.length === 0, apply: () => set({ statuses: [] }) },
          ...(["off-plan", "ready", "resale", "distress"] as ProjectStatus[]).map((s) => ({
            label: PROJECT_STATUSES.find((x) => x.slug === s)!.label,
            on: f.statuses.includes(s),
            apply: () =>
              set({ statuses: f.statuses.includes(s) ? f.statuses.filter((x) => x !== s) : [...f.statuses, s] }),
          })),
        ];

  const saveAlert = async () => {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("Please sign in to create an alert.");
        setSaving(false);
        return;
      }
      const { error } = await supabase.from("property_alerts").insert({
        user_id: auth.user.id,
        name: alertName || `Properties for ${purposeWord} in ${locationName}`,
        filters: JSON.parse(JSON.stringify(f)),
        frequency,
        channel: "email",
      });
      if (error) throw error;
      toast.success("Alert created — we'll notify you about new matches.");
      setAlertOpen(false);
      setAlertName("");
    } catch (e) {
      toast.error("Could not create the alert. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const viewBtn = (mode: ViewMode, icon: React.ReactNode, label: string) => (
    <button
      key={mode}
      type="button"
      onClick={() => set({ view: mode })}
      aria-label={label}
      data-surface={f.view === mode ? "emerald" : undefined}
      className="allow-white relative h-10 px-3 rounded-none text-xs font-semibold flex items-center gap-1.5" data-no-contrast-guard
      style={f.view === mode ? { backgroundImage: EMERALD_PAIR, color: "#FFF" } : { color: ink }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div data-results-toolbar className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: ink }}>
            Properties for {purposeWord} in {locationName}
            <span className="ml-2 text-sm font-normal opacity-70">{total.toLocaleString()} listed</span>
          </h1>
          <p className="text-xs mt-1 opacity-70 max-w-[70ch]" style={{ color: ink }}>
            {describeSearch(f)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto justify-end">
          <SavedFilterMenu search={f} />
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-10 px-3 rounded-lg text-xs font-semibold"
                style={{
                  background: dark ? "rgba(255,255,255,0.06)" : "#FDFBF7",
                  border: "1px solid rgba(184,149,85,0.35)",
                  color: ink,
                }}
              >
                Sort by: {SORT_OPTIONS.find((s) => s.slug === f.sort)?.label}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-56 p-1 z-[70]"
              style={{ background: "#FFF", border: "1px solid rgba(184,149,85,0.35)", color: "#1A1A1A" }}
            >
              {SORT_OPTIONS.filter((s) => f.purpose !== "rent" || !["distress", "handover"].includes(s.slug)).map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => set({ sort: s.slug })}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#F7F2EA]"
                  style={f.sort === s.slug ? { backgroundImage: EMERALD_PAIR, color: "#FFF" } : undefined}
                >
                  {s.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div
            className="flex items-center overflow-hidden rounded-lg"
            data-view-switcher
            style={{
              background: dark ? "rgba(255,255,255,0.06)" : "#F2EBDC",
              border: "1px solid rgba(184,149,85,0.3)",
            }}
          >
            {viewBtn("list", <List className="w-3.5 h-3.5" />, "List")}
            <span aria-hidden="true" className="h-5 w-px bg-white/55" />
            {viewBtn("grid", <LayoutGrid className="w-3.5 h-3.5" />, "Grid")}
            <span aria-hidden="true" className="h-5 w-px bg-white/55" />
            {viewBtn("map", <MapPin className="w-3.5 h-3.5" />, "Map")}
          </div>

          <button
            type="button"
            onClick={() => setAlertOpen(true)}
      data-surface="emerald"
            className="allow-white h-10 px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5" data-no-contrast-guard
            style={{ backgroundImage: EMERALD_PAIR }}
          >
            <Bell className="w-3.5 h-3.5" />
            Create alert
          </button>
        </div>
      </div>

      {!hideQuickChips && (
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {quickChips.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={c.apply}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
            style={
              c.on
                ? { backgroundImage: EMERALD_PAIR, color: "#FFFFFF" }
                : {
                    background: dark ? "rgba(255,255,255,0.06)" : "#FDFBF7",
                    color: ink,
                    border: "1px solid rgba(184,149,85,0.35)",
                  }
            }
          >
            {c.label}
          </button>
        ))}
        <a
          href={`/properties?${searchToParams(f).toString()}`}
          className="text-[11px] underline ml-1 opacity-70"
          style={{ color: ink }}
        >
          Shareable link
        </a>
      </div>
      )}


      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent
          className="max-w-md z-[80]"
          style={{ background: "#FFFFFF", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.35)" }}
        >
          <DialogHeader>
            <DialogTitle>Create alert</DialogTitle>
          </DialogHeader>
          <p className="text-sm opacity-75">
            Be the first to know when new listings match this search.
          </p>
          <label className="text-xs font-semibold uppercase tracking-wider opacity-70">Alert name</label>
          <input
            value={alertName}
            onChange={(e) => setAlertName(e.target.value)}
            placeholder={`Properties for ${purposeWord} in ${locationName}`}
            className="h-10 rounded-lg px-3 text-sm bg-[#FDFBF7] border border-[#B89555]/35 outline-none"
          />
          <label className="text-xs font-semibold uppercase tracking-wider opacity-70">Receive updates</label>
          <div className="flex gap-1.5">
            {["instant", "daily", "weekly"].map((fr) => (
              <button
                key={fr}
                type="button"
                onClick={() => setFrequency(fr)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize"
                style={
                  frequency === fr
                    ? { backgroundImage: EMERALD_PAIR, color: "#FFF" }
                    : { background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.35)" }
                }
              >
                {fr}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={saveAlert}
            className="h-11 rounded-xl text-sm font-semibold text-white mt-2 disabled:opacity-60"
            style={{ backgroundImage: EMERALD_PAIR }}
          >
            {saving ? "Creating…" : "Create alert"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
