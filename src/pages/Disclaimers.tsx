import React, { useState } from 'react';
import { Building2, Scale, BarChart3, Globe, Cpu, ExternalLink, ShieldCheck, UserCheck, Landmark, ChevronDown } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-10">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/60" />
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
  </div>
);

interface SectionProps { icon: React.ElementType; number: string; title: string; children: React.ReactNode; }

const Section = ({ icon: Icon, number, title, children }: SectionProps) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-[#C8A766]/5 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-[#C8A766]/20 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#C8A766]" /></div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Section {number}</span>
          <h2 className="text-lg md:text-xl font-serif font-bold text-black mt-0.5">{title}</h2>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#C8A766]/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (<div className="px-6 pb-6 text-zinc-700 leading-relaxed text-[15px] space-y-4 border-t border-[#C8A766]/20 pt-5">{children}</div>)}
    </div>
  );
};

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2.5 ml-1">
    {items.map((item, i) => (<li key={i} className="flex items-start gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#C8A766] mt-2 shrink-0" /><span>{item}</span></li>))}
  </ul>
);

const Disclaimers = () => {
  return (
    <>
      <SEOHead title="Disclaimer & Professional Scope | JBJ Global Real Estate" description="Licensed real estate brokerage transparency — professional scope, regulatory clarifications, and user responsibilities." canonicalPath="/disclaimers" />

      <div className="min-h-screen bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C8A766]/10 border border-[#C8A766]/25 rounded-full mb-6">
              <Scale className="w-4 h-4 text-[#C8A766]" />
              <span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Legal Transparency</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">Disclaimer & Professional Scope</h1>
            <p className="text-lg md:text-xl text-[#C8A766] font-medium mb-6">Licensed Real Estate Brokerage Transparency</p>
            <p className="text-zinc-400 leading-relaxed max-w-3xl mx-auto text-[15px] md:text-base">JBJ Global Real Estate operates as a licensed real estate brokerage within the United Arab Emirates. This page outlines the professional scope of services, regulatory clarifications, and user responsibilities associated with our platform and advisory services.</p>
            <div className="mt-8 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#C8A766]/50 to-transparent" />
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 pb-20 pt-12 space-y-5">
          <Section icon={Building2} number="01" title="Licensed Brokerage Scope">
            <p>JBJ Global Real Estate is authorized to conduct the following activities under its UAE commercial license:</p>
            <BulletList items={["Buying and selling real estate","Leasing and rental brokerage","Property acquisition advisory","Real estate investment analysis within brokerage scope","Market research and pricing analysis","Developer project consulting","Portfolio advisory related to property assets"]} />
            <p>All advisory services provided relate strictly to property and real estate transactions within the framework of applicable UAE regulations.</p>
            <p className="text-zinc-800 font-medium">We are legally permitted to provide real estate investment advisory as part of licensed brokerage services.</p>
          </Section>
          <Section icon={Scale} number="02" title="Scope Boundaries">
            <p>JBJ Global Real Estate does not provide:</p>
            <BulletList items={["Legal representation services","Immigration law representation","Certified tax consultancy","Corporate structuring advice","Independent financial planning outside property scope"]} />
            <p>Where required, clients may engage licensed legal advisors, tax consultants, or government-approved entities for specialized services.</p>
            <p>This clarification ensures regulatory alignment and protects both parties.</p>
          </Section>
          <GoldDivider />
          <Section icon={BarChart3} number="03" title="Data & Market Information">
            <p>Property pricing, availability, rental yield projections, and investment analytics are based on:</p>
            <BulletList items={["Developer data","Market statistics","Government publications","Internal analytical tools"]} />
            <p>While reasonable care is taken to ensure accuracy:</p>
            <BulletList items={["Prices may change without notice","Availability may vary","Market conditions fluctuate","Projected returns are not guaranteed outcomes"]} />
            <p>All investment decisions should be supported by independent due diligence.</p>
          </Section>
          <Section icon={Globe} number="04" title="Residency & Golden Visa Information">
            <p>Information provided regarding UAE Golden Visa or residency eligibility is based on publicly available government guidelines.</p>
            <p>Final approval, eligibility, and processing decisions remain exclusively under the authority of relevant UAE government entities.</p>
            <p className="text-zinc-800 font-medium">JBJ Global Real Estate does not issue visas nor guarantee residency approval.</p>
          </Section>
          <GoldDivider />
          <Section icon={Cpu} number="05" title="Digital & AI Advisory Tools">
            <p>AI-powered tools provided on this platform offer analytical insights, forecasts, and data modeling for real estate evaluation.</p>
            <p>These tools:</p>
            <BulletList items={["Provide predictive insights","Do not guarantee investment outcomes","Support decision-making","Do not replace professional consultation"]} />
            <p>Users are responsible for validating outputs before executing financial commitments.</p>
          </Section>
          <Section icon={ExternalLink} number="06" title="External Platforms & References">
            <p>The platform may reference third-party data sources, developers, or external property platforms.</p>
            <p>JBJ Global Real Estate is not responsible for:</p>
            <BulletList items={["Third-party platform content","External website policies","Developer operational decisions","Construction delays","Changes in external terms"]} />
            <p>Users interacting with third-party platforms do so under their respective policies.</p>
          </Section>
          <GoldDivider />
          <Section icon={ShieldCheck} number="07" title="Liability Clarification">
            <p>JBJ Global Real Estate shall not be held liable for:</p>
            <BulletList items={["Market fluctuations","Developer timeline changes","Investment performance outcomes","Financing approvals","Government processing delays"]} />
            <p>Real estate transactions inherently carry market risks.</p>
          </Section>
          <Section icon={UserCheck} number="08" title="Client Responsibility">
            <p>By using this platform, users acknowledge:</p>
            <BulletList items={["Responsibility for independent verification","Understanding of market risk","Acceptance of advisory nature of projections","Commitment to due diligence"]} />
          </Section>
          <Section icon={Landmark} number="09" title="Regulatory Position">
            <p>JBJ Global Real Estate operates in compliance with UAE real estate regulations and conducts brokerage activities within licensed scope.</p>
            <p>This disclaimer ensures transparency and regulatory clarity.</p>
          </Section>
          <div className="pt-8 text-center">
            <p className="text-xs text-zinc-500 max-w-2xl mx-auto leading-relaxed">This Disclaimer may be updated periodically to reflect regulatory developments and operational changes.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Disclaimers;