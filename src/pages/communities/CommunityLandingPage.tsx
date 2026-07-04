import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, TrendingUp, Building2, Train, Sparkles, HelpCircle,
  ArrowRight, CheckCircle2, Home, DollarSign,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { getCommunityLanding, COMMUNITY_LANDINGS } from "@/data/communityLandings";
import { useEffect } from "react";

/**
 * Static, SEO-optimized landing pages for tier-1 investment communities.
 * Route: /communities/<slug>-guide
 * Complements the dynamic DB-driven /community/:slug listing pages.
 */
const CommunityLandingPage = ({ slug: propSlug }: { slug?: string } = {}) => {
  const params = useParams<{ slug: string }>();
  const slug = propSlug ?? params.slug;
  const community = slug ? getCommunityLanding(slug) : undefined;

  // Inject BreadcrumbList + Place JSON-LD for this specific community
  useEffect(() => {
    if (!community) return;
    const canonical = `https://www.jbj.ae/communities/${community.slug}-guide`;

    const scripts: HTMLScriptElement[] = [];

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.jbj.ae/" },
        { "@type": "ListItem", position: 2, name: "Communities", item: "https://www.jbj.ae/communities" },
        { "@type": "ListItem", position: 3, name: `${community.name} Guide`, item: canonical },
      ],
    };

    const place = {
      "@context": "https://schema.org",
      "@type": "Place",
      name: community.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: community.name,
        addressRegion: community.emirate,
        addressCountry: "AE",
      },
      ...(community.wikidata && { sameAs: [`https://www.wikidata.org/wiki/${community.wikidata}`] }),
      description: community.intro,
    };

    for (const data of [breadcrumb, place]) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-community-schema", community.slug);
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
      scripts.push(s);
    }

    return () => scripts.forEach((s) => s.remove());
  }, [community]);

  if (!community) return <Navigate to="/communities" replace />;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead
        title={`${community.name} Property Guide 2026 | Buy, Rent & Invest`}
        description={`${community.tagline}. Prices, rental yields, transport, schools & top buildings in ${community.name}, ${community.emirate}. Expert brokerage from JBJ.`.slice(0, 158)}
        keywords={community.keywords}
        canonicalPath={`/communities/${community.slug}-guide`}
        faqItems={community.faqs}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${community.heroImage}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#0a1712]/95" />
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-36 text-center text-white">
          <nav aria-label="breadcrumb" className="text-xs uppercase tracking-widest text-[#E9D9AE]/80 mb-6">
            <Link to="/" className="hover:text-[#E9D9AE]">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/communities" className="hover:text-[#E9D9AE]">Communities</Link>
            <span className="mx-2">/</span>
            <span className="text-[#E9D9AE]">{community.name}</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B89555]/60 text-[#E9D9AE] text-xs tracking-widest uppercase mb-6">
            <MapPin className="w-3.5 h-3.5" /> {community.emirate}, UAE
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-5">
            {community.name}
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-3xl mx-auto leading-relaxed">
            {community.tagline}
          </p>
        </div>
      </section>

      {/* Snapshot bar */}
      <section className="border-y border-[#EFE6D6] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "From", value: `AED ${community.priceFrom}`, icon: Home },
            { label: "Rent from", value: `AED ${community.rentFrom}/yr`, icon: DollarSign },
            { label: "Gross yield", value: `${community.grossYield}%`, icon: TrendingUp },
            { label: "Ownership", value: "Freehold", icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.label}>
              <s.icon className="w-6 h-6 mx-auto text-[#B89555] mb-2" />
              <div className="text-xl md:text-2xl font-serif font-bold text-[#1A1A1A]">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-[#8B7340] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-lg text-[#3D3D3D] leading-relaxed">{community.intro}</p>
        </div>
      </section>

      {/* Content sections */}
      {[
        { icon: Home, title: `Living in ${community.name}`, body: community.livingHere, ivory: true },
        { icon: TrendingUp, title: `${community.name} property investment`, body: community.investment, ivory: false },
        { icon: Train, title: `Transport & connectivity`, body: community.transport, ivory: true },
        { icon: Sparkles, title: `Amenities & landmarks`, body: community.amenities, ivory: false },
      ].map((section) => (
        <section
          key={section.title}
          className={section.ivory ? "py-16 md:py-20 bg-gradient-to-br from-[#FAF6EE] via-[#F7F1E6]/40 to-[#FAF6EE]" : "py-16 md:py-20 bg-white"}
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-4">
              <section.icon className="w-6 h-6 text-[#B89555]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-6">{section.title}</h2>
            <p className="text-lg text-[#3D3D3D] leading-relaxed">{section.body}</p>
          </div>
        </section>
      ))}

      {/* Highlights */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">Quick facts</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {community.highlights.map((h) => (
              <motion.div
                key={h.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-[#EFE6D6] bg-[#FDFBF7] p-5"
              >
                <div className="text-xs uppercase tracking-widest text-[#8B7340] mb-2">{h.label}</div>
                <div className="text-lg font-serif font-bold text-[#1A1A1A]">{h.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-6 h-6 text-[#B89555]" />
            <span className="text-xs uppercase tracking-widest text-[#8B7340]">Answers</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">
            {community.name} FAQs
          </h2>
          <Accordion type="single" collapsible className="rounded-2xl border border-[#EFE6D6] bg-white overflow-hidden">
            {community.faqs.map((f, i) => (
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

      {/* CTA + internal links */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#0d1f18] via-[#0a1712] to-black text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Ready to explore <span className="text-[#E9D9AE]">{community.name}?</span>
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Browse live listings, request a private tour, or get a personalized ROI report from our RERA-licensed brokers.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={`/community/${community.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B89555] text-[#0a1712] font-semibold hover:bg-[#C9A66B] transition"
            >
              View {community.name} Listings <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 transition"
            >
              Speak to a Broker
            </Link>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10">
            <div className="text-xs uppercase tracking-widest text-[#E9D9AE]/70 mb-3">Compare other communities</div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {COMMUNITY_LANDINGS.filter((c) => c.slug !== community.slug).map((c) => (
                <Link key={c.slug} to={`/communities/${c.slug}-guide`} className="text-white/70 hover:text-[#E9D9AE]">
                  {c.name}
                </Link>
              ))}
              <Link to="/guides/dubai-rental-yield" className="text-white/70 hover:text-[#E9D9AE]">
                Rental Yield Guide →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CommunityLandingPage;
