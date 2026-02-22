import React, { useState } from 'react';
import {
  Building2, Scale, BarChart3, ShieldCheck, Cpu, Handshake,
  ClipboardCheck, Server, Eye, Landmark, ChevronDown, ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-8">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/40" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" />
  </div>
);

const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

const PillarCard = ({ icon: Icon, title, description }: {
  icon: React.ElementType; title: string; description: string;
}) => (
  <CCard>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[#C8A766]/15">
      <Icon className="w-6 h-6 text-[#C8A766]" />
    </div>
    <h3 className="text-lg font-bold text-black mb-2" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>{title}</h3>
    <p className="text-zinc-600 text-[15px] leading-relaxed">{description}</p>
  </CCard>
);

const Section = ({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <CCard className="!p-0 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-[#C8A766]/5 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#C8A766]" />
        </div>
        <h2 className="flex-1 text-lg md:text-xl font-bold text-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>{title}</h2>
        <ChevronDown className={`w-5 h-5 text-[#C8A766]/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-6 text-zinc-700 leading-relaxed text-[15px] space-y-4 border-t border-[#C8A766]/20 pt-5">
          {children}
        </div>
      )}
    </CCard>
  );
};

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

const TrustAndAuditCenter = () => {
  return (
    <>
      <SEOHead
        title="Trust, Compliance & Audit Framework | JBJ Global Real Estate"
        description="Institutional standards, regulated brokerage transparency, data protection, and AI governance at JBJ Global Real Estate."
        keywords="trust center, compliance, audit, data protection, AI governance, real estate UAE"
        canonicalPath="/trust-and-audit-center"
      />

      <section className="min-h-screen bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        {/* Hero */}
        <div className="bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
          <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
            <Link to="/" className="inline-flex items-center gap-2 text-[#C8A766]/70 hover:text-[#C8A766] transition-colors mb-10">
              <ChevronLeft className="w-4 h-4" /><span className="text-sm">Back to Home</span>
            </Link>
            <div className="max-w-3xl">
              <p className="text-[#C8A766] text-sm font-medium tracking-[0.2em] uppercase mb-4">Trust & Compliance</p>
              <h1 className="text-white text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                Trust, Compliance & Audit Framework
              </h1>
              <p className="text-[#C8A766] text-lg md:text-xl mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                Institutional Standards. Regulated Brokerage. Transparent Operations.
              </p>
              <p className="text-zinc-400 leading-relaxed max-w-2xl">
                At JBJ Global Real Estate, trust is built through regulatory compliance, operational transparency, data protection, and ethical brokerage standards. This page outlines the internal and external safeguards that support our clients, partners, and investors.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-20 pt-12">
          {/* Trust Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {pillars.map((p) => (
              <PillarCard key={p.title} {...p} />
            ))}
          </div>

          <GoldDivider />

          {/* Detailed Sections */}
          <div className="space-y-5">
            <Section icon={ClipboardCheck} title="Internal Oversight & Process Controls">
              <p>JBJ Global Real Estate maintains structured internal oversight including:</p>
              <BulletList items={[
                'Transaction documentation tracking',
                'Contract review processes',
                'Developer verification checks',
                'Data logging of advisory tools',
                'AI usage monitoring',
                'Platform access control',
              ]} />
              <p>Operational records are maintained for compliance, accountability, and quality assurance purposes.</p>
            </Section>

            <Section icon={Server} title="Platform Integrity & Data Handling">
              <p>Our digital ecosystem includes:</p>
              <BulletList items={[
                'Secure database architecture',
                'Role-based access control',
                'Broker authorization layers',
                'User isolation via database policies',
                'AI usage logging',
                'Encrypted API communication',
              ]} />
              <p className="text-zinc-800 font-medium">Sensitive data is not publicly exposed and is never sold to third parties.</p>
            </Section>

            <GoldDivider />

            <Section icon={Eye} title="AI Tool Governance">
              <p>AI-powered features available on this platform are:</p>
              <BulletList items={[
                'Logged under structured job tracking systems',
                'Monitored for misuse',
                'Restricted based on access level',
                'Designed to avoid storage of personal identifying information',
              ]} />
              <p>AI outputs are advisory insights and not automated execution systems.</p>
            </Section>

            <Section icon={Handshake} title="External Platform Integrations">
              <p>Where data is integrated from licensed developer sources or external APIs:</p>
              <BulletList items={[
                'Data accuracy depends on source providers',
                'Updates are synchronized periodically',
                'No unauthorized scraping is performed',
                'Source attribution remains intact',
              ]} />
              <p>We maintain ethical data sourcing practices.</p>
            </Section>

            <GoldDivider />

            <Section icon={ShieldCheck} title="Professional Commitment">
              <p>JBJ Global Real Estate operates with a commitment to:</p>
              <BulletList items={[
                'Long-term client relationships',
                'Transparent communication',
                'Regulatory alignment',
                'Responsible advisory',
              ]} />
              <p>Trust is foundational to our brand and operational structure.</p>
            </Section>

            <Section icon={Landmark} title="Audit Position">
              <p>While not a financial auditing firm, JBJ Global Real Estate maintains structured operational controls and internal review processes to ensure service quality and compliance integrity.</p>
            </Section>
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
      </section>
    </>
  );
};

export default TrustAndAuditCenter;
