import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Share } from 'lucide-react';
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
  const [showIOSGuide, setShowIOSGuide] = useState(false);

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

    // iOS devices - show instructions guide
    if (isIOS) {
      setShowIOSGuide(true);
      setIsInstalling(false);
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
          toast.info('Installation cancelled. You can install anytime from the menu.');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
        toast.error('Installation failed. Please try using your browser menu.');
      }
      setIsInstalling(false);
      return;
    }

    // Fallback: Show browser-specific instructions
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (isChrome || isEdge) {
      toast.info('Click the install icon (⊕) in your browser address bar, or use Menu → Install App', {
        duration: 6000,
      });
    } else if (isFirefox) {
      toast.info('Firefox: Open Menu (☰) → Install this site as an app', {
        duration: 6000,
      });
    } else if (isSafari) {
      toast.info('Safari on Mac does not support app installation. Use Chrome or Edge.', {
        duration: 6000,
      });
    } else {
      toast.info('Use your browser menu → "Install App" or "Add to Home Screen"', {
        duration: 6000,
      });
    }
    
    setIsInstalling(false);
  }, [deferredPrompt, isIOS]);

  const handleDismiss = () => {
    localStorage.setItem('jbj_app_popup_dismissed', Date.now().toString());
    setIsOpen(false);
    setShowIOSGuide(false);
  };

  const closeIOSGuide = () => {
    setShowIOSGuide(false);
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {/* iOS Instructions Modal */}
      {showIOSGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10001] bg-black/80 flex items-center justify-center p-4"
          onClick={closeIOSGuide}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-black mb-5 text-center">Add to Home Screen</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <span className="bg-gold/20 text-gold rounded-full w-7 h-7 flex items-center justify-center shrink-0 font-bold text-sm">1</span>
                <p className="pt-0.5">Tap the <Share className="inline w-4 h-4 text-blue-500" /> <strong>Share</strong> button at the bottom of Safari</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-gold/20 text-gold rounded-full w-7 h-7 flex items-center justify-center shrink-0 font-bold text-sm">2</span>
                <p className="pt-0.5">Scroll down and tap <strong>"Add to Home Screen"</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-gold/20 text-gold rounded-full w-7 h-7 flex items-center justify-center shrink-0 font-bold text-sm">3</span>
                <p className="pt-0.5">Tap <strong>"Add"</strong> in the top right corner</p>
              </div>
            </div>
            <Button
              onClick={closeIOSGuide}
              className="mt-6 w-full bg-black hover:bg-gray-900 text-gold font-bold py-4 rounded-xl"
            >
              Got it!
            </Button>
          </motion.div>
        </motion.div>
      )}

      {isOpen && (
        <>
          {/* Backdrop - Semi-transparent, NO blur - company name visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/40 z-[9999]"
            style={{ backdropFilter: 'none' }}
          />
          
          {/* Popup - Perfectly centered, fully visible, premium design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] relative overflow-hidden">
              {/* Gold accent line at top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold via-[#D4AF37] to-gold" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="p-8 pt-10">
                {/* App Icon - Using JBJ Monogram */}
                <div className="w-24 h-24 rounded-2xl bg-black flex items-center justify-center mx-auto mb-6 shadow-xl overflow-hidden border-2 border-gold/30">
                  <img 
                    src={jbjMonogram} 
                    alt="JBJ App" 
                    className="w-full h-full object-contain p-3"
                  />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-black text-center mb-3">
                  Download Our App
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
                  Get the JBJ App for instant access to Dubai's premium properties and exclusive market insights.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {['Instant Notifications', 'Offline Access', 'Faster Loading'].map((benefit, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-700 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3 text-gold" />
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* Download Button - Premium black/gold styling */}
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full h-14 bg-black hover:bg-gray-900 text-gold font-bold text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-gold"
                >
                  {isInstalling ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                      <span>Installing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      <span>{isIOS ? 'Add to Home Screen' : 'Download App'}</span>
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
