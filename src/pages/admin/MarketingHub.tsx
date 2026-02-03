/**
 * Marketing Hub Page
 * Campaign management for email, WhatsApp, and social media marketing
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
  MoreHorizontal
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'draft': return 'bg-zinc-500/20 text-zinc-400';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'sending': return 'bg-yellow-500/20 text-yellow-400';
      case 'sent': return 'bg-green-500/20 text-green-400';
      case 'paused': return 'bg-orange-500/20 text-orange-400';
      case 'archived': return 'bg-zinc-500/20 text-zinc-500';
      default: return 'bg-zinc-500/20 text-zinc-400';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                <Send className="h-5 w-5 text-black" />
              </div>
              <div>
                <h1 className="font-bold">Marketing Hub</h1>
                <p className="text-xs text-muted-foreground">
                  Campaign Management & Analytics
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gold hover:bg-gold-dark text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/10">
                <BarChart3 className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Campaigns</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Send className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subscriberCount}</p>
                <p className="text-xs text-muted-foreground">Subscribers</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="campaigns" className="m-0">
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
              </div>
            ) : filteredCampaigns?.length === 0 ? (
              <div className="text-center py-12 border rounded-xl bg-card">
                <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first marketing campaign to reach your audience.
                </p>
                <Button onClick={() => setIsCreating(true)} className="bg-gold hover:bg-gold-dark text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead className="text-right">Opens</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns?.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            {campaign.subject_line && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {campaign.subject_line}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(campaign.campaign_type)}
                            <span className="capitalize">{campaign.campaign_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{campaign.target_audience}</TableCell>
                        <TableCell className="text-right">
                          {campaign.total_opened > 0 
                            ? `${((campaign.total_opened / campaign.total_sent) * 100).toFixed(1)}%`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.total_clicked > 0 
                            ? `${((campaign.total_clicked / campaign.total_sent) * 100).toFixed(1)}%`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-500"
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
            <div className="text-center py-12 border rounded-xl bg-card">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Email Templates</h3>
              <p className="text-sm text-muted-foreground">
                Create reusable templates for your campaigns.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="subscribers" className="m-0">
            <div className="text-center py-12 border rounded-xl bg-card">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">{subscriberCount} Active Subscribers</h3>
              <p className="text-sm text-muted-foreground">
                Manage your newsletter subscribers and segments.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MarketingHub;
