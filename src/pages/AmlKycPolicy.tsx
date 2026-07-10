/**
 * AML & KYC Policy — rebuilt on ContentPageShell (LOCKED layout).
 * Solid emerald hero (centered), floating right-side emerald TOC,
 * full-width content column with premium champagne cards.
 */
import { Link } from "react-router-dom";
import { ReactNode } from "react";
import {
  ShieldCheck, Scale, UserCheck, Search, FileWarning, Archive, Handshake,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import ContentPageShell, { ContentSection } from "@/components/content-page/ContentPageShell";

const HEADING_FONT = {
  fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
};

const SECTIONS: ContentSection[] = [
  { id: "regulatory-framework",  title: "Regulatory Framework",           icon: Scale },
  { id: "client-verification",   title: "Client Verification & Due Diligence", icon: UserCheck },
  { id: "enhanced-review",       title: "Enhanced Due Diligence",         icon: Search },
  { id: "suspicious-activity",   title: "Internal Escalation & Reporting", icon: FileWarning },
  { id: "record-management",     title: "Secure Record Management",       icon: Archive },
  { id: "client-obligations",    title: "Client Obligations",             icon: Handshake },
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
  children,
}: {
  number: string;
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
  return (
    <>
      <SEOHead
        title="AML & KYC Policy | JBJ Global Real Estate"
        description="Anti-Money Laundering and Know Your Customer compliance framework at JBJ Global Real Estate, aligned with UAE regulatory standards."
        canonicalPath="/aml-kyc"
      />

      <ContentPageShell
        hero={{
          eyebrow: "Compliance Policy",
          eyebrowIcon: ShieldCheck,
          title: (
            <>
              Anti-Money Laundering<br className="hidden sm:block" /> &amp; KYC Policy
            </>
          ),
          subtitle: "Commitment to Financial Integrity, Transparency & Regulatory Compliance",
          height: "lg",
        }}
        sections={SECTIONS}
        tocTitle="In This Policy"
      >
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
                    <strong className="text-[#0d3a2b] font-semibold">{title}</strong> — {desc}
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
              <Link
                to="/privacy"
                className="text-[#064E3B] font-medium underline underline-offset-2 hover:text-[#0d3a2b]"
              >
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

        {/* Footer */}
        <div className="mt-14 sm:mt-16 pt-8 border-t border-[#B89555]/25 text-center">
          <p className="text-[#1A1A1A]/65 text-xs sm:text-sm leading-relaxed mb-4 max-w-xl mx-auto">
            This AML &amp; KYC Policy may be updated periodically to reflect regulatory developments.
          </p>
          <p className="text-[#1A1A1A]/75 text-sm">
            &copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.
          </p>
          <div className="flex justify-center gap-4 mt-3 text-sm">
            <Link
              to="/privacy"
              className="text-[#064E3B] font-medium hover:underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            <span className="text-[#B89555]/60">|</span>
            <Link
              to="/terms"
              className="text-[#064E3B] font-medium hover:underline underline-offset-2"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </ContentPageShell>
    </>
  );
};

export default AmlKycPolicy;
