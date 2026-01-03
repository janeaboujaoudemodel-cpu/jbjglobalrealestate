import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, Scale, Sparkles } from "lucide-react";
import { useShortlist, useToggleShortlist } from "@/hooks/useFavorites";
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

const ComparisonBar = () => {
  const { data: shortlist } = useShortlist();
  const toggleShortlist = useToggleShortlist();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch project details for shortlisted items
  const { data: shortlistedProjects } = useQuery({
    queryKey: ["shortlisted-projects", shortlist?.map((s) => s.project_id)],
    queryFn: async () => {
      if (!shortlist?.length) return [];
      const projectIds = shortlist.map((s) => s.project_id);
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(name, slug),
          images:project_images(image_url, alt_text, display_order)
        `)
        .in("id", projectIds);

      if (error) throw error;
      return data;
    },
    enabled: !!shortlist?.length,
  });

  if (!shortlist?.length) return null;

  const handleRemove = (projectId: string) => {
    toggleShortlist.mutate({ 
      projectId, 
      isShortlisted: true, 
      currentCount: shortlist.length 
    });
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
            className="h-[85vh] bg-zinc-950 border-t border-zinc-800 rounded-t-3xl"
          >
            <SheetHeader className="pb-4 border-b border-zinc-800">
              <SheetTitle className="text-white text-2xl flex items-center gap-3">
                <Scale className="w-6 h-6 text-zinc-400" />
                Property Comparison
                <span className="text-sm font-normal text-zinc-500">
                  ({shortlist.length}/3 selected)
                </span>
              </SheetTitle>
            </SheetHeader>

            <div className="py-6 overflow-y-auto h-[calc(100%-180px)]">
              {shortlistedProjects && shortlistedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {shortlistedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800"
                    >
                      <button
                        onClick={() => handleRemove(project.id)}
                        className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black transition-colors"
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
                              AED {((project.price_from || 0) / 1000000).toFixed(1)}M
                            </p>
                          </div>
                          <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-zinc-500 text-xs">Bedrooms</p>
                            <p className="text-white font-medium">
                              {project.bedrooms_min} - {project.bedrooms_max} BR
                            </p>
                          </div>
                          <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-zinc-500 text-xs">Location</p>
                            <p className="text-white font-medium line-clamp-1">
                              {project.location || project.emirate}
                            </p>
                          </div>
                          <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-zinc-500 text-xs">Status</p>
                            <p className="text-white font-medium">
                              {project.handover_date || "Ready"}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/project/${project.slug}`}
                          className="block text-center py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {/* Empty slots */}
                  {Array.from({ length: 3 - (shortlistedProjects?.length || 0) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center min-h-[300px]"
                    >
                      <p className="text-zinc-600 text-center px-4">
                        Add {i === 0 && shortlistedProjects?.length === 0 ? "" : "another "}property to compare
                      </p>
                    </div>
                  ))}
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
                <Link to="/compare" className="flex-1">
                  <Button 
                    className="w-full bg-white text-zinc-900 hover:bg-zinc-100 h-12 text-base font-semibold"
                    disabled={shortlist.length < 2}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Comparison & Request Evaluation
                  </Button>
                </Link>
              </div>
              {shortlist.length < 2 && (
                <p className="text-zinc-500 text-sm text-center mt-3">
                  Add at least 2 properties to compare
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
