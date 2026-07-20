import { formatDistanceToNow } from "date-fns";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Project } from "@/hooks/useProjects";
import FavoriteButton from "./FavoriteButton";
import ShortlistBadgeButton from "./ShortlistBadgeButton";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { VerifiedMedia } from "@/components/ui/verified-media";
import { Button } from "@/components/ui/button";
import { DeveloperLink } from "@/components/ui/developer-link";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getDeveloperLogoUrl, getDeveloperWebsiteUrl, getKnownDeveloperLogoUrl, getKnownDeveloperWebsiteUrl } from "@/utils/developerLogo";
import { normalizeProvidentImageUrl } from "@/lib/imageUtils";
import { isValidImageUrl } from "@/lib/imageUtils";
import { sanitizeForDisplay } from "@/utils/contentSanitizer";
import { deriveHandover } from "@/utils/handoverDerivation";
import { CardBadge, resolveSaleStatusLabel } from "@/components/ui/card-badge";
import { useUserRole } from "@/hooks/useUserRole";
import OwnerCardEditMenu from "@/components/cards/OwnerCardEditMenu";
import { CardPricePaymentRow } from "@/components/ui/card-price-payment-row";
import { formatBedroomRange } from "@/utils/formatBedroomRange";

const VERIFIED_CARD_MEDIA: Record<string, string> = {
  "a0d78087-ad89-4532-b237-8795aaa9524f": "https://api.reelly.io/vault/ZZLvFZFt/2vU167fSNHhf_s4DDM9mNt6fU68/04w3Yw../5.jpg",
  "90fc0ae7-faba-46e3-b3c0-2542c1da421d": "https://alhamra.ae/media/rkipmlry/al-hamra-village-1-min.jpg?width=475&height=398",
  "b11e3102-dfe7-4380-8c12-a1910d365570": "https://aigentsrealty.b-cdn.net/projects/al-warqa-a/gallery/image-1-b6983f.jpg",
  "a3c5185e-6fdf-48b7-99a1-725ee04fa17f": "https://palladium.ae/api/media/file/Main%20amazonia.jpg?2026-04-17T15:51:15.933Z",
  "f765e006-eb3e-4d3e-b23f-fe62663946fb": "https://api.reelly.io/vault/ZZLvFZFt/5pq_NC53VNHtDcO8J9G_Jhe5kPQ/mMA_yw../8.jpg",
  "dfbb65a3-638a-4a40-94ae-3931da2c26c1": "https://vincitorerealty.com/wp-content/uploads/2025/04/Amenities-Desktop-1920-x-1080px-11.jpg",
  "7a6aa14a-782d-44bc-830a-632632f9040f": "https://api.reelly.io/vault/ZZLvFZFt/9x-U-nqwmBXJC8YMzrU7rQ2-ILA/ttR1Ew../cover.png",
  "d2742cef-6cd5-470f-b83b-e943a74b1d23": "https://api.reelly.io/vault/ZZLvFZFt/lwyFq2OzEn-fHW9TEyMH2ghxVw4/QMGPcA../2.jpg",
  "87ae334f-64c7-42d8-9c76-fbc82b1403de": "https://waedproperties.com/wp-content/uploads/2025/05/01_Gallery_2-1024x512.webp",
};

interface ProjectCardProps {
  project: Project & { is_sold_out?: boolean | null; show_sale_status?: boolean | null };
  showFavorite?: boolean;
  showBadgeButton?: boolean;
  currency?: string;
  sizeUnit?: 'sqft' | 'sqm';
  /** Mark as above-the-fold (LCP) — first 1–3 cards in a grid. */
  priority?: boolean;
}

// Projects that should show "New" status label (only these specific ones)
const PROJECTS_WITH_NEW_STATUS = [
  'sobha sanctuary',
  'mercedes-benz by binghatti',
  'mercedes-benz places by binghatti'
];

const shouldShowNewStatus = (projectName: string): boolean => {
  const normalized = projectName.toLowerCase().trim();
  return PROJECTS_WITH_NEW_STATUS.some(p => normalized.includes(p) || p.includes(normalized));
};

const PROPERTY_TYPE_ONLY_LABELS = new Set([
  'apartment', 'apartments', 'villa', 'villas', 'townhouse', 'townhouses',
  'penthouse', 'penthouses', 'studio', 'studios', 'duplex', 'duplexes',
]);

const isPropertyTypeOnlyLabel = (value?: string | null) => {
  if (!value) return false;
  return PROPERTY_TYPE_ONLY_LABELS.has(value.trim().toLowerCase());
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanCardProjectName = (name: string, developerName?: string | null) => {
  const genericClean = name.replace(/^in\s+(?=[a-z0-9])/i, "").trim();
  if (!developerName) return genericClean || name;
  const developer = developerName.trim();
  if (!developer) return genericClean || name;
  // Some imported rows were prefixed as "In Binghatti ...". Keep the real
  // project name on cards without mutating unrelated titles.
  const brokenPrefix = new RegExp(`^in\\s+(?=${escapeRegExp(developer)}\\b)`, "i");
  return name.replace(brokenPrefix, "").replace(/^in\s+(?=[a-z0-9])/i, "").trim() || name;
};

const getCardPhaseLabel = (project: Project & { is_sold_out?: boolean | null }): string | null => {
  const source = [project.status_label, (project as any).sale_status, (project as any).status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!source || project.is_sold_out || source.includes("sold")) return null;
  if (source.includes("eoi") || source.includes("expression of interest")) return "EOI";
  if (source.includes("presale") || source.includes("pre-sale") || source.includes("pre sale")) return "Pre-sale";
  if (source.includes("on sale") || source.includes("selling")) return "On Sale";
  if (source.includes("ready") || source.includes("complete") || source.includes("delivered")) return "Ready";
  if (source.includes("announce")) return "Announced";
  if (source.includes("launch")) return "Launch";
  return null;
};

// Sale status label resolver — visual style is owned by <CardBadge variant="status" />.
const getSaleStatusLabel = resolveSaleStatusLabel;

const ProjectCard = ({ project, showFavorite = true, showBadgeButton = true, currency = 'AED', sizeUnit = 'sqft', priority = false }: ProjectCardProps) => {
  const { isOwner } = useUserRole();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Single static cover — carousel arrows are banned on cards (gallery only).
  const images = project.images || [];
  const rawPrimary = [
    VERIFIED_CARD_MEDIA[project.id],
    (project as any).card_image_url,
    (project as any).gallery_start_image_url,
    project.cover_image_url,
    (project as any).hero_image_url,
    images[0]?.image_url,
    images.find((i: any) => isValidImageUrl(i?.image_url))?.image_url,
  ].find(isValidImageUrl) || null;
  const primaryImageUrl = rawPrimary ? normalizeProvidentImageUrl(rawPrimary, priority ? "928x624" : "464x312") : null;
  const rawDeveloperName = project.developer?.name || project.developer_name || null;
  const developerName = isPropertyTypeOnlyLabel(rawDeveloperName) ? null : rawDeveloperName;
  const displayProjectName = cleanCardProjectName(project.name, developerName);
  const developerSlug = project.developer?.slug || null;
  const developerLogoUrl = getDeveloperLogoUrl(project.developer as any) || getKnownDeveloperLogoUrl(developerName);
  const developerWebsiteUrl = getDeveloperWebsiteUrl(project.developer as any) || getKnownDeveloperWebsiteUrl(developerName);
  const developerHref = developerName
    ? developerSlug
      ? `/developer/${developerSlug}`
      : `/developers?search=${encodeURIComponent(developerName)}`
    : null;

  const whatsappMessage = `Hello JBJ Global Real Estate,\n\nI am interested in ${project.name} located in ${project.location || 'UAE'}.\n\nPlease provide more details about this property.\n\nThank you.`;
  const whatsappHref = getWhatsAppUrl(whatsappMessage);
  const callHref = getCallUrl();

  // Get formatted bedrooms text
  const getBedroomsText = () => {
    if (!project.bedrooms_min) return null;
    if (project.bedrooms_min === project.bedrooms_max) {
      return `${project.bedrooms_min} BR`;
    }
    return `${project.bedrooms_min}-${project.bedrooms_max} BR`;
  };

  // Get unit types as a RANGE (Studio - 4 BR) — never an enumerated list.
  // See src/utils/formatBedroomRange.ts for the locked rule.
  const getUnitTypesText = () => formatBedroomRange(project as any);

  // Get size range text
  const getSizeText = () => {
    if (!project.size_min) return null;
    const min = project.size_min.toLocaleString();
    const max = project.size_max?.toLocaleString();
    if (min === max || !max) return `${min} ${sizeUnit}`;
    return `${min}-${max} ${sizeUnit}`;
  };

  // Truncate description for card preview - strip HTML + competitor refs
  const getTruncatedDescription = () => {
    const source = project.description || (project as any).short_description || null;
    if (!source) return null;
    let clean = sanitizeForDisplay(source)
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*{1,3}/g, '')
      .replace(/project\s*general\s*facts/gi, '')
      .replace(/project\s*overview/gi, '')
      .replace(/^[\s:—–-]+/, '')
      .trim();
    const maxLength = 80;
    if (clean.length <= maxLength) return clean;
    return `${clean.substring(0, maxLength).trim()}…`;
  };

  // Determine if we should show status label (from source data)
  const getStatusLabel = () => {
    // Only show "New" for specific projects
    if (shouldShowNewStatus(project.name)) {
      return "New";
    }
    // Show other status labels from source (Future Launch, New Phase, etc.)
    if (project.status_label && project.status_label !== "New") {
      return project.status_label;
    }
    return null;
  };

  const statusLabel = getStatusLabel();
  const saleStatusLabel = getSaleStatusLabel(project.status_label);
  const truncatedDescription = getTruncatedDescription();
  const badgePosition = 'top-3 left-3';
  const projectHref = `/project/${project.slug}`;
  const openProject = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button,[role="button"],input,textarea,select,[data-card-actions-overlay]')) return;
    if (target?.closest('a') && !target.closest('a[href^="/project/"]')) return;
    navigate(projectHref);
  };

  return (
    <div
      data-surface="champagne"
      data-area-project-card="true"
      role="link"
      tabIndex={0}
      onClick={openProject}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(projectHref);
        }
      }}
        className={
        "surface-champagne group relative overflow-hidden rounded-2xl border border-[#B89555]/70 transition-all duration-300 flex flex-col " +
        "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] " +
        "shadow-[0_18px_55px_rgba(0,0,0,0.16),0_0_18px_rgba(184,149,85,0.16)] hover:border-[#B89555] " +
        "hover:shadow-[0_26px_75px_rgba(0,0,0,0.20),0_0_26px_rgba(184,149,85,0.28)]"
      }
      style={{ borderColor: '#B89555' }}
    >
      {/* Top-right project actions — hidden until card hover/focus.
          Row 1: favorite + shortlist. Row 2: badge aligned exactly under shortlist. */}
      {/* Top-right project actions — always visible; z-40 so the owner pencil
          overlay never blocks the shortlist / favorite hit-area. */}
      <div
        className="absolute top-3 right-3 z-40 flex flex-col items-end gap-1.5 pointer-events-none"
        data-no-contrast-guard
        data-card-actions-overlay=""
      >
        {showFavorite && (
          <div className="pointer-events-auto">
            <FavoriteButton projectId={project.id} size="md" />
          </div>
        )}
        {showBadgeButton && (
          <div className="pointer-events-auto">
            <ShortlistBadgeButton
              projectId={project.id}
              size="md"
              showBadgeIndicator={false}
              className="justify-end"
            />
          </div>
        )}
      </div>


      {/* Owner edit affordance — tucked under the actions stack so it never
          overlays the shortlist button. Owners only. */}
      <div className="absolute top-3 right-3 z-30" data-no-contrast-guard>
        <OwnerCardEditMenu
          projectId={project.id}
          slug={project.slug}
          saleStatus={project.status_label}
          showSaleStatus={(project as any).show_sale_status}
          className="mt-[110px]"
        />
      </div>

      {/* LOCKED: card top-left is developer identity only — never property-type labels.
          Reelly-style position: the plate straddles the photo/content seam (half on
          image, half on body) just above the title. Implemented with a sibling overlay
          div that mirrors the image aspect ratio (16/10) so we can anchor at its
          bottom edge without nesting anchors. */}
      {developerName && developerHref && (
        <div className="absolute inset-x-0 top-0 aspect-[16/10] pointer-events-none z-30">
          <Link
            to={developerHref}
            className="absolute left-4 bottom-0 translate-y-1/2 inline-flex pointer-events-auto"
            aria-label={`View ${developerName}`}
            onClick={(e) => e.stopPropagation()}
            data-no-contrast-guard
          >
            <DeveloperLogo
              src={developerLogoUrl}
              alt={developerName}
              variant={developerLogoUrl ? "bare" : "nameplate"}
              name={developerName}
              websiteUrl={developerWebsiteUrl}
              loading={priority ? "eager" : "lazy"}
            />
          </Link>
        </div>
      )}


      <Link to={projectHref} className="flex-1 flex flex-col">
        {/* Image — static cover, NO carousel arrows on cards (gallery only). */}
          <div className="surface-ink aspect-[16/10] overflow-hidden relative bg-[#021611]" data-surface="ink">
          <VerifiedMedia
            src={primaryImageUrl}
            alt={
              images[0]?.alt_text ||
              [project.name, developerName ? `by ${developerName}` : null, project.area_name || null]
                .filter(Boolean)
                .join(' — ') || project.name
            }
            className="object-cover object-left w-[calc(100%+10px)] h-[calc(100%+8px)] max-w-none -ml-[6px] -mt-[4px]"
            placeholderLabel=""
            priority={priority}
            loggerComponent="ProjectCard"
            loggerContext={{
              projectId: project.id,
              slug: project.slug,
              name: project.name,
            }}
          />

          {/* Reelly-style top-left badge row: EOI + handover quarter.
              Two compact ink/glass pills sitting on the photo, above the
              developer logo. Hidden when project is "Ready" (which on the
              homepage should never happen — off-plan only). */}
          {(() => {
            const raw = deriveHandover(project);
            // Format raw handover into Reelly-style "Q# YYYY".
            const formatHandover = (v: string | null): string | null => {
              if (!v) return null;
              const s = v.trim();
              if (/^ready$/i.test(s)) return "Ready";
              // Already "Q# YYYY"
              const qm = s.match(/Q\s?([1-4])\s*[\/\-\s]?\s*(20\d{2})/i);
              if (qm) return `Q${qm[1]} ${qm[2]}`;
              // ISO / parseable date → derive quarter
              const d = new Date(s);
              if (!Number.isNaN(d.getTime())) {
                const q = Math.floor(d.getMonth() / 3) + 1;
                return `Q${q} ${d.getFullYear()}`;
              }
              // Bare year
              const ym = s.match(/^(20\d{2})$/);
              if (ym) return ym[1];
              return s;
            };
            const handover = formatHandover(raw);
            const phaseLabel = getCardPhaseLabel(project);
            const showHandover = Boolean(handover && handover !== phaseLabel);
            if (!phaseLabel && !showHandover) return null;
            return (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                {phaseLabel && (
                  <span
                    data-surface="emerald"
                    data-emerald="true"
                    data-emerald-ok="badge"
                    className="jj-emerald-metallic inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-[0.12em] uppercase text-white [&_*]:text-white"
                  >
                    <span className="text-white">{phaseLabel}</span>
                  </span>
                )}
                {showHandover && (
                  <span
                    data-surface="emerald"
                    data-emerald="true"
                    data-emerald-ok="badge"
                    className="jj-emerald-metallic inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tabular-nums tracking-wide text-white [&_*]:text-white"
                  >
                    <span className={`text-white ${/^ready$/i.test(handover) ? "uppercase tracking-[0.12em]" : ""}`}>{handover}</span>
                  </span>
                )}
              </div>
            );
          })()}

          {/* Sale Status Badge — opt-in (owner toggles `show_sale_status`).
              Rectangular gold-frame style to match the price pill. */}
          {(project as any).show_sale_status && saleStatusLabel && !project.is_sold_out && !project.status_label?.toLowerCase().includes('sold') && (
            <CardBadge variant="status-frame" className="absolute bottom-3 left-3 z-10">
              {saleStatusLabel}
            </CardBadge>
          )}

          {/* Owner rule: NEVER render a "Sold Out" badge on public cards.
              Sold-out off-plan inventory remains discoverable on the secondary
              market — surfacing a sold-out label kills conversion. The badge
              is intentionally removed globally; sold-out off-plan rows are
              still filtered out of recommendation lists upstream. */}
        </div>


        {/* Content — consistent 4px-grid spacing.
            Every row below reserves a fixed min-height so cards stay
            pixel-identical even when properties have missing/short
            location, unit-types, size, developer, or description. */}
        <div className="p-5 pt-10 flex-1 flex flex-col gap-2">
          {/* Header block — title (always 2 lines) + location (always 1 line) */}
          <div className="flex flex-col gap-1">
            <h4 data-area-card-text className="text-lg font-bold break-words leading-tight line-clamp-2 min-h-[2.75rem] transition-colors" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>
              {displayProjectName}
            </h4>
            <div data-area-card-location className="flex items-center gap-1.5 text-sm font-medium min-h-[1.25rem]" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>
              {project.location && (
                <>
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#064E3B', stroke: '#064E3B' }} aria-hidden="true" />
                  <span className="truncate" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>{project.location}</span>
                </>
              )}
            </div>
          </div>

          {/* Detail metadata above developer name — slot ALWAYS reserved so
              cards with and without bedrooms/size stay row-aligned across
              the grid. Empty placeholder when no unit/size data. */}
          <div
            data-no-contrast-guard
            data-area-card-meta
            style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}
            className="flex items-center gap-2 text-xs font-medium whitespace-nowrap overflow-hidden min-h-[1.25rem]"
          >
            {getUnitTypesText() && (
              <span className="font-semibold truncate" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>{getUnitTypesText()}</span>
            )}
            {getUnitTypesText() && getSizeText() && (
              <span className="text-[#064E3B] flex-shrink-0" aria-hidden="true">|</span>
            )}
            {getSizeText() && <span className="truncate" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>{getSizeText()}</span>}
          </div>


          {/* Developer link — reserved 1-line slot so cards without a
              developer still match cards that have one. */}
          <div className="min-h-[1.25rem]">
            {developerName && (
              <DeveloperLink
                name={developerName}
                slug={developerSlug}
                logoUrl={developerLogoUrl}
                className="text-sm block"
                showPrefix={true}
              />
            )}
          </div>

          <p
            data-area-card-description
            className="min-h-[2.625rem] text-sm leading-snug line-clamp-2"
            style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}
          >
            {truncatedDescription || ""}
          </p>

          {/* Bottom group — pinned to card bottom so price rows align across
              every card regardless of content length above. */}
          <div className="mt-auto flex flex-col gap-3 pt-1">
            {/* Thin gold hairline — separates developer/description from bottom row */}
            <div className="w-full border-t border-[#B89555]" />

            {/* Bottom row — price only. Handover lives beside EOI on the photo. */}
            <CardPricePaymentRow
              price={project.price_from}
              currency={currency}
              project={project as any}
            />
          </div>


          {/* Handover quarter is now shown as a Reelly-style pill on the
              image (top-left), so the redundant bottom line is removed. */}



          {/* Owner-only diagnostic — Updated date hidden from public */}
          {isOwner && (project as any).updated_at && (
            <div className="flex items-center justify-between gap-2 min-h-[24px]">
              <p className="text-[10px] text-[#0A0A0A]/70 font-medium">
                Updated {formatDistanceToNow(new Date((project as any).updated_at), { addSuffix: true })}
              </p>
            </div>
          )}
        </div>
      </Link>

      {/* CTA Buttons — Email, Call, WhatsApp. Premium rectangular emerald tiles. */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2 border-t border-[#B89555]/70 pt-3">
          <a
            href={`mailto:${CONTACT_INFO.email}?subject=Inquiry: ${encodeURIComponent(project.name)}&body=${encodeURIComponent(`Hello JBJ Global Real Estate,\n\nI am interested in ${project.name}${project.location ? ` located in ${project.location}` : ''}.\n\nPlease provide more details.\n\nThank you.`)}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Email about ${project.name}`}
            data-surface="emerald"
            data-emerald-ok="button"
                className="jj-emerald-metallic jj-card-cta-metallic w-full min-w-0 overflow-hidden h-9 px-2 flex items-center justify-center gap-1.5 rounded-lg"
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-white allow-white" stroke="#FFFFFF" aria-hidden="true" />
            <span className="truncate text-xs font-semibold text-white allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Email</span>
          </a>
          <a
            href={callHref}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Call about ${project.name}`}
            data-surface="emerald"
            data-emerald-ok="button"
            className="jj-emerald-metallic jj-card-cta-metallic w-full min-w-0 overflow-hidden h-9 px-2 flex items-center justify-center gap-1.5 rounded-lg"
          >
            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-white allow-white" stroke="#FFFFFF" aria-hidden="true" />
            <span className="truncate text-xs font-semibold text-white allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Call</span>
          </a>
          <a
            href={whatsappHref}
            onClick={(e) => e.stopPropagation()}
            aria-label={`WhatsApp about ${project.name}`}
            data-surface="emerald"
            data-emerald-ok="button"
            className="jj-emerald-metallic jj-card-cta-metallic w-full min-w-0 overflow-hidden h-9 px-2 flex items-center justify-center gap-1.5 rounded-lg"
          >
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 text-white allow-white" stroke="#FFFFFF" aria-hidden="true" />
            <span className="truncate text-xs font-semibold text-white allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Chat</span>

          </a>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
