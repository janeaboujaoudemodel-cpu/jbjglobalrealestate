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
    try {
      // Fetch only user's personal hot leads (VIP = true)
      const { data, error } = await supabase
        .from('crm_leads')
        .select('id, full_name, email_lower, phone_e164, vip, source, notes, created_at, updated_at')
        .eq('vip', true)
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
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Hot Leads Notice */}
      <Card className="bg-gradient-to-r from-gold/10 to-orange-500/10 border-gold/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gold/20">
              <Bell className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h4 className="text-white font-semibold">Your Personal Hot Leads</h4>
              <p className="text-sm text-gray-400 mt-1">
                These are YOUR assigned VIP leads. Follow up within 3 days to maintain ownership.
                Leads inactive for 72+ hours may be reassigned automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0E0E0E] border-gold/20">
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-gold">{leads.length}</p>
            <p className="text-xs text-gray-400">Total Hot Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-red-500/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">{criticalLeads}</p>
            <p className="text-xs text-gray-400">Critical (72h+)</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-orange-500/20">
          <CardContent className="p-4 text-center">
            <Timer className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-400">{highPriorityLeads}</p>
            <p className="text-xs text-gray-400">High Priority</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-green-500/20">
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{activeLeads}</p>
            <p className="text-xs text-gray-400">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Hot Leads Queue
          </h3>
          <p className="text-sm text-gray-400">Sorted by urgency - Most critical first</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-gold/20 text-gold hover:bg-gold/10"
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
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-red-400 font-semibold">
                {criticalLeads} lead{criticalLeads > 1 ? 's' : ''} at risk of reassignment!
              </p>
              <p className="text-sm text-red-300/70">
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
            <Card className="bg-[#0E0E0E] border-gold/20">
              <CardContent className="p-8 text-center">
                <Flame className="w-16 h-16 text-gold/30 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2">No Hot Leads</h4>
                <p className="text-gray-400">No hot leads at the moment</p>
                <p className="text-sm text-gray-500 mt-1">Great job staying on top of your leads!</p>
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
                      className={`bg-[#0E0E0E] border-2 transition-all cursor-pointer hover:scale-[1.01] ${urgencyStyles[urgency.level]}`}
                      onClick={() => onLeadClick?.(lead.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              urgency.level === 'critical' ? 'bg-red-500/20' :
                              urgency.level === 'high' ? 'bg-orange-500/20' :
                              urgency.level === 'medium' ? 'bg-yellow-500/20' :
                              'bg-green-500/20'
                            }`}>
                              <User className={`w-6 h-6 ${
                                urgency.level === 'critical' ? 'text-red-400' :
                                urgency.level === 'high' ? 'text-orange-400' :
                                urgency.level === 'medium' ? 'text-yellow-400' :
                                'text-green-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-white font-semibold truncate">{lead.full_name || 'Unknown'}</h4>
                                {lead.vip && (
                                  <Badge className="bg-gold/10 text-gold border-gold/30">⭐ VIP</Badge>
                                )}
                                <Badge className={urgencyBadgeStyles[urgency.level]}>
                                  {urgency.level.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400 mt-1">{urgency.message}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 flex-wrap">
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
                              <span className="text-gray-500">Time until reassignment risk</span>
                              <span className={
                                urgency.level === 'critical' ? 'text-red-400' :
                                urgency.level === 'high' ? 'text-orange-400' :
                                'text-yellow-400'
                              }>
                                {timeToReassign > 0 ? `${Math.floor(timeToReassign)}h remaining` : 'At risk!'}
                              </span>
                            </div>
                            <Progress 
                              value={progressValue} 
                              className={`h-1.5 ${
                                urgency.level === 'critical' ? 'bg-red-900' :
                                urgency.level === 'high' ? 'bg-orange-900' :
                                'bg-yellow-900'
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
                              className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              Call
                            </Button>
                          )}
                          {lead.email_lower && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleContact(lead, 'email'); }}
                              className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                            >
                              <Mail className="w-4 h-4 mr-1" />
                              Email
                            </Button>
                          )}
                          {lead.phone_e164 && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleContact(lead, 'whatsapp'); }}
                              className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                          <div className="flex-1" />
                          <ChevronRight className="w-5 h-5 text-gray-500" />
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
