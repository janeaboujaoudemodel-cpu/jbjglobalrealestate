import { Award, Users, Building2, Globe, Target, Shield } from "lucide-react";
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

const About = () => {
  const stats = [
    { end: 2, suffix: "B+", prefix: "AED ", label: "Portfolio Value" },
    { end: 12, suffix: "+", prefix: "", label: "Years Experience" },
    { end: 3900, suffix: "+", prefix: "", label: "Properties Sold" },
    { end: 4200, suffix: "+", prefix: "", label: "Properties Managed" },
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Integrity",
      description: "We build lasting relationships founded on transparency, honesty, and unwavering commitment to our clients' best interests.",
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Every transaction is handled with meticulous attention to detail, ensuring exceptional outcomes for our distinguished clientele.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Our international network connects investors worldwide to the UAE's most exclusive opportunities.",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />
        <div className="relative container mx-auto px-4">
          <p className="text-gold text-sm uppercase tracking-widest mb-4">About Us</p>
          <h1 
            className="text-white text-4xl md:text-6xl font-bold mb-6 max-w-3xl"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Redefining Luxury Investment in the UAE
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
            JJ Global Capital stands as the UAE's premier investment advisory, trusted by discerning investors 
            worldwide to navigate the region's most lucrative opportunities with confidence and precision.
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
            {stats.map((stat) => (
              <CounterStat key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gold text-sm uppercase tracking-widest mb-4">Our Story</p>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Built on Vision, Driven by Results
              </h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  Founded in the heart of Dubai, JJ Global Capital emerged from a singular vision: to provide 
                  ultra-high-net-worth individuals with unparalleled access to the UAE's most exclusive investment opportunities.
                </p>
                <p>
                  Our team of seasoned professionals brings together decades of experience in real estate, 
                  finance, and luxury services, creating a holistic approach to wealth management that 
                  transcends traditional boundaries.
                </p>
                <p>
                  Today, we are proud to be recognized as the region's most trusted investment advisory, 
                  serving clients from over 92 countries who entrust us with their most significant financial decisions.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-8 border border-zinc-800">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center p-6 bg-black/50 rounded-xl">
                  <Building2 className="w-10 h-10 text-gold mb-3" />
                  <span className="text-white font-semibold">Real Estate</span>
                </div>
                <div className="flex flex-col items-center p-6 bg-black/50 rounded-xl">
                  <Award className="w-10 h-10 text-gold mb-3" />
                  <span className="text-white font-semibold">Advisory</span>
                </div>
                <div className="flex flex-col items-center p-6 bg-black/50 rounded-xl">
                  <Users className="w-10 h-10 text-gold mb-3" />
                  <span className="text-white font-semibold">Concierge</span>
                </div>
                <div className="flex flex-col items-center p-6 bg-black/50 rounded-xl">
                  <Globe className="w-10 h-10 text-gold mb-3" />
                  <span className="text-white font-semibold">Global</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gold text-sm uppercase tracking-widest mb-4">Our Values</p>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              The Pillars of Our Success
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div 
                key={value.title}
                className="bg-black border border-zinc-800 rounded-xl p-8 hover:border-gold/30 transition-colors"
              >
                <value.icon className="w-12 h-12 text-gold mb-6" />
                <h3 className="text-white text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
