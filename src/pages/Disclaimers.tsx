import React, { useState, useEffect, useRef } from 'react';
import { Building2, Scale, BarChart3, Globe, Cpu, ExternalLink, ShieldCheck, UserCheck, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-10">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/60" />
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
  </div>
);

const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2.5 ml-1">
    {items.map((item, i) => (<li key={i} className="flex items-start gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#C8A766] mt-2 shrink-0" /><span>{item}</span></li>))}
  </ul>
);

const tocItems = [
  { id: "s1", label: "Licensed Brokerage Scope", icon: Building2 },
  { id: "s2", label: "Scope Boundaries", icon: Scale },
  { id: "s3", label: "Data & Market Information", icon: BarChart3 },
  { id: "s4", label: "Residency & Golden Visa", icon: Globe },
  { id: "s5", label: "Digital & AI Advisory Tools", icon: Cpu },
  { id: "s6", label: "External Platforms", icon: ExternalLink },
  { id: "s7", label: "Liability Clarification", icon: ShieldCheck },
  { id: "s8", label: "Client Responsibility", icon: UserCheck },
  { id: "s9", label: "Regulatory Position", icon: Landmark },
];

const Disclaimers = () => {
  const [activeSection, setActiveSection] = useState("s1");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
    );
    tocItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <SEOHead title="Disclaimer & Professional Scope | JBJ Global Real Estate" description="Licensed real estate brokerage transparency — professional scope, regulatory clarifications, and user responsibilities." canonicalPath="/disclaimers" />

      <div className="min-h-screen bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        {/* Hero */}
        <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
          <div className="relative max-w-6xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C8A766]/10 border border-[#C8A766]/25 rounded-full mb-6">
              <Scale className="w-4 h-4 text-[#C8A766]" />
              <span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Legal Transparency</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Disclaimer & Professional Scope</h1>
            <p className="text-lg md:text-xl text-[#C8A766] font-medium mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Licensed Real Estate Brokerage Transparency</p>
            <p className="text-zinc-400 leading-relaxed max-w-3xl mx-auto text-[15px] md:text-base">JBJ Global Real Estate operates as a licensed real estate brokerage within the United Arab Emirates. This page outlines the professional scope of services, regulatory clarifications, and user responsibilities associated with our platform and advisory services.</p>
          </div>
        </section>

        {/* 2-column layout */}
        <div className="max-w-6xl mx-auto px-6 pb-20 pt-12 flex gap-10">
          {/* Sidebar TOC — desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs uppercase tracking-widest text-[#C8A766]/60 font-bold mb-3 px-3">Table of Contents</p>
              {tocItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      activeSection === item.id
                        ? "text-[#C8A766] font-semibold border-l-2 border-[#C8A766] bg-[#C8A766]/5"
                        : "text-zinc-500 hover:text-zinc-300 border-l-2 border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile TOC */}
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 bg-[#1a1714]/95 backdrop-blur-md border border-[#C8A766]/30 rounded-xl p-3 shadow-2xl">
            <div className="flex gap-2 overflow-x-auto pb-1 jj-scrollbar-gold-x">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                    activeSection === item.id
                      ? "bg-[#C8A766]/20 text-[#C8A766] border border-[#C8A766]/40"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-8 min-w-0">
            <div id="s1">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><Building2 className="w-5 h-5 text-[#C8A766]" /></div>
                  <div><span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section 01</span><h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Licensed Brokerage Scope</h2></div>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>JBJ Global Real Estate is authorized to conduct the following activities under its UAE commercial license:</p>
                  <BulletList items={["Buying and selling real estate","Leasing and rental brokerage","Property acquisition advisory","Real estate investment analysis within brokerage scope","Market research and pricing analysis","Developer project consulting","Portfolio advisory related to property assets"]} />
                  <p>All advisory services provided relate strictly to property and real estate transactions within the framework of applicable UAE regulations.</p>
                  <p className="text-zinc-800 font-medium">We are legally permitted to provide real estate investment advisory as part of licensed brokerage services.</p>
                </div>
              </CCard>
            </div>

            <div id="s2">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><Scale className="w-5 h-5 text-[#C8A766]" /></div>
                  <div><span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section 02</span><h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Scope Boundaries</h2></div>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
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
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-[#C8A766]" /></div>
                  <div><span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section 03</span><h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Data & Market Information</h2></div>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
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
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><Globe className="w-5 h-5 text-[#C8A766]" /></div>
                  <div><span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section 04</span><h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Residency & Golden Visa Information</h2></div>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>Information provided regarding UAE Golden Visa or residency eligibility is based on publicly available government guidelines.</p>
                  <p>Final approval, eligibility, and processing decisions remain exclusively under the authority of relevant UAE government entities.</p>
                  <p className="text-zinc-800 font-medium">JBJ Global Real Estate does not issue visas nor guarantee residency approval.</p>
                </div>
              </CCard>
            </div>

            <GoldDivider />

            <div id="s5">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><Cpu className="w-5 h-5 text-[#C8A766]" /></div>
                  <div><span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section 05</span><h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Digital & AI Advisory Tools</h2></div>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>AI-powered tools provided on this platform offer analytical insights, forecasts, and data modeling for real estate evaluation. These tools:</p>
                  <BulletList items={["Provide predictive insights","Do not guarantee investment outcomes","Support decision-making","Do not replace professional consultation"]} />
                  <p>Users are responsible for validating outputs before executing financial commitments.</p>
                </div>
              </CCard>
            </div>

            <div id="s6">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><ExternalLink className="w-5 h-5 text-[#C8A766]" /></div>
                  <div><span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section 06</span><h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>External Platforms & References</h2></div>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>The platform may reference third-party data sources, developers, or external property platforms. JBJ Global Real Estate is not responsible for:</p>
                  <BulletList items={["Third-party platform content","External website policies","Developer operational decisions","Construction delays","Changes in external terms"]} />
                </div>
              </CCard>
            </div>

            <GoldDivider />

            <div id="s7">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-[#C8A766]" /></div>
                  <div><span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section 07</span><h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Liability Clarification</h2></div>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>JBJ Global Real Estate shall not be held liable for:</p>
                  <BulletList items={["Market fluctuations","Developer timeline changes","Investment performance outcomes","Financing approvals","Government processing delays"]} />
                  <p>Real estate transactions inherently carry market risks.</p>
                </div>
              </CCard>
            </div>

            <div id="s8">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><UserCheck className="w-5 h-5 text-[#C8A766]" /></div>
                  <div><span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section 08</span><h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Client Responsibility</h2></div>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>By using this platform, users acknowledge:</p>
                  <BulletList items={["Responsibility for independent verification","Understanding of market risk","Acceptance of advisory nature of projections","Commitment to due diligence"]} />
                </div>
              </CCard>
            </div>

            <div id="s9">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><Landmark className="w-5 h-5 text-[#C8A766]" /></div>
                  <div><span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section 09</span><h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Regulatory Position</h2></div>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>JBJ Global Real Estate operates in compliance with UAE real estate regulations and conducts brokerage activities within licensed scope.</p>
                  <p>This disclaimer ensures transparency and regulatory clarity.</p>
                </div>
              </CCard>
            </div>

            {/* Footer */}
            <GoldDivider />
            <div className="text-center pt-4">
              <p className="text-xs text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-4">This Disclaimer may be updated periodically to reflect regulatory developments and operational changes.</p>
              <p className="text-zinc-500 text-sm">&copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.</p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <Link to="/privacy" className="text-[#C8A766] hover:underline">Privacy Policy</Link>
                <span className="text-zinc-600">|</span>
                <Link to="/terms" className="text-[#C8A766] hover:underline">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Disclaimers;
