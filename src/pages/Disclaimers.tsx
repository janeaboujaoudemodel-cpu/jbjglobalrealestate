import React from 'react';
import { Building2, Scale, BarChart3, Globe, Cpu, ExternalLink, ShieldCheck, UserCheck, Landmark, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-8">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#B89555]/35 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#B89555]/55" />
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#B89555]/35 to-transparent" />
  </div>
);

const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative overflow-hidden bg-[#F7F2EA] rounded-2xl p-5 sm:p-6 md:p-8 border border-[#064E3B]/25 shadow-[0_18px_42px_-32px_rgba(4,44,28,0.58)] ${className}`}>
    <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-[#EFE6D6]/10 rounded-full blur-3xl" />
    <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-[#EFE6D6]/10 rounded-full blur-3xl" />
    <div className="relative z-10">{children}</div>
  </div>
);

const SectionIcon = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`jj-disclaimer-icon flex shrink-0 items-center justify-center rounded-full shadow-[0_16px_36px_rgba(6,78,59,0.22)] ${className || "h-10 w-10"}`}
    style={{ background: "linear-gradient(135deg,#064E3B 0%,#053A2C 56%,#021A14 100%)" }}
  >
    {children}
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2.5 ml-1">
    {items.map((item, i) => (<li key={i} className="flex items-start gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#B89555] mt-2 shrink-0" /><span className="text-[#1A1A1A]/85">{item}</span></li>))}
  </ul>
);

const Disclaimers = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <SEOHead title="Disclaimer & Professional Scope | JBJ Global Real Estate" description="Licensed real estate brokerage transparency — professional scope, regulatory clarifications, and user responsibilities." canonicalPath="/disclaimers" />

      <div className="min-h-screen bg-[#F7F2EA]">
        {/* Hero */}
        <section
          data-hero-dark
          className="jj-fullbleed-band jj-disclaimer-hero relative overflow-hidden py-20 md:py-28 border-b border-[#B89555]/25"
          style={{ background: "linear-gradient(135deg,#064E3B 0%,#042C20 42%,#010F0B 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-70 jj-disclaimer-hero__motion" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 to-transparent" />
          <div className="relative max-w-6xl mx-auto px-6 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F7F2EA] border border-[#B89555]/35 rounded-full mb-6">
              <Scale className="w-4 h-4 text-[#B89555]" />
              <span className="text-xs font-semibold text-[#1A1A1A] tracking-widest uppercase">Legal Transparency</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#FFFFFF" }}>Disclaimer & Professional Scope</h1>
            <p className="text-lg md:text-xl font-medium mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#FFFFFF" }}>Licensed Real Estate Brokerage Transparency</p>
            <p className="leading-relaxed max-w-3xl mx-auto text-[15px] md:text-base" style={{ color: "rgba(255,255,255,0.9)" }}>JBJ Global Real Estate operates as a licensed real estate brokerage within the United Arab Emirates. This page outlines the professional scope of services, regulatory clarifications, and user responsibilities associated with our platform and advisory services.</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => scrollTo("s1")}
                className="jj-disclaimer-action jj-disclaimer-action--primary group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] focus:outline-none focus:ring-2 focus:ring-white/45"
                style={{ color: "#FFFFFF" }}
              >
                Review Scope
                <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo("s8")}
                className="jj-disclaimer-action jj-disclaimer-action--secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] focus:outline-none focus:ring-2 focus:ring-[#B89555]/45"
                style={{ color: "#064E3B" }}
              >
                Client Responsibility
              </button>
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="jj-content-track pb-16 pt-10">
          <div className="jj-disclaimer-content space-y-8 min-w-0">
            <div id="s1">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><Building2 className="w-5 h-5" style={{ color: "#FFFFFF" }} strokeWidth={2.2} /></SectionIcon>
                  <div><span className="text-xs font-semibold text-[#B89555] tracking-widest uppercase">Section 01</span><h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Licensed Brokerage Scope</h2></div>
                </div>
                <div className="text-[#1A1A1A]/70 leading-relaxed text-[15px] space-y-4">
                  <p>JBJ Global Real Estate is authorized to conduct the following activities under its UAE commercial license:</p>
                  <BulletList items={["Buying and selling real estate","Leasing and rental brokerage","Property acquisition advisory","Real estate investment analysis within brokerage scope","Market research and pricing analysis","Developer project consulting","Portfolio advisory related to property assets"]} />
                  <p>All advisory services provided relate strictly to property and real estate transactions within the framework of applicable UAE regulations.</p>
                  <p className="text-[#1A1A1A] font-medium">We are legally permitted to provide real estate investment advisory as part of licensed brokerage services.</p>
                </div>
              </CCard>
            </div>

            <div id="s2">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><Scale className="w-5 h-5" style={{ color: "#FFFFFF" }} strokeWidth={2.2} /></SectionIcon>
                  <div><span className="text-xs font-semibold text-[#B89555] tracking-widest uppercase">Section 02</span><h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Scope Boundaries</h2></div>
                </div>
                <div className="text-[#1A1A1A]/70 leading-relaxed text-[15px] space-y-4">
                  <p>JBJ Global Real Estate does not provide:</p>
                  <BulletList items={["Legal representation services","Immigration law representation","Certified tax consultancy","Corporate structuring advice","Independent financial planning outside property scope"]} />
                  <p>Where required, clients may engage licensed legal advisors, tax consultants, or government-approved entities for specialized services.</p>
                </div>
              </CCard>
            </div>

            <GoldDivider />

            <div id="s3">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><BarChart3 className="w-5 h-5" style={{ color: "#FFFFFF" }} strokeWidth={2.2} /></SectionIcon>
                  <div><span className="text-xs font-semibold text-[#B89555] tracking-widest uppercase">Section 03</span><h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Data & Market Information</h2></div>
                </div>
                <div className="text-[#1A1A1A]/70 leading-relaxed text-[15px] space-y-4">
                  <p>Property pricing, availability, rental yield projections, and investment analytics are based on developer data, market statistics, government publications, and internal analytical tools.</p>
                  <p>While reasonable care is taken to ensure accuracy:</p>
                  <BulletList items={["Prices may change without notice","Availability may vary","Market conditions fluctuate","Projected returns are not guaranteed outcomes"]} />
                  <p>All investment decisions should be supported by independent due diligence.</p>
                </div>
              </CCard>
            </div>

            <div id="s4">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><Globe className="w-5 h-5" style={{ color: "#FFFFFF" }} strokeWidth={2.2} /></SectionIcon>
                  <div><span className="text-xs font-semibold text-[#B89555] tracking-widest uppercase">Section 04</span><h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Residency & Golden Visa Information</h2></div>
                </div>
                <div className="text-[#1A1A1A]/70 leading-relaxed text-[15px] space-y-4">
                  <p>Information provided regarding UAE Golden Visa or residency eligibility is based on publicly available government guidelines.</p>
                  <p>Final approval, eligibility, and processing decisions remain exclusively under the authority of relevant UAE government entities.</p>
                  <p className="text-[#1A1A1A] font-medium">JBJ Global Real Estate does not issue visas nor guarantee residency approval.</p>
                </div>
              </CCard>
            </div>

            <GoldDivider />

            <div id="s5">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><Cpu className="w-5 h-5" style={{ color: "#FFFFFF" }} strokeWidth={2.2} /></SectionIcon>
                  <div><span className="text-xs font-semibold text-[#B89555] tracking-widest uppercase">Section 05</span><h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Digital & AI Advisory Tools</h2></div>
                </div>
                <div className="text-[#1A1A1A]/70 leading-relaxed text-[15px] space-y-4">
                  <p>AI-powered tools provided on this platform offer analytical insights, forecasts, and data modeling for real estate evaluation. These tools:</p>
                  <BulletList items={["Provide predictive insights","Do not guarantee investment outcomes","Support decision-making","Do not replace professional consultation"]} />
                  <p>Users are responsible for validating outputs before executing financial commitments.</p>
                </div>
              </CCard>
            </div>

            <div id="s6">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><ExternalLink className="w-5 h-5" style={{ color: "#FFFFFF" }} strokeWidth={2.2} /></SectionIcon>
                  <div><span className="text-xs font-semibold text-[#B89555] tracking-widest uppercase">Section 06</span><h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>External Platforms & References</h2></div>
                </div>
                <div className="text-[#1A1A1A]/70 leading-relaxed text-[15px] space-y-4">
                  <p>The platform may reference third-party data sources, developers, or external property platforms. JBJ Global Real Estate is not responsible for:</p>
                  <BulletList items={["Third-party platform content","External website policies","Developer operational decisions","Construction delays","Changes in external terms"]} />
                </div>
              </CCard>
            </div>

            <GoldDivider />

            <div id="s7">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><ShieldCheck className="w-5 h-5" style={{ color: "#FFFFFF" }} strokeWidth={2.2} /></SectionIcon>
                  <div><span className="text-xs font-semibold text-[#B89555] tracking-widest uppercase">Section 07</span><h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Liability Clarification</h2></div>
                </div>
                <div className="text-[#1A1A1A]/70 leading-relaxed text-[15px] space-y-4">
                  <p>JBJ Global Real Estate shall not be held liable for:</p>
                  <BulletList items={["Market fluctuations","Developer timeline changes","Investment performance outcomes","Financing approvals","Government processing delays"]} />
                  <p>Real estate transactions inherently carry market risks.</p>
                </div>
              </CCard>
            </div>

            <div id="s8">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><UserCheck className="w-5 h-5" style={{ color: "#FFFFFF" }} strokeWidth={2.2} /></SectionIcon>
                  <div><span className="text-xs font-semibold text-[#B89555] tracking-widest uppercase">Section 08</span><h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Client Responsibility</h2></div>
                </div>
                <div className="text-[#1A1A1A]/70 leading-relaxed text-[15px] space-y-4">
                  <p>By using this platform, users acknowledge:</p>
                  <BulletList items={["Responsibility for independent verification","Understanding of market risk","Acceptance of advisory nature of projections","Commitment to due diligence"]} />
                </div>
              </CCard>
            </div>

            <div id="s9">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><Landmark className="w-5 h-5" style={{ color: "#FFFFFF" }} strokeWidth={2.2} /></SectionIcon>
                  <div><span className="text-xs font-semibold text-[#B89555] tracking-widest uppercase">Section 09</span><h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Regulatory Position</h2></div>
                </div>
                <div className="text-[#1A1A1A]/70 leading-relaxed text-[15px] space-y-4">
                  <p>JBJ Global Real Estate operates in compliance with UAE real estate regulations and conducts brokerage activities within licensed scope.</p>
                  <p>This disclaimer ensures transparency and regulatory clarity.</p>
                </div>
              </CCard>
            </div>

            {/* Footer */}
            <GoldDivider />
            <div className="text-center pt-4">
              <p className="text-xs text-[#1A1A1A]/70 max-w-2xl mx-auto leading-relaxed mb-4">This Disclaimer may be updated periodically to reflect regulatory developments and operational changes.</p>
              <p className="text-[#1A1A1A]/70 text-sm">&copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.</p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <Link to="/privacy" className="text-[#B89555] hover:underline">Privacy Policy</Link>
                <span className="text-[#1A1A1A]/70">|</span>
                <Link to="/terms" className="text-[#B89555] hover:underline">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Disclaimers;
