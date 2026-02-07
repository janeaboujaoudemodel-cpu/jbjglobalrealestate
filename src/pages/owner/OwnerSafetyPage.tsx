import { useState } from 'react';
import { 
  ShieldAlert, Power, Check, X, AlertTriangle, 
  Brain, MessageCircle, Phone, Mail, Calendar,
  Bot, Zap, Clock, Eye, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import OwnerGuard from '@/components/OwnerGuard';

interface SafetyFeature {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'automation' | 'scheduling';
  enabled: boolean;
  requiresApproval: boolean;
}

const OwnerSafetyPage = () => {
  // Master kill switch
  const [masterKillSwitch, setMasterKillSwitch] = useState(false);
  
  // Individual feature toggles
  const [features, setFeatures] = useState<SafetyFeature[]>([
    {
      id: 'ai_text_reply',
      name: 'AI Text Reply Drafts',
      description: 'Generate text reply suggestions for messages',
      category: 'ai',
      enabled: false,
      requiresApproval: true,
    },
    {
      id: 'ai_voice_notes',
      name: 'AI Voice Note Generation',
      description: 'Generate voice notes using voice clone',
      category: 'ai',
      enabled: false,
      requiresApproval: true,
    },
    {
      id: 'ai_lead_scoring',
      name: 'AI Lead Scoring',
      description: 'Automatically score and prioritize leads',
      category: 'ai',
      enabled: false,
      requiresApproval: false,
    },
    {
      id: 'ai_categorization',
      name: 'AI Message Categorization',
      description: 'Automatically categorize incoming messages',
      category: 'ai',
      enabled: false,
      requiresApproval: false,
    },
    {
      id: 'auto_follow_up',
      name: 'Automated Follow-up Reminders',
      description: 'Create follow-up tasks automatically',
      category: 'automation',
      enabled: false,
      requiresApproval: false,
    },
    {
      id: 'auto_crm_logging',
      name: 'Automated CRM Logging',
      description: 'Log interactions to CRM automatically',
      category: 'automation',
      enabled: false,
      requiresApproval: false,
    },
    {
      id: 'scheduled_sends',
      name: 'Scheduled Message Sends',
      description: 'Queue and send messages at scheduled times',
      category: 'scheduling',
      enabled: false,
      requiresApproval: true,
    },
    {
      id: 'scheduled_reports',
      name: 'Scheduled Report Generation',
      description: 'Generate daily/weekly reports automatically',
      category: 'scheduling',
      enabled: false,
      requiresApproval: false,
    },
  ]);

  const handleMasterKillSwitch = () => {
    const newState = !masterKillSwitch;
    setMasterKillSwitch(newState);
    
    // If kill switch is activated, disable all features
    if (newState) {
      setFeatures(prev => prev.map(f => ({ ...f, enabled: false })));
    }
  };

  const toggleFeature = (featureId: string) => {
    if (masterKillSwitch) return; // Can't enable features when kill switch is on
    
    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const getCategoryIcon = (category: SafetyFeature['category']) => {
    switch (category) {
      case 'ai': return Brain;
      case 'automation': return Zap;
      case 'scheduling': return Clock;
    }
  };

  const aiFeatures = features.filter(f => f.category === 'ai');
  const automationFeatures = features.filter(f => f.category === 'automation');
  const schedulingFeatures = features.filter(f => f.category === 'scheduling');

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI & Automation Safety Panel</h1>
                <p className="text-zinc-400">Control what AI can and cannot do</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Master Kill Switch */}
          <Card className={`mb-8 ${masterKillSwitch ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900/50 border-gold/20'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    masterKillSwitch ? 'bg-red-500/20 border-red-500/30' : 'bg-zinc-800 border-gold/20'
                  } border`}>
                    <Power className={`w-7 h-7 ${masterKillSwitch ? 'text-red-400' : 'text-gold'}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Master Emergency Kill Switch</h2>
                    <p className="text-zinc-400">
                      {masterKillSwitch 
                        ? 'All AI and automation features are DISABLED' 
                        : 'Instantly disable all AI and automation'}
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  variant={masterKillSwitch ? "destructive" : "outline"}
                  className={masterKillSwitch 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'border-red-500/50 text-red-400 hover:bg-red-500/10'}
                  onClick={handleMasterKillSwitch}
                >
                  {masterKillSwitch ? 'Kill Switch ACTIVE' : 'Activate Kill Switch'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* What AI Can / Cannot Do */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  What AI CAN Do
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-zinc-300">Read and categorize incoming messages</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-zinc-300">Draft text and voice reply suggestions</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-zinc-300">Score and prioritize leads</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-zinc-300">Create task and follow-up suggestions</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-zinc-300">Log interactions to CRM (with approval)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-gold/20">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <X className="w-5 h-5" />
                  What AI CANNOT Do
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <X className="w-4 h-4 text-red-400 mt-0.5" />
                  <span className="text-zinc-300">Send messages without explicit owner approval</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <X className="w-4 h-4 text-red-400 mt-0.5" />
                  <span className="text-zinc-300">Make calls or initiate communications</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <X className="w-4 h-4 text-red-400 mt-0.5" />
                  <span className="text-zinc-300">Delete or modify existing data</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <X className="w-4 h-4 text-red-400 mt-0.5" />
                  <span className="text-zinc-300">Access financial or payment systems</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <X className="w-4 h-4 text-red-400 mt-0.5" />
                  <span className="text-zinc-300">Take any action autonomously</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Approval Required Notice */}
          <div className="mb-8 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-400">Approval-First Hybrid Mode</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  The AI operates in <strong>Hybrid Mode</strong>. It can read, draft, and suggest, 
                  but <strong>NEVER sends messages or takes actions without explicit manual approval</strong> from the Owner.
                  Features marked with a badge require individual approval for each action.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Toggles by Category */}
          <div className="space-y-6">
            {/* AI Features */}
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-gold" />
                  AI Features
                </CardTitle>
                <CardDescription>Artificial intelligence capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-gold/10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{feature.name}</span>
                          {feature.requiresApproval && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              Requires Approval
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400">{feature.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={() => toggleFeature(feature.id)}
                      disabled={masterKillSwitch}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Automation Features */}
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gold" />
                  Automation Features
                </CardTitle>
                <CardDescription>Automated workflows and processes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {automationFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-gold/10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{feature.name}</span>
                          {feature.requiresApproval && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              Requires Approval
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400">{feature.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={() => toggleFeature(feature.id)}
                      disabled={masterKillSwitch}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Scheduling Features */}
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Scheduled Actions
                </CardTitle>
                <CardDescription>Scheduled sends and reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {schedulingFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-gold/10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{feature.name}</span>
                          {feature.requiresApproval && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              Requires Approval
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400">{feature.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={() => toggleFeature(feature.id)}
                      disabled={masterKillSwitch}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Safety Summary */}
          <div className="mt-8 p-4 rounded-lg bg-zinc-900/50 border border-gold/20">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              Safety Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 rounded-lg bg-zinc-800/50">
                <div className="text-2xl font-bold text-white">{features.filter(f => f.enabled).length}</div>
                <div className="text-zinc-400">Features Enabled</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-zinc-800/50">
                <div className="text-2xl font-bold text-purple-400">{features.filter(f => f.requiresApproval).length}</div>
                <div className="text-zinc-400">Require Approval</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-zinc-800/50">
                <div className={`text-2xl font-bold ${masterKillSwitch ? 'text-red-400' : 'text-green-400'}`}>
                  {masterKillSwitch ? 'ACTIVE' : 'OFF'}
                </div>
                <div className="text-zinc-400">Kill Switch</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerGuard>
  );
};

export default OwnerSafetyPage;
