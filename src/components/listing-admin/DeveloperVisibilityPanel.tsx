import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Eye, EyeOff } from "lucide-react";

export function DeveloperVisibilityPanel() {
  const queryClient = useQueryClient();

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
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {developers?.map((dev) => (
            <div
              key={dev.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gold/20 bg-white/50"
            >
              <div className="flex items-center gap-2 min-w-0">
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
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({ id: dev.id, is_hidden: !checked })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
