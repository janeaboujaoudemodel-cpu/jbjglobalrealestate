import { MapPin, Clock, Navigation } from "lucide-react";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {points.map((point, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-4 rounded-xl border border-gold/20 bg-card hover:border-gold/40 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {point.label}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {point.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
