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
}

/**
 * Dense single-line directory row used by the owner list view so missing
 * logos and missing cover photography can be scanned quickly.
 */
const DeveloperAuditRow = ({ developer, projectCount = 0, heroImageUrl, heroImageUrls = [] }: Props) => {
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
      className="flex items-center gap-4 rounded-xl bg-white border border-[#B89555]/25 px-3 py-2.5 hover:border-[#B89555] transition-colors"
    >
      <div className="h-11 w-24 shrink-0">
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

      <div className="h-11 w-20 shrink-0 rounded-md overflow-hidden bg-[#F5F0E6]">
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

      <span className="developer-name-shine !text-[#B89555] text-[13px] font-bold">
        {developer.name}
      </span>

      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#0A0A0A]/60 whitespace-nowrap">
        {developer.founded_year ? `Est. ${developer.founded_year}` : ""}
        {projectCount > 0 ? `${developer.founded_year ? " · " : ""}${projectCount} projects` : ""}
      </span>

      <span className="ml-auto flex items-center gap-2">
        {!logoUrl ? (
          <span className="rounded-md bg-[#7C2D12] text-white text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1">
            No logo
          </span>
        ) : null}
        {!cover ? (
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
