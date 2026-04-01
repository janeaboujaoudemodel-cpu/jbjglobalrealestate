import { 
  TrendingUp, 
  Percent, 
  PiggyBank,
  Calculator,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvestmentMetricsSectionProps {
  roiEstimate?: number | null;
  rentalYieldEstimate?: number | null;
  priceFrom?: number | null;
  projectName: string;
  onContactClick?: () => void;
}

export default function InvestmentMetricsSection({
  roiEstimate,
  rentalYieldEstimate,
  priceFrom,
  projectName,
  onContactClick,
}: InvestmentMetricsSectionProps) {
  if (!roiEstimate && !rentalYieldEstimate) return null;

  const estimatedAnnualRental = priceFrom && rentalYieldEstimate 
    ? Math.round((priceFrom * (rentalYieldEstimate / 100)))
    : null;

  return (
    <div className="jj-card-inner bg-gradient-to-br from-card via-card to-emerald-50/30 border-2 border-black/10">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        Investment Potential
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ROI Estimate */}
        {roiEstimate && (
          <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-card via-card to-emerald-50 shadow-md hover:shadow-lg hover:shadow-black/10 transition-all p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 mx-auto mb-3 flex items-center justify-center ring-4 ring-emerald-200">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-xs text-black font-medium uppercase tracking-wider mb-1">Estimated ROI</p>
            <p className="text-2xl font-bold text-emerald-600">{roiEstimate}%</p>
            <p className="text-xs text-black/80 font-medium mt-1">Capital appreciation</p>
          </div>
        )}

        {/* Rental Yield */}
        {rentalYieldEstimate && (
          <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-card via-card to-blue-50 shadow-md hover:shadow-lg hover:shadow-black/10 transition-all p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 mx-auto mb-3 flex items-center justify-center ring-4 ring-blue-200">
              <Percent className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-xs text-black font-medium uppercase tracking-wider mb-1">Rental Yield</p>
            <p className="text-2xl font-bold text-blue-600">{rentalYieldEstimate}%</p>
            <p className="text-xs text-black/80 font-medium mt-1">Annual returns</p>
          </div>
        )}

        {/* Estimated Annual Income */}
        {estimatedAnnualRental && (
          <div className="rounded-xl border-2 border-purple-300 bg-gradient-to-br from-card via-card to-purple-50 shadow-md hover:shadow-lg hover:shadow-black/10 transition-all p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 mx-auto mb-3 flex items-center justify-center ring-4 ring-purple-200">
              <PiggyBank className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-xs text-black font-medium uppercase tracking-wider mb-1">Est. Annual Rental</p>
            <p className="text-2xl font-bold text-purple-600">AED {estimatedAnnualRental.toLocaleString()}</p>
            <p className="text-xs text-black/80 font-medium mt-1">Projected income</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-black/60 text-center mt-4 italic">
        * Investment metrics are estimates based on market analysis. Actual returns may vary. 
        Past performance is not indicative of future results.
      </p>

      {/* CTA */}
      {onContactClick && (
        <div className="mt-6 text-center">
          <Button variant="primary" onClick={onContactClick} className="gap-2">
            <Calculator className="w-4 h-4" />
            Get Personalized ROI Analysis
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
