import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Landmark, ExternalLink, Newspaper, Sparkles, TrendingUp, CheckCircle, BarChart3, Lightbulb, Building2, Banknote, Gift, MapPin, Globe } from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { renderMarkdownToHtml } from "@/lib/markdownUtils";
import { HtmlT } from "@/i18n/HtmlT";
import { formatDisplayDate } from "@/utils/formatDate";
import { ytd2026 as ytd2026Data, topAreas2026 as topAreas2026Data, topNationalities as topNationalitiesData } from "@/constants/dldMarketData";

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
  key_stats: { label: string; value: string }[] | null;
  key_takeaways: string[] | null;
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
  const liMatches = html.match(/<li>(.*?)<\/li>/gs);
  if (liMatches && liMatches.length > 0) {
    return liMatches.map(li => li.replace(/<\/?[^>]+(>|$)/g, "").trim()).filter(Boolean);
  }
  const lines = html.replace(/<\/?[^>]+(>|$)/g, "\n").split("\n").map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => /^[-*•]\s|^\d+[.)]\s/.test(l)).map(l => l.replace(/^[-*•]\s+|^\d+[.)]\s+/, "").trim());
  if (bullets.length > 0) return bullets;
  return lines.filter(l => l.length > 20).slice(0, 4);
}

/** Extract pull quotes from content — first bold sentence from distinct sections */
function extractPullQuotes(html: string): string[] {
  const strongMatches = html.match(/<strong>(.*?)<\/strong>/g);
  if (!strongMatches) return [];
  const quotes = strongMatches
    .map(s => s.replace(/<\/?strong>/g, "").trim())
    .filter(s => s.length > 30 && s.length < 200)
    .slice(0, 2);
  return quotes;
}

/** Insert gold separators and pull quotes between content paragraphs */
function addContentBreathing(html: string): string {
  const parts = html.split("</p>");
  if (parts.length <= 3) return html;
  
  const separator = `</p><div class="my-8 flex items-center justify-center gap-4"><div class="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold))]/30 to-transparent"></div><div class="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))]/45"></div><div class="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold))]/30 to-transparent"></div></div>`;
  
  // Extract pull quotes for inline insertion
  const pullQuotes = extractPullQuotes(html);
  let pullQuoteIndex = 0;
  
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    result.push(parts[i]);
    if (i < parts.length - 1) {
      result.push("</p>");
      if ((i + 1) % 3 === 0) {
        // Insert pull quote if available, otherwise separator
        if (pullQuoteIndex < pullQuotes.length) {
          result.push(`<blockquote class="my-10 py-6 px-8 border-l-4 border-[hsl(var(--gold))] bg-gradient-to-r from-[hsl(var(--gold))]/5 to-transparent rounded-r-xl"><p class="text-lg md:text-xl font-medium text-[#1A1A1A] italic leading-relaxed">"${pullQuotes[pullQuoteIndex]}"</p></blockquote>`);
          pullQuoteIndex++;
        } else {
          result.push(separator);
        }
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
      // Parse key_stats and key_takeaways
      const raw = data as Record<string, unknown>;
      return {
        ...raw,
        key_stats: Array.isArray(raw.key_stats) ? raw.key_stats : [],
        key_takeaways: Array.isArray(raw.key_takeaways) ? raw.key_takeaways : [],
      } as MarketNews;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <BrandedLoader text="Loading article..." />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <div className="container mx-auto px-4 py-20 text-center">
          <Newspaper className="w-16 h-16 text-[#1A1A1A]/40 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Article Not Found</h1>
          <p className="text-[#1A1A1A]/70 mb-6">This article may have been removed or doesn't exist.</p>
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

  const keyStats = (article.key_stats || []) as { label: string; value: string }[];
  const keyTakeaways = (article.key_takeaways || []) as string[];

  const articleUrl = `https://jbj.ae/news/${article.id}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [heroImage],
    datePublished: article.published_date,
    dateModified: article.published_date,
    author: { "@type": "Organization", name: "JBJ Global Real Estate", url: "https://jbj.ae" },
    publisher: {
      "@type": "Organization",
      name: "JBJ Global Real Estate",
      logo: { "@type": "ImageObject", url: "https://jbj.ae/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    articleSection: article.category,
  };

  return (
    <>
      <SEOHead
        title={`${article.title} | JBJ Global Real Estate News`}
        description={article.excerpt}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="min-h-screen bg-[#FDFBF7]">
        {/* Full-Screen Hero Image */}
        <div className="relative h-[80vh] md:h-[90vh] overflow-hidden">
          <img
            src={heroImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="eager"
           decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          <div className="absolute top-6 left-6 z-10">
            <Link
              to="/news"
              className="inline-flex items-center gap-2.5 text-white/90 hover:text-[#1A1A1A] transition-all duration-300 bg-[#1A1A1A]/30 backdrop-blur-xl px-6 py-3 rounded-full border border-white/15 hover:border-[#B89555]/40 hover:bg-[#1A1A1A]/50 font-medium text-sm shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              All News
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge className="bg-[#EFE6D6] text-[#1A1A1A] px-3 py-1 text-xs font-medium">
                  {article.category}
                </Badge>
                <Badge variant="outline" className="text-white/80 border-white/30 px-3 py-1 text-xs backdrop-blur-sm">
                  <Landmark className="w-3 h-3 mr-1" />
                  {article.source}
                </Badge>
              </div>
              <h1
                className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
              >
                {article.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="h-8 md:h-12 bg-[#FDFBF7]" />

        {/* Article Body */}
        <div className="jj-layer-2 !bg-transparent relative z-10">
          <div className="jj-layer-active rounded-2xl p-6 md:p-10 lg:p-14 max-w-4xl mx-auto">
            {/* Meta row */}
            <div className="flex items-center gap-4 text-sm text-[#1A1A1A]/70 mb-8 pb-6 border-b border-[#B89555]/20 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formattedDate}
              </span>
              <span className="text-[#1A1A1A]/70">•</span>
              <span className="flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-[#1A1A1A]" />
                {article.source}
              </span>
            </div>

            {/* Key Stats Banner */}
            {keyStats.length > 0 && (
              <div className="mb-8 bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] rounded-xl p-5 border border-[#B89555]/30">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Key Statistics</span>
                </div>
                <div className={`grid grid-cols-2 ${keyStats.length >= 3 ? 'md:grid-cols-' + Math.min(keyStats.length, 4) : 'md:grid-cols-2'} gap-4`}>
                  {keyStats.slice(0, 4).map((stat, i) => (
                    <div key={i} className="text-center bg-[#FDFBF7]/50 rounded-lg p-3 border border-[#B89555]/10">
                      <p className="text-xl md:text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
                      <p className="text-xs text-[#1A1A1A]/70 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaways Box */}
            {keyTakeaways.length > 0 && (
              <div className="mb-8 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] rounded-xl p-5 border border-[#B89555]/20">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Key Takeaways</span>
                </div>
                <div className="space-y-2.5">
                  {keyTakeaways.map((point, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-[#1A1A1A]">{i + 1}</span>
                      </div>
                      <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Excerpt as highlighted quote */}
            <blockquote className="text-lg md:text-xl text-[#1A1A1A]/70 leading-relaxed mb-8 border-l-4 border-[#B89555]/50 pl-6 italic">
              {article.excerpt}
            </blockquote>

            {/* Full content with pull quotes and separators */}
            <HtmlT
              html={contentHtml}
              domain="news.article"
              className="prose prose-lg max-w-none text-[#1A1A1A] leading-relaxed prose-headings:text-[#1A1A1A] prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-[#B89555]/20 prose-h2:pb-2 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-[#1A1A1A]/70 prose-p:leading-relaxed prose-p:mb-5 prose-strong:text-[#1A1A1A] prose-a:text-[#1A1A1A] prose-a:no-underline hover:prose-a:underline prose-li:text-[#1A1A1A]/70 prose-img:rounded-xl prose-img:my-8 prose-img:shadow-lg prose-table:border-collapse prose-table:w-full prose-th:bg-champagne-light/50 prose-th:text-left prose-th:p-3 prose-th:text-xs prose-th:font-semibold prose-th:uppercase prose-th:tracking-wider prose-th:text-[#1A1A1A]/70 prose-th:border prose-th:border-[#B89555]/20 prose-td:p-3 prose-td:border prose-td:border-[#B89555]/10 prose-td:text-sm"
            />

            {/* AI Analysis Section - Green Theme */}
            {analysisPoints.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[color:var(--emerald-1)]/30">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/80 rounded-xl p-4 mb-6 border border-[color:var(--emerald-1)]/30 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[color:var(--emerald-1)] flex-shrink-0" />
                  <p className="text-[color:var(--emerald-1)] font-medium text-sm">
                    Learn more how this affects Dubai real estate market with our AI News Analyzer
                  </p>
                </div>

                <div className="jj-emerald-soft rounded-xl p-6 md:p-8 border border-[color:var(--emerald-1)]/30">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg jj-emerald-soft border border-[color:var(--emerald-1)]/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[color:var(--emerald-1)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[color:var(--emerald-1)]">
                        How This Affects Dubai Real Estate
                      </h3>
                      <p className="text-xs text-[color:var(--emerald-1)]">AI-powered market impact analysis</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analysisPoints.map((point, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[color:var(--emerald-1)] text-sm leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-emerald-500 mt-5 italic">
                    AI-generated analysis for informational purposes only. Not financial advice.
                  </p>
                </div>
              </div>
            )}

            {/* Dubai Market Intelligence Section */}
            <div className="mt-12 pt-8 border-t border-[#B89555]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F7F1E6] via-[#EDE0C8] to-[#E2D4B8] border border-[#B89555]/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A]">
                    Dubai Market Intelligence
                  </h3>
                  <p className="text-xs text-[#1A1A1A]/70">Source: Dubai Land Department (DLD) · 2026 YTD</p>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
                  <p className="text-2xl font-bold text-[#1A1A1A]">{ytd2026Data.value}</p>
                  <p className="text-xs text-[#1A1A1A]/70">YTD Value</p>
                </div>
                <div className="text-center bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
                  <p className="text-2xl font-bold text-[#1A1A1A]">{ytd2026Data.transactions.toLocaleString()}+</p>
                  <p className="text-xs text-[#1A1A1A]/70">Transactions</p>
                </div>
                <div className="text-center bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
                  <p className="text-2xl font-bold text-[#1A1A1A]">{ytd2026Data.growth}</p>
                  <p className="text-xs text-[#1A1A1A]/70">YoY Growth</p>
                </div>
                <div className="text-center bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
                  <p className="text-2xl font-bold text-[#1A1A1A]">{ytd2026Data.topArea}</p>
                  <p className="text-xs text-[#1A1A1A]/70">Top Area</p>
                </div>
              </div>

              {/* Transaction Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-[#1A1A1A]" />
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Transaction Type</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#1A1A1A]/70">Off-plan</span>
                      <span className="text-sm font-bold text-[#1A1A1A]">~{ytd2026Data.offPlan.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[#EFE6D6] rounded-full h-2">
                      <div className="bg-[#EFE6D6] rounded-full h-2" style={{ width: `${(ytd2026Data.offPlan / (ytd2026Data.offPlan + ytd2026Data.secondary) * 100).toFixed(0)}%` }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#1A1A1A]/70">Secondary</span>
                      <span className="text-sm font-bold text-[#1A1A1A]">~{ytd2026Data.secondary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="w-4 h-4 text-[#1A1A1A]" />
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Payment Method</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#1A1A1A]/70">Cash</span>
                      <span className="text-sm font-bold text-[#1A1A1A]">~{ytd2026Data.cash.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[#EFE6D6] rounded-full h-2">
                      <div className="jj-surface-emerald rounded-full h-2" style={{ width: `${(ytd2026Data.cash / (ytd2026Data.cash + ytd2026Data.mortgage) * 100).toFixed(0)}%` }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#1A1A1A]/70">Mortgage</span>
                      <span className="text-sm font-bold text-[#1A1A1A]">~{ytd2026Data.mortgage.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-[#1A1A1A]" />
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Gift Transactions</span>
                  </div>
                  <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
                    <p className="text-3xl font-bold text-[#1A1A1A]">~{ytd2026Data.gifts.toLocaleString()}</p>
                    <p className="text-xs text-[#1A1A1A]/70 mt-1">Gift Transfers YTD</p>
                  </div>
                </div>
              </div>

              {/* Top Areas */}
              <div className="bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Top 10 Areas by Transaction Volume</span>
                </div>
                <div className="space-y-2">
                  {topAreas2026Data.slice(0, 10).map((area, i) => (
                    <div key={area.area} className="flex items-center gap-3">
                      <span className="text-[#1A1A1A]/70 font-medium text-sm w-4 text-right">{i + 1}</span>
                      <span className="text-sm font-medium text-[#1A1A1A] flex-1">{area.area}</span>
                      <span className="text-sm font-bold text-[#1A1A1A]">{area.transactions.toLocaleString()}</span>
                      <span className="text-xs text-[color:var(--emerald-1)] font-medium jj-emerald-soft px-2 py-0.5 rounded-full">{area.change}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Nationalities */}
              <div className="bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Top Buyer Nationalities</span>
                </div>
                <div className="space-y-2">
                  {topNationalitiesData.slice(0, 10).map((nat, i) => (
                    <div key={nat.country} className="flex items-center gap-3">
                      <span className="text-lg">{nat.flag}</span>
                      <span className="text-sm font-medium text-[#1A1A1A] flex-1">{nat.country}</span>
                      <div className="w-20">
                        <div className="w-full bg-[#EFE6D6] rounded-full h-1.5">
                          <div className="bg-[#EFE6D6] rounded-full h-1.5" style={{ width: `${nat.percentage * 4}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#1A1A1A] w-10 text-right">{nat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Source Attribution */}
            <div className="mt-12 pt-8 border-t border-[#B89555]/20">
              <div className="jj-card-inner rounded-xl p-6">
                <p className="text-sm text-[#1A1A1A]/70 mb-2">Source</p>
                <p className="text-[#1A1A1A] font-medium text-lg">{article.source}</p>
                {article.source_url && (
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#EFE6D6]/10 hover:bg-[#EFE6D6]/20 text-[#1A1A1A] font-medium text-sm rounded-full border border-[#B89555]/30 transition-all duration-300 hover:border-[#B89555]/50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Original Source
                  </a>
                )}
              </div>
            </div>

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
