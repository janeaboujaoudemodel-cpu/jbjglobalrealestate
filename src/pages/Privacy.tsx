/**
 * Privacy Policy — rebuilt on ContentPageShell (LOCKED layout).
 * Centered full-height emerald hero, floating right-side emerald TOC.
 */
import { Shield, Mail, FileText, Lock, Cookie, Baby, RefreshCcw, Users, MapPin, Database, Eye, Scale, Globe2, Archive, Info } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import ContentPageShell, { ContentSection } from "@/components/content-page/ContentPageShell";
import { SectionCard, SectionHeading, SectionDivider, BulletList, LegalFooter, HEADING_FONT } from "@/components/content-page/LegalParts";

const SECTIONS: ContentSection[] = [
  { id: "definitions",  title: "Definitions",                    icon: Info },
  { id: "scope",        title: "Scope of Policy",                icon: FileText },
  { id: "collect",      title: "Information We Collect",         icon: Database },
  { id: "how-collect",  title: "How We Collect Information",     icon: Eye },
  { id: "legal-basis",  title: "Legal Basis for Processing",     icon: Scale },
  { id: "use",          title: "How We Use Your Information",    icon: Shield },
  { id: "sharing",      title: "Data Sharing & Third Parties",   icon: Users },
  { id: "transfers",    title: "International Transfers",        icon: Globe2 },
  { id: "retention",    title: "Data Retention",                 icon: Archive },
  { id: "security",     title: "Data Security",                  icon: Lock },
  { id: "rights",       title: "Your Rights",                    icon: Shield },
  { id: "cookies",      title: "Cookies & Tracking",             icon: Cookie },
  { id: "children",     title: "Children's Privacy",             icon: Baby },
  { id: "changes",      title: "Changes to This Policy",         icon: RefreshCcw },
  { id: "contact-info", title: "Contact Information",            icon: Mail },
];

const Privacy = () => (
  <>
    <SEOHead
      title="Privacy Policy | JBJ Global Real Estate"
      description="Learn how JBJ Global Real Estate collects, uses, processes, and protects your personal data in accordance with UAE data protection principles."
      canonicalPath="/privacy"
    />

    <ContentPageShell
      hero={{
        eyebrow: "Legal",
        eyebrowIcon: Shield,
        title: "Privacy Policy",
        subtitle: "Your Data. Your Rights. Our Responsibility.",
        height: "lg",
      }}
      sections={SECTIONS}
      tocTitle="In This Policy"
    >
      <section id="definitions" className="scroll-mt-28">
        <SectionHeading number={1} icon={Info}>Definitions</SectionHeading>
        <SectionCard className="space-y-3 text-[#1A1A1A]/80 leading-relaxed text-[15px]">
          <p><strong className="text-[#0d3a2b]">"Personal Data"</strong> — any information that identifies or can identify an individual.</p>
          <p><strong className="text-[#0d3a2b]">"Processing"</strong> — collection, storage, usage, disclosure, or deletion of personal data.</p>
          <p><strong className="text-[#0d3a2b]">"User"</strong> — any website visitor or service client.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="scope" className="scroll-mt-28">
        <SectionHeading number={2} icon={FileText}>Scope of Policy</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">This Policy applies to:</p>
          <BulletList items={["Website visitors","Clients","Inquiry form submissions","Newsletter subscribers","Service applicants"]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="collect" className="scroll-mt-28">
        <SectionHeading number={3} icon={Database}>Information We Collect</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-5">We may collect the following categories of personal data:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "A. Identity", items: ["Full name", "Nationality", "Passport copy (where required)"] },
              { title: "B. Contact", items: ["Email address", "Phone number", "Mailing address"] },
              { title: "C. Financial", items: ["Investment preferences", "Budget range", "Secure payment provider data"] },
              { title: "D. Technical", items: ["IP address", "Browser type", "Device type", "Usage analytics"] },
              { title: "E. Transaction", items: ["Property interests", "Service requests", "Consultation notes"] },
            ].map((cat) => (
              <div key={cat.title} className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 p-4">
                <p className="font-semibold text-[#0d3a2b] mb-2" style={HEADING_FONT}>{cat.title}</p>
                <BulletList items={cat.items} />
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="how-collect" className="scroll-mt-28">
        <SectionHeading number={4} icon={Eye}>How We Collect Information</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">We collect data:</p>
          <BulletList items={["When you submit inquiry forms","When you request services","When you subscribe to updates","Through cookies and analytics tools","Through direct communication"]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="legal-basis" className="scroll-mt-28">
        <SectionHeading number={5} icon={Scale}>Legal Basis for Processing</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">We process personal data based on:</p>
          <BulletList items={["Consent","Contractual necessity","Legal obligations","Legitimate business interests"]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="use" className="scroll-mt-28">
        <SectionHeading number={6} icon={Shield}>How We Use Your Information</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">We use data to:</p>
          <BulletList items={["Provide real estate services","Facilitate Golden Visa applications (via licensed partners)","Provide property management services","Conduct valuations","Respond to inquiries","Improve website functionality","Send relevant communications (if consented)"]} />
          <div className="mt-6 flex items-start gap-3 rounded-xl border-l-2 border-[#064E3B] bg-[#F7F2EA] p-4">
            <Shield className="w-5 h-5 text-[#064E3B] shrink-0 mt-0.5" />
            <p className="text-sm text-[#0d3a2b] font-medium">We do not sell personal data.</p>
          </div>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="sharing" className="scroll-mt-28">
        <SectionHeading number={7} icon={Users}>Data Sharing &amp; Third Parties</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">We may share data with:</p>
          <BulletList items={["Licensed immigration consultants","Real estate developers","Legal advisors","Government authorities (where required)","Technology service providers"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">All sharing is done only as necessary and under appropriate safeguards.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="transfers" className="scroll-mt-28">
        <SectionHeading number={8} icon={Globe2}>International Transfers</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">If data is transferred outside the UAE:</p>
          <BulletList items={["Reasonable safeguards will be applied","Transfers will comply with applicable laws"]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="retention" className="scroll-mt-28">
        <SectionHeading number={9} icon={Archive}>Data Retention</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">We retain personal data only for as long as:</p>
          <BulletList items={["Necessary to provide services","Required by law","Required for dispute resolution"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">Afterward, data will be securely deleted.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="security" className="scroll-mt-28">
        <SectionHeading number={10} icon={Lock}>Data Security</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">We implement:</p>
          <BulletList items={["Secure servers","Encrypted communications","Access controls","Internal confidentiality protocols"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">No online transmission is 100% secure, but we apply reasonable protection measures.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="rights" className="scroll-mt-28">
        <SectionHeading number={11} icon={Shield}>Your Rights</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">Users may have the right to:</p>
          <BulletList items={["Access their personal data","Request correction","Request deletion (where legally permissible)","Withdraw consent","Request restriction of processing"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">Requests may be submitted via official contact channels.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="cookies" className="scroll-mt-28">
        <SectionHeading number={12} icon={Cookie}>Cookies &amp; Tracking</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">This website uses cookies for:</p>
          <BulletList items={["Functionality","Analytics","Performance optimisation"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">
            Users may manage cookie preferences via browser settings. See our{" "}
            <a href="/cookies" className="text-[#064E3B] font-medium hover:underline">Cookie Policy</a> for details.
          </p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="children" className="scroll-mt-28">
        <SectionHeading number={13} icon={Baby}>Children's Privacy</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 leading-relaxed">
            This website is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors.
          </p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="changes" className="scroll-mt-28">
        <SectionHeading number={14} icon={RefreshCcw}>Changes to This Policy</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 leading-relaxed">
            We may update this Privacy Policy periodically. Updated versions will be posted on this page.
          </p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="contact-info" className="scroll-mt-28">
        <SectionHeading number={15} icon={Mail}>Contact Information</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">For privacy-related inquiries:</p>
          <div className="rounded-xl border-l-2 border-[#064E3B] bg-[#F7F2EA] px-4 py-3 space-y-1.5">
            <p className="flex items-center gap-2 text-[#0d3a2b] font-semibold"><MapPin className="w-4 h-4 text-[#B89555]" />JBJ Global Real Estate</p>
            <p className="text-[#1A1A1A]/75 text-sm">Dubai, United Arab Emirates</p>
            <p className="text-sm mt-1">Email: <a href="mailto:privacy@jbj.ae" className="text-[#064E3B] font-medium hover:underline">privacy@jbj.ae</a></p>
          </div>
        </SectionCard>
      </section>

      <LegalFooter
        leftLink={{ to: "/terms", label: "Terms of Service" }}
        rightLink={{ to: "/cookies", label: "Cookie Policy" }}
      />
    </ContentPageShell>
  </>
);

export default Privacy;
