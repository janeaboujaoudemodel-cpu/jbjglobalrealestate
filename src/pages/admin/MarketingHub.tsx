/**
 * Marketing Hub Page
 * Campaign management for email, WhatsApp, and social media marketing
 * Premium UI with champagne gradients and gold accents
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Mail, 
  MessageSquare, 
  Share2, 
  Send, 
  Calendar, 
  Users, 
  Eye, 
  Edit2, 
  Trash2,
  Copy,
  BarChart3,
  Search,
  Filter,
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

const MarketingHub: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'subscribers'>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch campaigns
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

  // Fetch subscriber count
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

  // Stats
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-black hover:bg-gold/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/20">
                <Send className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="font-bold text-black text-xl">Marketing Hub</h1>
                <p className="text-xs text-black/60">
                  Campaign Management & Analytics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

      <main className="container px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/80 via-white/60 to-[#F5F0E6] shadow-[0_4px_20px_rgba(200,167,102,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gold/20 border border-gold/30">
                <BarChart3 className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.total}</p>
                <p className="text-xs text-black/60">Total Campaigns</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/80 via-white/60 to-[#F5F0E6] shadow-[0_4px_20px_rgba(200,167,102,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-100 border border-green-200">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.sent}</p>
                <p className="text-xs text-black/60">Sent</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/80 via-white/60 to-[#F5F0E6] shadow-[0_4px_20px_rgba(200,167,102,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 border border-blue-200">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.scheduled}</p>
                <p className="text-xs text-black/60">Scheduled</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/80 via-white/60 to-[#F5F0E6] shadow-[0_4px_20px_rgba(200,167,102,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 border border-purple-200">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{subscriberCount}</p>
                <p className="text-xs text-black/60">Subscribers</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <TabsList className="bg-white/80 border-2 border-gold/30">
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">Campaigns</TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">Templates</TabsTrigger>
              <TabsTrigger value="subscribers" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">Subscribers</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" className="border-2 border-gold/40 bg-white/80 hover:bg-gold/10">
                <Filter className="h-4 w-4 text-black" />
              </Button>
            </div>
          </div>

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
                <p className="text-sm text-black/60 mb-4">
                  Create your first marketing campaign to reach your audience.
                </p>
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
                              <p className="text-xs text-black/50 truncate max-w-[200px]">
                                {campaign.subject_line}
                              </p>
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
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
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
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-black hover:bg-gold/10">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)} className="text-black hover:bg-gold/10">
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteCampaign(campaign.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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

          <TabsContent value="templates" className="m-0">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Pre-built templates */}
              {[
                { name: 'New Listing Announcement', description: 'Announce new property listings to your audience', icon: '🏠', type: 'email' },
                { name: 'Monthly Newsletter', description: 'Regular updates and market insights', icon: '📰', type: 'email' },
                { name: 'Price Reduction Alert', description: 'Notify interested buyers of price drops', icon: '💰', type: 'email' },
                { name: 'Open House Invitation', description: 'Invite prospects to property viewings', icon: '🚪', type: 'email' },
                { name: 'Market Update', description: 'Share latest market trends and data', icon: '📊', type: 'email' },
                { name: 'Thank You Follow-up', description: 'Thank clients after meetings or viewings', icon: '🙏', type: 'email' },
              ].map((template, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F5F0E6] hover:border-gold hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => {
                    setIsCreating(true);
                    // Template would pre-fill content
                  }}
                >
                  <div className="text-3xl mb-3">{template.icon}</div>
                  <h3 className="font-semibold text-black group-hover:text-gold transition-colors">{template.name}</h3>
                  <p className="text-xs text-black/60 mt-1">{template.description}</p>
                  <Badge className="mt-3 bg-gold/20 text-black text-xs">{template.type}</Badge>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subscribers" className="m-0">
            <SubscribersPanel count={subscriberCount || 0} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MarketingHub;
