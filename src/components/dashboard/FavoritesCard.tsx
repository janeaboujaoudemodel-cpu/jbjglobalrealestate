import { Link } from "react-router-dom";
import { Heart, ChevronRight, Building2, ArrowRight, PenTool } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/useFavorites";
import { useDesignFavorites } from "@/hooks/useDesignFavorites";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const FavoritesCard = () => {
  const { data: favorites, isLoading: favoritesLoading } = useFavorites();

  // Fetch project details for favorites
  const { data: favoriteProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['favorite-projects-preview', favorites?.map(f => f.project_id)],
    queryFn: async () => {
      if (!favorites || favorites.length === 0) return [];
      const projectIds = favorites.slice(0, 3).map(f => f.project_id);
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, location, slug')
        .in('id', projectIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!favorites && favorites.length > 0,
  });

  const isLoading = favoritesLoading || projectsLoading;
  const count = favorites?.length || 0;
  const { data: designFavs } = useDesignFavorites();
  const designCount = designFavs?.length || 0;

  return (
    <Card className="border border-gold/40 bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Heart className="w-4 h-4 text-gold" />
          </div>
          My Favorites
        </CardTitle>
        <Badge variant="outline" className="border-gold/40 text-gold bg-gold/10">
          {count + designCount} saved
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="text-center py-6">
            <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No favorites yet</p>
            <Button variant="link" className="text-gold mt-2" asChild>
              <Link to="/properties">Browse Properties</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {favoriteProjects?.map(project => (
                <Link 
                  key={project.id}
                  to={`/project/${project.slug || project.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gold/20 hover:border-gold/40 hover:bg-gold/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-gold transition-colors">
                      {project.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{project.location}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                </Link>
              ))}
            </div>
            {count > 3 && (
              <Button variant="link" className="w-full text-gold mt-2" asChild>
                <Link to="/favorites">
                  View All {count} Favorites
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </>
        )}

        {/* Always-visible portal CTA */}
        <div className="mt-4 pt-4 border-t border-gold/20">
          <Link
            to="/favorites"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C8A766]/15 to-[#C8A766]/5 border border-[#C8A766]/30 hover:border-[#C8A766]/60 hover:from-[#C8A766]/25 hover:to-[#C8A766]/10 transition-all duration-300 group"
          >
            <Heart className="w-4 h-4 text-[#C8A766]" />
            <span className="text-sm font-semibold text-[#C8A766]">Visit Favorites Portal</span>
            <ArrowRight className="w-4 h-4 text-[#C8A766] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoritesCard;
