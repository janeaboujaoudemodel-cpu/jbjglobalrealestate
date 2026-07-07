import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Scale, 
  Coins, 
  Users, 
  Handshake, 
  Wrench, 
  BarChart3, 
  Calculator,
  ArrowUpRight
} from "lucide-react";

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  available: boolean;
  color: string;
}

const additionalServices: ServiceCard[] = [
  {
    id: "evaluation",
    title: "Get Property Evaluation",
    description: "AI-powered property valuation tool",
    icon: Calculator,
    href: "/property-evaluator",
    available: true,
    color: " "
  },
  {
    id: "legal",
    title: "Legal & Law Firm Services",
    description: "Connect with trusted legal partners",
    icon: Scale,
    href: "/services/legal",
    available: false,
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "exchange",
    title: "Money Exchange",
    description: "Currency exchange for property transactions",
    icon: Coins,
    href: "/services/exchange",
    available: false,
    color: "from-gold to-gold"
  },
  {
    id: "investor-onboarding",
    title: "Investor Onboarding",
    description: "Start your investment journey with us",
    icon: Users,
    href: "/investor-onboarding",
    available: false,
    color: "from-cyan-500 to-cyan-600"
  },
  {
    id: "partner",
    title: "Partner Introduction",
    description: "Connect with our network of partners",
    icon: Handshake,
    href: "/partners",
    available: true,
    color: "from-rose-500 to-rose-600"
  },
  {
    id: "facility",
    title: "Facility Management",
    description: "Property maintenance and management services",
    icon: Wrench,
    href: "/services/facility-management",
    available: false,
    color: "from-orange-500 to-orange-600"
  }
];

const AdditionalServicesGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {additionalServices.map((service, index) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          {service.available ? (
            <Link to={service.href} className="group block h-full">
              <div className="h-full bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-xl border-2 border-[#B89555]/30 hover:border-[#B89555] p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold text-[#1A1A1A] mb-2 group-hover:text-[#1A1A1A] transition-colors">
                  {service.title}
                </h4>
                <p className="text-sm text-[#1A1A1A]/70 mb-3">
                  {service.description}
                </p>
                <div className="flex items-center gap-1 text-[#1A1A1A] text-sm font-medium">
                  <span>Learn More</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="h-full bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-xl border-2 border-[#B89555]/50 p-5 opacity-75">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 shadow-lg opacity-50`}>
                <service.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-[#1A1A1A] mb-2">
                {service.title}
              </h4>
              <p className="text-sm text-[#1A1A1A]/70 mb-3">
                {service.description}
              </p>
              <span className="text-xs text-[#1A1A1A]/70 font-medium uppercase tracking-wide">
                Coming Soon
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default AdditionalServicesGrid;
