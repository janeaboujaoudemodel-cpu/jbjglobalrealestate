/**
 * WhyChooseUs Component
 * Premium 3x2 grid of value propositions — monochrome
 */

import { Check, TrendingUp, Camera, MessageSquare, Network, Headphones, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

interface ValueProp {
  icon: React.ElementType;
  title: string;
  text: string;
}

const WhyChooseUs = () => {
  const { t } = useLanguage();

  const valueProps: ValueProp[] = [
    { icon: TrendingUp, title: t('whyUs.marketIntelligence', 'Market Intelligence'), text: t('whyUs.marketPricing', 'Market pricing guidance backed by recent comparables') },
    { icon: Camera, title: t('whyUs.premiumPresentation', 'Premium Presentation'), text: t('whyUs.photography', 'High-quality photography and listing presentation') },
    { icon: MessageSquare, title: t('whyUs.clearCommunication', 'Clear Communication'), text: t('whyUs.communication', 'Clear communication at every step') },
    { icon: Network, title: t('whyUs.exclusiveNetwork', 'Exclusive Network'), text: t('whyUs.network', 'Strong network for off-market opportunities') },
    { icon: Headphones, title: t('whyUs.prioritySupport', 'Priority Support'), text: t('whyUs.prioritySupportDesc', 'Dedicated support team available for all your needs') },
    { icon: Award, title: t('whyUs.loyaltyProgram', 'Loyalty Program'), text: t('whyUs.loyaltyProgramDesc', 'Exclusive benefits and rewards for returning clients') },
  ];

  return (
    <section className="bg-[#FDFBF7]">
      <div className="jj-layer-2">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <SectionEyebrow icon={Award} className="mb-4">{t('whyUs.ourCommitment', 'Our Commitment')}</SectionEyebrow>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-3">
              {t('whyUs.title', 'Why Choose Us')}
            </h2>
            <p className="text-[#1A1A1A]/70 text-sm max-w-md mx-auto">
              {t('whyUs.subtitle', 'We focus on what matters most—getting you results.')}
            </p>
          </div>

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {valueProps.map((prop, index) => (
              <div
                key={index}
                className="group relative p-6 bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 hover:border-[#B89555]/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up shadow-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#EFE6D6] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <prop.icon className="w-6 h-6 text-[#1A1A1A]/70" />
                </div>
                <h3 className="text-[#1A1A1A] font-bold text-base mb-2 group-hover:text-[#1A1A1A] transition-colors">
                  {prop.title}
                </h3>
                <p className="text-[#1A1A1A]/70 text-sm leading-relaxed">{prop.text}</p>
                <div className="flex items-center gap-1.5 mt-4">
                  <Check className="w-4 h-4 text-[color:var(--emerald-1)]" />
                  <span className="text-xs uppercase tracking-wider text-[color:var(--emerald-1)] font-semibold">
                    {t('whyUs.included', 'Included')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
