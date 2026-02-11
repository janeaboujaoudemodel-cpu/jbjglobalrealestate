/**
 * WhyChooseUs Component - Master Blueprint Specification
 * Premium 3x2 grid of value propositions with proper bottom padding
 */

import { motion } from "framer-motion";
import { Check, TrendingUp, Camera, MessageSquare, Network, Headphones, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ValueProp {
  icon: React.ElementType;
  title: string;
  text: string;
}

const WhyChooseUs = () => {
  const { t } = useLanguage();

  const valueProps: ValueProp[] = [
    {
      icon: TrendingUp,
      title: t('whyUs.marketIntelligence', 'Market Intelligence'),
      text: t('whyUs.marketPricing', 'Market pricing guidance backed by recent comparables'),
    },
    {
      icon: Camera,
      title: t('whyUs.premiumPresentation', 'Premium Presentation'),
      text: t('whyUs.photography', 'High-quality photography and listing presentation'),
    },
    {
      icon: MessageSquare,
      title: t('whyUs.clearCommunication', 'Clear Communication'),
      text: t('whyUs.communication', 'Clear communication at every step'),
    },
    {
      icon: Network,
      title: t('whyUs.exclusiveNetwork', 'Exclusive Network'),
      text: t('whyUs.network', 'Strong network for off-market opportunities'),
    },
    {
      icon: Headphones,
      title: t('whyUs.prioritySupport', 'Priority Support'),
      text: t('whyUs.prioritySupportDesc', 'Dedicated support team available for all your needs'),
    },
    {
      icon: Award,
      title: t('whyUs.loyaltyProgram', 'Loyalty Program'),
      text: t('whyUs.loyaltyProgramDesc', 'Exclusive benefits and rewards for returning clients'),
    },
  ];

  return (
    <section className="bg-black">
      <div className="jj-layer-2">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
              <Award className="w-3.5 h-3.5 text-gold" />
              <span className="text-black">{t('whyUs.ourCommitment', 'Our Commitment')}</span>
            </span>
            <h2 
              className="text-2xl md:text-3xl font-bold text-black mb-3"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t('whyUs.title', 'Why Choose Us')}
            </h2>
            <p className="text-zinc-600 text-sm max-w-md mx-auto">
              {t('whyUs.subtitle', 'We focus on what matters most—getting you results.')}
            </p>
          </div>

          {/* Value Props Grid - 3x2 with bottom padding */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {valueProps.map((prop, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group relative p-6 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl border-2 border-gold/20 hover:border-gold/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <prop.icon className="w-6 h-6 text-gold" />
                </div>

                {/* Title */}
                <h3 className="text-black font-bold text-base mb-2 group-hover:text-gold transition-colors" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {prop.title}
                </h3>

                {/* Text */}
                <p className="text-zinc-600 text-sm leading-relaxed">
                  {prop.text}
                </p>

                {/* Included badge */}
                <div className="flex items-center gap-1.5 mt-4">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-xs uppercase tracking-wider text-green-600 font-semibold">
                    {t('whyUs.included', 'Included')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
