import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-8">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(43,45%,54%)]/30 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(43,45%,54%)]/40" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(43,45%,54%)]/30 to-transparent" />
  </div>
);

const tocItems = [
  { id: "market-risk", label: "Real Estate Market Risk" },
  { id: "developer-risk", label: "Project & Developer Risk" },
  { id: "regulatory-risk", label: "Regulatory & Immigration Risk" },
  { id: "financial-risk", label: "Financial Risk" },
  { id: "ai-disclaimer", label: "AI Tool Disclaimer" },
  { id: "no-guarantee", label: "No Guarantee Clause" },
];

const RiskDisclosure = () => {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    tocItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[hsl(40,30%,96%)] via-[hsl(39,25%,94%)] to-[hsl(38,20%,92%)]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[hsl(40,30%,96%)] to-[hsl(39,25%,93%)] border-b border-[hsl(43,45%,54%)]/15">
        <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-[hsl(0,0%,45%)] hover:text-[hsl(0,0%,25%)] transition-colors mb-10">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <div className="max-w-3xl">
            <p className="text-[hsl(43,45%,54%)] text-sm font-medium tracking-[0.2em] uppercase mb-4">Legal</p>
            <h1 className="text-[hsl(0,0%,15%)] text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Risk Disclosure
            </h1>
            <p className="text-[hsl(43,45%,44%)] text-lg md:text-xl mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Important Investment and Service Risk Information
            </p>
            <p className="text-[hsl(0,0%,40%)] leading-relaxed max-w-2xl">
              All real estate and immigration-related services carry inherent risks. Users must review the following carefully before engaging in any transaction or relying on any information provided through this platform.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Mobile TOC */}
        <div className="lg:hidden mb-10 bg-white/80 backdrop-blur border border-[hsl(43,45%,54%)]/15 rounded-xl p-6">
          <p className="text-[hsl(43,45%,44%)] text-xs font-semibold tracking-[0.15em] uppercase mb-4">Table of Contents</p>
          <nav className="space-y-2">
            {tocItems.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm text-[hsl(0,0%,40%)] hover:text-[hsl(43,45%,44%)] transition-colors py-1">
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <p className="text-[hsl(43,45%,44%)] text-xs font-semibold tracking-[0.15em] uppercase mb-5">Contents</p>
              <nav className="space-y-1 border-l border-[hsl(43,45%,54%)]/20">
                {tocItems.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`block w-full text-left pl-4 py-1.5 text-sm transition-all border-l-2 -ml-px ${
                      activeSection === id
                        ? "border-[hsl(43,45%,54%)] text-[hsl(43,45%,44%)] font-medium"
                        : "border-transparent text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,30%)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 max-w-3xl">
            {/* 1 */}
            <section id="market-risk" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">1.</span>Real Estate Market Risk
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Real estate investments are subject to market conditions that may fluctuate significantly. Users should be aware of the following risks:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[hsl(0,0%,20%)]">Market Fluctuations</strong> — Property values may increase or decrease based on economic conditions, supply and demand dynamics, and geopolitical factors.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Valuation Changes</strong> — Property valuations are market-based estimates and may vary over time or differ between valuation methodologies.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Rental Yield Variability</strong> — Rental income is subject to occupancy rates, market demand, and regulatory changes affecting tenancy.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Liquidity Risk</strong> — Real estate assets may not be readily convertible to cash, and sale timelines can be unpredictable.</li>
                </ul>
              </div>
            </section>

            <GoldDivider />

            {/* 2 */}
            <section id="developer-risk" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">2.</span>Project &amp; Developer Risk
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Off-plan and under-construction properties carry additional risks that users must consider:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[hsl(0,0%,20%)]">Construction Delays</strong> — Projects may experience delays due to regulatory, logistical, or financial factors.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Handover Delays</strong> — Completion and handover timelines are estimates and subject to change.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Specification Changes</strong> — Final specifications may differ from initial plans, renderings, or marketing materials.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Developer Insolvency Risk</strong> — In rare cases, developers may face financial difficulties that impact project completion.</li>
                </ul>
              </div>
            </section>

            <GoldDivider />

            {/* 3 */}
            <section id="regulatory-risk" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">3.</span>Regulatory &amp; Immigration Risk
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Regulatory environments are subject to change, and immigration-related services carry specific risks:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[hsl(0,0%,20%)]">Policy Changes</strong> — UAE government policies, regulations, and procedures may change without prior notice.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Visa Eligibility Criteria Updates</strong> — Golden Visa and residency requirements may be amended by the relevant authorities at any time.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Government Approval Discretion</strong> — All visa and residency decisions rest solely with UAE government authorities.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Processing Delays</strong> — Application processing timelines are determined by government agencies and may vary.</li>
                </ul>
              </div>
            </section>

            <GoldDivider />

            {/* 4 */}
            <section id="financial-risk" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">4.</span>Financial Risk
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Financial aspects of real estate transactions carry inherent risks:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[hsl(0,0%,20%)]">Financing Rejection</strong> — Mortgage and financing applications may be declined by lending institutions.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Interest Rate Fluctuations</strong> — Variable-rate financing is subject to market interest rate changes.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Payment Plan Risks</strong> — Developer payment plans are contractual obligations; failure to meet payment schedules may result in penalties or forfeiture.</li>
                </ul>
              </div>
            </section>

            <GoldDivider />

            {/* 5 */}
            <section id="ai-disclaimer" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">5.</span>AI Tool Disclaimer
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>This platform provides AI-powered tools for informational and analytical purposes. Users must understand that AI outputs are:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[hsl(0,0%,20%)]">Informational Only</strong> — Generated content is intended to support decision-making, not replace professional judgement.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Not Financial Advice</strong> — AI-generated analyses do not constitute financial, investment, or tax advice.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Not Legal Advice</strong> — AI outputs do not constitute legal counsel or replace consultation with licensed legal professionals.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Subject to Verification</strong> — All AI-generated information must be independently verified before any action is taken.</li>
                </ul>
                <div className="mt-4 bg-[hsl(43,45%,54%)]/5 border border-[hsl(43,45%,54%)]/15 rounded-lg p-4">
                  <p className="text-[hsl(0,0%,40%)] text-sm">
                    <Link to="/contact" className="text-[hsl(43,45%,44%)] hover:underline font-medium">Contact our team for professional guidance</Link>.
                  </p>
                </div>
              </div>
            </section>

            <GoldDivider />

            {/* 6 */}
            <section id="no-guarantee" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">6.</span>No Guarantee Clause
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>This platform, its representatives, and its affiliated partners do not guarantee:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Return on investment (ROI) for any property transaction</li>
                  <li>Approval of any visa, residency, or immigration application</li>
                  <li>Specific rental income or occupancy levels</li>
                  <li>Capital appreciation on any property</li>
                </ul>
                <p className="mt-2">
                  All projections, estimates, and analyses provided are based on available data and prevailing market conditions at the time of generation. They do not constitute guarantees or warranties of future performance.
                </p>
                <div className="mt-4 bg-[hsl(43,45%,54%)]/5 border border-[hsl(43,45%,54%)]/15 rounded-lg p-4">
                  <p className="text-[hsl(0,0%,40%)] text-sm">
                    Users are advised to seek independent professional advice before making any investment, legal, or immigration decisions.
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-[hsl(43,45%,54%)]/15 text-center">
              <p className="text-[hsl(0,0%,55%)] text-sm">
                &copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.
              </p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <Link to="/privacy" className="text-[hsl(43,45%,44%)] hover:underline">Privacy Policy</Link>
                <span className="text-[hsl(0,0%,75%)]">|</span>
                <Link to="/terms" className="text-[hsl(43,45%,44%)] hover:underline">Terms of Service</Link>
                <span className="text-[hsl(0,0%,75%)]">|</span>
                <Link to="/trust-compliance" className="text-[hsl(43,45%,44%)] hover:underline">Trust & Compliance</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default RiskDisclosure;
