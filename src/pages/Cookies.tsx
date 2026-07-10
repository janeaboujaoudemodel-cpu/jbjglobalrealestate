/**
 * Cookie Policy — rebuilt on ContentPageShell (LOCKED layout).
 */
import { Cookie, Layers, Settings2, Handshake, SlidersHorizontal, Database, RefreshCcw, Mail, MapPin } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import ContentPageShell, { ContentSection } from "@/components/content-page/ContentPageShell";
import { SectionCard, SectionHeading, SectionDivider, BulletList, LegalFooter, HEADING_FONT } from "@/components/content-page/LegalParts";

const SECTIONS: ContentSection[] = [
  { id: "what-are-cookies",   title: "What Are Cookies",             icon: Cookie },
  { id: "types-of-cookies",   title: "Types of Cookies We Use",      icon: Layers },
  { id: "how-we-use-cookies", title: "How We Use Cookies",           icon: Settings2 },
  { id: "third-party-cookies",title: "Third-Party Cookies",          icon: Handshake },
  { id: "managing-cookies",   title: "Managing Cookies",             icon: SlidersHorizontal },
  { id: "data-collected",     title: "Data Collected",               icon: Database },
  { id: "changes",            title: "Changes to This Policy",       icon: RefreshCcw },
  { id: "contact",            title: "Contact Information",          icon: Mail },
];

const Cookies = () => (
  <>
    <SEOHead
      title="Cookie Policy | JBJ Global Real Estate"
      description="How JBJ Global Real Estate uses cookies and similar technologies to enhance your experience on our platform."
      canonicalPath="/cookies"
    />

    <ContentPageShell
      hero={{
        eyebrow: "Legal",
        eyebrowIcon: Cookie,
        title: "Cookie Policy",
        subtitle: "Transparency in How We Use Technology",
        height: "lg",
      }}
      sections={SECTIONS}
      tocTitle="In This Policy"
    >
      <section id="what-are-cookies" className="scroll-mt-28">
        <SectionHeading number={1} icon={Cookie}>What Are Cookies</SectionHeading>
        <SectionCard className="space-y-4 text-[#1A1A1A]/80 leading-relaxed">
          <p>Cookies are small text files placed on your device when you visit a website. They help websites function properly, improve user experience, and gather analytics data.</p>
          <p>Cookies may be:</p>
          <BulletList items={[
            <><strong className="text-[#0d3a2b]">Session-based</strong> — deleted when the browser is closed</>,
            <><strong className="text-[#0d3a2b]">Persistent</strong> — remain on the device for a defined period</>,
          ]} />
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="types-of-cookies" className="scroll-mt-28">
        <SectionHeading number={2} icon={Layers}>Types of Cookies We Use</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "A. Essential Cookies", desc: "Required for basic website functionality:", items: ["Secure login sessions","Form submissions","Navigation functionality"], note: "Without these cookies, the website may not function properly." },
            { title: "B. Performance & Analytics", desc: "Collect anonymised data to:", items: ["Understand user behaviour","Measure traffic","Improve website performance"], note: "Examples include analytics tools that track page views and interactions." },
            { title: "C. Functional Cookies", desc: "Allow:", items: ["Language preferences","Saved settings","User experience customisation"], note: "" },
            { title: "D. Marketing / Advertising", desc: "If used, these cookies may:", items: ["Track engagement","Provide targeted advertising","Measure campaign performance"], note: "Only activated where applicable and with appropriate consent." },
          ].map((c) => (
            <SectionCard key={c.title}>
              <p className="text-lg font-semibold text-[#0d3a2b] mb-2" style={HEADING_FONT}>{c.title}</p>
              <p className="text-[#1A1A1A]/80 leading-relaxed mb-3">{c.desc}</p>
              <BulletList items={c.items} />
              {c.note && <p className="text-[#1A1A1A]/70 text-sm mt-3 italic">{c.note}</p>}
            </SectionCard>
          ))}
        </div>
      </section>
      <SectionDivider />

      <section id="how-we-use-cookies" className="scroll-mt-28">
        <SectionHeading number={3} icon={Settings2}>How We Use Cookies</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">Cookies are used to:</p>
          <BulletList items={["Ensure website stability","Enhance security","Improve user navigation","Analyse performance","Optimise digital services"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">Cookies do not grant us access to your device beyond stored cookie data.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="third-party-cookies" className="scroll-mt-28">
        <SectionHeading number={4} icon={Handshake}>Third-Party Cookies</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">We may use trusted third-party providers for:</p>
          <BulletList items={["Analytics","Security monitoring","Hosting infrastructure"]} />
          <p className="text-[#1A1A1A]/80 mt-4">These providers may place their own cookies subject to their respective privacy policies.</p>
          <p className="text-[#1A1A1A]/75 text-sm mt-2">We do not control third-party cookie practices.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="managing-cookies" className="scroll-mt-28">
        <SectionHeading number={5} icon={SlidersHorizontal}>Managing Cookies</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">Users can:</p>
          <BulletList items={["Accept or reject cookies via browser settings","Delete existing cookies","Configure cookie alerts"]} />
          <div className="mt-4 rounded-xl border-l-2 border-[#064E3B] bg-[#F7F2EA] p-4">
            <p className="text-[#1A1A1A]/80 text-sm">Please note that disabling certain cookies may impact website functionality and your overall experience.</p>
          </div>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="data-collected" className="scroll-mt-28">
        <SectionHeading number={6} icon={Database}>Data Collected Through Cookies</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">Cookies may collect:</p>
          <BulletList items={["IP address","Browser type","Device type","Session duration","Referring URLs"]} />
          <p className="text-[#1A1A1A]/75 text-sm mt-4">This data is typically aggregated and anonymised.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="changes" className="scroll-mt-28">
        <SectionHeading number={7} icon={RefreshCcw}>Changes to This Policy</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">We may update this Cookie Policy to reflect:</p>
          <BulletList items={["Legal updates","Technology changes","Website functionality updates"]} />
          <p className="text-[#1A1A1A]/80 mt-4">Revisions will be posted on this page.</p>
        </SectionCard>
      </section>
      <SectionDivider />

      <section id="contact" className="scroll-mt-28">
        <SectionHeading number={8} icon={Mail}>Contact Information</SectionHeading>
        <SectionCard>
          <p className="text-[#1A1A1A]/80 mb-4">For questions regarding our use of cookies, please contact us:</p>
          <div className="rounded-xl border-l-2 border-[#064E3B] bg-[#F7F2EA] px-4 py-3 space-y-1.5">
            <p className="flex items-center gap-2 text-[#0d3a2b] font-semibold"><MapPin className="w-4 h-4 text-[#B89555]" />JBJ Global Real Estate</p>
            <p className="text-[#1A1A1A]/75 text-sm">Real Estate Brokerage — Dubai, United Arab Emirates</p>
            <p className="text-sm mt-1">Email: <a href="mailto:privacy@jbj.ae" className="text-[#064E3B] font-medium hover:underline">privacy@jbj.ae</a></p>
          </div>
        </SectionCard>
      </section>

      <LegalFooter
        leftLink={{ to: "/privacy", label: "Privacy Policy" }}
        rightLink={{ to: "/terms", label: "Terms of Service" }}
      />
    </ContentPageShell>
  </>
);

export default Cookies;
