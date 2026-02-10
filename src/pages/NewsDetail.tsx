import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Landmark, ExternalLink, Loader2, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { renderMarkdownToHtml } from "@/lib/markdownUtils";
import { formatDisplayDate } from "@/utils/formatDate";

const CATEGORY_IMAGES: Record<string, string> = {
  "Policy": "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1920&q=80",
  "Economic": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80",
  "Market Update": "https://images.unsplash.com/photo-1622015663319-e97e697503ee?w=1920&q=80",
  "Government": "https://images.unsplash.com/photo-1597659840241-37e2b9c2f55f?w=1920&q=80",
  "Analysis": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80",
  "Developer News": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1920&q=80",
  "Monthly Report": "https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=1920&q=80",
  "Market Outlook": "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1920&q=80",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80";

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

  const heroImage = article.image_url || CATEGORY_IMAGES[article.category] || DEFAULT_IMAGE;
  const formattedDate = formatDisplayDate(article.published_date);

  // Render content as HTML
  const contentHtml = renderMarkdownToHtml(article.content || article.excerpt);

  return (
    <>
      <SEOHead
        title={`${article.title} | JBJ Global Real Estate News`}
        description={article.excerpt}
      />
      <article className="min-h-screen bg-black">
        {/* Full-bleed Hero Image */}
        <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
          <img
            src={heroImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Back button - glass pill */}
          <div className="absolute top-6 left-6 z-10">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 text-white/90 hover:text-gold transition-colors bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to News
            </Link>
          </div>

          {/* Title + badges overlaid on hero bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge className="bg-gold text-black px-3 py-1 text-xs font-medium">
                  {article.category}
                </Badge>
                <Badge variant="outline" className="text-white/80 border-white/30 px-3 py-1 text-xs">
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

        {/* Article Body - Champagne 3-layer system */}
        <div className="jj-layer-2 !bg-transparent -mt-8 relative z-10">
          <div className="jj-layer-active rounded-t-2xl p-6 md:p-10 lg:p-14 max-w-4xl mx-auto">
            {/* Meta row */}
            <div className="flex items-center gap-4 text-sm text-zinc-600 mb-8 pb-6 border-b border-gold/20 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formattedDate}
              </span>
              <span className="text-zinc-400">•</span>
              <span className="flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-gold" />
                {article.source}
              </span>
            </div>

            {/* Excerpt as highlighted quote */}
            <blockquote className="text-lg md:text-xl text-zinc-700 leading-relaxed mb-8 border-l-4 border-gold/50 pl-6 italic">
              {article.excerpt}
            </blockquote>

            {/* Full content - rendered as HTML */}
            <div
              className="prose prose-lg max-w-none text-zinc-800 leading-relaxed
                prose-headings:text-black prose-headings:font-bold
                prose-p:text-zinc-700 prose-p:leading-relaxed prose-p:mb-5
                prose-strong:text-black
                prose-a:text-gold prose-a:no-underline hover:prose-a:underline
                prose-li:text-zinc-700"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* Source Attribution */}
            <div className="mt-12 pt-8 border-t border-gold/20">
              <div className="jj-card-inner rounded-xl p-6">
                <p className="text-sm text-zinc-500 mb-2">Source</p>
                <p className="text-black font-medium text-lg">{article.source}</p>
                {article.source_url && (
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold/80 mt-3 transition-colors font-medium"
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
        </div>
      </article>
    </>
  );
};

export default NewsDetail;
