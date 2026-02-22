import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

const GoldDivider = () => (<div className="flex items-center gap-4 my-8"><div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" /><div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/40" /><div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" /></div>);

const tocItems = [
  { id: "market-risk", label: "Real Estate Market Risk" },
  { id: "developer-risk", label: "Project & Developer Risk" },
  { id: "regulatory-risk", label: "Regulatory & Immigration Risk" },
  { id: "financial-risk", label: "Financial Risk" },
  { id: "ai-disclaimer", label: "AI Tool Disclaimer" },
  { id: "no-guarantee", label: "No Guarantee Clause" },
];

const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

const RiskDisclosure = () => {
  const [activeSection, setActiveSection] = useState("");
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); }, { rootMargin: "-20% 0px -60% 0px" });
    tocItems.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
      <div className="bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
        <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-[#C8A766]/70 hover:text-[#C8A766] transition-colors mb-10"><ChevronLeft className="w-4 h-4" /><span className="text-sm">Back to Home</span></Link>
          <div className="max-w-3xl">
            <p className="text-[#C8A766] text-sm font-medium tracking-[0.2em] uppercase mb-4">Legal</p>
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Risk Disclosure</h1>
            <p className="text-[#C8A766] text-lg md:text-xl mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Important Investment and Service Risk Information</p>
            <p className="text-zinc-400 leading-relaxed max-w-2xl">All real estate and immigration-related services carry inherent risks. Users must review the following carefully before engaging in any transaction or relying on any information provided through this platform.</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="lg:hidden mb-10 bg-[#1a1714]/80 backdrop-blur border border-[#C8A766]/20 rounded-xl p-6">
          <p className="text-[#C8A766] text-xs font-semibold tracking-[0.15em] uppercase mb-4">Table of Contents</p>
          <nav className="space-y-2">{tocItems.map(({ id, label }) => (<button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm text-zinc-500 hover:text-[#C8A766] transition-colors py-1">{label}</button>))}</nav>
        </div>

        <div className="flex gap-12">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <p className="text-[#C8A766] text-xs font-semibold tracking-[0.15em] uppercase mb-5">Contents</p>
              <nav className="space-y-1 border-l border-[#C8A766]/20">
                {tocItems.map(({ id, label }) => (<button key={id} onClick={() => scrollTo(id)} className={`block w-full text-left pl-4 py-1.5 text-sm transition-all border-l-2 -ml-px ${activeSection === id ? "border-[#C8A766] text-[#C8A766] font-medium" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>{label}</button>))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 max-w-3xl">
            {[
              { id: "market-risk", num: 1, title: "Real Estate Market Risk", content: (
                <>
                  <p>Real estate investments are subject to market conditions that may fluctuate significantly. Users should be aware of the following risks:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong className="text-black">Market Fluctuations</strong> — Property values may increase or decrease based on economic conditions, supply and demand dynamics, and geopolitical factors.</li>
                    <li><strong className="text-black">Valuation Changes</strong> — Property valuations are market-based estimates and may vary over time.</li>
                    <li><strong className="text-black">Rental Yield Variability</strong> — Rental income is subject to occupancy rates, market demand, and regulatory changes.</li>
                    <li><strong className="text-black">Liquidity Risk</strong> — Real estate assets may not be readily convertible to cash.</li>
                  </ul>
                </>
              )},
              { id: "developer-risk", num: 2, title: "Project & Developer Risk", content: (
                <>
                  <p>Off-plan and under-construction properties carry additional risks:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong className="text-black">Construction Delays</strong> — Projects may experience delays.</li>
                    <li><strong className="text-black">Handover Delays</strong> — Completion timelines are estimates.</li>
                    <li><strong className="text-black">Specification Changes</strong> — Final specs may differ from plans.</li>
                    <li><strong className="text-black">Developer Insolvency Risk</strong> — Developers may face financial difficulties.</li>
                  </ul>
                </>
              )},
              { id: "regulatory-risk", num: 3, title: "Regulatory & Immigration Risk", content: (
                <>
                  <p>Regulatory environments are subject to change:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong className="text-black">Policy Changes</strong> — UAE government policies may change without notice.</li>
                    <li><strong className="text-black">Visa Eligibility Updates</strong> — Requirements may be amended at any time.</li>
                    <li><strong className="text-black">Government Approval Discretion</strong> — All visa decisions rest with UAE authorities.</li>
                    <li><strong className="text-black">Processing Delays</strong> — Timelines are determined by government agencies.</li>
                  </ul>
                </>
              )},
              { id: "financial-risk", num: 4, title: "Financial Risk", content: (
                <>
                  <p>Financial aspects carry inherent risks:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong className="text-black">Financing Rejection</strong> — Applications may be declined.</li>
                    <li><strong className="text-black">Interest Rate Fluctuations</strong> — Variable rates are subject to changes.</li>
                    <li><strong className="text-black">Payment Plan Risks</strong> — Failure to meet schedules may result in penalties.</li>
                  </ul>
                </>
              )},
              { id: "ai-disclaimer", num: 5, title: "AI Tool Disclaimer", content: (
                <>
                  <p>AI outputs are:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong className="text-black">Informational Only</strong> — Not a replacement for professional judgement.</li>
                    <li><strong className="text-black">Not Financial Advice</strong> — Not investment or tax advice.</li>
                    <li><strong className="text-black">Not Legal Advice</strong> — Not legal counsel.</li>
                    <li><strong className="text-black">Subject to Verification</strong> — Must be independently verified.</li>
                  </ul>
                  <div className="mt-4 bg-[#C8A766]/10 border border-[#C8A766]/20 rounded-lg p-4"><p className="text-zinc-600 text-sm"><Link to="/contact" className="text-[#C8A766] hover:underline font-medium">Contact our team for professional guidance</Link>.</p></div>
                </>
              )},
              { id: "no-guarantee", num: 6, title: "No Guarantee Clause", content: (
                <>
                  <p>This platform does not guarantee:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4"><li>Return on investment (ROI)</li><li>Approval of any visa or residency application</li><li>Specific rental income or occupancy levels</li><li>Capital appreciation</li></ul>
                  <p className="mt-2">All projections are based on available data and do not constitute guarantees.</p>
                  <div className="mt-4 bg-[#C8A766]/10 border border-[#C8A766]/20 rounded-lg p-4"><p className="text-zinc-600 text-sm">Users are advised to seek independent professional advice.</p></div>
                </>
              )},
            ].map((s, i) => (
              <div key={s.id}>
                <section id={s.id} className="scroll-mt-8">
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}><span className="text-[#C8A766] mr-3">{s.num}.</span>{s.title}</h2>
                  <CCard className="space-y-4 text-zinc-700 leading-relaxed">{s.content}</CCard>
                </section>
                {i < 5 && <GoldDivider />}
              </div>
            ))}

            <div className="mt-16 pt-8 border-t border-[#C8A766]/15 text-center">
              <p className="text-zinc-500 text-sm">&copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.</p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <Link to="/privacy" className="text-[#C8A766] hover:underline">Privacy Policy</Link>
                <span className="text-zinc-600">|</span>
                <Link to="/terms" className="text-[#C8A766] hover:underline">Terms of Service</Link>
                <span className="text-zinc-600">|</span>
                <Link to="/trust-compliance" className="text-[#C8A766] hover:underline">Trust & Compliance</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default RiskDisclosure;