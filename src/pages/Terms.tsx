/**
 * Terms of Service — rebuilt on ContentPageShell (LOCKED layout).
 */
import { Scale, Mail, FileText, User, Ban, Building2, Globe, Handshake, Lock, ShieldAlert, ShieldCheck, Power, Landmark, RefreshCcw, MapPin, Info } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import ContentPageShell, { ContentSection } from "@/components/content-page/ContentPageShell";
import { SectionCard, SectionHeading, SectionDivider, BulletList, LegalFooter } from "@/components/content-page/LegalParts";

const SECTIONS: ContentSection[] = [
  { id: "definitions",       title: "Definitions",                   icon: Info },
  { id: "scope",             title: "Scope of Services",             icon: FileText },
  { id: "eligibility",       title: "Eligibility",                   icon: User },
  { id: "responsibilities",  title: "User Responsibilities",         icon: ShieldAlert },
  { id: "listings",          title: "Property Listings Disclaimer",  icon: Building2 },
  { id: "golden-visa",       title: "Golden Visa Disclaimer",        icon: Globe },
  { id: "third-party",       title: "Third-Party Services",          icon: Handshake },
  { id: "ip",                title: "Intellectual Property",         icon: Lock },
  { id: "liability",         title: "Limitation of Liability",       icon: ShieldAlert },
  { id: "indemnification",   title: "Indemnification",               icon: ShieldCheck },
  { id: "privacy-ref",       title: "Privacy",                       icon: Lock },
  { id: "termination",       title: "Termination of Access",         icon: Power },
  { id: "governing-law",     title: "Governing Law",                 icon: Landmark },
  { id: "amendments",        title: "Amendments",                    icon: RefreshCcw },
  { id: "contact-info",      title: "Contact Information",           icon: Mail },
];

const Terms = () => (
  <>
    <SEOHead
      title="Terms of Service | JBJ Global Real Estate"
      description="Terms and conditions governing use of the JBJ Global Real Estate platform, services, and related advisory offerings in the UAE."
      canonicalPath="/terms"
    />

    <ContentPageShell
      hero={{
        eyebrow: "Legal",
        eyebrowIcon: Scale,
        title: "Terms of Service",
        subtitle: "Conditions Governing Use of Our Platform",
        height: "lg",
      }}
      sections={SECTIONS}
      tocTitle="In These Terms"
    >
      <section id="definitions" className="scroll-mt-28">
        <SectionHeading number={1} icon={Info}>Definitions</SectionHeading>
        <SectionCard className="space-y-3 text-[#1A1A1A]/80 leading-relaxed text-[15px]">
          <p><strong className="text-[#0d3a2b]">"Platform"</strong> — this website and all digital services operated by the Company.</p>
          <p><strong className="text-[#0d3a2b]">"Company"</strong> — JBJ Global Real Estate L.L.C. S.O.C, a licensed real estate brokerage registered in the United Arab Emirates.</p>
          <p><strong className="text-[#0d3a2b]">"User"</strong> — any individual or entity accessing or using the Platform.</p>
          <p><strong className="text-[#0d3a2b]">"Services"</strong> — the real estate advisory, consultancy, coordination, and digital tools provided through the Platform.</p>
          <p><strong className="text-[#0d3a2b]">"Third-Party Providers"</strong> — external service providers, developers, legal firms, or government-approved entities engaged in connection with our Services.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="scope" className="scroll-mt-28">
        <SectionHeading number={2} icon={FileText}>Scope of Services</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">The Platform provides:</p>
          <BulletList items={["Real estate listings and property information","Property consultancy and advisory services","Developer information and project intelligence","Property management services","Valuation coordination","Golden Visa assistance coordination (via licensed partners)","Related advisory and digital tools"]} />
          <div className="mt-6 flex items-start gap-3 rounded-xl border-l-2 border-[#064E3B] bg-[#F7F2EA] p-4">
            <Scale className="w-5 h-5 text-[#064E3B] shrink-0 mt-0.5" />
            <p className="text-sm text-[#0d3a2b]">The Company is a licensed real estate brokerage. It is not a government authority, legal firm, or financial institution.</p>
          </div>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="eligibility" className="scroll-mt-28">
        <SectionHeading number={3} icon={User}>Eligibility</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">By using this Platform, you confirm that you:</p>
          <BulletList items={["Are at least 18 years of age","Will use the Platform and Services lawfully and in good faith","Will provide accurate and truthful information in all submissions"]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="responsibilities" className="scroll-mt-28">
        <SectionHeading number={4} icon={ShieldAlert}>User Responsibilities</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">Users shall not:</p>
          <BulletList items={["Misuse or interfere with the Platform's functionality or security","Provide false, misleading, or fraudulent documents or information","Attempt to deceive the Company, its partners, or other users","Engage in any activity that violates applicable UAE law or regulations","Reproduce, redistribute, or commercially exploit Platform content without authorisation"]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="listings" className="scroll-mt-28">
        <SectionHeading number={5} icon={Building2}>Property Listings &amp; Information Accuracy</SectionHeading>
        <SectionCard>
          <BulletList items={["Property listings are provided for informational purposes only","Prices, availability, specifications, and imagery may change without notice","No guarantee of transaction completion is implied or provided","Final agreements are executed between buyer, seller, and relevant transacting parties","The Company does not warrant the accuracy of third-party information displayed on the Platform"]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="golden-visa" className="scroll-mt-28">
        <SectionHeading number={6} icon={Globe}>Golden Visa &amp; Immigration Disclaimer</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>The Platform does not grant, issue, or approve visas or residency permits.</p>
          <p>We coordinate with licensed, government-approved immigration partners to facilitate the application process on behalf of eligible clients.</p>
          <p>Final approval of any visa or residency application rests solely with the relevant UAE government authorities, including the Federal Authority for Identity, Citizenship, Customs &amp; Port Security (ICP) and the General Directorate of Residency and Foreigners Affairs (GDRFA).</p>
          <p className="font-medium text-[#0d3a2b]">We do not guarantee approval of any application.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="third-party" className="scroll-mt-28">
        <SectionHeading number={7} icon={Handshake}>Third-Party Services</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">In delivering our Services, we may engage or coordinate with:</p>
          <BulletList items={["Real estate developers","Licensed legal firms","Certified valuation companies","Government processing and immigration partners","Technology and payment service providers"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">The Company is not liable for delays, errors, omissions, or outcomes arising from third-party services.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="ip" className="scroll-mt-28">
        <SectionHeading number={8} icon={Lock}>Intellectual Property</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">All content on this Platform, including but not limited to:</p>
          <BulletList items={["Branding, logos, and trademarks","Website design and user interface","Written content, reports, and analyses","Graphics, images, and visual assets","Platform architecture and proprietary tools"]} />
          <p className="text-[#1A1A1A]/80 mt-4">is the exclusive property of the Company and is protected under applicable intellectual property laws.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="liability" className="scroll-mt-28">
        <SectionHeading number={9} icon={ShieldAlert}>Limitation of Liability</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">To the maximum extent permitted by applicable law, the Company shall not be held liable for:</p>
          <BulletList items={["Changes in market conditions or property values","Developer delays, construction issues, or project cancellations","Changes in government policy, regulation, or visa requirements","Rejection or non-approval of visa or residency applications","Investment losses or financial outcomes arising from property transactions","Service interruptions, technical errors, or data loss on the Platform"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">Users acknowledge that real estate transactions and immigration processes carry inherent risks and should seek independent professional advice.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="indemnification" className="scroll-mt-28">
        <SectionHeading number={10} icon={ShieldCheck}>Indemnification</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 leading-relaxed">
            Users agree to indemnify, defend, and hold harmless the Company, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, or expenses arising from or related to the User's misuse of the Platform, violation of these Terms, or breach of applicable law.
          </p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="privacy-ref" className="scroll-mt-28">
        <SectionHeading number={11} icon={Lock}>Privacy</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 leading-relaxed">
            Your use of this Platform is also governed by our{" "}
            <a href="/privacy" className="text-[#064E3B] font-medium hover:underline">Privacy Policy</a>,
            which outlines how we collect, use, process, and protect your personal data.
          </p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="termination" className="scroll-mt-28">
        <SectionHeading number={12} icon={Power}>Termination of Access</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">The Company reserves the right, at its sole discretion, to:</p>
          <BulletList items={["Suspend or terminate user accounts","Restrict access to the Platform or specific features","Remove content that violates these Terms or applicable law"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">Such actions may be taken without prior notice where reasonably necessary.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="governing-law" className="scroll-mt-28">
        <SectionHeading number={13} icon={Landmark}>Governing Law</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in the UAE.
          </p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="amendments" className="scroll-mt-28">
        <SectionHeading number={14} icon={RefreshCcw}>Amendments</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 leading-relaxed">
            The Company reserves the right to update or modify these Terms at any time. Updated Terms will be posted on this page. Continued use of the Platform following any changes constitutes acceptance of those changes.
          </p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="contact-info" className="scroll-mt-28">
        <SectionHeading number={15} icon={Mail}>Contact Information</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">For questions regarding these Terms:</p>
          <div className="rounded-xl border-l-2 border-[#064E3B] bg-[#F7F2EA] px-4 py-3 space-y-1.5">
            <p className="flex items-center gap-2 text-[#0d3a2b] font-semibold"><MapPin className="w-4 h-4 text-[#B89555]" />JBJ Global Real Estate</p>
            <p className="text-[#1A1A1A]/75 text-sm">Dubai, United Arab Emirates</p>
            <p className="text-sm mt-1">Email: <a href="mailto:legal@jbj.ae" className="text-[#064E3B] font-medium hover:underline">legal@jbj.ae</a></p>
          </div>
        </SectionCard>
      </section>

      <LegalFooter
        leftLink={{ to: "/privacy", label: "Privacy Policy" }}
        rightLink={{ to: "/cookies", label: "Cookie Policy" }}
      />
    </ContentPageShell>
  </>
);

export default Terms;
