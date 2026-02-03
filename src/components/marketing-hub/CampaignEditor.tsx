/**
 * Campaign Editor Component
 * Visual editor for creating and editing marketing campaigns
 */

import React, { useState } from 'react';
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
  Eye
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
  const [emailBody, setEmailBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = async (status: 'draft' | 'scheduled' = 'draft') => {
    if (!name.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    setIsSaving(true);
    try {
      const campaignData = {
        name,
        description: description || null,
        campaign_type: campaignType,
        status,
        subject_line: subjectLine || null,
        target_audience: targetAudience,
        content: {
          body: emailBody,
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
        toast.success('Campaign created');
      }

      onSave();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI generation');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-generate', {
        body: {
          prompt: aiPrompt,
          type: campaignType,
          context: {
            campaignName: name,
            targetAudience,
          },
        },
      });

      if (error) throw error;

      if (data?.content) {
        setEmailBody(data.content);
        if (data.subjectLine) {
          setSubjectLine(data.subjectLine);
        }
        toast.success('Content generated successfully');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold">
                {campaign ? 'Edit Campaign' : 'New Campaign'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {campaign ? campaign.name : 'Create a new marketing campaign'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSave('scheduled')} 
              disabled={isSaving}
              className="bg-gold hover:bg-gold-dark text-black"
            >
              <Send className="h-4 w-4 mr-2" />
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
              className="p-6 rounded-xl border bg-card"
            >
              <h2 className="font-semibold mb-4">Campaign Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., January Newsletter"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this campaign..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Campaign Type</Label>
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
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          campaignType === value
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v as TargetAudience)}>
                    <SelectTrigger className="mt-1">
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
              className="p-6 rounded-xl border bg-gradient-to-br from-purple-500/10 to-blue-500/10"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h2 className="font-semibold">AI Content Assistant</h2>
              </div>
              
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to create... e.g., 'Create an email announcing our new Palm Jumeirah villa listings with exclusive pricing'"
                rows={3}
                className="mb-3"
              />
              
              <Button 
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
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
              className="p-6 rounded-xl border bg-card"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="attachments">Attachments</TabsTrigger>
                  </TabsList>

                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {targetAudience === 'all' ? 'All Contacts' : targetAudience}
                  </Badge>
                </div>

                <TabsContent value="content" className="space-y-4 m-0">
                  {campaignType === 'email' && (
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={subjectLine}
                        onChange={(e) => setSubjectLine(e.target.value)}
                        placeholder="Enter email subject..."
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="body">
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
                      className="mt-1 min-h-[300px] font-mono"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="m-0">
                  <div className="border rounded-lg p-6 min-h-[400px] bg-white">
                    {campaignType === 'email' && subjectLine && (
                      <div className="border-b pb-4 mb-4">
                        <p className="text-sm text-muted-foreground">Subject:</p>
                        <p className="font-semibold">{subjectLine}</p>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      {emailBody ? (
                        <div dangerouslySetInnerHTML={{ __html: emailBody.replace(/\n/g, '<br/>') }} />
                      ) : (
                        <p className="text-muted-foreground italic">
                          Your content will appear here...
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="m-0">
                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Upload Attachments</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop files here, or click to browse
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm">
                        <Image className="h-4 w-4 mr-2" />
                        Images
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Documents
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CampaignEditor;
