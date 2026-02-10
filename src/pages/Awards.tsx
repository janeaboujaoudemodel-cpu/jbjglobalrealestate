import { useCountUp } from "@/hooks/useCountUp";
import { COMPANY_STATS, CONTACT_INFO } from "@/constants/stats";
import { SEOHead, pagesSEO } from "@/components/SEOHead";

// Award images
import award01 from "@/assets/awards/dubai-holding-2018.png";
import award02 from "@/assets/awards/emaar-top-broker-2019.png";
import award03 from "@/assets/awards/meraas-1st-q4-2019.png";
import award04 from "@/assets/awards/meraas-2nd-q3-2019.png";
import award05 from "@/assets/awards/damac-elite-q3-2020.png";
import award06 from "@/assets/awards/damac-top-agency-q1-2021.png";
import award07 from "@/assets/awards/emaar-q2-no11-2021a.png";
import award08 from "@/assets/awards/emaar-q2-no11-2021b.png";
import award09 from "@/assets/awards/tilal-al-ghaf-1st-2021.png";
import award10 from "@/assets/awards/damac-top-performer-q3-2021.png";
import award11 from "@/assets/awards/meydan-diamond-club-2022.png";
import award12 from "@/assets/awards/meraas-black-onyx-2023.png";
import award13 from "@/assets/awards/emaar-q2-no12-2023.png";
import award14 from "@/assets/awards/jbj-trophy.png";
import award15 from "@/assets/awards/sobha-top-broker.png";
import award16 from "@/assets/awards/emaar-q3-no2-2024a.png";
import award17 from "@/assets/awards/emaar-q3-no2-2024b.png";
import award18 from "@/assets/awards/sobha-3rd-partner-2024.png";

const AWARDS_DATA = [
  { image: award01, title: "Partnership Recognition", organization: "Dubai Holding", year: "2018" },
  { image: award02, title: "Top Broker Award", organization: "Emaar", year: "2019" },
  { image: award03, title: "1st Place - Top Performing Q4", organization: "Meraas", year: "2019" },
  { image: award04, title: "2nd Place - Top Performing Broker Q3", organization: "Meraas", year: "2019" },
  { image: award05, title: "Elite Partners of Q3", organization: "DAMAC", year: "2020" },
  { image: award06, title: "Top Agency Q1 Broker Awards", organization: "DAMAC", year: "2021" },
  { image: award07, title: "Quarter 2 Broker Awards - No. 11", organization: "Emaar", year: "2021" },
  { image: award08, title: "Quarter 2 Broker Awards - No. 11", organization: "Emaar", year: "2021" },
  { image: award09, title: "1st Place - Top Performing Partner", organization: "Tilal Al Ghaf / Majid Al Futtaim", year: "2021" },
  { image: award10, title: "Top Performer Q3", organization: "DAMAC", year: "2021" },
  { image: award11, title: "The Diamond Club - No. 1 Performing Partner", organization: "Meydan", year: "2022" },
  { image: award12, title: "The Black Onyx Awards", organization: "Dubai Properties / Meraas", year: "2023" },
  { image: award13, title: "Quarter 2 Broker Awards - No. 12", organization: "Emaar", year: "2023" },
  { image: award16, title: "Quarter 3 Broker Awards - No. 2", organization: "Emaar", year: "2024" },
  { image: award17, title: "Quarter 3 Broker Awards - No. 2", organization: "Emaar", year: "2024" },
  { image: award18, title: "3rd Highest Performing Channel Partner", organization: "Sobha Realty", year: "2024" },
  { image: award14, title: "JBJ Recognition Trophy", organization: "JBJ Global", year: "" },
  { image: award15, title: "Top Broker Award", organization: "Sobha Realty", year: "" },
];

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
  const recognitions = [
    COMPANY_STATS.yearsInDubai,
    COMPANY_STATS.brokersTrainedBy,
    COMPANY_STATS.socialFollowers,
    COMPANY_STATS.teamManaged,
  ];

  return (
    <>
      <SEOHead {...pagesSEO.awards} />
      <div className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 bg-black">
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

        {/* Stats with Counter Animation */}
        <section className="py-16 bg-black relative overflow-hidden">
          <div className="jj-layer-2">
            <div className="jj-layer-active rounded-2xl p-6 md:p-10 relative">
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

        {/* Awards Grid */}
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
                  A decade of excellence recognized by Dubai's leading developers and industry bodies.
                </p>
              </div>

              {/* Awards Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AWARDS_DATA.map((award, index) => (
                  <div 
                    key={index}
                    className="border-2 border-gold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1 group"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square bg-zinc-900">
                      <img 
                        src={award.image} 
                        alt={`${award.title} - ${award.organization}`}
                        className="w-full h-full object-contain p-4"
                        loading="lazy"
                        decoding="async"
                      />
                      {/* Year Badge */}
                      {award.year && (
                        <span className="absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full bg-gold text-black shadow-lg">
                          {award.year}
                        </span>
                      )}
                    </div>
                    {/* Text Area */}
                    <div className="jj-card-inner p-5">
                      <h3 className="text-black text-lg font-semibold leading-tight mb-1">{award.title}</h3>
                      <p className="text-gold text-sm font-medium">{award.organization}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-black">
          <div className="jj-layer-2">
            <div className="max-w-[1100px] mx-auto">
              <div className="jj-layer-active rounded-2xl p-4 sm:p-6">
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
      </div>
    </>
  );
};

export default Awards;
