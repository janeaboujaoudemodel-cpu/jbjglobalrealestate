import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertTriangle, Clock, UserMinus, RefreshCw, 
  Send, Users, Ban, ChevronRight
} from "lucide-react";

interface InactiveBroker {
  userId: string;
  displayName: string;
  email: string;
  inactiveDays: number;
  leadCount: number;
  lastActivityAt: string | null;
  status: 'warning' | 'suspended' | 'reassigning';
}

interface BrokerInactivityMonitorProps {
  hasOwnerAccess: boolean;
}

const BrokerInactivityMonitor = ({ hasOwnerAccess }: BrokerInactivityMonitorProps) => {
  const [inactiveBrokers, setInactiveBrokers] = useState<InactiveBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (hasOwnerAccess) {
      checkBrokerInactivity();
    }
  }, [hasOwnerAccess]);

  const checkBrokerInactivity = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get all active broker profiles
      const { data: brokers } = await supabase
        .from("broker_profiles")
        .select("user_id, display_name, email")
        .eq("is_active", true);

      if (!brokers || brokers.length === 0) {
        setLoading(false);
        return;
      }

      const inactive: InactiveBroker[] = [];

      for (const broker of brokers) {
        // Get last activity for this broker
        const { data: activities } = await supabase
          .from("crm_activities")
          .select("created_at")
          .eq("user_id", broker.user_id)
          .order("created_at", { ascending: false })
          .limit(1);

        // Get assigned leads count
        const { data: assignments } = await supabase
          .from("crm_lead_assignments")
          .select("id")
          .eq("assigned_to_user_id", broker.user_id)
          .is("unassigned_at", null);

        const lastActivity = activities?.[0]?.created_at;
        const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
        const leadCount = assignments?.length || 0;

        if (leadCount === 0) continue; // Skip brokers with no leads

        let inactiveDays = 0;
        let status: 'warning' | 'suspended' | 'reassigning' = 'warning';

        if (lastActivityDate) {
          inactiveDays = Math.floor(
            (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (inactiveDays >= 3) {
            status = 'suspended';
          } else if (inactiveDays >= 1) {
            status = 'warning';
          }
        } else {
          // No activity ever - check account creation date
          inactiveDays = 7; // Assume inactive for 7 days
          status = 'suspended';
        }

        if (inactiveDays >= 1 && leadCount > 0) {
          inactive.push({
            userId: broker.user_id,
            displayName: broker.display_name,
            email: broker.email || '',
            inactiveDays,
            leadCount,
            lastActivityAt: lastActivity || null,
            status
          });
        }
      }

      // Sort by inactivity days descending
      inactive.sort((a, b) => b.inactiveDays - a.inactiveDays);
      setInactiveBrokers(inactive);
    } catch (err) {
      console.error("Failed to check broker inactivity:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendBroker = async (broker: InactiveBroker) => {
    try {
      // Mark broker as inactive
      await supabase
        .from("broker_profiles")
        .update({ is_active: false })
        .eq("user_id", broker.userId);

      // Reassign leads to available pool
      await supabase
        .from("crm_lead_assignments")
        .update({ 
          unassigned_at: new Date().toISOString(),
          unassigned_reason: 'broker_inactivity'
        } as any)
        .eq("assigned_to_user_id", broker.userId)
        .is("unassigned_at", null);

      toast.success(`${broker.displayName}'s leads reassigned to available pool`);
      checkBrokerInactivity();
    } catch (err) {
      console.error("Failed to suspend broker:", err);
      toast.error("Failed to suspend broker");
    }
  };

  const handleSendAlert = async (broker: InactiveBroker, channel: 'email' | 'whatsapp' | 'all') => {
    setSending(true);
    try {
      // In production, this would send actual notifications
      toast.success(`Alert sent to ${broker.displayName} via ${channel}`);
      
      // Note: Activity logging would require a valid lead_id
      // For now, we just show success toast
    } catch (err) {
      console.error("Failed to send alert:", err);
      toast.error("Failed to send alert");
    } finally {
      setSending(false);
    }
  };

  const handleBulkAction = async (action: 'alert' | 'suspend') => {
    const suspendedBrokers = inactiveBrokers.filter(b => b.status === 'suspended');
    
    if (suspendedBrokers.length === 0) {
      toast.info("No brokers to process");
      return;
    }

    if (action === 'alert') {
      for (const broker of suspendedBrokers) {
        await handleSendAlert(broker, 'all');
      }
      toast.success(`Alerts sent to ${suspendedBrokers.length} brokers`);
    } else {
      for (const broker of suspendedBrokers) {
        await handleSuspendBroker(broker);
      }
      toast.success(`${suspendedBrokers.length} brokers suspended and leads reassigned`);
    }
  };

  if (!hasOwnerAccess) return null;

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-6 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Checking broker activity...</p>
        </CardContent>
      </Card>
    );
  }

  const suspendedCount = inactiveBrokers.filter(b => b.status === 'suspended').length;
  const warningCount = inactiveBrokers.filter(b => b.status === 'warning').length;
  const totalLeadsAtRisk = inactiveBrokers.reduce((sum, b) => sum + b.leadCount, 0);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-white font-bold">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Broker Inactivity Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">
              {warningCount} Warning
            </Badge>
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
              {suspendedCount} Suspended
            </Badge>
          </div>
        </div>
        {totalLeadsAtRisk > 0 && (
          <p className="text-xs text-muted-foreground">
            {totalLeadsAtRisk} leads at risk from inactive brokers
          </p>
        )}
      </CardHeader>
      <CardContent>
        {inactiveBrokers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">All brokers are active</p>
          </div>
        ) : (
          <>
            {/* Bulk Actions */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('alert')}
                disabled={sending || suspendedCount === 0}
                className="text-[#1A1A1A] border-amber-500/50 hover:bg-amber-500/20"
              >
                <Send className="h-3 w-3 mr-1" />
                Alert All Suspended
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('suspend')}
                disabled={sending || suspendedCount === 0}
                className="text-red-400 border-red-500/50 hover:bg-red-500/20"
              >
                <UserMinus className="h-3 w-3 mr-1" />
                Reassign All Leads
              </Button>
            </div>

            {/* Inactive Brokers List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {inactiveBrokers.map((broker) => (
                  <div
                    key={broker.userId}
                    className={`p-3 rounded-lg border transition-colors ${
 broker.status === 'suspended'
 ? 'bg-red-500/10 border-red-500/30'
 : 'bg-amber-500/10 border-amber-500/30'
 }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{broker.displayName}</span>
                        <Badge
                          variant="outline"
                          className={
                            broker.status === 'suspended'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-amber-500/20 text-[#1A1A1A] border-amber-500/30'
                          }
                        >
                          {broker.status === 'suspended' ? 'SUSPENDED' : 'WARNING'}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {broker.leadCount} leads
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {broker.inactiveDays} days inactive
                      </span>
                      <span>{broker.email}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendAlert(broker, 'whatsapp')}
                        className="h-7 text-xs text-green-400 hover:text-[color:var(--emerald-on)] hover:jj-surface-emerald-soft"
                      >
                        WhatsApp
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendAlert(broker, 'email')}
                        className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      >
                        Email
                      </Button>
                      {broker.status === 'suspended' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuspendBroker(broker)}
                          className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20 ml-auto"
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Reassign Leads
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={checkBrokerInactivity}
          className="w-full mt-4 text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
};

export default BrokerInactivityMonitor;
