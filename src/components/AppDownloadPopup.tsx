import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown, Smartphone } from 'lucide-react';
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

const AppDownloadPopup = ({ showOnLoad = true, delayMs = 3000 }: AppDownloadPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

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

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const iosDevice = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream;
    const androidDevice = /android/.test(userAgent);
    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

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
      toast.success('JBJ Global Real Estate app installed successfully!');
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

    // If we have a deferred prompt (Android/Desktop Chrome), use it immediately
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          localStorage.setItem('jbj_pwa_installed', 'true');
          setIsInstalled(true);
          setIsOpen(false);
          toast.success('JBJ Global Real Estate app installed successfully!');
        } else {
          toast.info('You can install the app anytime from your browser menu.');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
        // Fallback: register service worker and close popup
        registerServiceWorkerAndClose();
      }
      setIsInstalling(false);
      return;
    }

    // iOS - Safari Add to Home Screen 
    if (isIOS) {
      toast.success('Opening Share menu... Tap "Add to Home Screen" to install!', {
        duration: 5000
      });
      // Try to trigger iOS share menu if possible
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'JBJ Global Real Estate',
            text: 'Install JBJ Global Real Estate app',
            url: window.location.origin,
          });
        } catch {
          // User cancelled or not supported
        }
      }
      setIsInstalling(false);
      setIsOpen(false);
      return;
    }

    // Fallback for all other cases - register service worker and show success
    registerServiceWorkerAndClose();
  }, [deferredPrompt, isIOS]);

  const registerServiceWorkerAndClose = async () => {
    try {
      // Ensure service worker is registered for PWA
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      }
      
      // Mark as ready to install
      localStorage.setItem('jbj_pwa_ready', 'true');
      toast.success('App ready! Use browser menu (⋮) > "Install App" or "Add to Home Screen"', {
        duration: 6000
      });
    } catch (error) {
      console.error('SW registration failed:', error);
      toast.success('App cached! Bookmark this page for quick access.', { duration: 4000 });
    }
    
    setIsInstalling(false);
    setIsOpen(false);
  };

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
            className="fixed inset-0 bg-black/40 z-[9999]"
          />
          
          {/* Popup - Perfectly centered on ALL devices */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[10000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-[360px]"
          >
            <div className="bg-white rounded-2xl shadow-2xl relative overflow-hidden">
              {/* Gold accent line at top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A8925A] via-[#D4AF37] to-[#A8925A]" />
              
              {/* Close button - Single X */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors z-20"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                {/* Phone Icon Only - Above App Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#A8925A]/10 flex items-center justify-center">
                    <Smartphone className="w-7 h-7 text-[#A8925A]" />
                  </div>
                </div>

                {/* App Icon - JBJ Monogram (Official Transparent Logo) */}
                <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto mb-5 shadow-xl overflow-hidden border-2 border-[#A8925A]/50">
                  <img 
                    src={jbjMonogram} 
                    alt="JBJ Global Real Estate" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>

                {/* App Name - Correct branding: JBJ Global Real Estate */}
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
                      <Check className="w-3 h-3 text-[#A8925A]" />
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* Download Button - WHITE background with gold crown and black text */}
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full h-14 bg-white hover:bg-gray-50 text-black font-bold text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-[#A8925A]"
                >
                  {isInstalling ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#A8925A]/30 border-t-[#A8925A] rounded-full animate-spin" />
                      <span>Installing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-[#A8925A]" />
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
