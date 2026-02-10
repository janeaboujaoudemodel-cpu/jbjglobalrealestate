import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Landmark, ExternalLink, Loader2, Newspaper, Sparkles, TrendingUp, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { renderMarkdownToHtml } from "@/lib/markdownUtils";
import { formatDisplayDate } from "@/utils/formatDate";

const CATEGORY_IMAGES: Record<string, string> = {
  "Policy": "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1920&q=90",
  "Economic": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=90",
  "Market Update": "https://images.unsplash.com/photo-1622015663319-e97e697503ee?w=1920&q=90",
  "Government": "https://images.unsplash.com/photo-1597659840241-37e2b9c2f55f?w=1920&q=90",
  "Analysis": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=90",
  "Developer News": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1920&q=90",
  "Monthly Report": "https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=1920&q=90",
  "Market Outlook": "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1920&q=90",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=90";

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
  ai_analysis: string | null;
}

/** Upgrade image URL to high quality */
function toHighQuality(url: string): string {
  let upgraded = url;
  if (/w=\d+/.test(upgraded)) {
    upgraded = upgraded.replace(/w=\d+/, "w=1920");
  }
  if (/q=\d+/.test(upgraded)) {
    upgraded = upgraded.replace(/q=\d+/, "q=90");
  }
  return upgraded;
}

/** Parse AI analysis into individual bullet points */
function parseAnalysisPoints(html: string): string[] {
  // Try to extract list items from the HTML
  const liMatches = html.match(/<li>(.*?)<\/li>/gs);
  if (liMatches && liMatches.length > 0) {
    return liMatches.map(li => li.replace(/<\/?[^>]+(>|$)/g, "").trim()).filter(Boolean);
  }
  // Try bullet points from markdown (lines starting with - or * or numbers)
  const lines = html.replace(/<\/?[^>]+(>|$)/g, "\n").split("\n").map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => /^[-*•]\s|^\d+[.)]\s/.test(l)).map(l => l.replace(/^[-*•]\s+|^\d+[.)]\s+/, "").trim());
  if (bullets.length > 0) return bullets;
  // Fallback: split into sentences
  return lines.filter(l => l.length > 20).slice(0, 4);
}

/** Insert gold separators between content paragraphs for breathing room */
function addContentBreathing(html: string): string {
  // Split by </p> and insert separator every 2-3 paragraphs
  const parts = html.split("</p>");
  if (parts.length <= 3) return html;
  
  const separator = `</p><div class="my-8 flex items-center justify-center gap-4"><div class="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold))]/20 to-transparent"></div><div class="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))]/30"></div><div class="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold))]/20 to-transparent"></div></div>`;
  
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    result.push(parts[i]);
    if (i < parts.length - 1) {
      result.push("</p>");
      // Insert separator every 3 paragraphs (after 2nd, 5th, 8th, etc.)
      if ((i + 1) % 3 === 0) {
        result.push(separator);
      }
    }
  }
  return result.join("");
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

  const rawHeroImage = article.image_url || CATEGORY_IMAGES[article.category] || DEFAULT_IMAGE;
  const heroImage = toHighQuality(rawHeroImage);
  const formattedDate = formatDisplayDate(article.published_date);

  // Render content as HTML with breathing room
  const rawContentHtml = renderMarkdownToHtml(article.content || article.excerpt);
  const contentHtml = addContentBreathing(rawContentHtml);
  
  // Parse analysis into bullet points
  const analysisPoints = article.ai_analysis 
    ? parseAnalysisPoints(article.ai_analysis)
    : [];

  return (
    <>
      <SEOHead
        title={`${article.title} | JBJ Global Real Estate News`}
        description={article.excerpt}
      />
      <article className="min-h-screen bg-black">
        {/* Full-Screen Hero Image - High Quality */}
        <div className="relative h-[80vh] md:h-[90vh] overflow-hidden">
          <img
            src={heroImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          {/* Premium glass back button */}
          <div className="absolute top-6 left-6 z-10">
            <Link
              to="/news"
              className="inline-flex items-center gap-2.5 text-white/90 hover:text-gold transition-all duration-300 bg-black/30 backdrop-blur-xl px-6 py-3 rounded-full border border-white/15 hover:border-gold/40 hover:bg-black/50 font-medium text-sm shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              All News
            </Link>
          </div>

          {/* Title + badges overlaid on hero bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge className="bg-gold text-black px-3 py-1 text-xs font-medium">
                  {article.category}
                </Badge>
                <Badge variant="outline" className="text-white/80 border-white/30 px-3 py-1 text-xs backdrop-blur-sm">
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

        {/* Spacing gap between hero and content */}
        <div className="h-8 md:h-12 bg-black" />

        {/* Article Body - Champagne 3-layer system */}
        <div className="jj-layer-2 !bg-transparent relative z-10">
          <div className="jj-layer-active rounded-2xl p-6 md:p-10 lg:p-14 max-w-4xl mx-auto">
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

            {/* Full content - rendered as HTML with breathing separators */}
            <div
              className="prose prose-lg max-w-none text-zinc-800 leading-relaxed
                prose-headings:text-black prose-headings:font-bold
                prose-p:text-zinc-700 prose-p:leading-relaxed prose-p:mb-5
                prose-strong:text-black
                prose-a:text-gold prose-a:no-underline hover:prose-a:underline
                prose-li:text-zinc-700
                prose-img:rounded-xl prose-img:my-8 prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* AI Analysis Section - Green Theme */}
            {analysisPoints.length > 0 && (
              <div className="mt-12 pt-8 border-t border-emerald-200">
                {/* CTA Banner */}
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/80 rounded-xl p-4 mb-6 border border-emerald-200 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-emerald-800 font-medium text-sm">
                    Learn more how this affects Dubai real estate market with our AI News Analyzer
                  </p>
                </div>

                {/* Green analysis card */}
                <div className="bg-emerald-50 rounded-xl p-6 md:p-8 border border-emerald-200">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                        How This Affects Dubai Real Estate
                      </h3>
                      <p className="text-xs text-emerald-600">AI-powered market impact analysis</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analysisPoints.map((point, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-emerald-800 text-sm leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-emerald-500 mt-5 italic">
                    AI-generated analysis for informational purposes only. Not financial advice.
                  </p>
                </div>
              </div>
            )}

            {/* Source Attribution - Prominent button style */}
            <div className="mt-12 pt-8 border-t border-gold/20">
              <div className="jj-card-inner rounded-xl p-6">
                <p className="text-sm text-zinc-500 mb-2">Source</p>
                <p className="text-black font-medium text-lg">{article.source}</p>
                {article.source_url && (
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gold/10 hover:bg-gold/20 text-gold font-medium text-sm rounded-full border border-gold/30 transition-all duration-300 hover:border-gold/50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Original Source
                  </a>
                )}
              </div>
            </div>

            {/* Back to News - Clean centered */}
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
