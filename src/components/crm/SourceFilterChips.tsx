/**
 * SourceFilterChips
 * --------------------------------------------------------------------------
 * Reusable horizontal chip rows for filtering any CRM list by:
 *
 *   • upload_source   — how the row entered the CRM (csv_import, scan, …)
 *   • database_source — which downstream data warehouse the row belongs to
 *   • country         — country / region label on the row
 *   • team            — the team a row's owner belongs to (team_members)
 *   • campaign        — email campaign a row was a recipient of (crm_campaign_recipients)
 *
 * Multi-select within an axis (OR), AND across axes. The component derives
 * upload_source / database_source / country values directly from the supplied
 * `rows` so chips always reflect what's actually present. Teams + campaigns
 * are fetched once from Supabase.
 *
 * Champagne theme. Chips use cream #EFE6D6 + 1px gold hairline; active state
 * inverts to ink #1A1A1A on champagne with thin gold border. No gold fills.
 *
 * Use together with `useSourceFilterPredicate` to apply the filter to any
 * row whose shape includes upload_source / database_source / country / owner_id
 * / id (lead_id) / assigned_to.
 * --------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Upload, Database, Globe2, Users, Megaphone } from "lucide-react";

export type SourceAxis =
  | "upload_source"
  | "database_source"
  | "country"
  | "team"
  | "campaign";

export interface SourceFilterValue {
  upload_source: string[];
  database_source: string[];
  country: string[];
  team: string[];
  campaign: string[];
}

export const EMPTY_SOURCE_FILTER: SourceFilterValue = {
  upload_source: [],
  database_source: [],
  country: [],
  team: [],
  campaign: [],
};

export interface SourceFilterChipsProps {
  /** Rows currently being filtered — used to derive available values + counts. */
  rows: Array<Record<string, any>>;
  /** Which axes to expose. Defaults to all five. */
  axes?: SourceAxis[];
  value: SourceFilterValue;
  onChange: (next: SourceFilterValue) => void;
  /** Hide the row entirely until at least one axis has options. Default true. */
  hideWhenEmpty?: boolean;
}

const AXIS_META: Record<
  SourceAxis,
  { label: string; Icon: React.ComponentType<{ className?: string }>; field?: keyof any }
> = {
  upload_source: { label: "Upload", Icon: Upload, field: "upload_source" },
  database_source: { label: "Database", Icon: Database, field: "database_source" },
  country: { label: "Country", Icon: Globe2, field: "country" },
  team: { label: "Team", Icon: Users },
  campaign: { label: "Campaign", Icon: Megaphone },
};

interface AxisOption {
  value: string;
  label: string;
  count?: number;
}

function derive(rows: any[], field: string): AxisOption[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    let v: any = r?.[field];
    if (field === "country" && !v) {
      // Fall back to UAE region label when explicit country is missing.
      v = r?.region === "UAE" ? "United Arab Emirates" : r?.region;
    }
    const s = (v ?? "").toString().trim();
    if (!s) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([value, count]) => ({ value, label: value, count }));
}

export function SourceFilterChips({
  rows,
  axes = ["upload_source", "database_source", "country", "team", "campaign"],
  value,
  onChange,
  hideWhenEmpty = true,
}: SourceFilterChipsProps) {
  const [teams, setTeams] = useState<AxisOption[]>([]);
  const [campaigns, setCampaigns] = useState<AxisOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadTeams() {
      if (!axes.includes("team")) return;
      const { data } = await (supabase as any)
        .from("teams")
        .select("id, name")
        .order("name", { ascending: true })
        .limit(50);
      if (!cancelled && data) {
        setTeams((data as any[]).map((t) => ({ value: t.id, label: t.name || "Untitled team" })));
      }
    }
    async function loadCampaigns() {
      if (!axes.includes("campaign")) return;
      const { data } = await (supabase as any)
        .from("crm_email_campaigns")
        .select("id, name, status")
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancelled && data) {
        setCampaigns(
          (data as any[]).map((c) => ({
            value: c.id,
            label: c.name || "Untitled campaign",
          })),
        );
      }
    }
    loadTeams();
    loadCampaigns();
    return () => {
      cancelled = true;
    };
  }, [axes]);

  const optionsByAxis = useMemo(() => {
    const map: Partial<Record<SourceAxis, AxisOption[]>> = {};
    for (const ax of axes) {
      if (ax === "team") map[ax] = teams;
      else if (ax === "campaign") map[ax] = campaigns;
      else map[ax] = derive(rows, AXIS_META[ax].field as string);
    }
    return map;
  }, [axes, rows, teams, campaigns]);

  const totalActive =
    value.upload_source.length +
    value.database_source.length +
    value.country.length +
    value.team.length +
    value.campaign.length;

  const hasAnyOptions = axes.some((ax) => (optionsByAxis[ax]?.length ?? 0) > 0);
  if (hideWhenEmpty && !hasAnyOptions && totalActive === 0) return null;

  const toggle = (axis: SourceAxis, v: string) => {
    const current = value[axis] ?? [];
    const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
    onChange({ ...value, [axis]: next });
  };

  return (
    <div className="space-y-2">
      {axes.map((axis) => {
        const opts = optionsByAxis[axis] ?? [];
        if (!opts.length && !(value[axis]?.length ?? 0)) return null;
        const { label, Icon } = AXIS_META[axis];
        const active = value[axis] ?? [];
        return (
          <div key={axis} className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/70 mr-1">
              <Icon className="w-3 h-3" />
              {label}
            </span>
            {opts.map((o) => {
              const selected = active.includes(o.value);
              return (
                <button
                  key={`${axis}:${o.value}`}
                  type="button"
                  onClick={() => toggle(axis, o.value)}
                  className={[
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors",
                    "border",
                    selected
                      ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/70"
                      : "bg-[#FDFBF7] text-[#1A1A1A]/80 border-[#B89555]/25 hover:bg-[#F7F2EA]",
                  ].join(" ")}
                  aria-pressed={selected}
                >
                  <span className="truncate max-w-[180px]">{o.label}</span>
                  {typeof o.count === "number" && (
                    <span className="text-[10px] text-[#1A1A1A]/60">{o.count}</span>
                  )}
                  {selected && <X className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        );
      })}

      {totalActive > 0 && (
        <div className="flex">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-[#1A1A1A]/70"
            onClick={() => onChange(EMPTY_SOURCE_FILTER)}
          >
            Clear source filters ({totalActive})
          </Button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Predicate helpers — keep filtering logic next to the chip UI
 * so every CRM list applies the exact same matching rules.
 * ============================================================ */

export interface SourcePredicateContext {
  /** Maps row.id → array of campaign_id the row was a recipient of. */
  campaignsByRowId?: Map<string, Set<string>>;
  /** Maps row.assigned_to/owner_id → array of team_id memberships. */
  teamsByUserId?: Map<string, Set<string>>;
}

export function rowMatchesSourceFilter(
  row: any,
  filter: SourceFilterValue,
  ctx: SourcePredicateContext = {},
): boolean {
  if (filter.upload_source.length) {
    const v = String(row?.upload_source ?? "").trim();
    if (!v || !filter.upload_source.includes(v)) return false;
  }
  if (filter.database_source.length) {
    const v = String(row?.database_source ?? "").trim();
    if (!v || !filter.database_source.includes(v)) return false;
  }
  if (filter.country.length) {
    let v = String(row?.country ?? "").trim();
    if (!v) v = row?.region === "UAE" ? "United Arab Emirates" : String(row?.region ?? "");
    if (!v || !filter.country.includes(v)) return false;
  }
  if (filter.team.length) {
    const userId = row?.assigned_to ?? row?.owner_id ?? row?.user_id;
    const teamIds = userId ? ctx.teamsByUserId?.get(userId) : undefined;
    if (!teamIds || !filter.team.some((t) => teamIds.has(t))) return false;
  }
  if (filter.campaign.length) {
    const rowId = row?.id ?? row?.lead_id;
    const campaignIds = rowId ? ctx.campaignsByRowId?.get(rowId) : undefined;
    if (!campaignIds || !filter.campaign.some((c) => campaignIds.has(c))) return false;
  }
  return true;
}

/**
 * Lazily fetches the lookup maps required by team / campaign filters.
 * Returns stable empty maps until queries resolve so callers can call this
 * unconditionally without changing their useMemo dependency surface.
 */
export function useSourceFilterContext(filter: SourceFilterValue): SourcePredicateContext {
  const [ctx, setCtx] = useState<SourcePredicateContext>({});
  const teamsKey = filter.team.join("|");
  const campaignsKey = filter.campaign.join("|");

  useEffect(() => {
    let cancelled = false;
    async function loadTeams() {
      if (!filter.team.length) return new Map<string, Set<string>>();
      const { data } = await (supabase as any)
        .from("team_members")
        .select("team_id, user_id")
        .in("team_id", filter.team);
      const m = new Map<string, Set<string>>();
      for (const r of (data as any[]) ?? []) {
        const set = m.get(r.user_id) ?? new Set<string>();
        set.add(r.team_id);
        m.set(r.user_id, set);
      }
      return m;
    }
    async function loadCampaigns() {
      if (!filter.campaign.length) return new Map<string, Set<string>>();
      const { data } = await (supabase as any)
        .from("crm_campaign_recipients")
        .select("campaign_id, lead_id")
        .in("campaign_id", filter.campaign);
      const m = new Map<string, Set<string>>();
      for (const r of (data as any[]) ?? []) {
        if (!r.lead_id) continue;
        const set = m.get(r.lead_id) ?? new Set<string>();
        set.add(r.campaign_id);
        m.set(r.lead_id, set);
      }
      return m;
    }
    Promise.all([loadTeams(), loadCampaigns()]).then(([teamsByUserId, campaignsByRowId]) => {
      if (cancelled) return;
      setCtx({ teamsByUserId, campaignsByRowId });
    });
    return () => {
      cancelled = true;
    };
  }, [teamsKey, campaignsKey, filter.team, filter.campaign]);

  return ctx;
}

export default SourceFilterChips;
