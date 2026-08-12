/**
 * DeveloperIncludeExclude — multi-select developer picker for the unified
 * search bar. Thin adapter over FilterMultiSelect so Areas, Devs and Tiers all
 * behave and look identical: emerald tick to include, red minus to exclude.
 *
 * Each row carries the developer's own logo plate at one fixed size, so the
 * column is aligned edge for edge regardless of brand artwork.
 */
import { useMemo } from "react";
import { useDevelopers } from "@/hooks/useProjects";
import { compareDevelopersByPriority } from "@/utils/developerTier";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import FilterMultiSelect, { type FilterOption } from "./FilterMultiSelect";

interface Props {
  include: string[];
  exclude: string[];
  onChange: (next: { include: string[]; exclude: string[] }) => void;
}

export default function DeveloperIncludeExclude({ include, exclude, onChange }: Props) {
  const { data: developers, isLoading } = useDevelopers();

  const options = useMemo<FilterOption[]>(() => {
    const rows = (developers || []).filter((d: { name?: string | null }) => Boolean(d.name));
    const sorted = rows.slice().sort(compareDevelopersByPriority);
    const seen = new Set<string>();
    const out: FilterOption[] = [];
    for (const d of sorted as Array<{ name: string; website_url?: string | null }>) {
      const key = d.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        value: d.name,
        label: d.name,
        media: (
          <DeveloperLogo
            src={getDeveloperLogoUrl(d as never)}
            name={d.name}
            websiteUrl={d.website_url ?? null}
            variant="bare"
            size="micro"
            loading="lazy"
            className="h-6 w-12 shrink-0"
          />
        ),
      });
    }
    return out;
  }, [developers]);

  return (
    <FilterMultiSelect
      options={options}
      include={include}
      exclude={exclude}
      onChange={onChange}
      searchable
      searchPlaceholder="Search developer"
      loading={isLoading && options.length === 0}
      emptyLabel="No developer matches"
      clearLabel="Clear developers"
      width={340}
    />
  );
}
