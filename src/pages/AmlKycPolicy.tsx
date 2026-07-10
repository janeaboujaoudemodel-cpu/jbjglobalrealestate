import { Link } from "react-router-dom";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

/* ────────────────────────────────────────────────────────────
   AML & KYC Policy — rebuilt PASS
   Palette: Emerald ink (#064E3B → #000) + Champagne (#FDFBF7 /
   #F7F2EA / #EFE6D6) + Gold hairline (#B89555).
   Typography: Cormorant Garamond (site standard) for headings,
   system sans for body. Fully responsive: mobile-first, tablet
   grid, desktop split with sticky TOC.
   ──────────────────────────────────────────────────────────── */

const TOC = [
  { id: "regulatory-framework", label: "Regulatory Framework" },
  { id: "client-verification", label: "Client Verification & Due Diligence" },
  { id: "enhanced-review", label: "Enhanced Due Diligence" },
  { id: "suspicious-activity", label: "Internal Escalation & Reporting" },
  { id: "record-management", label: "Secure Record Management" },
  { id: "client-obligations", label: "Client Obligations" },
];

const HEADING_FONT = { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' };

const SectionCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={
      "relative rounded-2xl bg-[#FDFBF7] border border-[#B89555]/25 " +
      "shadow-[0_1px_0_rgba(184,149,85,0.08),0_20px_40px_-30px_rgba(6,78,59,0.25)] " +
      "p-5 sm:p-7 md:p-8 " +
      className
    }
  >
    {children}
  </div>
);

const SectionHeading = ({ number, children }: { number: string; children: React.ReactNode }) => (
  <div className="flex items-baseline gap-3 sm:gap-4 mb-4 sm:mb-5">
    <span
      className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-[#064E3B] text-[#F5F0E0] text-sm font-semibold"
      aria-hidden
    >
      {number}
    </span>
    <h2
      className="text-2xl sm:text-3xl md:text-[32px] font-semibold text-[#0d3a2b] tracking-tight leading-tight"
      style={HEADING_FONT}
    >
      {children}
    </h2>
  </div>
);

const Divider = () => (
  <div className="my-10 sm:my-12 flex items-center gap-4" aria-hidden>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#B89555]/30 to-transparent" />
    <span className="h-1.5 w-1.5 rounded-full bg-[#B89555]/60" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#B89555]/30 to-transparent" />
  </div>
);

const AmlKycPolicy = () => {
  const [active, setActive] = useState<string>(TOC[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0.01 }
    );
    TOC.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <SEOHead
        title="AML & KYC Policy | JBJ Global Real Estate"
        description="Anti-Money Laundering and Know Your Customer compliance framework at JBJ Global Real Estate, aligned with UAE regulatory standards."
        canonicalPath="/aml-kyc"
      />

      <main className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        {/* ─── Hero (emerald ink) ─── */}
        <section
          data-hero-dark
          data-surface="emerald"
          data-no-contrast-guard
          className="relative overflow-hidden border-b border-[#B89555]/25"
          style={{
            background:
              "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000000 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse at 20% 20%, rgba(110,231,183,0.18), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(184,149,85,0.16), transparent 60%)",
            }}
            aria-hidden
          />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#B89555]/40 bg-white/5 px-3 py-1 mb-6 backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-[#E8CF8A]" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-[#E8CF8A] font-medium">
                  Compliance Policy
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-semibold text-white leading-[1.1] tracking-tight mb-5"
                style={HEADING_FONT}
              >
                Anti-Money Laundering &amp; KYC Policy
              </h1>
              <p
                className="text-base sm:text-lg md:text-xl text-[#E8CF8A] mb-5 italic"
                style={HEADING_FONT}
              >
                Commitment to Financial Integrity, Transparency &amp; Regulatory Compliance
              </p>
              <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed max-w-2xl">
                We are committed to preventing money laundering, terrorist financing, fraud, and
                illicit financial activity. Our AML and KYC framework aligns with applicable UAE
                regulatory standards.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── Body ─── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16">
          <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
            {/* Desktop sticky TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-[#B89555]/25 bg-[#FDFBF7] p-5 shadow-[0_1px_0_rgba(184,149,85,0.08)]">
                <p
                  className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#064E3B] mb-4"
                  style={HEADING_FONT}
                >
                  Contents
                </p>
                <nav className="space-y-0.5">
                  {TOC.map(({ id, label }) => {
                    const isActive = active === id;
                    return (
                      <button
                        key={id}
                        onClick={() => scrollTo(id)}
                        className={
                          "group flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors " +
                          (isActive
                            ? "bg-[#064E3B]/8 text-[#064E3B] font-medium"
                            : "text-[#1A1A1A]/70 hover:text-[#064E3B] hover:bg-[#EFE6D6]/60")
                        }
                      >
                        <ChevronRight
                          className={
                            "h-3.5 w-3.5 shrink-0 transition-transform " +
                            (isActive ? "text-[#064E3B]" : "text-[#B89555]/60 group-hover:text-[#064E3B]")
                          }
                        />
                        <span className="min-w-0">{label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Mobile / tablet TOC (horizontal chips) */}
            <div className="lg:hidden mb-8 -mx-4 sm:mx-0">
              <div className="px-4 sm:px-0">
                <p
                  className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#064E3B] mb-3"
                  style={HEADING_FONT}
                >
                  Contents
                </p>
              </div>
              <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {TOC.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={
                      "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs sm:text-sm transition-colors " +
                      (active === id
                        ? "bg-[#064E3B] text-white border-[#064E3B]"
                        : "bg-[#FDFBF7] text-[#0d3a2b] border-[#B89555]/35 hover:border-[#064E3B]/50")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="min-w-0">
              <section id="regulatory-framework" className="scroll-mt-28">
                <SectionHeading number="1">Regulatory Framework</SectionHeading>
                <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
                  <p>Our compliance framework operates in alignment with:</p>
                  <ul className="space-y-2.5 pl-1">
                    {[
                      "UAE Federal Anti-Money Laundering regulations",
                      "Real estate regulatory compliance requirements applicable within the UAE",
                      "Financial transparency and reporting standards as prescribed by competent UAE authorities",
                    ].map((t) => (
                      <li key={t} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B89555] shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 rounded-xl border-l-2 border-[#064E3B] bg-[#F7F2EA] px-4 py-3">
                    <p className="text-sm text-[#1A1A1A]/75">
                      We operate in accordance with applicable UAE laws and regulatory frameworks.
                      We are not a regulatory authority.
                    </p>
                  </div>
                </SectionCard>
              </section>

              <Divider />

              <section id="client-verification" className="scroll-mt-28">
                <SectionHeading number="2">Client Verification &amp; Due Diligence</SectionHeading>
                <SectionCard className="text-[#1A1A1A]/80 leading-relaxed text-[15px] sm:text-base">
                  <p className="mb-5">
                    As part of our commitment to regulatory compliance, we implement structured
                    client verification and due diligence procedures:
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { title: "Identity Verification", desc: "Collection and verification of government-issued identification documents." },
                      { title: "Source of Funds", desc: "Request for documentation evidencing the origin of funds used in transactions." },
                      { title: "Risk Profiling", desc: "Assessment of client risk levels based on established criteria and regulatory guidance." },
                      { title: "PEP Screening", desc: "Screening against Politically Exposed Person (PEP) databases where applicable." },
                      { title: "Ongoing Monitoring", desc: "Periodic review and monitoring of client relationships where warranted." },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 p-4 hover:border-[#064E3B]/40 transition-colors"
                      >
                        <p
                          className="font-semibold text-[#0d3a2b] text-[15px] mb-1"
                          style={HEADING_FONT}
                        >
                          {item.title}
                        </p>
                        <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </section>

              <Divider />

              <section id="enhanced-review" className="scroll-mt-28">
                <SectionHeading number="3">Enhanced Due Diligence</SectionHeading>
                <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
                  <p>
                    For elevated-risk classifications, additional documentation and review measures
                    may apply, including:
                  </p>
                  <ul className="space-y-3">
                    {[
                      ["Expanded Documentation", "Additional supporting documents may be requested."],
                      ["Additional Verification", "Enhanced verification procedures may be conducted."],
                      ["Senior Compliance Review", "Higher-risk cases are escalated for senior review."],
                      ["Increased Transaction Monitoring", "Monitoring frequency may be increased."],
                    ].map(([title, desc]) => (
                      <li key={title} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B89555] shrink-0" />
                        <span>
                          <strong className="text-[#0d3a2b] font-semibold">{title}</strong>{" "}
                          — {desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </section>

              <Divider />

              <section id="suspicious-activity" className="scroll-mt-28">
                <SectionHeading number="4">Internal Escalation &amp; Reporting</SectionHeading>
                <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
                  <p>In the event of suspicious activity indicators:</p>
                  <ul className="space-y-2.5">
                    {[
                      "An internal compliance review is initiated promptly",
                      "Relevant documentation and transaction records are evaluated",
                      "Reporting obligations are fulfilled where legally required under applicable UAE law",
                    ].map((t) => (
                      <li key={t} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B89555] shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-[#1A1A1A]/70">
                    All internal reviews are conducted with discretion and in accordance with
                    established procedures.
                  </p>
                </SectionCard>
              </section>

              <Divider />

              <section id="record-management" className="scroll-mt-28">
                <SectionHeading number="5">Secure Record Management</SectionHeading>
                <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
                  <p>
                    We maintain rigorous standards for the storage and protection of
                    compliance-related records:
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "Secure digital storage with encryption protocols",
                      "Restricted access controls limiting data to authorised compliance personnel",
                      "Retention periods in accordance with applicable legal obligations",
                      "Protection of sensitive client documentation at all stages of processing",
                    ].map((t) => (
                      <li key={t} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B89555] shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-[#1A1A1A]/70">
                    For further information on data handling, please refer to our{" "}
                    <Link to="/privacy" className="text-[#064E3B] font-medium underline underline-offset-2 hover:text-[#0d3a2b]">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </SectionCard>
              </section>

              <Divider />

              <section id="client-obligations" className="scroll-mt-28">
                <SectionHeading number="6">Client Obligations</SectionHeading>
                <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
                  <p>Clients engaging with our services are required to:</p>
                  <ul className="space-y-2.5">
                    {[
                      "Provide accurate and complete documentation as requested",
                      "Cooperate fully with verification and due diligence procedures",
                      "Notify us promptly of any material changes to previously provided information",
                    ].map((t) => (
                      <li key={t} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B89555] shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <p>
                    Failure to comply with verification requirements may result in the suspension
                    or termination of services.
                  </p>
                </SectionCard>
              </section>

              {/* Footer block */}
              <div className="mt-14 sm:mt-16 pt-8 border-t border-[#B89555]/25 text-center">
                <p className="text-[#1A1A1A]/65 text-xs sm:text-sm leading-relaxed mb-4 max-w-xl mx-auto">
                  This AML &amp; KYC Policy may be updated periodically to reflect regulatory
                  developments.
                </p>
                <p className="text-[#1A1A1A]/75 text-sm">
                  &copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.
                </p>
                <div className="flex justify-center gap-4 mt-3 text-sm">
                  <Link to="/privacy" className="text-[#064E3B] font-medium hover:underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  <span className="text-[#B89555]/60">|</span>
                  <Link to="/terms" className="text-[#064E3B] font-medium hover:underline underline-offset-2">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AmlKycPolicy;
