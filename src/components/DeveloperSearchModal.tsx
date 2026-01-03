import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Building2, ChevronRight } from "lucide-react";
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            <Building2 className="w-5 h-5 text-gold" />
            Search by Developer
          </DialogTitle>
          <p className="text-zinc-400 text-sm mt-1">Browse all UAE property developers</p>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search developers by name or location..."
            className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto max-h-[50vh] space-y-1">
          {isLoading ? (
            <div className="text-center py-8 text-zinc-500">Loading developers...</div>
          ) : filteredDevelopers.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">No developers found</div>
          ) : (
            filteredDevelopers.map((developer) => (
              <button
                key={developer.id}
                onClick={() => handleSelectDeveloper(developer.slug)}
                className="w-full flex items-center gap-4 p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 border border-transparent hover:border-gold/30 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                  {developer.logo_url ? (
                    <img src={developer.logo_url} alt={developer.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-gold" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {developer.name}
                  </h4>
                  <p className="text-zinc-500 text-sm truncate">
                    {developer.headquarters && `📍 ${developer.headquarters}`}
                    {developer.offplan_projects && ` • ${developer.offplan_projects} Active Projects`}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-gold transition-colors" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeveloperSearchModal;
