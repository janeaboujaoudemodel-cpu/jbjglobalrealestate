import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  ChevronRight, 
  Mail, 
  Phone, 
  MessageSquare,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface IntegrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  integrationType: 'email' | 'phone' | 'whatsapp' | 'social';
  onConnected: () => void;
}

const integrationConfigs = {
  email: {
    title: 'Email Integration',
    icon: Mail,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    steps: [
      {
        title: 'Choose Provider',
        description: 'Select your email provider',
        options: ['Gmail', 'Outlook', 'Hostinger', 'Custom IMAP']
      },
      {
        title: 'Authorize Access',
        description: 'Grant permission to read and send emails'
      },
      {
        title: 'Confirm Connection',
        description: 'Verify the connection is working'
      }
    ]
  },
  phone: {
    title: 'Phone Integration',
    icon: Phone,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    steps: [
      {
        title: 'VAPI.ai Setup',
        description: 'Connect your VAPI.ai account for AI call handling'
      },
      {
        title: 'Forwarding Setup',
        description: 'Configure call forwarding from your UAE number'
      },
      {
        title: 'Test Call',
        description: 'Make a test call to verify setup'
      }
    ]
  },
  whatsapp: {
    title: 'WhatsApp Integration',
    icon: MessageSquare,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    steps: [
      {
        title: 'Meta Business Account',
        description: 'Connect your Meta Business Account'
      },
      {
        title: 'WhatsApp Business API',
        description: 'Set up WhatsApp Business API access'
      },
      {
        title: 'Message Templates',
        description: 'Configure auto-response templates'
      }
    ]
  },
  social: {
    title: 'Social Media Integration',
    icon: MessageSquare,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    steps: [
      {
        title: 'Connect Accounts',
        description: 'Link your social media accounts'
      },
      {
        title: 'Set Permissions',
        description: 'Configure what AI can access and do'
      },
      {
        title: 'Auto-Response Rules',
        description: 'Set up automated responses for DMs'
      }
    ]
  }
};

const IntegrationWizard: React.FC<IntegrationWizardProps> = ({ 
  isOpen, 
  onClose, 
  integrationType,
  onConnected 
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const config = integrationConfigs[integrationType];
  const Icon = config.icon;

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save integration to database
      if (user) {
        const channelMap: Record<string, 'email' | 'phone' | 'whatsapp' | 'instagram'> = {
          email: 'email',
          phone: 'phone',
          whatsapp: 'whatsapp',
          social: 'instagram'
        };

        const channel = channelMap[integrationType];
        await supabase.from('assistant_integrations').upsert({
          user_id: user.id,
          channel: channel,
          is_active: true,
          sync_status: 'connected',
          last_sync_at: new Date().toISOString(),
          config: {
            provider: selectedProvider || integrationType,
            connected_at: new Date().toISOString()
          }
        });
      }

      setIsConnected(true);
      toast.success(`${config.title} connected successfully!`);
      
      setTimeout(() => {
        onConnected();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleConnect();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9500] bg-[#1A1A1A]/80 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0E0E0E] border border-[#B89555]/30 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0E0E0E] border-b border-[#B89555]/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${config.bgColor}`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{config.title}</h2>
                  <p className="text-[#1A1A1A]/70 text-sm">Step {currentStep + 1} of {config.steps.length}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#FDFBF7]/5 hover:bg-[#FDFBF7]/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#1A1A1A]/70" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2 mt-6">
              {config.steps.map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    index <= currentStep 
                      ? 'bg-[#EFE6D6]' 
                      : 'bg-[#1A1A1A]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isConnected ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Connected Successfully!</h3>
                <p className="text-[#1A1A1A]/70">Your {config.title.toLowerCase()} is now active.</p>
              </motion.div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {config.steps[currentStep].title}
                </h3>
                <p className="text-[#1A1A1A]/70 mb-6">
                  {config.steps[currentStep].description}
                </p>

                {/* Step-specific content */}
                {currentStep === 0 && integrationType === 'email' && (
                  <div className="space-y-3">
                    {['Gmail', 'Outlook', 'Hostinger', 'Custom IMAP'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedProvider(option)}
                        className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                          selectedProvider === option
                            ? 'border-[#B89555] bg-[#EFE6D6]/10 text-white'
                            : 'border-[#1A1A1A] hover:border-[#1A1A1A] text-[#1A1A1A]/70'
                        }`}
                      >
                        <span>{option}</span>
                        {selectedProvider === option && <Check className="w-5 h-5 text-[#1A1A1A]" />}
                      </button>
                    ))}
                  </div>
                )}

                {currentStep === 0 && integrationType === 'phone' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#B89555]/20">
                      <h4 className="text-white font-medium mb-2">VAPI.ai Account</h4>
                      <p className="text-[#1A1A1A]/70 text-sm mb-4">
                        VAPI.ai provides AI-powered call handling for your business.
                      </p>
                      <a
                        href="https://vapi.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]"
                      >
                        Open VAPI.ai <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">VAPI API Key</Label>
                      <Input
                        type="password"
                        placeholder="Enter your VAPI API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="bg-[#1A1A1A] border-[#1A1A1A] text-white"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 1 && integrationType === 'phone' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#B89555]/20">
                      <h4 className="text-white font-medium mb-2">UAE Call Forwarding</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-3 bg-[#1A1A1A]/30 rounded-lg">
                          <span className="text-[#1A1A1A]/70">Etisalat:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-[#1A1A1A]">*100*+971565911000#</code>
                            <button onClick={() => copyToClipboard('*100*+971565911000#')}>
                              <Copy className="w-4 h-4 text-[#1A1A1A]/70 hover:text-[#1A1A1A]" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#1A1A1A]/30 rounded-lg">
                          <span className="text-[#1A1A1A]/70">Du:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-[#1A1A1A]">**21*+971565911000#</code>
                            <button onClick={() => copyToClipboard('**21*+971565911000#')}>
                              <Copy className="w-4 h-4 text-[#1A1A1A]/70 hover:text-[#1A1A1A]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 0 && integrationType === 'whatsapp' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#B89555]/20">
                      <h4 className="text-white font-medium mb-2">Meta Business Suite</h4>
                      <p className="text-[#1A1A1A]/70 text-sm mb-4">
                        You'll need a verified Meta Business Account to use the WhatsApp Business API.
                      </p>
                      <a
                        href="https://business.facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]"
                      >
                        Open Meta Business <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-400 text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>WhatsApp API approval typically takes 2-4 weeks</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!isConnected && (
            <div className="p-6 border-t border-[#B89555]/20 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => currentStep > 0 ? setCurrentStep(prev => prev - 1) : onClose()}
                className="text-[#1A1A1A]/70 hover:text-white"
              >
                {currentStep > 0 ? 'Back' : 'Cancel'}
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={isConnecting || (currentStep === 0 && integrationType === 'email' && !selectedProvider)}
                className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : currentStep === config.steps.length - 1 ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntegrationWizard;
