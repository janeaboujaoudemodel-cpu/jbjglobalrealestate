import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
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
import { Plus, Edit2, Trash2, Shield, AlertTriangle, Loader2 } from "lucide-react";

interface MessageFilter {
  id: string;
  filter_type: string;
  filter_value: string;
  replacement_text: string | null;
  severity: string;
  is_active: boolean;
}

const FILTER_TYPES = [
  { value: "keyword", label: "Keyword" },
  { value: "regex", label: "Regex Pattern" },
  { value: "phrase", label: "Exact Phrase" },
  { value: "competitor", label: "Competitor Name" },
];

const SEVERITIES = [
  { value: "low", label: "Low", color: "text-blue-400 border-blue-500" },
  { value: "medium", label: "Medium", color: "text-amber-400 border-amber-500" },
  { value: "high", label: "High", color: "text-orange-400 border-orange-500" },
  { value: "critical", label: "Critical", color: "text-red-400 border-red-500" },
];

export function MessageFiltersPanel() {
  const [filters, setFilters] = useState<MessageFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFilter, setEditingFilter] = useState<MessageFilter | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("broker_message_filters")
        .select("*")
        .order("severity", { ascending: false });

      if (error) throw error;
      setFilters(data || []);
    } catch (error) {
      console.error("Error fetching filters:", error);
      toast.error("Failed to load message filters");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (filterId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("broker_message_filters")
        .update({ is_active: isActive })
        .eq("id", filterId);

      if (error) throw error;

      setFilters((prev) =>
        prev.map((f) => (f.id === filterId ? { ...f, is_active: isActive } : f))
      );
      toast.success(`Filter ${isActive ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error("Failed to update filter");
    }
  };

  const handleDeleteFilter = async (filterId: string) => {
    if (!confirm("Are you sure you want to delete this filter?")) return;

    try {
      const { error } = await supabase
        .from("broker_message_filters")
        .delete()
        .eq("id", filterId);

      if (error) throw error;

      setFilters((prev) => prev.filter((f) => f.id !== filterId));
      toast.success("Filter deleted");
    } catch (error) {
      toast.error("Failed to delete filter");
    }
  };

  const handleSaveFilter = async (filterData: Partial<MessageFilter>) => {
    try {
      if (editingFilter?.id) {
        const { error } = await supabase
          .from("broker_message_filters")
          .update({
            filter_type: filterData.filter_type,
            filter_value: filterData.filter_value,
            replacement_text: filterData.replacement_text,
            severity: filterData.severity,
          })
          .eq("id", editingFilter.id);

        if (error) throw error;
        toast.success("Filter updated");
      } else {
        const { error } = await supabase.from("broker_message_filters").insert({
          filter_type: filterData.filter_type || "keyword",
          filter_value: filterData.filter_value || "",
          replacement_text: filterData.replacement_text,
          severity: filterData.severity || "medium",
          is_active: true,
        });

        if (error) throw error;
        toast.success("Filter created");
      }

      setIsDialogOpen(false);
      setEditingFilter(null);
      fetchFilters();
    } catch (error) {
      toast.error("Failed to save filter");
    }
  };

  const getSeverityStyle = (severity: string) => {
    return SEVERITIES.find((s) => s.value === severity)?.color || "";
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
          <h2 className="text-white text-xl font-semibold">Message Filters</h2>
          <p className="text-gray-400 text-sm mt-1">
            Block or replace restricted content in broker messages
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="primary"
              onClick={() => setEditingFilter(null)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingFilter ? "Edit Filter" : "Create Message Filter"}
              </DialogTitle>
            </DialogHeader>
            <FilterForm
              filter={editingFilter}
              onSave={handleSaveFilter}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingFilter(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold" />
              <span className="text-gray-400">Total Filters</span>
            </div>
            <p className="text-white text-2xl font-bold mt-2">{filters.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-gray-400">Critical</span>
            </div>
            <p className="text-white text-2xl font-bold mt-2">
              {filters.filter((f) => f.severity === "critical").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <span className="text-gray-400">Active</span>
            </div>
            <p className="text-white text-2xl font-bold mt-2">
              {filters.filter((f) => f.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <span className="text-gray-400">Competitor</span>
            </div>
            <p className="text-white text-2xl font-bold mt-2">
              {filters.filter((f) => f.filter_type === "competitor").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters List */}
      <div className="space-y-2">
        {filters.map((filter) => (
          <Card
            key={filter.id}
            className={`bg-zinc-900 border-zinc-800 ${
              !filter.is_active ? "opacity-60" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <code className="text-white bg-zinc-800 px-2 py-1 rounded text-sm font-mono">
                      {filter.filter_value}
                    </code>
                    <Badge
                      variant="outline"
                      className="border-zinc-600 text-gray-400"
                    >
                      {FILTER_TYPES.find((t) => t.value === filter.filter_type)
                        ?.label || filter.filter_type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getSeverityStyle(filter.severity)}
                    >
                      {filter.severity}
                    </Badge>
                  </div>
                  {filter.replacement_text && (
                    <p className="text-gray-500 text-sm mt-1">
                      Replaces with:{" "}
                      <span className="text-gray-400">
                        "{filter.replacement_text}"
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={filter.is_active}
                    onCheckedChange={(checked) =>
                      handleToggleActive(filter.id, checked)
                    }
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingFilter(filter);
                      setIsDialogOpen(true);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFilter(filter.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filters.length === 0 && (
          <Card className="bg-zinc-900 border-zinc-800 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-400 text-center">
                No message filters configured.
                <br />
                Add filters to block restricted content.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface FilterFormProps {
  filter: MessageFilter | null;
  onSave: (data: Partial<MessageFilter>) => void;
  onCancel: () => void;
}

function FilterForm({ filter, onSave, onCancel }: FilterFormProps) {
  const [formData, setFormData] = useState({
    filter_type: filter?.filter_type || "keyword",
    filter_value: filter?.filter_value || "",
    replacement_text: filter?.replacement_text || "",
    severity: filter?.severity || "medium",
  });

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label className="text-gray-300">Filter Type</Label>
        <Select
          value={formData.filter_type}
          onValueChange={(value) =>
            setFormData({ ...formData, filter_type: value })
          }
        >
          <SelectTriggerDark className="mt-1">
            <SelectValue />
          </SelectTriggerDark>
          <SelectContentDark>
            {FILTER_TYPES.map((type) => (
              <SelectItemDark key={type.value} value={type.value}>
                {type.label}
              </SelectItemDark>
            ))}
          </SelectContentDark>
        </Select>
      </div>

      <div>
        <Label className="text-gray-300">Filter Value</Label>
        <Input
          value={formData.filter_value}
          onChange={(e) =>
            setFormData({ ...formData, filter_value: e.target.value })
          }
          className="bg-zinc-800 border-zinc-700 text-white mt-1 font-mono"
          placeholder={
            formData.filter_type === "regex"
              ? "\\b(word1|word2)\\b"
              : "Enter keyword or phrase..."
          }
        />
      </div>

      <div>
        <Label className="text-gray-300">Replacement Text (Optional)</Label>
        <Input
          value={formData.replacement_text}
          onChange={(e) =>
            setFormData({ ...formData, replacement_text: e.target.value })
          }
          className="bg-zinc-800 border-zinc-700 text-white mt-1"
          placeholder="Leave empty to block message entirely"
        />
        <p className="text-gray-500 text-xs mt-1">
          If provided, the filtered content will be replaced. Otherwise, the
          message will be blocked.
        </p>
      </div>

      <div>
        <Label className="text-gray-300">Severity</Label>
        <Select
          value={formData.severity}
          onValueChange={(value) =>
            setFormData({ ...formData, severity: value })
          }
        >
          <SelectTriggerDark className="mt-1">
            <SelectValue />
          </SelectTriggerDark>
          <SelectContentDark>
            {SEVERITIES.map((sev) => (
              <SelectItemDark key={sev.value} value={sev.value}>
                {sev.label}
              </SelectItemDark>
            ))}
          </SelectContentDark>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
        <Button
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(formData)}
          disabled={!formData.filter_value}
        >
          {filter ? "Update Filter" : "Create Filter"}
        </Button>
      </div>
    </div>
  );
}
