import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp, Shield, Building, Globe, Coins, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhyDubaiSection = () => {
  return (
    <section className="bg-black">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-4">
            Investment Insights
          </span>
          <h2 
            className="text-4xl md:text-5xl font-bold text-black mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Why Invest in the <span className="text-gold">UAE</span>?
          </h2>
          <p className="text-zinc-600 text-lg max-w-2xl mx-auto">
            The UAE offers unparalleled opportunities for property investors with world-class infrastructure and tax-free returns
          </p>
        </div>

        {/* Why UAE Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: Coins,
              title: "Tax-Free Returns",
              description: "No property tax, capital gains tax, or income tax on rental yields. Keep 100% of your investment returns.",
            },
            {
              icon: Shield,
              title: "Safe & Stable",
              description: "Political stability, strong regulatory framework, and one of the world's safest countries for living and investing.",
            },
            {
              icon: TrendingUp,
              title: "High Rental Yields",
              description: "Rental yields of 6-10% annually, significantly higher than most global cities like London or New York.",
            },
            {
              icon: Globe,
              title: "Golden Visa Program",
              description: "Property investments of AED 2M+ qualify investors to apply for long-term residency. Issuance is subject to government approval.",
            },
            {
              icon: Building,
              title: "100% Foreign Ownership",
              description: "Full freehold ownership rights for foreign investors in designated areas across the UAE.",
            },
            {
              icon: Landmark,
              title: "World-Class Infrastructure",
              description: "State-of-the-art airports, metros, and road networks. Home to iconic landmarks and luxury developments.",
            },
          ].map((item, index) => (
            <div 
              key={index}
              className="bg-white/80 backdrop-blur-sm border border-gold/30 rounded-2xl p-6 hover:border-gold/60 transition-all duration-300 group shadow-sm hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <item.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-black text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Why Dubai Section */}
        <div className="bg-gradient-to-br from-black via-zinc-900 to-black rounded-3xl border-2 border-gold/30 overflow-hidden shadow-[0_8px_30px_rgba(200,167,102,0.2)]">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Content Side */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <span className="inline-block px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs font-medium mb-4 w-fit">
                Featured City
              </span>
              <h3 
                className="text-3xl md:text-4xl font-bold text-white mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Why <span className="text-gold">Dubai</span>?
              </h3>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                Dubai is not just a city — it's a global phenomenon. As the business capital of the Middle East 
                and a luxury lifestyle destination, Dubai offers investors access to a market that attracts 
                over 16 million visitors annually.
              </p>
              
              <ul className="space-y-3 mb-8">
                {[
                  "Global business hub with 0% corporate tax",
                  "Home to 200+ nationalities & diverse communities",
                  "Expo 2020 legacy & upcoming mega projects",
                  "Smart city infrastructure & future-ready development",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-300 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link to="/">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90 font-semibold group w-fit">
                  Discover Properties
                  <ArrowUpRight className="w-4 h-4 ml-2 text-gold group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Image Side */}
            <div className="relative h-[300px] md:h-auto">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
              
              {/* Stats Overlay */}
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3">
                {[
                  { value: "16M+", label: "Annual Visitors" },
                  { value: "6–10%", label: "Avg. Rental Yield" },
                  { value: "#1", label: "Safest City" },
                ].map((stat, i) => (
                  <div key={i} className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-center border border-gold/30">
                    <div className="text-gold text-xl font-bold">{stat.value}</div>
                    <div className="text-zinc-400 text-xs">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Source Citations Bar */}
          <div className="border-t border-gold/20 px-8 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 bg-black/50">
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Sources:</span>
            {[
              { label: "#1 Safest City", source: "Numbeo Safety Index 2025" },
              { label: "#1 Prime Price Growth", source: "Knight Frank Global Cities Index" },
              { label: "#1 FDI in MENA", source: "fDi Intelligence, Financial Times" },
              { label: "Top 5 Most Visited", source: "Mastercard Destination Cities Index" },
            ].map((citation, i) => (
              <span key={i} className="text-zinc-500 text-xs">
                <span className="text-gold font-medium">{citation.label}</span>
                {" — "}
                <span className="italic">{citation.source}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyDubaiSection;
