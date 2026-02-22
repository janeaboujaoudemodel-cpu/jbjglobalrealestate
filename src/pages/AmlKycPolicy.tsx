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
  { id: "regulatory-framework", label: "Regulatory Framework" },
  { id: "client-verification", label: "Client Verification & Due Diligence" },
  { id: "enhanced-review", label: "Enhanced Due Diligence" },
  { id: "suspicious-activity", label: "Internal Escalation & Reporting" },
  { id: "record-management", label: "Secure Record Management" },
  { id: "client-obligations", label: "Client Obligations" },
];

const AmlKycPolicy = () => {
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
            <p className="text-[hsl(43,45%,54%)] text-sm font-medium tracking-[0.2em] uppercase mb-4">Compliance</p>
            <h1 className="text-[hsl(0,0%,15%)] text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Anti-Money Laundering (AML) &amp; Know Your Customer (KYC) Policy
            </h1>
            <p className="text-[hsl(43,45%,44%)] text-lg md:text-xl mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Commitment to Financial Integrity, Transparency, and Regulatory Compliance
            </p>
            <p className="text-[hsl(0,0%,40%)] leading-relaxed max-w-2xl">
              We are committed to preventing money laundering, terrorist financing, fraud, and illicit financial activity. Our AML and KYC framework aligns with applicable United Arab Emirates regulatory standards and internationally recognised compliance principles.
            </p>
            <div className="mt-6 w-24 h-px bg-gradient-to-r from-[hsl(43,45%,54%)] to-transparent" />
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
            <section id="regulatory-framework" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">1.</span>Regulatory Framework
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Our compliance framework operates in alignment with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>UAE Federal Anti-Money Laundering regulations</li>
                  <li>Real estate regulatory compliance requirements applicable within the UAE</li>
                  <li>Financial transparency and reporting standards as prescribed by competent UAE authorities</li>
                </ul>
                <div className="mt-4 bg-[hsl(43,45%,54%)]/5 border border-[hsl(43,45%,54%)]/15 rounded-lg p-4">
                  <p className="text-[hsl(0,0%,40%)] text-sm">
                    We operate in accordance with applicable UAE laws and regulatory frameworks. We are not a regulatory authority.
                  </p>
                </div>
              </div>
            </section>

            <GoldDivider />

            {/* 2 */}
            <section id="client-verification" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">2.</span>Client Verification &amp; Due Diligence
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>As part of our commitment to regulatory compliance, we implement structured client verification and due diligence procedures:</p>
                <div className="grid gap-3 mt-4">
                  {[
                    { title: "Identity Verification", desc: "Collection and verification of government-issued identification documents." },
                    { title: "Source of Funds Documentation", desc: "Request for documentation evidencing the origin of funds used in transactions." },
                    { title: "Risk Profiling", desc: "Assessment of client risk levels based on established criteria and regulatory guidance." },
                    { title: "PEP Screening", desc: "Screening against Politically Exposed Person (PEP) databases where applicable." },
                    { title: "Ongoing Monitoring", desc: "Periodic review and monitoring of client relationships where warranted." },
                  ].map((item) => (
                    <div key={item.title} className="bg-[hsl(40,30%,96%)] border border-[hsl(43,45%,54%)]/10 rounded-lg p-4">
                      <p className="font-semibold text-[hsl(0,0%,20%)] text-sm mb-1">{item.title}</p>
                      <p className="text-[hsl(0,0%,45%)] text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <GoldDivider />

            {/* 3 */}
            <section id="enhanced-review" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">3.</span>Enhanced Due Diligence
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>For elevated-risk classifications, additional documentation and review measures may apply, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[hsl(0,0%,20%)]">Expanded Documentation</strong> — Additional supporting documents may be requested to verify identity, source of funds, or beneficial ownership.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Additional Verification</strong> — Enhanced verification procedures may be conducted through independent channels.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Senior Compliance Review</strong> — Higher-risk cases are escalated for review by senior compliance personnel.</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Increased Transaction Monitoring</strong> — Ongoing monitoring frequency may be increased for elevated-risk relationships.</li>
                </ul>
              </div>
            </section>

            <GoldDivider />

            {/* 4 */}
            <section id="suspicious-activity" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">4.</span>Internal Escalation &amp; Reporting
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>In the event of suspicious activity indicators:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>An internal compliance review is initiated promptly</li>
                  <li>Relevant documentation and transaction records are evaluated</li>
                  <li>Reporting obligations are fulfilled where legally required under applicable UAE law</li>
                </ul>
                <p className="text-[hsl(0,0%,45%)] text-sm mt-2">
                  All internal reviews are conducted with discretion and in accordance with established procedures.
                </p>
              </div>
            </section>

            <GoldDivider />

            {/* 5 */}
            <section id="record-management" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">5.</span>Secure Record Management
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>We maintain rigorous standards for the storage and protection of compliance-related records:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Secure digital storage with encryption protocols</li>
                  <li>Restricted access controls limiting data to authorised compliance personnel</li>
                  <li>Retention periods in accordance with applicable legal obligations</li>
                  <li>Protection of sensitive client documentation at all stages of processing</li>
                </ul>
                <p className="text-sm text-[hsl(0,0%,45%)] mt-2">
                  For further information on data handling, please refer to our <Link to="/privacy" className="text-[hsl(43,45%,44%)] hover:underline">Privacy Policy</Link>.
                </p>
              </div>
            </section>

            <GoldDivider />

            {/* 6 */}
            <section id="client-obligations" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">6.</span>Client Obligations
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Clients engaging with our services are required to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete documentation as requested</li>
                  <li>Cooperate fully with verification and due diligence procedures</li>
                  <li>Notify us promptly of any material changes to previously provided information</li>
                </ul>
                <p className="mt-2">
                  Failure to comply with verification requirements may result in the suspension or termination of services.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-[hsl(43,45%,54%)]/15">
              <p className="text-[hsl(0,0%,55%)] text-xs leading-relaxed text-center mb-6">
                This AML &amp; KYC Policy may be updated periodically to reflect regulatory developments. Users are encouraged to review this page regularly.
              </p>
              <p className="text-[hsl(0,0%,55%)] text-sm text-center">
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

export default AmlKycPolicy;
