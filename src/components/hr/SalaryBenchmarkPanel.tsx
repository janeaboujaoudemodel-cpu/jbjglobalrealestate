import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart3, Users } from "lucide-react";

export function SalaryBenchmarkPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Salary Benchmarks</h2>
          <p className="text-zinc-600 text-sm">Industry salary data and competitive analysis</p>
        </div>
      </div>

      {/* Stats - Premium Theme */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 text-xs">Avg. Market Salary</p>
                <p className="text-2xl font-bold text-black">AED 18,500</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 text-xs">Our Position</p>
                <p className="text-2xl font-bold text-emerald-600">+12%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 text-xs">Roles Analyzed</p>
                <p className="text-2xl font-bold text-black">24</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 text-xs">Competitors</p>
                <p className="text-2xl font-bold text-black">8</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Premium Theme */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7] border-2 border-gold/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <DollarSign className="h-5 w-5 text-gold" />
            Salary Data Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gold/10 flex items-center justify-center">
              <DollarSign className="h-10 w-10 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Salary Benchmark Database</h3>
            <p className="text-zinc-600 max-w-md mx-auto">
              This feature will provide real-time salary data from the UAE real estate market, 
              allowing you to benchmark your compensation packages against industry standards.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
