import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatPrice";

interface Props {
  developerId?: string | null;
  developerName?: string | null;
  currentProjectId: string;
}

export default function MoreFromDeveloperStrip({ developerId, developerName, currentProjectId }: Props) {
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
        .limit(12);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!developerId || !data || data.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-foreground mb-3">
        More from {developerName || "this developer"}
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
        {data.map((p) => (
          <Link
            key={p.id}
            to={`/project/${p.slug}`}
            className="snap-start shrink-0 w-[240px] rounded-xl overflow-hidden border border-[#B89555]/30 bg-card hover:shadow-lg hover:shadow-gold/20 transition-all"
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
