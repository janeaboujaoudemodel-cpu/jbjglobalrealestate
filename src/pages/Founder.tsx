import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Gem, Film, Shirt, Mail, Phone, ExternalLink } from "lucide-react";
import Footer from "@/components/Footer";
import { useCountUp } from "@/hooks/useCountUp";
import founderSpeaking from "@/assets/founder-speaking.png";
import founderYacht from "@/assets/founder-yacht.jpeg";
import founderLifestyle from "@/assets/founder-lifestyle.jpeg";
import founderAward from "@/assets/founder-award.jpeg";
import awardTrophy from "@/assets/award-trophy.jpeg";

const CounterStat = ({ end, suffix, prefix, label }: { end: number; suffix: string; prefix: string; label: string }) => {
  const { ref, formattedValue } = useCountUp({ end, suffix, prefix, duration: 2500 });

  return (
    <div ref={ref} className="text-center">
      <p 
        className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-dark to-gold text-3xl md:text-4xl font-bold mb-2" 
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {formattedValue}
      </p>
      <p className="text-zinc-400 text-xs md:text-sm uppercase tracking-wider">{label}</p>
    </div>
  );
};

const Founder = () => {
  const divisions = [
    {
      icon: Building2,
      name: "JJ Global Capital",
      description: "The core advisory and investment arm of the group. JJ Global Capital provides structured guidance for real estate investment, with a primary focus on the UAE and Dubai markets. Built on discretion, standards, and an international client approach.",
    },
    {
      icon: Gem,
      name: "Maison Jane",
      description: "A luxury lifestyle, beauty, and wellness brand reflecting the founder's personal philosophy. Maison Jane delivers curated, experience-driven services with an emphasis on quality and authenticity.",
    },
    {
      icon: Film,
      name: "JJ Media Group",
      description: "The strategic media and communications division. JJ Media Group handles brand storytelling, digital presence, and influence strategy—structured for visibility, not mass exposure.",
    },
    {
      icon: Shirt,
      name: "JJ Fashion House",
      description: "A creative direction and fashion division driven by taste and identity. JJ Fashion House extends the founder's aesthetic and standards into selective, design-focused projects.",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* HERO - FOUNDER LED */}
      <section className="relative min-h-[90vh] flex items-end">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={founderSpeaking} 
            alt="Jane Abou Jaoude" 
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pb-16 md:pb-24">
          <div className="max-w-2xl">
            <h1 
              className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              JANE ABOU JAOUDE
            </h1>
            <p className="text-gold text-lg md:text-xl font-medium mb-2">
              Founder & Chairwoman
            </p>
            <p className="text-zinc-400 text-lg md:text-xl mb-6">
              JJ Holding Group
            </p>
            <p className="text-zinc-500 text-sm md:text-base italic max-w-lg">
              "Building institutions that outlast trends. Creating value through standards, not scale."
            </p>
          </div>
        </div>
      </section>

      {/* INTRODUCTION - FOUNDER POSITIONING */}
      <section className="py-20 md:py-28 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gold text-sm uppercase tracking-widest mb-6">Leadership</p>
            <p className="text-zinc-300 text-lg md:text-xl leading-relaxed mb-6">
              JJ Holding Group is a founder-led, multi-division holding built on unwavering standards, discretion, and long-term vision. Every entity within the group reflects a deliberate approach to business—where quality supersedes quantity, and reputation is earned through consistent excellence.
            </p>
            <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
              Under the leadership of Jane Abou Jaoude, the group operates across investment and advisory, luxury services, media and communications, and fashion and creative industries—each division governed by the same principles that define the founder's personal philosophy.
            </p>
          </div>
        </div>
      </section>

      {/* THE FOUNDER */}
      <section className="py-20 md:py-28 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-gold text-sm uppercase tracking-widest mb-6">The Founder</p>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold mb-8"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Jane Abou Jaoude
              </h2>
              <div className="space-y-6 text-zinc-400 leading-relaxed">
                <p>
                  Jane Abou Jaoude serves as Founder and Chairwoman of JJ Holding Group. Her leadership is characterized by a composed, deliberate approach—where decisions are made with long-term positioning in mind, and growth is measured by impact rather than volume.
                </p>
                <p>
                  With experience spanning business advisory, media, and luxury sectors, she has built a group of companies that reflect her standards: institutional in governance, refined in execution, and international in scope.
                </p>
                <p>
                  Based in Dubai, UAE, Jane leads with a philosophy rooted in accountability and discretion. Her approach to leadership prioritizes substance over visibility, building organizations designed to endure rather than simply expand.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800">
                <img 
                  src={founderLifestyle} 
                  alt="Jane Abou Jaoude" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-xl overflow-hidden border-2 border-gold/30 shadow-2xl hidden md:block">
                <img 
                  src={awardTrophy} 
                  alt="Award" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JJ HOLDING GROUP */}
      <section className="py-20 md:py-28 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-gold text-sm uppercase tracking-widest mb-6">The Group</p>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                JJ Holding Group
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                JJ Holding Group serves as the strategic umbrella for all entities under the founder's direction. Established to create a cohesive structure for ventures across distinct but complementary sectors, the group ensures that each brand operates with autonomy while sharing a unified standard of excellence.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 py-8 border-y border-zinc-800">
              <CounterStat end={4} suffix="" prefix="" label="Divisions" />
              <CounterStat end={12} suffix="+" prefix="" label="Years Experience" />
              <CounterStat end={92} suffix="+" prefix="" label="Countries Served" />
              <CounterStat end={2} suffix="B+" prefix="AED " label="Portfolio Value" />
            </div>

            <p className="text-zinc-400 text-center leading-relaxed">
              The group's governance remains founder-led, ensuring that strategic decisions align with the long-term vision rather than short-term market pressures. This structure allows for disciplined growth and maintains the integrity that defines each division.
            </p>
          </div>
        </div>
      </section>

      {/* THE GROUP DIVISIONS */}
      <section className="py-20 md:py-28 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-gold text-sm uppercase tracking-widest mb-6">Our Portfolio</p>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              The Group Divisions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {divisions.map((division) => (
              <div 
                key={division.name}
                className="group bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8 hover:border-gold/30 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                  <division.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-white text-xl font-semibold mb-4">{division.name}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">{division.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP PHILOSOPHY */}
      <section className="py-20 md:py-28 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-gold text-sm uppercase tracking-widest mb-6">Philosophy</p>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Leadership Philosophy
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-gold text-sm uppercase tracking-wider mb-2">Founder-Led Decision Making</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Strategic direction flows from the founder, ensuring consistency and alignment with core values across all divisions.
                  </p>
                </div>
                <div>
                  <h4 className="text-gold text-sm uppercase tracking-wider mb-2">Accountability</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Every entity operates with clear responsibility structures. Performance is measured, and standards are non-negotiable.
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-gold text-sm uppercase tracking-wider mb-2">Discretion</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Privacy and professionalism define client relationships. Visibility is earned through results, not promotion.
                  </p>
                </div>
                <div>
                  <h4 className="text-gold text-sm uppercase tracking-wider mb-2">Standards Over Scale</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Growth is deliberate. The group prioritizes quality of service and depth of expertise over rapid expansion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PULL-QUOTE BLOCK */}
      <section className="py-16 md:py-24 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto flex items-start gap-6">
            <div className="w-1 h-24 bg-gradient-to-b from-gold/60 to-transparent flex-shrink-0" />
            <blockquote className="text-zinc-300 text-xl md:text-2xl italic leading-relaxed">
              "True value is built quietly. The work speaks. The results compound. The institutions remain."
              <footer className="text-gold text-sm mt-4 not-italic">
                — Jane Abou Jaoude
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* LOOKING AHEAD */}
      <section className="py-20 md:py-28 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gold text-sm uppercase tracking-widest mb-6">Vision</p>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold mb-8"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Looking Ahead
              </h2>
              <div className="space-y-6 text-zinc-400 leading-relaxed">
                <p>
                  JJ Holding Group continues to expand its presence across strategic sectors, guided by the same principles that established its foundation. Future initiatives will deepen existing capabilities while exploring complementary opportunities in emerging markets.
                </p>
                <p>
                  JJ Global Capital remains committed to serving discerning investors with access to the UAE's most compelling real estate opportunities, with expanded advisory services planned for select international markets.
                </p>
                <p>
                  Each division will evolve in alignment with the founder's vision—measured growth, maintained standards, and an unwavering commitment to the clients and partners who trust the group with their most significant decisions.
                </p>
              </div>
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800">
              <img 
                src={founderYacht} 
                alt="Jane Abou Jaoude in Dubai" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA - CONNECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-zinc-900 to-black border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 
              className="text-white text-2xl md:text-3xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Connect with JJ Holding Group
            </h2>
            <p className="text-zinc-400 mb-10 max-w-xl mx-auto">
              For investment inquiries, media requests, or partnership discussions, we welcome your correspondence.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <Link 
                to="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Connect <ArrowUpRight className="w-4 h-4" />
              </Link>
              <a 
                href="mailto:media@jjglobalcapital.com"
                className="inline-flex items-center gap-2 bg-zinc-800 text-white font-semibold px-6 py-3 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Media <Mail className="w-4 h-4" />
              </a>
              <a 
                href="mailto:partnerships@jjglobalcapital.com"
                className="inline-flex items-center gap-2 border border-zinc-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Partnership <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-zinc-400 text-sm">
              <a 
                href="mailto:invest@jjglobalcapital.com" 
                className="hover:text-gold transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" /> invest@JJglobalcapital.com
              </a>
              <a 
                href="tel:+97144586845" 
                className="hover:text-gold transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> +971 4 458 6845
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-800">
              <a 
                href="https://jjholdinggroup.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gold text-sm hover:underline inline-flex items-center gap-1"
              >
                Visit JJ Holding Group <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Founder;
