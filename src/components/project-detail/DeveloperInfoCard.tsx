import { Link } from "react-router-dom";
import { Building2, ExternalLink, Award, MapPin, ChevronDown, ChevronUp, Calendar, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
}

const DESCRIPTION_PREVIEW_LENGTH = 250;

export default function DeveloperInfoCard({ developer, projectName }: DeveloperInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!developer) return null;

  const stats = [
    { label: "Founded", value: developer.founded_year ? `${developer.founded_year}` : null, icon: Calendar },
    { label: "Completed", value: developer.completed_projects ? `${developer.completed_projects}+` : null, icon: Building2 },
    { label: "Off-plan", value: developer.offplan_projects ? `${developer.offplan_projects}+` : null, icon: Briefcase },
  ].filter(s => s.value);

  const hasLongDescription = (developer.description?.length ?? 0) > DESCRIPTION_PREVIEW_LENGTH;
  const displayDescription = hasLongDescription && !isExpanded
    ? developer.description?.slice(0, DESCRIPTION_PREVIEW_LENGTH) + "..."
    : developer.description;

  return (
    <div className="w-full jj-section-champagne border-y border-gold/20">
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Developer Logo - Full bleed logo fills frame */}
          <div 
            className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0"
            style={{
              border: '2px solid hsl(42 45% 59%)',
              boxShadow: '0 2px 8px rgba(200,167,102,0.2)'
            }}
          >
          {developer.logo_url ? (
              <img 
                src={developer.logo_url} 
                alt={`${developer.name} logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center">
                <Building2 className="w-6 h-6 text-zinc-400" />
              </div>
            )}
          </div>

          {/* Developer Info */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">{developer.name}</h3>
              <Award className="w-6 h-6 text-gold" />
            </div>
            
            {/* Headquarters */}
            {developer.headquarters && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                <MapPin className="w-4 h-4 text-gold" />
                <span>Headquarters: {developer.headquarters}</span>
              </div>
            )}

            {/* Developer Stats - Inline */}
            {stats.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-5">
                {stats.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/20 bg-card">
                    <stat.icon className="w-4 h-4 text-gold" />
                    <div>
                      <span className="text-lg font-bold text-gold">{stat.value}</span>
                      <span className="text-xs text-muted-foreground ml-1">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Developer Description */}
            {developer.description && (
              <div className="mb-5">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {displayDescription}
                </p>
                {hasLongDescription && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-gold text-sm font-medium mt-2 hover:underline"
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
              <p className="text-muted-foreground text-sm mb-5">
                {projectName} is developed by {developer.name}, a trusted name in UAE real estate development.
              </p>
            )}

            {/* View Developer Button */}
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
  );
}
