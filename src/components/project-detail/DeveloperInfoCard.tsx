import { Link } from "react-router-dom";
import { Building2, ExternalLink, Award, ChevronDown, ChevronUp, Calendar, Briefcase, Sparkles, User, Layers, Star, Instagram, Linkedin, MapPin, Phone, MessageCircle, Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PearlButton } from "@/components/ui/pearl-button";
import { useState } from "react";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import InlineEditable from "@/components/project-detail/owner/InlineEditable";
import DeveloperLogoUploader from "@/components/project-detail/owner/DeveloperLogoUploader";

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

export default function DeveloperInfoCard({ developer, projectName, projectCount, editable }: DeveloperInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!developer) return null;

  const computedOffplanProjects = developer.offplan_projects ?? projectCount ?? null;

  const stats = [
    { label: "Founded", value: developer.founded_year ? `${developer.founded_year}` : null, icon: Calendar },
    { label: "Completed", value: developer.completed_projects ? `${developer.completed_projects}+` : null, icon: Building2 },
    { label: "Off-plan", value: computedOffplanProjects ? `${computedOffplanProjects}+` : null, icon: Briefcase },
    { label: "Units Delivered", value: developer.total_units_delivered ? `${developer.total_units_delivered.toLocaleString()}+` : null, icon: Layers },
    { label: "Upcoming", value: developer.upcoming_units ? `${developer.upcoming_units.toLocaleString()}` : null, icon: Star },
  ].filter(s => s.value);

  const hasLongDescription = (developer.description?.length ?? 0) > DESCRIPTION_PREVIEW_LENGTH;
  const displayDescription = hasLongDescription && !isExpanded
    ? developer.description?.slice(0, DESCRIPTION_PREVIEW_LENGTH) + "..."
    : developer.description;

  return (
    <div className="w-full py-6 md:py-8 rounded-2xl">
      <div className="container mx-auto px-4 md:px-8">
        <div 
          className="rounded-2xl border-2 border-[#B89555]/40 p-6 md:p-8"
          style={{
            background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)',
            boxShadow: '0 8px 32px rgba(200,167,102,0.25), inset 0 1px 2px rgba(255,255,255,0.4)',
          }}
        >
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Developer Logo (owner-editable) */}
            {editable && developer.id ? (
              <DeveloperLogoUploader
                developerId={developer.id}
                developerName={developer.name}
                logoUrl={developer.logo_url}
              />
            ) : (
              <div
                className="w-36 h-36 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{
                  background: '#FFFFFF',
                  border: '3px solid hsl(42 45% 59%)',
                  boxShadow: '0 4px 16px rgba(200,167,102,0.3)'
                }}
              >
                {isValidDeveloperLogoUrl(developer.logo_url) ? (
                  <img
                    src={developer.logo_url as string}
                    alt={`${developer.name} logo`}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-[#1A1A1A] font-bold text-base text-center px-2">
                    {developer.name}
                  </span>
                )}
              </div>
            )}

            {/* Developer Info */}
            <div className="flex-1">
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
                    <h3 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">{developer.name}</h3>
                  </InlineEditable>
                ) : (
                  <h3 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">{developer.name}</h3>
                )}
                <Award className="w-6 h-6 text-[#1A1A1A]" />
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
                    className="rounded-xl p-4 border border-[#B89555]/20"
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


              {/* View Developer Button */}
              {developer.slug && (
                <PearlButton
                  to={`/developer/${developer.slug}`}
                  size="md"
                  trailingIcon={<ExternalLink strokeWidth={2.2} />}
                >
                  View All Projects by {developer.name}
                </PearlButton>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicContactChips({ developer }: { developer: NonNullable<DeveloperInfoCardProps["developer"]> }) {
  const pf = developer.public_fields ?? {};
  const chips: { key: PublicFieldKey; icon: typeof Globe; label: string; href: string }[] = [];
  const push = (key: PublicFieldKey, icon: typeof Globe, label: string, href: string | null | undefined) => {
    if (pf[key] && href) chips.push({ key, icon, label, href });
  };
  push("office_address", MapPin, developer.office_address ?? "", developer.google_maps_url ?? developer.office_address ?? null);
  if (pf.google_maps_url && developer.google_maps_url && !chips.find((c) => c.key === "office_address")) {
    chips.push({ key: "google_maps_url", icon: MapPin, label: "Map", href: developer.google_maps_url });
  }
  push("office_phone", Phone, developer.office_phone ?? "", developer.office_phone ? `tel:${developer.office_phone.replace(/\s+/g, "")}` : null);
  push("whatsapp", MessageCircle, "WhatsApp", developer.whatsapp ? `https://wa.me/${developer.whatsapp.replace(/[^\d+]/g, "").replace(/^\+/, "")}` : null);
  push("instagram_url", Instagram, "Instagram", developer.instagram_url ?? null);
  push("linkedin_url", Linkedin, "LinkedIn", developer.linkedin_url ?? null);
  push("website_url", Globe, "Website", developer.website_url ?? null);
  push("admin_email", Mail, developer.admin_email ?? "", developer.admin_email ? `mailto:${developer.admin_email}` : null);

  if (!chips.length) return null;
  return (
    <>
      {chips.map((c) => (
        <a
          key={c.key}
          href={c.href}
          target={c.href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDFBF7] border border-[#B89555]/40 text-xs font-medium text-[#1A1A1A] hover:bg-[#EFE6D6] transition-colors"
        >
          <c.icon className="w-3.5 h-3.5" />
          <span className="truncate max-w-[180px]">{c.label}</span>
        </a>
      ))}
    </>
  );
}
