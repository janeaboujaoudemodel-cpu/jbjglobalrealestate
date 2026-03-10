import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
const GoldDivider = () => (<div className="flex items-center gap-4 my-8"><div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" /><div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/40" /><div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" /></div>);

const tocItems = [
  { id: "regulatory-alignment", label: "Regulatory Alignment" },
  { id: "due-diligence", label: "Due Diligence Standards" },
  { id: "financial-transparency", label: "Financial Transparency" },
  { id: "secure-data", label: "Secure Data Handling" },
  { id: "professional-network", label: "Professional Network" },
  { id: "audit-monitoring", label: "Continuous Audit & Monitoring" },
  { id: "client-protection", label: "Client Protection Commitment" },
];

const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

const TrustAndCompliance = () => {
  const [activeSection, setActiveSection] = useState("");
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); }, { rootMargin: "-20% 0px -60% 0px" });
    tocItems.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const sections = [
    { id: "regulatory-alignment", num: 1, title: "Regulatory Alignment", content: (
      <>
        <p>Our operations are structured to align with the regulatory frameworks governing real estate and related services in the UAE:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong className="text-black">UAE Real Estate Regulations</strong> — Compliance with RERA guidelines, Dubai Land Department requirements, and emirate-level property laws.</li>
          <li><strong className="text-black">Immigration Regulations</strong> — Coordination with licensed government-approved immigration partners.</li>
          <li><strong className="text-black">Consumer Protection Frameworks</strong> — Adherence to fair trading practices.</li>
          <li><strong className="text-black">Data Protection Compliance</strong> — Alignment with UAE Federal Decree-Law No. 45 of 2021.</li>
        </ul>
        <div className="mt-4 bg-[#C8A766]/10 border border-[#C8A766]/20 rounded-lg p-4"><p className="text-zinc-600 text-sm">Final regulatory authority rests with the relevant UAE government bodies.</p></div>
      </>
    )},
    { id: "due-diligence", num: 2, title: "Due Diligence Standards", content: (
      <>
        <p>We maintain a structured approach to due diligence:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong className="text-black">Developer Verification</strong> — Assessment of credentials and track record.</li>
          <li><strong className="text-black">Project Validation</strong> — Review of documentation and approvals.</li>
          <li><strong className="text-black">Legal Document Coordination</strong> — Facilitation with licensed professionals.</li>
          <li><strong className="text-black">Partner Vetting</strong> — Evaluation of third-party providers.</li>
          <li><strong className="text-black">Risk Screening</strong> — Assessment of potential risks.</li>
        </ul>
      </>
    )},
    { id: "financial-transparency", num: 3, title: "Financial Transparency", content: (
      <>
        <p>We are committed to clear financial practices:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4"><li>No hidden fees or undisclosed charges</li><li>Clear breakdown of services and costs</li><li>Transparent commission structure</li><li>Written engagement confirmation</li></ul>
      </>
    )},
    { id: "secure-data", num: 4, title: "Secure Data Handling", content: (
      <>
        <p>Your data is handled with the highest standards:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4"><li>Encrypted communication channels</li><li>Controlled access to personal and financial data</li><li>Role-based permissions</li><li>No resale or commercial exploitation of personal data</li></ul>
        <p className="text-sm text-zinc-500 mt-4">For full details, refer to our <Link to="/privacy" className="text-[#C8A766] hover:underline">Privacy Policy</Link>.</p>
      </>
    )},
    { id: "professional-network", num: 5, title: "Professional Network", content: (
      <>
        <p>We work with a vetted network of licensed professionals:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4"><li>Licensed real estate developers</li><li>Qualified legal advisors</li><li>Certified valuation experts</li><li>Government-approved immigration partners</li></ul>
        <div className="mt-4 bg-[#C8A766]/10 border border-[#C8A766]/20 rounded-lg p-4"><p className="text-zinc-600 text-sm">Partner services are provided by independent licensed professionals who contract directly with clients.</p></div>
      </>
    )},
    { id: "audit-monitoring", num: 6, title: "Continuous Audit & Monitoring", content: (
      <>
        <p>We maintain ongoing oversight:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4"><li>Internal review systems for quality assurance</li><li>Ongoing compliance checks</li><li>Periodic policy updates</li><li>Platform security monitoring</li></ul>
      </>
    )},
    { id: "client-protection", num: 7, title: "Client Protection Commitment", content: (
      <>
        <p>We are committed to the highest standards:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4"><li>Ethical advisory practices</li><li>Fact-based guidance</li><li>No false promises or inflated projections</li><li>No guaranteed returns on property investments</li></ul>
        <p className="mt-2">Our advisory services provide clarity, not certainty.</p>
      </>
    )},
  ];

  return (
    <>
      <SEOHead
        title="Trust & Compliance | JBJ Global Real Estate"
        description="Institutional standards, transparent operations, and verified compliance processes at JBJ Global Real Estate."
        canonicalPath="/trust-compliance"
      />

      <section className="min-h-screen bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        {/* Hero — standardized */}
        <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#C8A766]/8 via-transparent to-transparent" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-[#C8A766]/6 rounded-full blur-[100px]" />
          <div className="max-w-5xl mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 border border-[#C8A766]/30 bg-black/30 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-[#C8A766]" />
                <span className="text-[#C8A766] font-semibold text-xs uppercase tracking-[0.2em]">Governance</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                Trust &amp; Compliance
              </h1>
              <p className="text-lg md:text-xl text-[#C8A766]/80 font-medium mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
                Institutional Standards. Transparent Operations. Verified Processes.
              </p>
              <p className="text-zinc-300 text-base md:text-lg max-w-3xl leading-relaxed">
                We operate with full commitment to transparency, regulatory alignment, and professional standards.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Body — standardized layout */}
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 p-5 rounded-2xl border border-[#C8A766]/20 bg-[#1a1714]/80 backdrop-blur-sm">
              <p className="text-xs text-[#C8A766] font-semibold uppercase tracking-widest mb-4">Contents</p>
              <nav className="space-y-1 border-l border-[#C8A766]/20">
                {tocItems.map(({ id, label }) => (
                  <button key={id} onClick={() => scrollTo(id)} className={`block w-full text-left pl-4 py-1.5 text-sm transition-all border-l-2 -ml-px ${activeSection === id ? "border-[#C8A766] text-[#C8A766] font-medium" : "border-transparent text-zinc-400 hover:text-[#C8A766] hover:bg-[#C8A766]/5"}`}>{label}</button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden mb-10 p-5 rounded-2xl border border-[#C8A766]/20 bg-[#1a1714]/80">
              <p className="text-xs text-[#C8A766] font-semibold uppercase tracking-widest mb-4">Table of Contents</p>
              <nav className="space-y-1">{tocItems.map(({ id, label }) => (<button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm text-zinc-400 hover:text-[#C8A766] px-3 py-1.5 rounded-lg transition-colors">{label}</button>))}</nav>
            </div>
            {sections.map((s, i) => (
              <div key={s.id}>
                <section id={s.id} className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">{s.num}.</span>{s.title}</h2>
                  <CCard className="space-y-4 text-zinc-700 leading-relaxed">{s.content}</CCard>
                </section>
                {i < sections.length - 1 && <GoldDivider />}
              </div>
            ))}
            <div className="mt-16 pt-8 border-t border-[#C8A766]/15 text-center">
              <p className="text-zinc-500 text-sm">&copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.</p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <Link to="/privacy" className="text-[#C8A766] hover:underline">Privacy Policy</Link>
                <span className="text-zinc-600">|</span>
                <Link to="/terms" className="text-[#C8A766] hover:underline">Terms of Service</Link>
                <span className="text-zinc-600">|</span>
                <Link to="/risk-disclosure" className="text-[#C8A766] hover:underline">Risk Disclosure</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default TrustAndCompliance;