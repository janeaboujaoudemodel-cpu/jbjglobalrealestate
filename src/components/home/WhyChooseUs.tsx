/**
 * WhyChooseUs Component - Master Blueprint Specification
 * Bullet list of value propositions
 */

import { motion } from "framer-motion";
import { Check, TrendingUp, Camera, MessageSquare, Network } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ValueProp {
  icon: React.ElementType;
  text: string;
}

const WhyChooseUs = () => {
  const { t } = useLanguage();

  const valueProps: ValueProp[] = [
    {
      icon: TrendingUp,
      text: t('whyUs.marketPricing', 'Market pricing guidance backed by recent comparables'),
    },
    {
      icon: Camera,
      text: t('whyUs.photography', 'High-quality photography and listing presentation'),
    },
    {
      icon: MessageSquare,
      text: t('whyUs.communication', 'Clear communication at every step'),
    },
    {
      icon: Network,
      text: t('whyUs.network', 'Strong network for off-market opportunities'),
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-black">
      <div className="jj-layer-2">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
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

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {valueProps.map((prop, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-start gap-4 p-5 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl border-2 border-gold/20 hover:border-gold/40 transition-colors"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                  <prop.icon className="w-5 h-5 text-gold" />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-xs uppercase tracking-wider text-green-600 font-semibold">
                      {t('whyUs.included', 'Included')}
                    </span>
                  </div>
                  <p className="text-black text-sm font-medium leading-relaxed">
                    {prop.text}
                  </p>
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
