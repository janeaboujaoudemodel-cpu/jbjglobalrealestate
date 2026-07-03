import { Link } from "react-router-dom";
import { useCommunities } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, TrendingUp } from "lucide-react";
import React from "react";

const COMMUNITY_IMAGE_OVERRIDES: Record<string, string> = {
  "palm-jumeirah": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/Untitled_3_1_d399bd0aa0.webp",
  "dubai-marina": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/dubai_marina_area_banner_80b224d84d.webp",
  "downtown-dubai": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/dubai_downtown_in_e6f397d08e.webp",
  "dubai-hills-estate": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/dubai_hills_dffe87f14f.webp",
  "jumeirah-village-circle": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/JVC_banner_0d6b3267c8.webp",
  "business-bay": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/business_bay_74db87d9c3.webp",
  "arabian-ranches": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/Untitled_1_7_0b0f216fc2.webp",
  "emirates-hills": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/emirates_h_dedd9ddf9d.webp",
  "jumeirah-lake-towers": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/jlt_bannar_5bb27ed207.webp",
  "dubai-creek-harbour": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/dubai_creek_harbour_788a9f98e3.webp",
  "bluewaters-island": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/Bluewaters_Island_Area_Guide_Provident_Estate_e9edd30ffc.webp",
  "jumeirah-beach-residence": "https://d3h330vgpwpjr8.cloudfront.net/x/744x/JBR_Area_and_Lifestyle_Guide_Provident_Estate_763c04e03c.webp",
};

const CommunityGrid = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { data: communities, isLoading } = useCommunities();

  if (isLoading) {
    return (
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806]" />
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
        const communityImage = COMMUNITY_IMAGE_OVERRIDES[community.slug] || community.image_url;
        
        return (
          <Link
            key={community.id}
            to={`/community/${community.slug}`}
            className="group relative overflow-hidden rounded-xl aspect-[4/3] border border-[#064E3B]/45 hover:border-[#064E3B] transition-all duration-300 shadow-md hover:shadow-xl"
          >
            {communityImage ? (
              <img
                src={communityImage}
                alt={community.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
               loading="lazy" decoding="async" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806]" aria-label={community.name} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
            
            {/* Premium badge */}
            {isPremium && (
              <div className="allow-white jj-pill-emerald-metallic backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border-0 shadow-md">
                <TrendingUp className="w-3 h-3 text-white" />
                <span className="text-white">Trending</span>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3
                className="allow-white text-white font-semibold text-xl mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
              >
                {community.name}
              </h3>
              {community.location && (
                <p className="allow-white text-white text-sm flex items-center gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  <MapPin className="w-3 h-3 text-white" />
                  {community.location}
                </p>
              )}
            </div>
            <div className="absolute inset-0 border border-transparent group-hover:border-[#064E3B]/70 rounded-xl transition-colors duration-300" />
          </Link>
        );
      })}
    </div>
  );
});

CommunityGrid.displayName = "CommunityGrid";

export default CommunityGrid;
