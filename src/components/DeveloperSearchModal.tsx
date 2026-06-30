import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Building2, ChevronRight, Crown, Award, Star } from "lucide-react";
import { useDevelopers } from "@/hooks/useProjects";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";

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
    if (rank <= 3) return { icon: Crown, label: "Elite", color: "text-[#1A1A1A] bg-[#EFE6D6]/10 border-[#B89555]/30" };
    if (rank <= 10) return { icon: Award, label: "Premier", color: "text-[#1A1A1A] bg-amber-400/10 border-amber-400/30" };
    if (rank <= 20) return { icon: Star, label: "Established", color: "text-white/85 bg-[#E5D9C4]/10 border-[#B89555]/30" };
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] text-white max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1A1A1A]" />
            Search by Developer
          </DialogTitle>
          <p className="text-white/70 text-sm mt-1">
            Browse {developers?.length || 0} premium UAE property developers ranked by market standing
          </p>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/90" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search developers by name or headquarters..."
            className="pl-10 bg-[#FDFBF7] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 focus:border-[#B89555] h-12"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto max-h-[55vh] space-y-2 pr-1">
          {isLoading ? (
            <div className="text-center py-12 text-white/90">Loading developers...</div>
          ) : filteredDevelopers.length === 0 ? (
            <div className="text-center py-12 text-white/90">No developers found</div>
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
                      ? "bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-gold/5 border-[#B89555]/20 hover:border-[#B89555]/40" 
                      : "bg-[#FDFBF7]/50 hover:bg-[#1A1A1A] border-[#1A1A1A] hover:border-[#1A1A1A]"
                  }`}
                >
                  {/* Rank Number */}
                  <div className={`w-8 text-center font-bold text-lg ${isTopTier ? "text-[#1A1A1A]" : "text-[#1A1A1A]/70"}`}>
                    #{developer.rank || index + 1}
                  </div>
                  
                  {/* Logo */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden bg-[#FDFBF7] ${
                    isTopTier ? "border-2 border-[#B89555] shadow-[0_4px_16px_rgba(200,167,102,0.3)]" : "border-2 border-[#B89555]/40"
                  }`}>
                    {isValidDeveloperLogoUrl(developer.logo_url) ? (
                      <img src={developer.logo_url as string} alt={developer.name} className="w-full h-full object-contain"  loading="lazy" decoding="async" />
                    ) : (
                      <Building2 className={`w-7 h-7 ${isTopTier ? "text-[#1A1A1A]" : "text-white/90"}`} />
                    )}
                  </div>
                  
                  {/* Developer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold truncate text-base">
                        {developer.name}
                      </h4>
                      {tier && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${tier.color}`}>
                          <tier.icon className="w-3 h-3" />
                          {tier.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/70">
                      {developer.headquarters && (
                        <span>📍 {developer.headquarters}</span>
                      )}
                      {developer.completed_projects && (
                        <span>✓ {developer.completed_projects.toLocaleString()} completed</span>
                      )}
                      {developer.offplan_projects && (
                        <span className="text-[#1A1A1A]">🏗️ {developer.offplan_projects} active</span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className={`w-5 h-5 transition-colors ${isTopTier ? "text-[#1A1A1A]/70 group-hover:text-[#1A1A1A]" : "text-[#1A1A1A]/70 group-hover:text-white"}`} />
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
