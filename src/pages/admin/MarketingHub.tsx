/**
 * Marketing Hub Page - AI-Powered Command Center
 * Full marketing management with AI tools, email, campaigns, and admin shortcuts
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Mail, MessageSquare, Share2, Send, Calendar, Users, Eye, Edit2, Trash2,
  Copy, BarChart3, Search, Filter, MoreHorizontal, Sparkles, Bot, FileText, Megaphone,
  Zap, BrainCircuit, PenTool, Globe, Headphones, BookOpen, LayoutDashboard, Settings,
  MessageCircle, Target, TrendingUp, Lightbulb, Video, Palette, ClipboardList, Shield,
  Building2, Heart, UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CampaignEditor from '@/components/marketing-hub/CampaignEditor';
import SubscribersPanel from '@/components/marketing-hub/SubscribersPanel';
import PageGuide from '@/components/admin/PageGuide';
import { getGuide } from '@/config/page-guides';

type CampaignType = 'email' | 'whatsapp' | 'social' | 'sms';
type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'archived';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: CampaignType;
  status: CampaignStatus;
  subject_line: string | null;
  target_audience: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_at: string;
}

// AI Tools sidebar items
const AI_TOOLS = [
  { label: 'AI Email Generator', icon: Mail, route: '/ai/email-generator', color: 'text-[#1A1A1A]' },
  { label: 'AI Social Media', icon: Share2, route: '/ai/social-media', color: 'text-[#1A1A1A]' },
  { label: 'AI Description Writer', icon: PenTool, route: '/ai/description-writer', color: 'text-[#1A1A1A]' },
  { label: 'AI Translation Hub', icon: Globe, route: '/ai/translation-hub', color: 'text-[#1A1A1A]' },
  { label: 'AI Video Tour Script', icon: Video, route: '/ai/video-tour-script', color: 'text-[#1A1A1A]' },
  { label: 'AI Objection Handler', icon: Shield, route: '/ai/objection-handler', color: 'text-[#1A1A1A]' },
  { label: 'AI Follow-up Scheduler', icon: Calendar, route: '/ai/followup-scheduler', color: 'text-[#1A1A1A]' },
  { label: 'AI Client Matcher', icon: Target, route: '/ai/client-matcher', color: 'text-[#1A1A1A]' },
  { label: 'AI Lead Qualification', icon: TrendingUp, route: '/ai/lead-qualification', color: 'text-[#1A1A1A]' },
  { label: 'AI Meeting Summarizer', icon: ClipboardList, route: '/ai/meeting-summarizer', color: 'text-[#1A1A1A]' },
  { label: 'AI Call Summarizer', icon: Headphones, route: '/ai/call-summarizer', color: 'text-[#1A1A1A]' },
  { label: 'AI Document Analyzer', icon: FileText, route: '/ai/document-analyzer', color: 'text-[#1A1A1A]' },
  { label: 'AI Property Evaluation', icon: Lightbulb, route: '/ai/property-evaluation', color: 'text-[#1A1A1A]' },
  { label: 'AI Presentation Generator', icon: Palette, route: '/ai/presentation-generator', color: 'text-[#1A1A1A]' },
  { label: 'Marketing Creative Suite', icon: Palette, route: '/studio', color: 'text-[#1A1A1A]' },
  { label: 'AI Video Studio', icon: Video, route: '/toolkit/video-suite', color: 'text-[#1A1A1A]' },
];

const ADMIN_SHORTCUTS = [
  { label: 'CRM Dashboard', icon: LayoutDashboard, route: '/crm' },
  { label: 'Support Tickets', icon: MessageCircle, route: '/admin/support-tickets' },
  { label: 'Listing Admin', icon: FileText, route: '/listing-admin' },
  { label: 'AI Assistant', icon: Bot, route: '/founders-assistant' },
  { label: 'Admin Panel', icon: Settings, route: '/admin' },
  { label: 'Analytics', icon: BarChart3, route: '/jbj-analytics' },
];

const MarketingHub: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'subscribers' | 'ai-tools'>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  

  const { data: campaigns, isLoading: loadingCampaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });

  const { data: subscriberCount } = useQuery({
    queryKey: ['newsletter-subscriber-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <div className="animate-spin h-8 w-8 border-4 border-[#B89555] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const marketingGuide = getGuide('marketing-hub');

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'draft': return 'bg-[#EFE6D6] text-[#1A1A1A]/70';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'sending': return 'bg-amber-100 text-amber-700';
      case 'sent': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-orange-100 text-orange-700';
      case 'archived': return 'bg-[#EFE6D6] text-[#1A1A1A]/70';
      default: return 'bg-[#EFE6D6] text-[#1A1A1A]/70';
    }
  };

  const getTypeIcon = (type: CampaignType) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      case 'social': return <Share2 className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Failed to delete campaign');
    } else {
      toast.success('Campaign deleted');
      refetchCampaigns();
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    const { error } = await supabase
      .from('marketing_campaigns')
      .insert({
        name: `${campaign.name} (Copy)`,
        description: campaign.description,
        campaign_type: campaign.campaign_type,
        status: 'draft',
        subject_line: campaign.subject_line,
        target_audience: campaign.target_audience,
      });
    if (error) {
      toast.error('Failed to duplicate campaign');
    } else {
      toast.success('Campaign duplicated');
      refetchCampaigns();
    }
  };

  const filteredCampaigns = campaigns?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: campaigns?.length || 0,
    sent: campaigns?.filter(c => c.status === 'sent').length || 0,
    scheduled: campaigns?.filter(c => c.status === 'scheduled').length || 0,
    drafts: campaigns?.filter(c => c.status === 'draft').length || 0,
  };

  if (isCreating || selectedCampaign) {
    return (
      <CampaignEditor
        campaign={selectedCampaign}
        onClose={() => {
          setIsCreating(false);
          setSelectedCampaign(null);
        }}
        onSave={() => {
          setIsCreating(false);
          setSelectedCampaign(null);
          refetchCampaigns();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b-2 border-[#B89555]/30 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] shadow-[0_4px_20px_rgba(200,167,102,0.1)] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/20">
                  <Megaphone className="h-6 w-6 text-[#1A1A1A]" />
                </div>
                <div>
                  <h1 className="font-bold text-[#1A1A1A] text-xl">Marketing Hub</h1>
                  <p className="text-xs text-[#1A1A1A]/60">AI-Powered Campaign Command Center</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick AI Actions */}
              <Link to="/ai/email-generator">
                <Button variant="outline" size="sm" className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hidden md:flex">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#1A1A1A]" />
                  AI Email
                </Button>
              </Link>
              <Link to="/founders-assistant">
                <Button variant="outline" size="sm" className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hidden md:flex">
                  <Bot className="h-3.5 w-3.5 mr-1.5 text-[#1A1A1A]" />
                  AI Assistant
                </Button>
              </Link>
              {marketingGuide && <PageGuide guide={marketingGuide} />}
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-[#1A1A1A] font-semibold shadow-lg shadow-gold/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 overflow-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Campaigns', value: stats.total, icon: BarChart3, iconBg: 'bg-[#EFE6D6]/20 border-[#B89555]/30', iconColor: 'text-[#1A1A1A]' },
              { label: 'Sent', value: stats.sent, icon: Send, iconBg: 'bg-[#EFE6D6]/10 border-[#B89555]/20', iconColor: 'text-[#1A1A1A]' },
              { label: 'Scheduled', value: stats.scheduled, icon: Calendar, iconBg: 'bg-[#EFE6D6]/10 border-[#B89555]/20', iconColor: 'text-[#1A1A1A]' },
              { label: 'Drafts', value: stats.drafts, icon: Edit2, iconBg: 'bg-[#EFE6D6]/10 border-[#B89555]/20', iconColor: 'text-[#1A1A1A]' },
              { label: 'Subscribers', value: subscriberCount || 0, icon: Users, iconBg: 'bg-[#EFE6D6]/10 border-[#B89555]/20', iconColor: 'text-[#1A1A1A]' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-xl border-2 border-[#B89555]/30 bg-gradient-to-br from-white/80 via-white/60 to-[#F7F2EA] shadow-[0_4px_20px_rgba(200,167,102,0.15)]"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.iconBg} border`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
                    <p className="text-xs text-[#1A1A1A]/60">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <TabsList className="bg-[#FDFBF7]/80 border-2 border-[#B89555]/30">
                <TabsTrigger value="campaigns" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] text-[#1A1A1A]">
                  <Megaphone className="w-3.5 h-3.5 mr-1.5" />
                  Campaigns
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] text-[#1A1A1A]">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  AI Tools
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] text-[#1A1A1A]">
                  Templates
                </TabsTrigger>
                <TabsTrigger value="subscribers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] text-[#1A1A1A]">
                  Subscribers
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/50" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>

            {/* AI Tools Tab */}
            <TabsContent value="ai-tools" className="m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
              { label: 'AI Email Generator', desc: 'Generate professional emails with AI', icon: Mail, route: '/ai/email-generator', color: 'from-[#B89555] to-[#A68444]' },
                  { label: 'AI Suggest Reply', desc: 'Smart reply suggestions for tickets', icon: MessageCircle, route: '/admin/support-tickets', color: 'from-[#B89555] to-[#A68A3A]' },
                  { label: 'AI Assistant', desc: 'Your personal AI business assistant', icon: Bot, route: '/founders-assistant', color: 'from-[#B89555] to-[#A68444]' },
                  { label: 'AI Social Media', desc: 'Create social media content', icon: Share2, route: '/ai/social-media', color: 'from-[#B89555] to-[#A68A3A]' },
                  { label: 'AI Description Writer', desc: 'Property descriptions in seconds', icon: PenTool, route: '/ai/description-writer', color: 'from-[#B89555] to-[#A68444]' },
                  { label: 'AI Translation Hub', desc: 'Translate content to 15+ languages', icon: Globe, route: '/ai/translation-hub', color: 'from-[#B89555] to-[#A68A3A]' },
                  { label: 'AI Video Tour Script', desc: 'Script video tours for properties', icon: Video, route: '/ai/video-tour-script', color: 'from-[#B89555] to-[#A68444]' },
                  { label: 'AI Client Matcher', desc: 'Match clients to properties with AI', icon: Target, route: '/ai/client-matcher', color: 'from-[#B89555] to-[#A68A3A]' },
                  { label: 'AI Lead Qualification', desc: 'Score and qualify leads automatically', icon: TrendingUp, route: '/ai/lead-qualification', color: 'from-[#B89555] to-[#A68444]' },
                  { label: 'AI Objection Handler', desc: 'Handle client objections professionally', icon: Shield, route: '/ai/objection-handler', color: 'from-[#B89555] to-[#A68A3A]' },
                  { label: 'AI Follow-up Scheduler', desc: 'Smart follow-up timing', icon: Calendar, route: '/ai/followup-scheduler', color: 'from-[#B89555] to-[#A68444]' },
                  { label: 'AI Meeting Summarizer', desc: 'Summarize meetings into action items', icon: ClipboardList, route: '/ai/meeting-summarizer', color: 'from-[#B89555] to-[#A68A3A]' },
                  { label: 'AI Market Report', desc: 'Generate market intelligence reports', icon: BarChart3, route: '/ai/market-report', color: 'from-[#B89555] to-[#A68444]' },
                  { label: 'AI Contract Reviewer', desc: 'Review contracts for key terms', icon: FileText, route: '/ai/contract-reviewer', color: 'from-[#B89555] to-[#A68A3A]' },
                  { label: 'AI Investment Report', desc: 'Investment analysis reports', icon: Lightbulb, route: '/ai/investment-report', color: 'from-[#B89555] to-[#A68444]' },
                  { label: 'All AI Tools', desc: 'Access all 52+ platform tools', icon: Sparkles, route: '/toolkit', color: 'from-[#B89555] to-[#A68A3A]' },
                ].map((tool, idx) => (
                  <motion.div
                    key={tool.route}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Link
                      to={tool.route}
                      className="block p-4 rounded-xl border-2 border-[#B89555]/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F7F2EA] hover:border-[#B89555] hover:shadow-lg transition-all group"
                    >
          <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg shrink-0`}>
                          <tool.icon className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1A1A1A] text-sm group-hover:text-[#1A1A1A] transition-colors">{tool.label}</p>
                          <p className="text-xs text-[#1A1A1A]/60 mt-0.5">{tool.desc}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="m-0">
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-[#B89555] border-t-transparent rounded-full" />
                </div>
              ) : filteredCampaigns?.length === 0 ? (
                <div className="text-center py-12 border-2 border-[#B89555]/30 rounded-xl bg-gradient-to-br from-white/80 via-white/60 to-[#F7F2EA]">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#EFE6D6]/20 flex items-center justify-center">
                    <Send className="h-8 w-8 text-[#1A1A1A]" />
                  </div>
                  <h3 className="font-semibold mb-2 text-[#1A1A1A]">No campaigns yet</h3>
                  <p className="text-sm text-[#1A1A1A]/60 mb-4">Create your first marketing campaign.</p>
                  <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-[#1A1A1A] font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-[#B89555]/30 rounded-xl overflow-hidden bg-[#FDFBF7]/80">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-[#B89555]/20 bg-[#EFE6D6]/5">
                        <TableHead className="text-[#1A1A1A] font-semibold">Campaign</TableHead>
                        <TableHead className="text-[#1A1A1A] font-semibold">Type</TableHead>
                        <TableHead className="text-[#1A1A1A] font-semibold">Status</TableHead>
                        <TableHead className="text-[#1A1A1A] font-semibold">Audience</TableHead>
                        <TableHead className="text-right text-[#1A1A1A] font-semibold">Opens</TableHead>
                        <TableHead className="text-right text-[#1A1A1A] font-semibold">Clicks</TableHead>
                        <TableHead className="text-right text-[#1A1A1A] font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns?.map((campaign) => (
                        <TableRow key={campaign.id} className="border-b border-[#B89555]/10 hover:bg-[#EFE6D6]/5 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-medium text-[#1A1A1A]">{campaign.name}</p>
                              {campaign.subject_line && (
                                <p className="text-xs text-[#1A1A1A]/50 truncate max-w-[200px]">{campaign.subject_line}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-[#1A1A1A]">
                              {getTypeIcon(campaign.campaign_type)}
                              <span className="capitalize">{campaign.campaign_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                          </TableCell>
                          <TableCell className="capitalize text-[#1A1A1A]">{campaign.target_audience}</TableCell>
                          <TableCell className="text-right text-[#1A1A1A]">
                            {campaign.total_opened > 0 
                              ? `${((campaign.total_opened / campaign.total_sent) * 100).toFixed(1)}%`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right text-[#1A1A1A]">
                            {campaign.total_clicked > 0 
                              ? `${((campaign.total_clicked / campaign.total_sent) * 100).toFixed(1)}%`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-[#EFE6D6]/10">
                                  <MoreHorizontal className="h-4 w-4 text-[#1A1A1A]" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
                                <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)} className="text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                                  <Eye className="h-4 w-4 mr-2" /> Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)} className="text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                                  <Copy className="h-4 w-4 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteCampaign(campaign.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="m-0">
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { name: 'New Listing Announcement', description: 'Announce new property listings to your database', icon: Building2, type: 'email', category: 'Listings' },
                  { name: 'Monthly Newsletter', description: 'Regular updates and insights for subscribers', icon: FileText, type: 'email', category: 'Newsletter' },
                  { name: 'Price Reduction Alert', description: 'Notify buyers of price drops on watched properties', icon: TrendingUp, type: 'email', category: 'Listings' },
                  { name: 'Open House Invitation', description: 'Invite prospects to property viewings', icon: Calendar, type: 'email', category: 'Events' },
                  { name: 'Market Update', description: 'Share market trends and data with investors', icon: BarChart3, type: 'email', category: 'Newsletter' },
                  { name: 'Thank You Follow-up', description: 'Thank clients after meetings or viewings', icon: Heart, type: 'email', category: 'Follow-up' },
                  { name: 'Welcome Email', description: 'Onboard new clients with a warm introduction', icon: Mail, type: 'email', category: 'Onboarding' },
                  { name: 'Property Inquiry Response', description: 'Auto-reply to property inquiries', icon: MessageSquare, type: 'auto-reply', category: 'Automation' },
                  { name: 'Event Invitation', description: 'Invite clients to exclusive events', icon: Calendar, type: 'email', category: 'Events' },
                  { name: 'Referral Request', description: 'Ask satisfied clients for referrals', icon: Users, type: 'email', category: 'Follow-up' },
                  { name: 'Holiday Greeting', description: 'Seasonal greetings to your network', icon: Sparkles, type: 'email', category: 'Seasonal' },
                  { name: 'Investment Opportunity', description: 'Present new investment options', icon: Lightbulb, type: 'email', category: 'Listings' },
                  { name: 'Broker Onboarding', description: 'Welcome new team members', icon: UserCog, type: 'internal', category: 'Onboarding' },
                  { name: 'Anniversary Follow-up', description: 'Mark purchase anniversaries', icon: Heart, type: 'email', category: 'Follow-up' },
                  { name: 'Weekly Digest', description: 'Curated weekly property highlights', icon: FileText, type: 'email', category: 'Newsletter' },
                  { name: 'Exclusive Pre-Launch', description: 'VIP access to upcoming off-plan projects', icon: Sparkles, type: 'email', category: 'Listings' },
                  { name: 'Client Testimonial Request', description: 'Collect reviews from happy clients', icon: MessageSquare, type: 'email', category: 'Follow-up' },
                  { name: 'ROI Report', description: 'Personalized investment return summaries', icon: BarChart3, type: 'report', category: 'Analytics' },
                  { name: 'Payment Reminder', description: 'Friendly installment payment reminders', icon: Calendar, type: 'auto-reply', category: 'Automation' },
                  { name: 'Community Update', description: 'Area news and development updates', icon: Building2, type: 'email', category: 'Newsletter' },
                ].map((template, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-4 rounded-xl border-2 border-[#B89555]/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F7F2EA] hover:border-[#B89555] hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => setIsCreating(true)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center border border-[#B89555]/30">
                        <template.icon className="w-5 h-5 text-[#1A1A1A]" />
                      </div>
                      <Badge className="text-[10px] bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30">{template.category}</Badge>
                    </div>
                    <h4 className="font-semibold text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">{template.name}</h4>
                    <p className="text-sm text-[#1A1A1A]/60 mt-1 line-clamp-2">{template.description}</p>
                    <Badge className="mt-3 bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30">{template.type}</Badge>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Subscribers Tab */}
            <TabsContent value="subscribers" className="m-0">
              <SubscribersPanel count={subscriberCount || 0} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Horizontal Quick Actions Bar (replaces right sidebar) */}
      <div className="sticky bottom-0 z-40 border-t-2 border-[#B89555]/30 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] shadow-[0_-4px_20px_rgba(200,167,102,0.1)] px-4 py-3 hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-gold to-amber-600 text-[#1A1A1A] font-semibold text-xs shadow-lg shadow-gold/20"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Campaign
            </Button>
            <Link to="/ai/email-generator">
              <Button variant="outline" size="sm" className="border-[#B89555]/40 text-[#1A1A1A] text-xs hover:bg-[#EFE6D6]/10">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-[#1A1A1A]" /> AI Email
              </Button>
            </Link>
            <Link to="/ai/social-media">
              <Button variant="outline" size="sm" className="border-[#B89555]/40 text-[#1A1A1A] text-xs hover:bg-[#EFE6D6]/10">
                <Share2 className="w-3.5 h-3.5 mr-1.5 text-[#1A1A1A]" /> Social Post
              </Button>
            </Link>
            <Link to="/founders-assistant">
              <Button variant="outline" size="sm" className="border-[#B89555]/40 text-[#1A1A1A] text-xs hover:bg-[#EFE6D6]/10">
                <Bot className="w-3.5 h-3.5 mr-1.5 text-[#1A1A1A]" /> AI Assistant
              </Button>
            </Link>
            <Link to="/toolkit">
              <Button variant="outline" size="sm" className="border-[#B89555]/40 text-[#1A1A1A] text-xs hover:bg-[#EFE6D6]/10">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#1A1A1A]" /> All Tools
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <p className="font-bold text-[#1A1A1A] text-lg">{stats.sent}</p>
              <p className="text-[#1A1A1A]/50">Sent</p>
            </div>
            <div className="w-px h-8 bg-[#EFE6D6]/20" />
            <div className="text-center">
              <p className="font-bold text-[#1A1A1A] text-lg">{subscriberCount || 0}</p>
              <p className="text-[#1A1A1A]/50">Subscribers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingHub;
