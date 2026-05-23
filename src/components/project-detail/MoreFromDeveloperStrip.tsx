import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatPrice";

interface Props {
  developerId?: string | null;
  developerName?: string | null;
  developerSlug?: string | null;
  currentProjectId: string;
}

export default function MoreFromDeveloperStrip({ developerId, developerName, developerSlug, currentProjectId }: Props) {
  const { data } = useQuery({
    enabled: !!developerId,
    queryKey: ["more-from-developer", developerId, currentProjectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, slug, location, price_from, cover_image_url, handover_date")
        .eq("developer_id", developerId!)
        .neq("id", currentProjectId)
        .eq("is_published", true)
        .limit(60);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!developerId || !data || data.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between mb-4">
        <h3 className="text-lg md:text-xl font-semibold text-foreground">
          More from <span className="text-[#B89555]">{developerName || "this developer"}</span>
        </h3>
        {developerSlug && (
          <Link
            to={`/developer/${developerSlug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1A1A] border border-[#B89555]/50 bg-[#F7F2EA] hover:bg-[#EFE6D6] rounded-full px-4 py-2 transition-colors"
          >
            View all projects
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((p) => (
          <Link
            key={p.id}
            to={`/project/${p.slug}`}
            className="rounded-xl overflow-hidden border border-[#B89555]/30 bg-card hover:shadow-lg hover:shadow-gold/20 hover:border-[#B89555]/60 transition-all"
          >
            <div className="aspect-[4/3] bg-[#EFE6D6] overflow-hidden">
              {p.cover_image_url ? (
                <img
                  src={p.cover_image_url}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div className="p-3">
              {p.location && (
                <p className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 truncate">{p.location}</p>
              )}
              <p className="text-sm font-semibold text-foreground mt-1 truncate">{p.name}</p>
              {typeof p.price_from === "number" && p.price_from > 0 && (
                <p className="text-xs text-price-orange font-bold mt-1">
                  From {formatPrice(p.price_from)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
