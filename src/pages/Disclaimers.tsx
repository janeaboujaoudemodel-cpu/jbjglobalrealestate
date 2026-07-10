/**
 * Disclaimer & Professional Scope — rebuilt on ContentPageShell (LOCKED layout).
 */
import { Building2, Scale, BarChart3, Globe, Cpu, ExternalLink, ShieldCheck, UserCheck, Landmark } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import ContentPageShell, { ContentSection } from "@/components/content-page/ContentPageShell";
import { SectionCard, SectionHeading, SectionDivider, BulletList, LegalFooter } from "@/components/content-page/LegalParts";

const SECTIONS: ContentSection[] = [
  { id: "s1", title: "Licensed Brokerage Scope",       icon: Building2 },
  { id: "s2", title: "Scope Boundaries",               icon: Scale },
  { id: "s3", title: "Data & Market Information",      icon: BarChart3 },
  { id: "s4", title: "Residency & Golden Visa",        icon: Globe },
  { id: "s5", title: "Digital & AI Advisory Tools",    icon: Cpu },
  { id: "s6", title: "External Platforms",             icon: ExternalLink },
  { id: "s7", title: "Liability Clarification",        icon: ShieldCheck },
  { id: "s8", title: "Client Responsibility",          icon: UserCheck },
  { id: "s9", title: "Regulatory Position",            icon: Landmark },
];

const Disclaimers = () => (
  <>
    <SEOHead
      title="Disclaimer & Professional Scope | JBJ Global Real Estate"
      description="Licensed real estate brokerage transparency — professional scope, regulatory clarifications, and user responsibilities."
      canonicalPath="/disclaimers"
    />

    <ContentPageShell
      hero={{
        eyebrow: "Legal Transparency",
        eyebrowIcon: Scale,
        title: "Disclaimer & Professional Scope",
        subtitle: "Licensed Real Estate Brokerage Transparency",
        height: "lg",
      }}
      sections={SECTIONS}
      tocTitle="In This Disclaimer"
    >
      <section id="s1" className="scroll-mt-28">
        <SectionHeading number={1} icon={Building2}>Licensed Brokerage Scope</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>JBJ Global Real Estate is authorised to conduct the following activities under its UAE commercial licence:</p>
          <BulletList items={["Buying and selling real estate","Leasing and rental brokerage","Property acquisition advisory","Real estate investment analysis within brokerage scope","Market research and pricing analysis","Developer project consulting","Portfolio advisory related to property assets"]} />
          <p>All advisory services provided relate strictly to property and real estate transactions within the framework of applicable UAE regulations.</p>
          <p className="text-[#0d3a2b] font-medium">We are legally permitted to provide real estate investment advisory as part of licensed brokerage services.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="s2" className="scroll-mt-28">
        <SectionHeading number={2} icon={Scale}>Scope Boundaries</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>JBJ Global Real Estate does not provide:</p>
          <BulletList items={["Legal representation services","Immigration law representation","Certified tax consultancy","Corporate structuring advice","Independent financial planning outside property scope"]} />
          <p>Where required, clients may engage licensed legal advisors, tax consultants, or government-approved entities for specialised services.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="s3" className="scroll-mt-28">
        <SectionHeading number={3} icon={BarChart3}>Data &amp; Market Information</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>Property pricing, availability, rental yield projections, and investment analytics are based on developer data, market statistics, government publications, and internal analytical tools.</p>
          <p>While reasonable care is taken to ensure accuracy:</p>
          <BulletList items={["Prices may change without notice","Availability may vary","Market conditions fluctuate","Projected returns are not guaranteed outcomes"]} />
          <p>All investment decisions should be supported by independent due diligence.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="s4" className="scroll-mt-28">
        <SectionHeading number={4} icon={Globe}>Residency &amp; Golden Visa Information</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>Information provided regarding UAE Golden Visa or residency eligibility is based on publicly available government guidelines.</p>
          <p>Final approval, eligibility, and processing decisions remain exclusively under the authority of relevant UAE government entities.</p>
          <p className="text-[#0d3a2b] font-medium">JBJ Global Real Estate does not issue visas nor guarantee residency approval.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="s5" className="scroll-mt-28">
        <SectionHeading number={5} icon={Cpu}>Digital &amp; AI Advisory Tools</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>AI-powered tools provided on this platform offer analytical insights, forecasts, and data modeling for real estate evaluation. These tools:</p>
          <BulletList items={["Provide predictive insights","Do not guarantee investment outcomes","Support decision-making","Do not replace professional consultation"]} />
          <p>Users are responsible for validating outputs before executing financial commitments.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="s6" className="scroll-mt-28">
        <SectionHeading number={6} icon={ExternalLink}>External Platforms &amp; References</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>The platform may reference third-party data sources, developers, or external property platforms. JBJ Global Real Estate is not responsible for:</p>
          <BulletList items={["Third-party platform content","External website policies","Developer operational decisions","Construction delays","Changes in external terms"]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="s7" className="scroll-mt-28">
        <SectionHeading number={7} icon={ShieldCheck}>Liability Clarification</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>JBJ Global Real Estate shall not be held liable for:</p>
          <BulletList items={["Market fluctuations","Developer timeline changes","Investment performance outcomes","Financing approvals","Government processing delays"]} />
          <p>Real estate transactions inherently carry market risks.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="s8" className="scroll-mt-28">
        <SectionHeading number={8} icon={UserCheck}>Client Responsibility</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>By using this platform, users acknowledge:</p>
          <BulletList items={["Responsibility for independent verification","Understanding of market risk","Acceptance of advisory nature of projections","Commitment to due diligence"]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="s9" className="scroll-mt-28">
        <SectionHeading number={9} icon={Landmark}>Regulatory Position</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>JBJ Global Real Estate operates in compliance with UAE real estate regulations and conducts brokerage activities within licensed scope.</p>
          <p>This disclaimer ensures transparency and regulatory clarity.</p>
        </SectionCard>
      </section>

      <LegalFooter
        leftLink={{ to: "/privacy", label: "Privacy Policy" }}
        rightLink={{ to: "/terms", label: "Terms of Service" }}
      />
    </ContentPageShell>
  </>
);

export default Disclaimers;
