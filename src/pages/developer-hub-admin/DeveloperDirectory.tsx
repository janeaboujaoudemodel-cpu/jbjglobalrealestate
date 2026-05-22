import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, ExternalLink, ImageOff } from "lucide-react";

interface Row {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  last_enriched_at: string | null;
}

export default function DeveloperDirectory() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [onlyBroken, setOnlyBroken] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dev-hub-directory", search, onlyBroken],
    queryFn: async () => {
      let q = supabase
        .from("developers")
        .select("id, name, slug, logo_url, website_url, description, last_enriched_at")
        .order("name")
        .limit(300);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      if (onlyBroken) q = q.or("logo_url.is.null,logo_url.eq.,description.is.null");
      const { data, error } = await q;
      if (error) throw error;
      return data as Row[];
    },
  });

  const rebuild = useMutation({
    mutationFn: async (developerId: string) => {
      const { data, error } = await supabase.functions.invoke("developer-site-rebuild", {
        body: { developer_id: developerId, preview: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Scrape staged — review in Site Rebuild queue");
      qc.invalidateQueries({ queryKey: ["dev-enrichment-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-[#F7F2EA] border border-[#B89555]/30 flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search developer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-72"
        />
        <Button
          variant={onlyBroken ? "gold" : "outline"}
          size="sm"
          onClick={() => setOnlyBroken((v) => !v)}
        >
          {onlyBroken ? "Showing broken only" : "Show broken only"}
        </Button>
        <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] ml-auto">
          {data?.length ?? 0} shown
        </Badge>
      </Card>

      {isLoading && <p className="text-sm text-[#1A1A1A]/70">Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.map((d) => (
          <Card key={d.id} className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
            <div className="flex items-start gap-3">
              <div className="size-14 shrink-0 rounded border border-[#B89555]/30 bg-[#FDFBF7] p-1 flex items-center justify-center overflow-hidden">
                {d.logo_url ? (
                  <img src={d.logo_url} alt={d.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageOff className="size-6 text-[#1A1A1A]/40" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#1A1A1A] truncate">{d.name}</p>
                <p className="text-xs text-[#1A1A1A]/60 truncate">{d.slug}</p>
                {d.website_url && (
                  <a href={d.website_url} target="_blank" rel="noreferrer" className="text-xs text-[#1A1A1A]/70 underline flex items-center gap-1 mt-1">
                    <ExternalLink className="size-3" />
                    {(() => { try { return new URL(d.website_url).hostname; } catch { return d.website_url; } })()}
                  </a>
                )}
              </div>
            </div>
            <p className="text-xs text-[#1A1A1A]/75 mt-2 line-clamp-2">
              {d.description ?? <span className="italic text-[#1A1A1A]/40">No description</span>}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="gold"
                onClick={() => rebuild.mutate(d.id)}
                disabled={rebuild.isPending}
              >
                <Sparkles className="size-3 mr-1" /> Rebuild from site
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to={`/developer-hub-admin/profile/${d.slug}`}>Profile</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
