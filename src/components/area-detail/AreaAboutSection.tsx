import { MapPin, ArrowDown, Compass, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";

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
    <section className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Compass className="w-6 h-6 text-gold" />
            <h2 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
              About {area.name.replace(/\s*\(.*?\)/g, '')}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
            <MapPin className="w-4 h-4 text-gold" />
            <span>{area.emirate}, UAE</span>
          </div>

          {area.description ? (
            <div className="mb-8">
              <div className={`relative ${!isExpanded && isLongDescription ? 'max-h-40 overflow-hidden' : ''}`}>
                <div 
                  className="text-zinc-700 text-base md:text-lg leading-relaxed prose prose-sm max-w-none prose-p:mb-3"
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdownToHtml(formatReellyDescription(
                      area.description
                        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
                        .replace(/\[([^\]]+)\]\([^)]*$/gm, '$1')
                        .replace(/https?:\/\/[^\s)]+/g, '')
                        .replace(/[()]/g, '')
                        .replace(/\s{2,}/g, ' ')
                        .trim()
                    ))
                  }}
                />
                {!isExpanded && isLongDescription && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F5F0E6] to-transparent pointer-events-none" />
                )}
              </div>
              {isLongDescription && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-gold text-sm font-medium mt-3 hover:underline"
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
            <p className="text-zinc-700 text-base md:text-lg leading-relaxed mb-8">
              {area.name} is a premier residential and commercial district located in {area.emirate}. 
              Known for its world-class infrastructure and vibrant community, this area offers a diverse 
              range of properties from luxury apartments to exclusive villas. With excellent connectivity, 
              modern amenities, and a thriving lifestyle scene, {area.name} remains one of the most 
              sought-after locations for investors and homebuyers in the UAE.
            </p>
          )}

          {/* Quick highlights */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {(area.property_count ?? 0) > 0 && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gold/20 shadow-sm">
                <Building2 className="w-5 h-5 text-gold flex-shrink-0" />
                <div>
                  <div className="text-lg font-bold text-black">{area.property_count}</div>
                  <div className="text-xs text-zinc-500">Active Projects</div>
                </div>
              </div>
            )}
            {(area.developer_count ?? 0) > 0 && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gold/20 shadow-sm">
                <Building2 className="w-5 h-5 text-gold flex-shrink-0" />
                <div>
                  <div className="text-lg font-bold text-black">{area.developer_count}</div>
                  <div className="text-xs text-zinc-500">Developers</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gold/20 shadow-sm">
              <MapPin className="w-5 h-5 text-gold flex-shrink-0" />
              <div>
                <div className="text-lg font-bold text-black">{area.emirate}</div>
                <div className="text-xs text-zinc-500">Emirate</div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleScrollToProjects}
            className="px-8 py-6 text-base bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black font-bold border-2 border-gold hover:from-gold hover:to-amber-500 hover:text-black transition-all"
          >
            Properties
            <ArrowDown className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};
