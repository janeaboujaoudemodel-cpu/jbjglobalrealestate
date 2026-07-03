import { MapPin, ArrowDown, Compass, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";
import { HtmlT } from "@/i18n/HtmlT";

interface AreaAboutSectionProps {
  area: {
    name: string;
    description?: string | null;
    emirate: string;
    property_count?: number | null;
    developer_count?: number | null;
  };
}

export const AreaAboutSection = ({ area }: AreaAboutSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleScrollToProjects = () => {
    document.getElementById("projects-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const isLongDescription = (area.description?.length ?? 0) > 400;

  return (
    <section className="py-6 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-5 h-5 text-[#1A1A1A]" />
            <h2 className="text-lg md:text-xl font-bold text-[#1A1A1A]">
              About {area.name.replace(/\s*\(.*?\)/g, '')}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/70 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span>{area.emirate}, UAE</span>
          </div>

          {area.description ? (
            <div className="mb-4">
              <div className={`relative ${!isExpanded && isLongDescription ? 'max-h-24 overflow-hidden' : ''}`}>
                <HtmlT
                  html={renderMarkdownToHtml(formatReellyDescription(
                    area.description
                      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
                      .replace(/\[([^\]]+)\]\([^)]*$/gm, '$1')
                      .replace(/https?:\/\/[^\s)]+/g, '')
                      .replace(/[()]/g, '')
                      .replace(/\s{2,}/g, ' ')
                      .trim()
                  ))}
                  domain="area.description"
                  className="text-[#1A1A1A]/70 text-sm md:text-base leading-relaxed prose prose-sm max-w-none prose-p:mb-2"
                />
                {!isExpanded && isLongDescription && (
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#F7F2EA] to-transparent pointer-events-none" />
                )}
              </div>
              {isLongDescription && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-[#1A1A1A] text-sm font-medium mt-3 hover:underline"
                >
                  {isExpanded ? (
                    <><ChevronUp className="w-4 h-4" /> Show Less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Read More</>
                  )}
                </button>
              )}
            </div>
          ) : (
            <p className="text-[#1A1A1A]/70 text-sm md:text-base leading-relaxed mb-4">
              {area.name} is a premier residential and commercial district located in {area.emirate}.
              Known for its world-class infrastructure and vibrant community, this area offers a diverse
              range of properties from luxury apartments to exclusive villas.
            </p>
          )}

          {/* Quick highlights */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            {(area.property_count ?? 0) > 0 && (
              <div className="flex items-center gap-2 p-2.5 bg-[#FDFBF7] rounded-lg border border-[#064E3B]/20 shadow-sm">
                <Building2 className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-[#1A1A1A]">{area.property_count}</div>
                  <div className="text-[10px] text-[#1A1A1A]/70">Active Projects</div>
                </div>
              </div>
            )}
            {(area.developer_count ?? 0) > 0 && (
              <div className="flex items-center gap-2 p-2.5 bg-[#FDFBF7] rounded-lg border border-[#064E3B]/20 shadow-sm">
                <Building2 className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-[#1A1A1A]">{area.developer_count}</div>
                  <div className="text-[10px] text-[#1A1A1A]/70">Developers</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-2.5 bg-[#FDFBF7] rounded-lg border border-[#064E3B]/20 shadow-sm">
              <MapPin className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-[#1A1A1A]">{area.emirate}</div>
                <div className="text-[10px] text-[#1A1A1A]/70">Emirate</div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleScrollToProjects}
            className="allow-white jj-pill-emerald-metallic px-5 py-2.5 text-sm text-white font-bold border-0 transition-all"
          >
            Properties
            <ArrowDown className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
