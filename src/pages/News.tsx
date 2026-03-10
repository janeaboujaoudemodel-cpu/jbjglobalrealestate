import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Newspaper, ChevronRight, ArrowLeft, Calendar, ExternalLink, TrendingUp, RefreshCw, Bot, Landmark, Building2, Home, Banknote, Gift, MapPin, Globe, Users } from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { Button } from "@/components/ui/button";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ytd2026 as ytd2026Data, topAreas2026 as topAreas2026Data, topAreas2025 as topAreas2025Data, topNationalities as topNationalitiesData } from "@/constants/dldMarketData";
import jbjMonogramDarkBg from "@/assets/jbj-monogram-dark-bg.png";

const dubaiLandmarksVideo = new URL("@/assets/videos/dubai-landmarks-hero.mp4", import.meta.url).href;

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

// Category-specific accent colors for premium editorial badges
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Market Update': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Analysis': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'Policy': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  'Economic': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Monthly Report': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'Market Outlook': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Developer News': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  'Government': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  'Company News': { bg: 'bg-[hsl(43,45%,94%)]', text: 'text-[hsl(43,45%,30%)]', border: 'border-[hsl(43,45%,54%)]/30' },
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colors = CATEGORY_COLORS[category] || { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200' };
  return (
    <span className={`text-xs ${colors.text} ${colors.bg} px-3 py-1 rounded-full border ${colors.border} font-medium`}>
      {category}
    </span>
  );
};

const News = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryParam === 'company' ? 'Company News' : categoryParam === 'market' ? 'Market Update' : null
  );
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
    image: n.image_url || null,
    isAI: n.ai_generated,
    sourceUrl: n.source_url,
  }));

  const categories = ["All", "Market Update", "Analysis", "Policy", "Economic", "Monthly Report", "Market Outlook", "Developer News", "Government", "Company News"];

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

  // Dynamic date for DLD stats
  const dldDateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Compute days elapsed in 2026 for daily average
  const daysElapsed2026 = Math.max(1, Math.floor((Date.now() - new Date('2026-01-01').getTime()) / (1000 * 60 * 60 * 24)));

  // Use shared constants
  const ytd2026 = ytd2026Data;
  const topAreas2026 = topAreas2026Data;
  const topAreas2025 = topAreas2025Data;
  const topNationalities = topNationalitiesData;

  // Daily averages (YTD / days elapsed)
  const daily2026 = {
    transactions: Math.round(ytd2026.transactions / daysElapsed2026),
    offPlan: Math.round(ytd2026.offPlan / daysElapsed2026),
    secondary: Math.round(ytd2026.secondary / daysElapsed2026),
    cash: Math.round(ytd2026.cash / daysElapsed2026),
    mortgage: Math.round(ytd2026.mortgage / daysElapsed2026),
    gifts: Math.round(ytd2026.gifts / daysElapsed2026),
    valuePerDay: `AED ${(ytd2026.valueNum / daysElapsed2026 * 1000).toFixed(0)}M`,
  };

  // Reusable breakdown component
  const TransactionBreakdown = ({ 
    offPlan, secondary, cash, mortgage, gifts, 
    dateLabel, isDaily = false 
  }: { 
    offPlan: number; secondary: number; cash: number; mortgage: number; gifts: number;
    dateLabel: string; isDaily?: boolean;
  }) => {
    const totalType = offPlan + secondary;
    const offPlanPct = totalType > 0 ? ((offPlan / totalType) * 100).toFixed(1) : "0";
    const secondaryPct = totalType > 0 ? ((secondary / totalType) * 100).toFixed(1) : "0";
    const totalPayment = cash + mortgage;
    const cashPct = totalPayment > 0 ? ((cash / totalPayment) * 100).toFixed(0) : "0";
    const mortgagePct = totalPayment > 0 ? ((mortgage / totalPayment) * 100).toFixed(0) : "0";
    const totalAll = offPlan + secondary;
    const giftPct = totalAll > 0 ? ((gifts / totalAll) * 100).toFixed(1) : "0";

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Off-plan vs Secondary */}
        <div className="bg-white/60 rounded-xl p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold text-black uppercase tracking-wide">Transaction Type</span>
          </div>
          <span className="text-[10px] text-zinc-400">{dateLabel}</span>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-700">Off-plan</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-black">{isDaily ? `~${offPlan}` : `~${offPlan.toLocaleString()}`}</span>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">{offPlanPct}%</span>
              </div>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2">
              <div className="bg-gold rounded-full h-2" style={{ width: `${offPlanPct}%` }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-700">Secondary</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-black">{isDaily ? `~${secondary}` : `~${secondary.toLocaleString()}`}</span>
                <span className="text-xs text-zinc-500 font-medium bg-zinc-100 px-1.5 py-0.5 rounded">{secondaryPct}%</span>
              </div>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2">
              <div className="bg-zinc-400 rounded-full h-2" style={{ width: `${secondaryPct}%` }} />
            </div>
          </div>
        </div>

        {/* Cash vs Mortgage */}
        <div className="bg-white/60 rounded-xl p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold text-black uppercase tracking-wide">Payment Method</span>
          </div>
          <span className="text-[10px] text-zinc-400">{dateLabel}</span>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-700">Cash</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-black">{isDaily ? `~${cash}` : `~${cash.toLocaleString()}`}</span>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">{cashPct}%</span>
              </div>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2">
              <div className="bg-emerald-500 rounded-full h-2" style={{ width: `${cashPct}%` }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-700">Mortgage</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-black">{isDaily ? `~${mortgage}` : `~${mortgage.toLocaleString()}`}</span>
                <span className="text-xs text-zinc-500 font-medium bg-zinc-100 px-1.5 py-0.5 rounded">{mortgagePct}%</span>
              </div>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2">
              <div className="bg-zinc-400 rounded-full h-2" style={{ width: `${mortgagePct}%` }} />
            </div>
          </div>
        </div>

        {/* Gift Transactions */}
        <div className="bg-white/60 rounded-xl p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold text-black uppercase tracking-wide">Gift Transactions</span>
          </div>
          <span className="text-[10px] text-zinc-400">{dateLabel}</span>
          <div className="flex flex-col items-center justify-center h-[calc(100%-2.5rem)] mt-2">
            <p className="text-4xl font-bold text-gold">~{isDaily ? gifts : gifts.toLocaleString()}</p>
            <p className="text-sm text-zinc-600 mt-1">{isDaily ? "Daily Avg Gift Transfers" : "Gift Transfers"}</p>
            <p className="text-xs text-zinc-500 mt-2">{giftPct}% of total volume</p>
          </div>
        </div>
      </div>
    );
  };

  // Reusable areas table
  const AreasTable = ({ areas, yearLabel }: { areas: typeof topAreas2026; yearLabel: string }) => (
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
          {areas.map((area, i) => (
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
  );

  return (
    <>
      <SEOHead {...pagesSEO.news} />
      <section className="min-h-screen bg-gradient-to-br from-[hsl(40,30%,96%)] via-[hsl(39,25%,94%)] to-[hsl(38,20%,92%)]">
      {/* Hero Section - Editorial Premium */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-[hsl(40,30%,96%)] to-[hsl(39,25%,93%)] border-b border-[hsl(43,45%,54%)]/15">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(43,45%,54%)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(43,45%,54%)]/5 rounded-full blur-3xl" />
        
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-[hsl(0,0%,45%)] hover:text-[hsl(43,45%,44%)] mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-[hsl(43,45%,54%)]/30 bg-white/50 backdrop-blur-sm">
              <Landmark className="w-4 h-4 text-[hsl(43,45%,54%)]" />
              <span className="text-[hsl(43,45%,44%)] font-semibold text-xs uppercase tracking-[0.2em]">
                Government &amp; Market Sources
              </span>
            </div>
            
            <h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-[hsl(0,0%,12%)] mb-6"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              News &amp; <span className="text-[hsl(43,45%,54%)]">Insights</span>
            </h1>
            <p className="text-[hsl(0,0%,40%)] text-lg md:text-xl max-w-2xl leading-relaxed">
              Stay informed about the latest UAE real estate market updates, economic developments, and investment opportunities.
              <span className="text-[hsl(43,45%,44%)] font-medium"> Curated from official sources daily.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <div className="border-b border-[hsl(43,45%,54%)]/15 sticky top-16 bg-[hsl(40,30%,96%)]/95 backdrop-blur-md z-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="py-3">
            <div className="flex gap-2 py-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category === "All" ? null : category)}
                  className={`px-5 py-2.5 text-sm whitespace-nowrap transition-all duration-300 rounded-full font-medium ${
                    (category === "All" && !selectedCategory) || selectedCategory === category
                      ? "bg-[hsl(43,45%,54%)] text-white shadow-md"
                      : "bg-white/70 text-[hsl(0,0%,30%)] border border-[hsl(43,45%,54%)]/15 hover:border-[hsl(43,45%,54%)]/40"
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
        <div className="max-w-[1200px] mx-auto px-6 py-16 flex justify-center">
          <BrandedLoader text="Loading news..." className="min-h-[40vh]" />
        </div>
      )}

      {/* News Grid */}
      {!isLoading && (
        <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
          {/* Featured Article */}
          {filteredNews.length > 0 && (
            <div className="mb-12">
              <div className="py-6 px-4 md:px-6">
                <article 
                  className="group relative bg-white/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer hover:shadow-lg"
                  onClick={() => navigate(`/news/${filteredNews[0].id}`)}
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:aspect-auto md:h-full relative overflow-hidden">
                      {filteredNews[0].image ? (
                        <img 
                          src={filteredNews[0].image} 
                          alt={filteredNews[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              e.currentTarget.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full min-h-[250px] bg-gradient-to-br from-[hsl(43,45%,90%)] via-[hsl(40,30%,96%)] to-[hsl(39,25%,93%)] flex flex-col items-center justify-center gap-3';
                              const cat = filteredNews[0]?.category || 'News';
                              const src = filteredNews[0]?.source || '';
                              fallback.innerHTML = `<div class="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gold"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></div><span class="text-gold/80 text-sm font-semibold uppercase tracking-wider">${cat}</span><span class="text-zinc-500 text-xs">${src}</span>`;
                              parent.insertBefore(fallback, e.currentTarget);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full min-h-[250px] bg-gradient-to-br from-[hsl(43,45%,90%)] via-[hsl(40,30%,96%)] to-[hsl(39,25%,93%)] flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-[hsl(43,45%,54%)]/15 flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-[hsl(43,45%,54%)]" />
                          </div>
                          <span className="text-[hsl(43,45%,44%)] text-sm font-semibold uppercase tracking-wider">{filteredNews[0]?.category || 'News'}</span>
                          <span className="text-[hsl(0,0%,55%)] text-xs">{filteredNews[0]?.source || ''}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
                    </div>
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <span className="text-xs text-[hsl(43,45%,30%)] bg-[hsl(43,45%,94%)] px-3 py-1 rounded-full font-medium border border-[hsl(43,45%,54%)]/30">
                          Featured
                        </span>
                    <CategoryBadge category={filteredNews[0].category} />
                        <span className="text-xs text-[hsl(0,0%,45%)] bg-[hsl(40,30%,96%)] px-3 py-1 rounded-full flex items-center gap-1 border border-[hsl(43,45%,54%)]/15">
                          <Landmark className="w-3 h-3" />
                          {filteredNews[0].source}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[hsl(0,0%,12%)] mb-4 group-hover:text-[hsl(43,45%,44%)] transition-colors line-clamp-2" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                        {filteredNews[0].title}
                      </h2>
                      <p className="text-[hsl(0,0%,40%)] mb-6 line-clamp-3">
                        {filteredNews[0].excerpt}
                      </p>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 text-sm text-[hsl(0,0%,45%)] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(filteredNews[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center text-[hsl(43,45%,44%)] font-semibold">
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
                className="group bg-white/80 border border-[hsl(43,45%,54%)]/15 rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
              >
                <div className="aspect-video relative overflow-hidden">
                  {article.image ? (
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          e.currentTarget.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full bg-gradient-to-br from-[hsl(43,45%,90%)] via-[hsl(40,30%,96%)] to-[hsl(39,25%,93%)] flex flex-col items-center justify-center gap-2 p-4';
                          const cat = article.category || 'News';
                          const src = article.source || '';
                          fallback.innerHTML = `<div class="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gold"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></div><span class="text-gold/80 text-xs font-semibold uppercase tracking-wider">${cat}</span><span class="text-zinc-500 text-[10px]">${src}</span>`;
                          parent.insertBefore(fallback, e.currentTarget);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[hsl(43,45%,90%)] via-[hsl(40,30%,96%)] to-[hsl(39,25%,93%)] flex flex-col items-center justify-center gap-2 p-4">
                      <div className="w-12 h-12 rounded-full bg-[hsl(43,45%,54%)]/15 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-[hsl(43,45%,54%)]" />
                      </div>
                      <span className="text-[hsl(43,45%,44%)] text-xs font-semibold uppercase tracking-wider">{article.category}</span>
                      <span className="text-[hsl(0,0%,55%)] text-[10px]">{article.source}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <CategoryBadge category={article.category} />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3 text-xs text-[hsl(0,0%,45%)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="flex items-center gap-1">
                      <Landmark className="w-3 h-3" />
                      {article.source}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[hsl(0,0%,12%)] mb-2 group-hover:text-[hsl(43,45%,44%)] transition-colors line-clamp-2" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                    {article.title}
                  </h3>
                  <p className="text-sm text-[hsl(0,0%,40%)] mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center text-[hsl(43,45%,44%)] text-sm font-medium">
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
              <Newspaper className="w-12 h-12 text-[hsl(0,0%,55%)] mx-auto mb-4" />
              <h3 className="text-[hsl(0,0%,15%)] text-xl font-semibold mb-2">
                {selectedCategory ? "No news in this category" : "No news articles yet"}
              </h3>
              <p className="text-[hsl(0,0%,45%)] mb-4">
                {selectedCategory 
                  ? "Try selecting a different category or refresh the news."
                  : "Click \"Refresh News\" to collect the latest articles from official UAE sources."
                }
              </p>
            </div>
          )}

          {/* ===== DLD MARKET STATISTICS SECTION ===== */}
          
          {/* 2026 YTD Market Stats with YTD / Daily Toggle */}
          <div className="mt-16">
            <div className="p-3 md:p-4">
              <div className="bg-white/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-8 md:p-10">
                <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-black/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Key Market Statistics — 2026
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Source: Dubai Land Department (DLD) · Data as of {dldDateLabel}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500 text-white border-0 px-3 py-1 text-xs font-bold animate-pulse">
                    LIVE · 2026 YTD
                  </Badge>
                </div>

                <Tabs defaultValue="ytd" className="w-full">
                  <TabsList className="mb-6 bg-champagne-light/50 border border-gold/20">
                    <TabsTrigger value="ytd" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs font-semibold">
                      YTD 2026
                    </TabsTrigger>
                    <TabsTrigger value="daily" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs font-semibold">
                      Today's Average
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ytd">
                    {/* Primary KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-gold mb-1">{ytd2026.value}</p>
                        <p className="text-sm text-zinc-700">YTD Transaction Value</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-gold mb-1">{ytd2026.transactions.toLocaleString()}+</p>
                        <p className="text-sm text-zinc-700">YTD Transactions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-gold mb-1">{ytd2026.growth}</p>
                        <p className="text-sm text-zinc-700">YoY Volume Growth</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-gold mb-1">{ytd2026.topArea}</p>
                        <p className="text-sm text-zinc-700">Top Performing Area</p>
                      </div>
                    </div>

                    <div className="border-t border-gold/20 pt-6">
                      <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-gold" />
                        DLD Transaction Breakdown
                      </h4>
                      <TransactionBreakdown
                        offPlan={ytd2026.offPlan}
                        secondary={ytd2026.secondary}
                        cash={ytd2026.cash}
                        mortgage={ytd2026.mortgage}
                        gifts={ytd2026.gifts}
                        dateLabel={`As of ${dldDateLabel}`}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="daily">
                    {/* Daily KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-gold mb-1">{daily2026.valuePerDay}</p>
                        <p className="text-sm text-zinc-700">Avg Daily Value</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-gold mb-1">~{daily2026.transactions}</p>
                        <p className="text-sm text-zinc-700">Avg Daily Transactions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-gold mb-1">{daysElapsed2026}</p>
                        <p className="text-sm text-zinc-700">Days Elapsed in 2026</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-gold mb-1">{ytd2026.topArea}</p>
                        <p className="text-sm text-zinc-700">Top Performing Area</p>
                      </div>
                    </div>

                    <div className="border-t border-gold/20 pt-6">
                      <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-gold" />
                        Daily Average Breakdown
                      </h4>
                      <TransactionBreakdown
                        offPlan={daily2026.offPlan}
                        secondary={daily2026.secondary}
                        cash={daily2026.cash}
                        mortgage={daily2026.mortgage}
                        gifts={daily2026.gifts}
                        dateLabel={`Daily avg as of ${dldDateLabel}`}
                        isDaily
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <p className="text-xs text-zinc-600 mt-6 text-center">
                  Source: Dubai Land Department (DLD) · Data as of {dldDateLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Top Areas Performance Table - 2026 */}
          <div className="mt-6">
            <div className="p-3 md:p-4">
              <div className="bg-white/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-6 md:p-8">
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
                <AreasTable areas={topAreas2026} yearLabel="2026" />
              </div>
            </div>
          </div>

          {/* Top Buyer Nationalities */}
          <div className="mt-6">
            <div className="p-3 md:p-4">
              <div className="bg-white/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-black/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Top Buyer Nationalities
                    </h3>
                    <p className="text-xs text-zinc-500">2026 YTD · Dubai Land Department (DLD)</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {topNationalities.map((nat, i) => (
                    <div key={nat.country} className="flex items-center gap-3">
                      <span className="text-zinc-400 font-medium text-sm w-5 text-right">{i + 1}</span>
                      <span className="text-lg">{nat.flag}</span>
                      <span className="text-sm font-medium text-black flex-1">{nat.country}</span>
                      <div className="flex-1 max-w-[200px]">
                        <div className="w-full bg-zinc-200 rounded-full h-2">
                          <div className="bg-gold rounded-full h-2 transition-all" style={{ width: `${nat.percentage * 4}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gold w-14 text-right">{nat.percentage}%</span>
                      <span className="text-xs text-zinc-500 w-16 text-right">{nat.transactions.toLocaleString()}</span>
                    </div>
                  ))}
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

          {/* 2025 Full Year Recap Card — Unified UI */}
          <div className="mt-4">
            <div className="p-3 md:p-4">
              <div className="bg-white/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-8 md:p-10 opacity-90">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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

                {/* 2025 Breakdown — Same 3-card UI as 2026 */}
                <div className="border-t border-gold/20 pt-6">
                  <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-gold" />
                    2025 Transaction Breakdown
                  </h4>
                  <TransactionBreakdown
                    offPlan={136000}
                    secondary={90000}
                    cash={167000}
                    mortgage={59000}
                    gifts={6200}
                    dateLabel="Full Year 2025"
                  />
                </div>

                <p className="text-xs text-zinc-600 mt-6 text-center">
                  Source: Dubai Land Department (DLD) · Full Year 2025 Closed Figures
                </p>
              </div>
            </div>
          </div>

          {/* Top 10 Areas 2025 */}
          <div className="mt-6">
            <div className="p-3 md:p-4">
              <div className="bg-white/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-6 md:p-8 opacity-90">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-black/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Top 10 Areas by Transaction Volume
                    </h3>
                    <p className="text-xs text-zinc-500">Full Year 2025 · Dubai Land Department (DLD)</p>
                  </div>
                </div>
                <AreasTable areas={topAreas2025} yearLabel="2025" />
              </div>
            </div>
          </div>

          {/* News Reporter Info - Victoria Hayes */}
          <div className="mt-8">
            <div className="p-3 md:p-4">
              <div className="bg-white/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-6 md:p-8">
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
                      {["Dubai Media Office", "Dubai Land Dept", "Abu Dhabi Media", "Ministry of Economy", "RERA", "Knight Frank", "Property Monitor", "Gulf Business"].map((source) => (
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
