/**
 * AI Email Generator Component
 * Uses Lovable AI to generate marketing email content
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Send, Copy, RefreshCw, Mail, 
  Wand2, Loader2, Check, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EMAIL_TYPES = [
  { id: 'follow-up', name: 'Follow-up', description: 'Post-viewing or inquiry' },
  { id: 'introduction', name: 'Introduction', description: 'New client outreach' },
  { id: 'offer', name: 'Offer/Proposal', description: 'Property offer email' },
  { id: 'listing-alert', name: 'Listing Alert', description: 'New property notification' },
  { id: 'market-update', name: 'Market Update', description: 'Newsletter content' },
  { id: 'thank-you', name: 'Thank You', description: 'Post-deal appreciation' },
  { id: 'appointment', name: 'Appointment', description: 'Scheduling confirmation' },
  { id: 'negotiation', name: 'Negotiation', description: 'Counter-offer email' },
];

const TONE_OPTIONS = [
  'Professional',
  'Friendly',
  'Formal',
  'Casual',
  'Persuasive',
  'Urgent',
];

interface GeneratedEmail {
  subject: string;
  greeting: string;
  body: string;
  callToAction: string;
  closing: string;
  signature: string;
  tips?: string[];
  alternativeSubjects?: string[];
}

interface AIEmailGeneratorProps {
  onEmailGenerated?: (subject: string, body: string) => void;
  recipientName?: string;
  propertyDetails?: string;
}

export const AIEmailGenerator: React.FC<AIEmailGeneratorProps> = ({
  onEmailGenerated,
  recipientName: initialRecipient = '',
  propertyDetails: initialProperty = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [emailType, setEmailType] = useState('follow-up');
  const [recipientName, setRecipientName] = useState(initialRecipient);
  const [propertyDetails, setPropertyDetails] = useState(initialProperty);
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('Professional');
  const [additionalContext, setAdditionalContext] = useState('');

  const handleGenerate = async () => {
    if (!emailType) {
      toast.error('Please select an email type');
      return;
    }

    setIsGenerating(true);
    setGeneratedEmail(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-email-generator', {
        body: {
          emailType,
          context: {
            recipientName: recipientName || 'Valued Client',
            propertyDetails,
            purpose,
            tone,
            language: 'English',
            additionalContext,
          },
        },
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedEmail(data);
        toast.success('Email generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate email');
      }
    } catch (error: any) {
      console.error('Email generation error:', error);
      toast.error(error.message || 'Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedEmail) return;

    const fullEmail = `Subject: ${generatedEmail.subject}

${generatedEmail.greeting}

${generatedEmail.body}

${generatedEmail.callToAction}

${generatedEmail.closing}
${generatedEmail.signature}`;

    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseEmail = () => {
    if (!generatedEmail) return;

    const fullBody = `${generatedEmail.greeting}

${generatedEmail.body}

${generatedEmail.callToAction}

${generatedEmail.closing}
${generatedEmail.signature}`;

    onEmailGenerated?.(generatedEmail.subject, fullBody);
    setIsOpen(false);
    toast.success('Email content applied!');
  };

  const handleRegenerate = () => {
    setGeneratedEmail(null);
    handleGenerate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Email Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            AI Email Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Email Type Selection */}
          <div>
            <Label className="text-[#1A1A1A]">Email Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {EMAIL_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setEmailType(type.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    emailType === type.id
                      ? 'border-[#B89555] bg-[#EFE6D6]/10'
                      : 'border-[#B89555]/30 bg-[#FDFBF7] hover:border-[#B89555]/50'
                  }`}
                >
                  <p className="text-[#1A1A1A] text-sm font-medium">{type.name}</p>
                  <p className="text-xs text-[#1A1A1A]/70">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Name */}
          <div>
            <Label className="text-[#1A1A1A]">Recipient Name</Label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g., John Smith"
              className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] mt-1"
            />
          </div>

          {/* Property Details */}
          <div>
            <Label className="text-[#1A1A1A]">Property Details (Optional)</Label>
            <Textarea
              value={propertyDetails}
              onChange={(e) => setPropertyDetails(e.target.value)}
              placeholder="e.g., 3BR apartment in Downtown Dubai, 1,500 sqft..."
              className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] mt-1"
              rows={2}
            />
          </div>

          {/* Purpose & Tone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#1A1A1A]">Purpose</Label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Schedule a viewing"
                className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] mt-1"
              />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#FDFBF7] border-[#B89555]/30">
                  {TONE_OPTIONS.map(t => (
                    <SelectItem key={t} value={t} className="text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Context */}
          <div>
            <Label className="text-[#1A1A1A]">Additional Context (Optional)</Label>
            <Input
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Any specific details to include..."
              className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] mt-1"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-[#1A1A1A] font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>

          {/* Generated Email Preview */}
          {generatedEmail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-[#FDFBF7] border-2 border-[#B89555]/30 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#1A1A1A]" />
                  <span className="font-semibold text-[#1A1A1A]">Generated Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRegenerate}
                    className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Subject Line */}
              <div className="mb-4">
                <Label className="text-[#1A1A1A]/70 text-xs">SUBJECT</Label>
                <p className="text-[#1A1A1A] font-medium">{generatedEmail.subject}</p>
                {generatedEmail.alternativeSubjects && generatedEmail.alternativeSubjects.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-[#1A1A1A]/70">Alternatives:</span>
                    {generatedEmail.alternativeSubjects.map((alt, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-[#B89555]/40 text-[#1A1A1A]">
                        {alt}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Body */}
              <div className="p-4 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] rounded-lg border border-[#B89555]/20">
                <p className="text-[#1A1A1A] mb-4">{generatedEmail.greeting}</p>
                <p className="text-[#1A1A1A] whitespace-pre-line mb-4">{generatedEmail.body}</p>
                <p className="text-[#1A1A1A] mb-4">{generatedEmail.callToAction}</p>
                <p className="text-[#1A1A1A]">{generatedEmail.closing}</p>
                <p className="text-[#1A1A1A] whitespace-pre-line text-sm">{generatedEmail.signature}</p>
              </div>

              {/* Tips */}
              {generatedEmail.tips && generatedEmail.tips.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-purple-700 text-xs font-medium mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Tips for this email:
                  </p>
                  <ul className="text-purple-600 text-xs space-y-1">
                    {generatedEmail.tips.map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Use Email Button */}
              {onEmailGenerated && (
                <Button
                  onClick={handleUseEmail}
                  className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Use This Email
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIEmailGenerator;
