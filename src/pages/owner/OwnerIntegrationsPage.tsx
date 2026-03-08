import { useState } from 'react';
import { 
  Plug, Check, X, AlertTriangle, Clock, 
  MessageCircle, Mail, Instagram, Facebook, 
  RefreshCw, Settings, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OwnerGuard from '@/components/OwnerGuard';

type IntegrationStatus = 'connected' | 'not_connected' | 'error' | 'draft';

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  status: IntegrationStatus;
  authMethod: string | null;
  lastSync: string | null;
  canSend: boolean;
  canReceive: boolean;
  description: string;
}

const OwnerIntegrationsPage = () => {
  const [integrations] = useState<Integration[]>([
    { id: 'whatsapp', name: 'WhatsApp Business', icon: MessageCircle, status: 'draft', authMethod: null, lastSync: null, canSend: false, canReceive: false, description: 'WhatsApp Business API integration for messaging' },
    { id: 'gmail', name: 'Gmail', icon: Mail, status: 'draft', authMethod: null, lastSync: null, canSend: false, canReceive: false, description: 'Gmail integration for email management' },
    { id: 'hostinger', name: 'Hostinger Webmail', icon: Mail, status: 'draft', authMethod: null, lastSync: null, canSend: false, canReceive: false, description: 'Hostinger webmail for business emails' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, status: 'draft', authMethod: null, lastSync: null, canSend: false, canReceive: false, description: 'Instagram DM and messaging integration' },
    { id: 'facebook', name: 'Facebook Messenger', icon: Facebook, status: 'draft', authMethod: null, lastSync: null, canSend: false, canReceive: false, description: 'Facebook Messenger for business communication' },
  ]);

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><Check className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'not_connected':
        return <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200"><X className="w-3 h-3 mr-1" />Not Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'draft':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Draft / Not Active</Badge>;
    }
  };

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Header */}
        <div className="border-b border-[#C9A84C]/20 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#FDFBF7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                <Plug className="w-6 h-6 text-[#C9A84C]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Integration Status</h1>
                <p className="text-zinc-500">Multi-channel integration dashboard</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Warning Banner */}
          <div className="mb-8 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-700">Integration Status Notice</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  All integrations are currently in <strong>Draft / Not Active</strong> status. 
                  No external connections have been configured. These will be activated once 
                  API credentials and OAuth flows are set up.
                </p>
              </div>
            </div>
          </div>

          {/* Integration Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="bg-white/70 border-[#C9A84C]/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                        <integration.icon className="w-5 h-5 text-[#C9A84C]" />
                      </div>
                      <div>
                        <CardTitle className="text-black text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{integration.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Status</span>
                    {getStatusBadge(integration.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Auth Method</span>
                    <span className="text-sm text-zinc-600">{integration.authMethod || 'Not configured'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Last Sync</span>
                    <span className="text-sm text-zinc-600">{integration.lastSync || 'Never'}</span>
                  </div>
                  <div className="pt-3 border-t border-[#C9A84C]/10">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Can Send:</span>
                        {integration.canSend ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-zinc-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Can Receive:</span>
                        {integration.canReceive ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-zinc-400" />}
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 border-[#C9A84C]/30 text-zinc-600 hover:text-black hover:bg-[#C9A84C]/10" disabled>
                      <Settings className="w-4 h-4 mr-1" />Configure
                    </Button>
                    <Button variant="outline" size="sm" className="border-[#C9A84C]/30 text-zinc-600 hover:text-black hover:bg-[#C9A84C]/10" disabled>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 p-4 rounded-lg bg-white/70 border border-[#C9A84C]/20">
            <h3 className="text-sm font-semibold text-black mb-3">Status Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                <span className="text-zinc-500">= Fully operational</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">Draft / Not Active</Badge>
                <span className="text-zinc-500">= Not yet configured</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700 border-red-200">Error</Badge>
                <span className="text-zinc-500">= Connection issue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerGuard>
  );
};

export default OwnerIntegrationsPage;
