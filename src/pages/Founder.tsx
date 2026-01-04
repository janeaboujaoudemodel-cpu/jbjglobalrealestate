import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Gem, Film, Shirt, Mail, Phone, ExternalLink, Award, Globe, Users, TrendingUp } from "lucide-react";
import Footer from "@/components/Footer";
import { useCountUp } from "@/hooks/useCountUp";

// Import all founder images
import founderHero from "@/assets/founder-hero.png";
import founderDark from "@/assets/founder-dark.png";
import jjFlags from "@/assets/jj-flags.png";
import founderOffice from "@/assets/founder-office.jpeg";
import founderJetBoarding from "@/assets/founder-jet-boarding.jpeg";
import founderJetInterior from "@/assets/founder-jet-interior.jpeg";
import founderProfessional from "@/assets/founder-professional.jpeg";
import founderYacht from "@/assets/founder-yacht.jpeg";
import founderAwardStage from "@/assets/founder-award-stage.jpeg";
import founderRedCarpet from "@/assets/founder-red-carpet.jpeg";

const CounterStat = ({ end, suffix, prefix, label, icon: Icon }: { end: number; suffix: string; prefix: string; label: string; icon?: any }) => {
  const { ref, formattedValue } = useCountUp({ end, suffix, prefix, duration: 2500 });

  return (
    <div ref={ref} className="text-center group">
      {Icon && (
        <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-[#A8925A]/20 to-[#A8925A]/5 rounded-xl flex items-center justify-center border border-[#A8925A]/20 group-hover:border-[#A8925A]/40 transition-colors">
          <Icon className="w-5 h-5 text-[#A8925A]" />
        </div>
      )}
      <p 
        className="text-transparent bg-clip-text bg-gradient-to-r from-[#A8925A] via-[#C4A962] to-[#A8925A] text-3xl md:text-4xl lg:text-5xl font-bold mb-2" 
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {formattedValue}
      </p>
      <p className="text-zinc-400 text-xs md:text-sm uppercase tracking-widest">{label}</p>
    </div>
  );
};

const Founder = () => {
  const divisions = [
    {
      icon: Building2,
      name: "JJ Global Capital",
      description: "The core advisory and investment arm of the group. JJ Global Capital provides structured guidance for real estate investment, with a primary focus on the UAE and Dubai markets. Built on discretion, standards, and an international client approach.",
      image: founderOffice,
    },
    {
      icon: Gem,
      name: "Maison Jane",
      description: "A luxury lifestyle, beauty, and wellness brand reflecting the founder's personal philosophy. Maison Jane delivers curated, experience-driven services with an emphasis on quality and authenticity.",
      image: founderJetInterior,
    },
    {
      icon: Film,
      name: "JJ Media Group",
      description: "The strategic media and communications division. JJ Media Group handles brand storytelling, digital presence, and influence strategy—structured for visibility, not mass exposure.",
      image: founderRedCarpet,
    },
    {
      icon: Shirt,
      name: "JJ Fashion House",
      description: "A creative direction and fashion division driven by taste and identity. JJ Fashion House extends the founder's aesthetic and standards into selective, design-focused projects.",
      image: founderAwardStage,
    },
  ];

  const philosophyItems = [
    {
      title: "Founder-Led Decision Making",
      description: "Strategic direction flows from the founder, ensuring consistency and alignment with core values across all divisions.",
      icon: Users,
    },
    {
      title: "Accountability",
      description: "Every entity operates with clear responsibility structures. Performance is measured, and standards are non-negotiable.",
      icon: Award,
    },
    {
      title: "Discretion",
      description: "Privacy and professionalism define client relationships. Visibility is earned through results, not promotion.",
      icon: Globe,
    },
    {
      title: "Standards Over Scale",
      description: "Growth is deliberate. The group prioritizes quality of service and depth of expertise over rapid expansion.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* HERO - CINEMATIC FULL BLEED */}
      <section className="relative min-h-screen flex items-end">
        {/* Background with parallax effect */}
        <div className="absolute inset-0">
          <img 
            src={founderHero} 
            alt="Jane Abou Jaoude - Founder & Chairwoman" 
            className="w-full h-full object-cover object-top"
          />
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-8 right-8 md:top-16 md:right-16 opacity-30">
          <div className="w-24 h-24 md:w-32 md:h-32 border border-[#A8925A]/40 rounded-full" />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 lg:pb-32">
          <div className="max-w-3xl">
            <div className="mb-6">
              <span className="inline-block bg-[#A8925A]/10 border border-[#A8925A]/30 text-[#A8925A] text-xs uppercase tracking-[0.3em] px-4 py-2 rounded-full backdrop-blur-sm">
                Founder & Chairwoman
              </span>
            </div>
            <h1 
              className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              JANE ABOU
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A8925A] to-[#C4A962]">
                JAOUDE
              </span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl lg:text-2xl mb-8 max-w-xl">
              JJ Holding Group
            </p>
            <p className="text-zinc-500 text-base md:text-lg italic max-w-lg border-l-2 border-[#A8925A]/50 pl-4">
              "Building institutions that outlast trends. Creating value through standards, not scale."
            </p>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-zinc-500">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-[#A8925A] to-transparent animate-pulse" />
        </div>
      </section>

      {/* INTRODUCTION - FOUNDER POSITIONING */}
      <section className="py-20 md:py-32 border-t border-zinc-800/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/20 to-black" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <span className="text-[#A8925A] text-sm uppercase tracking-[0.3em]">Leadership</span>
            </div>
            <p className="text-white text-2xl md:text-3xl lg:text-4xl leading-relaxed mb-8 font-light">
              JJ Holding Group is a <span className="text-[#A8925A]">founder-led</span>, multi-division holding built on unwavering standards, discretion, and long-term vision.
            </p>
            <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
              Every entity within the group reflects a deliberate approach to business—where quality supersedes quantity, and reputation is earned through consistent excellence.
            </p>
          </div>
        </div>
      </section>

      {/* THE FOUNDER - EDITORIAL LAYOUT */}
      <section className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            {/* Text Content */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="mb-8">
                <span className="text-[#A8925A] text-sm uppercase tracking-[0.3em]">The Founder</span>
              </div>
              <h2 
                className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Jane Abou
                <br />
                <span className="text-[#A8925A]">Jaoude</span>
              </h2>
              <div className="space-y-6 text-zinc-400 leading-relaxed">
                <p className="text-lg">
                  Jane Abou Jaoude serves as Founder and Chairwoman of JJ Holding Group. Her leadership is characterized by a composed, deliberate approach—where decisions are made with long-term positioning in mind.
                </p>
                <p>
                  With experience spanning business advisory, media, and luxury sectors, she has built a group of companies that reflect her standards: institutional in governance, refined in execution, and international in scope.
                </p>
                <p>
                  Based in Dubai, UAE, Jane leads with a philosophy rooted in accountability and discretion. Her approach to leadership prioritizes substance over visibility, building organizations designed to endure rather than simply expand.
                </p>
              </div>
            </div>
            
            {/* Photo Gallery */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {/* Main large photo */}
                <div className="col-span-2 aspect-[16/10] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/50">
                  <img 
                    src={founderProfessional} 
                    alt="Jane Abou Jaoude - Professional Portrait" 
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                  />
                </div>
                {/* Two smaller photos */}
                <div className="aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
                  <img 
                    src={founderJetBoarding} 
                    alt="Jane Abou Jaoude - International Travel" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
                  <img 
                    src={founderOffice} 
                    alt="Jane Abou Jaoude - Office" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JJ HOLDING GROUP - FLAGS VISUAL */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-zinc-900/50 via-black to-zinc-900/50 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #A8925A 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Flags Image */}
            <div className="order-2 lg:order-1">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                <img 
                  src={jjFlags} 
                  alt="JJ Holding Group & JJ Global Capital" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="order-1 lg:order-2">
              <div className="mb-8">
                <span className="text-[#A8925A] text-sm uppercase tracking-[0.3em]">The Group</span>
              </div>
              <h2 
                className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                JJ Holding
                <br />
                <span className="text-[#A8925A]">Group</span>
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                JJ Holding Group serves as the strategic umbrella for all entities under the founder's direction. Established to create a cohesive structure for ventures across distinct but complementary sectors, the group ensures that each brand operates with autonomy while sharing a unified standard of excellence.
              </p>
              <p className="text-zinc-500 leading-relaxed">
                The group's governance remains founder-led, ensuring that strategic decisions align with the long-term vision rather than short-term market pressures.
              </p>
            </div>
          </div>

          {/* Stats - Elevated Design */}
          <div className="mt-20 md:mt-32">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-[#A8925A]/30 transition-colors">
                <CounterStat end={4} suffix="" prefix="" label="Divisions" icon={Building2} />
              </div>
              <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-[#A8925A]/30 transition-colors">
                <CounterStat end={12} suffix="+" prefix="" label="Years Experience" icon={Award} />
              </div>
              <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-[#A8925A]/30 transition-colors">
                <CounterStat end={92} suffix="+" prefix="" label="Countries Served" icon={Globe} />
              </div>
              <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-[#A8925A]/30 transition-colors">
                <CounterStat end={2} suffix="B+" prefix="AED " label="Portfolio Value" icon={TrendingUp} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE GROUP DIVISIONS - PREMIUM CARDS */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <span className="text-[#A8925A] text-sm uppercase tracking-[0.3em]">Our Portfolio</span>
            <h2 
              className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mt-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              The Group <span className="text-[#A8925A]">Divisions</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {divisions.map((division, index) => (
              <div 
                key={division.name}
                className="group relative bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black border border-zinc-800 rounded-2xl overflow-hidden hover:border-[#A8925A]/40 transition-all duration-500"
              >
                {/* Background Image */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
                  <img 
                    src={division.image} 
                    alt={division.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/70" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 p-8 md:p-10">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#A8925A]/20 to-[#A8925A]/5 rounded-xl flex items-center justify-center border border-[#A8925A]/30 group-hover:border-[#A8925A]/50 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                      <division.icon className="w-8 h-8 text-[#A8925A]" />
                    </div>
                    <div>
                      <h3 className="text-white text-xl md:text-2xl font-semibold mb-4 group-hover:text-[#A8925A] transition-colors">
                        {division.name}
                      </h3>
                      <p className="text-zinc-400 leading-relaxed">
                        {division.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#A8925A]/10 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP PHILOSOPHY */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-black via-zinc-900/30 to-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <span className="text-[#A8925A] text-sm uppercase tracking-[0.3em]">Philosophy</span>
            <h2 
              className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mt-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Leadership <span className="text-[#A8925A]">Philosophy</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {philosophyItems.map((item, index) => (
              <div 
                key={item.title}
                className="group bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-[#A8925A]/30 transition-all duration-300 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-6 bg-gradient-to-br from-[#A8925A]/20 to-[#A8925A]/5 rounded-full flex items-center justify-center border border-[#A8925A]/20 group-hover:border-[#A8925A]/40 group-hover:scale-110 transition-all duration-300">
                  <item.icon className="w-6 h-6 text-[#A8925A]" />
                </div>
                <h4 className="text-[#A8925A] text-sm uppercase tracking-wider mb-3 font-medium">
                  {item.title}
                </h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PULL-QUOTE BLOCK - CINEMATIC */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={founderDark} 
            alt="Jane Abou Jaoude" 
            className="w-full h-full object-cover object-top opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-6 md:gap-8">
              <div className="w-1 md:w-2 h-32 md:h-40 bg-gradient-to-b from-[#A8925A] via-[#A8925A]/50 to-transparent flex-shrink-0 rounded-full" />
              <div>
                <blockquote className="text-white text-2xl md:text-3xl lg:text-4xl italic leading-relaxed font-light">
                  "True value is built quietly. The work speaks. The results compound. The institutions remain."
                </blockquote>
                <footer className="mt-8 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#A8925A]/50">
                    <img src={founderProfessional} alt="Jane Abou Jaoude" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[#A8925A] font-medium">Jane Abou Jaoude</p>
                    <p className="text-zinc-500 text-sm">Founder & Chairwoman</p>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIFESTYLE GALLERY */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-[#A8925A] text-sm uppercase tracking-[0.3em]">International</span>
            <h2 
              className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mt-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Global <span className="text-[#A8925A]">Presence</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="col-span-2 row-span-2 aspect-square md:aspect-auto rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
              <img 
                src={founderJetInterior} 
                alt="Private Aviation" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden border border-zinc-800">
              <img 
                src={founderYacht} 
                alt="Luxury Lifestyle" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden border border-zinc-800">
              <img 
                src={founderRedCarpet} 
                alt="Red Carpet Events" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden border border-zinc-800">
              <img 
                src={founderAwardStage} 
                alt="Award Ceremonies" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden border border-zinc-800">
              <img 
                src={founderJetBoarding} 
                alt="International Travel" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* LOOKING AHEAD */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-zinc-900/50 via-black to-zinc-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="mb-8">
                <span className="text-[#A8925A] text-sm uppercase tracking-[0.3em]">Vision</span>
              </div>
              <h2 
                className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Looking <span className="text-[#A8925A]">Ahead</span>
              </h2>
              <div className="space-y-6 text-zinc-400 leading-relaxed text-lg">
                <p>
                  JJ Holding Group continues to expand its presence across strategic sectors, guided by the same principles that established its foundation.
                </p>
                <p>
                  Future initiatives will deepen existing capabilities while exploring complementary opportunities in emerging markets.
                </p>
                <p>
                  JJ Global Capital remains committed to serving discerning investors with access to the UAE's most compelling real estate opportunities, with expanded advisory services planned for select international markets.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
                <img 
                  src={founderOffice} 
                  alt="Leadership" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800 shadow-xl mt-8">
                <img 
                  src={founderProfessional} 
                  alt="Future Vision" 
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA - CONNECTION */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-black via-zinc-900/50 to-black border-t border-zinc-800/50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-[#A8925A] to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <span className="text-[#A8925A] text-sm uppercase tracking-[0.3em]">Get in Touch</span>
            </div>
            <h2 
              className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Connect with <span className="text-[#A8925A]">JJ Holding Group</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-12 max-w-2xl mx-auto">
              For investment inquiries, media requests, or partnership discussions, we welcome your correspondence.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link 
                to="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#A8925A] to-[#C4A962] text-black font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-[#A8925A]/20 hover:shadow-[#A8925A]/30 hover:scale-105"
              >
                Connect <ArrowUpRight className="w-5 h-5" />
              </Link>
              <a 
                href="mailto:media@jjglobalcapital.com"
                className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300"
              >
                Media <Mail className="w-5 h-5" />
              </a>
              <a 
                href="mailto:partnerships@jjglobalcapital.com"
                className="inline-flex items-center gap-2 border border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-900 transition-all duration-300"
              >
                Partnership <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-zinc-400">
              <a 
                href="mailto:invest@jjglobalcapital.com" 
                className="hover:text-[#A8925A] transition-colors flex items-center gap-2 group"
              >
                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-[#A8925A]/50 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                invest@JJglobalcapital.com
              </a>
              <a 
                href="tel:+97144586845" 
                className="hover:text-[#A8925A] transition-colors flex items-center gap-2 group"
              >
                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-[#A8925A]/50 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                +971 4 458 6845
              </a>
            </div>

            <div className="mt-12 pt-12 border-t border-zinc-800">
              <a 
                href="https://jjholdinggroup.com" 
                className="text-[#A8925A] hover:underline inline-flex items-center gap-2 text-sm"
              >
                Visit JJ Holding Group <ExternalLink className="w-4 h-4" />
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
