import React, { useState } from 'react';
import {
  Building2, Scale, BarChart3, ShieldCheck, Cpu, Handshake,
  ClipboardCheck, Server, Eye, Landmark, ChevronDown
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-10">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/60" />
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
  </div>
);

/* Trust Pillar Card */
const PillarCard = ({ icon: Icon, title, description, accentClass }: {
  icon: React.ElementType;
  title: string;
  description: string;
  accentClass: string;
}) => (
  <div className="bg-white/80 backdrop-blur-sm border border-[#C8A766]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accentClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-serif font-bold text-zinc-900 mb-2">{title}</h3>
    <p className="text-zinc-600 text-[15px] leading-relaxed">{description}</p>
  </div>
);

/* Collapsible Section */
const Section = ({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-[#C8A766]/20 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-[#FAF7F2]/60 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C8A766]/20 to-[#C8A766]/5 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#C8A766]" />
        </div>
        <h2 className="flex-1 text-lg md:text-xl font-serif font-bold text-zinc-900">{title}</h2>
        <ChevronDown className={`w-5 h-5 text-[#C8A766]/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-6 text-zinc-700 leading-relaxed text-[15px] space-y-4 border-t border-[#C8A766]/10 pt-5">
          {children}
        </div>
      )}
    </div>
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
  {
    icon: Building2,
    title: 'Licensed Brokerage',
    description: 'JBJ Global Real Estate operates under a valid UAE real estate brokerage license, conducting buy, sell, and leasing activities in accordance with regulatory requirements.',
    accentClass: 'bg-[#C8A766]/15 text-[#C8A766]',
  },
  {
    icon: Scale,
    title: 'Regulatory Compliance',
    description: 'All real estate transactions are conducted in alignment with applicable UAE property regulations, contract frameworks, and developer compliance standards.',
    accentClass: 'bg-emerald-500/10 text-emerald-700',
  },
  {
    icon: BarChart3,
    title: 'Transparent Advisory',
    description: 'We provide structured market analysis, pricing insights, and investment evaluation within the scope of licensed brokerage activities.',
    accentClass: 'bg-[#C8A766]/15 text-[#C8A766]',
  },
  {
    icon: ShieldCheck,
    title: 'Data Protection Standards',
    description: 'Client data is handled with strict confidentiality, secure storage practices, and controlled access permissions.',
    accentClass: 'bg-slate-500/10 text-slate-700',
  },
  {
    icon: Cpu,
    title: 'AI & Digital Governance',
    description: 'AI-powered tools are deployed responsibly, with safeguards to prevent misuse, misinformation, and unauthorized data storage.',
    accentClass: 'bg-emerald-500/10 text-emerald-700',
  },
  {
    icon: Handshake,
    title: 'Ethical Conduct',
    description: 'Our brokerage practices follow principles of transparency, client-first advisory, and conflict-of-interest mitigation.',
    accentClass: 'bg-slate-500/10 text-slate-700',
  },
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

      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FAF7F2] to-[#F5F0E8]">
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF7F2] via-white/60 to-[#F5F0E8]" />
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C8A766]/10 border border-[#C8A766]/25 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4 text-[#C8A766]" />
              <span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Trust & Compliance</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-zinc-900 mb-4 leading-tight">
              Trust, Compliance & Audit Framework
            </h1>
            <p className="text-lg md:text-xl text-[#C8A766] font-medium mb-6">
              Institutional Standards. Regulated Brokerage. Transparent Operations.
            </p>
            <p className="text-zinc-600 leading-relaxed max-w-3xl mx-auto text-[15px] md:text-base">
              At JBJ Global Real Estate, trust is built through regulatory compliance, operational transparency, data protection, and ethical brokerage standards. This page outlines the internal and external safeguards that support our clients, partners, and investors.
            </p>
            <div className="mt-8 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#C8A766]/50 to-transparent" />
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-6 pb-20">
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

          {/* Footer note */}
          <div className="pt-10 text-center">
            <p className="text-xs text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              This Trust & Audit Framework may be updated periodically to reflect regulatory developments and operational enhancements.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrustAndAuditCenter;
