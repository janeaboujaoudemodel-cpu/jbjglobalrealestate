import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, TrendingUp, DollarSign, Layers, Target,
  Calculator, Search, Shield, Send, CheckCircle2,
  ArrowRight, Briefcase, Sparkles, Database, FileBarChart, Building,
  Coins, Activity, Info,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeadCapture } from '@/hooks/useLeadCapture';
import { toast } from 'sonner';
import { ToolHero } from '@/components/tools/ToolHero';
import { toolThemes, TOOL_GOLD, TOOL_PAGE_BG } from '@/components/tools/toolThemes';

/* ── Brand ink tokens (clean black, no blue tint) ── */
const NAVY = '#0A0A0A';
const NAVY_DEEP = '#1F1F1F';
const NAVY_BORDER = 'rgba(10,10,10,0.45)';

/* ── Section header (blue band with white content) ── */
const SectionHeader = ({
  icon: Icon,
  eyebrow,
  title,
}: { icon: any; eyebrow: string; title: string }) => (
  <div
    className="rounded-2xl px-6 py-5 mb-6 flex items-center gap-4"
    style={{
      background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
      border: `1px solid ${TOOL_GOLD}55`,
    }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${TOOL_GOLD}66` }}
    >
      <Icon className="w-5 h-5" style={{ color: TOOL_GOLD }} />
    </div>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TOOL_GOLD }}>
        {eyebrow}
      </p>
      <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{title}</h2>
    </div>
  </div>
);

/* ── Blue card (white content) ── */
const BlueCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl p-5 md:p-6 ${className}`}
    style={{
      background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
      border: `1px solid ${TOOL_GOLD}40`,
      boxShadow: '0 10px 30px -18px rgba(0,0,0,0.35)',
    }}
  >
    {children}
  </div>
);

/* ── Champagne card (ink content) — used for the form & strategic insight ── */
const ChampagneCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl p-5 md:p-7 ${className}`}
    style={{
      background: '#F7F2EA',
      border: `1px solid ${TOOL_GOLD}55`,
      boxShadow: '0 10px 30px -18px rgba(0,0,0,0.15)',
    }}
  >
    {children}
  </div>
);

/* ── Methodology cards ── */
const methodologies = [
  { icon: BarChart3, title: 'Comparative Market Analysis', desc: 'Transaction records, price-per-sqft benchmarking and unit-type comparison.' },
  { icon: Coins, title: 'Income Approach', desc: 'Rental-yield modelling, gross vs net yield and occupancy stability.' },
  { icon: Building, title: 'Market Positioning', desc: 'Supply pipeline, upcoming handovers and developer competition.' },
  { icon: Activity, title: 'Liquidity & Absorption', desc: 'Days on market, buyer demand index and investor activity.' },
];

/* ── Valuation types ── */
const serviceTypes = [
  { icon: TrendingUp, title: 'Seller Pricing Strategy', desc: 'Accurate exit pricing with demand positioning.' },
  { icon: Search, title: 'Buyer Acquisition Eval.', desc: 'Fair acquisition value before offer submission.' },
  { icon: Layers, title: 'Portfolio Reassessment', desc: 'Multi-asset review for restructuring or refinancing.' },
  { icon: Target, title: 'Pre-Listing Advisory', desc: 'Optimise asset presentation before listing.' },
  { icon: Calculator, title: 'Mortgage Pre-Assessment', desc: 'Align valuation for bank financing.' },
];

/* ── Data sources ── */
const dataSources = [
  'Dubai Land Department transaction data',
  'RERA Rental Index benchmarks',
  'Developer pricing releases',
  'Live market listing analytics',
  'AI-powered demand modelling',
];

/* ── Output preview ── */
const outputRows = [
  { icon: DollarSign, label: 'Estimated Market Value', value: 'AED X.XM – X.XM' },
  { icon: TrendingUp, label: 'Estimated Rental Yield', value: '6.2% – 7.1%' },
  { icon: Activity, label: 'Liquidity Rating', value: 'High / Moderate / Low' },
  { icon: Shield, label: 'Risk Level', value: 'Low / Medium / Elevated' },
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
        description="Data-driven real estate valuation: DLD transactions, RERA Rental Index, comparative analytics and demand indicators."
        keywords="property valuation dubai, real estate pricing, market analysis, CMA, rental yield, valuation advisory"
        canonicalPath="/sell/valuation"
      />

      <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
        {/* ── Premium navy hero ── */}
        <ToolHero
          theme={toolThemes.emerald}
          eyebrowIcon={Sparkles}
          eyebrow="Valuation Advisory"
          title={
            <>
              Property Valuation &{' '}
              <span style={{ color: TOOL_GOLD }}>Strategic Pricing</span>
            </>
          }
          subtitle="Structured, transaction-grade property assessment across Dubai and the UAE — for sellers, buyers and portfolio holders."
        >
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#form"
              data-allow-dark-cta
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{
                background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 60%, #000 100%)`,
                border: `1px solid ${TOOL_GOLD}`,
              }}
            >
              Request Valuation <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/property-evaluator"
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: `1px solid ${TOOL_GOLD}`,
              }}
            >
              <Calculator className="w-4 h-4" style={{ color: TOOL_GOLD }} /> Try Instant Evaluator
            </Link>
          </div>
        </ToolHero>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">

          {/* ── WHY IT MATTERS ── */}
          <section id="why">
            <SectionHeader icon={Info} eyebrow="01 · Foundations" title="Why Professional Valuation Matters" />
            <div className="grid md:grid-cols-2 gap-4">
              <ChampagneCard>
                <h3 className="font-bold text-[#1A1A1A] mb-3 text-base">Informal Estimate</h3>
                <ul className="space-y-2 text-sm text-[#1A1A1A]/75">
                  <li>Based on listing prices</li>
                  <li>Emotional pricing</li>
                  <li>No yield modelling</li>
                  <li>No liquidity insight</li>
                </ul>
              </ChampagneCard>
              <BlueCard>
                <h3 className="font-bold text-white mb-3 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: TOOL_GOLD }} /> Professional Valuation
                </h3>
                <ul className="space-y-2 text-sm text-white/85">
                  {['Based on transaction data', 'Analytical pricing', 'ROI & yield analysis', 'Market absorption metrics'].map(t => (
                    <li key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: TOOL_GOLD }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </BlueCard>
            </div>
          </section>

          {/* ── METHODOLOGY ── */}
          <section id="methodology">
            <SectionHeader icon={FileBarChart} eyebrow="02 · Methodology" title="Our Valuation Methodology" />
            <div className="grid sm:grid-cols-2 gap-4">
              {methodologies.map(m => (
                <BlueCard key={m.title}>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${TOOL_GOLD}55` }}
                    >
                      <m.icon className="w-5 h-5" style={{ color: TOOL_GOLD }} />
                    </div>
                    <h3 className="font-bold text-white text-[15px]">{m.title}</h3>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{m.desc}</p>
                </BlueCard>
              ))}
            </div>
          </section>

          {/* ── VALUATION TYPES ── */}
          <section id="types">
            <SectionHeader icon={Layers} eyebrow="03 · Coverage" title="Valuation Types Offered" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceTypes.map(s => (
                <ChampagneCard key={s.title} className="hover:shadow-md transition-shadow">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: `${NAVY}12`, border: `1px solid ${NAVY_BORDER}` }}
                  >
                    <s.icon className="w-5 h-5" style={{ color: NAVY }} />
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] mb-1.5 text-[15px]">{s.title}</h3>
                  <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">{s.desc}</p>
                </ChampagneCard>
              ))}
            </div>
          </section>

          {/* ── DATA SOURCES (blue card, white content) ── */}
          <section id="sources">
            <SectionHeader icon={Database} eyebrow="04 · Inputs" title="Data Sources" />
            <BlueCard>
              <p className="text-sm text-white/80 mb-4">Every valuation is constructed from authenticated, institutional inputs:</p>
              <div className="grid sm:grid-cols-2 gap-2.5" data-no-contrast-guard>
                {dataSources.map(src => (
                  <div
                    key={src}
                    data-allow-dark-cta
                    data-no-contrast-guard
                    className="allow-white flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.10)', border: `1px solid ${TOOL_GOLD}66` }}
                  >
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: TOOL_GOLD }} />
                    <span className="text-sm text-white">{src}</span>
                  </div>
                ))}
              </div>
            </BlueCard>
          </section>

          {/* ── REQUEST FORM (champagne) ── */}
          <section id="form">
            <SectionHeader icon={Send} eyebrow="05 · Request" title="Request Professional Valuation" />
            <ChampagneCard>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Full Name *</label>
                    <Input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="Your full name" className="border-[#B89555]/30 focus:border-[#B89555]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Email *</label>
                    <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="your@email.com" className="border-[#B89555]/30 focus:border-[#B89555]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Phone *</label>
                    <Input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+971 XX XXX XXXX" className="border-[#B89555]/30 focus:border-[#B89555]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Property Type</label>
                    <Select value={form.propertyType} onValueChange={v => updateField('propertyType', v)}>
                      <SelectTrigger className="border-[#B89555]/30"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Developer</label>
                    <Input value={form.developer} onChange={e => updateField('developer', e.target.value)} placeholder="e.g. Emaar, DAMAC" className="border-[#B89555]/30 focus:border-[#B89555]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Community</label>
                    <Input value={form.community} onChange={e => updateField('community', e.target.value)} placeholder="e.g. Downtown, Marina" className="border-[#B89555]/30 focus:border-[#B89555]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Unit Size (sqft)</label>
                    <Input type="number" value={form.unitSize} onChange={e => updateField('unitSize', e.target.value)} placeholder="e.g. 1200" className="border-[#B89555]/30 focus:border-[#B89555]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Bedrooms</label>
                    <Select value={form.bedrooms} onValueChange={v => updateField('bedrooms', v)}>
                      <SelectTrigger className="border-[#B89555]/30"><SelectValue placeholder="Select" /></SelectTrigger>
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
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Current Status</label>
                    <Select value={form.currentStatus} onValueChange={v => updateField('currentStatus', v)}>
                      <SelectTrigger className="border-[#B89555]/30"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vacant">Vacant</SelectItem>
                        <SelectItem value="tenanted">Tenanted</SelectItem>
                        <SelectItem value="offplan">Off-plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A]/75 mb-1.5 uppercase tracking-wide">Purpose</label>
                    <Select value={form.purpose} onValueChange={v => updateField('purpose', v)}>
                      <SelectTrigger className="border-[#B89555]/30"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="refinance">Refinance</SelectItem>
                        <SelectItem value="portfolio">Portfolio Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-1">
                  <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 accent-[#B89555]" />
                  <span className="text-sm text-[#1A1A1A]/75">I confirm the information provided is accurate.</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-allow-dark-cta
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 60%, #000 100%)`,
                    border: `1px solid ${TOOL_GOLD}`,
                  }}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Request Professional Valuation'}
                </button>
              </form>
            </ChampagneCard>
          </section>

          {/* ── ANALYTICAL OUTPUT PREVIEW (upgraded) ── */}
          <section id="output">
            <SectionHeader icon={BarChart3} eyebrow="06 · Deliverable" title="Premium Analytical Output Preview" />
            <BlueCard>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {outputRows.map(r => (
                  <div
                    key={r.label}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${TOOL_GOLD}40` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <r.icon className="w-4 h-4" style={{ color: TOOL_GOLD }} />
                      <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">{r.label}</p>
                    </div>
                    <p className="text-base font-bold text-white">{r.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 flex items-start gap-3" style={{ borderTop: `1px solid ${TOOL_GOLD}33` }}>
                <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: TOOL_GOLD }} />
                <p className="text-xs text-white/75 leading-relaxed">
                  Delivered as a structured PDF including comparable transactions, yield modelling and
                  positioning notes — typically within 48 business hours.
                </p>
              </div>
            </BlueCard>
          </section>

          {/* ── STRATEGIC INSIGHT + COMPLIANCE ── */}
          <section className="grid md:grid-cols-3 gap-4">
            <ChampagneCard className="md:col-span-2">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Strategic Pricing Insight</h3>
              <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                Pricing is not simply about numbers — it is about positioning within active market demand.
                Strategic valuation increases liquidity, sharpens negotiation and protects long-term capital appreciation.
              </p>
            </ChampagneCard>
            <ChampagneCard>
              <div className="flex items-start gap-2.5">
                <Shield className="w-5 h-5 shrink-0 mt-0.5" style={{ color: NAVY }} />
                <p className="text-xs text-[#1A1A1A]/75 leading-relaxed">
                  Conducted within licensed brokerage advisory scope. Not a certified bank appraisal unless
                  requested via authorised partners.
                </p>
              </div>
            </ChampagneCard>
          </section>

          {/* ── FINAL CTA ── */}
          <section className="text-center pt-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-4">
              Position your asset with precision.
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#form"
                data-allow-dark-cta
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 60%, #000 100%)`,
                  border: `1px solid ${TOOL_GOLD}`,
                }}
              >
                Request Valuation Now <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#1A1A1A] transition-colors"
                style={{
                  background: '#F7F2EA',
                  border: `1px solid ${TOOL_GOLD}55`,
                }}
              >
                <Briefcase className="w-4 h-4" /> Speak to an Advisor
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default RequestValuation;
