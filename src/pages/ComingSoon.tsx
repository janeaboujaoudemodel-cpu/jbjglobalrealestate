import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Crown, Sparkles, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import InquiryFormModal from "@/components/InquiryFormModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png";

type PageMode = 'coming-soon' | 'maintenance' | 'opening-soon' | 'welcome-back';

const MODE_CONFIG: Record<PageMode, { title: string; subtitle: string; tagline: string }> = {
  'coming-soon': {
    title: 'Coming Soon',
    subtitle: "We're crafting something extraordinary for you.",
    tagline: 'UAE Real Estate Brokerage',
  },
  'maintenance': {
    title: 'Under Maintenance',
    subtitle: "We're upgrading our systems. We'll be back shortly.",
    tagline: 'Scheduled Maintenance',
  },
  'opening-soon': {
    title: 'Opening Soon',
    subtitle: "Something extraordinary is on its way.",
    tagline: 'A New Chapter Begins',
  },
  'welcome-back': {
    title: 'Welcome Back',
    subtitle: "We missed you. Great things await.",
    tagline: 'Your Luxury Real Estate Partner',
  },
};

const ComingSoon = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'broker' | 'visitor' | undefined>(undefined);
  const { t, isRTL } = useLanguage();
  const [searchParams] = useSearchParams();

  const mode = (searchParams.get('mode') as PageMode) || 'coming-soon';
  const config = MODE_CONFIG[mode] || MODE_CONFIG['coming-soon'];

  const openForm = (role?: 'buyer' | 'broker' | 'visitor') => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className={`min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center px-4 py-12 md:py-16 relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Language Switcher - Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher variant="default" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-2xl mx-auto"
        >
          {/* Monogram Logo */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-10"
          >
            <img 
              src={jbjMonogramLightTransparent}
              alt="JBJ" 
              className="h-32 md:h-44 lg:h-56 w-auto mx-auto"
             loading="lazy" decoding="async" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
          >
            {t('comingSoon.title', config.title)}
          </motion.h1>

          {/* Company Name */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg md:text-xl lg:text-2xl text-[#1A1A1A] tracking-[0.4em] uppercase font-medium mb-8"
          >
            JBJ Global Real Estate
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-4"
          >
            <p className="text-lg md:text-xl text-white/90 font-light">
              {t('comingSoon.subtitle', config.subtitle)}
            </p>
            <p className="text-sm md:text-base text-white/85 tracking-[0.2em] uppercase">
              {t('comingSoon.tagline', config.tagline)}
            </p>
          </motion.div>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-12 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent"
          />

          {/* JOIN THE CIRCLE Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 max-w-md mx-auto"
          >
            {/* Crown Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#FDFBF7] flex items-center justify-center">
                  <Crown className="w-10 h-10 text-[#1A1A1A]" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-[#1A1A1A] animate-pulse" />
              </div>
            </div>

            <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              {t('comingSoon.joinCircle', 'Join the Circle')}
            </h3>
            
            <p className="text-white/90 text-sm md:text-base mb-8 max-w-sm mx-auto leading-relaxed">
              {t('comingSoon.joinCircleDesc', 'Fill the form to join our circle and be the first to access exclusive properties and market insights.')}
            </p>

            {/* Join Now Button */}
            <Button
              onClick={() => openForm()}
              variant="primary"
              className="px-10 py-6 text-lg gap-3"
            >
              <Crown className="w-5 h-5" />
              {t('comingSoon.joinNow', 'Join Now')}
            </Button>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-12 flex flex-col items-center gap-4"
          >
            {/* WhatsApp */}
            <a
              href="https://wa.me/971547167107?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20your%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-white/70 hover:text-[#1A1A1A] transition-all duration-300"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#EFE6D6]/10 group-hover:bg-[#EFE6D6]/20 transition-colors border border-[#B89555]/30">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </span>
              <span dir="ltr" className="font-medium tracking-wide">+971 54 716 7107</span>
            </a>

            {/* Email */}
            <a
              href="mailto:contact@JBJ.ae"
              className="group flex items-center gap-3 text-white/70 hover:text-[#1A1A1A] transition-all duration-300"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#EFE6D6]/10 group-hover:bg-[#EFE6D6]/20 transition-colors border border-[#B89555]/30">
                <Mail className="w-5 h-5" />
              </span>
              <span dir="ltr" className="font-medium tracking-wide">contact@JBJ.ae</span>
            </a>

            {/* Team Login */}
            <Link
              to="/auth"
              className="group flex items-center gap-3 text-white/70 hover:text-[#1A1A1A] transition-all duration-300"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#EFE6D6]/10 group-hover:bg-[#EFE6D6]/20 transition-colors border border-[#B89555]/30">
                <Lock className="w-5 h-5" />
              </span>
              <span className="font-medium tracking-wide">{t('comingSoon.teamLogin', 'Team Login')}</span>
            </Link>
          </motion.div>

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-12 text-xs text-white/85"
          >
            © {new Date().getFullYear()} JBJ Global Real Estate. {t('footer.allRightsReserved', 'All Rights Reserved.')}
          </motion.p>
        </motion.div>
      </div>

      {/* Lead Capture Form Modal */}
      <InquiryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        source={selectedRole ? `coming-soon-${selectedRole}` : 'coming-soon'}
        preselectedRole={selectedRole}
      />
    </>
  );
};

export default ComingSoon;
