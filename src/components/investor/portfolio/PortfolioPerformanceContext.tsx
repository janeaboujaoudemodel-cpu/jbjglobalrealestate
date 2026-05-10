import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Home, Banknote, AlertCircle } from "lucide-react";

interface PerformanceContextItem {
  assetId: string;
  assetName: string;
  rentalContext?: string;
  resaleLiquidity?: string;
  ownershipCosts?: string;
}

interface PortfolioPerformanceContextProps {
  contextItems: PerformanceContextItem[];
}

export default function PortfolioPerformanceContext({ contextItems }: PortfolioPerformanceContextProps) {
  if (contextItems.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
          Performance Context
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Descriptive indicators for your assets. These are contextual references, not guarantees.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Performance indicators are descriptive only and do not represent guaranteed ROI or projected returns. 
          All estimates are linked to methodology and should be reviewed with an advisor.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contextItems.map((item) => (
          <Card key={item.assetId} className="border-2 border-[#B89555]/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{item.assetName}</CardTitle>
              <CardDescription>Contextual performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.rentalContext && (
                <div className="flex items-start gap-2">
                  <Home className="w-4 h-4 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Rental Context</p>
                    <p className="text-sm text-foreground">{item.rentalContext}</p>
                  </div>
                </div>
              )}
              {item.resaleLiquidity && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Resale Liquidity</p>
                    <p className="text-sm text-foreground">{item.resaleLiquidity}</p>
                  </div>
                </div>
              )}
              {item.ownershipCosts && (
                <div className="flex items-start gap-2">
                  <Banknote className="w-4 h-4 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Ownership Costs</p>
                    <p className="text-sm text-foreground">{item.ownershipCosts}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
