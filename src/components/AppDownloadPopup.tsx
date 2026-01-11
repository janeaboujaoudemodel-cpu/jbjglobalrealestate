import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Crown, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jbjMonogram from '@/assets/jbj-monogram-dark-bg.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface AppDownloadPopupProps {
  showOnLoad?: boolean;
  delayMs?: number;
}

const AppDownloadPopup = ({ showOnLoad = true, delayMs = 0 }: AppDownloadPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const installed = localStorage.getItem('jbj_pwa_installed') === 'true';
    const dismissed = localStorage.getItem('jbj_app_popup_dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (navigator as any).standalone === true;

    if (installed || isStandalone) {
      setIsInstalled(true);
      localStorage.setItem('jbj_pwa_installed', 'true');
      return;
    }

    // Don't show if dismissed within last 24 hours
    if (dismissedTime > oneDayAgo) {
      return;
    }

    // Check if iOS
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      localStorage.setItem('jbj_pwa_installed', 'true');
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
      toast.success('App installed successfully! Find it on your home screen.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show popup after delay if showOnLoad is true
    if (showOnLoad) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delayMs);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showOnLoad, delayMs]);

  const handleInstall = useCallback(async () => {
    setIsInstalling(true);

    // iOS devices - For now, just start download attempt
    if (isIOS) {
      // On iOS, we can't really install PWA programmatically
      // Just trigger the install prompt if available, otherwise show toast
      toast.success('Opening installation... Add to your home screen for the best experience!');
      setIsInstalling(false);
      setIsOpen(false);
      return;
    }

    // Android/Desktop with native install prompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          localStorage.setItem('jbj_pwa_installed', 'true');
          setIsInstalled(true);
          setIsOpen(false);
          toast.success('App installed! Find it on your home screen or taskbar.');
        } else {
          toast.info('You can install anytime from your browser menu.');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
        toast.error('Installation failed. Please try using your browser menu.');
      }
      setIsInstalling(false);
      return;
    }

    // Fallback: Just show success message (PWA will be cached)
    toast.success('App is ready! Bookmark this page or use browser menu to install.');
    setIsInstalling(false);
    setIsOpen(false);
  }, [deferredPrompt, isIOS]);

  const handleDismiss = () => {
    localStorage.setItem('jbj_app_popup_dismissed', Date.now().toString());
    setIsOpen(false);
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Semi-transparent, NO blur - landing page clearly visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 z-[9999]"
            style={{ backdropFilter: 'none' }}
          />
          
          {/* Popup - Perfectly centered on ALL devices, fully visible */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[340px] relative overflow-visible pointer-events-auto">
              {/* Gold accent line at top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold via-[#D4AF37] to-gold rounded-t-2xl" />
              
              {/* Close button - Single X, clearly visible */}
              <button
                onClick={handleDismiss}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 z-20"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                {/* Phone Icon Only - Above App Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-gold" />
                  </div>
                </div>

                {/* App Icon - JBJ Monogram (Official Transparent Logo) */}
                <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto mb-5 shadow-xl overflow-hidden border-2 border-gold/40">
                  <img 
                    src={jbjMonogram} 
                    alt="JBJ Global Real Estate" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>

                {/* App Name - Correct branding */}
                <h3 className="text-xl font-bold text-black text-center mb-2">
                  JBJ Global Real Estate
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-center mb-5 text-sm leading-relaxed">
                  Get instant access to Dubai's premium properties and exclusive market insights.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {['Instant Access', 'Offline Mode', 'Fast Loading'].map((benefit, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-700 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3 text-gold" />
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* Download Button - WHITE background with gold crown and black text */}
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full h-14 bg-white hover:bg-gray-50 text-black font-bold text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-gold"
                >
                  {isInstalling ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                      <span>Installing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-gold" />
                      <span>Download App</span>
                    </span>
                  )}
                </Button>

                {/* Skip text */}
                <button
                  onClick={handleDismiss}
                  className="w-full mt-4 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppDownloadPopup;
