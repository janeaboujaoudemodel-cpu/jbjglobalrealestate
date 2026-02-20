import { Link } from "react-router-dom";
import { useCommunities } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, TrendingUp } from "lucide-react";
import React from "react";

const CommunityGrid = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { data: communities, isLoading } = useCommunities();

  if (isLoading) {
    return (
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl bg-champagne/50" />
        ))}
      </div>
    );
  }

  // Premium communities list for highlighting
  const premiumCommunities = [
    "palm-jumeirah", "dubai-marina", "downtown-dubai", "dubai-hills-estate",
    "emirates-hills", "jumeirah-bay-island", "dubai-creek-harbour", "bluewaters-island"
  ];

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {communities?.map((community) => {
        const isPremium = premiumCommunities.includes(community.slug);
        
        return (
          <Link
            key={community.id}
            to={`/community/${community.slug}`}
            className="group relative overflow-hidden rounded-xl aspect-[4/3] border-2 border-gold/30 hover:border-gold/60 transition-all duration-300 shadow-md hover:shadow-xl"
          >
            {community.image_url ? (
              <img
                src={community.image_url}
                alt={community.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-premium-card to-premium-bg" aria-label={community.name} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
            
            {/* Premium badge - Champagne with gold accent */}
            {isPremium && (
              <div className="absolute top-3 right-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-gold/40 shadow-md">
                <TrendingUp className="w-3 h-3 text-gold" />
                <span className="text-black">Trending</span>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3
                className="text-gold font-semibold text-xl mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {community.name}
              </h3>
              {community.location && (
                <p className="text-zinc-200 text-sm flex items-center gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  <MapPin className="w-3 h-3 text-gold" />
                  {community.location}
                </p>
              )}
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold/50 rounded-xl transition-colors duration-300" />
          </Link>
        );
      })}
    </div>
  );
});

CommunityGrid.displayName = "CommunityGrid";

export default CommunityGrid;
