/**
 * Campaign Editor Component
 * Visual editor for creating and editing marketing campaigns
 * With functional file uploads, scheduling, AI content generation,
 * and audience selection from multiple databases
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Send, Mail, MessageSquare, Share2, Users, Calendar,
  Sparkles, Upload, Image, FileText, Eye, X, Clock, CheckCircle,
  Search, Database, UserCheck, Filter, ChevronDown, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

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

interface RecipientEntry {
  id: string;
  email: string;
  name: string;
  source: string;
  selected: boolean;
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

  // Audience selection state
  const [audienceSource, setAudienceSource] = useState<string>('newsletter');
  const [recipients, setRecipients] = useState<RecipientEntry[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Load recipients when audience source changes
  useEffect(() => {
    if (targetAudience === 'custom') {
      loadRecipients(audienceSource);
    }
  }, [audienceSource, targetAudience]);

  const loadRecipients = async (source: string) => {
    setIsLoadingRecipients(true);
    setRecipients([]);
    try {
      let entries: RecipientEntry[] = [];

      if (source === 'newsletter') {
        const { data } = await supabase
          .from('newsletter_subscribers')
          .select('id, email, source, is_active')
          .eq('is_active', true)
          .limit(500);
        entries = (data || []).map(s => ({
          id: s.id,
          email: s.email,
          name: s.email.split('@')[0],
          source: 'Newsletter',
          selected: false,
        }));
      } else if (source === 'leads') {
        const { data } = await supabase
          .from('crm_leads')
          .select('id, email_lower, full_name, pipeline_stage')
          .limit(500);
        entries = (data || []).filter(l => l.email_lower).map(l => ({
          id: l.id,
          email: l.email_lower!,
          name: l.full_name || l.email_lower!.split('@')[0],
          source: `Lead (${l.pipeline_stage || 'new'})`,
          selected: false,
        }));
      } else if (source === 'brokers') {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .limit(500);
        entries = (data || []).filter(p => p.email).map(p => ({
          id: p.id,
          email: p.email!,
          name: p.full_name || p.email!.split('@')[0],
          source: 'Broker/User',
          selected: false,
        }));
      } else if (source === 'book_downloads') {
        const { data } = await supabase
          .from('book_downloads')
          .select('id, downloader_email, downloader_name')
          .limit(500);
        entries = (data || []).map(d => ({
          id: d.id,
          email: d.downloader_email,
          name: d.downloader_name || d.downloader_email.split('@')[0],
          source: 'Book Download',
          selected: false,
        }));
      }

      // Deduplicate by email
      const uniqueMap = new Map<string, RecipientEntry>();
      entries.forEach(e => {
        if (!uniqueMap.has(e.email.toLowerCase())) {
          uniqueMap.set(e.email.toLowerCase(), e);
        }
      });

      setRecipients(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Failed to load recipients:', err);
      toast.error('Failed to load recipients');
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    const filtered = getFilteredRecipients();
    const filteredIds = new Set(filtered.map(r => r.id));
    setRecipients(prev => prev.map(r => filteredIds.has(r.id) ? { ...r, selected: checked } : r));
  };

  const getFilteredRecipients = () => {
    if (!recipientSearch) return recipients;
    const q = recipientSearch.toLowerCase();
    return recipients.filter(r => r.email.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  };

  const selectedCount = recipients.filter(r => r.selected).length;

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
        target_audience: targetAudience === 'custom' 
          ? `custom:${selectedCount} recipients` 
          : targetAudience,
        scheduled_at: scheduledAt,
        content: {
          body: emailBody,
          attachments: attachments.map(a => ({ name: a.name, url: a.url, type: a.type })),
          ...(targetAudience === 'custom' && {
            selected_recipients: recipients.filter(r => r.selected).map(r => ({ email: r.email, name: r.name })),
          }),
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
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('public-assets')
          .upload(`marketing/${fileName}`, file, { cacheControl: '3600', upsert: false });

        if (error) {
          // Fallback to local preview
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
          toast.info(`${file.name} added (local preview)`);
        } else if (data) {
          const { data: urlData } = supabase.storage
            .from('public-assets')
            .getPublicUrl(`marketing/${fileName}`);
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
          prompt: `You are a professional marketing content writer for a luxury real estate company in Dubai called JBJ. Create ${campaignType === 'email' ? 'an HTML email' : 'a message'} based on this request: "${aiPrompt}". 
          
Target audience: ${targetAudience}
${campaignType === 'email' ? `Include a compelling subject line at the start, marked as "Subject: ".
Then write the email body in clean HTML with inline styles. Use elegant fonts, gold (#C9A84C) accent colors, and professional formatting. Include proper headings, paragraphs, and a call-to-action button styled with background-color:#C9A84C; color:#000; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:bold;` : ''}

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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setShowScheduleDialog(true);
  };

  const renderEmailPreview = () => {
    const isHTML = emailBody.includes('<') && emailBody.includes('>');
    return (
      <div className="border-2 border-gold/30 rounded-lg overflow-hidden bg-white min-h-[400px]">
        {/* Email header simulation */}
        <div className="bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6] border-b border-gold/20 p-4 space-y-2">
          {subjectLine && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-black/50 shrink-0 pt-0.5">Subject:</span>
              <span className="font-semibold text-black text-sm">{subjectLine}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-black/50">From:</span>
            <span className="text-xs text-black">JBJ Global Real Estate &lt;contact@jbj.ae&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-black/50">To:</span>
            <span className="text-xs text-black">
              {targetAudience === 'custom' 
                ? `${selectedCount} selected recipients`
                : targetAudience === 'all' ? 'All Contacts' : targetAudience
              }
            </span>
          </div>
        </div>

        {/* Email body */}
        <div className="p-6">
          {emailBody ? (
            isHTML ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(emailBody) }}
              />
            ) : (
              <div className="text-black whitespace-pre-wrap text-sm leading-relaxed">{emailBody}</div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Mail className="w-12 h-12 text-gold/40 mb-3" />
              <p className="text-black/40 italic">Your email content will preview here...</p>
              <p className="text-xs text-black/30 mt-1">Use the AI assistant or type content in the Content tab</p>
            </div>
          )}
        </div>

        {/* Attachments footer */}
        {attachments.length > 0 && (
          <div className="border-t border-gold/20 p-4 bg-[#FDFBF7]">
            <p className="text-xs font-medium text-black/60 mb-2">📎 Attachments ({attachments.length})</p>
            <div className="flex flex-wrap gap-2">
              {attachments.map(att => (
                <Badge key={att.id} variant="secondary" className="bg-gold/10 text-black border border-gold/20">
                  {att.type === 'image' ? <Image className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                  {att.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredRecipients = getFilteredRecipients();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />

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
            <Button onClick={openScheduleDialog} disabled={isSaving} className="bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-black font-semibold">
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
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., January Newsletter" className="mt-1 bg-white border-gold/30" />
                </div>

                <div>
                  <Label htmlFor="description" className="text-black">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="mt-1 bg-white border-gold/30" rows={2} />
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
                      <SelectItem value="custom">Custom Selection ✨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Audience Selection */}
                <AnimatePresence>
                  {targetAudience === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-2 border-t border-gold/20">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-gold" />
                          <Label className="text-black text-sm font-semibold">Select Database</Label>
                        </div>
                        <Select value={audienceSource} onValueChange={setAudienceSource}>
                          <SelectTrigger className="bg-white border-gold/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newsletter">Newsletter Subscribers</SelectItem>
                            <SelectItem value="leads">CRM Leads</SelectItem>
                            <SelectItem value="brokers">Users / Brokers</SelectItem>
                            <SelectItem value="book_downloads">Book Downloaders</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/40" />
                          <Input
                            placeholder="Search recipients..."
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                            className="pl-9 h-9 bg-white border-gold/30 text-sm"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={(c) => handleSelectAll(!!c)}
                              className="border-gold/50"
                            />
                            <span className="text-black/60">Select All ({filteredRecipients.length})</span>
                          </div>
                          <Badge className="bg-gold/20 text-black border-gold/30">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {selectedCount} selected
                          </Badge>
                        </div>

                        <ScrollArea className="h-[200px] border border-gold/20 rounded-lg bg-white">
                          {isLoadingRecipients ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-5 h-5 animate-spin text-gold" />
                            </div>
                          ) : filteredRecipients.length === 0 ? (
                            <div className="text-center py-8 text-xs text-black/40">
                              No recipients found
                            </div>
                          ) : (
                            <div className="p-2 space-y-1">
                              {filteredRecipients.map(r => (
                                <label
                                  key={r.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                    r.selected ? 'bg-gold/10 border border-gold/30' : 'hover:bg-gold/5'
                                  }`}
                                >
                                  <Checkbox
                                    checked={r.selected}
                                    onCheckedChange={() => toggleRecipient(r.id)}
                                    className="border-gold/50"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-black truncate">{r.name}</p>
                                    <p className="text-black/50 truncate">{r.email}</p>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] border-gold/20 shrink-0">{r.source}</Badge>
                                </label>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* AI Assistant */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F5F0E6]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-gold" />
                <h2 className="font-semibold text-black">AI Content Assistant</h2>
              </div>
              
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to create... e.g., 'Create an email announcing our new Palm Jumeirah villa listings'"
                rows={3}
                className="mb-3 bg-white border-gold/30"
              />
              
              <Button 
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-black font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
                    <TabsTrigger value="content" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">Content</TabsTrigger>
                    <TabsTrigger value="preview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
                      <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="attachments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
                      Attachments
                      {attachments.length > 0 && (
                        <Badge className="ml-2 bg-gold/30 text-black text-xs">{attachments.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <Badge variant="outline" className="text-xs border-gold/30 text-black">
                    <Users className="w-3 h-3 mr-1" />
                    {targetAudience === 'custom' 
                      ? `${selectedCount} recipients`
                      : targetAudience === 'all' ? 'All Contacts' : targetAudience
                    }
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="body" className="text-black">
                        {campaignType === 'email' ? 'Email Body' : 'Message Content'}
                      </Label>
                      {campaignType === 'email' && (
                        <span className="text-[10px] text-black/40">Supports HTML for rich formatting</span>
                      )}
                    </div>
                    <Textarea
                      id="body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder={
                        campaignType === 'email'
                          ? 'Write your email content here (plain text or HTML)...'
                          : 'Write your message here...'
                      }
                      className="mt-1 min-h-[300px] font-mono text-sm bg-white border-gold/30"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="m-0">
                  {renderEmailPreview()}
                </TabsContent>

                <TabsContent value="attachments" className="m-0">
                  <div className="border-2 border-dashed border-gold/40 rounded-lg p-8 text-center bg-gold/5">
                    <Upload className="h-12 w-12 mx-auto text-gold mb-4" />
                    <h3 className="font-semibold mb-2 text-black">Upload Attachments</h3>
                    <p className="text-sm text-black/60 mb-4">Add images or documents to your campaign</p>
                    <div className="flex justify-center gap-3">
                      <Button variant="outline" onClick={() => imageInputRef.current?.click()} className="border-2 border-gold/40 bg-white hover:bg-gold/10">
                        <Image className="h-4 w-4 mr-2" /> Add Images
                      </Button>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-2 border-gold/40 bg-white hover:bg-gold/10">
                        <FileText className="h-4 w-4 mr-2" /> Add Documents
                      </Button>
                    </div>
                  </div>

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
              <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="mt-1 bg-white border-gold/30" />
            </div>
            <div>
              <Label className="text-black">Time</Label>
              <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-1 bg-white border-gold/30" />
            </div>
            <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
              <p className="text-sm text-black">
                <CheckCircle className="w-4 h-4 inline mr-2 text-green-600" />
                Campaign will be sent on{' '}
                <strong>{scheduleDate && new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}</strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)} className="border-gold/40">Cancel</Button>
            <Button onClick={() => handleSave('scheduled')} disabled={isSaving || !scheduleDate} className="bg-gradient-to-r from-gold to-amber-600 text-black">
              {isSaving ? 'Scheduling...' : 'Schedule Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignEditor;
