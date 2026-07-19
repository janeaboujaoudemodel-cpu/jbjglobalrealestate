/**
 * Structured Country → Emirate/Region → Areas breakdown for a developer.
 * Replaces the flat "Dubai Projects Areas" comma-blob with a proper
 * professional layout so the owner can see at a glance where the developer
 * has projects, per Emirate (for UAE) and per country.
 *
 * Read-only display sourced from `developers.custom_fields.*_projects_areas`.
 */
import { MapPin, Globe2 } from "lucide-react";
import { buildFootprintFromCustomFields } from "@/utils/developerProjectsFootprint";

interface Props {
  customFields: Record<string, unknown> | null | undefined;
}

export default function DeveloperProjectsFootprint({ customFields }: Props) {
  const countries = buildFootprintFromCustomFields(customFields);
  if (!countries.length) return null;

  return (
    <div className="rounded-xl border border-[#B89555]/40 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Globe2 className="w-4 h-4 text-[#B89555]" />
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70">
          Projects footprint
        </p>
        <span className="text-[10px] text-[#1A1A1A]/50">
          · imported from the Excel database, grouped per country
        </span>
      </div>

      <div className="space-y-3">
        {countries.map((c) => (
          <div key={c.country} className="rounded-lg border border-[#B89555]/25 bg-[#FDFBF7]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#B89555]/20">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[#1A1A1A]">{c.country}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50">
                  {c.buckets.length} {c.country === "United Arab Emirates" ? "Emirates" : "regions"} · {c.totalAreas} areas
                </span>
              </div>
            </div>
            <ul className="divide-y divide-[#B89555]/15">
              {c.buckets.map((bucket) => (
                <li key={bucket.region} className="px-3 py-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#064E3B]" />
                      <span className={`text-[12px] font-semibold ${bucket.needsReview ? "text-amber-700" : "text-[#064E3B]"}`}>
                        {bucket.region}
                      </span>
                      <span className="text-[10px] text-[#1A1A1A]/50">({bucket.areas.length})</span>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {bucket.areas.map((area) => (
                      <span
                        key={area}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-[#B89555]/30 text-[#1A1A1A]"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
