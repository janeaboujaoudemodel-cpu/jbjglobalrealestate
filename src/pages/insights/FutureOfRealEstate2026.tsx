import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Leaf, Crown, Cpu, Building2, Home, TrendingUp, HelpCircle,
  ArrowRight, CheckCircle2, Sparkles, MapPin, LineChart, Rocket,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Pillar SEO article — "The Future of Real Estate: 5 Trends to Watch in 2026"
 *
 * Implements the full Semrush On-Page SEO Checker brief for primary
 * keyword "real estate" (UAE database), targeting 24 secondary keywords
 * across a 1,900+ word structured article with:
 *   - single H1, five H2 trends (2 H3 each), Introduction, Conclusion, FAQ
 *   - FAQPage + BreadcrumbList JSON-LD (via SEOHead)
 *   - Article + HowTo JSON-LD (injected in-page)
 *   - Internal linking to properties, communities, buyer-guide, investor hub
 *
 * Visual system mirrors DubaiRentalYieldGuide (ivory + champagne + ink).
 */

const ARTICLE_URL = "https://jbj.ae/insights/future-of-real-estate-2026";
const PUBLISHED = "2026-07-05";
const MODIFIED = "2026-07-05";

const FAQS = [
  {
    question: "What are the biggest real estate trends for 2026?",
    answer:
      "The five defining trends are: sustainable green-certified buildings, continued growth in luxury real estate (led by Dubai and other global hubs), digital-first brokerage powered by AI and virtual tours, expansion of commercial real estate into emerging markets, and reshaped residential demand driven by remote and hybrid work.",
  },
  {
    question: "Is Dubai real estate still a good investment in 2026?",
    answer:
      "Yes. Dubai real estate continues to deliver 5–8% gross rental yields, zero personal income tax on rental income, and Golden Visa eligibility from AED 2M. High transaction volumes reported by the Dubai Land Department and steady population growth make it one of the strongest global markets for property investment in 2026.",
  },
  {
    question: "How is technology changing real estate brokerage?",
    answer:
      "AI-powered property matching, virtual and immersive 3D tours, e-signature transactions via DLD's REST platform, blockchain-secured title records, and predictive analytics for pricing are now standard tools. Digital real estate brokerage lets buyers, sellers and investors close deals from anywhere in the world.",
  },
  {
    question: "What is sustainable real estate and why does it matter?",
    answer:
      "Sustainable real estate refers to buildings designed and operated to reduce energy, water and carbon impact — using LEED, BREEAM or Estidama (UAE) certifications, solar power, greywater recycling, and smart HVAC. Green-certified assets now command 5–15% price premiums and rent faster than conventional stock.",
  },
  {
    question: "Which real estate segments will grow fastest in 2026?",
    answer:
      "Luxury residential in gateway cities, branded residences, logistics and last-mile industrial commercial real estate, purpose-built student and senior housing, and green-certified office space in emerging secondary markets are the strongest growth segments identified for 2026.",
  },
  {
    question: "How do I start investing in real estate as a first-time homebuyer?",
    answer:
      "Start by defining your budget, mortgage pre-approval (up to 80% LTV for UAE residents, 50% for non-residents on properties over AED 5M), identifying your target community, and engaging a RERA-licensed brokerage. First-time homebuyers in Dubai benefit from a 4% one-off DLD transfer fee and no annual property tax.",
  },
  {
    question: "What are the top real estate companies in Dubai?",
    answer:
      "The Dubai market is anchored by major developers — Emaar, DAMAC, Nakheel, Sobha, Meraas, Azizi, Danube and Binghatti — and served by RERA-licensed brokerages including JBJ Global Real Estate. Choose a brokerage with verified DLD/RERA licensing and transparent transaction reporting.",
  },
  {
    question: "How does remote work impact residential real estate demand?",
    answer:
      "Remote and hybrid work have shifted demand toward larger residential properties with dedicated home-office space, better broadband, and access to community amenities. In Dubai this is visible in the strong performance of villa communities like Arabian Ranches, Dubai Hills and Tilal Al Ghaf, and townhouse launches across the city.",
  },
];

const TRENDS = [
  {
    n: 1, icon: Leaf, color: "#3E8963",
    title: "Rise of Sustainable Real Estate",
    lead: "Green building is no longer a marketing badge — it is a pricing signal.",
    subs: [
      {
        h3: "Importance of Green Building Practices",
        body:
          "Sustainable real estate is the defining shift in global property in 2026. Buyers, tenants and institutional investors now underwrite carbon performance the same way they underwrite yield. LEED, BREEAM and — in the UAE — Estidama certifications have become baseline expectations for new residential and commercial real estate development. Solar-integrated façades, greywater recycling, district cooling, smart HVAC and low-embodied-carbon concrete are appearing across Emaar, Sobha and Nakheel launches in Dubai, and across major residential properties in Abu Dhabi, Riyadh and London.",
      },
      {
        h3: "Impact on Property Values",
        body:
          "Recent research from JLL, Knight Frank and CBRE shows green-certified buildings trade at 5–15% price premiums and rent 20–30% faster than uncertified stock. In Dubai, Estidama Pearl-rated projects have outperformed comparable non-rated schemes on both handover values and resale spreads. For investors and real estate consultants running valuations in 2026, energy intensity, cooling load and certification are now core inputs in every real estate valuation model — not optional add-ons.",
      },
    ],
  },
  {
    n: 2, icon: Crown, color: "#B89555",
    title: "Growth of Luxury Real Estate",
    lead: "Prime and super-prime keep breaking records — especially in Dubai.",
    subs: [
      {
        h3: "Market Analysis",
        body:
          "Luxury real estate is expected to keep outperforming the wider market in 2026. Global prime residential prices tracked by Knight Frank grew across 90% of surveyed cities in 2025, and Dubai has been the standout — leading the world in USD 10M+ home sales for four consecutive years. Palm Jumeirah, Emirates Hills, Downtown Dubai, District One and Jumeirah Bay Island remain the anchors of Dubai real estate at the top end, with branded residences (Bulgari, Six Senses, Baccarat) commanding 30–60% premiums over unbranded comparables.",
      },
      {
        h3: "Demographic Shifts Driving Luxury Demand",
        body:
          "Three demographic forces are pushing luxury demand: relocating ultra-high-net-worth individuals (Dubai attracted the largest net inflow of millionaires globally in 2025), a growing base of tech-wealth founders under 40, and family offices reallocating from public markets into hard assets. The Golden Visa (10-year residency from AED 2M) has locked in long-term demand, and real estate companies in Dubai are structuring inventory specifically for this buyer profile.",
      },
    ],
  },
  {
    n: 3, icon: Cpu, color: "#2F6BBF",
    title: "Increase in Digital Real Estate Brokerage",
    lead: "The brokerage is now a platform — not a shopfront.",
    subs: [
      {
        h3: "Technology in Real Estate Transactions",
        body:
          "Digital real estate brokerage is reshaping how buyers, sellers and tenants transact. In Dubai, the Dubai Land Department's REST app already lets owners register title, transfer property, pay service charges and issue Ejari from a phone. Blockchain-backed title records, e-signature via UAE Pass, and DLD-integrated escrow are cutting the average sale timeline from weeks to days. Global real estate brokerages including JBJ Global Real Estate have moved viewing bookings, KYC, offer submission and closing packs entirely online.",
      },
      {
        h3: "Virtual Tours and AI in Property Management",
        body:
          "AI now drives three parts of the brokerage stack: matching (recommending listings from natural-language briefs), visualization (immersive 3D and VR tours that replaced 70% of first viewings in 2025), and property management services (predictive maintenance, dynamic short-let pricing, automated lease renewals). For real estate agents in Dubai, the winning stack in 2026 is CRM + AI matcher + virtual tour + digital signing — anything less is a competitive disadvantage.",
      },
    ],
  },
  {
    n: 4, icon: Building2, color: "#7C4DFF",
    title: "Emerging Markets in Commercial Real Estate",
    lead: "Capital is rotating out of legacy office and into new asset classes.",
    subs: [
      {
        h3: "Opportunities in Untapped Areas",
        body:
          "Commercial real estate in 2026 is being redefined by three shifts: logistics and last-mile industrial (e-commerce, cold chain), data centres (AI compute demand pushed global data-centre capex above USD 400B in 2025), and life-sciences campuses. In the GCC, Dubai South, KEZAD (Abu Dhabi) and Riyadh's Special Economic Zones are attracting record institutional flows. Investors and real estate consultants advising on commercial real estate now build portfolios that mix logistics, healthcare-anchored office and green-certified retail rather than pure CBD office exposure.",
      },
      {
        h3: "Future of Retail Spaces in Urban Areas",
        body:
          "Retail is not dying — it is being rebuilt around experience. In Dubai, footfall at experiential destinations (Dubai Hills Mall, Bluewaters, City Walk) grew double-digits in 2025, while pure-transaction retail continues to compress. The winning 2026 retail asset combines food and beverage, wellness, entertainment and click-and-collect logistics. For real estate development teams, this means shorter, more flexible leases, higher tenant-fit-out contributions, and turnover-linked rent structures.",
      },
    ],
  },
  {
    n: 5, icon: Home, color: "#B89555",
    title: "Shift Towards Remote Work & Residential Impact",
    lead: "Hybrid work permanently changed what a home needs to do.",
    subs: [
      {
        h3: "Demand for Larger Homes",
        body:
          "The post-pandemic shift to remote and hybrid work is now structural, not cyclical. Buyers across Dubai, London, New York and Singapore are prioritising larger residential properties with a dedicated home office, a second lounge, and higher-spec broadband. In Dubai this is visible in the strong absorption of 3–5 bedroom townhouses and villas in Arabian Ranches, Dubai Hills Estate, Tilal Al Ghaf and The Valley, and in developers front-loading their villa pipelines through 2027.",
      },
      {
        h3: "Transformation of Urban and Suburban Living",
        body:
          "Urban centres are reinventing themselves around 15-minute-city principles: walkable retail, parks, wellness clinics and schools within reach of the front door. In Dubai, Downtown, Business Bay and Dubai Marina remain the urban anchors, while master-planned suburbs like MBR City and Dubai South offer suburban space with urban amenity. For first-time homebuyers, the practical implication is that community selection now matters as much as the unit itself — the trend in 2026 is buying into a lifestyle, not just square footage.",
      },
    ],
  },
];

const HOW_TO_STEPS = [
  { name: "Set your budget & get mortgage pre-approval", text: "UAE residents can borrow up to 80% LTV; non-residents up to 50% on properties above AED 5M. Add ~7% for DLD, agency, mortgage and NOC fees." },
  { name: "Pick your target community", text: "Use rental-yield data (JVC, Business Bay, Marina for yield; Palm, Downtown, Emirates Hills for prestige) plus commute, schools and lifestyle fit." },
  { name: "Engage a RERA-licensed brokerage", text: "Confirm the broker's DLD/RERA card, ask for verified sold comparables, and demand transparent commission terms in writing." },
  { name: "Reserve the unit with a signed Form F", text: "Form F is the DLD-standard MoU. It locks price and terms and typically requires a 10% deposit into a broker escrow account." },
  { name: "Complete NOC, transfer & Oqood (off-plan)", text: "Developer NOC is issued in 3–7 days. Transfer happens at a DLD Trustee office; off-plan buyers receive an Oqood pre-title certificate." },
  { name: "Register Ejari & set up DEWA", text: "For tenants (or landlords letting the property), Ejari registers the lease with RERA. DEWA activates utilities within 24–48 hours." },
];

const FutureOfRealEstate2026 = () => {
  useEffect(() => {
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "The Future of Real Estate: 5 Trends to Watch in 2026",
      description:
        "Discover the future of real estate with key trends for 2026, including sustainable practices and the growth of luxury properties. Learn more!",
      image: "https://www.jbj.ae/og-image.jpg",
      author: {
        "@type": "Organization",
        name: "JBJ Global Real Estate",
        url: "https://www.jbj.ae",
      },
      publisher: {
        "@type": "Organization",
        name: "JBJ Global Real Estate",
        logo: {
          "@type": "ImageObject",
          url: "https://www.jbj.ae/og-image.jpg",
        },
      },
      datePublished: PUBLISHED,
      dateModified: MODIFIED,
      mainEntityOfPage: { "@type": "WebPage", "@id": ARTICLE_URL },
      inLanguage: "en",
      articleSection: "Real Estate Trends",
      about: [
        { "@type": "Thing", name: "Real Estate" },
        { "@type": "Thing", name: "Dubai Real Estate" },
        { "@type": "Thing", name: "Luxury Real Estate" },
        { "@type": "Thing", name: "Sustainable Real Estate" },
        { "@type": "Thing", name: "Commercial Real Estate" },
      ],
      keywords:
        "real estate, dubai real estate, real estate companies in dubai, real estate agents in dubai, luxury real estate, sustainable real estate, commercial real estate, real estate brokerage, real estate development, property investment, residential properties, real estate valuation, real estate consultants, first-time homebuyers, dubai real estate news, property management services",
    };

    const howToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to buy Dubai real estate in 2026",
      description:
        "Six-step process for first-time homebuyers and investors purchasing property in Dubai in 2026, from budget to Ejari registration.",
      totalTime: "P30D",
      step: HOW_TO_STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    };

    const scripts: HTMLScriptElement[] = [];
    for (const [id, data] of [
      ["jbj-article-jsonld", articleSchema],
      ["jbj-howto-jsonld", howToSchema],
    ] as const) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = id;
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
      scripts.push(s);
    }
    return () => {
      scripts.forEach((s) => s.remove());
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead
        title="The Future of Real Estate: 5 Trends to Watch in 2026"
        description="Discover the future of real estate with key trends for 2026, including sustainable practices and the growth of luxury properties. Learn more!"
        keywords="real estate, dubai real estate, real estate companies in dubai, real estate agents in dubai, luxury real estate, sustainable real estate, commercial real estate, real estate brokerage, real estate development, property investment, investment properties, residential properties, real estate valuation, real estate consultants, first-time homebuyers, property management services, dubai real estate news, dubai real estate centre"
        canonicalPath="/insights/future-of-real-estate-2026"
        ogType="article"
        faqItems={FAQS}
        breadcrumbItems={[
          { name: "Home", path: "/" },
          { name: "Insights", path: "/news" },
          { name: "The Future of Real Estate: 5 Trends to Watch in 2026", path: "/insights/future-of-real-estate-2026" },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0d1f18] via-[#0a1712] to-[#0a1712] text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_rgba(184,149,85,0.35),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B89555]/60 text-[#E9D9AE] text-xs tracking-widest uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" /> 2026 Market Outlook
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-6">
            The Future of Real Estate: <span className="text-[#E9D9AE]">5 Trends to Watch in 2026</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-8">
            Where global real estate is heading in 2026 — sustainable buildings, luxury demand, digital brokerage, new commercial frontiers, and the residential impact of remote work. Written for investors, homebuyers and real estate consultants operating in the UAE and beyond.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs uppercase tracking-widest text-[#E9D9AE]/80">
            <span>Published {PUBLISHED}</span>
            <span>·</span>
            <span>JBJ Global Real Estate</span>
            <span>·</span>
            <span>~9 min read</span>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-14 md:py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-2xl border border-[#EFE6D6] bg-white p-6 md:p-8 shadow-sm mb-10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8B7340] mb-3">
              <TrendingUp className="w-4 h-4 text-[#B89555]" /> TL;DR
            </div>
            <p className="text-[#1A1A1A] leading-relaxed">
              Sustainable and luxury real estate keep pulling ahead of the wider market. Digital-first brokerage, powered by AI and virtual tours, is now the default. Commercial real estate capital is rotating from legacy office into logistics, data centres and experiential retail. And residential demand — especially in Dubai — is still being reshaped by remote and hybrid work. This guide walks through all five trends and what they mean for investors, first-time homebuyers, and real estate consultants in 2026.
            </p>
          </div>

          <h2 className="sr-only">Introduction</h2>
          <p className="text-[#3D3D3D] leading-relaxed mb-4">
            Real estate in 2026 looks very different from real estate in 2019. Three years of accelerated PropTech adoption, a global luxury-property boom led by Dubai, a full re-underwriting of commercial real estate, and the normalisation of hybrid work have collectively reshaped how capital flows through the built environment. Whether you are a first-time homebuyer, a Dubai-based investor comparing residential properties, or a corporate real estate team rebalancing a portfolio, the trends below are the ones that will decide who wins and loses over the next 24 months.
          </p>
          <p className="text-[#3D3D3D] leading-relaxed">
            Dubai sits at the centre of most of these shifts. The city continues to lead global rankings for USD 10M+ home sales, hosts one of the world's most digital-native Land Departments, and is one of the fastest-growing markets for green-certified assets. That makes it the most useful lens through which to read the wider global market — and it's why every trend below is grounded in Dubai real estate data alongside the global picture.
          </p>
        </div>
      </section>

      {/* Trend sections */}
      {TRENDS.map((t) => (
        <section key={t.n} id={`trend-${t.n}`} className={`py-14 md:py-16 scroll-mt-24 ${t.n % 2 === 0 ? "bg-[#FAF6EE]" : ""}`}>
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-serif font-bold"
                style={{ background: t.color }}
                aria-hidden
              >
                {t.n}
              </span>
              <t.icon className="w-6 h-6" style={{ color: t.color }} />
              <span className="text-xs uppercase tracking-widest text-[#8B7340]">Trend {t.n} of 5</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-3">
              {t.title}
            </h2>
            <p className="text-lg text-[#3D3D3D] italic mb-8">{t.lead}</p>

            <div className="space-y-8">
              {t.subs.map((sub) => (
                <motion.div
                  key={sub.h3}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-[#1A1A1A] mb-3">
                    {sub.h3}
                  </h3>
                  <p className="text-[#3D3D3D] leading-relaxed">{sub.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* HowTo box — feeds HowTo JSON-LD */}
      <section className="py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <Rocket className="w-6 h-6 text-[#B89555]" />
            <span className="text-xs uppercase tracking-widest text-[#8B7340]">Practical playbook</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">
            How to buy Dubai real estate in 2026 — in six steps
          </h2>
          <ol className="space-y-4">
            {HOW_TO_STEPS.map((s, i) => (
              <li key={s.name} className="flex gap-4 rounded-2xl border border-[#EFE6D6] bg-white p-5 shadow-sm">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[#0a1712] text-[#E9D9AE] font-serif font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-[#1A1A1A] mb-1">{s.name}</div>
                  <p className="text-sm text-[#3D3D3D] leading-relaxed">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Conclusion */}
      <section className="py-14 md:py-16 bg-[#FAF6EE]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <LineChart className="w-6 h-6 text-[#B89555]" />
            <span className="text-xs uppercase tracking-widest text-[#8B7340]">Conclusion</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-6">
            Summary of key trends & what to do next
          </h2>

          <h3 className="text-xl font-serif font-bold text-[#1A1A1A] mb-3">Summary of Key Trends</h3>
          <p className="text-[#3D3D3D] leading-relaxed mb-4">
            Sustainable real estate is now priced into every credible valuation. Luxury real estate — particularly in Dubai — continues to outperform. Digital real estate brokerage, powered by AI matching, virtual tours and integrated e-signature, is the new operating standard. Commercial real estate capital is rotating into logistics, data centres and experiential retail. And residential demand is still being reshaped by remote work, pushing buyers toward larger residential properties and community-first master-plans.
          </p>

          <h3 className="text-xl font-serif font-bold text-[#1A1A1A] mb-3 mt-6">Call to Action for Investors and Homebuyers</h3>
          <p className="text-[#3D3D3D] leading-relaxed">
            For investors, the 2026 playbook is to combine 6–8% yield-focused apartment districts with a prestige capital-appreciation anchor. For first-time homebuyers, engage a RERA-licensed brokerage early, get mortgage pre-approval, and prioritise green-certified stock in walkable communities. If you'd like help mapping any of this to specific properties or a portfolio, our team of real estate consultants is ready to run bespoke DLD-grounded numbers within 24 hours.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="w-6 h-6 text-[#B89555]" />
            <span className="text-xs uppercase tracking-widest text-[#8B7340]">Answers</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">
            Frequently asked questions
          </h2>

          <Accordion type="single" collapsible className="rounded-2xl border border-[#EFE6D6] bg-white overflow-hidden">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`f-${i}`} className="border-b border-[#F1EADB] last:border-b-0 px-5">
                <AccordionTrigger className="text-left text-[#1A1A1A] hover:no-underline py-5">
                  <span className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#B89555] mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">{f.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-[#3D3D3D] leading-relaxed pb-5 pl-8">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#0d1f18] via-[#0a1712] to-black text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Ready to act on the <span className="text-[#E9D9AE]">2026 real estate outlook?</span>
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Whether you're a first-time homebuyer, a landlord optimising rental yield, or a family office rebalancing into Dubai real estate, JBJ Global Real Estate — a RERA-licensed real estate brokerage — will build a shortlist and yield model tailored to your goals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B89555] text-[#0a1712] font-semibold hover:bg-[#C9A66B] transition">
              Speak to a Consultant <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/properties" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 transition">
              Browse Dubai Properties
            </Link>
          </div>
          <div className="mt-10 pt-8 border-t border-white/10 text-sm text-white/60 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/guides/dubai-rental-yield" className="hover:text-[#E9D9AE]"><MapPin className="w-3 h-3 inline mr-1" />Rental Yield Guide</Link>
            <Link to="/buyer-guide" className="hover:text-[#E9D9AE]">Buyer Guide</Link>
            <Link to="/investor-hub" className="hover:text-[#E9D9AE]">Investor Hub</Link>
            <Link to="/communities/palm-jumeirah-guide" className="hover:text-[#E9D9AE]">Palm Jumeirah</Link>
            <Link to="/communities/downtown-dubai-guide" className="hover:text-[#E9D9AE]">Downtown Dubai</Link>
            <Link to="/news" className="hover:text-[#E9D9AE]">Dubai Real Estate News</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FutureOfRealEstate2026;
