import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Building2, TrendingUp, DollarSign, Layers, Target,
  Home, Calculator, Search, Shield, Send, ChevronDown, CheckCircle2,
  ArrowRight, Briefcase
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeadCapture } from '@/hooks/useLeadCapture';
import { toast } from 'sonner';

/* ─── Primitives ─── */
const GoldDivider = () => (
  <div className="flex items-center gap-4 my-12">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/60" />
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
  </div>
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

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 mb-6">{children}</h2>
);

/* ─── Anchor Nav ─── */
const anchors = [
  { id: 'why', label: 'Why It Matters' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'types', label: 'Valuation Types' },
  { id: 'sources', label: 'Data Sources' },
  { id: 'form', label: 'Request Form' },
  { id: 'output', label: 'Sample Output' },
];

/* ─── Comparison Table ─── */
const comparisonRows = [
  { informal: 'Based on listing prices', professional: 'Based on transaction data' },
  { informal: 'Emotional pricing', professional: 'Analytical pricing' },
  { informal: 'No yield modeling', professional: 'ROI & yield analysis' },
  { informal: 'No liquidity insight', professional: 'Market absorption metrics' },
];

/* ─── Methodology Cards ─── */
const methodologies = [
  { letter: 'A', title: 'Comparative Market Analysis (CMA)', items: ['Recent transaction records', 'Price per sqft benchmarking', 'Unit-type comparison'] },
  { letter: 'B', title: 'Income Approach', items: ['Rental yield modeling', 'Gross vs net yield', 'Occupancy stability analysis'] },
  { letter: 'C', title: 'Market Positioning Analysis', items: ['Supply pipeline', 'Upcoming handovers', 'Developer competition'] },
  { letter: 'D', title: 'Liquidity & Absorption', items: ['Average days on market', 'Buyer demand index', 'Investor activity trends'] },
];

/* ─── Service Types ─── */
const serviceTypes = [
  { icon: TrendingUp, title: 'Seller Pricing Strategy', desc: 'Accurate exit pricing with demand positioning.' },
  { icon: Search, title: 'Buyer Acquisition Evaluation', desc: 'Determine fair acquisition value before offer submission.' },
  { icon: Layers, title: 'Portfolio Reassessment', desc: 'Multi-asset valuation review for restructuring or refinancing.' },
  { icon: Target, title: 'Pre-Listing Advisory', desc: 'Optimize asset presentation before listing.' },
  { icon: Calculator, title: 'Mortgage Pre-Assessment Support', desc: 'Prepare valuation alignment for bank financing.' },
];

/* ─── Output Preview ─── */
const outputRows = [
  { label: 'Estimated Market Value Range', value: 'AED X,XXX,XXX – AED X,XXX,XXX' },
  { label: 'Estimated Rental Yield', value: '6.2% – 7.1%' },
  { label: 'Market Liquidity Rating', value: 'High / Moderate / Low' },
  { label: 'Risk Level', value: 'Low / Medium / Elevated' },
];

const RequestValuation = () => {
  const { captureLead } = useLeadCapture();
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    propertyType: '', developer: '', community: '',
    unitSize: '', bedrooms: '', currentStatus: '', purpose: '',
  });

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) { toast.error('Please confirm the information is accurate.'); return; }
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Please fill in all required fields.'); return;
    }
    setIsSubmitting(true);
    try {
      await captureLead({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      }, 'valuation_request');
      toast.success('Valuation request submitted. Our team will be in touch.');
      setForm({ fullName: '', email: '', phone: '', propertyType: '', developer: '', community: '', unitSize: '', bedrooms: '', currentStatus: '', purpose: '' });
      setConfirmed(false);
    } catch { toast.error('Something went wrong. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      <SEOHead
        title="Property Valuation & Strategic Pricing Advisory | JBJ Global Real Estate"
        description="Data-driven real estate valuation for informed decision-making. Professional property assessment using transaction data, comparative analytics, and demand indicators."
        keywords="property valuation dubai, real estate pricing, market analysis, CMA, rental yield, valuation advisory"
        canonicalPath="/sell/valuation"
      />

      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FAF7F2] to-[#F5F0E8]">

        {/* ─── HERO ─── */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF7F2] via-white/60 to-[#F5F0E8]" />
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C8A766]/10 border border-[#C8A766]/25 rounded-full mb-6">
              <BarChart3 className="w-4 h-4 text-[#C8A766]" />
              <span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Valuation Advisory</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-zinc-900 mb-4 leading-tight">
              Property Valuation & Strategic Pricing Advisory
            </h1>
            <p className="text-lg md:text-xl text-[#C8A766] font-medium mb-6">
              Data-Driven Real Estate Valuation for Informed Decision-Making
            </p>
            <p className="text-zinc-600 leading-relaxed max-w-3xl mx-auto text-[15px] md:text-base mb-8">
              Our valuation service provides structured, market-based property assessment using transactional data, comparative analytics, and current demand indicators across Dubai and the UAE. Whether selling, acquiring, or restructuring assets, accurate valuation is the foundation of intelligent real estate strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#form" className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8A766] text-white font-semibold rounded-xl hover:bg-[#b8964f] transition-colors shadow-md">
                Request Valuation <ArrowRight className="w-4 h-4" />
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#C8A766]/30 text-zinc-800 font-semibold rounded-xl hover:border-[#C8A766]/60 transition-colors">
                Schedule Consultation
              </Link>
            </div>
            <div className="mt-8 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#C8A766]/50 to-transparent" />
          </div>
        </section>

        {/* ─── ANCHOR NAV ─── */}
        <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#C8A766]/15 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-6 py-3 min-w-max">
              {anchors.map(a => (
                <a key={a.id} href={`#${a.id}`} className="text-sm text-zinc-500 hover:text-[#C8A766] transition-colors whitespace-nowrap font-medium">
                  {a.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 pb-20">

          {/* ─── WHY VALUATION MATTERS ─── */}
          <section id="why" className="pt-16">
            <SectionHeading>Why Professional Valuation Matters</SectionHeading>
            <div className="text-zinc-700 text-[15px] leading-relaxed space-y-4 mb-10">
              <BulletList items={[
                'Overpricing reduces liquidity and delays transactions',
                'Underpricing causes capital loss',
                'Market cycles directly affect asset positioning',
                'Developer pricing strategies shift by micro-location',
                'Bank mortgage approvals rely on valuation accuracy',
              ]} />
            </div>

            {/* Comparison Table */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                <h3 className="font-serif font-bold text-zinc-400 text-lg mb-4">Informal Estimate</h3>
                {comparisonRows.map((r, i) => (
                  <p key={i} className="text-zinc-500 text-sm py-2 border-b border-zinc-100 last:border-0">{r.informal}</p>
                ))}
              </div>
              <div className="bg-white border-2 border-[#C8A766]/30 rounded-2xl p-6 shadow-sm">
                <h3 className="font-serif font-bold text-[#C8A766] text-lg mb-4">Professional Valuation</h3>
                {comparisonRows.map((r, i) => (
                  <p key={i} className="text-zinc-800 text-sm py-2 border-b border-[#C8A766]/10 last:border-0 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C8A766] mt-0.5 shrink-0" /> {r.professional}
                  </p>
                ))}
              </div>
            </div>
          </section>

          <GoldDivider />

          {/* ─── METHODOLOGY ─── */}
          <section id="methodology">
            <SectionHeading>Our Valuation Methodology</SectionHeading>
            <div className="grid md:grid-cols-2 gap-5">
              {methodologies.map(m => (
                <div key={m.letter} className="bg-white/80 border border-[#C8A766]/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-lg bg-[#C8A766]/15 flex items-center justify-center text-[#C8A766] font-bold text-sm">{m.letter}</span>
                    <h3 className="font-serif font-bold text-zinc-900">{m.title}</h3>
                  </div>
                  <BulletList items={m.items} />
                </div>
              ))}
            </div>
          </section>

          <GoldDivider />

          {/* ─── VALUATION TYPES ─── */}
          <section id="types">
            <SectionHeading>Valuation Types Offered</SectionHeading>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {serviceTypes.map(s => (
                <div key={s.title} className="bg-white/80 border border-[#C8A766]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-[#C8A766]/15 flex items-center justify-center mb-4">
                    <s.icon className="w-5 h-5 text-[#C8A766]" />
                  </div>
                  <h3 className="font-serif font-bold text-zinc-900 mb-2">{s.title}</h3>
                  <p className="text-zinc-600 text-[15px] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <GoldDivider />

          {/* ─── DATA SOURCES ─── */}
          <section id="sources">
            <SectionHeading>Data Sources</SectionHeading>
            <div className="bg-white/80 border border-[#C8A766]/20 rounded-2xl p-6 shadow-sm">
              <p className="text-zinc-700 text-[15px] mb-4">Valuation analysis is based on:</p>
              <BulletList items={[
                'Dubai Land Department transaction data',
                'Market listing analytics',
                'Developer pricing releases',
                'Rental transaction benchmarks',
                'AI-powered demand modeling tools',
              ]} />
            </div>
          </section>

          <GoldDivider />

          {/* ─── FORM ─── */}
          <section id="form">
            <SectionHeading>Request Professional Valuation</SectionHeading>
            <form onSubmit={handleSubmit} className="bg-white/90 border border-[#C8A766]/20 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Full Name *</label>
                  <Input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="Your full name" className="border-[#C8A766]/20 focus:border-[#C8A766]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email *</label>
                  <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="your@email.com" className="border-[#C8A766]/20 focus:border-[#C8A766]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Phone *</label>
                  <Input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+971 XX XXX XXXX" className="border-[#C8A766]/20 focus:border-[#C8A766]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Property Type</label>
                  <Select value={form.propertyType} onValueChange={v => updateField('propertyType', v)}>
                    <SelectTrigger className="border-[#C8A766]/20"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Developer</label>
                  <Input value={form.developer} onChange={e => updateField('developer', e.target.value)} placeholder="e.g. Emaar, DAMAC" className="border-[#C8A766]/20 focus:border-[#C8A766]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Community</label>
                  <Input value={form.community} onChange={e => updateField('community', e.target.value)} placeholder="e.g. Downtown, Marina" className="border-[#C8A766]/20 focus:border-[#C8A766]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Unit Size (sqft)</label>
                  <Input type="number" value={form.unitSize} onChange={e => updateField('unitSize', e.target.value)} placeholder="e.g. 1200" className="border-[#C8A766]/20 focus:border-[#C8A766]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Bedrooms</label>
                  <Select value={form.bedrooms} onValueChange={v => updateField('bedrooms', v)}>
                    <SelectTrigger className="border-[#C8A766]/20"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="1">1 BR</SelectItem>
                      <SelectItem value="2">2 BR</SelectItem>
                      <SelectItem value="3">3 BR</SelectItem>
                      <SelectItem value="4">4 BR</SelectItem>
                      <SelectItem value="5+">5+ BR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Current Status</label>
                  <Select value={form.currentStatus} onValueChange={v => updateField('currentStatus', v)}>
                    <SelectTrigger className="border-[#C8A766]/20"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="tenanted">Tenanted</SelectItem>
                      <SelectItem value="offplan">Off-plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Purpose</label>
                  <Select value={form.purpose} onValueChange={v => updateField('purpose', v)}>
                    <SelectTrigger className="border-[#C8A766]/20"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="refinance">Refinance</SelectItem>
                      <SelectItem value="portfolio">Portfolio Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 accent-[#C8A766]" />
                <span className="text-sm text-zinc-600">I confirm the information provided is accurate.</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#C8A766] text-white font-semibold rounded-xl hover:bg-[#b8964f] transition-colors shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Request Professional Valuation'}
              </button>
            </form>
          </section>

          <GoldDivider />

          {/* ─── OUTPUT PREVIEW ─── */}
          <section id="output">
            <SectionHeading>Premium Analytical Output Preview</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-5">
              {outputRows.map(r => (
                <div key={r.label} className="bg-white/80 border border-[#C8A766]/20 rounded-2xl p-6 shadow-sm text-center">
                  <p className="text-sm text-zinc-500 mb-2">{r.label}</p>
                  <p className="text-xl font-serif font-bold text-zinc-900">{r.value}</p>
                </div>
              ))}
            </div>
          </section>

          <GoldDivider />

          {/* ─── STRATEGIC INSIGHT ─── */}
          <section>
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white border border-[#C8A766]/20 rounded-2xl p-8 text-center shadow-sm">
              <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-4">Strategic Pricing Insight</h2>
              <p className="text-zinc-600 leading-relaxed max-w-2xl mx-auto text-[15px]">
                Pricing is not simply about numbers — it is about positioning within active market demand. Strategic valuation increases liquidity, enhances negotiation strength, and protects long-term capital appreciation.
              </p>
            </div>
          </section>

          {/* ─── COMPLIANCE NOTE ─── */}
          <div className="mt-8 bg-[#C8A766]/5 border border-[#C8A766]/15 rounded-xl p-5">
            <p className="text-sm text-zinc-500 leading-relaxed flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#C8A766] shrink-0 mt-0.5" />
              Valuation services are conducted within the scope of licensed brokerage advisory and do not constitute certified bank appraisal unless specifically requested through authorized partners.
            </p>
          </div>

          <GoldDivider />

          {/* ─── FINAL CTA ─── */}
          <section className="text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 mb-4">
              Position Your Asset With Precision
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#form" className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8A766] text-white font-semibold rounded-xl hover:bg-[#b8964f] transition-colors shadow-md">
                Request Valuation Now <ArrowRight className="w-4 h-4" />
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#C8A766]/30 text-zinc-800 font-semibold rounded-xl hover:border-[#C8A766]/60 transition-colors">
                <Briefcase className="w-4 h-4" /> Speak to an Advisor
              </Link>
            </div>
          </section>

          {/* Footer note */}
          <div className="pt-10 text-center">
            <p className="text-xs text-zinc-400">
              This page may be updated periodically to reflect market developments.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestValuation;
