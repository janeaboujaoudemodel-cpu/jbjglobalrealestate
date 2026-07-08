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
  Home,
  CheckCircle2
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
  const isAmra = /amra/i.test(projectName);
  // Build the details list from available data
  const details: DetailItem[] = [];

  if (buildingType) {
    details.push({ icon: Home, label: "Residence Type", value: buildingType });
  }
  if (floors && floors > 3) {
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

  const uniqueStandardFeatures = standardFeatures.filter((feature, index, list) =>
    list.findIndex((item) => item.label.toLowerCase() === feature.label.toLowerCase()) === index,
  );

  return (
    <div className="jj-card-inner overflow-hidden p-0" data-house-details-premium="true">
      <div className="border-b border-[#B89555]/25 bg-[#FDFBF7] p-6 md:p-8">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1A1A1A]/55">
          {isAmra ? "Private resort residence" : "Property specifications"}
        </p>
        <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1A1A1A]" />
          House Details
        </h3>
      </div>

      {/* Main Specifications Grid */}
      {details.length > 0 && (
        <div className="p-6 md:p-8">
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {details.map((detail, idx) => (
              <div
                key={idx}
                className="group relative flex min-h-[168px] h-full flex-col justify-between overflow-hidden rounded-xl border border-[#B89555]/40 bg-[#F7F2EA] p-5 shadow-sm transition-colors hover:border-[#B89555]/70"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[#064E3B] opacity-90" />
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#B89555]/45 bg-[#FDFBF7]">
                  <detail.icon className="h-5 w-5 text-[#064E3B]" />
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/58">
                    {detail.label}
                  </p>
                  <p className="text-lg md:text-xl font-semibold leading-snug text-[#1A1A1A] [overflow-wrap:anywhere]">
                    {detail.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Features */}
      {features && features.length > 0 && (
        <div className="px-6 md:px-8 pb-6 md:pb-8">
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
        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-6 border-t border-[#B89555]/25">
          <h4 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">
            Standard Inclusions
          </h4>
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {uniqueStandardFeatures.map((feature, idx) => (
              <div
                key={idx}
                data-no-contrast-guard
                className="flex min-h-[72px] h-full items-center gap-3 rounded-xl border border-[#B89555]/35 bg-[#FDFBF7] px-4 py-3"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#B89555]/45 bg-[#064E3B]">
                  <feature.icon className="h-4 w-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[#1A1A1A]">{feature.label}</span>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#064E3B]" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
