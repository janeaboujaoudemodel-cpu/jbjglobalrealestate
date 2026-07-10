/**
 * Intellectual Property — rebuilt on ContentPageShell (LOCKED layout).
 * Centered emerald hero, floating right-side emerald TOC, full-width
 * champagne content — same standard as AML/KYC Policy.
 */
import { Link } from "react-router-dom";
import { ReactNode } from "react";
import {
  Copyright as CopyrightIcon,
  Shield,
  Lock,
  FileText,
  Scale,
  Eye,
  AlertTriangle,
  Fingerprint,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import ContentPageShell, { ContentSection } from "@/components/content-page/ContentPageShell";

const HEADING_FONT = {
  fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
};

const SECTIONS: ContentSection[] = [
  { id: "copyright",          title: "Copyright Statement",        icon: CopyrightIcon },
  { id: "protected",          title: "Protected Assets",           icon: Lock },
  { id: "legal-framework",    title: "Legal Framework",            icon: Scale },
  { id: "prohibited",         title: "Prohibited Actions",         icon: AlertTriangle },
  { id: "digital-protection", title: "Digital Protection",         icon: Fingerprint },
  { id: "enforcement",        title: "Enforcement & Remedies",     icon: Scale },
  { id: "contact",            title: "Licensing Inquiries",        icon: FileText },
];

const SectionCard = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    data-no-contrast-guard
    style={{ color: "#1A1A1A" }}
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

const SectionHeading = ({
  number,
  icon: Icon,
  children,
}: {
  number: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) => (
  <div className="flex items-baseline gap-3 sm:gap-4 mb-4 sm:mb-5">
    <span
      className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-[#064E3B] text-[#F5F0E0] text-sm font-semibold"
      aria-hidden
    >
      {number}
    </span>
    <h2
      className="text-2xl sm:text-3xl md:text-[32px] font-semibold text-[#0d3a2b] tracking-tight leading-tight flex items-center gap-3"
      style={HEADING_FONT}
    >
      {Icon && <Icon className="w-6 h-6 text-[#B89555]" />}
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

const IntellectualProperty = () => {
  const year = new Date().getFullYear();

  return (
    <>
      <SEOHead
        title="Intellectual Property | JBJ Global Real Estate"
        description="Legal protection, copyright notice, and intellectual property rights for JBJ Global Real Estate platform and digital assets."
        canonicalPath="/intellectual-property"
      />

      <ContentPageShell
        hero={{
          eyebrow: "Legal",
          eyebrowIcon: Shield,
          title: "Intellectual Property",
          subtitle: "Legal Protection & Copyright Notice",
          height: "lg",
        }}
        sections={SECTIONS}
        tocTitle="In This Policy"
      >
        <section id="copyright" className="scroll-mt-28">
          <SectionHeading number="1" icon={CopyrightIcon}>Official Copyright Statement</SectionHeading>
          <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
            <p className="text-lg">
              © {year} <span className="text-[#0d3a2b] font-semibold">JBJ Global Real Estate</span>. All Rights Reserved.
            </p>
            <p>
              This platform, including but not limited to all software code, AI algorithms, user
              interface designs, branding elements, written content, graphics, and digital assets,
              is the exclusive intellectual property of{" "}
              <span className="text-[#0d3a2b] font-semibold">JBJ Global Real Estate</span>.
            </p>
          </SectionCard>
        </section>

        <Divider />

        <section id="protected" className="scroll-mt-28">
          <SectionHeading number="2" icon={Lock}>Protected Assets &amp; Technologies</SectionHeading>
          <SectionCard className="text-[#1A1A1A]/80 leading-relaxed text-[15px] sm:text-base">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "JBJ AI Property Evaluator", desc: "Proprietary valuation algorithms" },
                { title: "JBJ AI Rental Index", desc: "Market analysis technology" },
                { title: "JBJ AI Budget Planner", desc: "Affordability analysis engine" },
                { title: "JBJ Scan & Sign Documents", desc: "Intelligent parsing system" },
                { title: "JBJ AI Interior Designer", desc: "Design generation technology" },
                { title: "JBJ Property Comparison", desc: "Multi-property analysis tool" },
                { title: "JBJ Broker Toolkit", desc: "Professional tools suite" },
                { title: "JBJ Guides & Resources", desc: "Educational content library" },
                { title: "JBJ Platform UI/UX Design", desc: "Interface designs & layouts" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 p-4 hover:border-[#064E3B]/40 transition-colors"
                >
                  <p className="font-semibold text-[#0d3a2b] text-[15px] mb-1" style={HEADING_FONT}>
                    {item.title}
                  </p>
                  <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <Divider />

        <section id="legal-framework" className="scroll-mt-28">
          <SectionHeading number="3" icon={Scale}>Legal Framework &amp; Jurisdiction</SectionHeading>
          <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
            <p>
              All intellectual property rights are protected under the laws of the{" "}
              <span className="text-[#0d3a2b] font-semibold">United Arab Emirates</span>, including but not limited to:
            </p>
            <ul className="space-y-3">
              {[
                { law: "UAE Federal Law No. 38 of 2021", desc: "Concerning Copyrights and Related Rights" },
                { law: "UAE Trademark Law", desc: "Federal Law No. 37 of 1992 (as amended)" },
                { law: "DIFC Intellectual Property Law", desc: "Law No. 4 of 2019" },
                { law: "International WIPO Treaties", desc: "Berne Convention & Paris Convention" },
              ].map((item) => (
                <li key={item.law} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B89555] shrink-0" />
                  <span>
                    <strong className="text-[#0d3a2b] font-semibold">{item.law}</strong> — {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </section>

        <Divider />

        <section id="prohibited" className="scroll-mt-28">
          <SectionHeading number="4" icon={AlertTriangle}>Strictly Prohibited Actions</SectionHeading>
          <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
            <p>
              The following activities are{" "}
              <span className="text-[#7f1d1d] font-semibold">strictly prohibited</span> and will result in legal action:
            </p>
            <ul className="space-y-2.5">
              {[
                "Copying, reproducing, or cloning any part of this platform or its features",
                "Reverse engineering AI algorithms or proprietary systems",
                "Unauthorised distribution of platform content, documents, or materials",
                "Removing watermarks, copyright notices, or attribution statements",
                "Creating derivative works without explicit written consent",
                "Commercial use of any platform assets without licensing agreement",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 text-[#7f1d1d] font-bold shrink-0">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </section>

        <Divider />

        <section id="digital-protection" className="scroll-mt-28">
          <SectionHeading number="5" icon={Fingerprint}>Digital Protection Measures</SectionHeading>
          <SectionCard className="text-[#1A1A1A]/80 leading-relaxed text-[15px] sm:text-base">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Eye, title: "Dynamic Watermarking", desc: "All downloadable documents and PDFs contain unique, traceable watermarks linking content to the downloading user." },
                { icon: Lock, title: "Session Security", desc: "Content access is monitored with device fingerprinting and session validation to prevent unauthorised sharing." },
                { icon: FileText, title: "Access Logging", desc: "All content access is logged and can be audited to trace any unauthorised distribution back to its source." },
                { icon: Shield, title: "Copy Protection", desc: "Platform implements measures to prevent unauthorised copying, screenshots, and screen recording of protected content." },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 p-4 hover:border-[#064E3B]/40 transition-colors"
                >
                  <item.icon className="w-6 h-6 text-[#B89555] mb-2" />
                  <p className="font-semibold text-[#0d3a2b] text-[15px] mb-1" style={HEADING_FONT}>
                    {item.title}
                  </p>
                  <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <Divider />

        <section id="enforcement" className="scroll-mt-28">
          <SectionHeading number="6" icon={Scale}>Enforcement &amp; Legal Remedies</SectionHeading>
          <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
            <p>
              JBJ Global Real Estate reserves the right to pursue all available legal remedies
              against infringers, including but not limited to:
            </p>
            <ul className="space-y-2.5">
              {[
                "Injunctive relief to immediately cease infringing activities",
                "Monetary damages including actual damages and disgorgement of profits",
                "Statutory damages as provided under UAE copyright law",
                "Recovery of attorney fees and litigation costs",
                "Criminal prosecution where applicable under UAE law",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B89555] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </section>

        <Divider />

        <section id="contact" className="scroll-mt-28">
          <SectionHeading number="7" icon={FileText}>Licensing &amp; Legal Inquiries</SectionHeading>
          <SectionCard className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] sm:text-base">
            <p>
              For licensing requests, partnership inquiries, or to report intellectual property
              violations, please contact our legal department:
            </p>
            <div className="rounded-xl border-l-2 border-[#064E3B] bg-[#F7F2EA] px-4 py-3 space-y-1.5">
              <p><strong className="text-[#0d3a2b]">Email:</strong> privacy@jbj.ae</p>
              <p><strong className="text-[#0d3a2b]">Legal Representative:</strong> JBJ Global Real Estate</p>
              <p><strong className="text-[#0d3a2b]">Jurisdiction:</strong> Dubai, United Arab Emirates</p>
            </div>
          </SectionCard>
        </section>

        <div className="mt-14 sm:mt-16 pt-8 border-t border-[#B89555]/25 text-center">
          <p className="text-[#1A1A1A]/65 text-xs sm:text-sm leading-relaxed mb-4 max-w-xl mx-auto">
            Last Updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          <p className="text-[#1A1A1A]/75 text-sm">
            &copy; {year} JBJ Global Real Estate. All Rights Reserved.
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
      </ContentPageShell>
    </>
  );
};

export default IntellectualProperty;
