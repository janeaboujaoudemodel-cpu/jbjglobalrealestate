import { Link } from "react-router-dom";
import { useCommunities } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const CommunityGrid = () => {
  const { data: communities, isLoading } = useCommunities();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-lg bg-[#1a1a1a]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {communities?.map((community) => (
        <Link
          key={community.id}
          to={`/community/${community.slug}`}
          className="group relative overflow-hidden rounded-lg aspect-[4/3]"
        >
          <img
            src={community.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"}
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3
              className="text-white font-semibold text-xl mb-1"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {community.name}
            </h3>
            {community.location && (
              <p className="text-gray-300 text-sm">{community.location}</p>
            )}
          </div>
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#D4A017]/50 rounded-lg transition-colors duration-300" />
        </Link>
      ))}
    </div>
  );
};

export default CommunityGrid;
