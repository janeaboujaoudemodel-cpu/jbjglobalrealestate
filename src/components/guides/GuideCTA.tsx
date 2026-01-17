import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LucideIcon, ArrowRight, Phone, MessageSquare } from "lucide-react";
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

export const GuideCTA = ({
  title,
  description,
  icon: Icon,
  primaryAction,
  showContactOptions = true,
  variant = "default"
}: GuideCTAProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl ${
        variant === "compact" ? "p-6" : "p-8 md:p-12"
      } text-center`}
    >
      {Icon && (
        <div className="w-16 h-16 bg-gold/20 border border-gold/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon className="w-8 h-8 text-gold" />
        </div>
      )}
      
      <h3 className={`font-bold text-white mb-4 ${
        variant === "compact" ? "text-xl" : "text-2xl md:text-3xl"
      }`}>
        {title}
      </h3>
      
      <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
        {description}
      </p>
      
      <div className="flex flex-wrap justify-center gap-4">
        {primaryAction && (
          <Link to={primaryAction.href}>
            <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:brightness-110 px-6 py-3">
              {primaryAction.icon && <primaryAction.icon className="w-5 h-5 mr-2" />}
              {primaryAction.label}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
        
        {showContactOptions && (
          <>
            <a href={getWhatsAppUrl()}>
              <Button variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10 px-6 py-3">
                <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
                WhatsApp
              </Button>
            </a>
            <a href={getCallUrl()}>
              <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold/10 px-6 py-3">
                <Phone className="w-5 h-5 mr-2" />
                {CONTACT_INFO.phone}
              </Button>
            </a>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default GuideCTA;
