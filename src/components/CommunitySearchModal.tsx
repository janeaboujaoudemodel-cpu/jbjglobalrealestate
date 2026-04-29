import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommunities } from "@/hooks/useProjects";

interface CommunitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommunitySearchModal = ({ isOpen, onClose }: CommunitySearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: communities, isLoading } = useCommunities();

  const filteredCommunities = communities?.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-gray-800 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <MapPin className="w-6 h-6 text-gold" />
            Search by Community
          </DialogTitle>
          <p className="text-white/70 text-sm">Browse all UAE property communities</p>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/90" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-zinc-900 border-gray-800 text-white placeholder:text-gray-600 focus:border-gold rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <ScrollArea className="h-[400px] mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredCommunities?.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-white/90">No communities found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredCommunities?.map((community) => (
                <Link
                  key={community.id}
                  to={`/community/${community.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 bg-zinc-900/50 hover:bg-gray-800 border border-gray-800 hover:border-gold/50 rounded-xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {community.image_url ? (
                      <img
                        src={community.image_url}
                        alt={community.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MapPin className="w-5 h-5 text-gold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate group-hover:text-gold transition-colors">
                      {community.name}
                    </h3>
                    {community.location && (
                      <p className="text-white/90 text-sm truncate">{community.location}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CommunitySearchModal;
