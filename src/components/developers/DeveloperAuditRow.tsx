import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getDeveloperLogoUrl, getKnownDeveloperLogoUrl } from "@/utils/developerLogo";
import { getVerifiedDeveloperFlagship, isUsableDeveloperCover } from "@/utils/developerFlagshipMedia";
import type { Developer } from "@/hooks/useProjects";

interface Props {
  developer: Developer;
  projectCount?: number;
  heroImageUrl?: string;
  heroImageUrls?: string[];
  /** Owner-only: media gap badges live in the backend Developer Hub, never on the public site. */
  showAuditFlags?: boolean;
}

/**
 * Dense single-line directory row used by the owner list view so missing
 * logos and missing cover photography can be scanned quickly.
 */
const DeveloperAuditRow = ({ developer, projectCount = 0, heroImageUrl, heroImageUrls = [], showAuditFlags = false }: Props) => {
  const logoUrl = getDeveloperLogoUrl(developer) || getKnownDeveloperLogoUrl(developer.name);
  const cover = [
    getVerifiedDeveloperFlagship(developer.name, developer.slug),
    (developer as { feature_image_url?: string | null }).feature_image_url || undefined,
    ...heroImageUrls,
    heroImageUrl,
  ].find((value): value is string => Boolean(value) && value !== logoUrl && isUsableDeveloperCover(value));

  return (
    <Link
      to={`/developer/${developer.slug}`}
      data-developer-audit-row="true"
      data-developer-name={developer.name}
      className="grid min-h-[142px] grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 rounded-xl bg-white border border-[#B89555]/25 p-4 hover:border-[#B89555] transition-colors"
    >
      <div className="h-14 w-24 shrink-0">
        <DeveloperLogo
          variant="bare"
          src={logoUrl}
          name={developer.name}
          alt={`${developer.name} logo`}
          websiteUrl={(developer as { website_url?: string | null }).website_url}
          needsInvert={(developer as { logo_needs_invert?: boolean | null }).logo_needs_invert}
          loading="lazy"
          size="sm"
          className="!h-full !w-full !p-0 !rounded-md"
        />
      </div>

      <div className="h-14 w-full min-w-0 rounded-md overflow-hidden bg-[#F5F0E6]">
        {cover ? (
          <img
            src={cover}
            alt={`${developer.name} project`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <span className="developer-name-shine col-span-2 !text-[#B89555] text-base font-bold break-words">
        {developer.name}
      </span>

      <span className="col-span-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0A0A0A]/70">
        {developer.founded_year ? `Est. ${developer.founded_year}` : ""}
        {projectCount > 0 ? `${developer.founded_year ? " · " : ""}${projectCount} projects` : ""}
      </span>

      <span className="col-span-2 flex items-center justify-end gap-2">
        {showAuditFlags && !logoUrl ? (
          <span className="rounded-md bg-[#7C2D12] text-white text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1">
            No logo
          </span>
        ) : null}
        {showAuditFlags && !cover ? (
          <span className="rounded-md bg-[#4C1D95] text-white text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1">
            No photo
          </span>
        ) : null}
        <ArrowRight className="w-4 h-4 text-[#8A6D2F]" />
      </span>
    </Link>
  );
};

export default DeveloperAuditRow;
