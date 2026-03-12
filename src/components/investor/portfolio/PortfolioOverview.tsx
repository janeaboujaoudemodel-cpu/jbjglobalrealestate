import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, Clock, FileText, FolderOpen } from "lucide-react";

interface PortfolioStats {
  totalAssets: number;
  activeHoldings: number;
  underEvaluation: number;
  reservedPending: number;
  reportsAvailable: number;
}

interface PortfolioOverviewProps {
  stats: PortfolioStats;
}

export default function PortfolioOverview({ stats }: PortfolioOverviewProps) {
  const statCards = [
    {
      label: "Total Assets Linked",
      value: stats.totalAssets,
      icon: Building2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Holdings",
      value: stats.activeHoldings,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Under Evaluation",
      value: stats.underEvaluation,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Reserved / Pending",
      value: stats.reservedPending,
      icon: FolderOpen,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Reports Available",
      value: stats.reportsAvailable,
      icon: FileText,
      color: "text-gold",
      bg: "bg-gold/10",
    },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Building2 className="w-5 h-5 text-gold" />
        Portfolio Overview
      </h2>
      <p className="text-muted-foreground text-sm">
        A high-level snapshot of your investment portfolio status.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border border-gold/40 shadow-[0_2px_12px_rgba(200,167,102,0.12)]">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
