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
        className={`flex flex-col h-full p-6 rounded-xl bg-zinc-900/80 border ${borderColorClass} hover:border-opacity-60 transition-all duration-300 group`}
      >
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className={`text-lg font-bold ${colorClass} mb-2 group-hover:text-white transition-colors`}>
          {title}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed flex-grow min-h-[60px]">
          {description}
        </p>
        <div className={`mt-4 text-sm font-medium ${colorClass} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1`}>
          Open Tool →
        </div>
      </Link>
    </motion.div>
  );
};

export default BusinessSuiteToolCard;
