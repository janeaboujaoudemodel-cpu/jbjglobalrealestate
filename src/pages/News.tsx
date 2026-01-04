import { useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, ChevronRight, ArrowLeft, Calendar, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

// Real UAE property news - 2025/2026
const newsArticles = [
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
    source: "JJ Global Capital Research",
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

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["All", "Market Update", "Analysis", "Policy", "Economic", "Monthly Report", "Market Outlook"];

  const filteredNews = selectedCategory && selectedCategory !== "All"
    ? newsArticles.filter(n => n.category === selectedCategory)
    : newsArticles;

  return (
    <section className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative py-16 md:py-24 bg-gradient-to-b from-black via-zinc-950 to-zinc-950">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Properties
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
              <Newspaper className="w-7 h-7 text-gold" />
            </div>
            <div>
              <h1 
                className="text-4xl md:text-5xl font-bold text-white"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                News & <span className="text-gold">Insights</span>
              </h1>
            </div>
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Stay informed about the latest UAE real estate market updates, economic developments, and investment opportunities
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-b border-zinc-800 sticky top-16 bg-zinc-950/95 backdrop-blur-sm z-20">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === "All" ? null : category)}
                className={`px-5 py-2.5 text-sm whitespace-nowrap transition-all duration-300 rounded-full font-medium ${
                  (category === "All" && !selectedCategory) || selectedCategory === category
                    ? "bg-gradient-to-r from-gold to-gold-dark text-black shadow-lg shadow-gold/20"
                    : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Featured Article */}
        {filteredNews.length > 0 && (
          <div className="mb-12">
            <article className="group relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden hover:border-gold/30 transition-all duration-500">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="aspect-video md:aspect-auto md:h-full relative overflow-hidden">
                  <img 
                    src={filteredNews[0].image} 
                    alt={filteredNews[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/50" />
                </div>

                {/* Content */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs text-black bg-gold px-3 py-1 rounded-full font-medium">
                      Featured
                    </span>
                    <span className="text-xs text-gold bg-gold/10 px-3 py-1 rounded-full">
                      {filteredNews[0].category}
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-gold transition-colors line-clamp-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {filteredNews[0].title}
                  </h2>

                  <p className="text-zinc-400 mb-6 line-clamp-3">
                    {filteredNews[0].excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
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
                    <div className="flex items-center text-gold font-medium">
                      <span>Read More</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Rest of Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.slice(1).map((article) => (
            <article 
              key={article.id}
              className="group bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-gold/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/5"
            >
              {/* Image */}
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="text-xs text-gold bg-gold/10 backdrop-blur-sm px-3 py-1 rounded-full border border-gold/20">
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span>{article.source}</span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold transition-colors line-clamp-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {article.title}
                </h3>

                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
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

        {/* Market Stats Banner */}
        <div className="mt-16 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-gold" />
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
              Key Market Statistics — 2025
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-gold mb-1">AED 328.8B</p>
              <p className="text-sm text-zinc-400">H1 2025 Transaction Value</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-gold mb-1">99,000+</p>
              <p className="text-sm text-zinc-400">H1 2025 Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-gold mb-1">+23.7%</p>
              <p className="text-sm text-zinc-400">YoY Volume Growth</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-gold mb-1">+41%</p>
              <p className="text-sm text-zinc-400">YoY Value Growth</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-6 text-center">
            Source: Dubai Land Department, Christie's Real Estate Dubai, Property Finder
          </p>
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default News;