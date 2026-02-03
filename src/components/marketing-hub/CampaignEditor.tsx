/**
 * Campaign Editor Component
 * Visual editor for creating and editing marketing campaigns
 * With functional file uploads, scheduling, and AI content generation
 */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Mail, 
  MessageSquare, 
  Share2, 
  Users, 
  Calendar,
  Sparkles,
  Upload,
  Image,
  FileText,
  Eye,
  X,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CampaignType = 'email' | 'whatsapp' | 'social' | 'sms';
type TargetAudience = 'all' | 'newsletter' | 'leads' | 'investors' | 'brokers' | 'custom';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: CampaignType;
  status: string;
  subject_line: string | null;
  target_audience: string;
  content?: any;
  scheduled_at?: string | null;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document';
  url: string;
  size: number;
}

interface CampaignEditorProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSave: () => void;
}

const CampaignEditor: React.FC<CampaignEditorProps> = ({ campaign, onClose, onSave }) => {
  const [name, setName] = useState(campaign?.name || '');
  const [description, setDescription] = useState(campaign?.description || '');
  const [campaignType, setCampaignType] = useState<CampaignType>(campaign?.campaign_type || 'email');
  const [subjectLine, setSubjectLine] = useState(campaign?.subject_line || '');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>(
    (campaign?.target_audience as TargetAudience) || 'all'
  );
  const [emailBody, setEmailBody] = useState(campaign?.content?.body || '');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (status: 'draft' | 'scheduled' = 'draft') => {
    if (!name.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    setIsSaving(true);
    try {
      const scheduledAt = status === 'scheduled' && scheduleDate 
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
        : null;

      const campaignData = {
        name,
        description: description || null,
        campaign_type: campaignType,
        status,
        subject_line: subjectLine || null,
        target_audience: targetAudience,
        scheduled_at: scheduledAt,
        content: {
          body: emailBody,
          attachments: attachments.map(a => ({ name: a.name, url: a.url, type: a.type })),
        },
      };

      if (campaign?.id) {
        const { error } = await supabase
          .from('marketing_campaigns')
          .update(campaignData)
          .eq('id', campaign.id);
        
        if (error) throw error;
        toast.success('Campaign updated');
      } else {
        const { error } = await supabase
          .from('marketing_campaigns')
          .insert(campaignData);
        
        if (error) throw error;
        toast.success(status === 'scheduled' ? 'Campaign scheduled' : 'Campaign saved as draft');
      }

      onSave();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setIsSaving(false);
      setShowScheduleDialog(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        // Upload to storage
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('marketing-assets')
          .upload(fileName, file);

        if (error) {
          // If bucket doesn't exist, show message
          if (error.message.includes('Bucket not found')) {
            toast.error('Storage bucket not configured. Files saved locally for preview.');
            // Add as local preview
            const reader = new FileReader();
            reader.onloadend = () => {
              setAttachments(prev => [...prev, {
                id: `local_${Date.now()}`,
                name: file.name,
                type,
                url: reader.result as string,
                size: file.size,
              }]);
            };
            reader.readAsDataURL(file);
          } else {
            throw error;
          }
        } else if (data) {
          const { data: urlData } = supabase.storage
            .from('marketing-assets')
            .getPublicUrl(data.path);

          setAttachments(prev => [...prev, {
            id: data.path,
            name: file.name,
            type,
            url: urlData.publicUrl,
            size: file.size,
          }]);
          toast.success(`${file.name} uploaded`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI generation');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: {
          prompt: `You are a professional marketing content writer for a luxury real estate company in Dubai. Create ${campaignType === 'email' ? 'an email' : 'a message'} based on this request: "${aiPrompt}". 
          
Target audience: ${targetAudience}
${campaignType === 'email' ? 'Include a compelling subject line at the start, marked as "Subject: "' : ''}

The content should be:
- Professional and engaging
- Tailored for luxury real estate
- Include a clear call-to-action
- Keep it concise but impactful`,
          model: 'google/gemini-2.5-flash',
        },
      });

      if (error) throw error;

      const content = data?.content || data?.text || '';
      
      // Extract subject line if present
      const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
      if (subjectMatch && campaignType === 'email') {
        setSubjectLine(subjectMatch[1].trim());
        setEmailBody(content.replace(/Subject:\s*.+?\n/i, '').trim());
      } else {
        setEmailBody(content);
      }
      
      toast.success('Content generated successfully');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openScheduleDialog = () => {
    if (!name.trim()) {
      toast.error('Please enter a campaign name first');
      return;
    }
    // Default to tomorrow at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setShowScheduleDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'document')}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'image')}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-black hover:bg-gold/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-black">
                {campaign ? 'Edit Campaign' : 'New Campaign'}
              </h1>
              <p className="text-xs text-black/60">
                {campaign ? campaign.name : 'Create a new marketing campaign'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={isSaving} className="border-2 border-gold/40 bg-white/80 text-black hover:bg-gold/10">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={openScheduleDialog}
              disabled={isSaving}
              className="bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-black font-semibold"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Settings */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F5F0E6]"
            >
              <h2 className="font-semibold mb-4 text-black">Campaign Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-black">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., January Newsletter"
                    className="mt-1 bg-white border-gold/30"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-black">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this campaign..."
                    className="mt-1 bg-white border-gold/30"
                    rows={2}
                  />
                </div>

                <div>
                  <Label className="text-black">Campaign Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      { value: 'email', icon: Mail, label: 'Email' },
                      { value: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' },
                      { value: 'social', icon: Share2, label: 'Social' },
                      { value: 'sms', icon: MessageSquare, label: 'SMS' },
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setCampaignType(value as CampaignType)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          campaignType === value
                            ? 'border-gold bg-gold/20 text-black'
                            : 'border-gold/30 bg-white hover:border-gold/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="audience" className="text-black">Target Audience</Label>
                  <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v as TargetAudience)}>
                    <SelectTrigger className="mt-1 bg-white border-gold/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contacts</SelectItem>
                      <SelectItem value="newsletter">Newsletter Subscribers</SelectItem>
                      <SelectItem value="leads">Active Leads</SelectItem>
                      <SelectItem value="investors">Investors</SelectItem>
                      <SelectItem value="brokers">Brokers</SelectItem>
                      <SelectItem value="custom">Custom Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* AI Assistant */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-white"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-black">AI Content Assistant</h2>
              </div>
              
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to create... e.g., 'Create an email announcing our new Palm Jumeirah villa listings with exclusive pricing'"
                rows={3}
                className="mb-3 bg-white border-purple-200"
              />
              
              <Button 
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Right Panel - Content Editor */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F5F0E6]"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-gold/10 border-2 border-gold/30">
                    <TabsTrigger value="content" className="data-[state=active]:bg-gold data-[state=active]:text-black">Content</TabsTrigger>
                    <TabsTrigger value="preview" className="data-[state=active]:bg-gold data-[state=active]:text-black">Preview</TabsTrigger>
                    <TabsTrigger value="attachments" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                      Attachments
                      {attachments.length > 0 && (
                        <Badge className="ml-2 bg-gold text-black text-xs">{attachments.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <Badge variant="outline" className="text-xs border-gold/30">
                    <Users className="w-3 h-3 mr-1" />
                    {targetAudience === 'all' ? 'All Contacts' : targetAudience}
                  </Badge>
                </div>

                <TabsContent value="content" className="space-y-4 m-0">
                  {campaignType === 'email' && (
                    <div>
                      <Label htmlFor="subject" className="text-black">Subject Line</Label>
                      <Input
                        id="subject"
                        value={subjectLine}
                        onChange={(e) => setSubjectLine(e.target.value)}
                        placeholder="Enter email subject..."
                        className="mt-1 bg-white border-gold/30"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="body" className="text-black">
                      {campaignType === 'email' ? 'Email Body' : 'Message Content'}
                    </Label>
                    <Textarea
                      id="body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder={
                        campaignType === 'email'
                          ? 'Write your email content here...'
                          : 'Write your message here...'
                      }
                      className="mt-1 min-h-[300px] font-mono bg-white border-gold/30"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="m-0">
                  <div className="border-2 border-gold/30 rounded-lg p-6 min-h-[400px] bg-white">
                    {campaignType === 'email' && subjectLine && (
                      <div className="border-b border-gold/20 pb-4 mb-4">
                        <p className="text-sm text-black/50">Subject:</p>
                        <p className="font-semibold text-black">{subjectLine}</p>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      {emailBody ? (
                        <div className="text-black whitespace-pre-wrap">{emailBody}</div>
                      ) : (
                        <p className="text-black/50 italic">
                          Your content will appear here...
                        </p>
                      )}
                    </div>
                    {attachments.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gold/20">
                        <p className="text-sm font-medium text-black mb-2">Attachments ({attachments.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {attachments.map(att => (
                            <Badge key={att.id} variant="secondary" className="bg-gold/20 text-black">
                              {att.type === 'image' ? <Image className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                              {att.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="m-0">
                  <div className="border-2 border-dashed border-gold/40 rounded-lg p-8 text-center bg-gold/5">
                    <Upload className="h-12 w-12 mx-auto text-gold mb-4" />
                    <h3 className="font-semibold mb-2 text-black">Upload Attachments</h3>
                    <p className="text-sm text-black/60 mb-4">
                      Add images or documents to your campaign
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => imageInputRef.current?.click()}
                        className="border-2 border-gold/40 bg-white hover:bg-gold/10"
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Add Images
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-gold/40 bg-white hover:bg-gold/10"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Documents
                      </Button>
                    </div>
                  </div>

                  {/* Attachments List */}
                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between p-3 rounded-lg border-2 border-gold/20 bg-white">
                          <div className="flex items-center gap-3">
                            {att.type === 'image' ? (
                              <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center">
                                <Image className="w-5 h-5 text-gold" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-500" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-black">{att.name}</p>
                              <p className="text-xs text-black/50">{(att.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeAttachment(att.id)} className="text-red-500 hover:bg-red-50">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black">
              <Clock className="w-5 h-5 text-gold" />
              Schedule Campaign
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-black">Date</Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 bg-white border-gold/30"
              />
            </div>
            <div>
              <Label className="text-black">Time</Label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="mt-1 bg-white border-gold/30"
              />
            </div>
            <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
              <p className="text-sm text-black">
                <CheckCircle className="w-4 h-4 inline mr-2 text-green-600" />
                Campaign will be sent on{' '}
                <strong>
                  {scheduleDate && new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                </strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)} className="border-gold/40">
              Cancel
            </Button>
            <Button 
              onClick={() => handleSave('scheduled')} 
              disabled={isSaving || !scheduleDate}
              className="bg-gradient-to-r from-gold to-amber-600 text-black"
            >
              {isSaving ? 'Scheduling...' : 'Schedule Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignEditor;
