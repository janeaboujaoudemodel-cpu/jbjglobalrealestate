import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppDownloadPopupProps {
  showOnLoad?: boolean;
  delayMs?: number;
}

const AppDownloadPopup = ({ showOnLoad = true, delayMs = 0 }: AppDownloadPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const installed = localStorage.getItem('jbj_pwa_installed') === 'true';
    const dismissed = localStorage.getItem('jbj_app_popup_dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (installed) {
      setIsInstalled(true);
      return;
    }

    // Don't show if dismissed within last 24 hours
    if (dismissedTime > oneDayAgo) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show popup after delay if showOnLoad is true
    if (showOnLoad) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delayMs);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [showOnLoad, delayMs]);

  const handleInstall = async () => {
    setIsInstalling(true);

    if (deferredPrompt) {
      // Use native PWA install prompt - immediate one-click download
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          localStorage.setItem('jbj_pwa_installed', 'true');
          setIsInstalled(true);
          setIsOpen(false);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
      }
    } else {
      // Detect platform for appropriate install method
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      if (isIOS) {
        // iOS - show clear instruction modal for Add to Home Screen
        setShowIOSInstructions(true);
      } else {
        // For desktop browsers that support PWA, try to trigger install
        // Chrome/Edge on desktop should work with beforeinstallprompt
        // For Firefox/other browsers, redirect to install page
        window.location.href = '/install';
      }
    }
    
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('jbj_app_popup_dismissed', Date.now().toString());
    setIsOpen(false);
  };

  // Expose method to trigger popup externally
  const triggerPopup = () => setIsOpen(true);

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIOSInstructions(false)}
            className="fixed inset-0 bg-black/70 z-[10001]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10002] w-[90%] max-w-md"
          >
            <div className="bg-zinc-900 border border-gold/30 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-4">Add to Home Screen</h3>
                <div className="text-left space-y-3 text-zinc-300 text-sm">
                  <p>1. Tap the <span className="font-semibold text-gold">Share</span> button at the bottom of Safari</p>
                  <p>2. Scroll down and tap <span className="font-semibold text-gold">"Add to Home Screen"</span></p>
                  <p>3. Tap <span className="font-semibold text-gold">"Add"</span> in the top right corner</p>
                </div>
                <Button
                  onClick={() => setShowIOSInstructions(false)}
                  className="w-full mt-6 bg-gold hover:bg-gold-light text-black font-bold"
                >
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {isOpen && (
        <>
          {/* Backdrop - No blur to keep company name visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 z-[9999]"
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-[90%] max-w-md"
          >
            <div className="bg-zinc-900 border border-gold/30 rounded-2xl p-6 shadow-2xl shadow-gold/10 relative overflow-hidden">
              {/* Gold accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gold/30">
                  <Smartphone className="w-10 h-10 text-black" />
                </div>

                {/* Title - Removed phone emoji, icon at top is sufficient */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  Download Our App
                </h3>

                {/* Description */}
                <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                  Download the JBJ App now and be notified once the platform is live. Get exclusive access to properties and market insights.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {['Instant Notifications', 'Offline Access', 'Faster Loading'].map((benefit, i) => (
                    <span key={i} className="px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-xs flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* Download Button - White background with gold text for premium look */}
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full h-14 bg-white hover:bg-zinc-100 text-gold font-bold text-lg rounded-xl shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gold/30"
                >
                  {isInstalling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mr-2" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download App
                    </>
                  )}
                </Button>

                {/* Skip text */}
                <button
                  onClick={handleDismiss}
                  className="mt-4 text-zinc-500 text-sm hover:text-zinc-400 transition-colors"
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
