import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Newspaper, ChevronRight, ArrowLeft, Calendar, TrendingUp, Landmark, Building2, Banknote, Gift, MapPin, Globe } from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ytd2026 as ytd2026Data, topAreas2026 as topAreas2026Data, topAreas2025 as topAreas2025Data, topNationalities as topNationalitiesData } from "@/constants/dldMarketData";
import { isRealEstateArticle } from "@/lib/news/realEstateFilter";

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

// Unified champagne badge — single visual language for every category.
const CategoryBadge = ({ category }: { category: string }) => (
  <span className="text-xs text-[#1A1A1A] bg-[#F7F2EA] px-3 py-1 rounded-full border border-[#B89555]/40 font-medium">
    {category}
  </span>
);

const News = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryParam === 'company' ? 'Company News' : categoryParam === 'market' ? 'Market Update' : null
  );
  const navigate = useNavigate();


  // Fetch news from database
  const { data: dbNews, isLoading } = useQuery({
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

  // Transform DB news to display format, dropping anything that isn't Dubai/UAE real estate
  const newsArticles = (dbNews || [])
    .filter(n => isRealEstateArticle({ title: n.title, excerpt: n.excerpt, content: n.content, category: n.category }))
    .map(n => ({
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

  const categories = ["All", "Market Update", "Analysis", "Policy", "Economic", "Developer News", "Government", "Company News"];

  const filteredNews = selectedCategory && selectedCategory !== "All"
    ? newsArticles.filter(n => n.category === selectedCategory)
    : newsArticles;

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
        <div className="bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Transaction Type</span>
          </div>
          <span className="text-[10px] text-[#1A1A1A]/70">{dateLabel}</span>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#1A1A1A]/70">Off-plan</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1A1A1A]">{isDaily ? `~${offPlan}` : `~${offPlan.toLocaleString()}`}</span>
                <span className="text-xs text-[color:var(--emerald-1)] font-medium jj-emerald-soft px-1.5 py-0.5 rounded">{offPlanPct}%</span>
              </div>
            </div>
            <div className="w-full bg-[#EFE6D6] rounded-full h-2">
              <div className="bg-[#EFE6D6] rounded-full h-2" style={{ width: `${offPlanPct}%` }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#1A1A1A]/70">Secondary</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1A1A1A]">{isDaily ? `~${secondary}` : `~${secondary.toLocaleString()}`}</span>
                <span className="text-xs text-[#1A1A1A]/70 font-medium bg-[#F7F2EA] px-1.5 py-0.5 rounded">{secondaryPct}%</span>
              </div>
            </div>
            <div className="w-full bg-[#EFE6D6] rounded-full h-2">
              <div className="bg-[#B89555] rounded-full h-2" style={{ width: `${secondaryPct}%` }} />
            </div>
          </div>
        </div>

        {/* Cash vs Mortgage */}
        <div className="bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Payment Method</span>
          </div>
          <span className="text-[10px] text-[#1A1A1A]/70">{dateLabel}</span>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#1A1A1A]/70">Cash</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1A1A1A]">{isDaily ? `~${cash}` : `~${cash.toLocaleString()}`}</span>
                <span className="text-xs text-[color:var(--emerald-1)] font-medium jj-emerald-soft px-1.5 py-0.5 rounded">{cashPct}%</span>
              </div>
            </div>
            <div className="w-full bg-[#EFE6D6] rounded-full h-2">
              <div className="jj-surface-emerald rounded-full h-2" style={{ width: `${cashPct}%` }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#1A1A1A]/70">Mortgage</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1A1A1A]">{isDaily ? `~${mortgage}` : `~${mortgage.toLocaleString()}`}</span>
                <span className="text-xs text-[#1A1A1A]/70 font-medium bg-[#F7F2EA] px-1.5 py-0.5 rounded">{mortgagePct}%</span>
              </div>
            </div>
            <div className="w-full bg-[#EFE6D6] rounded-full h-2">
              <div className="bg-[#B89555] rounded-full h-2" style={{ width: `${mortgagePct}%` }} />
            </div>
          </div>
        </div>

        {/* Gift Transactions */}
        <div className="bg-[#FDFBF7]/60 rounded-xl p-4 border border-[#B89555]/10">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Gift Transactions</span>
          </div>
          <span className="text-[10px] text-[#1A1A1A]/70">{dateLabel}</span>
          <div className="flex flex-col items-center justify-center h-[calc(100%-2.5rem)] mt-2">
            <p className="text-4xl font-bold text-[#1A1A1A]">~{isDaily ? gifts : gifts.toLocaleString()}</p>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">{isDaily ? "Daily Avg Gift Transfers" : "Gift Transfers"}</p>
            <p className="text-xs text-[#1A1A1A]/70 mt-2">{giftPct}% of total volume</p>
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
          <tr className="border-b border-[#B89555]/20">
            <th className="text-left py-3 px-2 text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider">#</th>
            <th className="text-left py-3 px-2 text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider">Area</th>
            <th className="text-right py-3 px-2 text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider">Transactions</th>
            <th className="text-right py-3 px-2 text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider">YoY Change</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area, i) => (
            <tr key={area.area} className="border-b border-[#B89555]/30 last:border-0 hover:bg-champagne-light/30 transition-colors">
              <td className="py-3 px-2 text-[#1A1A1A]/70 font-medium">{i + 1}</td>
              <td className="py-3 px-2 text-[#1A1A1A] font-medium">{area.area}</td>
              <td className="py-3 px-2 text-right text-[#1A1A1A] font-bold">{area.transactions.toLocaleString()}</td>
              <td className="py-3 px-2 text-right">
                <span className="text-[color:var(--emerald-1)] font-medium text-xs jj-emerald-soft px-2 py-0.5 rounded-full">
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
      <section className="min-h-screen bg-[#FDFBF7]">
        {/* Champagne hero — JBJ identity, no neon, no ticker */}
        <section className="relative overflow-hidden border-b border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
          <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-20 relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-[#1A1A1A]/70 hover:text-[#1A1A1A] mb-8 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>

            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F2EA] border border-[#B89555]/40 text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A] font-semibold mb-5">
                <Landmark className="w-3.5 h-3.5" />
                Dubai Real Estate — Official Sources
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-[1.05] mb-5">
                News &amp; Insights
              </h1>
              <p className="text-[#1A1A1A]/75 text-lg max-w-2xl leading-relaxed">
                Curated Dubai &amp; UAE real-estate updates — DLD, RERA, developer launches, off-plan, mortgages, market reports and investor briefings.
              </p>
            </div>
          </div>
        </section>

        {/* Category filter — single champagne pill row, emerald active state via primitive */}
        <div className="sticky top-0 z-20 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#B89555]/30">
          <div className="max-w-[1200px] mx-auto px-6 py-3">
            <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide pr-4">
              {categories.map((category) => {
                const isActive = (category === "All" && !selectedCategory) || selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category === "All" ? null : category)}
                    data-emerald={isActive ? "true" : undefined}
                    data-surface={isActive ? "emerald" : undefined}
                    data-no-contrast-guard={isActive ? "" : undefined}
                    className={`allow-white px-4 py-2 text-sm whitespace-nowrap transition-colors rounded-full font-medium border ${
                      isActive
                        ? "jj-cta-primary border-transparent text-white shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)]"
                        : "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/40 hover:bg-[#EFE6D6]"
                    }`}
                    style={isActive ? { backgroundImage: "var(--jj-emerald-ombre, linear-gradient(135deg,#047857 0%,#064E3B 55%,#022C22 100%))", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}
                  >
                    <span style={isActive ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}>{category}</span>
                  </button>
                );
              })}
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
                  className="group relative bg-[#FDFBF7] border border-[#B89555]/40 rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-20px_rgba(184,149,85,0.35)]"
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
                          onError={(e) = loading="lazy" decoding="async"> {
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              e.currentTarget.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full min-h-[250px] bg-gradient-to-br from-[hsl(43,45%,90%)] via-[hsl(40,30%,96%)] to-[hsl(39,25%,93%)] flex flex-col items-center justify-center gap-3';
                              const cat = filteredNews[0]?.category || 'News';
                              const src = filteredNews[0]?.source || '';
                              fallback.innerHTML = `<div class="w-16 h-16 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[#1A1A1A]"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></div><span class="text-[#1A1A1A] text-sm font-semibold uppercase tracking-wider">${cat}</span><span class="text-[#1A1A1A]/70 text-xs">${src}</span>`;
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
                className="group bg-[#FDFBF7]/80 border border-[hsl(43,45%,54%)]/15 rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
              >
                <div className="aspect-video relative overflow-hidden">
                  {article.image ? (
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) = loading="lazy" decoding="async"> {
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          e.currentTarget.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full bg-gradient-to-br from-[hsl(43,45%,90%)] via-[hsl(40,30%,96%)] to-[hsl(39,25%,93%)] flex flex-col items-center justify-center gap-2 p-4';
                          const cat = article.category || 'News';
                          const src = article.source || '';
                          fallback.innerHTML = `<div class="w-12 h-12 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[#1A1A1A]"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></div><span class="text-[#1A1A1A] text-xs font-semibold uppercase tracking-wider">${cat}</span><span class="text-[#1A1A1A]/70 text-[10px]">${src}</span>`;
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
                    <span className="text-[#1A1A1A]/70">•</span>
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
              <div className="bg-[#FDFBF7]/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-8 md:p-10">
                <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#1A1A1A]/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1A1A1A]">
                        Key Market Statistics — 2026
                      </h3>
                      <p className="text-xs text-[#1A1A1A]/70 mt-0.5">Source: Dubai Land Department (DLD) · Data as of {dldDateLabel}</p>
                    </div>
                  </div>
                  <Badge data-no-contrast-guard data-surface="emerald" className="jj-surface-emerald allow-white text-white border-0 px-3 py-1 text-xs font-bold animate-pulse" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                    <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>LIVE · 2026 YTD</span>
                  </Badge>
                </div>

                <Tabs defaultValue="ytd" className="w-full">
                  <TabsList className="mb-6 bg-champagne-light/50 border border-[#B89555]/20">
                    <TabsTrigger value="ytd" data-no-contrast-guard className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] text-[#1A1A1A] text-xs font-semibold">
                      <span style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>YTD 2026</span>
                    </TabsTrigger>
                    <TabsTrigger value="daily" data-no-contrast-guard className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] text-[#1A1A1A] text-xs font-semibold">
                      <span style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>Today's Average</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ytd">
                    {/* Primary KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-1">{ytd2026.value}</p>
                        <p className="text-sm text-[#1A1A1A]/70">YTD Transaction Value</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-1">{ytd2026.transactions.toLocaleString()}+</p>
                        <p className="text-sm text-[#1A1A1A]/70">YTD Transactions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-1">{ytd2026.growth}</p>
                        <p className="text-sm text-[#1A1A1A]/70">YoY Volume Growth</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-1">{ytd2026.topArea}</p>
                        <p className="text-sm text-[#1A1A1A]/70">Top Performing Area</p>
                      </div>
                    </div>

                    <div className="border-t border-[#B89555]/20 pt-6">
                      <h4 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-[#1A1A1A]" />
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
                        <p className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-1">{daily2026.valuePerDay}</p>
                        <p className="text-sm text-[#1A1A1A]/70">Avg Daily Value</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-1">~{daily2026.transactions}</p>
                        <p className="text-sm text-[#1A1A1A]/70">Avg Daily Transactions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-1">{daysElapsed2026}</p>
                        <p className="text-sm text-[#1A1A1A]/70">Days Elapsed in 2026</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-1">{ytd2026.topArea}</p>
                        <p className="text-sm text-[#1A1A1A]/70">Top Performing Area</p>
                      </div>
                    </div>

                    <div className="border-t border-[#B89555]/20 pt-6">
                      <h4 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-[#1A1A1A]" />
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

                <p className="text-xs text-[#1A1A1A]/70 mt-6 text-center">
                  Source: Dubai Land Department (DLD) · Data as of {dldDateLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Top Buyer Nationalities */}
          <div className="mt-6">
            <div className="p-3 md:p-4">
              <div className="bg-[#FDFBF7]/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#1A1A1A]/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">
                      Top Buyer Nationalities
                    </h3>
                    <p className="text-xs text-[#1A1A1A]/70">2026 YTD · Dubai Land Department (DLD)</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {topNationalities.map((nat, i) => (
                    <div key={nat.country} className="flex items-center gap-3">
                      <span className="text-[#1A1A1A]/70 font-medium text-sm w-5 text-right">{i + 1}</span>
                      <span className="text-lg">{nat.flag}</span>
                      <span className="text-sm font-medium text-[#1A1A1A] flex-1">{nat.country}</span>
                      <div className="flex-1 max-w-[200px]">
                        <div className="w-full bg-[#EFE6D6] rounded-full h-2">
                          <div className="bg-[#EFE6D6] rounded-full h-2 transition-all" style={{ width: `${nat.percentage * 4}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#1A1A1A] w-14 text-right">{nat.percentage}%</span>
                      <span className="text-xs text-[#1A1A1A]/70 w-16 text-right">{nat.transactions.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Areas Performance Table - 2026 */}
          <div className="mt-6">
            <div className="p-3 md:p-4">
              <div className="bg-[#FDFBF7]/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#1A1A1A]/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">
                      Top 10 Areas by Transaction Volume
                    </h3>
                    <p className="text-xs text-[#1A1A1A]/70">2026 YTD · Dubai Land Department (DLD)</p>
                  </div>
                </div>
                <AreasTable areas={topAreas2026} yearLabel="2026" />
              </div>
            </div>
          </div>

          {/* Premium Separator */}
          <div className="mt-8 text-center">
            <p className="text-[#1A1A1A]/70 text-sm italic tracking-wide">
              Looking back at last year's performance?
            </p>
          </div>

          {/* 2025 Full Year Recap Card — Unified UI */}
          <div className="mt-4">
            <div className="p-3 md:p-4">
              <div className="bg-[#FDFBF7]/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-8 md:p-10 opacity-90">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#1A1A1A]/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">
                      2025 Full Year Recap
                    </h3>
                    <p className="text-xs text-[#1A1A1A]/70">January 1, 2025 – January 1, 2026 · Dubai Land Department (DLD)</p>
                  </div>
                </div>

                {/* Primary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-1">AED 761B</p>
                    <p className="text-sm text-[#1A1A1A]/70">Total Transaction Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-1">226,000+</p>
                    <p className="text-sm text-[#1A1A1A]/70">Total Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-1">+36%</p>
                    <p className="text-sm text-[#1A1A1A]/70">YoY Growth vs 2024</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-1">Record Year</p>
                    <p className="text-sm text-[#1A1A1A]/70">Highest Ever Recorded</p>
                  </div>
                </div>

                {/* 2025 Breakdown — Same 3-card UI as 2026 */}
                <div className="border-t border-[#B89555]/20 pt-6">
                  <h4 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#1A1A1A]" />
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

                <p className="text-xs text-[#1A1A1A]/70 mt-6 text-center">
                  Source: Dubai Land Department (DLD) · Full Year 2025 Closed Figures
                </p>
              </div>
            </div>
          </div>

          {/* Top 10 Areas 2025 */}
          <div className="mt-6">
            <div className="p-3 md:p-4">
              <div className="bg-[#FDFBF7]/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-6 md:p-8 opacity-90">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#1A1A1A]/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">
                      Top 10 Areas by Transaction Volume
                    </h3>
                    <p className="text-xs text-[#1A1A1A]/70">Full Year 2025 · Dubai Land Department (DLD)</p>
                  </div>
                </div>
                <AreasTable areas={topAreas2025} yearLabel="2025" />
              </div>
            </div>
          </div>

          {/* News Reporter Info - Victoria Hayes */}
          <div className="mt-8">
            <div className="p-3 md:p-4">
              <div className="bg-[#FDFBF7]/80 border border-[hsl(43,45%,54%)]/15 rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#1A1A1A]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face" 
                      alt="Victoria Hayes - News Reporter"
                      className="w-full h-full object-cover"
                     loading="lazy" decoding="async" />
                  </div>
                  <div>
                    <h3 className="text-[#1A1A1A] font-semibold text-lg mb-1">Victoria Hayes</h3>
                    <p className="text-[#1A1A1A] text-sm mb-3">Senior News Reporter, JBJ Global Real Estate</p>
                    <p className="text-[#1A1A1A]/70 text-sm mb-3">
                      Victoria curates the latest real estate news from official UAE government sources 
                      including Dubai Media Office, Dubai Land Department, Abu Dhabi Media Office, and Ministry of Economy. 
                      With over 12 years of experience in financial journalism, she ensures you stay informed of the latest market developments.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Dubai Media Office", "Dubai Land Dept", "Abu Dhabi Media", "Ministry of Economy", "RERA", "Knight Frank", "Property Monitor", "Gulf Business"].map((source) => (
                        <Badge key={source} variant="outline" className="text-[#1A1A1A] border-[#B89555]/30 text-xs">
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
