import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, Clock, AlertCircle, CheckCircle, 
  Phone, MessageSquare, Calendar, RefreshCw,
  Zap, TrendingDown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LeadAlert {
  id: string;
  leadId: string;
  leadName: string;
  alertType: 'stale' | 'no_response' | 'followup_due' | 'hot_lead' | 'callback';
  message: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
  daysInactive: number;
  suggestedAction: string;
}

interface SmartLeadAlertsProps {
  userId: string;
  limit?: number;
}

const SmartLeadAlerts = ({ userId, limit = 10 }: SmartLeadAlertsProps) => {
  const [alerts, setAlerts] = useState<LeadAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateAlerts();
  }, [userId]);

  const generateAlerts = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get leads with their states
      const { data: leadStates } = await supabase
        .from("crm_lead_state_per_user")
        .select(`
          lead_id,
          pipeline_status,
          last_touch_at,
          next_followup_at,
          crm_leads (
            id,
            full_name
          )
        `)
        .eq("user_id", userId);

      const newAlerts: LeadAlert[] = [];

      for (const state of (leadStates || [])) {
        const lead = state.crm_leads as any;
        if (!lead) continue;

        const lastTouch = state.last_touch_at ? new Date(state.last_touch_at) : null;
        const nextFollowup = state.next_followup_at ? new Date(state.next_followup_at) : null;
        const status = state.pipeline_status;

        // Calculate days inactive
        const daysInactive = lastTouch 
          ? Math.floor((now.getTime() - lastTouch.getTime()) / (1000 * 60 * 60 * 24))
          : 30;

        // STALE LEAD: 7+ days no contact
        if (daysInactive >= 7) {
          newAlerts.push({
            id: `stale-${lead.id}`,
            leadId: lead.id,
            leadName: lead.full_name,
            alertType: 'stale',
            message: `No contact for ${daysInactive} days - immediate action required`,
            createdAt: now.toISOString(),
            priority: 'high',
            daysInactive,
            suggestedAction: 'Re-engage with valuable update (new project, price change, market news)'
          });
        }
        // WARNING: 3-6 days no contact
        else if (daysInactive >= 3) {
          newAlerts.push({
            id: `warning-${lead.id}`,
            leadId: lead.id,
            leadName: lead.full_name,
            alertType: 'no_response',
            message: `${daysInactive} days since last contact`,
            createdAt: now.toISOString(),
            priority: 'medium',
            daysInactive,
            suggestedAction: 'Schedule follow-up call or send WhatsApp check-in'
          });
        }

        // FOLLOWUP DUE
        if (nextFollowup && nextFollowup <= now) {
          newAlerts.push({
            id: `followup-${lead.id}`,
            leadId: lead.id,
            leadName: lead.full_name,
            alertType: 'followup_due',
            message: `Follow-up was due ${formatDistanceToNow(nextFollowup, { addSuffix: true })}`,
            createdAt: now.toISOString(),
            priority: nextFollowup < oneDayAgo ? 'high' : 'medium',
            daysInactive,
            suggestedAction: 'Complete scheduled follow-up immediately'
          });
        }

        // HOT LEAD - high engagement
        const hotStatuses = ['interested', 'qualified', 'negotiation', 'viewing'];
        if (hotStatuses.includes(status || '')) {
          if (daysInactive >= 1 && daysInactive < 3) {
            newAlerts.push({
              id: `hot-${lead.id}`,
              leadId: lead.id,
              leadName: lead.full_name,
              alertType: 'hot_lead',
              message: `Hot lead needs attention - ${status}`,
              createdAt: now.toISOString(),
              priority: 'high',
              daysInactive,
              suggestedAction: 'Prioritize this lead - schedule viewing or send proposal'
            });
          }
        }

        // CALLBACK REQUESTED - check for no_answer status as proxy
        if (status === 'no_answer') {
          newAlerts.push({
            id: `callback-${lead.id}`,
            leadId: lead.id,
            leadName: lead.full_name,
            alertType: 'callback',
            message: 'No answer - needs callback attempt',
            createdAt: now.toISOString(),
            priority: 'medium',
            daysInactive,
            suggestedAction: 'Try calling again at a different time'
          });
        }
      }

      // Sort by priority and date
      newAlerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.daysInactive - a.daysInactive;
      });

      setAlerts(newAlerts.slice(0, limit));
    } catch (err) {
      console.error("Failed to generate alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'stale': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'no_response': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'followup_due': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'hot_lead': return <Zap className="h-4 w-4 text-emerald-500" />;
      case 'callback': return <Phone className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'stale': return 'bg-red-500/10 border-red-500/30';
      case 'no_response': return 'bg-amber-500/10 border-amber-500/30';
      case 'followup_due': return 'bg-blue-500/10 border-blue-500/30';
      case 'hot_lead': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'callback': return 'bg-purple-500/10 border-purple-500/30';
      default: return 'bg-muted/30 border-border';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500 text-white text-[10px]">HIGH</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500 text-white text-[10px]">MEDIUM</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">LOW</Badge>;
    }
  };

  const handleQuickAction = async (alert: LeadAlert, action: 'call' | 'whatsapp' | 'dismiss') => {
    if (action === 'dismiss') {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
      toast.success("Alert dismissed");
      return;
    }

    // Log the action
    await supabase.from("crm_activities").insert({
      lead_id: alert.leadId,
      user_id: userId,
      activity_type: action === 'call' ? 'call' : 'whatsapp_click',
      metadata: { from_alert: true, alert_type: alert.alertType }
    });

    // Update last touch
    await supabase
      .from("crm_lead_state_per_user")
      .update({ last_touch_at: new Date().toISOString() })
      .eq("lead_id", alert.leadId)
      .eq("user_id", userId);

    toast.success(`Opening ${action === 'call' ? 'phone' : 'WhatsApp'}...`);
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-6 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Analyzing leads...</p>
        </CardContent>
      </Card>
    );
  }

  const highPriority = alerts.filter(a => a.priority === 'high').length;
  const staleCount = alerts.filter(a => a.alertType === 'stale').length;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-white font-bold">
            <Bell className="h-4 w-4 text-amber-400" />
            Smart Lead Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            {staleCount > 0 && (
              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                {staleCount} Stale
              </Badge>
            )}
            {highPriority > 0 && (
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {highPriority} Urgent
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-muted-foreground">All leads are up to date!</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-all hover:scale-[1.01] ${getAlertColor(alert.alertType)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.alertType)}
                      <span className="font-semibold text-sm text-foreground">{alert.leadName}</span>
                    </div>
                    {getPriorityBadge(alert.priority)}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
                  
                  <div className="p-2 rounded bg-black/20 mb-3">
                    <p className="text-[10px] text-muted-foreground">Suggested:</p>
                    <p className="text-xs text-foreground">{alert.suggestedAction}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/20"
                      onClick={() => handleQuickAction(alert, 'call')}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                      onClick={() => handleQuickAction(alert, 'whatsapp')}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-zinc-400 hover:text-zinc-300 ml-auto"
                      onClick={() => handleQuickAction(alert, 'dismiss')}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={generateAlerts}
          className="w-full mt-4 text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Alerts
        </Button>
      </CardContent>
    </Card>
  );
};

export default SmartLeadAlerts;
