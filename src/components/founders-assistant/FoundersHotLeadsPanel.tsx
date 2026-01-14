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
  RefreshCw
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

  const getUrgencyLevel = (lead: HotLead): { level: 'critical' | 'high' | 'medium' | 'low', hours: number } => {
    if (!lead.updated_at) {
      return { level: 'medium', hours: 0 };
    }
    const hoursSinceUpdate = differenceInHours(new Date(), new Date(lead.updated_at));
    if (hoursSinceUpdate >= 72) return { level: 'critical', hours: hoursSinceUpdate };
    if (hoursSinceUpdate >= 48) return { level: 'high', hours: hoursSinceUpdate };
    if (hoursSinceUpdate >= 24) return { level: 'medium', hours: hoursSinceUpdate };
    return { level: 'low', hours: hoursSinceUpdate };
  };

  const urgencyStyles = {
    critical: 'bg-red-500/20 border-red-500/40 text-red-400',
    high: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
    medium: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    low: 'bg-green-500/20 border-green-500/40 text-green-400',
  };

  const handleContact = (lead: HotLead, method: 'call' | 'email' | 'whatsapp') => {
    toast.info(`Initiating ${method} with ${lead.full_name}...`);
  };

  const vipLeads = leads.filter(l => l.vip).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#0E0E0E] border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/10">
                <Flame className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gold">{vipLeads}</p>
                <p className="text-xs text-gray-400">VIP Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/10">
                <User className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gold">{leads.length}</p>
                <p className="text-xs text-gray-400">Total Hot Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Your Hot Leads
          </h3>
          <p className="text-sm text-gray-400">VIP leads requiring attention</p>
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

      {/* Leads List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {leads.length === 0 ? (
            <Card className="bg-[#0E0E0E] border-gold/20">
              <CardContent className="p-8 text-center">
                <Flame className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                <p className="text-gray-400">No hot leads at the moment</p>
                <p className="text-sm text-gray-500 mt-1">Great job staying on top of your leads!</p>
              </CardContent>
            </Card>
          ) : (
            leads.map((lead, index) => {
              const urgency = getUrgencyLevel(lead);
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`bg-[#0E0E0E] border transition-all cursor-pointer hover:border-gold/40 ${urgencyStyles[urgency.level]}`}
                    onClick={() => onLeadClick?.(lead.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gold/10">
                            <User className="w-5 h-5 text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-white font-semibold truncate">{lead.full_name || 'Unknown'}</h4>
                              {lead.vip && (
                                <Badge className="bg-gold/10 text-gold border-gold/30">VIP</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 flex-wrap">
                              {lead.source && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {lead.source}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lead.updated_at ? format(new Date(lead.updated_at), 'MMM d') : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {lead.phone_e164 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleContact(lead, 'call'); }}
                              className="w-8 h-8 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center justify-center transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                          )}
                          {lead.email_lower && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleContact(lead, 'email'); }}
                              className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        </div>
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
