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
  standardInclusions?: string[] | null;
  
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
  standardInclusions,
  projectName,
}: HouseDetailsSectionProps) {
  // Build the details list from available data
  const details: DetailItem[] = [];

  if (buildingType) {
    details.push({ icon: Home, label: "Building Type", value: buildingType });
  }
  if (floors && floors > 3) {
    const isAmra = /amra/i.test(projectName);
    details.push({ 
      icon: Layers, 
      label: isAmra ? "Building Height" : "Number of Floors", 
      value: isAmra ? "15 stories · G + M + 14 residential floors + rooftop" : `${floors} Floors` 
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
    ...(standardInclusions || []).map((label) => ({ icon: Sparkles, label })),
  ];

  // Only render if we have details or features
  if (details.length === 0 && (!features || features.length === 0)) {
    return null;
  }

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <Building2 className="w-5 h-5 text-[#1A1A1A]" />
        House Details
      </h3>

      {/* Main Specifications Grid */}
      {details.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {details.map((detail, idx) => (
            <div
              key={idx}
              data-surface="emerald"
              className="jj-house-detail-card p-4 rounded-xl border border-[#B89555]/35 transition-all"
              style={{ background: "linear-gradient(135deg,#064E3B 0%,#042C1C 58%,#000000 100%)" }}
            >
              <div data-icon-circle="true" className="w-10 h-10 rounded-full bg-white/12 border border-white/25 flex items-center justify-center mb-3" style={{ ['--jj-icon-lock-size' as any]: '2.5rem' }}>
                <detail.icon className="w-5 h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.76)", WebkitTextFillColor: "rgba(255,255,255,0.76)" }}>
                {detail.label}
              </p>
              <p className="text-lg font-semibold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
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
                <Sparkles className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
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
            {standardFeatures.filter((feature, index, list) => list.findIndex((item) => item.label.toLowerCase() === feature.label.toLowerCase()) === index).map((feature, idx) => (
              <div
                key={idx}
                data-surface="emerald"
                className="jj-house-inclusion-pill flex items-center gap-2 px-4 py-2 rounded-full border border-[#B89555]/35"
                style={{ background: "linear-gradient(135deg,#064E3B 0%,#042C1C 58%,#000000 100%)" }}
              >
                <feature.icon className="w-4 h-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                <span className="text-sm font-medium" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
