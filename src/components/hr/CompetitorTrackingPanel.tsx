import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Target, AlertCircle } from "lucide-react";

export function CompetitorTrackingPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Competitor Intelligence</h2>
          <p className="text-[#1A1A1A]/70 text-sm">Track competitor hiring and market movements</p>
        </div>
      </div>

      {/* Stats - Premium Theme */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-xs">Competitors Tracked</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">12</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFE6D6]/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#1A1A1A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-xs">Open Positions</p>
                <p className="text-2xl font-bold text-amber-600">47</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-xs">New Hires (30d)</p>
                <p className="text-2xl font-bold text-emerald-600">23</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-xs">Market Alerts</p>
                <p className="text-2xl font-bold text-red-600">5</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Premium Theme */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F1E6] border-2 border-[#B89555]/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Building2 className="h-5 w-5 text-[#1A1A1A]" />
            Competitor Tracking Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#EFE6D6]/10 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-[#1A1A1A]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Competitive Intelligence Dashboard</h3>
            <p className="text-[#1A1A1A]/70 max-w-md mx-auto">
              This feature will allow you to track competitor companies, monitor their 
              hiring activities, and receive alerts when key talent becomes available 
              in the UAE real estate market.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
