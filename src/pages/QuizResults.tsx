import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, Heart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/ProjectCard";
import FavoriteButton from "@/components/FavoriteButton";

const QuizResults = () => {
  const [searchParams] = useSearchParams();
  const projectSlugs = searchParams.get("projects")?.split(",") || [];

  const { data: projects, isLoading } = useQuery({
    queryKey: ["quiz-results", projectSlugs],
    queryFn: async () => {
      if (!projectSlugs.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          community:communities(id, name, slug),
          documents:project_documents(id, file_url, file_name, document_type)
        `)
        .in("slug", projectSlugs);

      if (error) throw error;
      
      // Sort by original order
      return data.sort((a, b) => {
        return projectSlugs.indexOf(a.slug) - projectSlugs.indexOf(b.slug);
      });
    },
    enabled: projectSlugs.length > 0,
  });

  if (isLoading) {
    return (
      <section className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-violet-500 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">Finding your perfect matches...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-950 py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-violet-300 text-sm font-medium">AI-Powered Recommendations</span>
          </div>
          
          <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">
            Your Perfect Matches
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Based on your preferences, we've found these properties that best match your criteria
          </p>
        </div>

        {/* Top Recommendation */}
        {projects && projects.length > 0 && (
          <div className="mb-12">
            <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl overflow-hidden border border-zinc-800">
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                  #1 Best Match
                </div>
              </div>
              <div className="absolute top-4 right-4 z-10">
                <FavoriteButton projectId={projects[0].id} size="lg" />
              </div>
              
              <div className="grid md:grid-cols-2">
                <div className="aspect-[4/3] md:aspect-auto">
                  <img
                    src={projects[0].images?.[0]?.image_url || "/placeholder.svg"}
                    alt={projects[0].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <p className="text-zinc-500 text-sm mb-2">{projects[0].developer?.name}</p>
                  <h2 className="text-white text-3xl font-bold mb-3">{projects[0].name}</h2>
                  <p className="text-zinc-400 mb-6">{projects[0].location}, {projects[0].emirate}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                      <p className="text-zinc-500 text-sm">Price From</p>
                      <p className="text-white text-xl font-semibold">
                        AED {((projects[0].price_from || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                      <p className="text-zinc-500 text-sm">Bedrooms</p>
                      <p className="text-white text-xl font-semibold">
                        {projects[0].bedrooms_min} - {projects[0].bedrooms_max} BR
                      </p>
                    </div>
                  </div>
                  
                  <Link to={`/project/${projects[0].slug}`}>
                    <Button className="bg-white text-zinc-900 hover:bg-zinc-100 w-full md:w-auto">
                      View Property
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Recommendations */}
        {projects && projects.length > 1 && (
          <div>
            <h3 className="text-white text-xl font-semibold mb-6">More Great Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {projects.slice(1).map((project, index) => (
                <div key={project.id} className="relative group">
                  <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                    <span className="text-white text-sm font-bold">#{index + 2}</span>
                  </div>
                  <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FavoriteButton projectId={project.id} size="sm" showShortlist={false} />
                  </div>
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-16 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/quiz">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
            </Link>
            <Link to="/">
              <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
                Browse All Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuizResults;
