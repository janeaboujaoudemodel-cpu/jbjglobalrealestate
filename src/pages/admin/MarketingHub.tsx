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
  { label: 'AI Email Generator', icon: Mail, route: '/ai/email-generator', color: 'text-teal-400' },
  { label: 'AI Social Media', icon: Share2, route: '/ai/social-media', color: 'text-pink-400' },
  { label: 'AI Description Writer', icon: PenTool, route: '/ai/description-writer', color: 'text-blue-400' },
  { label: 'AI Translation Hub', icon: Globe, route: '/ai/translation-hub', color: 'text-purple-400' },
  { label: 'AI Video Tour Script', icon: Video, route: '/ai/video-tour-script', color: 'text-orange-400' },
  { label: 'AI Objection Handler', icon: Shield, route: '/ai/objection-handler', color: 'text-red-400' },
  { label: 'AI Follow-up Scheduler', icon: Calendar, route: '/ai/followup-scheduler', color: 'text-green-400' },
  { label: 'AI Client Matcher', icon: Target, route: '/ai/client-matcher', color: 'text-cyan-400' },
  { label: 'AI Lead Qualification', icon: TrendingUp, route: '/ai/lead-qualification', color: 'text-amber-400' },
  { label: 'AI Meeting Summarizer', icon: ClipboardList, route: '/ai/meeting-summarizer', color: 'text-indigo-400' },
  { label: 'AI Call Summarizer', icon: Headphones, route: '/ai/call-summarizer', color: 'text-sky-400' },
  { label: 'AI Document Analyzer', icon: FileText, route: '/ai/document-analyzer', color: 'text-slate-400' },
  { label: 'AI Property Evaluation', icon: Lightbulb, route: '/ai/property-evaluation', color: 'text-yellow-400' },
  { label: 'AI Presentation Generator', icon: Palette, route: '/ai/presentation-generator', color: 'text-rose-400' },
  { label: 'Marketing Creative Suite', icon: Palette, route: '/studio', color: 'text-fuchsia-400' },
  { label: 'AI Video Studio', icon: Video, route: '/toolkit/ai-video-studio', color: 'text-violet-400' },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
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
      case 'draft': return 'bg-zinc-200 text-zinc-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'sending': return 'bg-amber-100 text-amber-700';
      case 'sent': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-orange-100 text-orange-700';
      case 'archived': return 'bg-zinc-200 text-zinc-500';
      default: return 'bg-zinc-200 text-zinc-700';
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
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-black hover:bg-gold/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/20">
                  <Megaphone className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h1 className="font-bold text-black text-xl">Marketing Hub</h1>
                  <p className="text-xs text-black/60">AI-Powered Campaign Command Center</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick AI Actions */}
              <Link to="/ai/email-generator">
                <Button variant="outline" size="sm" className="border-gold/40 text-black hover:bg-gold/10 hidden md:flex">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-gold" />
                  AI Email
                </Button>
              </Link>
              <Link to="/founders-assistant">
                <Button variant="outline" size="sm" className="border-gold/40 text-black hover:bg-gold/10 hidden md:flex">
                  <Bot className="h-3.5 w-3.5 mr-1.5 text-gold" />
                  AI Assistant
                </Button>
              </Link>
              {marketingGuide && <PageGuide guide={marketingGuide} />}
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-black font-semibold shadow-lg shadow-gold/20"
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
              { label: 'Total Campaigns', value: stats.total, icon: BarChart3, iconBg: 'bg-gold/20 border-gold/30', iconColor: 'text-gold' },
              { label: 'Sent', value: stats.sent, icon: Send, iconBg: 'bg-green-100 border-green-200', iconColor: 'text-green-600' },
              { label: 'Scheduled', value: stats.scheduled, icon: Calendar, iconBg: 'bg-blue-100 border-blue-200', iconColor: 'text-blue-600' },
              { label: 'Drafts', value: stats.drafts, icon: Edit2, iconBg: 'bg-amber-100 border-amber-200', iconColor: 'text-amber-600' },
              { label: 'Subscribers', value: subscriberCount || 0, icon: Users, iconBg: 'bg-purple-100 border-purple-200', iconColor: 'text-purple-600' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/80 via-white/60 to-[#F5F0E6] shadow-[0_4px_20px_rgba(200,167,102,0.15)]"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.iconBg} border`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black">{stat.value}</p>
                    <p className="text-xs text-black/60">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <TabsList className="bg-white/80 border-2 border-gold/30">
                <TabsTrigger value="campaigns" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
                  <Megaphone className="w-3.5 h-3.5 mr-1.5" />
                  Campaigns
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  AI Tools
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
                  Templates
                </TabsTrigger>
                <TabsTrigger value="subscribers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
                  Subscribers
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50" />
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
                  { label: 'AI Email Generator', desc: 'Generate professional emails with AI', icon: Mail, route: '/ai/email-generator', color: 'from-teal-500 to-teal-600' },
                  { label: 'AI Suggest Reply', desc: 'Smart reply suggestions for tickets', icon: MessageCircle, route: '/admin/support-tickets', color: 'from-blue-500 to-blue-600' },
                  { label: 'AI Assistant', desc: 'Your personal AI business assistant', icon: Bot, route: '/founders-assistant', color: 'from-purple-500 to-purple-600' },
                  { label: 'AI Social Media', desc: 'Create social media content', icon: Share2, route: '/ai/social-media', color: 'from-pink-500 to-pink-600' },
                  { label: 'AI Description Writer', desc: 'Property descriptions in seconds', icon: PenTool, route: '/ai/description-writer', color: 'from-orange-500 to-orange-600' },
                  { label: 'AI Translation Hub', desc: 'Translate content to 15+ languages', icon: Globe, route: '/ai/translation-hub', color: 'from-indigo-500 to-indigo-600' },
                  { label: 'AI Video Tour Script', desc: 'Script video tours for properties', icon: Video, route: '/ai/video-tour-script', color: 'from-red-500 to-red-600' },
                  { label: 'AI Client Matcher', desc: 'Match clients to properties with AI', icon: Target, route: '/ai/client-matcher', color: 'from-cyan-500 to-cyan-600' },
                  { label: 'AI Lead Qualification', desc: 'Score and qualify leads automatically', icon: TrendingUp, route: '/ai/lead-qualification', color: 'from-amber-500 to-amber-600' },
                  { label: 'AI Objection Handler', desc: 'Handle client objections professionally', icon: Shield, route: '/ai/objection-handler', color: 'from-rose-500 to-rose-600' },
                  { label: 'AI Follow-up Scheduler', desc: 'Smart follow-up timing', icon: Calendar, route: '/ai/followup-scheduler', color: 'from-green-500 to-green-600' },
                  { label: 'AI Meeting Summarizer', desc: 'Summarize meetings into action items', icon: ClipboardList, route: '/ai/meeting-summarizer', color: 'from-violet-500 to-violet-600' },
                  { label: 'AI Market Report', desc: 'Generate market intelligence reports', icon: BarChart3, route: '/ai/market-report', color: 'from-emerald-500 to-emerald-600' },
                  { label: 'AI Contract Reviewer', desc: 'Review contracts for key terms', icon: FileText, route: '/ai/contract-reviewer', color: 'from-slate-500 to-slate-600' },
                  { label: 'AI Investment Report', desc: 'Investment analysis reports', icon: Lightbulb, route: '/ai/investment-report', color: 'from-yellow-500 to-yellow-600' },
                  { label: 'All AI Tools', desc: 'Access all 52+ platform tools', icon: Sparkles, route: '/toolkit', color: 'from-gold to-amber-600' },
                ].map((tool, idx) => (
                  <motion.div
                    key={tool.route}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Link
                      to={tool.route}
                      className="block p-4 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F5F0E6] hover:border-gold hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg shrink-0`}>
                          <tool.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-black text-sm group-hover:text-gold transition-colors">{tool.label}</p>
                          <p className="text-xs text-black/60 mt-0.5">{tool.desc}</p>
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
                  <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
                </div>
              ) : filteredCampaigns?.length === 0 ? (
                <div className="text-center py-12 border-2 border-gold/30 rounded-xl bg-gradient-to-br from-white/80 via-white/60 to-[#F5F0E6]">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold/20 flex items-center justify-center">
                    <Send className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold mb-2 text-black">No campaigns yet</h3>
                  <p className="text-sm text-black/60 mb-4">Create your first marketing campaign.</p>
                  <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-black font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-gold/30 rounded-xl overflow-hidden bg-white/80">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-gold/20 bg-gold/5">
                        <TableHead className="text-black font-semibold">Campaign</TableHead>
                        <TableHead className="text-black font-semibold">Type</TableHead>
                        <TableHead className="text-black font-semibold">Status</TableHead>
                        <TableHead className="text-black font-semibold">Audience</TableHead>
                        <TableHead className="text-right text-black font-semibold">Opens</TableHead>
                        <TableHead className="text-right text-black font-semibold">Clicks</TableHead>
                        <TableHead className="text-right text-black font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns?.map((campaign) => (
                        <TableRow key={campaign.id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-medium text-black">{campaign.name}</p>
                              {campaign.subject_line && (
                                <p className="text-xs text-black/50 truncate max-w-[200px]">{campaign.subject_line}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-black">
                              {getTypeIcon(campaign.campaign_type)}
                              <span className="capitalize">{campaign.campaign_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                          </TableCell>
                          <TableCell className="capitalize text-black">{campaign.target_audience}</TableCell>
                          <TableCell className="text-right text-black">
                            {campaign.total_opened > 0 
                              ? `${((campaign.total_opened / campaign.total_sent) * 100).toFixed(1)}%`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right text-black">
                            {campaign.total_clicked > 0 
                              ? `${((campaign.total_clicked / campaign.total_sent) * 100).toFixed(1)}%`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                                  <MoreHorizontal className="h-4 w-4 text-black" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border-2 border-gold/30">
                                <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)} className="text-black hover:bg-gold/10">
                                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-black hover:bg-gold/10">
                                  <Eye className="h-4 w-4 mr-2" /> Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)} className="text-black hover:bg-gold/10">
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
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'New Listing Announcement', description: 'Announce new property listings', icon: Building2, type: 'email' },
                  { name: 'Monthly Newsletter', description: 'Regular updates and insights', icon: FileText, type: 'email' },
                  { name: 'Price Reduction Alert', description: 'Notify buyers of price drops', icon: TrendingUp, type: 'email' },
                  { name: 'Open House Invitation', description: 'Invite prospects to viewings', icon: Calendar, type: 'email' },
                  { name: 'Market Update', description: 'Share market trends and data', icon: BarChart3, type: 'email' },
                  { name: 'Thank You Follow-up', description: 'Thank clients after meetings', icon: Heart, type: 'email' },
                  { name: 'Welcome Email', description: 'Onboard new clients warmly', icon: Mail, type: 'email' },
                  { name: 'Property Inquiry Response', description: 'Auto-reply to property inquiries', icon: MessageSquare, type: 'email' },
                  { name: 'Event Invitation', description: 'Invite clients to exclusive events', icon: Calendar, type: 'email' },
                  { name: 'Referral Request', description: 'Ask satisfied clients for referrals', icon: Users, type: 'email' },
                  { name: 'Holiday Greeting', description: 'Seasonal greetings to your network', icon: Sparkles, type: 'email' },
                  { name: 'Investment Opportunity', description: 'Present new investment options', icon: Lightbulb, type: 'email' },
                  { name: 'Broker Onboarding', description: 'Welcome new team members', icon: UserCog, type: 'email' },
                  { name: 'Anniversary Follow-up', description: 'Mark purchase anniversaries', icon: Heart, type: 'email' },
                ].map((template, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F5F0E6] hover:border-gold hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => setIsCreating(true)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center border border-gold/30 mb-3">
                      <template.icon className="w-5 h-5 text-black" />
                    </div>
                    <h4 className="font-semibold text-black group-hover:text-gold transition-colors">{template.name}</h4>
                    <p className="text-sm text-black/60 mt-1">{template.description}</p>
                    <Badge className="mt-3 bg-gold/10 text-gold border-gold/30">{template.type}</Badge>
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

      {/* Right Sidebar - Quick Actions (desktop only) */}
      <aside className="w-56 shrink-0 border-l-2 border-gold/30 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] hidden xl:flex flex-col p-4">
        <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-4">Quick Actions</h3>
        
        <div className="space-y-2">
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full justify-start bg-gradient-to-r from-gold to-amber-600 text-black font-semibold text-xs"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            New Campaign
          </Button>
          
          <Link to="/ai/email-generator" className="block">
            <Button variant="outline" size="sm" className="w-full justify-start border-gold/40 text-black text-xs hover:bg-gold/10">
              <Mail className="w-3.5 h-3.5 mr-2 text-teal-500" />
              Write Email
            </Button>
          </Link>
          
          <Link to="/ai/social-media" className="block">
            <Button variant="outline" size="sm" className="w-full justify-start border-gold/40 text-black text-xs hover:bg-gold/10">
              <Share2 className="w-3.5 h-3.5 mr-2 text-pink-500" />
              Social Post
            </Button>
          </Link>
          
          <Link to="/founders-assistant" className="block">
            <Button variant="outline" size="sm" className="w-full justify-start border-gold/40 text-black text-xs hover:bg-gold/10">
              <Bot className="w-3.5 h-3.5 mr-2 text-purple-500" />
              AI Assistant
            </Button>
          </Link>
        </div>

        <div className="h-px bg-gold/20 my-4" />

        <h3 className="text-xs font-bold text-black/60 uppercase tracking-widest mb-3">Performance</h3>
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-gold/20 bg-white/50">
            <p className="text-2xl font-bold text-black">{stats.sent}</p>
            <p className="text-[10px] text-black/60">Campaigns Sent</p>
          </div>
          <div className="p-3 rounded-lg border border-gold/20 bg-white/50">
            <p className="text-2xl font-bold text-black">{subscriberCount || 0}</p>
            <p className="text-[10px] text-black/60">Total Subscribers</p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MarketingHub;
