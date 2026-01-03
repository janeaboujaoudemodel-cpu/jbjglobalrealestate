import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";
import { ChevronLeft, Heart, ListPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectCard from "@/components/ProjectCard";

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: favorites, isLoading: loadingFavorites } = useFavorites();
  const { data: shortlist, isLoading: loadingShortlist } = useShortlist();

  // Fetch favorite projects
  const { data: favoriteProjects } = useQuery({
    queryKey: ["favorite-projects", favorites?.map((f) => f.project_id)],
    queryFn: async () => {
      if (!favorites?.length) return [];
      const projectIds = favorites.map((f) => f.project_id);
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          community:communities(id, name, slug),
          documents:project_documents(id, file_url, file_name, document_type)
        `)
        .in("id", projectIds);

      if (error) throw error;
      return data;
    },
    enabled: !!favorites?.length,
  });

  // Fetch shortlisted projects
  const { data: shortlistedProjects } = useQuery({
    queryKey: ["shortlisted-projects-full", shortlist?.map((s) => s.project_id)],
    queryFn: async () => {
      if (!shortlist?.length) return [];
      const projectIds = shortlist.map((s) => s.project_id);
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          community:communities(id, name, slug),
          documents:project_documents(id, file_url, file_name, document_type)
        `)
        .in("id", projectIds);

      if (error) throw error;
      return data;
    },
    enabled: !!shortlist?.length,
  });

  if (!user) {
    return (
      <section className="min-h-screen bg-zinc-950 py-16">
        <div className="container mx-auto px-4 text-center">
          <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
          <h1 className="text-white text-3xl font-bold mb-4">Sign in to View Favorites</h1>
          <p className="text-zinc-400 mb-8">
            Create an account to save and compare your favorite properties
          </p>
          <Link to="/auth">
            <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
              Sign In
            </Button>
          </Link>
        </div>
      </section>
    );
  }

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

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-8">
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 text-zinc-400"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({favorites?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="shortlist"
              className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 text-zinc-400"
            >
              <ListPlus className="w-4 h-4 mr-2" />
              Comparison ({shortlist?.length || 0}/3)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {loadingFavorites ? (
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
            {loadingShortlist ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-zinc-900 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : shortlistedProjects?.length ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {shortlistedProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                  {/* Empty slots */}
                  {Array.from({ length: 3 - shortlistedProjects.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center min-h-[280px]"
                    >
                      <p className="text-zinc-600 text-center px-4">
                        Add a property to compare
                      </p>
                    </div>
                  ))}
                </div>
                {shortlistedProjects.length >= 2 && (
                  <div className="text-center">
                    <Link to="/compare">
                      <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
                        Compare Properties
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <ListPlus className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">No properties in comparison</p>
                <p className="text-zinc-500 text-sm mb-6">
                  Add up to 3 properties to compare them side by side
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
