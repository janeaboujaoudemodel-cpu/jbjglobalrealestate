import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "light" | "dark" | "gradient";
  className?: string;
  children: React.ReactNode;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export const GuideSection = ({
  id,
  title,
  subtitle,
  icon: Icon,
  variant = "dark",
  className,
  children
}: GuideSectionProps) => {
  const backgrounds = {
    light: "bg-[#F7F2EA] text-[#1A1A1A]",
    dark: "bg-[#1A1A1A] text-white",
    gradient: "bg-gradient-to-b from-zinc-900/30 to-black text-white"
  };

  return (
    <section 
      id={id}
      className={cn(
        "py-16 md:py-24 scroll-mt-24",
        backgrounds[variant],
        className
      )}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            {Icon && (
              <div className="w-14 h-14 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-[#1A1A1A]" />
              </div>
            )}
            <h2 className={cn(
              "text-3xl md:text-4xl font-light mb-4",
              variant === "light" ? "text-[#1A1A1A]" : "text-white"
            )}>
              {title}
            </h2>
            {subtitle && (
              <p className={cn(
                "text-lg max-w-2xl mx-auto",
                variant === "light" ? "text-[#1A1A1A]/70" : "text-white/70"
              )}>
                {subtitle}
              </p>
            )}
          </motion.div>
          
          {/* Section Content */}
          <div>
            {children}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GuideSection;
