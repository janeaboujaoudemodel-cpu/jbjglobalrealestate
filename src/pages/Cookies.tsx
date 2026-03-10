import { Link } from "react-router-dom";
import { ChevronLeft, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const GoldDivider = () => (
  <div className="py-6">
    <div className="flex items-center gap-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/40" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" />
    </div>
  </div>
);

const tocItems = [
  { id: "what-are-cookies", label: "What Are Cookies" },
  { id: "types-of-cookies", label: "Types of Cookies We Use" },
  { id: "how-we-use-cookies", label: "How We Use Cookies" },
  { id: "third-party-cookies", label: "Third-Party Cookies" },
  { id: "managing-cookies", label: "Managing Cookies" },
  { id: "data-collected", label: "Data Collected Through Cookies" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Information" },
];

const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

const Cookies = () => {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    tocItems.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <>
      <SEOHead
        title="Cookie Policy | JBJ Global Real Estate"
        description="How JBJ Global Real Estate uses cookies and similar technologies to enhance your experience on our platform."
        canonicalPath="/cookies"
      />

      <section className="min-h-screen bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        {/* Hero — standardized */}
        <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#C8A766]/8 via-transparent to-transparent" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-[#C8A766]/6 rounded-full blur-[100px]" />
          <div className="max-w-5xl mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 border border-[#C8A766]/30 bg-black/30 backdrop-blur-sm">
                <Scale className="w-4 h-4 text-[#C8A766]" />
                <span className="text-[#C8A766] font-semibold text-xs uppercase tracking-[0.2em]">Legal</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                Cookie Policy
              </h1>
              <p className="text-lg md:text-xl text-[#C8A766]/80 font-medium mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
                Transparency in How We Use Technology
              </p>
              <p className="text-zinc-300 text-base md:text-lg max-w-3xl leading-relaxed">
                This Cookie Policy explains how our website uses cookies and similar technologies to enhance user experience, analyse performance, and deliver relevant services.
              </p>
              <p className="text-zinc-400 text-sm mt-6">Last updated: February 2026</p>
            </motion.div>
          </div>
        </section>

        {/* Body — standardized layout */}
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 flex gap-8">
          {/* Sidebar TOC */}
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
            {/* Mobile TOC */}
            <div className="lg:hidden mb-10 p-5 rounded-2xl border border-[#C8A766]/20 bg-[#1a1714]/80">
              <p className="text-xs text-[#C8A766] font-semibold uppercase tracking-widest mb-4">Table of Contents</p>
              <nav className="space-y-1">
                {tocItems.map(({ id, label }) => (
                  <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm text-zinc-400 hover:text-[#C8A766] px-3 py-1.5 rounded-lg transition-colors">{label}</button>
                ))}
              </nav>
            </div>

            <section id="what-are-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">1.</span>What Are Cookies</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>Cookies are small text files placed on your device when you visit a website. They help websites function properly, improve user experience, and gather analytics data.</p>
                <p>Cookies may be:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-black">Session-based</strong> — deleted when the browser is closed</li>
                  <li><strong className="text-black">Persistent</strong> — remain on the device for a defined period</li>
                </ul>
              </CCard>
            </section>
            <GoldDivider />

            <section id="types-of-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">2.</span>Types of Cookies We Use</h2>
              <div className="space-y-4">
                {[
                  { title: "A. Essential Cookies", desc: "These cookies are required for basic website functionality, including:", items: ["Secure login sessions", "Form submissions", "Navigation functionality"], note: "Without these cookies, the website may not function properly." },
                  { title: "B. Performance & Analytics Cookies", desc: "These cookies collect anonymised data to:", items: ["Understand user behaviour", "Measure traffic", "Improve website performance"], note: "Examples include analytics tools that track page views and interactions." },
                  { title: "C. Functional Cookies", desc: "These cookies allow:", items: ["Language preferences", "Saved settings", "User experience customisation"], note: "" },
                  { title: "D. Marketing / Advertising Cookies", desc: "If used, these cookies may:", items: ["Track engagement", "Provide targeted advertising", "Measure campaign performance"], note: "Marketing cookies are only activated where applicable and with appropriate consent mechanisms in place." },
                ].map((c, i) => (
                  <CCard key={i}>
                    <h3 className="text-lg font-semibold text-black mb-3">{c.title}</h3>
                    <p className="text-zinc-700 leading-relaxed mb-3">{c.desc}</p>
                    <ul className="list-disc pl-6 space-y-1.5 text-zinc-700">{c.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
                    {c.note && <p className="text-zinc-500 text-sm mt-3 italic">{c.note}</p>}
                  </CCard>
                ))}
              </div>
            </section>
            <GoldDivider />

            <section id="how-we-use-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">3.</span>How We Use Cookies</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>Cookies are used to:</p>
                <ul className="list-disc pl-6 space-y-1.5"><li>Ensure website stability</li><li>Enhance security</li><li>Improve user navigation</li><li>Analyse performance</li><li>Optimise digital services</li></ul>
                <p className="text-zinc-500 text-sm mt-2">Cookies do not grant us access to your device beyond stored cookie data.</p>
              </CCard>
            </section>
            <GoldDivider />

            <section id="third-party-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">4.</span>Third-Party Cookies</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>We may use trusted third-party providers for:</p>
                <ul className="list-disc pl-6 space-y-1.5"><li>Analytics</li><li>Security monitoring</li><li>Hosting infrastructure</li></ul>
                <p>These providers may place their own cookies subject to their respective privacy policies.</p>
                <p className="text-zinc-500 text-sm">We do not control third-party cookie practices.</p>
              </CCard>
            </section>
            <GoldDivider />

            <section id="managing-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">5.</span>Managing Cookies</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>Users can:</p>
                <ul className="list-disc pl-6 space-y-1.5"><li>Accept or reject cookies via browser settings</li><li>Delete existing cookies</li><li>Configure cookie alerts</li></ul>
                <div className="mt-4 bg-[#C8A766]/10 border border-[#C8A766]/20 rounded-lg p-4">
                  <p className="text-zinc-600 text-sm">Please note that disabling certain cookies may impact website functionality and your overall experience.</p>
                </div>
              </CCard>
            </section>
            <GoldDivider />

            <section id="data-collected" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">6.</span>Data Collected Through Cookies</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>Cookies may collect:</p>
                <ul className="list-disc pl-6 space-y-1.5"><li>IP address</li><li>Browser type</li><li>Device type</li><li>Session duration</li><li>Referring URLs</li></ul>
                <p className="text-zinc-500 text-sm mt-2">This data is typically aggregated and anonymised.</p>
              </CCard>
            </section>
            <GoldDivider />

            <section id="changes" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">7.</span>Changes to This Policy</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>We may update this Cookie Policy to reflect:</p>
                <ul className="list-disc pl-6 space-y-1.5"><li>Legal updates</li><li>Technology changes</li><li>Website functionality updates</li></ul>
                <p>Revisions will be posted on this page.</p>
              </CCard>
            </section>
            <GoldDivider />

            <section id="contact" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">8.</span>Contact Information</h2>
              <CCard className="text-zinc-700 leading-relaxed">
                <p className="mb-4">For questions regarding our use of cookies, please contact us:</p>
                <div className="bg-[#C8A766]/10 border border-[#C8A766]/20 rounded-lg p-5">
                  <p className="font-semibold text-black">JBJ Global Real Estate</p>
                  <p className="text-sm text-zinc-500 mt-1">Real Estate Brokerage</p>
                  <p className="text-sm text-zinc-500">Dubai, United Arab Emirates</p>
                  <p className="mt-3">Email: <a href="mailto:privacy@JBJ.ae" className="text-[#C8A766] hover:underline">privacy@JBJ.ae</a></p>
                </div>
              </CCard>
            </section>

            <div className="mt-16 pt-8 border-t border-[#C8A766]/15 text-center">
              <p className="text-zinc-500 text-sm">&copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.</p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <Link to="/privacy" className="text-[#C8A766] hover:underline">Privacy Policy</Link>
                <span className="text-zinc-600">|</span>
                <Link to="/terms" className="text-[#C8A766] hover:underline">Terms of Service</Link>
              </div>
            </div>
          </main>
        </div>
      </section>
    </>
  );
};

export default Cookies;