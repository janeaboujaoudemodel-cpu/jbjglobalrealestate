import { useMemo } from "react";
import { 
  Bed, 
  Maximize, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import { useAreaUnit } from "@/hooks/useAreaUnit";

export interface UnitType {
  type: string; // e.g., "Studio", "1BR", "2BR", "3BR", "Penthouse"
  size_from?: number;
  size_to?: number;
  price_from?: number;
  price_to?: number;
  available_units?: number;
  total_units?: number;
  status?: "available" | "limited" | "sold_out";
}

interface UnitInventorySectionProps {
  unitTypes: UnitType[];
  totalUnits?: number | null;
  availableUnits?: number | null;
  projectName: string;
  availabilityVisible?: boolean;
}

export default function UnitInventorySection({
  unitTypes,
  totalUnits,
  availableUnits,
  projectName,
  availabilityVisible = false,
}: UnitInventorySectionProps) {
  const { formatPrice: formatPriceUtil } = useCurrency();
  const { formatSize, convertSize, unitLabel } = useAreaUnit();
  // Calculate overall availability
  const overallAvailability = useMemo(() => {
    if (availabilityVisible && typeof availableUnits === "number" && typeof totalUnits === "number" && totalUnits > 0) {
      return Math.round((availableUnits / totalUnits) * 100);
    }
    return null;
  }, [availableUnits, totalUnits, availabilityVisible]);

  if (!unitTypes || unitTypes.length === 0) return null;

  return (
    <div className="jj-card-inner">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2">
          <Bed className="w-5 h-5 text-gold" />
          Unit Types{availabilityVisible ? ' & Availability' : ''}
        </h3>
        
        {/* Overall Stats — only when availability is visible */}
        {availabilityVisible && overallAvailability !== null && (
          <div className="flex items-center gap-4">
            {typeof availableUnits === "number" && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Available Units</p>
                <p className="text-lg font-bold text-gold">{availableUnits.toLocaleString()}</p>
              </div>
            )}
            {typeof totalUnits === "number" && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Units</p>
                <p className="text-lg font-bold text-foreground">{totalUnits.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unit Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {unitTypes.map((unit, idx) => (
          <div 
            key={idx}
            className="rounded-xl border-2 border-gold/30 bg-card p-5 hover:border-gold/60 hover:shadow-lg hover:shadow-gold/10 transition-all"
          >
            {/* Unit Type Header */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <Bed className="w-5 h-5 text-gold" />
                </div>
                <h4 className="text-lg font-bold text-foreground">{unit.type}</h4>
              </div>
              {availabilityVisible && getStatusBadge(unit)}
            </div>

            {/* Size */}
            {(unit.size_from || unit.size_to) && (
              <div className="flex items-center gap-2 mb-2">
                <Maximize className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {unit.size_from === unit.size_to 
                    ? formatSize(unit.size_from || 0)
                    : `${unit.size_from ? convertSize(unit.size_from).toLocaleString() : '—'} - ${unit.size_to ? formatSize(unit.size_to) : '—'}`
                  }
                </span>
              </div>
            )}

            {/* Price */}
            {(unit.price_from || unit.price_to) && (
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span className="text-base font-semibold text-gold">
                  {unit.price_from === unit.price_to 
                    ? formatPriceUtil(unit.price_from || 0)
                    : `${formatPriceUtil(unit.price_from || 0)} - ${formatPriceUtil(unit.price_to || 0)}`
                  }
                </span>
              </div>
            )}

            {/* Availability Bar — only when visibility enabled */}
            {availabilityVisible && typeof unit.available_units === "number" && typeof unit.total_units === "number" && unit.total_units > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {unit.available_units} of {unit.total_units} available
                  </span>
                  <span className="text-foreground font-medium">
                    {Math.round((unit.available_units / unit.total_units) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all"
                    style={{ width: `${Math.round((unit.available_units / unit.total_units) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusBadge(unit: UnitType) {
  const status = unit.status || (
    unit.available_units === 0 ? "sold_out" : 
    unit.available_units && unit.total_units && (unit.available_units / unit.total_units) < 0.2 ? "limited" : 
    "available"
  );

  switch (status) {
    case "sold_out":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Sold Out
        </Badge>
      );
    case "limited":
      return (
        <Badge variant="secondary" className="gap-1 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <AlertCircle className="w-3 h-3" />
          Limited
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          Available
        </Badge>
      );
  }
}
