import { MapPin, Navigation } from "lucide-react";

interface PointOfInterest {
  label: string;
  time: string;
}

interface PointsOfInterestProps {
  points: PointOfInterest[];
  className?: string;
}

export default function PointsOfInterest({ points, className = "" }: PointsOfInterestProps) {
  if (!points || points.length === 0) return null;

  return (
    <div className={className}>
      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-gold" />
        Nearby Points of Interest
      </h4>
      <div className="space-y-1">
        {points.map((point, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gold/5 transition-colors border-b border-border last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <Navigation className="w-4 h-4 text-gold flex-shrink-0" />
              <span className="text-sm text-foreground">{point.label}</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap ml-4">
              {point.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
