import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Scale, BarChart3, ShieldCheck, Cpu, Handshake,
  ClipboardCheck, Server, Eye, Landmark
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-10">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/60" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
  </div>
);

const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2.5 ml-1">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C8A766] mt-2 shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const pillars = [
  { icon: Building2, title: 'Licensed Brokerage', description: 'JBJ Global Real Estate operates under a valid UAE real estate brokerage license, conducting buy, sell, and leasing activities in accordance with regulatory requirements.' },
  { icon: Scale, title: 'Regulatory Compliance', description: 'All real estate transactions are conducted in alignment with applicable UAE property regulations, contract frameworks, and developer compliance standards.' },
  { icon: BarChart3, title: 'Transparent Advisory', description: 'We provide structured market analysis, pricing insights, and investment evaluation within the scope of licensed brokerage activities.' },
  { icon: ShieldCheck, title: 'Data Protection Standards', description: 'Client data is handled with strict confidentiality, secure storage practices, and controlled access permissions.' },
  { icon: Cpu, title: 'AI & Digital Governance', description: 'AI-powered tools are deployed responsibly, with safeguards to prevent misuse, misinformation, and unauthorized data storage.' },
  { icon: Handshake, title: 'Ethical Conduct', description: 'Our brokerage practices follow principles of transparency, client-first advisory, and conflict-of-interest mitigation.' },
];

const tocItems = [
  { id: "pillars", label: "Trust Pillars", icon: ShieldCheck },
  { id: "oversight", label: "Internal Oversight", icon: ClipboardCheck },
  { id: "platform", label: "Platform Integrity", icon: Server },
  { id: "ai-governance", label: "AI Tool Governance", icon: Eye },
  { id: "integrations", label: "External Integrations", icon: Handshake },
  { id: "commitment", label: "Professional Commitment", icon: ShieldCheck },
  { id: "audit", label: "Audit Position", icon: Landmark },
];

const TrustAndAuditCenter = () => {
  const [activeSection, setActiveSection] = useState("pillars");
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
      <SEOHead
        title="Trust, Compliance & Audit Framework | JBJ Global Real Estate"
        description="Institutional standards, regulated brokerage transparency, data protection, and AI governance at JBJ Global Real Estate."
        keywords="trust center, compliance, audit, data protection, AI governance, real estate UAE"
        canonicalPath="/trust-and-audit-center"
      />

      <div className="min-h-screen bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        {/* Hero */}
        <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
          <div className="relative max-w-6xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C8A766]/10 border border-[#C8A766]/25 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4 text-[#C8A766]" />
              <span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Trust & Compliance</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Trust, Compliance & Audit Framework
            </h1>
            <p className="text-lg md:text-xl text-[#C8A766] font-medium mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Institutional Standards. Regulated Brokerage. Transparent Operations.
            </p>
            <p className="text-zinc-400 leading-relaxed max-w-3xl mx-auto text-[15px]">
              At JBJ Global Real Estate, trust is built through regulatory compliance, operational transparency, data protection, and ethical brokerage standards. This page outlines the internal and external safeguards that support our clients, partners, and investors.
            </p>
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

          {/* Main content */}
          <div className="flex-1 space-y-8 min-w-0">
            {/* Trust Pillars Grid */}
            <div id="pillars">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <ShieldCheck className="w-6 h-6 text-[#C8A766]" />Trust Pillars
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pillars.map((p) => (
                  <CCard key={p.title}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[#C8A766]/15">
                      <p.icon className="w-6 h-6 text-[#C8A766]" />
                    </div>
                    <h3 className="text-lg font-bold text-black mb-2" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>{p.title}</h3>
                    <p className="text-zinc-600 text-[15px] leading-relaxed">{p.description}</p>
                  </CCard>
                ))}
              </div>
            </div>

            <GoldDivider />

            <div id="oversight">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><ClipboardCheck className="w-5 h-5 text-[#C8A766]" /></div>
                  <h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Internal Oversight & Process Controls</h2>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>JBJ Global Real Estate maintains structured internal oversight including:</p>
                  <BulletList items={['Transaction documentation tracking','Contract review processes','Developer verification checks','Data logging of advisory tools','AI usage monitoring','Platform access control']} />
                  <p>Operational records are maintained for compliance, accountability, and quality assurance purposes.</p>
                </div>
              </CCard>
            </div>

            <div id="platform">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><Server className="w-5 h-5 text-[#C8A766]" /></div>
                  <h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Platform Integrity & Data Handling</h2>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>Our digital ecosystem includes:</p>
                  <BulletList items={['Secure database architecture','Role-based access control','Broker authorization layers','User isolation via database policies','AI usage logging','Encrypted API communication']} />
                  <p className="text-zinc-800 font-medium">Sensitive data is not publicly exposed and is never sold to third parties.</p>
                </div>
              </CCard>
            </div>

            <GoldDivider />

            <div id="ai-governance">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><Eye className="w-5 h-5 text-[#C8A766]" /></div>
                  <h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>AI Tool Governance</h2>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>AI-powered features available on this platform are:</p>
                  <BulletList items={['Logged under structured job tracking systems','Monitored for misuse','Restricted based on access level','Designed to avoid storage of personal identifying information']} />
                  <p>AI outputs are advisory insights and not automated execution systems.</p>
                </div>
              </CCard>
            </div>

            <div id="integrations">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><Handshake className="w-5 h-5 text-[#C8A766]" /></div>
                  <h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>External Platform Integrations</h2>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>Where data is integrated from licensed developer sources or external APIs:</p>
                  <BulletList items={['Data accuracy depends on source providers','Updates are synchronized periodically','No unauthorized scraping is performed','Source attribution remains intact']} />
                  <p>We maintain ethical data sourcing practices.</p>
                </div>
              </CCard>
            </div>

            <GoldDivider />

            <div id="commitment">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-[#C8A766]" /></div>
                  <h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Professional Commitment</h2>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>JBJ Global Real Estate operates with a commitment to:</p>
                  <BulletList items={['Long-term client relationships','Transparent communication','Regulatory alignment','Responsible advisory']} />
                  <p>Trust is foundational to our brand and operational structure.</p>
                </div>
              </CCard>
            </div>

            <div id="audit">
              <CCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center"><Landmark className="w-5 h-5 text-[#C8A766]" /></div>
                  <h2 className="text-lg font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Audit Position</h2>
                </div>
                <div className="text-zinc-700 leading-relaxed text-[15px] space-y-4">
                  <p>While not a financial auditing firm, JBJ Global Real Estate maintains structured operational controls and internal review processes to ensure service quality and compliance integrity.</p>
                </div>
              </CCard>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-[#C8A766]/15 text-center">
              <p className="text-xs text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-4">
                This Trust & Audit Framework may be updated periodically to reflect regulatory developments and operational enhancements.
              </p>
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

export default TrustAndAuditCenter;
