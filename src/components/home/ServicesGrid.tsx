/**
 * ServicesGrid Component - Master Blueprint Specification
 * 4-card grid: Buy, Rent, Sell, Management with exact copy
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Key, Target, Wrench, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const services: ServiceCard[] = [
  {
    id: "buy",
    title: "Buy",
    description: "Find the right home with shortlists that match your budget and lifestyle.",
    icon: Home,
    href: "/buyer-guide",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: "rent",
    title: "Rent",
    description: "Fast viewings, clear requirements, and quick move-ins.",
    icon: Key,
    href: "/tenant-guide",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "sell",
    title: "Sell",
    description: "Pricing strategy + premium marketing to maximize your sale.",
    icon: Target,
    href: "/seller-guide",
    color: "from-gold to-amber-600",
  },
  {
    id: "management",
    title: "Management",
    description: "Tenant placement, renewals, maintenance coordination, and reporting.",
    icon: Wrench,
    href: "/landlord-guide",
    color: "from-purple-500 to-purple-600",
  },
];

const ServicesGrid = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-black">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 
            className="text-2xl md:text-3xl font-bold text-black mb-3"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t('services.howCanWeHelp', 'How Can We Help?')}
          </h2>
          <p className="text-zinc-600 text-sm max-w-md mx-auto">
            {t('services.subtitle', 'Whether you\'re buying, selling, renting, or investing—we\'ve got you covered.')}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link to={service.href} className="group block h-full">
                <div className="h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl border-2 border-gold/30 hover:border-gold p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 
                    className="text-xl font-bold text-black mb-3 group-hover:text-gold transition-colors"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
                    {service.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center gap-1.5 text-gold text-sm font-medium group-hover:gap-2.5 transition-all">
                    <span>{t('services.learnMore', 'Learn More')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;
