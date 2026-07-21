/**
 * DLDFilterDropdown — mirrors DLD's exact classification menu.
 *
 * Categories match the DLD public list dropdown 1:1:
 *   All · Sale · Lease · Mortgage · Offices · Nationals · Group A · By Project · By Area
 *
 * The "Offices" option is only shown on the Brokerages tab (per DLD's real UI).
 * "By Project" and "By Area" reveal a searchable sub-picker below the menu.
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type DLDCategory =
  | "all"
  | "sale"
  | "lease"
  | "mortgage"
  | "offices"
  | "nationals"
  | "group_a"
  | "by_project"
  | "by_area";

export interface DLDFilterValue {
  category: DLDCategory;
  /** When category is `by_area` or `by_project`, the selected value. */
  detail?: string | null;
}

interface Props {
  value: DLDFilterValue;
  onChange: (next: DLDFilterValue) => void;
  /** Show the "Offices" option (brokerages tab only). */
  showOffices?: boolean;
  /** Options for the By Area sub-picker. */
  areaOptions?: string[];
  /** Options for the By Project sub-picker. */
  projectOptions?: string[];
}

const LABELS: Record<DLDCategory, string> = {
  all: "All",
  sale: "Sale",
  lease: "Lease",
  mortgage: "Mortgage",
  offices: "Offices",
  nationals: "Nationals",
  group_a: "Group A",
  by_project: "By Project",
  by_area: "By Area",
};

export function categoryLabel(v: DLDFilterValue): string {
  if (v.category === "by_area" && v.detail) return `Area: ${v.detail}`;
  if (v.category === "by_project" && v.detail) return `Project: ${v.detail}`;
  return LABELS[v.category];
}

export function DLDFilterDropdown({
  value,
  onChange,
  showOffices = false,
  areaOptions = [],
  projectOptions = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [subQuery, setSubQuery] = useState("");

  const items: DLDCategory[] = useMemo(() => {
    const base: DLDCategory[] = [
      "all",
      "sale",
      "lease",
      "mortgage",
      "offices",
      "nationals",
      "group_a",
      "by_project",
      "by_area",
    ];
    return showOffices ? base : base.filter((k) => k !== "offices");
  }, [showOffices]);

  const filteredAreas = useMemo(() => {
    const q = subQuery.trim().toLowerCase();
    return q ? areaOptions.filter((a) => a.toLowerCase().includes(q)) : areaOptions;
  }, [subQuery, areaOptions]);

  const filteredProjects = useMemo(() => {
    const q = subQuery.trim().toLowerCase();
    return q ? projectOptions.filter((a) => a.toLowerCase().includes(q)) : projectOptions;
  }, [subQuery, projectOptions]);

  const needsSub = value.category === "by_area" || value.category === "by_project";
  const subList = value.category === "by_area" ? filteredAreas : filteredProjects;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-9 gap-2 rounded-md border font-semibold text-[13px]",
            "border-[#064E3B]/40 bg-white text-[#0F1A16] hover:bg-[#F7F1E4]/60",
          )}
        >
          <span className="text-[#0F1A16]">{categoryLabel(value)}</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[260px] p-0 bg-white border border-[#064E3B]/25 rounded-md shadow-lg"
      >
        <div className="p-1 max-h-[340px] overflow-y-auto">
          {items.map((k) => {
            const active = value.category === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === "by_area" || k === "by_project") {
                    onChange({ category: k, detail: null });
                    setSubQuery("");
                  } else {
                    onChange({ category: k });
                    setOpen(false);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-left text-[13px] rounded",
                  active
                    ? "bg-[#064E3B] text-white font-black"
                    : "text-[#0F1A16] hover:bg-[#F7F1E4]/70",
                )}
              >
                <span>{LABELS[k]}</span>
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>

        {needsSub && (
          <div className="border-t border-[#064E3B]/15 p-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5D55]" />
              <Input
                autoFocus
                value={subQuery}
                onChange={(e) => setSubQuery(e.target.value)}
                placeholder={value.category === "by_area" ? "Search area…" : "Search project…"}
                className="pl-8 h-8 text-[12px] bg-white border-[#064E3B]/25"
              />
            </div>
            <div className="max-h-[180px] overflow-y-auto">
              {subList.length === 0 && (
                <p className="px-2 py-3 text-[12px] text-[#4B5D55] italic">
                  No {value.category === "by_area" ? "areas" : "projects"} yet — data will populate after the first DLD sync.
                </p>
              )}
              {subList.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onChange({ category: value.category, detail: s });
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-[12px] rounded",
                    value.detail === s
                      ? "bg-[#064E3B] text-white font-black"
                      : "text-[#0F1A16] hover:bg-[#F7F1E4]/70",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default DLDFilterDropdown;
