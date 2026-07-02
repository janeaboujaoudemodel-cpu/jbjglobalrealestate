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
    dark: "bg-[#1A1A1A] border-[#B89555]/30 hover:border-[#B89555] shadow-xl",
    numbered: "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 hover:border-[#B89555] hover:shadow-xl hover:shadow-gold/20"
  };

  const isDark = variant === "dark";
  const textColor = isDark ? "text-white" : "text-[#1A1A1A]";
  const mutedTextColor = isDark ? "text-white/70" : "text-[#1A1A1A]/70";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-2xl border p-6 md:p-8 transition-all duration-300 h-full",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start gap-4 h-full">
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
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            {Icon && number !== undefined && <Icon className={cn("w-5 h-5", isDark ? "text-white" : "text-[#1A1A1A]")} />}
            <h3 className={cn("text-xl md:text-2xl font-medium", textColor)}>{title}</h3>
          </div>
          {description && (
            <p className={cn("mb-4", mutedTextColor)}>{description}</p>
          )}
          {items && items.length > 0 && (
            <ul className="space-y-2 mb-4">
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className={cn("w-4 h-4 flex-shrink-0 mt-1", isDark ? "text-gold" : "text-[#1A1A1A]")} />
                  <span className={cn("text-sm", mutedTextColor)}>{item}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GuideCard;
