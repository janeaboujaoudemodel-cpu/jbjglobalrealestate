import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  AlertTriangle,
  User,
  Building,
  DollarSign,
  Calendar,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Timer,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, differenceInHours, differenceInDays } from 'date-fns';

interface HotLead {
  id: string;
  full_name: string | null;
  email_lower: string | null;
  phone_e164: string | null;
  vip: boolean | null;
  source: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FoundersHotLeadsPanelProps {
  onLeadClick?: (leadId: string) => void;
}

const FoundersHotLeadsPanel: React.FC<FoundersHotLeadsPanelProps> = ({ onLeadClick }) => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<HotLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHotLeads();
    }
  }, [user]);

  const fetchHotLeads = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch only user's personal hot leads (VIP = true AND assigned to current user)
      const userId = user.id;
      const { data, error } = await (supabase
        .from('crm_leads')
        .select('id, full_name, email_lower, phone_e164, vip, source, notes, created_at, updated_at') as any)
        .eq('vip', true)
        .eq('assigned_user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLeads((data as HotLead[]) || []);
    } catch (error) {
      console.error('Error fetching hot leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHotLeads();
    setRefreshing(false);
    toast.success('Hot leads refreshed');
  };

  const getUrgencyLevel = (lead: HotLead): { level: 'critical' | 'high' | 'medium' | 'low', hours: number, message: string } => {
    if (!lead.updated_at) {
      return { level: 'medium', hours: 0, message: 'Follow up soon' };
    }
    const hoursSinceUpdate = differenceInHours(new Date(), new Date(lead.updated_at));
    const daysSinceUpdate = differenceInDays(new Date(), new Date(lead.updated_at));
    
    if (hoursSinceUpdate >= 72) {
      return { 
        level: 'critical', 
        hours: hoursSinceUpdate, 
        message: `⚠️ CRITICAL: ${daysSinceUpdate}+ days inactive - Risk of reassignment!`
      };
    }
    if (hoursSinceUpdate >= 48) {
      return { 
        level: 'high', 
        hours: hoursSinceUpdate, 
        message: `🔴 High Priority: ${Math.floor(hoursSinceUpdate)}h since last contact`
      };
    }
    if (hoursSinceUpdate >= 24) {
      return { 
        level: 'medium', 
        hours: hoursSinceUpdate, 
        message: `🟡 Follow up needed: ${Math.floor(hoursSinceUpdate)}h ago`
      };
    }
    return { 
      level: 'low', 
      hours: hoursSinceUpdate, 
      message: `✅ Active: Last contact ${Math.floor(hoursSinceUpdate)}h ago`
    };
  };

  const urgencyStyles = {
    critical: 'bg-red-500/10 border-red-500/40',
    high: 'bg-orange-500/10 border-orange-500/40',
    medium: 'bg-yellow-500/10 border-yellow-500/40',
    low: 'bg-green-500/10 border-green-500/40',
  };

  const urgencyBadgeStyles = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const handleContact = (lead: HotLead, method: 'call' | 'email' | 'whatsapp') => {
    const urgency = getUrgencyLevel(lead);
    
    // Log activity and notify
    toast.info(`Initiating ${method} with ${lead.full_name}...`, {
      description: urgency.level === 'critical' ? '⚠️ This lead is at risk!' : undefined
    });
    
    // Open appropriate communication method
    if (method === 'call' && lead.phone_e164) {
      window.open(`tel:${lead.phone_e164}`);
    } else if (method === 'email' && lead.email_lower) {
      window.open(`mailto:${lead.email_lower}`);
    } else if (method === 'whatsapp' && lead.phone_e164) {
      window.open(`https://wa.me/${lead.phone_e164.replace('+', '')}`);
    }
  };

  // Calculate stats
  const criticalLeads = leads.filter(l => getUrgencyLevel(l).level === 'critical').length;
  const highPriorityLeads = leads.filter(l => getUrgencyLevel(l).level === 'high').length;
  const activeLeads = leads.filter(l => getUrgencyLevel(l).level === 'low').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Hot Leads Notice */}
      <Card className="bg-gradient-to-r from-gold/10 to-amber-500/10 border-2 border-[#B89555]/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#EFE6D6]/20 border border-[#B89555]/30">
              <Bell className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <h4 className="text-[#1A1A1A] font-semibold">Your Personal Hot Leads</h4>
              <p className="text-sm text-[#1A1A1A]/70 mt-1">
                These are YOUR assigned VIP leads. Follow up within 3 days to maintain ownership.
                Leads inactive for 72+ hours may be reassigned automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview - White Pearl/Gold Champagne */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 text-[#1A1A1A] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#1A1A1A]">{leads.length}</p>
            <p className="text-xs text-[#1A1A1A]/70">Total Hot Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7] border-2 border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.1)]">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{criticalLeads}</p>
            <p className="text-xs text-[#1A1A1A]/70">Critical (72h+)</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7] border-2 border-orange-500/30 shadow-[0_4px_20px_rgba(249,115,22,0.1)]">
          <CardContent className="p-4 text-center">
            <Timer className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{highPriorityLeads}</p>
            <p className="text-xs text-[#1A1A1A]/70">High Priority</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7] border-2 border-green-500/30 shadow-[0_4px_20px_rgba(34,197,94,0.1)]">
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{activeLeads}</p>
            <p className="text-xs text-[#1A1A1A]/70">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Hot Leads Queue
          </h3>
          <p className="text-sm text-[#1A1A1A]/70">Sorted by urgency - Most critical first</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Critical Leads Warning */}
      {criticalLeads > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg bg-red-50 border-2 border-red-200 shadow-[0_4px_20px_rgba(239,68,68,0.1)]"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-red-700 font-semibold">
                {criticalLeads} lead{criticalLeads > 1 ? 's' : ''} at risk of reassignment!
              </p>
              <p className="text-sm text-red-600/80">
                Contact these leads immediately to maintain ownership.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leads List - Sorted by urgency */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {leads.length === 0 ? (
            <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/20 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardContent className="p-8 text-center">
                <Flame className="w-16 h-16 text-[#1A1A1A]/70 mx-auto mb-4" />
                <h4 className="text-[#1A1A1A] font-semibold mb-2">No Hot Leads</h4>
                <p className="text-[#1A1A1A]/70">No hot leads at the moment</p>
                <p className="text-sm text-[#1A1A1A]/70 mt-1">Great job staying on top of your leads!</p>
              </CardContent>
            </Card>
          ) : (
            // Sort by urgency level
            [...leads]
              .sort((a, b) => {
                const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return levelOrder[getUrgencyLevel(a).level] - levelOrder[getUrgencyLevel(b).level];
              })
              .map((lead, index) => {
                const urgency = getUrgencyLevel(lead);
                const timeToReassign = 72 - urgency.hours;
                const progressValue = Math.max(0, Math.min(100, (urgency.hours / 72) * 100));
                
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`bg-[#FDFBF7] border-2 transition-all cursor-pointer hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(200,167,102,0.15)] ${
                        urgency.level === 'critical' ? 'border-red-300' :
                        urgency.level === 'high' ? 'border-orange-300' :
                        urgency.level === 'medium' ? 'border-amber-300' :
                        'border-green-300'
                      }`}
                      onClick={() => onLeadClick?.(lead.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              urgency.level === 'critical' ? 'bg-red-50' :
                              urgency.level === 'high' ? 'bg-orange-50' :
                              urgency.level === 'medium' ? 'bg-amber-50' :
                              'bg-green-50'
                            }`}>
                              <User className={`w-6 h-6 ${
                                urgency.level === 'critical' ? 'text-red-600' :
                                urgency.level === 'high' ? 'text-orange-600' :
                                urgency.level === 'medium' ? 'text-amber-600' :
                                'text-green-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-[#1A1A1A] font-semibold truncate">{lead.full_name || 'Unknown'}</h4>
                                {lead.vip && (
                                  <Badge className="bg-[#EFE6D6]/10 text-[#1A1A1A] border border-[#B89555]/30">⭐ VIP</Badge>
                                )}
                                <Badge className={`border ${
                                  urgency.level === 'critical' ? 'bg-red-50 text-red-600 border-red-200' :
                                  urgency.level === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                  urgency.level === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                  'bg-green-50 text-green-600 border-green-200'
                                }`}>
                                  {urgency.level.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-[#1A1A1A]/70 mt-1">{urgency.message}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-[#1A1A1A]/70 flex-wrap">
                                {lead.source && (
                                  <span className="flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {lead.source}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lead.updated_at ? format(new Date(lead.updated_at), 'MMM d, h:mm a') : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Time to Reassignment Progress Bar */}
                        {urgency.level !== 'low' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[#1A1A1A]/70">Time until reassignment risk</span>
                              <span className={
                                urgency.level === 'critical' ? 'text-red-600' :
                                urgency.level === 'high' ? 'text-orange-600' :
                                'text-amber-600'
                              }>
                                {timeToReassign > 0 ? `${Math.floor(timeToReassign)}h remaining` : 'At risk!'}
                              </span>
                            </div>
                            <Progress 
                              value={progressValue} 
                              className={`h-1.5 ${
                                urgency.level === 'critical' ? 'bg-red-100' :
                                urgency.level === 'high' ? 'bg-orange-100' :
                                'bg-amber-100'
                              }`}
                            />
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                          {lead.phone_e164 && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleContact(lead, 'call'); }}
                              className="bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              Call
                            </Button>
                          )}
                          {lead.email_lower && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleContact(lead, 'email'); }}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                            >
                              <Mail className="w-4 h-4 mr-1" />
                              Email
                            </Button>
                          )}
                          {lead.phone_e164 && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleContact(lead, 'whatsapp'); }}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                          <div className="flex-1" />
                          <ChevronRight className="w-5 h-5 text-[#1A1A1A]/70" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FoundersHotLeadsPanel;
