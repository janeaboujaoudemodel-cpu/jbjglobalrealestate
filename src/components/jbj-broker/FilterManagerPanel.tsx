import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Shield, AlertTriangle, Search } from "lucide-react";
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
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Block</Badge>;
      case "warn":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Warn</Badge>;
      case "replace":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Replace</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-white">Message Filter Manager</CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                Manage restricted keywords and content filters
              </p>
            </div>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-gold hover:bg-gold-dark text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search filters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        {/* Filters List */}
        <div className="space-y-2">
          {filteredFilters.map((filter) => (
            <div
              key={filter.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                filter.is_active
                  ? "bg-zinc-800 border-zinc-700"
                  : "bg-zinc-800/50 border-zinc-700/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-4 w-4 ${
                  filter.filter_type === "block" ? "text-red-400" :
                  filter.filter_type === "warn" ? "text-amber-400" : "text-blue-400"
                }`} />
                <div>
                  <p className="text-white font-medium">{filter.keyword}</p>
                  {filter.replacement_text && (
                    <p className="text-gray-400 text-sm">
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
                  className={filter.is_active ? "text-emerald-400" : "text-gray-400"}
                >
                  {filter.is_active ? "Active" : "Inactive"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteFilter(filter.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {filteredFilters.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-400">
              {searchQuery ? "No filters match your search" : "No filters configured"}
            </div>
          )}
        </div>
      </CardContent>

      {/* Add Filter Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle>Add New Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Keyword</label>
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter restricted keyword..."
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Filter Type</label>
              <Select value={newFilterType} onValueChange={setNewFilterType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="block">Block - Prevent message from sending</SelectItem>
                  <SelectItem value="warn">Warn - Show warning but allow</SelectItem>
                  <SelectItem value="replace">Replace - Substitute with safe text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newFilterType === "replace" && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Replacement Text</label>
                <Input
                  value={newReplacement}
                  onChange={(e) => setNewReplacement(e.target.value)}
                  placeholder="Enter replacement text..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="border-zinc-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFilter}
              className="bg-gold hover:bg-gold-dark text-black"
            >
              Add Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
