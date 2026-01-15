import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jbjMonogram from '@/assets/jbj-monogram-dark-bg.png';
import { usePopupVisibility } from '@/contexts/PopupCoordinatorContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface AppDownloadPopupProps {
  showOnLoad?: boolean;
  delayMs?: number;
}

const STORAGE_KEYS = {
  INSTALLED: 'jbj_pwa_installed',
  DISMISSED_AT: 'jbj_app_popup_dismissed',
};

const AppDownloadPopup = ({ showOnLoad = true, delayMs = 3000 }: AppDownloadPopupProps) => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('app-download-popup');
  const [mounted, setMounted] = useState(false);

  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if already installed
    const installed = localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true';
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    if (installed || isStandalone) {
      setIsInstalled(true);
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      return;
    }

    // Don't show if dismissed within last 24 hours
    const dismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (dismissedTime > oneDayAgo) return;

    // Detect iOS
    const userAgent = navigator.userAgent.toLowerCase();
    const iosDevice = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      setIsInstalled(true);
      setDeferredPrompt(null);
      dismiss();
      toast.success('App installed! You can pin it to your home screen.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

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
    if (isInstalling) return;

    // iOS cannot auto-install: show compact instructions
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // Android/Desktop Chrome: one-click native prompt
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
          setIsInstalled(true);
          dismiss();
          toast.success('App installed! You can pin it for instant access.');
        }

        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
        window.location.href = '/install';
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // Fallback (browsers without install prompt): go to install page
    window.location.href = '/install';
  }, [deferredPrompt, isIOS, dismiss, isInstalling]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
    setShowIOSInstructions(false);
    dismiss();
  }, [dismiss]);

  if (!mounted || isInstalled || !shouldShow) return null;

  const content = (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9999]"
          />

          {/* Wrapper (portal) to prevent cropping/clipping by parent transforms */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[380px] max-h-[calc(100vh-32px)] overflow-y-auto"
            >
              <div className="bg-white rounded-2xl shadow-2xl relative overflow-hidden border-2 border-gold/30">
                <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 blur-sm rounded-2xl pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A8925A] via-[#D4AF37] to-[#A8925A] z-10" />

                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors z-20"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6 pt-8">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#A8925A]/10 flex items-center justify-center">
                      <Smartphone className="w-7 h-7 text-[#A8925A]" />
                    </div>
                  </div>

                  <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto mb-5 shadow-xl overflow-hidden border-2 border-[#A8925A]/50">
                    <img
                      src={jbjMonogram}
                      alt="JBJ Global Real Estate"
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                    />
                  </div>

                  <h3 className="text-xl font-bold text-black text-center mb-2">JBJ Global Real Estate</h3>
                  <p className="text-gray-600 text-center mb-5 text-sm leading-relaxed">
                    One-tap install for instant access.
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {['Instant Access', 'Offline Mode', 'Fast Login'].map((benefit, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-700 text-xs font-medium flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-[#A8925A]" />
                        {benefit}
                      </span>
                    ))}
                  </div>

                  {showIOSInstructions && isIOS && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="font-semibold text-blue-900 mb-2 text-sm">iPhone / iPad</h4>
                      <p className="text-sm text-blue-800">
                        Tap <strong>Share</strong> in Safari, then <strong>“Add to Home Screen”</strong>.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      onClick={handleInstall}
                      disabled={isInstalling}
                      className="w-full h-12 bg-gradient-to-r from-[#A8925A] to-[#D4AF37] hover:from-[#9A8550] hover:to-[#C9A630] text-black font-bold text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] border-0"
                    >
                      {isInstalling ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span>Installing...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Download className="w-5 h-5" />
                          <span>{isIOS ? 'Show Install Steps' : 'Install Now'}</span>
                        </span>
                      )}
                    </Button>

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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default AppDownloadPopup;
