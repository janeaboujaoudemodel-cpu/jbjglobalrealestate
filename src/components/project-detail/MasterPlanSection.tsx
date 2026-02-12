import { Map, Building2, Trees, Waves, Car, ShoppingBag, Maximize } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";

interface MasterPlanSectionProps {
  masterPlanImageUrl?: string | null;
  communityHighlights?: string[] | null;
  nearbyDevelopments?: Array<{ name: string; distance?: string }> | null;
  projectName: string;
  communityName?: string | null;
}

const FACILITY_ICONS: Record<string, typeof Building2> = {
  "pool": Waves,
  "swimming": Waves,
  "park": Trees,
  "garden": Trees,
  "parking": Car,
  "mall": ShoppingBag,
  "retail": ShoppingBag,
  "default": Building2,
};

const getFacilityIcon = (label: string) => {
  const lowerLabel = label.toLowerCase();
  for (const [key, Icon] of Object.entries(FACILITY_ICONS)) {
    if (lowerLabel.includes(key)) return Icon;
  }
  return FACILITY_ICONS.default;
};

export default function MasterPlanSection({
  masterPlanImageUrl,
  communityHighlights,
  nearbyDevelopments,
  projectName,
  communityName,
}: MasterPlanSectionProps) {
  if (!masterPlanImageUrl && !communityHighlights?.length && !nearbyDevelopments?.length) {
    return null;
  }

  const handleMaximize = () => {
    if (masterPlanImageUrl) {
      window.open(masterPlanImageUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <Map className="w-5 h-5 text-gold" />
        Master Plan {communityName && `- ${communityName}`}
      </h3>

      {/* Master Plan Image with Maximize Button */}
      {masterPlanImageUrl && (
        <div className="mb-6 rounded-xl overflow-hidden border border-gold/30 relative group">
          <SafeImage
            src={masterPlanImageUrl}
            alt={`${projectName} Master Plan`}
            className="w-full h-auto max-h-[500px] object-contain bg-muted"
            fallbackSrc="/placeholder.svg"
          />
          <button
            onClick={handleMaximize}
            className="absolute top-3 right-3 w-10 h-10 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
            aria-label="View full size"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {communityHighlights && communityHighlights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Community Highlights
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {communityHighlights.map((highlight, idx) => {
                const Icon = getFacilityIcon(highlight);
                return (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gold/20 bg-card"
                  >
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-sm text-foreground">{highlight}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {nearbyDevelopments && nearbyDevelopments.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Nearby Developments
            </h4>
            <div className="space-y-2">
              {nearbyDevelopments.map((dev, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{dev.name}</span>
                  </div>
                  {dev.distance && (
                    <span className="text-xs text-muted-foreground">{dev.distance}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
