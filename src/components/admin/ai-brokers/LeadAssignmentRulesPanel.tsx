import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Users,
  Loader2,
} from "lucide-react";
import type { AssignmentRule } from "./types";
import type { Json } from "@/integrations/supabase/types";

interface AIBrokerSimple {
  id: string;
  name: string;
  status: string | null;
}

export function LeadAssignmentRulesPanel() {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [brokers, setBrokers] = useState<AIBrokerSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, brokersRes] = await Promise.all([
        supabase
          .from("broker_assignment_rules")
          .select("*")
          .order("priority", { ascending: true }),
        supabase
          .from("ai_brokers")
          .select("id, name, status")
          .order("name"),
      ]);

      if (rulesRes.error) throw rulesRes.error;
      if (brokersRes.error) throw brokersRes.error;

      setRules((rulesRes.data || []) as AssignmentRule[]);
      setBrokers(brokersRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load assignment rules");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("broker_assignment_rules")
        .update({ is_active: isActive })
        .eq("id", ruleId);

      if (error) throw error;

      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, is_active: isActive } : r))
      );
      toast.success(`Rule ${isActive ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error("Failed to update rule");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      const { error } = await supabase
        .from("broker_assignment_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;

      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success("Rule deleted");
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const handleSaveRule = async (ruleData: Partial<AssignmentRule>) => {
    try {
      if (editingRule?.id) {
        const { error } = await supabase
          .from("broker_assignment_rules")
          .update({
            name: ruleData.name,
            description: ruleData.description,
            priority: ruleData.priority,
            assignment_method: ruleData.assignment_method,
            assigned_broker_id: ruleData.assigned_broker_id,
            broker_pool: ruleData.broker_pool,
            max_leads_per_day: ruleData.max_leads_per_day,
            conditions: (ruleData.conditions || {}) as Json,
          })
          .eq("id", editingRule.id);

        if (error) throw error;
        toast.success("Rule updated");
      } else {
        const { error } = await supabase.from("broker_assignment_rules").insert([{
          name: ruleData.name || "New Rule",
          description: ruleData.description,
          priority: ruleData.priority || rules.length + 1,
          assignment_method: ruleData.assignment_method || "round_robin",
          assigned_broker_id: ruleData.assigned_broker_id,
          broker_pool: ruleData.broker_pool,
          max_leads_per_day: ruleData.max_leads_per_day,
          conditions: (ruleData.conditions || {}) as Json,
        }]);

        if (error) throw error;
        toast.success("Rule created");
      }

      setIsDialogOpen(false);
      setEditingRule(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to save rule");
    }
  };

  const getBrokerName = (id: string | null) => {
    if (!id) return "—";
    return brokers.find((b) => b.id === id)?.name || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-black text-xl font-semibold">Lead Assignment Rules</h2>
          <p className="text-black/60 text-sm mt-1">
            Configure how leads are automatically assigned to AI brokers
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="primary"
              onClick={() => setEditingRule(null)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-black">
                {editingRule ? "Edit Rule" : "Create Assignment Rule"}
              </DialogTitle>
            </DialogHeader>
            <RuleForm
              rule={editingRule}
              brokers={brokers}
              onSave={handleSaveRule}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingRule(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <Card
            key={rule.id}
            className={`bg-white border-2 border-gold/30 ${
              !rule.is_active ? "opacity-60" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-black/40">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-sm font-medium">#{rule.priority}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-black font-medium">{rule.name}</h3>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        rule.assignment_method === "round_robin"
                          ? "border-blue-500 text-blue-600"
                          : rule.assignment_method === "specific"
                          ? "border-purple-500 text-purple-600"
                          : "border-green-500 text-green-600"
                      }`}
                    >
                      {rule.assignment_method?.replace("_", " ")}
                    </Badge>
                  </div>
                  {rule.description && (
                    <p className="text-black/60 text-sm mt-1">
                      {rule.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-black/40">
                    {rule.assigned_broker_id && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {getBrokerName(rule.assigned_broker_id)}
                      </span>
                    )}
                    {rule.broker_pool && rule.broker_pool.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Pool: {rule.broker_pool.length} brokers
                      </span>
                    )}
                    {rule.max_leads_per_day && (
                      <span>
                        {rule.current_leads_today || 0}/{rule.max_leads_per_day}{" "}
                        leads today
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) =>
                      handleToggleActive(rule.id, checked)
                    }
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingRule(rule);
                      setIsDialogOpen(true);
                    }}
                    className="text-black/60 hover:text-black"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-black/60 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card className="bg-white border-2 border-gold/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gold mb-4" />
              <p className="text-black/60 text-center">
                No assignment rules configured.
                <br />
                Create a rule to automatically assign leads to AI brokers.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface RuleFormProps {
  rule: AssignmentRule | null;
  brokers: AIBrokerSimple[];
  onSave: (data: Partial<AssignmentRule>) => void;
  onCancel: () => void;
}

function RuleForm({ rule, brokers, onSave, onCancel }: RuleFormProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || "",
    description: rule?.description || "",
    priority: rule?.priority || 1,
    assignment_method: rule?.assignment_method || "round_robin",
    assigned_broker_id: rule?.assigned_broker_id || "",
    broker_pool: rule?.broker_pool || [],
    max_leads_per_day: rule?.max_leads_per_day || 100,
  });

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label className="text-black">Rule Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1"
          placeholder="e.g., High-value leads to James"
        />
      </div>

      <div>
        <Label className="text-black">Description</Label>
        <Input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="mt-1"
          placeholder="Optional description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-black">Priority</Label>
          <Input
            type="number"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })
            }
            className="mt-1"
            min={1}
          />
        </div>
        <div>
          <Label className="text-black">Max Leads/Day</Label>
          <Input
            type="number"
            value={formData.max_leads_per_day}
            onChange={(e) =>
              setFormData({
                ...formData,
                max_leads_per_day: parseInt(e.target.value) || 100,
              })
            }
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-black">Assignment Method</Label>
        <Select
          value={formData.assignment_method}
          onValueChange={(value) =>
            setFormData({ ...formData, assignment_method: value })
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="round_robin">Round Robin</SelectItem>
            <SelectItem value="specific">Specific Broker</SelectItem>
            <SelectItem value="load_balanced">Load Balanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.assignment_method === "specific" && (
        <div>
          <Label className="text-black">Assign To</Label>
          <Select
            value={formData.assigned_broker_id}
            onValueChange={(value) =>
              setFormData({ ...formData, assigned_broker_id: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select broker..." />
            </SelectTrigger>
            <SelectContent>
              {brokers.map((broker) => (
                <SelectItem key={broker.id} value={broker.id}>
                  {broker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gold/20">
        <Button
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(formData)}
        >
          {rule ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </div>
  );
}
