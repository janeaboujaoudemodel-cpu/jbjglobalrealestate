import { 
  Building2, 
  Layers, 
  Maximize, 
  Car, 
  Sparkles, 
  Droplets,
  Wind,
  Shield,
  Zap,
  Home
} from "lucide-react";

interface HouseDetailsSectionProps {
  // Building specifications
  floors?: number | null;
  totalUnits?: number | null;
  buildingType?: string | null;
  
  // Unit specifications
  ceilingHeight?: string | null;
  balconySize?: string | null;
  
  // Standards & features
  finishingStandard?: string | null;
  parkingSpaces?: number | null;
  serviceCharge?: string | null;
  
  // Additional features
  features?: string[] | null;
  
  projectName: string;
}

interface DetailItem {
  icon: typeof Building2;
  label: string;
  value: string;
}

// Validate service charge — suppress if value exceeds 80 AED/sqft (UAE max ceiling)
function isValidServiceCharge(charge: string | null | undefined): boolean {
  if (!charge) return false;
  // Extract all numeric values from the string
  const numbers = charge.match(/[\d.]+/g);
  if (!numbers) return false;
  // If ANY extracted number exceeds 80, it's likely fake data
  return !numbers.some(n => parseFloat(n) > 80);
}

export default function HouseDetailsSection({
  floors,
  totalUnits,
  buildingType,
  ceilingHeight,
  balconySize,
  finishingStandard,
  parkingSpaces,
  serviceCharge,
  features,
  projectName,
}: HouseDetailsSectionProps) {
  // Build the details list from available data
  const details: DetailItem[] = [];

  if (buildingType) {
    details.push({ icon: Home, label: "Building Type", value: buildingType });
  }
  if (floors && floors > 3) {
    details.push({ 
      icon: Layers, 
      label: "Number of Floors", 
      value: `${floors} Floors` 
    });
  }
  if (totalUnits && totalUnits > 4) {
    details.push({ icon: Building2, label: "Total Units", value: `${totalUnits} Units` });
  }
  if (ceilingHeight) {
    details.push({ icon: Maximize, label: "Ceiling Height", value: ceilingHeight });
  }
  if (balconySize) {
    details.push({ icon: Wind, label: "Balcony", value: balconySize });
  }
  if (finishingStandard) {
    details.push({ icon: Sparkles, label: "Finishing Standard", value: finishingStandard });
  }
  if (parkingSpaces) {
    details.push({ icon: Car, label: "Parking", value: `${parkingSpaces} Space${parkingSpaces > 1 ? 's' : ''}` });
  }
  if (isValidServiceCharge(serviceCharge)) {
    details.push({ icon: Zap, label: "Service Charge", value: serviceCharge! });
  }

  // Standard features that most properties have
  const standardFeatures = [
    { icon: Shield, label: "24/7 Security" },
    { icon: Droplets, label: "Central A/C" },
    { icon: Zap, label: "Smart Home Ready" },
  ];

  // Only render if we have details or features
  if (details.length === 0 && (!features || features.length === 0)) {
    return null;
  }

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <Building2 className="w-5 h-5 text-gold" />
        House Details
      </h3>

      {/* Main Specifications Grid */}
      {details.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {details.map((detail, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl border border-gold/20 bg-card hover:border-gold/40 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-3">
                <detail.icon className="w-5 h-5 text-gold" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {detail.label}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {detail.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Additional Features */}
      {features && features.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Property Features
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card"
              >
                <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standard Features (always show a few) */}
      {details.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Standard Inclusions
          </h4>
          <div className="flex flex-wrap gap-3">
            {standardFeatures.map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5"
              >
                <feature.icon className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-foreground">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
