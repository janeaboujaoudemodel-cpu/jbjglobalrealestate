import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart3, Users } from "lucide-react";

export function SalaryBenchmarkPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Salary Benchmarks</h2>
          <p className="text-[#1A1A1A]/70 text-sm">Industry salary data and competitive analysis</p>
        </div>
      </div>

      {/* Stats - Premium Theme */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-xs">Avg. Market Salary</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">AED 18,500</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFE6D6]/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#1A1A1A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-xs">Our Position</p>
                <p className="text-2xl font-bold text-emerald-600">+12%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-xs">Roles Analyzed</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">24</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFE6D6]/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#1A1A1A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-xs">Competitors</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">8</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFE6D6]/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#1A1A1A]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Premium Theme */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F1E6] border-2 border-[#B89555]/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <DollarSign className="h-5 w-5 text-[#1A1A1A]" />
            Salary Data Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#EFE6D6]/10 flex items-center justify-center">
              <DollarSign className="h-10 w-10 text-[#1A1A1A]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Salary Benchmark Database</h3>
            <p className="text-[#1A1A1A]/70 max-w-md mx-auto">
              This feature will provide real-time salary data from the UAE real estate market, 
              allowing you to benchmark your compensation packages against industry standards.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
