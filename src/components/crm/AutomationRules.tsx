import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Zap, Bell, Mail, MessageSquare, UserPlus, Clock, 
  ArrowRight, Settings, Sparkles
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  icon: React.ReactNode;
}

const defaultRules: AutomationRule[] = [
  {
    id: "welcome_email",
    name: "Welcome Email",
    description: "Send welcome email when new lead is created",
    trigger: "Lead Created",
    action: "Send Email",
    isActive: true,
    icon: <Mail className="h-4 w-4 text-blue-400" />
  },
  {
    id: "followup_reminder",
    name: "Follow-up Reminder",
    description: "Create reminder 24h after first contact if no response",
    trigger: "No Response 24h",
    action: "Create Task",
    isActive: true,
    icon: <Bell className="h-4 w-4 text-amber-400" />
  },
  {
    id: "hot_lead_alert",
    name: "Hot Lead Alert",
    description: "Notify when lead status changes to 'Interested'",
    trigger: "Status → Interested",
    action: "Push Notification",
    isActive: true,
    icon: <Sparkles className="h-4 w-4 text-emerald-400" />
  },
  {
    id: "stale_lead",
    name: "Stale Lead Detection",
    description: "Mark lead as stale if no activity for 7 days",
    trigger: "No Activity 7 Days",
    action: "Update Status",
    isActive: false,
    icon: <Clock className="h-4 w-4 text-orange-400" />
  },
  {
    id: "auto_assign",
    name: "Auto Assignment",
    description: "Automatically assign new leads to available brokers",
    trigger: "New Lead",
    action: "Assign Round-Robin",
    isActive: false,
    icon: <UserPlus className="h-4 w-4 text-purple-400" />
  },
  {
    id: "whatsapp_followup",
    name: "WhatsApp Follow-up",
    description: "Queue WhatsApp message 3 days after proposal sent",
    trigger: "Proposal Sent + 3 Days",
    action: "Queue WhatsApp",
    isActive: false,
    icon: <MessageSquare className="h-4 w-4 text-green-400" />
  }
];

interface AutomationRulesProps {
  userId: string;
}

const AutomationRules = ({ userId }: AutomationRulesProps) => {
  const [rules, setRules] = useState<AutomationRule[]>(defaultRules);

  const toggleRule = (ruleId: string) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
    // In a full implementation, this would save to database
  };

  const activeCount = rules.filter(r => r.isActive).length;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-white font-bold text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Automation Rules
          </div>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
            {activeCount} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                rule.isActive 
                  ? "bg-muted/30 border-primary/30" 
                  : "bg-muted/10 border-border opacity-60"
              }`}
            >
              <div className="p-2 rounded-lg bg-card border border-border">
                {rule.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {rule.name}
                  </h4>
                  {rule.isActive && (
                    <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {rule.description}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {rule.trigger}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                    {rule.action}
                  </Badge>
                </div>
              </div>

              <Switch
                checked={rule.isActive}
                onCheckedChange={() => toggleRule(rule.id)}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="outline" className="w-full border-dashed border-border hover:bg-muted">
            <Settings className="h-4 w-4 mr-2" />
            Create Custom Rule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationRules;
