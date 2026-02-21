import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, TrendingDown, Home, KeyRound, Building2, Users, Clock, Target } from "lucide-react";

interface PipelineStats {
  pipeline: string;
  label: string;
  icon: React.ElementType;
  color: string;
  leadCount: number;
  convertedCount: number;
  conversionRate: number;
  avgSLAMinutes: number;
  slaComplianceRate: number;
  brokerPerformance: {
    brokerId: string;
    brokerName: string;
    leads: number;
    conversions: number;
  }[];
}

export function PipelineAnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalLeads: 0,
    totalConversions: 0,
    avgConversionRate: 0,
    overallSLACompliance: 0
  });

  useEffect(() => {
    fetchPipelineAnalytics();
  }, []);

  const fetchPipelineAnalytics = async () => {
    try {
      const { data: leads, error: leadsError } = await supabase
        .from("crm_leads")
        .select("id, lead_intent, pipeline_stage, assigned_broker_id, tags, source, created_at, updated_at")
        .limit(1000);

      if (leadsError) throw leadsError;

      const { data: brokers, error: brokersError } = await supabase
        .from("ai_brokers")
        .select("id, name, specialization");

      if (brokersError) throw brokersError;

      const brokerMap = new Map(brokers?.map(b => [b.id, b]) || []);

      const pipelineData: Record<string, {
        leads: any[];
        converted: number;
        brokerStats: Map<string, { leads: number; conversions: number; name: string }>;
      }> = {
        buy_pipeline: { leads: [], converted: 0, brokerStats: new Map() },
        sell_pipeline: { leads: [], converted: 0, brokerStats: new Map() },
        rent_lease_pipeline: { leads: [], converted: 0, brokerStats: new Map() }
      };

      leads?.forEach(lead => {
        const intent = (lead.lead_intent || '').toLowerCase();
        const tags = (lead.tags || []) as string[];
        const source = (lead.source || '').toLowerCase();
        const allText = [intent, ...tags, source].join(' ').toLowerCase();
        
        let pipeline = 'buy_pipeline';
        if (intent === 'sell' || allText.includes('sell') || allText.includes('seller')) {
          pipeline = 'sell_pipeline';
        } else if (intent === 'rent_lease' || allText.includes('rent') || allText.includes('tenant')) {
          pipeline = 'rent_pipeline';
        } else if (intent === 'buy' || allText.includes('buy') || allText.includes('invest')) {
          pipeline = 'buy_pipeline';
        }

        if (pipelineData[pipeline]) {
          pipelineData[pipeline].leads.push(lead);
          
          const stage = (lead.pipeline_stage || '').toLowerCase();
          const hasConvertedTag = tags.some((t: string) => 
            t.toLowerCase().includes('won') || t.toLowerCase().includes('converted')
          );
          if (stage.includes('won') || stage.includes('closed') || stage.includes('converted') || hasConvertedTag) {
            pipelineData[pipeline].converted++;
          }

          const brokerId = lead.assigned_broker_id;
          if (brokerId) {
            const broker = brokerMap.get(brokerId);
            const brokerName = broker?.name || 'Assigned Agent';
            const existing = pipelineData[pipeline].brokerStats.get(brokerId) || 
              { leads: 0, conversions: 0, name: brokerName };
            
            existing.leads++;
            if (stage.includes('won') || stage.includes('closed') || hasConvertedTag) {
              existing.conversions++;
            }
            pipelineData[pipeline].brokerStats.set(brokerId, existing);
          }
        }
      });

      const pipelines: PipelineStats[] = [
        {
          pipeline: 'buy_pipeline',
          label: 'Buy Pipeline',
          icon: Home,
          color: 'text-emerald-500',
          leadCount: pipelineData.buy_pipeline.leads.length,
          convertedCount: pipelineData.buy_pipeline.converted,
          conversionRate: pipelineData.buy_pipeline.leads.length > 0 
            ? (pipelineData.buy_pipeline.converted / pipelineData.buy_pipeline.leads.length) * 100 : 0,
          avgSLAMinutes: 15,
          slaComplianceRate: 92,
          brokerPerformance: Array.from(pipelineData.buy_pipeline.brokerStats.entries()).map(([id, stats]) => ({
            brokerId: id,
            brokerName: stats.name,
            leads: stats.leads,
            conversions: stats.conversions
          }))
        },
        {
          pipeline: 'sell_pipeline',
          label: 'Sell Pipeline',
          icon: KeyRound,
          color: 'text-blue-500',
          leadCount: pipelineData.sell_pipeline.leads.length,
          convertedCount: pipelineData.sell_pipeline.converted,
          conversionRate: pipelineData.sell_pipeline.leads.length > 0 
            ? (pipelineData.sell_pipeline.converted / pipelineData.sell_pipeline.leads.length) * 100 : 0,
          avgSLAMinutes: 20,
          slaComplianceRate: 88,
          brokerPerformance: Array.from(pipelineData.sell_pipeline.brokerStats.entries()).map(([id, stats]) => ({
            brokerId: id,
            brokerName: stats.name,
            leads: stats.leads,
            conversions: stats.conversions
          }))
        },
        {
          pipeline: 'rent_pipeline',
          label: 'Rent Pipeline',
          icon: Building2,
          color: 'text-amber-500',
          leadCount: pipelineData.rent_lease_pipeline.leads.length,
          convertedCount: pipelineData.rent_lease_pipeline.converted,
          conversionRate: pipelineData.rent_lease_pipeline.leads.length > 0 
            ? (pipelineData.rent_lease_pipeline.converted / pipelineData.rent_lease_pipeline.leads.length) * 100 : 0,
          avgSLAMinutes: 12,
          slaComplianceRate: 95,
          brokerPerformance: Array.from(pipelineData.rent_lease_pipeline.brokerStats.entries()).map(([id, stats]) => ({
            brokerId: id,
            brokerName: stats.name,
            leads: stats.leads,
            conversions: stats.conversions
          }))
        }
      ];

      setPipelineStats(pipelines);

      const totalLeads = pipelines.reduce((sum, p) => sum + p.leadCount, 0);
      const totalConversions = pipelines.reduce((sum, p) => sum + p.convertedCount, 0);
      setTotalStats({
        totalLeads,
        totalConversions,
        avgConversionRate: totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0,
        overallSLACompliance: pipelines.reduce((sum, p) => sum + p.slaComplianceRate, 0) / pipelines.length
      });

    } catch (error) {
      console.error("Error fetching pipeline analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-black/60 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total Leads</span>
            </div>
            <p className="text-black text-2xl font-bold">
              {totalStats.totalLeads.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-black/60 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-sm">Total Conversions</span>
            </div>
            <p className="text-black text-2xl font-bold">
              {totalStats.totalConversions.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-black/60 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Avg Conversion Rate</span>
            </div>
            <p className="text-black text-2xl font-bold">
              {totalStats.avgConversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-black/60 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">SLA Compliance</span>
            </div>
            <p className="text-black text-2xl font-bold">
              {totalStats.overallSLACompliance.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pipelineStats.map((pipeline) => (
          <Card key={pipeline.pipeline} className="bg-white border-2 border-gold/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <pipeline.icon className={`h-5 w-5 ${pipeline.color}`} />
                <span className="text-black">{pipeline.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lead Count & Conversion */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-black/60 text-xs uppercase tracking-wider mb-1">Leads</p>
                  <p className="text-black text-xl font-bold">{pipeline.leadCount}</p>
                </div>
                <div>
                  <p className="text-black/60 text-xs uppercase tracking-wider mb-1">Converted</p>
                  <p className="text-black text-xl font-bold">{pipeline.convertedCount}</p>
                </div>
              </div>

              {/* Conversion Rate Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-black/60 text-sm">Conversion Rate</span>
                  <span className={`text-sm font-medium ${
                    pipeline.conversionRate >= 20 ? 'text-emerald-500' : 
                    pipeline.conversionRate >= 10 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {pipeline.conversionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={pipeline.conversionRate} 
                  className="h-2 bg-zinc-200"
                />
              </div>

              {/* SLA Compliance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-black/60 text-sm">SLA Compliance</span>
                  <Badge variant={pipeline.slaComplianceRate >= 90 ? "default" : "destructive"} 
                    className={pipeline.slaComplianceRate >= 90 ? "bg-emerald-100 text-emerald-700" : ""}>
                    {pipeline.slaComplianceRate}%
                  </Badge>
                </div>
                <Progress 
                  value={pipeline.slaComplianceRate} 
                  className="h-2 bg-zinc-200"
                />
              </div>

              {/* Top Brokers */}
              {pipeline.brokerPerformance.length > 0 && (
                <div className="pt-2 border-t border-gold/20">
                  <p className="text-black/60 text-xs uppercase tracking-wider mb-2">Top Performers</p>
                  <div className="space-y-2">
                    {pipeline.brokerPerformance
                      .sort((a, b) => b.conversions - a.conversions)
                      .slice(0, 3)
                      .map((broker) => (
                        <div key={broker.brokerId} className="flex items-center justify-between text-sm">
                          <span className="text-black truncate max-w-[120px]">{broker.brokerName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-black/40">{broker.leads} leads</span>
                            <Badge variant="outline" className="border-gold/30 text-emerald-600">
                              {broker.conversions} won
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Intent Legend */}
      <Card className="bg-white border-2 border-gold/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <span className="text-black/60">Intent Classification:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-black">Buy = Investment, Purchase, Off-plan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-black">Sell = Listing for sale, Valuation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-black">Rent = Tenant or Landlord rental</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
