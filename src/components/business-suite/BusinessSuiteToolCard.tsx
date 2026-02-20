import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface BusinessSuiteToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  colorClass: string;
  borderColorClass: string;
  gradientFrom: string;
  gradientTo: string;
}

const BusinessSuiteToolCard = ({
  icon: Icon,
  title,
  description,
  href,
  colorClass,
  borderColorClass,
  gradientFrom,
  gradientTo,
}: BusinessSuiteToolCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link
        to={href}
        className={`flex flex-col h-full p-5 rounded-2xl bg-white/70 backdrop-blur-sm border-2 ${borderColorClass} hover:border-gold/60 hover:shadow-[0_8px_32px_rgba(200,167,102,0.25)] transition-all duration-300 group`}
      >
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className={`text-base font-bold text-zinc-900 group-hover:text-gold mb-2 transition-colors`}>
          {title}
        </h3>
        <p className="text-sm text-zinc-600 leading-relaxed flex-grow min-h-[60px]">
          {description}
        </p>
        <div className="mt-4 text-sm font-semibold text-gold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          Open Tool →
        </div>
      </Link>
    </motion.div>
  );
};

export default BusinessSuiteToolCard;

