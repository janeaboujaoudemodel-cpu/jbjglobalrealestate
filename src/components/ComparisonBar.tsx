import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, Scale, Sparkles, Trophy, Users, Download } from "lucide-react";
import { useShortlist, useToggleShortlist } from "@/hooks/useFavorites";
import { useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useShortlistBadges } from "@/hooks/useShortlistBadges";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const INQUIRY_FORM_URL = "https://jbj.ae/contact";

const badgeLabels: Record<string, { label: string; color: string }> = {
  top1: { label: "🥇 Top 1", color: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" },
  top2: { label: "🥉 Top 2", color: "bg-orange-600/20 border-orange-600/50 text-orange-400" },
  top3: { label: "🥈 Top 3", color: "bg-gray-400/20 border-gray-400/50 text-gray-300" },
};

const ComparisonBar = () => {
  const { user } = useAuth();
  const { data: authShortlist } = useShortlist();
  const toggleAuthShortlist = useToggleShortlist();
  const { shortlist: guestShortlist, toggleShortlist: toggleGuestShortlist } = useGuestShortlist();
  const { setBadge, getBadge } = useShortlistBadges();
  const [isOpen, setIsOpen] = useState(false);

  // Use auth shortlist if logged in, otherwise guest shortlist
  const shortlist = user ? authShortlist : guestShortlist;
  const shortlistIds = shortlist?.map((s) => s.project_id) || [];

  // Fetch project details for shortlisted items
  const { data: shortlistedProjects } = useQuery({
    queryKey: ["shortlisted-projects", shortlistIds],
    queryFn: async () => {
      if (!shortlistIds.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(name, slug),
          images:project_images(image_url, alt_text, display_order)
        `)
        .in("id", shortlistIds);

      if (error) throw error;
      return data;
    },
    enabled: shortlistIds.length > 0,
  });

  if (!shortlist?.length) return null;

  const handleRemove = (projectId: string) => {
    if (user) {
      toggleAuthShortlist.mutate({ 
        projectId, 
        isShortlisted: true, 
      });
    } else {
      toggleGuestShortlist(projectId);
    }
  };

  const handleSetBadge = (projectId: string, badge: 'top1' | 'top2' | 'top3' | null) => {
    setBadge(projectId, badge);
  };

  const currentBadge = (projectId: string) => {
    return getBadge(projectId);
  };

  return (
    <>
      {/* Floating comparison bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-3 px-6 py-3 bg-white text-zinc-900 rounded-full shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 group">
              <div className="flex items-center gap-1">
                {shortlistedProjects?.slice(0, 3).map((project, index) => (
                  <div
                    key={project.id}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-white -ml-2 first:ml-0 shadow-sm"
                    style={{ zIndex: 3 - index }}
                  >
                    <img
                      src={project.images?.[0]?.image_url || "/placeholder.svg"}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {shortlist.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 -ml-2 flex items-center justify-center text-xs font-bold">
                    +{shortlist.length - 3}
                  </div>
                )}
              </div>
              <span className="font-semibold">
                {shortlist.length} {shortlist.length === 1 ? "Property" : "Properties"}
              </span>
              <Scale className="w-5 h-5" />
              <span className="text-sm opacity-70">Compare</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </SheetTrigger>
          
          <SheetContent 
            side="bottom" 
            className="h-[90vh] bg-zinc-950 border-t border-zinc-800 rounded-t-3xl"
          >
            <SheetHeader className="pb-4 border-b border-zinc-800">
              <SheetTitle className="text-white text-2xl flex items-center gap-3">
                <Scale className="w-6 h-6 text-gold" />
                Property Shortlist & Comparison
                <span className="text-sm font-normal text-zinc-500">
                  ({shortlist.length} selected)
                </span>
              </SheetTitle>
              <p className="text-zinc-400 text-sm">
                Assign badges to mark your top choices, then compare with AI or request expert evaluation
              </p>
            </SheetHeader>

            <div className="py-6 overflow-y-auto h-[calc(100%-220px)]">
              {shortlistedProjects && shortlistedProjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {shortlistedProjects.map((project) => {
                    const badge = currentBadge(project.id);
                    const badgeInfo = badge ? badgeLabels[badge] : null;
                    
                    return (
                      <div
                        key={project.id}
                        className={`relative bg-zinc-900 rounded-2xl overflow-hidden border transition-all ${
                          badgeInfo ? badgeInfo.color.replace('text-', 'border-').replace('/50', '/30') : 'border-zinc-800'
                        }`}
                      >
                        {/* Badge Selector */}
                        <div className="absolute top-3 left-3 z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                badgeInfo 
                                  ? `${badgeInfo.color} border` 
                                  : 'bg-black/60 text-white hover:bg-black/80'
                              }`}>
                                {badgeInfo ? badgeInfo.label : <Trophy className="w-3 h-3" />}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem 
                                onClick={() => handleSetBadge(project.id, 'top1')}
                                className="text-yellow-400 hover:bg-zinc-800 cursor-pointer"
                              >
                                🥇 Set as Top 1
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleSetBadge(project.id, 'top2')}
                                className="text-orange-400 hover:bg-zinc-800 cursor-pointer"
                              >
                                🥉 Set as Top 2
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleSetBadge(project.id, 'top3')}
                                className="text-gray-300 hover:bg-zinc-800 cursor-pointer"
                              >
                                🥈 Set as Top 3
                              </DropdownMenuItem>
                              {badge && (
                                <DropdownMenuItem 
                                  onClick={() => handleSetBadge(project.id, null)}
                                  className="text-zinc-400 hover:bg-zinc-800 cursor-pointer"
                                >
                                  Remove Badge
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(project.id)}
                          className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={project.images?.[0]?.image_url || "/placeholder.svg"}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="p-4 space-y-3">
                          <h3 className="text-white font-semibold text-lg line-clamp-1">
                            {project.name}
                          </h3>
                          <p className="text-zinc-500 text-sm">
                            {project.developer?.name}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-zinc-800/50 rounded-lg p-2">
                              <p className="text-zinc-500 text-xs">Price From</p>
                              <p className="text-white font-medium">
                                AED {(Math.round((project.price_from || 0)) / 1000000).toFixed(1)}M
                              </p>
                            </div>
                            <div className="bg-zinc-800/50 rounded-lg p-2">
                              <p className="text-zinc-500 text-xs">Bedrooms</p>
                              <p className="text-white font-medium">
                                {project.bedrooms_min} - {project.bedrooms_max} BR
                              </p>
                            </div>
                          </div>

                          <Link
                            to={`/project/${project.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="block text-center py-2 text-sm text-gold hover:text-gold-light transition-colors"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-500">Loading properties...</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-zinc-950 border-t border-zinc-800">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/compare" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button 
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white h-12 text-base font-semibold"
                    disabled={shortlist.length < 2}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Comparison
                  </Button>
                </Link>
                <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button 
                    className="w-full bg-white text-zinc-900 hover:bg-zinc-100 h-12 text-base font-semibold"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Expert Consultation
                  </Button>
                </a>
              </div>
              {shortlist.length < 2 && (
                <p className="text-zinc-500 text-sm text-center mt-3">
                  Add at least 2 properties for AI comparison
                </p>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default ComparisonBar;
