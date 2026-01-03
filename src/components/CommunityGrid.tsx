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
          <Skeleton key={i} className="aspect-[4/3] rounded-xl bg-zinc-900" />
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
            className="group relative overflow-hidden rounded-xl aspect-[4/3] border border-zinc-800 hover:border-zinc-600 transition-all duration-300"
          >
            <img
              src={community.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"}
              alt={community.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            {/* Premium badge - Black with gold accent */}
            {isPremium && (
              <div className="absolute top-3 right-3 bg-black/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-gold/30">
                <TrendingUp className="w-3 h-3 text-gold" />
                <span className="text-gold-light">Trending</span>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3
                className="text-white font-semibold text-xl mb-1"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {community.name}
              </h3>
              {community.location && (
                <p className="text-zinc-400 text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {community.location}
                </p>
              )}
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-zinc-600 rounded-xl transition-colors duration-300" />
          </Link>
        );
      })}
    </div>
  );
});

CommunityGrid.displayName = "CommunityGrid";

export default CommunityGrid;
