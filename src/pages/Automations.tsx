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
    description: 'Notify Jane Bou Jaoude when lead shows high purchase intent',
    trigger: 'High Intent Detected',
    action: 'Send Alert',
    isActive: true,
    icon: Zap,
    frequency: 'Instant',
  },
  {
    id: 'whatsapp-new-lead',
    name: 'WhatsApp New Lead Greeting',
    description: 'Send automated WhatsApp greeting to new leads',
    trigger: 'New Lead Created',
    action: 'Send WhatsApp',
    isActive: false,
    icon: MessageSquare,
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
    id: 'no-reply-followup',
    name: 'No Reply Follow-up',
    description: 'Send WhatsApp follow-up after 48h of no response',
    trigger: 'No Response 48h',
    action: 'Send WhatsApp',
    isActive: false,
    icon: MessageSquare,
    frequency: 'Daily Check',
  },
  {
    id: 'dormant-lead-reactivation',
    name: 'Dormant Lead Reactivation',
    description: 'Flag leads with no activity for 30+ days for re-engagement',
    trigger: 'No Activity 30 Days',
    action: 'Flag & Notify',
    isActive: false,
    icon: Clock,
    frequency: 'Weekly',
  },
  {
    id: 'status-change-notification',
    name: 'Status Change Notification',
    description: 'Notify Owner when lead status changes to qualified/hot',
    trigger: 'Status Change',
    action: 'Send Notification',
    isActive: true,
    icon: Bell,
    frequency: 'Instant',
  },
  {
    id: 'task-creation-on-viewing',
    name: 'Auto-Create Follow-up Task',
    description: 'Automatically create follow-up task after viewing completed',
    trigger: 'Viewing Completed',
    action: 'Create Task',
    isActive: true,
    icon: Users,
    frequency: 'Instant',
  },
  {
    id: 'email-price-followup',
    name: 'Price Follow-up Email',
    description: 'Send email with pricing details after initial inquiry',
    trigger: 'Initial Contact Made',
    action: 'Send Email',
    isActive: false,
    icon: Mail,
    frequency: 'After 2 hours',
  },
];

const Automations = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasFullAccess, setHasFullAccess] = useState(false);
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

      const ownerRoles = ['owner_admin', 'founder'];
      const userHasAccess = ownerRoles.includes(data.crm_role);
      setHasFullAccess(userHasAccess);

      if (!userHasAccess) {
        toast.error("Automations are restricted to the Owner.");
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
      <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 bg-gold/20" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 bg-gold/20 border-2 border-gold/30 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeCount = rules.filter(r => r.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
      {/* Header - Premium Champagne */}
      <header className="border-b-2 border-gold/40 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] sticky top-0 z-50 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/crm">
              <Button variant="ghost" size="sm" className="text-black hover:text-gold hover:bg-gold/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CRM
              </Button>
            </Link>
            <div className="h-6 w-px bg-gold/30" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30">
                <Zap className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">Smart Automations</h1>
                <p className="text-xs text-zinc-600">Owner: Jane Bou Jaoude — {activeCount} of {rules.length} active</p>
              </div>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:brightness-110 shadow-lg shadow-gold/20">
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
              className={`border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] transition-all duration-300 hover:shadow-[0_10px_40px_rgba(200,167,102,0.25)] hover:scale-[1.01] ${
                rule.isActive ? 'border-l-4 border-l-gold' : 'opacity-70'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border transition-all ${
                      rule.isActive 
                        ? 'bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-gold/40' 
                        : 'bg-zinc-100 border-zinc-200'
                    }`}>
                      <rule.icon className={`h-5 w-5 ${rule.isActive ? 'text-black' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-black">{rule.name}</h3>
                        {rule.adminOnly && (
                          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 bg-amber-50">
                            Admin Only
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 mt-0.5">{rule.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-zinc-500">
                          <strong className="text-black">Trigger:</strong> {rule.trigger}
                        </span>
                        <span className="text-xs text-zinc-500">
                          <strong className="text-black">Action:</strong> {rule.action}
                        </span>
                        {rule.frequency && (
                          <span className="text-xs text-zinc-500">
                            <strong className="text-black">Frequency:</strong> {rule.frequency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-zinc-500 hover:text-gold hover:bg-gold/10"
                      onClick={() => toast.info(`Settings for "${rule.name}" - Configuration panel coming soon`)}
                    >
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

        {/* Info Card - Premium Champagne */}
        <Card className="mt-8 border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.15)]">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30">
                <Shield className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-black">About Smart Automations</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  Automations run in the background to help Jane Bou Jaoude work more efficiently. 
                  All automation triggers are approval-based by default. 
                  AI may suggest workflows but will NOT auto-activate without explicit Owner approval.
                  All automation activity is logged for auditing purposes.
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
