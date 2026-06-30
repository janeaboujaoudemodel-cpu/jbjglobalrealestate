import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  developerName: string;
}

export default function ExistingProjectsReview({ developerName }: Props) {
  const { data: existingProjects = [], isLoading } = useQuery({
    queryKey: ["dev-existing-projects", developerName],
    queryFn: async () => {
      if (!developerName) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, is_published, cover_image_url, price_from, handover_date, updated_at, description")
        .ilike("developer_name", `%${developerName}%`)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!developerName && developerName.length > 2,
  });

  if (isLoading || existingProjects.length === 0) return null;

  const published = existingProjects.filter(p => p.is_published);
  const incomplete = existingProjects.filter(p => !p.description || !p.price_from);

  return (
    <Card className="border-2 border-[#B89555]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1A1A1A]" />
          Your Published Projects ({published.length})
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Review and update existing projects before publishing new ones.
        </p>
      </CardHeader>
      <CardContent>
        {incomplete.length > 0 && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200/40 text-sm text-orange-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {incomplete.length} project(s) have missing data (description or price). Consider updating them.
          </div>
        )}
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {existingProjects.slice(0, 20).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#B89555]/15 hover:bg-muted/50 transition-colors">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt={p.name} className="w-14 h-10 object-cover rounded"  loading="lazy" decoding="async" />
                ) : (
                  <div className="w-14 h-10 bg-muted rounded flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.is_published ? (
                      <Badge variant="secondary" className="text-[10px] jj-emerald-soft text-[color:var(--emerald-1)]">
                        <CheckCircle className="w-3 h-3 mr-0.5" /> Published
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Draft</Badge>
                    )}
                    {(!p.description || !p.price_from) && (
                      <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">Needs update</Badge>
                    )}
                  </div>
                </div>
                <Link to={`/project/${p.slug}`} className="text-[#1A1A1A] hover:text-[#1A1A1A] shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
