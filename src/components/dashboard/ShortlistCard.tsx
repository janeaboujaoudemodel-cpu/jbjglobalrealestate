import { Link } from "react-router-dom";
import { ClipboardList, ChevronRight, Building2, ArrowRight, PenTool } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShortlist } from "@/hooks/useFavorites";
import { useDesignShortlist } from "@/hooks/useDesignFavorites";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const ShortlistCard = () => {
  const { data: shortlist, isLoading: shortlistLoading } = useShortlist();

  // Fetch project details for shortlist
  const { data: shortlistProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['shortlist-projects-preview', shortlist?.map(s => s.project_id)],
    queryFn: async () => {
      if (!shortlist || shortlist.length === 0) return [];
      const projectIds = shortlist.slice(0, 3).map(s => s.project_id);
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, location, slug')
        .in('id', projectIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!shortlist && shortlist.length > 0,
  });

  const isLoading = shortlistLoading || projectsLoading;
  const count = shortlist?.length || 0;

  return (
    <Card className="border border-gold/40 bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-gold" />
          </div>
          My Shortlists
        </CardTitle>
        <Badge variant="outline" className="border-gold/40 text-gold bg-gold/10">
          {count} items
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
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No shortlists yet</p>
            <Button variant="link" className="text-gold mt-2" asChild>
              <Link to="/properties">Start Building Your List</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {shortlistProjects?.map(project => (
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
                <Link to="/favorites?tab=shortlist">
                  View All {count} Shortlisted
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </>
        )}

        {/* Always-visible portal CTA */}
        <div className="mt-4 pt-4 border-t border-gold/20">
          <Link
            to="/compare"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C8A766]/15 to-[#C8A766]/5 border border-[#C8A766]/30 hover:border-[#C8A766]/60 hover:from-[#C8A766]/25 hover:to-[#C8A766]/10 transition-all duration-300 group"
          >
            <ClipboardList className="w-4 h-4 text-[#C8A766]" />
            <span className="text-sm font-semibold text-[#C8A766]">Visit Shortlist Portal</span>
            <ArrowRight className="w-4 h-4 text-[#C8A766] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShortlistCard;
