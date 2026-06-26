import { useCountUp } from "@/hooks/useCountUp";
import { COMPANY_STATS, CONTACT_INFO } from "@/constants/stats";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { Trophy, Award as AwardIcon, ArrowUpRight } from "lucide-react";
import awardsHeroVideoAsset from "@/assets/videos/services-hero.mp4.asset.json";
const awardsHeroVideo = awardsHeroVideoAsset.url;
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";

// Award images
import award01 from "@/assets/awards/dubai-holding-2018.png";
import award02 from "@/assets/awards/emaar-top-broker-2019.png";
import award03 from "@/assets/awards/meraas-1st-q4-2019.png";
import award04 from "@/assets/awards/meraas-2nd-q3-2019.png";
import award05 from "@/assets/awards/damac-elite-q3-2020.png";
import award06 from "@/assets/awards/damac-top-agency-q1-2021.png";
import award07 from "@/assets/awards/emaar-q2-no11-2021b.png";
import award09 from "@/assets/awards/tilal-al-ghaf-1st-2021.png";
import award10 from "@/assets/awards/damac-top-performer-q3-2021.png";
import award11 from "@/assets/awards/meydan-diamond-club-2022.png";
import award12 from "@/assets/awards/meraas-black-onyx-2023.png";
import award13 from "@/assets/awards/emaar-q2-no12-2023.png";
import award14 from "@/assets/awards/jbj-trophy.png";
import award15 from "@/assets/awards/sobha-top-broker.png";
import award16 from "@/assets/awards/emaar-q3-no2-2024a.png";
import award18 from "@/assets/awards/sobha-3rd-partner-2024.png";

const AWARDS_DATA = [
  { image: award01, title: "Partnership Recognition", organization: "Dubai Holding", year: "2018" },
  { image: award02, title: "Top Broker Award", organization: "Emaar", year: "2019" },
  { image: award03, title: "1st Place — Top Performing Q4", organization: "Meraas", year: "2019" },
  { image: award04, title: "2nd Place — Top Performing Broker Q3", organization: "Meraas", year: "2019" },
  { image: award05, title: "Elite Partners of Q3", organization: "DAMAC", year: "2020" },
  { image: award06, title: "Top Agency Q1 Broker Awards", organization: "DAMAC", year: "2021" },
  { image: award07, title: "Quarter 2 Broker Awards — No. 11", organization: "Emaar", year: "2021" },
  { image: award09, title: "1st Place — Top Performing Partner", organization: "Tilal Al Ghaf / Majid Al Futtaim", year: "2021" },
  { image: award10, title: "Top Performer Q3", organization: "DAMAC", year: "2021" },
  { image: award11, title: "The Diamond Club — No. 1 Performing Partner", organization: "Meydan", year: "2022" },
  { image: award12, title: "The Black Onyx Awards", organization: "Dubai Properties / Meraas", year: "2023" },
  { image: award13, title: "Quarter 2 Broker Awards — No. 12", organization: "Emaar", year: "2023" },
  { image: award16, title: "Quarter 3 Broker Awards — No. 2", organization: "Emaar", year: "2024" },
  { image: award18, title: "3rd Highest Performing Channel Partner", organization: "Sobha Realty", year: "2024" },
  { image: award14, title: "JBJ Recognition Trophy", organization: "JBJ GLOBAL REAL ESTATE", year: "" },
  { image: award15, title: "Top Broker Award", organization: "Sobha Realty", year: "" },
];

const CounterStat = ({ end, suffix, prefix, label }: { end: number; suffix: string; prefix: string; label: string }) => {
  const { ref, formattedValue } = useCountUp({ end, suffix, prefix, duration: 2500 });
  return (
    <div ref={ref} className="text-center">
      <p className="text-[#1A1A1A] text-4xl md:text-5xl lg:text-[56px] font-light tracking-tight leading-none mb-3">
        {formattedValue}
      </p>
      <div className="w-10 h-px bg-[#B89555]/70 mx-auto mb-3" />
      <p className="text-[#1A1A1A]/70 text-[11px] md:text-xs uppercase tracking-[0.28em] font-medium">{label}</p>
    </div>
  );
};

const Awards = () => {
  // 3 cards only — social followers removed
  const recognitions = [
    COMPANY_STATS.yearsInDubai,
    COMPANY_STATS.brokersTrainedBy,
    COMPANY_STATS.teamManaged,
  ];

  return (
    <>
      <SEOHead {...pagesSEO.awards} />
      <div data-marketing-page className="min-h-screen bg-[#F7F2EA]">
        {/* HERO — clean cinematic video */}
        <section
          className="relative flex items-center justify-center overflow-hidden min-h-[60vh] md:min-h-[68vh]"
          data-hero-dark
          data-surface="dark"
        >
          <div className="absolute inset-0">
            <video
              src={awardsHeroVideo}
              poster={luxuryVillaHero}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/85" />
          </div>

          <div className="relative z-10 text-center px-6 max-w-[1000px] mx-auto py-20">
            <span className="inline-block mb-5 text-[#E6CF93] text-[10px] md:text-[11px] uppercase tracking-[0.32em] font-medium">
              Awards & Recognition
            </span>
            <h1 className="text-white text-[36px] md:text-[52px] lg:text-[62px] font-light tracking-tight leading-[1.05] mb-5">
              Recognized for{" "}
              <span className="italic font-normal text-[#E6CF93]">excellence</span>.
            </h1>
            <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto font-light" style={{ lineHeight: 1.75 }}>
              A decade of trust, honored by Dubai's most prestigious developers and industry bodies.
            </p>
          </div>
        </section>

        {/* COUNTERS — 3 premium stats */}
        <section className="py-10 md:py-14 bg-[#F7F2EA]">
          <div className="max-w-[1100px] mx-auto px-4 md:px-6">
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/40 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-6 md:px-10 py-10 md:py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-center">
                {recognitions.map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-center ${
                      i > 0 ? "md:border-l md:border-[#B89555]/30" : ""
                    }`}
                  >
                    <CounterStat {...item} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AWARDS GRID — 3D premium cards */}
        <section className="py-10 md:py-14 bg-[#F7F2EA]">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6">
            <div className="text-center mb-10 md:mb-12">
              <span className="inline-block text-[#1A1A1A]/70 text-[11px] uppercase tracking-[0.32em] font-medium mb-3">
                Recognition
              </span>
              <h2 className="text-[#1A1A1A] text-3xl md:text-[42px] font-light tracking-tight leading-tight">
                Awards &{" "}
                <span className="italic font-normal text-[#B89555]">achievements</span>
              </h2>
              <div className="w-12 h-px bg-[#B89555] mx-auto mt-5" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
              {AWARDS_DATA.map((award, index) => (
                <article
                  key={index}
                  className="group relative rounded-2xl overflow-hidden border border-[#B89555]/40 bg-[#FDFBF7] transition-all duration-500 hover:-translate-y-2 hover:border-[#B89555]"
                  style={{
                    boxShadow:
                      "0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 30px rgba(26,26,26,0.10), 0 2px 6px rgba(26,26,26,0.06)",
                  }}
                >
                  {/* Soft champagne gradient backplate for premium 3D feel */}
                  <div
                    className="relative h-[260px] md:h-[280px] flex items-center justify-center overflow-hidden"
                    style={{
                      background:
                        "radial-gradient(120% 80% at 50% 0%, #FFFFFF 0%, #F7F2EA 55%, #EFE6D6 100%)",
                    }}
                  >
                    {/* Top sheen */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 to-transparent" />
                    {/* Award glyph */}
                    <img
                      src={award.image}
                      alt={`${award.title} — ${award.organization}`}
                      className="relative z-10 max-h-[78%] max-w-[78%] object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                      style={{
                        filter:
                          "drop-shadow(0 18px 24px rgba(26,26,26,0.18)) drop-shadow(0 4px 8px rgba(184,149,85,0.18))",
                      }}
                      loading="lazy"
                      decoding="async"
                    />
                    {/* Year ribbon */}
                    {award.year && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase rounded-full bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/60 shadow-sm">
                        <AwardIcon className="w-3 h-3 text-[#B89555]" />
                        {award.year}
                      </span>
                    )}
                    {/* Bottom hairline */}
                    <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/60 to-transparent" />
                  </div>

                  {/* Caption */}
                  <div className="px-5 py-4 bg-[#FDFBF7]">
                    <h3 className="text-[#1A1A1A] text-[15px] font-semibold leading-snug mb-1 line-clamp-2">
                      {award.title}
                    </h3>
                    <p className="text-[#1A1A1A]/70 text-xs uppercase tracking-[0.18em] font-medium line-clamp-1">
                      {award.organization}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 md:py-14 bg-[#F7F2EA]">
          <div className="max-w-[1100px] mx-auto px-4 md:px-6">
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/40 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-6 md:px-12 py-12 md:py-14 text-center">
              <Trophy className="w-8 h-8 text-[#B89555] mx-auto mb-4" />
              <h2 className="text-[#1A1A1A] text-3xl md:text-[40px] font-light tracking-tight mb-4">
                Experience award-winning{" "}
                <span className="italic font-normal text-[#B89555]">service</span>
              </h2>
              <p className="text-[#1A1A1A]/70 mb-8 max-w-xl mx-auto text-base">
                Join the clients who trust JBJ Global Real Estate with their most important property decisions.
              </p>
              <a
                href={CONTACT_INFO.inquiryFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="champagne"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-full bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555] hover:bg-[#EFE6D6] transition-colors"
              >
                Get Started Today
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Awards;
