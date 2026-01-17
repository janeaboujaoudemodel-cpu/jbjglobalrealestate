import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Zap, Plus, ArrowLeft, Mail, Bell, Clock, 
  MessageSquare, Users, Calendar, Shield, Settings
} from "lucide-react";
import { Link } from "react-router-dom";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  icon: React.ElementType;
  adminOnly?: boolean;
  frequency?: string;
}

const defaultRules: AutomationRule[] = [
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    description: 'Send personalized welcome email when new lead is created',
    trigger: 'Lead Created',
    action: 'Send Email',
    isActive: true,
    icon: Mail,
    frequency: 'Instant',
  },
  {
    id: 'followup-reminder',
    name: 'Follow-up Reminder',
    description: 'Create reminder if no response within 24 hours',
    trigger: 'No Response 24h',
    action: 'Create Reminder',
    isActive: true,
    icon: Bell,
    frequency: 'Daily Check',
  },
  {
    id: 'hot-lead-alert',
    name: 'Hot Lead Alert',
    description: 'Notify team when lead shows high purchase intent',
    trigger: 'High Intent Detected',
    action: 'Send Alert',
    isActive: true,
    icon: Zap,
    frequency: 'Instant',
  },
  {
    id: 'auto-assign-broker',
    name: 'Auto-Assign to Broker',
    description: 'Automatically assign new website leads to available brokers',
    trigger: 'Website Lead',
    action: 'Assign Broker',
    isActive: false,
    icon: Users,
    adminOnly: true,
    frequency: 'Instant',
  },
  {
    id: 'viewing-reminder',
    name: 'Viewing Reminder',
    description: 'Send reminder 24h before scheduled property viewing',
    trigger: 'Viewing in 24h',
    action: 'Send SMS & Email',
    isActive: true,
    icon: Calendar,
    frequency: 'Daily at 9 AM',
  },
  {
    id: 'dormant-lead-reactivation',
    name: 'Dormant Lead Reactivation',
    description: 'Flag leads with no activity for 30+ days for re-engagement',
    trigger: 'No Activity 30 Days',
    action: 'Flag & Notify',
    isActive: false,
    icon: Clock,
    adminOnly: true,
    frequency: 'Weekly',
  },
  {
    id: 'vip-escalation',
    name: 'VIP Lead Escalation',
    description: 'Immediately escalate VIP leads to senior brokers',
    trigger: 'VIP Tag Added',
    action: 'Escalate to Senior',
    isActive: true,
    icon: Shield,
    adminOnly: true,
    frequency: 'Instant',
  },
  {
    id: 'whatsapp-followup',
    name: 'WhatsApp Follow-up',
    description: 'Send WhatsApp message after initial contact attempt',
    trigger: 'First Call Made',
    action: 'Queue WhatsApp',
    isActive: false,
    icon: MessageSquare,
    frequency: 'After 2 hours',
  },
];

const Automations = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rules, setRules] = useState<AutomationRule[]>(defaultRules);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    checkAccess();
  }, [authLoading, user, navigate]);

  const checkAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("crm_role")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        toast.error("Access denied. You must be a CRM user to access Automations.");
        navigate("/crm");
        return;
      }

      const adminRoles = ['owner_admin', 'founder', 'admin'];
      const userIsAdmin = adminRoles.includes(data.crm_role);
      setIsAdmin(userIsAdmin);

      if (!userIsAdmin) {
        toast.error("Automations are restricted to Admins and Owners.");
        navigate("/crm");
        return;
      }

      // Load saved states from localStorage
      const savedStates = localStorage.getItem('crm_automation_rules');
      if (savedStates) {
        try {
          const parsed = JSON.parse(savedStates);
          setRules(rules.map(rule => ({
            ...rule,
            isActive: parsed[rule.id] !== undefined ? parsed[rule.id] : rule.isActive
          })));
        } catch (e) {
          console.error('Failed to parse saved automation states');
        }
      }
    } catch (err) {
      console.error("Access check failed:", err);
      navigate("/crm");
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    const updatedRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    );
    setRules(updatedRules);

    // Save to localStorage
    const states: Record<string, boolean> = {};
    updatedRules.forEach(rule => {
      states[rule.id] = rule.isActive;
    });
    localStorage.setItem('crm_automation_rules', JSON.stringify(states));

    const rule = updatedRules.find(r => r.id === ruleId);
    toast.success(`${rule?.name} ${rule?.isActive ? 'enabled' : 'disabled'}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeCount = rules.filter(r => r.isActive).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/crm">
              <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CRM
              </Button>
            </Link>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gold/20">
                <Zap className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Smart Automations</h1>
                <p className="text-xs text-zinc-500">{activeCount} of {rules.length} active</p>
              </div>
            </div>
          </div>
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card 
              key={rule.id} 
              className={`border-zinc-200 bg-white transition-all ${
                rule.isActive ? 'border-l-4 border-l-gold' : 'opacity-70'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${rule.isActive ? 'bg-gold/20' : 'bg-zinc-100'}`}>
                      <rule.icon className={`h-5 w-5 ${rule.isActive ? 'text-gold' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900">{rule.name}</h3>
                        {rule.adminOnly && (
                          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                            Admin Only
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">{rule.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-zinc-400">
                          <strong>Trigger:</strong> {rule.trigger}
                        </span>
                        <span className="text-xs text-zinc-400">
                          <strong>Action:</strong> {rule.action}
                        </span>
                        {rule.frequency && (
                          <span className="text-xs text-zinc-400">
                            <strong>Frequency:</strong> {rule.frequency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="mt-8 border-zinc-200 bg-zinc-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">About Smart Automations</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  Automations run in the background to help your team work more efficiently. 
                  Rules marked "Admin Only" can only be modified by administrators. 
                  All automation activity is logged for compliance and auditing purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Automations;
