import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Building2, ChevronRight, Crown, Award, Star } from "lucide-react";
import { useDevelopers } from "@/hooks/useProjects";

interface DeveloperSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeveloperSearchModal = ({ isOpen, onClose }: DeveloperSearchModalProps) => {
  const { data: developers, isLoading } = useDevelopers();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredDevelopers = useMemo(() => {
    if (!developers) return [];
    if (!searchQuery) return developers;
    
    const query = searchQuery.toLowerCase();
    return developers.filter(dev => 
      dev.name.toLowerCase().includes(query) ||
      dev.headquarters?.toLowerCase().includes(query)
    );
  }, [developers, searchQuery]);

  const handleSelectDeveloper = (slug: string) => {
    onClose();
    navigate(`/developer/${slug}`);
  };

  // Get tier badge based on rank
  const getTierBadge = (rank: number | null) => {
    if (!rank) return null;
    if (rank <= 3) return { icon: Crown, label: "Elite", color: "text-gold bg-gold/10 border-gold/30" };
    if (rank <= 10) return { icon: Award, label: "Premier", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" };
    if (rank <= 20) return { icon: Star, label: "Established", color: "text-zinc-300 bg-zinc-300/10 border-zinc-300/30" };
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            <Building2 className="w-6 h-6 text-gold" />
            Search by Developer
          </DialogTitle>
          <p className="text-zinc-400 text-sm mt-1">
            Browse {developers?.length || 0} premium UAE property developers ranked by market standing
          </p>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search developers by name or headquarters..."
            className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold h-12"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto max-h-[55vh] space-y-2 pr-1">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-500">Loading developers...</div>
          ) : filteredDevelopers.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">No developers found</div>
          ) : (
            filteredDevelopers.map((developer, index) => {
              const tier = getTierBadge(developer.rank);
              const isTopTier = developer.rank && developer.rank <= 3;
              
              return (
                <button
                  key={developer.id}
                  onClick={() => handleSelectDeveloper(developer.slug)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group text-left border ${
                    isTopTier 
                      ? "bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-gold/5 border-gold/20 hover:border-gold/40" 
                      : "bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {/* Rank Number */}
                  <div className={`w-8 text-center font-bold text-lg ${isTopTier ? "text-gold" : "text-zinc-600"}`}>
                    #{developer.rank || index + 1}
                  </div>
                  
                  {/* Logo */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden bg-white ${
                    isTopTier ? "border-2 border-gold shadow-[0_4px_16px_rgba(200,167,102,0.3)]" : "border-2 border-gold/40"
                  }`}>
                    {developer.logo_url ? (
                      <img src={developer.logo_url} alt={developer.name} className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className={`w-7 h-7 ${isTopTier ? "text-gold" : "text-zinc-500"}`} />
                    )}
                  </div>
                  
                  {/* Developer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold truncate text-base" style={{ fontFamily: "Poppins, sans-serif" }}>
                        {developer.name}
                      </h4>
                      {tier && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${tier.color}`}>
                          <tier.icon className="w-3 h-3" />
                          {tier.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      {developer.headquarters && (
                        <span>📍 {developer.headquarters}</span>
                      )}
                      {developer.completed_projects && (
                        <span>✓ {developer.completed_projects.toLocaleString()} completed</span>
                      )}
                      {developer.offplan_projects && (
                        <span className="text-gold">🏗️ {developer.offplan_projects} active</span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className={`w-5 h-5 transition-colors ${isTopTier ? "text-gold/60 group-hover:text-gold" : "text-zinc-600 group-hover:text-white"}`} />
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeveloperSearchModal;
