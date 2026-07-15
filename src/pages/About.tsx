import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Shield,
  Users,
  TrendingUp,
  Building2,
  BarChart3,
  FileCheck,
  Scale,
  Heart,
  Target,
  type LucideIcon,
} from "lucide-react";

import { SEOHead, pagesSEO } from "@/components/SEOHead";
import MIPreFooterCard from "@/components/shell/MIPreFooterCard";
import {
  BrandPageShell,
  BrandPanel,
  EmeraldTile,
  EmeraldIcon,
  EMERALD_GRADIENT,
} from "@/components/shell/BrandPageShell";
import { FounderContent } from "@/components/FounderContent";
import { FounderPhotoEditOverlay } from "@/components/founder/FounderPhotoEditOverlay";
import { useFounderPhoto } from "@/hooks/useFounderPhoto";

import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import luxuryVilla2 from "@/assets/luxury-villa-2.jpeg";
import aboutHeroVideoAsset from "@/assets/videos/dubai-landmarks-hero.mp4.asset.json";
const aboutHeroVideo = aboutHeroVideoAsset.url;

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

// Founder portrait honoring the owner-uploaded override.
// Fixed: removed scale(1.25) that caused the head to bleed out of the frame,
// and object-position now sits at 25% so the face is properly framed.
const FounderAboutPortrait = () => {
  const { photoUrl } = useFounderPhoto();
  const src = photoUrl || founderProfessional;
  return (
    <img
      src={src}
      alt="Founder & CEO of JBJ GLOBAL REAL ESTATE"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      style={{ objectPosition: "50% 25%" }}
      loading="lazy"
      decoding="async"
    />
  );
};

// Reusable emerald feature card — matches services template contrast.
const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) => (
  <motion.div
    data-pm-emerald
    className="rounded-2xl border p-6 transition-transform duration-300 hover:-translate-y-1"
    style={{
      background: EMERALD_GRADIENT,
      borderColor: "rgba(255,255,255,0.22)",
      boxShadow: "0 18px 38px -28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.13)",
    }}
    variants={fadeInUp}
  >
    <EmeraldIcon icon={Icon} large />
    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.86)" }}>
      {description}
    </p>
  </motion.div>
);

const About = () => {
  return (
    <>
      <SEOHead {...pagesSEO.about} />
      <BrandPageShell slug="about" className="min-h-screen">

        {/* ── HERO — kept as approved emerald ombre, content re-balanced ── */}
        <section
          className="jj-hero-fullscreen jj-hero-compact jj-about-emerald-hero relative flex items-center justify-center overflow-hidden"
          data-surface="dark"
          data-hero-dark
          style={{ background: "var(--jj-emerald-ombre)" }}
        >
          <div className="absolute inset-0">
            <video
              src={aboutHeroVideo}
              poster={luxuryVillaHero}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="h-full w-full object-cover opacity-0"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)",
              }}
            />
            <div className="jj-company-hero-motion absolute inset-0" />
          </div>

          <motion.div
            className="relative z-10 mx-auto flex max-w-[1000px] flex-col items-center px-6 py-20 text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span
              className="mb-5 inline-block text-[10px] font-medium uppercase tracking-[0.32em] text-[#E6CF93] md:text-[11px]"
              variants={fadeInUp}
            >
              JBJ Global Real Estate
            </motion.span>
            <motion.h1
              className="mb-5 text-[36px] font-light leading-[1.05] tracking-tight text-white md:text-[52px] lg:text-[62px]"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
              variants={fadeInUp}
            >
              A licensed brokerage, built on{" "}
              <span className="italic font-normal text-[#E6CF93]">clarity</span>.
            </motion.h1>
            <motion.p
              className="mx-auto mb-10 max-w-2xl text-base font-light text-white/85 md:text-lg"
              style={{ lineHeight: 1.75 }}
              variants={fadeInUp}
            >
              A Dubai mainland brokerage operating across the UAE. Structured
              advisory for buying, selling and renting property, grounded in
              verified market data and disciplined execution.
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center gap-3"
              variants={fadeInUp}
            >
              <Link
                to="/services"
                data-pm-emerald
                data-no-contrast-guard
                className="allow-white group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: EMERALD_GRADIENT, color: "#FFFFFF", border: "1px solid rgba(184,149,85,0.5)" }}
              >
                <span>Explore Our Services</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                data-pm-emerald
                data-no-contrast-guard
                className="allow-white group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: EMERALD_GRADIENT, color: "#FFFFFF", border: "1px solid rgba(184,149,85,0.5)" }}
              >
                <span>Contact Our Team</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        <main data-service-body>

          {/* ── WHO WE ARE ── founder portrait + intro copy ── */}
          <FounderContent>
            <BrandPanel eyebrow="Who We Are" title="A licensed brokerage, structured for clarity">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={staggerContainer}
                className="grid items-center gap-10 lg:grid-cols-[280px_1fr] lg:gap-14"
              >
                <motion.div variants={fadeInUp} className="flex justify-center">
                  <div className="relative">
                    <Link to="/founder" className="group block">
                      {/* Portrait sits fully INSIDE the emerald ring — no more overflow. */}
                      <div
                        className="relative mx-auto h-56 w-56 overflow-hidden rounded-full border-2 border-[#B89555] shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_0_30px_rgba(200,167,102,0.35),0_20px_50px_rgba(0,0,0,0.35)] md:h-64 md:w-64"
                      >
                        <FounderAboutPortrait />
                      </div>
                    </Link>
                    <FounderPhotoEditOverlay />
                    <Link to="/founder" className="mt-5 block">
                      <button
                        data-pm-emerald
                        data-no-contrast-guard
                        className="allow-white inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#B89555]/60 px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
                        style={{ background: EMERALD_GRADIENT, color: "#FFFFFF" }}
                      >
                        <span>Know more about the founder</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="space-y-4 text-base leading-relaxed">
                  <p>
                    JBJ Global Real Estate L.L.C. S.O.C is a licensed real estate
                    brokerage authorized to facilitate property transactions
                    across the UAE. We support local and international clients
                    through every stage of the real estate journey — from market
                    understanding and opportunity evaluation to transaction
                    coordination and completion.
                  </p>
                  <p>
                    Our role is brokerage and coordination. Where additional
                    services are required, we introduce clients to independent,
                    licensed partners operating under their own regulatory
                    frameworks.
                  </p>
                </motion.div>
              </motion.div>
            </BrandPanel>
          </FounderContent>

          {/* ── OUR APPROACH ── locked 2-col grid, emerald tiles ── */}
          <BrandPanel
            eyebrow="Our Approach"
            title="Informed, structured, verified"
            text="We believe real estate decisions must be informed, structured, and grounded in verified data — not sales pressure or assumptions. Every engagement is handled with clarity on scope, responsibility, and next steps."
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid items-stretch gap-8 lg:grid-cols-2"
            >
              <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { Icon: BarChart3, label: "Market Intelligence from Official Data" },
                  { Icon: FileCheck, label: "Clear Process Mapping" },
                  { Icon: Target, label: "Disciplined Transaction Management" },
                  { Icon: Shield, label: "Defined Compliance Boundaries" },
                ].map(({ Icon, label }) => (
                  <EmeraldTile key={label}>
                    <EmeraldIcon icon={Icon} />
                    <p className="mt-3 text-sm font-semibold leading-snug">{label}</p>
                  </EmeraldTile>
                ))}
              </motion.div>

              <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl">
                <img
                  src={luxuryVilla1}
                  alt="Premium Advisory Services"
                  className="h-full max-h-[420px] w-full rounded-2xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
            </motion.div>
          </BrandPanel>

          {/* ── WHAT WE DO ── 3-card grid ── */}
          <BrandPanel eyebrow="What We Do" title="The scope of our brokerage">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              <FeatureCard
                icon={Building2}
                title="Property Buying & Selling"
                description="Off-plan and ready property buying, primary and secondary selling, with structured transaction support."
              />
              <FeatureCard
                icon={Users}
                title="Residential & Commercial Rentals"
                description="Rental coordination for landlords and tenants across residential and commercial properties."
              />
              <FeatureCard
                icon={Heart}
                title="Intelligence & Partner Introductions"
                description="Market intelligence, area analysis, investment education, and introductions to licensed partners — all within our licensed scope."
              />
            </motion.div>
          </BrandPanel>

          {/* ── DATA-DRIVEN ── ── */}
          <BrandPanel
            eyebrow="Market Intelligence & Data"
            title="Data-driven, not opinion-driven"
            text="Our market insights, reports, and tools are built using aggregated official data and verified market information. Designed to support understanding and comparison — never to predict outcomes or guarantee results."
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid items-stretch gap-8 lg:grid-cols-2"
            >
              <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl">
                <img
                  src={luxuryVilla2}
                  alt="Market Intelligence Analysis"
                  className="h-full max-h-[420px] w-full rounded-2xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 to-transparent" />
              </motion.div>
              <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { Icon: BarChart3, label: "Government Data" },
                  { Icon: Building2, label: "Infrastructure" },
                  { Icon: TrendingUp, label: "Market Cycles" },
                  { Icon: Target, label: "Planning Strategy" },
                ].map(({ Icon, label }) => (
                  <EmeraldTile key={label}>
                    <EmeraldIcon icon={Icon} />
                    <p className="mt-3 text-sm font-semibold leading-snug">{label}</p>
                  </EmeraldTile>
                ))}
              </motion.div>
            </motion.div>
          </BrandPanel>

          {/* ── REGULATORY BOUNDARIES ── ── */}
          <BrandPanel eyebrow="Regulatory Boundaries" title="What we do NOT provide directly">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  To maintain compliance and protect our clients, it is
                  important to be clear about what we do not provide directly.
                </p>
                <p>
                  Where such services are required, clients are introduced to
                  independent, licensed partners and contract directly with
                  them.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { Icon: Scale, label: "Legal advice or legal services" },
                  { Icon: BarChart3, label: "Mortgage or banking services" },
                  { Icon: TrendingUp, label: "Financial or investment advisory" },
                  { Icon: FileCheck, label: "Immigration or visa issuance" },
                ].map(({ Icon, label }) => (
                  <EmeraldTile key={label}>
                    <EmeraldIcon icon={Icon} />
                    <p className="mt-3 text-sm font-semibold leading-snug">{label}</p>
                  </EmeraldTile>
                ))}
              </div>
            </div>
          </BrandPanel>

          {/* ── TRUST & GOVERNANCE ── 4 cards ── */}
          <BrandPanel eyebrow="Trust & Governance" title="Trust, governance, and accountability">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              <FeatureCard icon={Shield} title="AI Tools Monitored" description="AI-assisted tools are monitored and logged for transparency and accuracy." />
              <FeatureCard icon={FileCheck} title="Intelligence Reviewed" description="Market intelligence is reviewed before publication to ensure quality." />
              <FeatureCard icon={Scale} title="Data Confidentiality" description="Client data is handled with confidentiality and access controls." />
              <FeatureCard icon={Target} title="Licensed Scope" description="All activities remain within licensed scope. Trust built through discipline." />
            </motion.div>
          </BrandPanel>

          {/* ── COMMITMENT ── ── */}
          <BrandPanel eyebrow="Our Commitment" title="Real estate is not about speed. It is about precision.">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  We are committed to clear communication, accurate information,
                  structured processes, and long-term client trust.
                </p>
                <p className="text-sm" style={{ color: "rgba(26,26,26,0.72)" }}>
                  JBJ Global Real Estate is a licensed real estate brokerage in
                  Dubai (Mainland). For regulated services outside our scope, we
                  facilitate introductions to independent licensed partners. All
                  engagements are governed by UAE law and applicable regulations.
                </p>
              </div>
              <div
                data-pm-emerald
                className="inline-flex h-20 w-20 items-center justify-center justify-self-center rounded-full text-xl font-bold md:justify-self-end"
                style={{ background: EMERALD_GRADIENT, color: "#FFFFFF" }}
              >
                JBJ
              </div>
            </div>
          </BrandPanel>

          {/* ── CTA — canonical MIPreFooterCard, locked width ── */}
          <MIPreFooterCard
            title="Not Sure Where to Start?"
            subtitle="Whether you are buying, renting, investing, or simply seeking clarity, our role is to guide you with precision, not pressure."
            primaryLink="/contact"
            primaryText="Speak With Our Team"
            secondaryLink="/ai-home-finder"
            secondaryText="AI Home Finder"
            maxWidthClass="max-w-6xl"
          />
        </main>
      </BrandPageShell>
    </>
  );
};

export default About;
