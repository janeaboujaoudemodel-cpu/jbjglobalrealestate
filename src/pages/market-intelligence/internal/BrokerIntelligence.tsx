import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Lock, ArrowLeft, Target, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { DUBAI_AREAS_MARKET_DATA } from "@/config/open-data-config";

const BrokerIntelligence = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Generate broker-specific intelligence
  const areaConversion = DUBAI_AREAS_MARKET_DATA.map(area => ({
    area: area.area,
    conversionRate: Math.floor(Math.random() * 20) + 5,
    rentVsSale: area.rentalIndex > area.priceIndex ? 'rent' : 'sale',
    priceSensitivity: area.priceIndex > 140 ? 'low' : area.priceIndex > 110 ? 'medium' : 'high',
    saturationWarning: area.supplyScore > 70,
    hotLeadSignal: area.demandScore > 85,
  }));

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Broker Intelligence | JBJ Global Real Estate"
        description="Internal broker intelligence panels for JBJ team members."
        canonicalPath="/internal/market-intelligence/brokers"
      />

      {/* Internal Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <Lock className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">INTERNAL USE ONLY — Broker Intelligence</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-12 border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <Link to="/internal/market-intelligence/dashboard" className="inline-flex items-center gap-2 text-gold hover:text-gold-light mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Broker Intelligence Panels
              </h1>
              <p className="text-zinc-500">Conversion signals and performance optimization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Insights */}
      <section className="py-8 border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-zinc-400 text-xs">Hot Lead Areas</p>
                    <p className="text-white text-xl font-bold">
                      {areaConversion.filter(a => a.hotLeadSignal).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-zinc-400 text-xs">Rent Momentum Areas</p>
                    <p className="text-white text-xl font-bold">
                      {areaConversion.filter(a => a.rentVsSale === 'rent').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-zinc-400 text-xs">Sale Momentum Areas</p>
                    <p className="text-white text-xl font-bold">
                      {areaConversion.filter(a => a.rentVsSale === 'sale').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-zinc-400 text-xs">Saturation Warnings</p>
                    <p className="text-white text-xl font-bold">
                      {areaConversion.filter(a => a.saturationWarning).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Conversion Table */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-xl font-bold mb-6">Area Conversion Intelligence</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-500 text-sm py-3 px-4">Area</th>
                  <th className="text-center text-zinc-500 text-sm py-3 px-4">Conv. Rate</th>
                  <th className="text-center text-zinc-500 text-sm py-3 px-4">Momentum</th>
                  <th className="text-center text-zinc-500 text-sm py-3 px-4">Price Sensitivity</th>
                  <th className="text-center text-zinc-500 text-sm py-3 px-4">Signals</th>
                </tr>
              </thead>
              <tbody>
                {areaConversion.map((area) => (
                  <tr key={area.area} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{area.area}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-semibold ${area.conversionRate > 15 ? 'text-emerald-400' : area.conversionRate > 10 ? 'text-gold' : 'text-zinc-400'}`}>
                        {area.conversionRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge className={area.rentVsSale === 'rent' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}>
                        {area.rentVsSale === 'rent' ? 'RENT' : 'SALE'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge className={
                        area.priceSensitivity === 'low' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        area.priceSensitivity === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }>
                        {area.priceSensitivity.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {area.hotLeadSignal && (
                          <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded">🔥 Hot</span>
                        )}
                        {area.saturationWarning && (
                          <span className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">⚠️ Saturated</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrokerIntelligence;
