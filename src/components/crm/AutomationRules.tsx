import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, Bell, Mail, MessageSquare, UserPlus, Clock, 
  ArrowRight, Settings, Sparkles, Shield,
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
  adminOnly?: boolean;
  frequency?: { type: string; time?: string };
  assignedTeam?: string;
}

const defaultRules: AutomationRule[] = [
  {
    id: "welcome_email",
    name: "Welcome Email",
    description: "Send welcome email when new lead is created",
    trigger: "Lead Created",
    action: "Send Email",
    isActive: true,
    icon: <Mail className="h-4 w-4 text-blue-500" />,
    frequency: { type: 'instant' },
    assignedTeam: "Sales Team"
  },
  {
    id: "followup_reminder",
    name: "Follow-up Reminder",
    description: "Create reminder 24h after first contact",
    trigger: "No Response 24h",
    action: "Create Task",
    isActive: true,
    icon: <Bell className="h-4 w-4 text-amber-500" />,
    frequency: { type: 'daily', time: '09:00 AM' },
    assignedTeam: "Assigned Broker"
  },
  {
    id: "hot_lead_alert",
    name: "Hot Lead Alert",
    description: "Notify when status changes to Interested",
    trigger: "Status → Interested",
    action: "Push Notification",
    isActive: true,
    icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
    frequency: { type: 'instant' },
    assignedTeam: "All Brokers"
  },
  {
    id: "stale_lead_7days",
    name: "Stale Lead Detection",
    description: "Alert if no contact for 7 days",
    trigger: "No Activity 7 Days",
    action: "Update + Alert",
    isActive: true,
    icon: <Clock className="h-4 w-4 text-orange-500" />,
    adminOnly: true,
    frequency: { type: 'daily', time: '08:00 AM' },
    assignedTeam: "Admin"
  },
  {
    id: "broker_inactivity",
    name: "Broker Inactivity",
    description: "Reassign leads if no action in 3 days",
    trigger: "No Action 3 Days",
    action: "Reassign",
    isActive: true,
    icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
    adminOnly: true,
    frequency: { type: 'daily' },
    assignedTeam: "Lead Pool"
  },
  {
    id: "auto_assign",
    name: "Auto Assignment",
    description: "Assign new leads round-robin",
    trigger: "New Lead",
    action: "Round-Robin",
    isActive: true,
    icon: <UserPlus className="h-4 w-4 text-purple-500" />,
    adminOnly: true,
    frequency: { type: 'instant' },
    assignedTeam: "Queue"
  },
  {
    id: "whatsapp_followup",
    name: "WhatsApp Follow-up",
    description: "Queue message 3 days after proposal",
    trigger: "Proposal + 3 Days",
    action: "Queue WhatsApp",
    isActive: true,
    icon: <MessageSquare className="h-4 w-4 text-green-500" />,
    frequency: { type: 'daily', time: '10:00 AM' },
    assignedTeam: "Broker"
  }
];

interface AutomationRulesProps {
  userId: string;
  isOwner?: boolean;
}

const AutomationRules = ({ userId, isOwner = false }: AutomationRulesProps) => {
  const [rules, setRules] = useState<AutomationRule[]>(defaultRules);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`automation_rules_${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setRules(prev => prev.map(rule => ({
        ...rule,
        isActive: parsed[rule.id]?.isActive ?? rule.isActive
      })));
    }
  }, [userId]);

  const toggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule?.adminOnly && !isOwner) {
      toast.error("Only the Owner can modify this rule");
      return;
    }

    setSyncing(true);
    const updatedRules = rules.map(r => 
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    );
    setRules(updatedRules);

    const rulesState = updatedRules.reduce((acc, r) => ({
      ...acc, [r.id]: { isActive: r.isActive }
    }), {});
    localStorage.setItem(`automation_rules_${userId}`, JSON.stringify(rulesState));

    toast.success(`${rule?.name} ${!rule?.isActive ? 'enabled' : 'disabled'}`);
    setSyncing(false);
  };

  const activeCount = rules.filter(r => r.isActive).length;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {syncing && <RefreshCw className="h-3 w-3 text-zinc-400 animate-spin" />}
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
            {activeCount} Active
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
              rule.isActive 
                ? "bg-white border-gold/30 shadow-sm" 
                : "bg-zinc-50 border-zinc-200 opacity-60"
            } ${rule.adminOnly && !isOwner ? "opacity-50" : ""}`}
          >
            <div className="p-2 rounded-lg bg-zinc-100 border border-zinc-200">
              {rule.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-sm font-semibold text-zinc-800">{rule.name}</h4>
                {rule.adminOnly && (
                  <Badge variant="outline" className="text-[10px] bg-gold/10 text-gold border-gold/30 px-1.5">
                    <Shield className="h-2.5 w-2.5" />
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mb-2">{rule.description}</p>
              
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-2 text-[10px]">
                  {rule.trigger}
                </Badge>
                <ArrowRight className="h-3 w-3 text-zinc-400" />
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 px-2 text-[10px]">
                  {rule.action}
                </Badge>
              </div>
            </div>

            <Switch
              checked={rule.isActive}
              onCheckedChange={() => toggleRule(rule.id)}
              disabled={syncing || (rule.adminOnly && !isOwner)}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        ))}
      </div>

      <Button 
        variant="outline" 
        className="w-full border-dashed border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-xs"
        disabled={!isOwner}
      >
        <Settings className="h-3 w-3 mr-2" />
        Create Custom Rule
      </Button>
    </div>
  );
};

export default AutomationRules;
