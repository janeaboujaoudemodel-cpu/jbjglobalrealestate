import { useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, ChevronRight, ArrowLeft, Calendar, ExternalLink, TrendingUp, Loader2, RefreshCw, Bot, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Fallback static news for when DB is empty
const staticNewsArticles = [
  {
    id: "1",
    title: "Dubai Real Estate Market Hits Strongest Growth on Record in H1 2025",
    excerpt: "The Dubai real estate market enjoyed a historic first half of 2025, with approximately 99,000 sales transactions totalling AED 328.8 billion—a 23.7% rise in volume and 41% rise in value from H1 2024.",
    category: "Market Update",
    date: "2025-07-01",
    source: "Christie's Real Estate Dubai",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
  },
  {
    id: "2", 
    title: "January 2025: Dubai Property Sales Reach AED 44.4 Billion",
    excerpt: "The market witnessed a 23.2% YoY increase in recorded sales transactions, reaching 14,238 compared to 11,554 in January 2024. Transaction values surged to AED 44.4 billion, marking a 24.1% YoY increase.",
    category: "Analysis",
    date: "2025-02-25",
    source: "Property Finder",
    image: "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800",
  },
  {
    id: "3",
    title: "Will Dubai Real Estate Prices Decline in 2026?",
    excerpt: "Market analysts examine the sustainability of Dubai's property boom as prices reach new highs. Expert predictions for the 2026 market outlook and investment opportunities.",
    category: "Market Outlook",
    date: "2025-12-19",
    source: "Engel & Völkers",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
  },
  {
    id: "4",
    title: "Dubai Real Estate November 2025: Market Report",
    excerpt: "Off-plan sales continue to dominate the market with strong demand from international investors. Premium communities see sustained price appreciation across all property types.",
    category: "Monthly Report",
    date: "2025-12-01",
    source: "NOVVI Properties",
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800",
  },
  {
    id: "5",
    title: "UAE Residential Market Monthly - January 2025",
    excerpt: "Comprehensive analysis of the UAE residential market performance with key metrics on rentals, sales, and price movements across Dubai and Abu Dhabi.",
    category: "Economic",
    date: "2025-02-18",
    source: "Emirates NBD Research",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
  },
  {
    id: "6",
    title: "Property Monitor: First Price Decline in Over Two Years",
    excerpt: "Property prices fell 0.57% MoM, dropping to AED 1,484 per sq ft—the first decline since Summer 2022. Sales transaction volume down 4.6% MoM, yet still the strongest January on record.",
    category: "Market Update",
    date: "2025-02-01",
    source: "Property Monitor",
    image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800",
  },
  {
    id: "7",
    title: "Golden Visa Program Continues to Drive Property Investment",
    excerpt: "UAE's Golden Visa program remains a key driver for international property investment, with new reforms making it easier for investors to qualify through real estate purchases.",
    category: "Policy",
    date: "2025-11-15",
    source: "UAE Government",
    image: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800",
  },
  {
    id: "8",
    title: "Top 10 Dubai Communities for Investment in 2025",
    excerpt: "Dubai Hills Estate, Palm Jumeirah, and Dubai Marina lead the list of most sought-after communities. Off-plan projects in emerging areas show strong capital appreciation potential.",
    category: "Analysis",
    date: "2025-09-20",
    source: "JBJ Global Real Estate Research",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
  },
  {
    id: "9",
    title: "UAE Economic Outlook: Record GDP Growth Forecast for 2026",
    excerpt: "The UAE economy is projected to maintain strong growth momentum with diversification efforts across tourism, technology, and real estate sectors driving expansion.",
    category: "Economic",
    date: "2025-12-10",
    source: "UAE Ministry of Economy",
    image: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=800",
  },
];

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

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch news from database
  const { data: dbNews, isLoading, refetch } = useQuery({
    queryKey: ['market-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_news')
        .select('*')
        .order('published_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as MarketNews[];
    },
  });

  // Transform DB news to display format, fallback to static if empty
  const newsArticles = dbNews && dbNews.length > 0 
    ? dbNews.map(n => ({
        id: n.id,
        title: n.title,
        excerpt: n.excerpt,
        category: n.category,
        date: n.published_date,
        source: n.source,
        image: n.image_url || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
        isAI: n.ai_generated,
        sourceUrl: n.source_url,
      }))
    : staticNewsArticles;

  const categories = ["All", "Market Update", "Analysis", "Policy", "Economic", "Monthly Report", "Market Outlook", "Developer News", "Government"];

  const filteredNews = selectedCategory && selectedCategory !== "All"
    ? newsArticles.filter(n => n.category === selectedCategory)
    : newsArticles;

  const handleRefreshNews = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('ai-news-collector', {
        body: { action: 'collect' }
      });
      
      if (error) {
        if (error.message?.includes('429')) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        throw error;
      }
      
      await refetch();
      toast.success("News updated successfully!");
    } catch (err) {
      console.error("Failed to refresh news:", err);
      toast.error("Failed to refresh news. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <SEOHead {...pagesSEO.news} />
      <section className="min-h-screen bg-black">
      {/* Hero Section - 3-Layer System */}
      <div className="relative py-16 md:py-24 bg-black">
        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Properties
          </Link>
          
          {/* Active Champagne Layer */}
          <div className="jj-layer-active p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-black/10 flex items-center justify-center shadow-sm">
                  <Newspaper className="w-7 h-7 text-black" />
                </div>
                <div>
                  <h1 
                    className="text-3xl md:text-4xl font-bold text-black"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    News & <span className="text-gold">Insights</span>
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="jj-card-inner rounded-full px-4 py-2 inline-flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-black" />
                      <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] text-black">
                        Government Sources
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Refresh Button - Primary Style */}
              <Button
                onClick={handleRefreshNews}
                disabled={isRefreshing}
                variant="primary"
                className="rounded-xl px-6 py-3 h-auto"
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isRefreshing ? "Updating…" : "Refresh News"}
              </Button>
            </div>
            <p className="text-zinc-700 text-base max-w-2xl">
              Stay informed about the latest UAE real estate market updates, economic developments, and investment opportunities. 
              <span className="text-gold font-medium"> Curated from official government sources daily.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter - Active Champagne */}
      <div className="border-b border-gold/20 sticky top-16 bg-black z-20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="jj-layer-active rounded-xl my-2 p-2">
            <div className="flex gap-2 py-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category === "All" ? null : category)}
                  className={`px-5 py-2.5 text-sm whitespace-nowrap transition-all duration-300 rounded-full font-medium ${
                    (category === "All" && !selectedCategory) || selectedCategory === category
                      ? "bg-black text-gold shadow-lg"
                      : "jj-card-inner text-black hover:border-gold/60"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      )}

      {/* News Grid */}
      {!isLoading && (
        <div className="container mx-auto px-4 py-12 md:py-16">
          {/* Featured Article */}
          {filteredNews.length > 0 && (
            <div className="mb-12">
              <div className="jj-layer-active p-3 md:p-4">
                <article className="group relative jj-card-inner rounded-2xl overflow-hidden transition-all duration-500">
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="aspect-video md:aspect-auto md:h-full relative overflow-hidden">
                      <img 
                        src={filteredNews[0].image} 
                        alt={filteredNews[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/15" />
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <span className="text-xs text-black bg-gold px-3 py-1 rounded-full font-medium">
                          Featured
                        </span>
                        <span className="text-xs text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                          {filteredNews[0].category}
                        </span>
                        {'isAI' in filteredNews[0] && filteredNews[0].isAI && (
                          <span className="text-xs text-purple-700 bg-purple-500/10 px-3 py-1 rounded-full flex items-center gap-1 border border-purple-500/20">
                            <Bot className="w-3 h-3" />
                            AI Curated
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl md:text-3xl font-bold text-black mb-4 group-hover:text-gold transition-colors line-clamp-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                        {filteredNews[0].title}
                      </h2>

                      <p className="text-zinc-700 mb-6 line-clamp-3">
                        {filteredNews[0].excerpt}
                      </p>

                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 text-sm text-zinc-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(filteredNews[0].date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <ExternalLink className="w-4 h-4" />
                            {filteredNews[0].source}
                          </span>
                        </div>
                        {'sourceUrl' in filteredNews[0] && filteredNews[0].sourceUrl ? (
                          <a 
                            href={filteredNews[0].sourceUrl as string} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-gold font-semibold hover:underline"
                          >
                            <span>Read More</span>
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </a>
                        ) : (
                          <div className="flex items-center text-gold font-semibold">
                            <span>Read More</span>
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          )}

          {/* Rest of Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.slice(1).map((article) => (
              <article 
                key={article.id}
                className="group jj-card-inner rounded-xl overflow-hidden hover:border-gold/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/10"
              >
                {/* Image */}
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="text-xs text-gold bg-gold/10 backdrop-blur-sm px-3 py-1 rounded-full border border-gold/20">
                      {article.category}
                    </span>
                    {'isAI' in article && article.isAI && (
                      <span className="text-xs text-purple-700 bg-purple-500/15 backdrop-blur-sm px-2 py-1 rounded-full border border-purple-500/20 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3 text-xs text-zinc-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(article.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span>{article.source}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors line-clamp-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {article.title}
                  </h3>

                  <p className="text-sm text-zinc-700 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>

                  {'sourceUrl' in article && article.sourceUrl ? (
                    <a 
                      href={article.sourceUrl as string} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-gold text-sm font-medium hover:underline"
                    >
                      <span>Read More</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <div className="flex items-center text-gold text-sm font-medium">
                      <span>Read More</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Empty State */}
          {filteredNews.length === 0 && (
            <div className="text-center py-16">
              <Newspaper className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">No news in this category</h3>
              <p className="text-zinc-400">Try selecting a different category or refresh the news.</p>
            </div>
          )}

          {/* Market Stats Banner */}
          <div className="mt-16">
            <div className="jj-layer-active p-3 md:p-4">
              <div className="jj-card-inner rounded-2xl p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-black/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Key Market Statistics — 2025
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold text-gold mb-1">AED 328.8B</p>
                    <p className="text-sm text-zinc-700">H1 2025 Transaction Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold text-gold mb-1">99,000+</p>
                    <p className="text-sm text-zinc-700">H1 2025 Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold text-gold mb-1">+23.7%</p>
                    <p className="text-sm text-zinc-700">YoY Volume Growth</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold text-gold mb-1">+41%</p>
                    <p className="text-sm text-zinc-700">YoY Value Growth</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 mt-6 text-center">
                  Source: Dubai Land Department, Christie's Real Estate Dubai, Property Finder
                </p>
              </div>
            </div>
          </div>

          {/* News Reporter Info - Victoria Hayes */}
          <div className="mt-8">
            <div className="jj-layer-active p-3 md:p-4">
              <div className="jj-card-inner rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-black/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face" 
                      alt="Victoria Hayes - News Reporter"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-black font-semibold text-lg mb-1">Victoria Hayes</h3>
                    <p className="text-gold text-sm mb-3">Senior News Reporter, JBJ Global Real Estate</p>
                    <p className="text-zinc-700 text-sm mb-3">
                      Victoria curates the latest real estate news from official UAE government sources 
                      including Dubai Media Office, Dubai Land Department, Abu Dhabi Media Office, and Ministry of Economy. 
                      With over 12 years of experience in financial journalism, she ensures you stay informed of the latest market developments.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Dubai Media Office", "Dubai Land Dept", "Abu Dhabi Media", "Ministry of Economy", "RERA"].map((source) => (
                        <Badge key={source} variant="outline" className="text-gold border-gold/30 text-xs">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
      </section>
    </>
  );
};

export default News;
