import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Briefcase, 
  Target, 
  TrendingUp, 
  MessageSquare,
  Plus,
  Filter
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

  const targetConfig = {
    investor: {
      icon: TrendingUp,
      title: 'Investor Hunting',
      description: 'Find and qualify high-net-worth investors',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    broker: {
      icon: Building2,
      title: 'Broker Hunting',
      description: 'Recruit top-performing real estate brokers',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    employee: {
      icon: Briefcase,
      title: 'Talent Hunting',
      description: 'Find and recruit skilled employees',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  };

  const config = targetConfig[activeTab];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${config.bgColor}`}>
            <Target className={`h-6 w-6 ${config.color}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Hunting System</h2>
            <p className="text-muted-foreground">AI-powered prospect discovery and outreach</p>
          </div>
        </div>
      </div>

      {/* Target Type Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HuntTargetType)}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="broker" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Brokers
          </TabsTrigger>
          <TabsTrigger value="investor" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Investors
          </TabsTrigger>
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Employees
          </TabsTrigger>
        </TabsList>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Campaigns</p>
                  <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                </div>
                <Badge variant="outline" className="text-green-500">
                  {stats.activeCampaigns} active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prospects</p>
                  <p className="text-2xl font-bold">{stats.totalProspects}</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contacted</p>
                  <p className="text-2xl font-bold">{stats.totalContacted}</p>
                </div>
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">{stats.totalConversions}</p>
                </div>
                <Badge variant="secondary">{stats.conversionRate}%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content for each target type */}
        <TabsContent value="broker" className="mt-6">
          <HuntingContent targetType="broker" config={targetConfig.broker} />
        </TabsContent>

        <TabsContent value="investor" className="mt-6">
          <HuntingContent targetType="investor" config={targetConfig.investor} />
        </TabsContent>

        <TabsContent value="employee" className="mt-6">
          <HuntingContent targetType="employee" config={targetConfig.employee} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface HuntingContentProps {
  targetType: HuntTargetType;
  config: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    color: string;
    bgColor: string;
  };
}

function HuntingContent({ targetType, config }: HuntingContentProps) {
  const [view, setView] = useState<'campaigns' | 'prospects' | 'outreach'>('campaigns');

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button 
          variant={view === 'campaigns' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setView('campaigns')}
        >
          <Target className="h-4 w-4 mr-2" />
          Campaigns
        </Button>
        <Button 
          variant={view === 'prospects' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setView('prospects')}
        >
          <Users className="h-4 w-4 mr-2" />
          Prospects
        </Button>
        <Button 
          variant={view === 'outreach' ? 'default' : 'ghost'} 
          size="sm"
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
