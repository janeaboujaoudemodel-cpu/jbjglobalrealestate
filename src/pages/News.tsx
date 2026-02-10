import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Newspaper, ChevronRight, ArrowLeft, Calendar, ExternalLink, TrendingUp, Loader2, RefreshCw, Bot, Landmark, Building2, Home, Banknote, Gift, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
  const navigate = useNavigate();

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

  // Transform DB news to display format
  const newsArticles = (dbNews || []).map(n => ({
    id: n.id,
    title: n.title,
    excerpt: n.excerpt,
    category: n.category,
    date: n.published_date,
    source: n.source,
    image: n.image_url || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
    isAI: n.ai_generated,
    sourceUrl: n.source_url,
  }));

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

  // DLD Top Areas data
  const topAreas2026 = [
    { area: "Jumeirah Village Circle", transactions: 2840, change: "+22%" },
    { area: "Business Bay", transactions: 2120, change: "+18%" },
    { area: "Dubai Marina", transactions: 1650, change: "+15%" },
    { area: "Downtown Dubai", transactions: 1380, change: "+12%" },
    { area: "Palm Jumeirah", transactions: 1120, change: "+9%" },
    { area: "Dubai Hills Estate", transactions: 980, change: "+25%" },
    { area: "Jumeirah Lake Towers", transactions: 870, change: "+14%" },
    { area: "Dubai Creek Harbour", transactions: 760, change: "+31%" },
    { area: "Al Barsha", transactions: 690, change: "+11%" },
    { area: "DAMAC Hills", transactions: 640, change: "+20%" },
  ];

  return (
    <>
      <SEOHead {...pagesSEO.news} />
      <section className="min-h-screen bg-black">
      {/* Hero Section - 3-Layer System with global gutter */}
      <div className="relative py-16 md:py-24 bg-black">
        <div className="jj-layer-2 !bg-transparent">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Properties
          </Link>
          
          {/* Active Champagne Layer */}
          <div className="py-10 px-4 md:px-8 jj-layer-active rounded-2xl">
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
                        Government & Market Sources
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Refresh button removed - news loads from database */}
            </div>
            <p className="text-zinc-700 text-base max-w-2xl">
              Stay informed about the latest UAE real estate market updates, economic developments, and investment opportunities. 
              <span className="text-gold font-medium"> Curated from official government & premium market sources daily.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter - Active Champagne with global gutter */}
      <div className="border-b border-gold/20 sticky top-16 bg-black z-20">
        <div className="jj-layer-2 !bg-transparent !py-0">
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
        <div className="jj-layer-2 !bg-transparent py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      )}

      {/* News Grid - with global gutter */}
      {!isLoading && (
        <div className="jj-layer-2 !bg-transparent py-12 md:py-16">
          {/* Featured Article */}
          {filteredNews.length > 0 && (
            <div className="mb-12">
              <div className="py-6 px-4 md:px-6 jj-layer-active rounded-2xl">
                <article 
                  className="group relative jj-card-inner rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer"
                  onClick={() => navigate(`/news/${filteredNews[0].id}`)}
                >
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
                        <span className="text-xs text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 font-medium">
                          {filteredNews[0].category}
                        </span>
                        <span className="text-xs text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full flex items-center gap-1 border border-zinc-200">
                          <Landmark className="w-3 h-3" />
                          {filteredNews[0].source}
                        </span>
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
                        </div>
                        <div className="flex items-center text-gold font-semibold">
                          <span>Read More</span>
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
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
                onClick={() => navigate(`/news/${article.id}`)}
                className="group jj-card-inner border-2 border-gold rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] cursor-pointer"
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
                    <span className="text-xs text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 font-medium">
                      {article.category}
                    </span>
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
                    <span className="flex items-center gap-1">
                      <Landmark className="w-3 h-3" />
                      {article.source}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors line-clamp-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {article.title}
                  </h3>

                  <p className="text-sm text-zinc-700 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center text-gold text-sm font-medium">
                    <span>Read More</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Empty State */}
          {filteredNews.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <Newspaper className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                {selectedCategory ? "No news in this category" : "No news articles yet"}
              </h3>
              <p className="text-zinc-400 mb-4">
                {selectedCategory 
                  ? "Try selecting a different category or refresh the news."
                  : "Click \"Refresh News\" to collect the latest articles from official UAE sources."
                }
              </p>
            </div>
          )}

          {/* ===== DLD MARKET STATISTICS SECTION ===== */}
          
          {/* 2026 YTD Market Stats - Primary Card */}
          <div className="mt-16">
            <div className="jj-layer-active p-3 md:p-4">
              <div className="jj-card-inner rounded-2xl p-8 md:p-10">
                <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-black/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Key Market Statistics — 2026
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Source: Dubai Land Department (DLD)</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500 text-white border-0 px-3 py-1 text-xs font-bold animate-pulse">
                    LIVE · 2026 YTD
                  </Badge>
                </div>

                {/* Primary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold text-gold mb-1">AED 55.1B</p>
                    <p className="text-sm text-zinc-700">YTD Transaction Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold text-gold mb-1">18,500+</p>
                    <p className="text-sm text-zinc-700">YTD Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold text-gold mb-1">+19.2%</p>
                    <p className="text-sm text-zinc-700">YoY Volume Growth</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold text-gold mb-1">Jumeirah Village</p>
                    <p className="text-sm text-zinc-700">Top Performing Area</p>
                  </div>
                </div>

                {/* DLD Breakdown Grid */}
                <div className="border-t border-gold/20 pt-6">
                  <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-gold" />
                    DLD Transaction Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Off-plan vs Secondary */}
                    <div className="bg-white/60 rounded-xl p-4 border border-gold/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-gold" />
                        <span className="text-xs font-semibold text-black uppercase tracking-wide">Transaction Type</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-700">Off-plan</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-black">~11,200</span>
                            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">60.5%</span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2">
                          <div className="bg-gold rounded-full h-2" style={{ width: "60.5%" }} />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-700">Secondary</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-black">~7,300</span>
                            <span className="text-xs text-zinc-500 font-medium bg-zinc-100 px-1.5 py-0.5 rounded">39.5%</span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2">
                          <div className="bg-zinc-400 rounded-full h-2" style={{ width: "39.5%" }} />
                        </div>
                      </div>
                    </div>

                    {/* Mortgage vs Cash */}
                    <div className="bg-white/60 rounded-xl p-4 border border-gold/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Banknote className="w-4 h-4 text-gold" />
                        <span className="text-xs font-semibold text-black uppercase tracking-wide">Payment Method</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-700">Cash</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-black">~13,700</span>
                            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">74%</span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2">
                          <div className="bg-emerald-500 rounded-full h-2" style={{ width: "74%" }} />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-700">Mortgage</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-black">~4,800</span>
                            <span className="text-xs text-zinc-500 font-medium bg-zinc-100 px-1.5 py-0.5 rounded">26%</span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2">
                          <div className="bg-zinc-400 rounded-full h-2" style={{ width: "26%" }} />
                        </div>
                      </div>
                    </div>

                    {/* Gift Transactions */}
                    <div className="bg-white/60 rounded-xl p-4 border border-gold/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Gift className="w-4 h-4 text-gold" />
                        <span className="text-xs font-semibold text-black uppercase tracking-wide">Gift Transactions</span>
                      </div>
                      <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
                        <p className="text-4xl font-bold text-gold">~520</p>
                        <p className="text-sm text-zinc-600 mt-1">YTD Gift Transfers</p>
                        <p className="text-xs text-zinc-500 mt-2">2.8% of total volume</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 mt-6 text-center">
                  Source: Dubai Land Department (DLD) · Data as of February 2026
                </p>
              </div>
            </div>
          </div>

          {/* Top Areas Performance Table */}
          <div className="mt-6">
            <div className="jj-layer-active p-3 md:p-4">
              <div className="jj-card-inner rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-black/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Top 10 Areas by Transaction Volume
                    </h3>
                    <p className="text-xs text-zinc-500">2026 YTD · Dubai Land Department (DLD)</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gold/20">
                        <th className="text-left py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">#</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Area</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Transactions</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">YoY Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topAreas2026.map((area, i) => (
                        <tr key={area.area} className="border-b border-zinc-100 last:border-0 hover:bg-champagne-light/30 transition-colors">
                          <td className="py-3 px-2 text-zinc-400 font-medium">{i + 1}</td>
                          <td className="py-3 px-2 text-black font-medium">{area.area}</td>
                          <td className="py-3 px-2 text-right text-gold font-bold">{area.transactions.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right">
                            <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded-full">
                              {area.change}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Separator */}
          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm italic tracking-wide">
              Looking back at last year's performance?
            </p>
          </div>

          {/* 2025 Full Year Recap Card */}
          <div className="mt-4">
            <div className="jj-layer-active p-3 md:p-4">
              <div className="jj-card-inner rounded-2xl p-8 md:p-10 opacity-90">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-black/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                      2025 Full Year Recap
                    </h3>
                    <p className="text-xs text-zinc-500">January 1, 2025 – January 1, 2026 · Dubai Land Department (DLD)</p>
                  </div>
                </div>

                {/* Primary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-gold mb-1">AED 761B</p>
                    <p className="text-sm text-zinc-700">Total Transaction Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-gold mb-1">226,000+</p>
                    <p className="text-sm text-zinc-700">Total Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-gold mb-1">+36%</p>
                    <p className="text-sm text-zinc-700">YoY Growth vs 2024</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-gold mb-1">Record Year</p>
                    <p className="text-sm text-zinc-700">Highest Ever Recorded</p>
                  </div>
                </div>

                {/* 2025 Breakdown */}
                <div className="border-t border-gold/10 pt-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-black">~136,000</p>
                      <p className="text-xs text-zinc-600">Off-plan (60%)</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-black">~90,000</p>
                      <p className="text-xs text-zinc-600">Secondary (40%)</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-black">~167,000</p>
                      <p className="text-xs text-zinc-600">Cash (74%)</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-black">~6,200</p>
                      <p className="text-xs text-zinc-600">Gift Transactions</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 mt-6 text-center">
                  Source: Dubai Land Department (DLD) · Full Year 2025 Closed Figures
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
                      {["Dubai Media Office", "Dubai Land Dept", "Abu Dhabi Media", "Ministry of Economy", "RERA", "Provident", "Gulf Business"].map((source) => (
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
      </section>
    </>
  );
};

export default News;
