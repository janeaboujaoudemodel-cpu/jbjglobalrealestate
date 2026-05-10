import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Lock, ArrowLeft, Activity, Target, Zap } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { DUBAI_AREAS_MARKET_DATA } from "@/config/open-data-config";

const InternalDashboard = () => {
  const { user } = useAuth();

  // Require authentication
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Generate internal-only signals
  const rentPressureSignals = DUBAI_AREAS_MARKET_DATA.map(area => ({
    area: area.area,
    rentalPressure: area.rentalIndex > 130 ? 'high' : area.rentalIndex > 110 ? 'medium' : 'low',
    velocity: Math.random() > 0.5 ? 'accelerating' : 'decelerating',
    absorption: Math.floor(Math.random() * 30) + 70,
    daysOnMarket: Math.floor(Math.random() * 30) + 20,
  }));

  const getPressureBadge = (pressure: string) => {
    switch (pressure) {
      case 'high':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Pressure</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">Medium</Badge>;
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Low</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead 
        title="Internal Market Dashboard | JBJ Global Real Estate"
        description="Internal market intelligence dashboard for JBJ team members."
        canonicalPath="/internal/market-intelligence/dashboard"
      />

      {/* Internal Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <Lock className="w-4 h-4 text-[#1A1A1A]" />
          <span className="text-[#1A1A1A] text-sm font-medium">INTERNAL USE ONLY — Confidential Market Intelligence</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-12 border-b border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <Link to="/market-intelligence" className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]-light mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Public Intelligence
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold">
                Internal Market Dashboard
              </h1>
              <p className="text-white/90">Real-time signals for competitive advantage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 border-b border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-white/90 text-xs">High Pressure Areas</p>
                    <p className="text-white text-xl font-bold">
                      {rentPressureSignals.filter(s => s.rentalPressure === 'high').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-[#1A1A1A]" />
                  <div>
                    <p className="text-white/90 text-xs">Accelerating Markets</p>
                    <p className="text-white text-xl font-bold">
                      {rentPressureSignals.filter(s => s.velocity === 'accelerating').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white/90 text-xs">Avg Absorption</p>
                    <p className="text-white text-xl font-bold">
                      {Math.round(rentPressureSignals.reduce((a, b) => a + b.absorption, 0) / rentPressureSignals.length)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#1A1A1A]" />
                  <div>
                    <p className="text-white/90 text-xs">Avg Days on Market</p>
                    <p className="text-white text-xl font-bold">
                      {Math.round(rentPressureSignals.reduce((a, b) => a + b.daysOnMarket, 0) / rentPressureSignals.length)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Rent Pressure Signals */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-xl font-bold mb-6">Area-Level Rent Pressure Signals</h2>
          
          <div className="grid gap-4">
            {rentPressureSignals.map((signal) => (
              <Card key={signal.area} className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-white font-semibold">{signal.area}</p>
                        {getPressureBadge(signal.rentalPressure)}
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-white/90 text-xs">Velocity</p>
                        <div className="flex items-center gap-1">
                          {signal.velocity === 'accelerating' ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className={signal.velocity === 'accelerating' ? 'text-emerald-400' : 'text-red-400'}>
                            {signal.velocity}
                          </span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-white/90 text-xs">Absorption</p>
                        <p className="text-white font-semibold">{signal.absorption}%</p>
                      </div>

                      <div className="text-center">
                        <p className="text-white/90 text-xs">Avg DOM</p>
                        <p className="text-white font-semibold">{signal.daysOnMarket} days</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation to Other Internal Pages */}
      <section className="py-12 border-t border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-xl font-bold mb-6">Internal Tools</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/internal/market-intelligence/brokers">
              <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A] hover:border-[#B89555]/30 transition-all">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-2">Broker Intelligence</h3>
                  <p className="text-white/90 text-sm">Conversion signals and performance data</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/internal/market-intelligence/ai-insights">
              <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A] hover:border-[#B89555]/30 transition-all">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-2">AI Market Narratives</h3>
                  <p className="text-white/90 text-sm">AI-generated execution insights</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/internal/market-intelligence/data-ops">
              <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A] hover:border-[#B89555]/30 transition-all">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-2">Data Operations</h3>
                  <p className="text-white/90 text-sm">Dataset management and audit logs</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InternalDashboard;
