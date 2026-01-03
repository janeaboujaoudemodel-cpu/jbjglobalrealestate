import { useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, Clock, ChevronRight, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

// Placeholder news data - this will be replaced with Supabase data later
const placeholderNews = [
  {
    id: "1",
    title: "Dubai Real Estate Market Hits Record High in 2024",
    excerpt: "The Dubai property market continues its remarkable growth trajectory with unprecedented sales volumes...",
    category: "Market Update",
    date: "2024-01-15",
    image: null,
  },
  {
    id: "2", 
    title: "New Visa Reforms Boost UAE Property Investment",
    excerpt: "Recent changes to UAE visa policies are attracting more international investors to the property market...",
    category: "Policy",
    date: "2024-01-12",
    image: null,
  },
  {
    id: "3",
    title: "Top 10 Communities for Investment in 2024",
    excerpt: "Our analysis reveals the most promising areas for real estate investment this year...",
    category: "Analysis",
    date: "2024-01-10",
    image: null,
  },
];

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["All", "Market Update", "Policy", "Analysis", "Economic", "Lifestyle"];

  const filteredNews = selectedCategory && selectedCategory !== "All"
    ? placeholderNews.filter(n => n.category === selectedCategory)
    : placeholderNews;

  return (
    <section className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative py-16 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 
                className="text-3xl md:text-4xl font-bold text-white"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                News & Insights
              </h1>
              <p className="text-zinc-400">
                Stay informed about UAE real estate and economic developments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === "All" ? null : category)}
                className={`px-4 py-2 text-sm whitespace-nowrap transition-colors rounded ${
                  (category === "All" && !selectedCategory) || selectedCategory === category
                    ? "bg-gold text-black"
                    : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="container mx-auto px-4 py-12">
        {filteredNews.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">Coming Soon</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              We're curating the latest news and insights about UAE real estate. 
              Check back soon for updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((article) => (
              <article 
                key={article.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-gold/30 transition-all duration-300"
              >
                {/* Image Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <Newspaper className="w-12 h-12 text-zinc-700" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gold bg-gold/10 px-2 py-1 rounded">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(article.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center text-gold text-sm">
                    <span>Read More</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Admin Notice */}
        <div className="mt-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center">
          <p className="text-zinc-400 text-sm">
            This page is ready for content. News articles will be managed through the Admin Panel.
          </p>
        </div>
      </div>
    </section>
  );
};

export default News;
