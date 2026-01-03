import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { ChevronLeft, Heart, ListPlus, ArrowRight, Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/ProjectCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Favorites = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "shortlist" ? "shortlist" : "favorites";
  
  const { data: userFavorites, isLoading: loadingFavorites } = useFavorites();
  const { data: userShortlist, isLoading: loadingShortlist } = useShortlist();
  const { favorites: guestFavorites } = useGuestFavorites();
  const { shortlist: guestShortlist, setBadge, getBadge } = useGuestShortlist();

  // Determine which data to use based on auth status
  const favoriteIds = user 
    ? (userFavorites?.map(f => f.project_id) || [])
    : guestFavorites.map(f => f.project_id);
  
  const shortlistIds = user
    ? (userShortlist?.map(s => s.project_id) || [])
    : guestShortlist.map(s => s.project_id);

  // Fetch favorite projects
  const { data: favoriteProjects, isLoading: loadingFavProjects } = useQuery({
    queryKey: ["favorite-projects", favoriteIds],
    queryFn: async () => {
      if (!favoriteIds.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          community:communities(id, name, slug),
          documents:project_documents(id, file_url, file_name, document_type)
        `)
        .in("id", favoriteIds);

      if (error) throw error;
      return data;
    },
    enabled: favoriteIds.length > 0,
  });

  // Fetch shortlisted projects
  const { data: shortlistedProjects, isLoading: loadingShortProjects } = useQuery({
    queryKey: ["shortlisted-projects-full", shortlistIds],
    queryFn: async () => {
      if (!shortlistIds.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          community:communities(id, name, slug),
          documents:project_documents(id, file_url, file_name, document_type)
        `)
        .in("id", shortlistIds);

      if (error) throw error;
      return data;
    },
    enabled: shortlistIds.length > 0,
  });

  const isLoading = user ? loadingFavorites || loadingShortlist : false;
  const favCount = favoriteIds.length;
  const shortlistCount = shortlistIds.length;

  // Get badge for a project (guest only for now)
  const getProjectBadge = (projectId: string) => {
    if (!user) {
      return getBadge(projectId);
    }
    return null; // TODO: implement for authenticated users
  };

  // Set badge for a project
  const handleSetBadge = (projectId: string, badge: 'top1' | 'top2' | 'top3' | null) => {
    if (!user) {
      setBadge(projectId, badge);
    }
    // TODO: implement for authenticated users
  };

  const badgeLabels = {
    top1: { label: "Top 1", color: "bg-gradient-to-r from-yellow-400 to-yellow-600" },
    top2: { label: "Top 2", color: "bg-gradient-to-r from-gray-300 to-gray-400" },
    top3: { label: "Top 3", color: "bg-gradient-to-r from-amber-600 to-amber-700" },
  };

  return (
    <section className="min-h-screen bg-zinc-950 py-8 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Properties</span>
        </Link>

        <h1 className="text-white text-3xl font-bold mb-8">My Saved Properties</h1>

        {!user && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8 flex items-center justify-between">
            <p className="text-zinc-400">
              <span className="text-zinc-300">Guest Mode:</span> Your saved properties are stored locally. Sign in to sync across devices.
            </p>
            <Link to="/auth">
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Sign In
              </Button>
            </Link>
          </div>
        )}

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-8">
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 text-zinc-400"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({favCount})
            </TabsTrigger>
            <TabsTrigger
              value="shortlist"
              className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 text-zinc-400"
            >
              <ListPlus className="w-4 h-4 mr-2" />
              Shortlist ({shortlistCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {isLoading || loadingFavProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-zinc-900 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : favoriteProjects?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {favoriteProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 mb-6">No favorite properties yet</p>
                <Link to="/">
                  <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
                    Browse Properties
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shortlist">
            {isLoading || loadingShortProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-zinc-900 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : shortlistedProjects?.length ? (
              <>
                {/* Shortlist description */}
                <div className="mb-6">
                  <p className="text-zinc-400 text-sm">
                    Add badges to rank your top properties. You can assign <span className="text-yellow-400">Top 1</span>, <span className="text-gray-300">Top 2</span>, and <span className="text-amber-500">Top 3</span> to your favorites.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {shortlistedProjects.map((project) => {
                    const badge = getProjectBadge(project.id);
                    return (
                      <div key={project.id} className="relative">
                        {/* Badge indicator */}
                        {badge && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className={`${badgeLabels[badge].color} text-white font-semibold px-3 py-1 flex items-center gap-1`}>
                              <Award className="w-3 h-3" />
                              {badgeLabels[badge].label}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSetBadge(project.id, null);
                                }}
                                className="ml-1 hover:opacity-70"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          </div>
                        )}
                        
                        <ProjectCard project={project} />
                        
                        {/* Badge assignment dropdown */}
                        <div className="mt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                              >
                                <Award className="w-4 h-4 mr-2" />
                                {badge ? `Change Badge` : `Add Badge`}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem
                                onClick={() => handleSetBadge(project.id, 'top1')}
                                className="text-yellow-400 hover:bg-zinc-800 cursor-pointer"
                              >
                                <Award className="w-4 h-4 mr-2" />
                                Top 1 (Gold)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSetBadge(project.id, 'top2')}
                                className="text-gray-300 hover:bg-zinc-800 cursor-pointer"
                              >
                                <Award className="w-4 h-4 mr-2" />
                                Top 2 (Silver)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSetBadge(project.id, 'top3')}
                                className="text-amber-500 hover:bg-zinc-800 cursor-pointer"
                              >
                                <Award className="w-4 h-4 mr-2" />
                                Top 3 (Bronze)
                              </DropdownMenuItem>
                              {badge && (
                                <DropdownMenuItem
                                  onClick={() => handleSetBadge(project.id, null)}
                                  className="text-zinc-400 hover:bg-zinc-800 cursor-pointer"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Remove Badge
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {shortlistedProjects.length >= 2 && (
                  <div className="text-center space-y-4">
                    <Link to="/compare">
                      <Button className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90 px-8">
                        Compare with AI
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <p className="text-zinc-500 text-sm">or</p>
                    <a
                      href="https://jjglobalcapital.com/form/property-investment-inquiry-form/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        Request Professional Evaluation
                      </Button>
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <ListPlus className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">No properties in your shortlist</p>
                <p className="text-zinc-500 text-sm mb-6">
                  Add properties to compare them side by side and get AI-powered insights
                </p>
                <Link to="/">
                  <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
                    Browse Properties
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default Favorites;
