import { Link } from "react-router-dom";
import { Building2, ExternalLink, Award, MapPin, ChevronDown, ChevronUp, Calendar, Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";

interface DeveloperInfoCardProps {
  developer: {
    name: string;
    slug?: string | null;
    logo_url?: string | null;
    logo_url_processed?: string | null;
    founded_year?: number | null;
    completed_projects?: number | null;
    offplan_projects?: number | null;
    description?: string | null;
    headquarters?: string | null;
  } | null;
  projectName: string;
  projectCount?: number;
}

const DESCRIPTION_PREVIEW_LENGTH = 500;

export default function DeveloperInfoCard({ developer, projectName, projectCount }: DeveloperInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!developer) return null;

  // Compute stats with fallbacks - use projectCount if offplan_projects is null
  const computedOffplanProjects = developer.offplan_projects ?? projectCount ?? null;

  const stats = [
    { label: "Founded", value: developer.founded_year ? `${developer.founded_year}` : null, icon: Calendar },
    { label: "Completed", value: developer.completed_projects ? `${developer.completed_projects}+` : null, icon: Building2 },
    { label: "Off-plan", value: computedOffplanProjects ? `${computedOffplanProjects}+` : null, icon: Briefcase },
  ].filter(s => s.value);

  const hasLongDescription = (developer.description?.length ?? 0) > DESCRIPTION_PREVIEW_LENGTH;
  const displayDescription = hasLongDescription && !isExpanded
    ? developer.description?.slice(0, DESCRIPTION_PREVIEW_LENGTH) + "..."
    : developer.description;

  return (
    <div className="w-full py-6 md:py-8 rounded-2xl">
      <div className="container mx-auto px-4 md:px-8">
        {/* Premium champagne card with rounded corners */}
        <div 
          className="rounded-2xl border-2 border-gold/40 p-6 md:p-8"
          style={{
            background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)',
            boxShadow: '0 8px 32px rgba(200,167,102,0.25), inset 0 1px 2px rgba(255,255,255,0.4)',
          }}
        >
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Developer Logo - Larger Card, Full Fit, White BG */}
            <div 
              className="w-36 h-36 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{
                background: '#FFFFFF',
                border: '3px solid hsl(42 45% 59%)',
                boxShadow: '0 4px 16px rgba(200,167,102,0.3)'
              }}
            >
              {developer.logo_url ? (
                <img 
                  src={developer.logo_url} 
                  alt={`${developer.name} logo`}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Building2 className="w-12 h-12 text-zinc-400" />
              )}
            </div>

            {/* Developer Info */}
            <div className="flex-1">
              {/* Header with more spacing */}
              <div className="flex items-center gap-3 mb-5">
                <h3 className="text-2xl md:text-3xl font-bold text-black">{developer.name}</h3>
                <Award className="w-6 h-6 text-gold" />
              </div>
              
              {/* Headquarters */}
              {developer.headquarters && (
                <div className="flex items-center gap-2 text-zinc-600 text-sm mb-5">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span>Headquarters: {developer.headquarters}</span>
                </div>
              )}

              {/* Developer Stats - Premium inline cards */}
              {stats.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-6">
                  {stats.map((stat, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-gold/30"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 100%)',
                        boxShadow: '0 2px 8px rgba(200,167,102,0.15)'
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <span className="text-xl font-bold text-black">{stat.value}</span>
                        <span className="text-xs text-zinc-500 ml-2 uppercase tracking-wide">{stat.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Premium Description Section with Visual Enhancement */}
              {developer.description && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="text-xs font-semibold text-gold uppercase tracking-wider">About the Developer</span>
                  </div>
                  <div 
                    className="rounded-xl p-4 border border-gold/20"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(253,251,247,0.6) 100%)',
                    }}
                  >
                    <div 
                      className="text-zinc-700 text-sm leading-relaxed prose prose-sm max-w-none prose-p:mb-2 prose-ul:my-1 prose-li:my-0"
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdownToHtml(formatReellyDescription(displayDescription || '')) 
                      }}
                    />
                  </div>
                  {hasLongDescription && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-1 text-gold text-sm font-medium mt-3 hover:underline"
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

              {/* Fallback description if no API description */}
              {!developer.description && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="text-xs font-semibold text-gold uppercase tracking-wider">About the Developer</span>
                  </div>
                  <p className="text-zinc-600 text-sm">
                    {projectName} is developed by {developer.name}, a trusted name in UAE real estate development.
                  </p>
                </div>
              )}

              {/* View Developer Button - Premium styling */}
              {developer.slug && (
                <Link to={`/developer/${developer.slug}`}>
                  <Button variant="primary" size="default" className="group">
                    <span>View All Projects by {developer.name}</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
