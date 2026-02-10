import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Landmark, ExternalLink, Loader2, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface MarketNews {
  id: string;
  title: string;
  excerpt: string;
  content: string | null;
  category: string;
  source: string;
  source_url: string | null;
  image_url: string | null;
  published_date: string;
  ai_generated: boolean;
  is_featured: boolean;
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['market-news', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_news')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as MarketNews;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-20 text-center">
          <Newspaper className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Article Not Found</h1>
          <p className="text-zinc-400 mb-6">This article may have been removed or doesn't exist.</p>
          <Link to="/news">
            <Button variant="primary">Back to News</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(article.published_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Split content into paragraphs
  const paragraphs = (article.content || article.excerpt)
    .split(/\n\n|\n/)
    .filter((p: string) => p.trim().length > 0);

  return (
    <>
      <SEOHead
        title={`${article.title} | JBJ Global Real Estate News`}
        description={article.excerpt}
      />
      <article className="min-h-screen bg-black">
        {/* Hero Image */}
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
          <img
            src={article.image_url || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Back button */}
          <div className="absolute top-6 left-6 z-10">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 text-white/80 hover:text-gold transition-colors bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to News
            </Link>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge className="bg-gold text-black px-3 py-1 text-xs font-medium">
                  {article.category}
                </Badge>
                <Badge variant="outline" className="text-gold border-gold/30 px-3 py-1 text-xs">
                  <Landmark className="w-3 h-3 mr-1" />
                  {article.source}
                </Badge>
              </div>
              <h1
                className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {article.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">
          {/* Meta row */}
          <div className="flex items-center gap-4 text-sm text-zinc-400 mb-8 pb-6 border-b border-gold/20 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formattedDate}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-gold" />
              {article.source}
            </span>
          </div>

          {/* Excerpt highlight */}
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed mb-8 border-l-4 border-gold/50 pl-6 italic">
            {article.excerpt}
          </p>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            {paragraphs.map((paragraph: string, idx: number) => (
              <p key={idx} className="text-zinc-300 leading-relaxed mb-6">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Source Attribution */}
          <div className="mt-12 pt-8 border-t border-gold/20">
            <div className="jj-card-inner rounded-xl p-6 bg-gradient-to-br from-card via-card to-gold/5 border border-gold/30">
              <p className="text-sm text-zinc-400 mb-2">Source</p>
              <p className="text-gold font-medium text-lg">{article.source}</p>
              {article.source_url && (
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-gold mt-3 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Original Source
                </a>
              )}
            </div>
          </div>

          {/* Back to News */}
          <div className="mt-10 text-center">
            <Link to="/news">
              <Button variant="primary" className="px-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All News
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </>
  );
};

export default NewsDetail;
