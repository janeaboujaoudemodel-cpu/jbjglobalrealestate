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

// Integration status types
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
  // Current integrations status - explicitly labeled as Draft / Not Active if not functional
  const [integrations] = useState<Integration[]>([
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: MessageCircle,
      status: 'draft',
      authMethod: null,
      lastSync: null,
      canSend: false,
      canReceive: false,
      description: 'WhatsApp Business API integration for messaging'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      status: 'draft',
      authMethod: null,
      lastSync: null,
      canSend: false,
      canReceive: false,
      description: 'Gmail integration for email management'
    },
    {
      id: 'hostinger',
      name: 'Hostinger Webmail',
      icon: Mail,
      status: 'draft',
      authMethod: null,
      lastSync: null,
      canSend: false,
      canReceive: false,
      description: 'Hostinger webmail for business emails'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      status: 'draft',
      authMethod: null,
      lastSync: null,
      canSend: false,
      canReceive: false,
      description: 'Instagram DM and messaging integration'
    },
    {
      id: 'facebook',
      name: 'Facebook Messenger',
      icon: Facebook,
      status: 'draft',
      authMethod: null,
      lastSync: null,
      canSend: false,
      canReceive: false,
      description: 'Facebook Messenger for business communication'
    },
  ]);

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Check className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'not_connected':
        return (
          <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">
            <X className="w-3 h-3 mr-1" />
            Not Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Draft / Not Active
          </Badge>
        );
    }
  };

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Plug className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Integration Status</h1>
                <p className="text-zinc-400">Multi-channel integration dashboard</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Warning Banner */}
          <div className="mb-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-400">Integration Status Notice</h3>
                <p className="text-sm text-zinc-400 mt-1">
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
              <Card key={integration.id} className="bg-zinc-900/50 border-gold/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-gold/20 flex items-center justify-center">
                        <integration.icon className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Status</span>
                    {getStatusBadge(integration.status)}
                  </div>

                  {/* Auth Method */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Auth Method</span>
                    <span className="text-sm text-zinc-500">
                      {integration.authMethod || 'Not configured'}
                    </span>
                  </div>

                  {/* Last Sync */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Last Sync</span>
                    <span className="text-sm text-zinc-500">
                      {integration.lastSync || 'Never'}
                    </span>
                  </div>

                  {/* Capabilities */}
                  <div className="pt-3 border-t border-gold/10">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">Can Send:</span>
                        {integration.canSend ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">Can Receive:</span>
                        {integration.canReceive ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gold/20 text-zinc-400 hover:text-white hover:bg-gold/10"
                      disabled
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gold/20 text-zinc-400 hover:text-white hover:bg-gold/10"
                      disabled
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 p-4 rounded-lg bg-zinc-900/50 border border-gold/20">
            <h3 className="text-sm font-semibold text-white mb-3">Status Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>
                <span className="text-zinc-400">= Fully operational</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Draft / Not Active</Badge>
                <span className="text-zinc-400">= Not yet configured</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>
                <span className="text-zinc-400">= Connection issue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerGuard>
  );
};

export default OwnerIntegrationsPage;
