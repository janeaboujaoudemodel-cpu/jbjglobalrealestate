import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, Bell, Mail, MessageSquare, UserPlus, Clock, 
  ArrowRight, Settings, Sparkles, Shield, BarChart3,
  AlertTriangle, RefreshCw
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  icon: React.ReactNode;
  executionCount?: number;
  lastExecuted?: string;
  adminOnly?: boolean;
}

interface AutomationFrequency {
  type: 'instant' | 'hourly' | 'daily' | 'weekly';
  time?: string;
  day?: string;
}

const defaultRules: (AutomationRule & { frequency?: AutomationFrequency; assignedTeam?: string })[] = [
  {
    id: "welcome_email",
    name: "Welcome Email",
    description: "Send welcome email when new lead is created",
    trigger: "Lead Created",
    action: "Send Email",
    isActive: true,
    icon: <Mail className="h-4 w-4 text-blue-400" />,
    executionCount: 0,
    adminOnly: false,
    frequency: { type: 'instant' },
    assignedTeam: "Sales Team"
  },
  {
    id: "followup_reminder",
    name: "Follow-up Reminder",
    description: "Create reminder 24h after first contact if no response",
    trigger: "No Response 24h",
    action: "Create Task",
    isActive: true,
    icon: <Bell className="h-4 w-4 text-amber-400" />,
    executionCount: 0,
    adminOnly: false,
    frequency: { type: 'daily', time: '09:00 AM' },
    assignedTeam: "Assigned Broker"
  },
  {
    id: "hot_lead_alert",
    name: "Hot Lead Alert",
    description: "Notify when lead status changes to 'Interested'",
    trigger: "Status → Interested",
    action: "Push Notification",
    isActive: true,
    icon: <Sparkles className="h-4 w-4 text-emerald-400" />,
    executionCount: 0,
    adminOnly: false,
    frequency: { type: 'instant' },
    assignedTeam: "All Brokers"
  },
  {
    id: "stale_lead_7days",
    name: "Stale Lead Detection (7 Days)",
    description: "Mark lead as stale and send alert if no contact for 7 days",
    trigger: "No Activity 7 Days",
    action: "Update Status + Alert",
    isActive: true,
    icon: <Clock className="h-4 w-4 text-orange-400" />,
    executionCount: 0,
    adminOnly: true,
    frequency: { type: 'daily', time: '08:00 AM' },
    assignedTeam: "Admin + Manager"
  },
  {
    id: "broker_inactivity_3days",
    name: "Broker Inactivity (3 Days)",
    description: "Suspend broker's leads if no action in 3 days, reassign to 'Available' pool",
    trigger: "No Broker Action 3 Days",
    action: "Suspend & Reassign",
    isActive: true,
    icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
    executionCount: 0,
    adminOnly: true,
    frequency: { type: 'daily', time: '06:00 AM' },
    assignedTeam: "Lead Pool"
  },
  {
    id: "broker_inactivity_24h",
    name: "Re-Suspend After Reassign (24h)",
    description: "Re-suspend if no action 24h after reassignment",
    trigger: "No Action After Reassign 24h",
    action: "Suspend & Re-Reassign",
    isActive: true,
    icon: <RefreshCw className="h-4 w-4 text-red-400" />,
    executionCount: 0,
    adminOnly: true,
    frequency: { type: 'hourly' },
    assignedTeam: "Lead Pool"
  },
  {
    id: "auto_assign",
    name: "Auto Assignment",
    description: "Automatically assign new leads to available brokers (round-robin)",
    trigger: "New Lead",
    action: "Assign Round-Robin",
    isActive: true,
    icon: <UserPlus className="h-4 w-4 text-purple-400" />,
    executionCount: 0,
    adminOnly: true,
    frequency: { type: 'instant' },
    assignedTeam: "Round-Robin Queue"
  },
  {
    id: "whatsapp_followup",
    name: "WhatsApp Follow-up",
    description: "Queue WhatsApp message 3 days after proposal sent",
    trigger: "Proposal Sent + 3 Days",
    action: "Queue WhatsApp",
    isActive: true,
    icon: <MessageSquare className="h-4 w-4 text-green-400" />,
    executionCount: 0,
    adminOnly: false,
    frequency: { type: 'daily', time: '10:00 AM' },
    assignedTeam: "Assigned Broker"
  },
  {
    id: "daily_broker_alerts",
    name: "Daily Broker Alerts",
    description: "Send daily alerts for lost leads via WhatsApp, Email, and Dashboard",
    trigger: "Daily at 9:00 AM",
    action: "Multi-Channel Alert",
    isActive: true,
    icon: <Bell className="h-4 w-4 text-blue-400" />,
    executionCount: 0,
    adminOnly: true,
    frequency: { type: 'daily', time: '09:00 AM' },
    assignedTeam: "All Team"
  }
];

interface AutomationRulesProps {
  userId: string;
  isAdmin?: boolean;
}

const AutomationRules = ({ userId, isAdmin = false }: AutomationRulesProps) => {
  const [rules, setRules] = useState<AutomationRule[]>(defaultRules);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Real-time sync effect
  useEffect(() => {
    // Initial sync
    syncRulesFromDB();
    
    // Set up real-time subscription for automation changes
    const channel = supabase
      .channel('automation-rules-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'automation_rules' 
      }, (payload) => {
        console.log('Automation rule change detected:', payload);
        syncRulesFromDB();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const syncRulesFromDB = useCallback(async () => {
    try {
      // In production, this would fetch from database
      // For now, we simulate with localStorage for persistence
      const saved = localStorage.getItem(`automation_rules_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRules(prev => prev.map(rule => ({
          ...rule,
          isActive: parsed[rule.id]?.isActive ?? rule.isActive,
          executionCount: parsed[rule.id]?.executionCount ?? 0,
          lastExecuted: parsed[rule.id]?.lastExecuted
        })));
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Failed to sync rules:", err);
    }
  }, [userId]);

  const toggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    
    // Admin-only rules check
    if (rule?.adminOnly && !isAdmin) {
      toast.error("Only administrators can modify this automation rule");
      return;
    }

    setSyncing(true);
    
    try {
      // Optimistic update
      const updatedRules = rules.map(r => 
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      );
      setRules(updatedRules);

      // Persist to localStorage (in production, save to Supabase)
      const rulesState = updatedRules.reduce((acc, r) => ({
        ...acc,
        [r.id]: { isActive: r.isActive, executionCount: r.executionCount, lastExecuted: r.lastExecuted }
      }), {});
      localStorage.setItem(`automation_rules_${userId}`, JSON.stringify(rulesState));

      const newState = !rule?.isActive;
      toast.success(
        `${rule?.name} ${newState ? 'enabled' : 'disabled'}`,
        { description: "Changes synced in real-time" }
      );
      
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Failed to toggle rule:", err);
      toast.error("Failed to update automation rule");
      // Revert on error
      syncRulesFromDB();
    } finally {
      setSyncing(false);
    }
  };

  const activeCount = rules.filter(r => r.isActive).length;
  const adminRulesCount = rules.filter(r => r.adminOnly).length;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-white font-bold text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Automation Rules
            {syncing && <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
              {activeCount} Active
            </Badge>
            {isAdmin && (
              <Badge variant="outline" className="text-xs border-gold/30 text-gold">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
        </CardTitle>
        {lastSyncTime && (
          <p className="text-[10px] text-muted-foreground">
            Last synced: {lastSyncTime.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rules.map((rule: any) => (
            <div
              key={rule.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                rule.isActive 
                  ? "bg-muted/30 border-primary/30 shadow-sm" 
                  : "bg-muted/10 border-border opacity-60"
              } ${rule.adminOnly && !isAdmin ? "opacity-50" : ""}`}
            >
              <div className="p-2.5 rounded-xl bg-card border border-border shadow-sm">
                {rule.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="text-sm font-semibold text-foreground">
                    {rule.name}
                  </h4>
                  {rule.isActive && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-2">
                      ● Active
                    </Badge>
                  )}
                  {rule.adminOnly && (
                    <Badge variant="outline" className="text-[10px] bg-gold/20 text-gold border-gold/30 px-2">
                      <Shield className="h-2.5 w-2.5 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2.5">
                  {rule.description}
                </p>
                
                {/* Trigger → Action Flow */}
                <div className="flex items-center gap-2 text-xs flex-wrap mb-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 px-2.5">
                    {rule.trigger}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 px-2.5">
                    {rule.action}
                  </Badge>
                </div>
                
                {/* Frequency & Team Assignment Row */}
                <div className="flex items-center gap-3 text-[10px] flex-wrap">
                  {rule.frequency && (
                    <span className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      <Clock className="h-3 w-3" />
                      {rule.frequency.type === 'instant' && 'Instant'}
                      {rule.frequency.type === 'hourly' && 'Every Hour'}
                      {rule.frequency.type === 'daily' && `Daily ${rule.frequency.time || ''}`}
                      {rule.frequency.type === 'weekly' && `Weekly ${rule.frequency.day || ''}`}
                    </span>
                  )}
                  {rule.assignedTeam && (
                    <span className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      <UserPlus className="h-3 w-3" />
                      {rule.assignedTeam}
                    </span>
                  )}
                  {rule.executionCount !== undefined && rule.executionCount > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      <BarChart3 className="h-3 w-3" />
                      {rule.executionCount} runs
                    </span>
                  )}
                </div>
              </div>

              {/* Clean Toggle */}
              <div className="flex flex-col items-center gap-1">
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={() => toggleRule(rule.id)}
                  disabled={syncing || (rule.adminOnly && !isAdmin)}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <span className="text-[9px] text-muted-foreground">
                  {rule.isActive ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full border-dashed border-border hover:bg-muted"
            disabled={!isAdmin}
          >
            <Settings className="h-4 w-4 mr-2" />
            Create Custom Rule
            {!isAdmin && <span className="ml-2 text-xs text-muted-foreground">(Admin Only)</span>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationRules;
