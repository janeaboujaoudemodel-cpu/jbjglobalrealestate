import { Trophy, Star, Award, Medal } from "lucide-react";
import Footer from "@/components/Footer";
import { useCountUp } from "@/hooks/useCountUp";
import { COMPANY_STATS, CONTACT_INFO } from "@/constants/stats";
import { SEOHead, pagesSEO } from "@/components/SEOHead";

const CounterStat = ({ end, suffix, prefix, label }: { end: number; suffix: string; prefix: string; label: string }) => {
  const { ref, formattedValue } = useCountUp({ end, suffix, prefix, duration: 2500 });

  return (
    <div ref={ref} className="text-center">
      <p 
        className="text-gold text-4xl md:text-5xl font-bold mb-2" 
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {formattedValue}
      </p>
      <p className="text-black text-sm uppercase tracking-wider">{label}</p>
    </div>
  );
};

const Awards = () => {
  // Use centralized stats
  const recognitions = [
    COMPANY_STATS.yearsInDubai,
    COMPANY_STATS.brokersTrainedBy,
    COMPANY_STATS.socialFollowers,
    COMPANY_STATS.teamManaged,
  ];

  // Empty placeholder awards - will be populated with real data later
  const placeholderAwards = [
    { icon: Trophy },
    { icon: Star },
    { icon: Award },
    { icon: Medal },
    { icon: Trophy },
    { icon: Star },
  ];

  return (
    <>
      <SEOHead {...pagesSEO.awards} />
      <div className="min-h-screen bg-black">
        {/* Hero Section - 3-Layer System */}
        <section className="relative py-24 md:py-32 bg-black">
          {/* Layer 2 - Active Champagne with global gutter */}
          <div className="jj-layer-2">
            <div className="jj-layer-active rounded-2xl p-6 md:p-10">
              <p className="text-gold text-sm uppercase tracking-widest mb-4">Awards & Recognition</p>
              <h1 
                className="text-black text-4xl md:text-6xl font-bold mb-6 max-w-3xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Recognized for <span className="text-gold">Excellence</span>
              </h1>
              <p className="text-zinc-700 text-lg max-w-2xl leading-relaxed">
                Our commitment to exceptional service and outstanding results has earned us 
                recognition from the industry's most prestigious organizations.
              </p>
            </div>
          </div>
        </section>

        {/* Stats with Counter Animation - 3-Layer System */}
        <section className="py-16 bg-black relative overflow-hidden">
          <div className="jj-layer-2">
            <div className="jj-layer-active rounded-2xl p-6 md:p-10 relative">
              {/* Subtle radial glow */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, hsl(40 32% 51% / 0.08) 0%, transparent 60%)",
                }}
              />
              <div className="relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {recognitions.map((item) => (
                    <div 
                      key={item.label}
                      className="jj-card-inner rounded-xl p-6 border-2 border-gold transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1"
                    >
                      <CounterStat {...item} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Awards Grid - 3-Layer System with Empty Placeholders */}
        <section className="py-20 bg-black">
          <div className="jj-layer-2">
            <div className="jj-layer-active rounded-2xl p-6 md:p-10">
              {/* Section Header */}
              <div className="text-center mb-12">
                <span className="text-gold text-sm uppercase tracking-[0.4em]">Recognition</span>
                <div className="w-32 mx-auto mt-4 mb-8 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                <h2 
                  className="text-black text-3xl md:text-4xl font-bold"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Awards & <span className="text-gold">Achievements</span>
                </h2>
                <p className="text-zinc-600 text-base mt-4 max-w-xl mx-auto">
                  Award entries will be added as they are verified and confirmed.
                </p>
              </div>

              {/* Empty Placeholder Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {placeholderAwards.map((award, index) => (
                  <div 
                    key={index}
                    className="jj-card-inner border-2 border-gold rounded-xl p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1 group"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-gold group-hover:shadow-[0_4px_15px_rgba(200,167,102,0.4)] transition-all"
                        style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}
                      >
                        <award.icon className="w-7 h-7 text-black" />
                      </div>
                      <span className="text-gold text-sm font-semibold">—</span>
                    </div>
                    <h3 className="text-black text-xl font-semibold mb-2">Award Title</h3>
                    <p className="text-zinc-500 text-sm">Awarding Organization</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA - 3-Layer System */}
        <section className="py-20 bg-black">
          <div className="jj-layer-2">
            <div className="max-w-[1100px] mx-auto">
              {/* Active Champagne Layer */}
              <div className="jj-layer-active rounded-2xl p-4 sm:p-6">
                {/* Locked Champagne Inner Card */}
                <div className="jj-card-inner border-2 border-gold rounded-xl p-8 md:p-12 text-center shadow-[0_0_30px_rgba(200,167,102,0.25)]">
                  <h2 
                    className="text-black text-3xl md:text-4xl font-bold mb-4"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Experience Award-Winning <span className="text-gold">Service</span>
                  </h2>
                  <p className="text-zinc-600 mb-8 max-w-xl mx-auto">
                    Join the thousands of satisfied clients who have trusted JBJ Global Real Estate 
                    with their property decisions.
                  </p>
                  <a 
                    href={CONTACT_INFO.inquiryFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                      boxShadow: `
                        0 10px 30px rgba(200,167,102,0.4),
                        0 6px 15px rgba(0,0,0,0.2),
                        inset 0 2px 4px rgba(255,255,255,0.9),
                        inset 0 -2px 4px rgba(200,167,102,0.2),
                        0 0 20px rgba(200,167,102,0.3)
                      `,
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                    <span className="relative text-black group-hover:text-gold transition-colors">Get Started</span>
                    <span className="relative text-gold group-hover:text-black transition-colors">Today</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Awards;
