import { Link } from "react-router-dom";
import { Building2, ExternalLink, Award, ChevronDown, ChevronUp, Calendar, Briefcase, Sparkles, User, Layers, Star, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PearlButton } from "@/components/ui/pearl-button";
import { useState } from "react";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import InlineEditable from "@/components/project-detail/owner/InlineEditable";
import DeveloperLogoUploader from "@/components/project-detail/owner/DeveloperLogoUploader";
import DeveloperAboutPanel from "@/components/developer/DeveloperAboutPanel";
import { DeveloperLink } from "@/components/ui/developer-link";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";

type PublicFieldKey =
  | "instagram_url" | "linkedin_url" | "office_address" | "google_maps_url"
  | "office_phone" | "whatsapp" | "website_url" | "admin_email";

interface DeveloperInfoCardProps {
  developer: {
    id?: string | null;
    name: string;
    slug?: string | null;
    logo_url?: string | null;
    logo_url_processed?: string | null;
    founded_year?: number | null;
    completed_projects?: number | null;
    offplan_projects?: number | null;
    description?: string | null;
    headquarters?: string | null;
    website_url?: string | null;
    ceo_name?: string | null;
    total_units_delivered?: number | null;
    upcoming_units?: number | null;
    notable_projects?: string | null;
    parent_company?: string | null;
    specialization?: string | null;
    instagram_url?: string | null;
    linkedin_url?: string | null;
    office_address?: string | null;
    google_maps_url?: string | null;
    office_phone?: string | null;
    whatsapp?: string | null;
    admin_email?: string | null;
    public_fields?: Partial<Record<PublicFieldKey, boolean>> | null;
  } | null;
  projectName: string;
  projectCount?: number;
  editable?: boolean;
}

const DESCRIPTION_PREVIEW_LENGTH = 500;

const getDisplayLogoUrl = (developerName: string, logoUrl?: string | null) => {
  return logoUrl || null;
};

export default function DeveloperInfoCard({ developer, projectName, projectCount, editable }: DeveloperInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!developer) return null;

  const computedOffplanProjects = developer.offplan_projects ?? projectCount ?? null;
  const displayLogoUrl = getDisplayLogoUrl(developer.name, developer.logo_url);

  const stats = [
    { label: "Founded", value: developer.founded_year ? `${developer.founded_year.toLocaleString()}` : null, icon: Calendar },
    { label: "Completed", value: developer.completed_projects ? `${developer.completed_projects.toLocaleString()}+` : null, icon: Building2 },
    { label: "Off-plan", value: computedOffplanProjects ? `${computedOffplanProjects.toLocaleString()}+` : null, icon: Briefcase },
    { label: "Units Delivered", value: developer.total_units_delivered ? `${developer.total_units_delivered.toLocaleString()}+` : null, icon: Layers },
    { label: "Upcoming", value: developer.upcoming_units ? `${developer.upcoming_units.toLocaleString()}` : null, icon: Star },
  ].filter(s => s.value);

  const hasLongDescription = (developer.description?.length ?? 0) > DESCRIPTION_PREVIEW_LENGTH;
  const displayDescription = hasLongDescription && !isExpanded
    ? developer.description?.slice(0, DESCRIPTION_PREVIEW_LENGTH) + "..."
    : developer.description;

  return (
    <div className="w-full py-4 md:py-6 rounded-2xl">
      <div
        className="rounded-2xl border border-[#B89555]/35 p-5 md:p-7"
        style={{
          background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 62%, #EFE6D6 100%)',
          boxShadow: '0 10px 32px rgba(184,149,85,0.18), inset 0 1px 2px rgba(255,255,255,0.42)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[190px_minmax(0,1fr)] gap-6 md:gap-8 items-start">
            {/* Developer Logo (owner-editable) */}
            {editable && developer.id ? (
              <DeveloperLogoUploader
                developerId={developer.id}
                developerName={developer.name}
                logoUrl={developer.logo_url}
              />
            ) : (
              <DeveloperLogo
                src={displayLogoUrl}
                alt={`${developer.name} logo`}
                name={developer.name}
                websiteUrl={(developer as any).website_url}
                variant="bare"
                renderFallback
                className="!w-36 !h-36 !rounded-2xl !p-3 flex-shrink-0"
              />
            )}

            {/* Developer Info */}
            <div className="min-w-0">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                {editable && developer.id ? (
                  <InlineEditable
                    table="developers"
                    recordId={developer.id}
                    field="name"
                    value={developer.name}
                    invalidateKeys={["project", "projects", "developer", "developers"]}
                  >
                    <h3
                      data-developer-gold
                      className="developer-name-gold text-2xl md:text-[32px] font-bold leading-tight no-underline"
                    >
                      {developer.name}
                    </h3>
                  </InlineEditable>
                ) : (
                  <DeveloperLink
                    name={developer.name}
                    slug={developer.slug}
                    showPrefix={false}
                    className="text-2xl md:text-[32px] font-bold leading-tight"
                  />
                )}
                <Award className="w-6 h-6 text-[#064E3B]" aria-hidden />
              </div>


              {/* Quick meta line */}
              <div className="flex flex-wrap items-center gap-3 mb-5 text-sm text-[#1A1A1A]/70">
                {developer.specialization && (
                  <span className="px-3 py-1 rounded-full bg-[#EFE6D6]/10 border border-[#B89555]/30 text-xs font-semibold text-[#1A1A1A]">
                    {developer.specialization}
                  </span>
                )}
                {developer.ceo_name && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#1A1A1A]" />
                    {developer.ceo_name}
                  </span>
                )}
                {developer.parent_company && (
                  <span className="text-[#1A1A1A]/70">Part of {developer.parent_company}</span>
                )}
                {/* Owner-controlled public contact chips: render only fields with public_fields[key] === true */}
                <PublicContactChips developer={developer} />
                {/* Developer website intentionally hidden from public unless explicitly enabled by owner. */}
              </div>

              {/* Developer Stats */}
              {stats.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-6">
                  {stats.map((stat, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-[#B89555]/30"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 100%)',
                        boxShadow: '0 2px 8px rgba(200,167,102,0.15)'
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#EFE6D6]/10 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-[#1A1A1A]" />
                      </div>
                      <div>
                        <span className="text-xl font-bold text-[#1A1A1A]">{stat.value}</span>
                        <span className="text-xs text-[#1A1A1A]/70 ml-2 uppercase tracking-wide">{stat.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notable Projects */}
              {developer.notable_projects && (
                <div className="mb-5">
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Notable Projects: </span>
                  <span className="text-sm text-[#1A1A1A]/70">{developer.notable_projects}</span>
                </div>
              )}

              {/* Description */}
              {developer.description && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">About the Developer</span>
                    {editable && developer.id && (
                      <InlineEditable
                        table="developers"
                        recordId={developer.id}
                        field="description"
                        type="textarea"
                        value={developer.description ?? ""}
                        invalidateKeys={["project", "projects", "developer", "developers"]}
                        label="Edit developer description"
                      >
                        <span className="sr-only">Edit developer description</span>
                      </InlineEditable>
                    )}
                  </div>
                  <div 
                    className="rounded-xl p-4 border border-[#B89555]/25 max-w-3xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(253,251,247,0.6) 100%)',
                    }}
                  >
                    <div 
                      className="text-[#1A1A1A]/70 text-sm leading-relaxed prose prose-sm max-w-none prose-p:mb-2 prose-ul:my-1 prose-li:my-0"
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdownToHtml(formatReellyDescription(displayDescription || '')) 
                      }}
                    />
                  </div>

                  {hasLongDescription && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-1 text-[#1A1A1A] text-sm font-medium mt-3 hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Read More About {developer.name}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {!developer.description && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">About the Developer</span>
                    {editable && developer.id && (
                      <InlineEditable
                        table="developers"
                        recordId={developer.id}
                        field="description"
                        type="textarea"
                        value=""
                        invalidateKeys={["project", "projects", "developer", "developers"]}
                        label="Add developer description"
                      >
                        <span className="sr-only">Add description</span>
                      </InlineEditable>
                    )}
                  </div>
                  <p className="text-[#1A1A1A]/70 text-sm">
                    {projectName} is developed by {developer.name}, a trusted name in UAE real estate development.
                  </p>
                </div>
              )}


              {/* Who is this developer + portfolio link */}
              <DeveloperAboutPanel
                developer={developer}
                projectName={projectName}
                projectCount={computedOffplanProjects ?? undefined}
                className="max-w-4xl"
              />


            </div>
          </div>
        </div>
      </div>
  );
}

function PublicContactChips({ developer }: { developer: NonNullable<DeveloperInfoCardProps["developer"]> }) {
  const pf = developer.public_fields ?? {};
  const isOn = (k: PublicFieldKey) => pf[k] === true;

  const chips: Array<{ key: string; href: string; label: string; icon: React.ReactNode }> = [];

  const addressHref =
    isOn("google_maps_url") && developer.google_maps_url
      ? developer.google_maps_url
      : isOn("office_address") && developer.office_address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(developer.office_address)}`
      : null;
  if (addressHref && (isOn("office_address") || isOn("google_maps_url"))) {
    chips.push({
      key: "address",
      href: addressHref,
      label: developer.office_address || "Map",
      icon: <Globe className="w-3.5 h-3.5" />,
    });
  }
  if (isOn("office_phone") && developer.office_phone) {
    chips.push({
      key: "phone",
      href: `tel:${developer.office_phone.replace(/\s+/g, "")}`,
      label: developer.office_phone,
      icon: <User className="w-3.5 h-3.5" />,
    });
  }
  if (isOn("whatsapp") && developer.whatsapp) {
    const digits = developer.whatsapp.replace(/[^\d]/g, "");
    chips.push({
      key: "whatsapp",
      href: `https://wa.me/${digits}`,
      label: "WhatsApp",
      icon: <Sparkles className="w-3.5 h-3.5" />,
    });
  }
  if (isOn("instagram_url") && developer.instagram_url) {
    chips.push({
      key: "instagram",
      href: developer.instagram_url,
      label: "Instagram",
      icon: <ExternalLink className="w-3.5 h-3.5" />,
    });
  }
  if (isOn("linkedin_url") && developer.linkedin_url) {
    chips.push({
      key: "linkedin",
      href: developer.linkedin_url,
      label: "LinkedIn",
      icon: <ExternalLink className="w-3.5 h-3.5" />,
    });
  }
  if (isOn("website_url") && developer.website_url) {
    chips.push({
      key: "website",
      href: developer.website_url,
      label: "Website",
      icon: <Globe className="w-3.5 h-3.5" />,
    });
  }
  if (isOn("admin_email") && developer.admin_email) {
    chips.push({
      key: "email",
      href: `mailto:${developer.admin_email}`,
      label: developer.admin_email,
      icon: <ExternalLink className="w-3.5 h-3.5" />,
    });
  }

  if (chips.length === 0) return null;

  return (
    <>
      {chips.map((c) => (
        <a
          key={c.key}
          href={c.href}
          target={c.href.startsWith("http") ? "_blank" : undefined}
          rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDFBF7] border border-[#B89555]/35 text-xs text-[#1A1A1A] hover:border-[#B89555] hover:bg-[#F7F2EA] transition-colors max-w-[220px] truncate"
          title={c.label}
        >
          {c.icon}
          <span className="truncate">{c.label}</span>
        </a>
      ))}
    </>
  );
}
