import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Shield, AlertTriangle, Search, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MessageFilter {
  id: string;
  keyword: string;
  filter_type: string;
  replacement_text: string | null;
  is_active: boolean;
  created_at: string;
}

export function FilterManagerPanel() {
  const [filters, setFilters] = useState<MessageFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newFilterType, setNewFilterType] = useState("block");
  const [newReplacement, setNewReplacement] = useState("");

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const { data, error } = await supabase
        .from("jbj_filters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFilters(data || []);
    } catch (error) {
      console.error("Error fetching filters:", error);
      toast.error("Failed to load filters");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFilter = async () => {
    if (!newKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    try {
      const { error } = await supabase.from("jbj_filters").insert({
        keyword: newKeyword.trim().toLowerCase(),
        filter_type: newFilterType,
        replacement_text: newFilterType === "replace" ? newReplacement : null,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Filter added successfully");
      setAddDialogOpen(false);
      setNewKeyword("");
      setNewFilterType("block");
      setNewReplacement("");
      fetchFilters();
    } catch (error) {
      console.error("Error adding filter:", error);
      toast.error("Failed to add filter");
    }
  };

  const handleDeleteFilter = async (id: string) => {
    try {
      const { error } = await supabase
        .from("jbj_filters")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFilters(filters.filter((f) => f.id !== id));
      toast.success("Filter removed");
    } catch (error) {
      console.error("Error deleting filter:", error);
      toast.error("Failed to remove filter");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("jbj_filters")
        .update({ is_active: !currentActive })
        .eq("id", id);

      if (error) throw error;

      setFilters(filters.map((f) => 
        f.id === id ? { ...f, is_active: !currentActive } : f
      ));
    } catch (error) {
      console.error("Error updating filter:", error);
      toast.error("Failed to update filter");
    }
  };

  const filteredFilters = filters.filter((f) =>
    f.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "block":
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Block</Badge>;
      case "warn":
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">Warn</Badge>;
      case "replace":
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Replace</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Guidance Card */}
      <div className="jj-card-inner flex items-start gap-4 p-4">
        <div className="jj-icon-box-active w-10 h-10 flex-shrink-0">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-semibold text-[#1A1A1A] mb-1">What is the Filter Manager?</h4>
          <p className="text-sm text-[#1A1A1A]/70">
            The Filter Manager controls which words or phrases are restricted in broker communications. 
            You can <strong>block</strong> keywords (message won't send), <strong>warn</strong> (alert but allow), 
            or <strong>replace</strong> them with approved alternatives. Use this to maintain compliance and brand standards.
          </p>
        </div>
      </div>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="jj-icon-box-active w-10 h-10">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Message Filters</h3>
            <p className="text-sm text-[#1A1A1A]/60">{filters.length} filters configured</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/50" />
        <Input
          placeholder="Search filters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters List */}
      <div className="space-y-2">
        {filteredFilters.map((filter) => (
          <div
            key={filter.id}
            className={`jj-card-inner flex items-center justify-between p-4 ${
              !filter.is_active ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-4 w-4 ${
                filter.filter_type === "block" ? "text-red-600" :
                filter.filter_type === "warn" ? "text-amber-600" : "text-blue-600"
              }`} />
              <div>
                <p className="text-[#1A1A1A] font-medium">{filter.keyword}</p>
                {filter.replacement_text && (
                  <p className="text-[#1A1A1A]/60 text-sm">
                    Replace with: "{filter.replacement_text}"
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getTypeBadge(filter.filter_type)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleActive(filter.id, filter.is_active)}
                className={filter.is_active ? "text-emerald-600" : "text-[#1A1A1A]/50"}
              >
                {filter.is_active ? "Active" : "Inactive"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteFilter(filter.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {filteredFilters.length === 0 && !loading && (
          <div className="jj-card-inner text-center py-8 text-[#1A1A1A]/60">
            {searchQuery ? "No filters match your search" : "No filters configured. Add your first filter above."}
          </div>
        )}
      </div>

      {/* Add Filter Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">Add New Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Keyword to Filter</label>
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter restricted keyword..."
              />
            </div>
            <div>
              <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Filter Type</label>
              <Select value={newFilterType} onValueChange={setNewFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Block - Prevent message from sending</SelectItem>
                  <SelectItem value="warn">Warn - Show warning but allow</SelectItem>
                  <SelectItem value="replace">Replace - Substitute with safe text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newFilterType === "replace" && (
              <div>
                <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Replacement Text</label>
                <Input
                  value={newReplacement}
                  onChange={(e) => setNewReplacement(e.target.value)}
                  placeholder="Enter replacement text..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddFilter}>
              Add Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
