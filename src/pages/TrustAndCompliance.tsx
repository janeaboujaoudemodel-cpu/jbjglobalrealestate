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
  { id: "regulatory-alignment", label: "Regulatory Alignment" },
  { id: "due-diligence", label: "Due Diligence Standards" },
  { id: "financial-transparency", label: "Financial Transparency" },
  { id: "secure-data", label: "Secure Data Handling" },
  { id: "professional-network", label: "Professional Network" },
  { id: "audit-monitoring", label: "Continuous Audit & Monitoring" },
  { id: "client-protection", label: "Client Protection Commitment" },
];

const TrustAndCompliance = () => {
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
            <p className="text-[hsl(43,45%,54%)] text-sm font-medium tracking-[0.2em] uppercase mb-4">Governance</p>
            <h1 className="text-[hsl(0,0%,15%)] text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Trust &amp; Compliance
            </h1>
            <p className="text-[hsl(43,45%,44%)] text-lg md:text-xl mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Institutional Standards. Transparent Operations. Verified Processes.
            </p>
            <p className="text-[hsl(0,0%,40%)] leading-relaxed max-w-2xl">
              We operate with full commitment to transparency, regulatory alignment, and professional standards. Our systems, partnerships, and procedures are designed to ensure compliance with UAE laws and international best practices.
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
            <section id="regulatory-alignment" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">1.</span>Regulatory Alignment
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Our operations are structured to align with the regulatory frameworks governing real estate and related services in the United Arab Emirates:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[hsl(0,0%,20%)]">UAE Real Estate Regulations</strong> — Compliance with RERA guidelines, Dubai Land Department requirements, and emirate-level property laws.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Immigration Regulations</strong> — Where applicable, coordination with licensed government-approved immigration partners.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Consumer Protection Frameworks</strong> — Adherence to fair trading practices and client safeguards.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Data Protection Compliance</strong> — Alignment with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data and applicable international standards.</li>
                </ul>
                <div className="mt-4 bg-[hsl(43,45%,54%)]/5 border border-[hsl(43,45%,54%)]/15 rounded-lg p-4">
                  <p className="text-[hsl(0,0%,40%)] text-sm">
                    Final regulatory authority rests with the relevant UAE government bodies and competent authorities.
                  </p>
                </div>
              </div>
            </section>

            <GoldDivider />

            {/* 2 */}
            <section id="due-diligence" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">2.</span>Due Diligence Standards
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>We maintain a structured and systematic approach to due diligence across all engagements:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[hsl(0,0%,20%)]">Developer Verification</strong> — Assessment of developer credentials, licensing status, and track record.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Project Validation</strong> — Review of project documentation, approvals, and completion status.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Legal Document Coordination</strong> — Facilitation of document review in coordination with licensed legal professionals.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Partner Vetting</strong> — Evaluation of third-party service providers before engagement.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Risk Screening</strong> — Identification and assessment of potential risks associated with transactions.</li>
                </ul>
              </div>
            </section>

            <GoldDivider />

            {/* 3 */}
            <section id="financial-transparency" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">3.</span>Financial Transparency
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>We are committed to clear and transparent financial practices:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>No hidden fees or undisclosed charges</li>
                  <li>Clear breakdown of services and associated costs</li>
                  <li>Transparent commission structure disclosed prior to engagement</li>
                  <li>Written engagement confirmation for all advisory and transactional services</li>
                </ul>
              </div>
            </section>

            <GoldDivider />

            {/* 4 */}
            <section id="secure-data" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">4.</span>Secure Data Handling
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Your data is handled with the highest standards of care:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encrypted communication channels for sensitive information</li>
                  <li>Controlled access to personal and financial data</li>
                  <li>Role-based permissions limiting data visibility to authorised personnel</li>
                  <li>No resale, sharing, or commercial exploitation of personal data</li>
                </ul>
                <p className="text-sm text-[hsl(0,0%,45%)]">
                  For full details, please refer to our <Link to="/privacy" className="text-[hsl(43,45%,44%)] hover:underline">Privacy Policy</Link>.
                </p>
              </div>
            </section>

            <GoldDivider />

            {/* 5 */}
            <section id="professional-network" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">5.</span>Professional Network
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>We work with a vetted network of licensed professionals:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Licensed real estate developers</li>
                  <li>Qualified legal advisors</li>
                  <li>Certified valuation experts</li>
                  <li>Government-approved immigration partners</li>
                </ul>
                <div className="mt-4 bg-[hsl(43,45%,54%)]/5 border border-[hsl(43,45%,54%)]/15 rounded-lg p-4">
                  <p className="text-[hsl(0,0%,40%)] text-sm">
                    We do not claim direct government affiliation unless officially certified. Partner services are provided by independent licensed professionals who contract directly with clients.
                  </p>
                </div>
              </div>
            </section>

            <GoldDivider />

            {/* 6 */}
            <section id="audit-monitoring" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">6.</span>Continuous Audit &amp; Monitoring
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>We maintain ongoing oversight of our operations and systems:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Internal review systems for service quality assurance</li>
                  <li>Ongoing compliance checks against regulatory requirements</li>
                  <li>Periodic policy updates to reflect legal and market changes</li>
                  <li>Platform security monitoring and vulnerability assessment</li>
                </ul>
              </div>
            </section>

            <GoldDivider />

            {/* 7 */}
            <section id="client-protection" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">7.</span>Client Protection Commitment
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>We are committed to maintaining the highest standards of professional conduct:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Ethical advisory practices at all times</li>
                  <li>Fact-based guidance supported by market data and verified information</li>
                  <li>No false promises, misleading representations, or inflated projections</li>
                  <li>No guaranteed returns on property investments</li>
                </ul>
                <p className="mt-2">
                  Our advisory services are designed to provide clarity, not certainty. Real estate markets are subject to fluctuation, and all decisions should be made with independent professional counsel where appropriate.
                </p>
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
                <Link to="/risk-disclosure" className="text-[hsl(43,45%,44%)] hover:underline">Risk Disclosure</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default TrustAndCompliance;
