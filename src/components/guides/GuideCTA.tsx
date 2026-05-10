import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LucideIcon, ArrowUpRight, Phone, MessageSquare } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";

interface GuideCTAProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  primaryAction?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
  showContactOptions?: boolean;
  variant?: "default" | "compact" | "full";
}

// Premium 3D Button Component for white backgrounds
const Premium3DButton = ({ 
  children, 
  href, 
  variant = "primary" 
}: { 
  children: React.ReactNode; 
  href: string; 
  variant?: "primary" | "whatsapp" | "call";
}) => {
  const baseClasses = "relative px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] transform active:scale-[0.98] group inline-flex items-center gap-2";
  
  const variantStyles = {
    primary: {
      bg: "bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]",
      text: "text-[#1A1A1A]",
      border: "border-2 border-[#B89555]/50",
      shadow: `0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(200,167,102,0.2), 0 0 20px rgba(200,167,102,0.3)`,
    },
    whatsapp: {
      bg: "bg-[#FDFBF7]",
      text: "text-green-600",
      border: "border-2 border-green-500/50",
      shadow: `0 10px 25px rgba(34,197,94,0.3), 0 6px 15px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.9), 0 0 15px rgba(34,197,94,0.2)`,
    },
    call: {
      bg: "bg-[#FDFBF7]",
      text: "text-[#1A1A1A]",
      border: "border-2 border-[#B89555]/50",
      shadow: `0 10px 25px rgba(200,167,102,0.3), 0 6px 15px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.9), 0 0 15px rgba(200,167,102,0.2)`,
    }
  };

  const style = variantStyles[variant];

  return (
    <a href={href} className={`${baseClasses} ${style.bg} ${style.text} ${style.border}`} style={{ boxShadow: style.shadow }}>
      {/* 3D Top highlight */}
      <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
      {/* 3D Bottom shadow */}
      <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
      {/* Glow effect on hover */}
      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.5), inset 0 0 20px rgba(200,167,102,0.1)' }} />
      <span className="relative flex items-center gap-2">{children}</span>
    </a>
  );
};

export const GuideCTA = ({
  title,
  description,
  icon: Icon,
  primaryAction,
  showContactOptions = true,
  variant = "default"
}: GuideCTAProps) => {
  return (
    <section className="py-16 md:py-20 bg-[#1A1A1A]">
      <div className="container mx-auto px-4">
        <div className="max-w-[1100px] mx-auto">
          {/* OUTER CARD (Active Champagne) */}
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/30 rounded-2xl sm:rounded-3xl p-2 sm:p-3">
            {/* INNER CARD (Pearl) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl sm:rounded-2xl ${variant === "compact" ? "p-6" : "p-8 md:p-12"} shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center`}
            >
              {Icon && (
                <div className="w-16 h-16 bg-[#1A1A1A] border border-[#B89555]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-8 h-8 text-[#1A1A1A]" />
                </div>
              )}
              
              <h3 className={`font-bold text-[#1A1A1A] mb-4 ${
                variant === "compact" ? "text-xl" : "text-2xl md:text-3xl"
              }`}>
                {title}
              </h3>
              
              <p className="text-[#1A1A1A]/70 mb-8 max-w-xl mx-auto">
                {description}
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                {primaryAction && (
                  <a 
                    href={primaryAction.href}
                    className="relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F7F2EA 50%, #E8DFD0 75%, #C8A766 100%)',
                      boxShadow: `
                        0 10px 30px rgba(200,167,102,0.4),
                        0 6px 15px rgba(0,0,0,0.2),
                        inset 0 2px 4px rgba(255,255,255,0.9),
                        inset 0 -2px 4px rgba(200,167,102,0.2),
                        0 0 20px rgba(200,167,102,0.3)
                      `,
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                    <span className="relative flex items-center gap-2">
                      {primaryAction.icon && <primaryAction.icon className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />}
                      <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">{primaryAction.label.split(' ')[0]}</span>
                      <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">{primaryAction.label.split(' ').slice(1).join(' ')}</span>
                      <ArrowUpRight className="w-4 h-4 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
                    </span>
                  </a>
                )}
                
                {showContactOptions && (
                  <>
                    {/* WhatsApp - Secondary Style */}
                    <a 
                      href={getWhatsAppUrl()}
                      className="inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>WhatsApp</span>
                    </a>
                    {/* Call - Secondary Style */}
                    <a 
                      href={getCallUrl()}
                      className="inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
                    >
                      <Phone className="w-5 h-5" />
                      <span>{CONTACT_INFO.phone}</span>
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuideCTA;
