import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Briefcase, 
  Target, 
  TrendingUp, 
  MessageSquare,
} from 'lucide-react';
import { useHuntingSystem, HuntTargetType } from '@/hooks/useHuntingSystem';
import { CampaignManager } from './CampaignManager';
import { ProspectsList } from './ProspectsList';
import { OutreachPanel } from './OutreachPanel';

export function HuntingDashboard() {
  const [activeTab, setActiveTab] = useState<HuntTargetType>('broker');
  const { 
    campaigns, 
    prospects,
    loading, 
    fetchCampaigns, 
    fetchProspects,
    getCampaignStats 
  } = useHuntingSystem();

  useEffect(() => {
    fetchCampaigns();
    fetchProspects();
  }, [fetchCampaigns, fetchProspects]);

  const stats = getCampaignStats(activeTab);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Champagne container */}
      <div className="border-2 border-gold/30 rounded-2xl bg-gradient-to-br from-[hsl(40,50%,98%)] via-[hsl(38,40%,93%)] to-[hsl(36,35%,88%)] p-6 md:p-8">
        {/* Header — centered */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br from-[hsl(40,50%,92%)] to-[hsl(36,35%,85%)] mb-3">
            <Target className="h-6 w-6 text-gold" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Hunting System</h2>
          <p className="text-muted-foreground">AI-powered prospect discovery and outreach</p>
        </div>

        {/* Target Type Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HuntTargetType)}>
          <div className="flex justify-center mb-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md bg-gradient-to-r from-[hsl(40,50%,92%)] to-[hsl(36,35%,85%)] border-2 border-gold/30">
              <TabsTrigger value="broker" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,50%,92%)] data-[state=active]:to-[hsl(36,35%,82%)] data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold/40">
                <Building2 className="h-4 w-4" />
                Brokers
              </TabsTrigger>
              <TabsTrigger value="investor" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,50%,92%)] data-[state=active]:to-[hsl(36,35%,82%)] data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold/40">
                <TrendingUp className="h-4 w-4" />
                Investors
              </TabsTrigger>
              <TabsTrigger value="employee" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,50%,92%)] data-[state=active]:to-[hsl(36,35%,82%)] data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-gold/40">
                <Briefcase className="h-4 w-4" />
                Employees
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-2 border-gold/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Campaigns</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalCampaigns}</p>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    {stats.activeCampaigns} active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Prospects</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalProspects}</p>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Contacted</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalContacted}</p>
                  </div>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalConversions}</p>
                  </div>
                  <Badge variant="outline" className="border-gold/30">{stats.conversionRate}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content for each target type */}
          <TabsContent value="broker" className="mt-0">
            <HuntingContent targetType="broker" />
          </TabsContent>
          <TabsContent value="investor" className="mt-0">
            <HuntingContent targetType="investor" />
          </TabsContent>
          <TabsContent value="employee" className="mt-0">
            <HuntingContent targetType="employee" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function HuntingContent({ targetType }: { targetType: HuntTargetType }) {
  const [view, setView] = useState<'campaigns' | 'prospects' | 'outreach'>('campaigns');

  const btnBase = "border-2 border-gold/20 font-medium";
  const btnActive = "bg-gradient-to-r from-[hsl(40,50%,92%)] to-[hsl(36,35%,82%)] text-foreground border-gold/40";
  const btnInactive = "bg-white/60 text-muted-foreground hover:bg-white/80";

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b border-gold/20 pb-3">
        <Button 
          variant="outline"
          size="sm"
          className={`${btnBase} ${view === 'campaigns' ? btnActive : btnInactive}`}
          onClick={() => setView('campaigns')}
        >
          <Target className="h-4 w-4 mr-2" />
          Campaigns
        </Button>
        <Button 
          variant="outline"
          size="sm"
          className={`${btnBase} ${view === 'prospects' ? btnActive : btnInactive}`}
          onClick={() => setView('prospects')}
        >
          <Users className="h-4 w-4 mr-2" />
          Prospects
        </Button>
        <Button 
          variant="outline"
          size="sm"
          className={`${btnBase} ${view === 'outreach' ? btnActive : btnInactive}`}
          onClick={() => setView('outreach')}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Outreach
        </Button>
      </div>

      {/* Content */}
      {view === 'campaigns' && <CampaignManager targetType={targetType} />}
      {view === 'prospects' && <ProspectsList targetType={targetType} />}
      {view === 'outreach' && <OutreachPanel targetType={targetType} />}
    </div>
  );
}

export default HuntingDashboard;
