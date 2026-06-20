import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IconTile } from "@/components/ui/icon-tile";

interface BusinessSuiteToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  // Legacy props kept for backwards compatibility but ignored.
  colorClass?: string;
  borderColorClass?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

const BusinessSuiteToolCard = ({
  icon: Icon,
  title,
  description,
  href,
}: BusinessSuiteToolCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link
        to={href}
        className="flex flex-col h-full p-5 rounded-2xl bg-[#FDFBF7] border border-[#B89555]/30 hover:border-[#B89555]/70 hover:shadow-[0_8px_32px_rgba(184,149,85,0.18)] transition-all duration-300 group"
      >
        <IconTile icon={Icon} tone="gold" size="lg" className="mb-4" />
        <h3 className="text-base font-bold text-[#1A1A1A] mb-2">
          {title}
        </h3>
        <p className="text-sm text-[#1A1A1A]/70 leading-relaxed flex-grow min-h-[60px]">
          {description}
        </p>
        <div className="mt-4 text-sm font-semibold text-[#1A1A1A] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          Open Tool →
        </div>
      </Link>
    </motion.div>
  );
};

export default BusinessSuiteToolCard;
