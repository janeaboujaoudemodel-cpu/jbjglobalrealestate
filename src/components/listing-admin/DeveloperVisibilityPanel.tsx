import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, Eye, EyeOff, Search, CheckSquare, EyeIcon, EyeOffIcon } from "lucide-react";

export function DeveloperVisibilityPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: developers, isLoading } = useQuery({
    queryKey: ["developers-visibility"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name, is_hidden")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!developers) return [];
    if (!search.trim()) return developers;
    const q = search.toLowerCase();
    return developers.filter((d) => d.name.toLowerCase().includes(q));
  }, [developers, search]);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_hidden }: { id: string; is_hidden: boolean }) => {
      const { error } = await supabase
        .from("developers")
        .update({ is_hidden })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { is_hidden, id }) => {
      queryClient.invalidateQueries({ queryKey: ["developers-visibility"] });
      const dev = developers?.find((d) => d.id === id);
      toast.success(`${dev?.name || "Developer"} is now ${is_hidden ? "hidden" : "visible"}`);
    },
    onError: () => toast.error("Failed to update developer visibility"),
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, is_hidden }: { ids: string[]; is_hidden: boolean }) => {
      const { error } = await supabase
        .from("developers")
        .update({ is_hidden })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids, is_hidden }) => {
      queryClient.invalidateQueries({ queryKey: ["developers-visibility"] });
      toast.success(`${ids.length} developers ${is_hidden ? "hidden" : "made visible"}`);
      setSelectedIds(new Set());
    },
    onError: () => toast.error("Failed to update developers"),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)));
    }
  };

  const bulkHide = () => {
    if (selectedIds.size === 0) return;
    bulkMutation.mutate({ ids: Array.from(selectedIds), is_hidden: true });
  };

  const bulkShow = () => {
    if (selectedIds.size === 0) return;
    bulkMutation.mutate({ ids: Array.from(selectedIds), is_hidden: false });
  };

  if (isLoading) {
    return (
      <Card className="border-gold/30">
        <CardContent className="p-8 text-center text-muted-foreground">Loading developers...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Building2 className="w-5 h-5 text-gold" />
          Developer Visibility
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Toggle developer visibility on the public-facing site. Hidden developers won't appear in filters or listings.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search + Bulk Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search developers..."
              className="pl-9 bg-white border-gold/30"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="border-gold/30 text-foreground"
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
            </Button>
            {selectedIds.size > 0 && (
              <>
                <Button
                  size="sm"
                  onClick={bulkShow}
                  disabled={bulkMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  Show ({selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={bulkHide}
                  disabled={bulkMutation.isPending}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <EyeOffIcon className="w-4 h-4 mr-1" />
                  Hide ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="text-xs text-muted-foreground">
          Showing {filtered.length} of {developers?.length || 0} developers
          {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
        </div>

        {/* Developer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((dev) => (
            <div
              key={dev.id}
              className={`flex items-center justify-between p-3 rounded-lg border bg-white/50 transition-colors cursor-pointer ${
                selectedIds.has(dev.id) ? "border-gold ring-2 ring-gold/20" : "border-gold/20"
              }`}
              onClick={() => toggleSelect(dev.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedIds.has(dev.id)}
                  onChange={() => toggleSelect(dev.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gold/40 accent-gold cursor-pointer"
                />
                {dev.is_hidden ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <Eye className="w-4 h-4 text-green-600 shrink-0" />
                )}
                <span className="text-sm font-medium truncate">{dev.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Badge variant={dev.is_hidden ? "secondary" : "default"} className="text-xs">
                  {dev.is_hidden ? "Hidden" : "Visible"}
                </Badge>
                <Switch
                  checked={!dev.is_hidden}
                  onCheckedChange={(checked) => {
                    toggleMutation.mutate({ id: dev.id, is_hidden: !checked });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No developers found matching "{search}"
          </div>
        )}
      </CardContent>
    </Card>
  );
}
