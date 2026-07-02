import { motion } from "framer-motion";
import { LucideIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  items?: string[];
  variant?: "default" | "highlight" | "dark" | "numbered";
  number?: number;
  className?: string;
  children?: React.ReactNode;
}

export const GuideCard = ({
  title,
  description,
  icon: Icon,
  items,
  variant = "default",
  number,
  className,
  children
}: GuideCardProps) => {
  const variants = {
    default: "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 hover:border-[#B89555] hover:shadow-xl hover:shadow-gold/20",
    highlight: "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/40",
    dark: "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 hover:border-[#B89555]",
    numbered: "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 hover:border-[#B89555] hover:shadow-xl hover:shadow-gold/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-2xl border p-6 md:p-8 transition-all duration-300",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start gap-4">
        {number !== undefined && (
          <div className="flex-shrink-0 w-12 h-12 bg-[#1A1A1A] border border-[#B89555] rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-semibold">{number}</span>
          </div>
        )}
        {Icon && !number && (
          <div className="flex-shrink-0 w-12 h-12 bg-[#1A1A1A] border border-[#B89555] rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {Icon && number !== undefined && <Icon className="w-5 h-5 text-white" />}
            <h3 className="text-xl md:text-2xl font-medium text-white">{title}</h3>
          </div>
          {description && (
            <p className="text-white/70 mb-4">{description}</p>
          )}
          {items && items.length > 0 && (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-1" />
                  <span className="text-white/70 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          )}
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default GuideCard;
