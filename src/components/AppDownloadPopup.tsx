import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Smartphone, Info, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jbjMonogram from '@/assets/jbj-monogram-dark-bg.png';
import { usePopupVisibility } from '@/contexts/PopupCoordinatorContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface AppDownloadPopupProps {
  showOnLoad?: boolean;
  delayMs?: number;
}

const AppDownloadPopup = ({ showOnLoad = true, delayMs = 3000 }: AppDownloadPopupProps) => {
  const { requestToShow, dismiss, isVisible, isMobile } = usePopupVisibility('app-download-popup');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

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
      dismiss();
      setDeferredPrompt(null);
      toast.success('JBJ Global Real Estate app installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Request to show popup after delay if showOnLoad is true
    if (showOnLoad) {
      const timer = setTimeout(() => {
        setShouldShow(true);
        requestToShow();
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
  }, [showOnLoad, delayMs, requestToShow, dismiss]);

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
          dismiss();
          toast.success('JBJ Global Real Estate app installed successfully!');
        } else {
          toast.info('You can install the app anytime from your browser menu.');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
        toast.error('Installation failed. Try using your browser menu to install.');
      }
      setIsInstalling(false);
      return;
    }

    // iOS - Show detailed instructions
    if (isIOS) {
      setShowIOSInstructions(true);
      setIsInstalling(false);
      return;
    }

    // Fallback - try to register service worker
    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
      }
      toast.info('Use your browser menu (⋮) → "Install App" or "Add to Home Screen"', {
        duration: 8000
      });
    } catch (error) {
      console.error('SW registration failed:', error);
      toast.info('Bookmark this page for quick access!', { duration: 4000 });
    }
    
    setIsInstalling(false);
  }, [deferredPrompt, isIOS, dismiss]);

  const handleLearnMore = () => {
    window.open('/install', '_blank');
  };

  const handleDismiss = () => {
    localStorage.setItem('jbj_app_popup_dismissed', Date.now().toString());
    dismiss();
    setShowIOSInstructions(false);
  };

  if (isInstalled || !shouldShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop - Click does NOT dismiss (user must choose an option) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9999]"
          />
          
          {/* Popup - Perfectly centered on ALL devices */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[10000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-[380px] max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl relative overflow-hidden border-2 border-gold/30">
              {/* Premium gold glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 blur-sm rounded-2xl pointer-events-none" />
              {/* Gold accent line at top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A8925A] via-[#D4AF37] to-[#A8925A] z-10" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors z-20"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                {/* Phone Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#A8925A]/10 flex items-center justify-center">
                    <Smartphone className="w-7 h-7 text-[#A8925A]" />
                  </div>
                </div>

                {/* App Icon */}
                <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto mb-5 shadow-xl overflow-hidden border-2 border-[#A8925A]/50">
                  <img 
                    src={jbjMonogram} 
                    alt="JBJ Global Real Estate" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>

                {/* App Name */}
                <h3 className="text-xl font-bold text-black text-center mb-2">
                  JBJ Global Real Estate
                </h3>

                {/* Updated Description */}
                <p className="text-gray-600 text-center mb-5 text-sm leading-relaxed">
                  Install the JBJ Global Real Estate App for instant access, offline browsing, and smart property tools.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {['Instant Access', 'Offline Mode', 'Smart Tools'].map((benefit, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-700 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3 text-[#A8925A]" />
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* iOS Instructions (shown when iOS user clicks Install) */}
                {showIOSInstructions && isIOS && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-3 text-sm">Add to Home Screen:</h4>
                    <ol className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                        <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                        <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                        <span>Tap <strong>"Add"</strong> to install the app</span>
                      </li>
                    </ol>
                  </div>
                )}

                {/* THREE BUTTONS */}
                <div className="space-y-3">
                  {/* Install Now Button - Primary (Gold gradient with BLACK text for contrast) */}
                  <Button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="w-full h-12 bg-gradient-to-r from-[#A8925A] to-[#D4AF37] hover:from-[#9A8550] hover:to-[#C9A630] text-black font-bold text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] border-0 hover:shadow-gold/40"
                  >
                    {isInstalling ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Installing...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        <span>Install Now</span>
                      </span>
                    )}
                  </Button>

                  {/* Learn More Button - Secondary */}
                  <Button
                    onClick={handleLearnMore}
                    variant="outline"
                    className="w-full h-10 border-2 border-[#A8925A] text-[#A8925A] hover:bg-[#A8925A]/10 font-medium rounded-xl"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Learn More
                  </Button>

                  {/* Maybe Later Button - Tertiary */}
                  <button
                    onClick={handleDismiss}
                    className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppDownloadPopup;
