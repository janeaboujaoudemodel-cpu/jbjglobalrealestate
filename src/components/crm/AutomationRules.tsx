import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Zap, Bell, Mail, MessageSquare, UserPlus, Clock,
  ArrowRight, Settings, Sparkles, Shield,
  AlertTriangle, RefreshCw, Plus, Trash2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface DBRule {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  action_type: string;
  config: Record<string, any> | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
}

const TRIGGER_OPTIONS = [
  "Lead Created", "No Response 24h", "Status → Interested",
  "No Activity 7 Days", "No Action 3 Days", "New Lead",
  "Proposal + 3 Days", "Deal Closed", "Lead Archived"
];

const ACTION_OPTIONS = [
  "Send Email", "Create Task", "Push Notification",
  "Update + Alert", "Reassign", "Round-Robin",
  "Queue WhatsApp", "Log Activity", "Send SMS"
];

const getIcon = (actionType: string) => {
  switch (actionType) {
    case "Send Email": return <Mail className="h-4 w-4 text-blue-500" />;
    case "Create Task": return <Bell className="h-4 w-4 text-amber-500" />;
    case "Push Notification": return <Sparkles className="h-4 w-4 text-emerald-500" />;
    case "Update + Alert": return <Clock className="h-4 w-4 text-orange-500" />;
    case "Reassign": return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "Round-Robin": return <UserPlus className="h-4 w-4 text-purple-500" />;
    case "Queue WhatsApp": return <MessageSquare className="h-4 w-4 text-green-500" />;
    default: return <Zap className="h-4 w-4 text-gold" />;
  }
};

// Default rules seeded on first load if table is empty
const DEFAULT_RULES = [
  { name: "Welcome Email", description: "Send welcome email when new lead is created", trigger_event: "Lead Created", action_type: "Send Email", is_active: true },
  { name: "Follow-up Reminder", description: "Create reminder 24h after first contact", trigger_event: "No Response 24h", action_type: "Create Task", is_active: true },
  { name: "Hot Lead Alert", description: "Notify when status changes to Interested", trigger_event: "Status → Interested", action_type: "Push Notification", is_active: true },
  { name: "Stale Lead Detection", description: "Alert if no contact for 7 days", trigger_event: "No Activity 7 Days", action_type: "Update + Alert", is_active: true },
  { name: "Broker Inactivity", description: "Reassign leads if no action in 3 days", trigger_event: "No Action 3 Days", action_type: "Reassign", is_active: true },
  { name: "Auto Assignment", description: "Assign new leads round-robin", trigger_event: "New Lead", action_type: "Round-Robin", is_active: true },
  { name: "WhatsApp Follow-up", description: "Queue message 3 days after proposal", trigger_event: "Proposal + 3 Days", action_type: "Queue WhatsApp", is_active: true },
];

interface AutomationRulesProps {
  userId: string;
  isOwner?: boolean;
}

const AutomationRules = ({ userId, isOwner = false }: AutomationRulesProps) => {
  const [rules, setRules] = useState<DBRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", description: "", trigger_event: "", action_type: "" });

  const loadRules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_automation_rules")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load automation rules:", error);
      setLoading(false);
      return;
    }

    // Seed defaults if empty
    if (!data || data.length === 0) {
      const seeds = DEFAULT_RULES.map(r => ({ ...r, created_by: userId }));
      const { data: seeded } = await supabase
        .from("crm_automation_rules")
        .insert(seeds)
        .select();
      setRules((seeded as DBRule[]) || []);
    } else {
      setRules(data as DBRule[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadRules(); }, [loadRules]);

  const toggleRule = async (ruleId: string) => {
    if (!isOwner) {
      toast.error("Only the Owner can modify automation rules");
      return;
    }

    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    setSyncing(true);
    const newActive = !rule.is_active;

    const { error } = await supabase
      .from("crm_automation_rules")
      .update({ is_active: newActive, updated_at: new Date().toISOString() })
      .eq("id", ruleId);

    if (error) {
      toast.error("Failed to update rule");
    } else {
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_active: newActive } : r));
      toast.success(`${rule.name} ${newActive ? 'enabled' : 'disabled'}`);
    }
    setSyncing(false);
  };

  const createRule = async () => {
    if (!newRule.name || !newRule.trigger_event || !newRule.action_type) {
      toast.error("Fill in all required fields");
      return;
    }

    const { error } = await supabase
      .from("crm_automation_rules")
      .insert({
        name: newRule.name,
        description: newRule.description || null,
        trigger_event: newRule.trigger_event,
        action_type: newRule.action_type,
        is_active: true,
        created_by: userId,
      });

    if (error) {
      toast.error("Failed to create rule");
    } else {
      toast.success("Rule created");
      setShowCreate(false);
      setNewRule({ name: "", description: "", trigger_event: "", action_type: "" });
      loadRules();
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!isOwner) return;
    const { error } = await supabase.from("crm_automation_rules").delete().eq("id", ruleId);
    if (!error) {
      setRules(prev => prev.filter(r => r.id !== ruleId));
      toast.success("Rule deleted");
    }
  };

  const activeCount = rules.filter(r => r.is_active).length;

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {syncing && <RefreshCw className="h-3 w-3 text-zinc-400 animate-spin" />}
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
            {activeCount} Active
          </Badge>
          <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 text-xs">
            {rules.length} Total
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
              rule.is_active
                ? "bg-white border-gold/30 shadow-sm"
                : "bg-zinc-50 border-zinc-200 opacity-60"
            }`}
          >
            <div className="p-2 rounded-lg bg-zinc-100 border border-zinc-200">
              {getIcon(rule.action_type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-sm font-semibold text-zinc-800">{rule.name}</h4>
              </div>
              {rule.description && (
                <p className="text-xs text-zinc-500 mb-2">{rule.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-2 text-[10px]">
                  {rule.trigger_event}
                </Badge>
                <ArrowRight className="h-3 w-3 text-zinc-400" />
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 px-2 text-[10px]">
                  {rule.action_type}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwner && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteRule(rule.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Switch
                checked={!!rule.is_active}
                onCheckedChange={() => toggleRule(rule.id)}
                disabled={syncing || !isOwner}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full border-dashed border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-xs"
        disabled={!isOwner}
        onClick={() => setShowCreate(true)}
      >
        <Plus className="h-3 w-3 mr-2" />
        Create Custom Rule
      </Button>

      {/* Create Rule Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gold" />
              Create Automation Rule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1 block">Rule Name *</label>
              <Input
                placeholder="e.g. VIP Lead Alert"
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1 block">Description</label>
              <Textarea
                placeholder="What does this rule do?"
                value={newRule.description}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1 block">Trigger Event *</label>
              <Select value={newRule.trigger_event} onValueChange={(v) => setNewRule(prev => ({ ...prev, trigger_event: v }))}>
                <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1 block">Action *</label>
              <Select value={newRule.action_type} onValueChange={(v) => setNewRule(prev => ({ ...prev, action_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createRule} disabled={!newRule.name || !newRule.trigger_event || !newRule.action_type}>
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationRules;
