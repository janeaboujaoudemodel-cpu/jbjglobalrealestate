import { Trophy, Star, Award, Medal } from "lucide-react";
import Footer from "@/components/Footer";
import { useCountUp } from "@/hooks/useCountUp";

const CounterStat = ({ end, suffix, prefix, label }: { end: number; suffix: string; prefix: string; label: string }) => {
  const { ref, formattedValue } = useCountUp({ end, suffix, prefix, duration: 2500 });

  return (
    <div ref={ref} className="text-center">
      <p 
        className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-dark to-gold text-4xl md:text-5xl font-bold mb-2" 
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {formattedValue}
      </p>
      <p className="text-zinc-400 text-sm uppercase tracking-wider">{label}</p>
    </div>
  );
};

const Awards = () => {
  const awards = [
    {
      year: "2025",
      title: "Best Real Estate Advisory Firm",
      organization: "Arabian Business Awards",
      icon: Trophy,
    },
    {
      year: "2024",
      title: "Excellence in Property Investment",
      organization: "Gulf Real Estate Awards",
      icon: Star,
    },
    {
      year: "2024",
      title: "Top Luxury Real Estate Agency",
      organization: "Dubai Property Excellence",
      icon: Award,
    },
    {
      year: "2023",
      title: "Outstanding Client Service",
      organization: "Middle East Business Leaders",
      icon: Medal,
    },
    {
      year: "2023",
      title: "Innovation in Real Estate Technology",
      organization: "PropTech Arabia",
      icon: Star,
    },
    {
      year: "2022",
      title: "Best International Real Estate Firm",
      organization: "International Property Awards",
      icon: Trophy,
    },
  ];

  const recognitions = [
    { end: 25, suffix: "+", prefix: "", label: "Industry Awards" },
    { end: 12, suffix: "+", prefix: "", label: "Years of Excellence" },
    { end: 98, suffix: "%", prefix: "", label: "Client Satisfaction" },
    { end: 92, suffix: "+", prefix: "", label: "Countries Served" },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />
        <div className="relative container mx-auto px-4">
          <p className="text-gold text-sm uppercase tracking-widest mb-4">Our Awards</p>
          <h1 
            className="text-white text-4xl md:text-6xl font-bold mb-6 max-w-3xl"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Recognized for Excellence
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
            Our commitment to exceptional service and outstanding results has earned us 
            recognition from the industry's most prestigious organizations.
          </p>
        </div>
      </section>

      {/* Stats with Counter Animation */}
      <section className="py-16 border-y border-zinc-800 relative overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, hsl(40 32% 51% / 0.06) 0%, transparent 60%)",
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {recognitions.map((item) => (
              <CounterStat key={item.label} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* Awards Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {awards.map((award, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-8 hover:border-gold/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <award.icon className="w-7 h-7 text-gold" />
                  </div>
                  <span className="text-gold text-sm font-semibold">{award.year}</span>
                </div>
                <h3 className="text-white text-xl font-semibold mb-2">{award.title}</h3>
                <p className="text-zinc-500 text-sm">{award.organization}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-zinc-900/30">
        <div className="container mx-auto px-4 text-center">
          <h2 
            className="text-white text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Experience Award-Winning Service
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Join the thousands of satisfied clients who have trusted JJ Global Capital 
            with their most important investment decisions.
          </p>
          <a 
            href="https://jjglobalcapital.com/form/property-investment-inquiry-form/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold px-8 py-4 rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started Today
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Awards;
