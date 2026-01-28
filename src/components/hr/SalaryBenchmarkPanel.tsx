import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart3, Users } from "lucide-react";

export function SalaryBenchmarkPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Salary Benchmarks</h2>
          <p className="text-muted-foreground text-sm">Industry salary data and competitive analysis</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Avg. Market Salary</p>
                <p className="text-2xl font-bold text-foreground">AED 18,500</p>
              </div>
              <DollarSign className="h-8 w-8 text-gold/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Our Position</p>
                <p className="text-2xl font-bold text-emerald-600">+12%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Roles Analyzed</p>
                <p className="text-2xl font-bold text-foreground">24</p>
              </div>
              <BarChart3 className="h-8 w-8 text-gold/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Competitors</p>
                <p className="text-2xl font-bold text-foreground">8</p>
              </div>
              <Users className="h-8 w-8 text-gold/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gold" />
            Salary Data Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gold/40" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Salary Benchmark Database</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              This feature will provide real-time salary data from the UAE real estate market, 
              allowing you to benchmark your compensation packages against industry standards.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
