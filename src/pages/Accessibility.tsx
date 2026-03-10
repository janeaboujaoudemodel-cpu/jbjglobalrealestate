import { Link } from "react-router-dom";
import { Accessibility as AccessibilityIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const GoldDivider = () => (<div className="py-6"><div className="flex items-center gap-6"><div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" /><div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/40" /><div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" /></div></div>);

const tocItems = [
  { id: "commitment", label: "Our Commitment" },
  { id: "standards", label: "Standards & Guidelines" },
  { id: "features", label: "Current Accessibility Features" },
  { id: "improvement", label: "Ongoing Enhancements" },
  { id: "feedback", label: "Feedback & Support" },
];

const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

const Accessibility = () => {
  const [activeSection, setActiveSection] = useState("");
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); }, { rootMargin: "-20% 0px -60% 0px" });
    tocItems.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <>
      <SEOHead
        title="Accessibility Statement | JBJ Global Real Estate"
        description="JBJ Global Real Estate's commitment to inclusive digital experiences and accessibility standards."
        canonicalPath="/accessibility"
      />

      <section className="min-h-screen bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        {/* Hero — standardized */}
        <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#C8A766]/8 via-transparent to-transparent" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-[#C8A766]/6 rounded-full blur-[100px]" />
          <div className="max-w-5xl mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 border border-[#C8A766]/30 bg-black/30 backdrop-blur-sm">
                <AccessibilityIcon className="w-4 h-4 text-[#C8A766]" />
                <span className="text-[#C8A766] font-semibold text-xs uppercase tracking-[0.2em]">Inclusion</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                Accessibility Statement
              </h1>
              <p className="text-lg md:text-xl text-[#C8A766]/80 font-medium mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
                Committed to Inclusive Digital Experiences
              </p>
              <p className="text-zinc-300 text-base md:text-lg max-w-3xl leading-relaxed">
                We are committed to ensuring that our website and digital services are accessible to all individuals, including persons with disabilities.
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
            <section id="commitment" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">1.</span>Our Commitment</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>We are dedicated to:</p>
                <ul className="list-disc pl-6 space-y-2"><li>Designing content that is perceivable and readable</li><li>Ensuring keyboard navigability across all interactive elements</li><li>Supporting assistive technologies including screen readers</li><li>Maintaining responsive layouts across devices and screen sizes</li><li>Improving clarity, structure, and usability throughout the platform</li></ul>
              </CCard>
            </section>
            <GoldDivider />

            <section id="standards" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">2.</span>Standards &amp; Guidelines</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>Our digital experience is designed with reference to internationally recognised accessibility guidelines, including:</p>
                <ul className="list-disc pl-6 space-y-2"><li>Web Content Accessibility Guidelines (WCAG) principles</li><li>Responsive design standards</li><li>Accessibility-aware development practices</li></ul>
                <div className="mt-4 bg-[#C8A766]/10 border border-[#C8A766]/20 rounded-lg p-4"><p className="text-zinc-600 text-sm">We continuously review and improve accessibility features as part of our ongoing digital enhancement process.</p></div>
              </CCard>
            </section>
            <GoldDivider />

            <section id="features" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">3.</span>Current Accessibility Features</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>The following accessibility features are implemented across our platform:</p>
                <ul className="list-disc pl-6 space-y-2"><li>Structured headings and semantic HTML for logical content hierarchy</li><li>Alternative text for images and visual content</li><li>Clear colour contrast hierarchy for readability</li><li>Scalable text support for user-defined font sizes</li><li>Mobile and tablet compatibility with responsive layouts</li><li>Logical page structure for assistive technology navigation</li></ul>
              </CCard>
            </section>
            <GoldDivider />

            <section id="improvement" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">4.</span>Ongoing Enhancements</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>We recognise accessibility as an evolving standard. Our team continuously evaluates and enhances the platform to improve accessibility compliance and usability.</p>
                <p>This includes periodic audits, user feedback integration, and updates to reflect current best practices and emerging standards.</p>
              </CCard>
            </section>
            <GoldDivider />

            <section id="feedback" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">5.</span>Feedback &amp; Support</h2>
              <CCard className="space-y-4 text-zinc-700 leading-relaxed">
                <p>If you encounter accessibility barriers or require assistance accessing any content, please contact our support team.</p>
                <div className="bg-[#C8A766]/10 border border-[#C8A766]/20 rounded-lg p-5 mt-4">
                  <p className="font-semibold text-black">Contact Us</p>
                  <p className="text-sm text-zinc-600 mt-2">Email: <a href="mailto:accessibility@JBJ.ae" className="text-[#C8A766] hover:underline">accessibility@JBJ.ae</a></p>
                  <p className="text-sm text-zinc-600 mt-1">Or use our <Link to="/contact" className="text-[#C8A766] hover:underline">contact form</Link>.</p>
                  <p className="text-xs text-zinc-500 mt-3">We aim to respond to accessibility-related inquiries within 5 business days.</p>
                </div>
              </CCard>
            </section>

            <div className="mt-16 pt-8 border-t border-[#C8A766]/15 text-center">
              <p className="text-zinc-500 text-xs leading-relaxed mb-6">This Accessibility Statement may be updated periodically.</p>
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

export default Accessibility;