import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Share, Plus, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jbjMonogram from '@/assets/jbj-monogram-dark-bg.png';

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
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

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

    // Listen for app installed event
    const handleAppInstalled = () => {
      localStorage.setItem('jbj_pwa_installed', 'true');
      setIsInstalled(true);
      setIsOpen(false);
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
    } else if (isIOS) {
      // iOS - show integrated instruction within popup
      setShowIOSInstructions(true);
    } else {
      // For other browsers, redirect to install page
      window.location.href = '/install';
    }
    
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('jbj_app_popup_dismissed', Date.now().toString());
    setIsOpen(false);
    setShowIOSInstructions(false);
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Clear, no blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 z-[9999]"
          />
          
          {/* Popup - Fully visible, responsive, premium design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-[92%] max-w-[380px] max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl relative overflow-hidden">
              {/* Gold accent line at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-gold-light to-gold" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                {showIOSInstructions ? (
                  // iOS Installation Guide - Integrated within popup
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Add to Home Screen</h3>
                    
                    <div className="space-y-4 text-left mb-6">
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                          <span className="text-black font-bold text-sm">1</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Tap the Share button</p>
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                            <Share className="w-3 h-3" /> at the bottom of Safari
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                          <span className="text-black font-bold text-sm">2</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Select "Add to Home Screen"</p>
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Scroll down to find it
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                          <span className="text-black font-bold text-sm">3</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Tap "Add" to confirm</p>
                          <p className="text-gray-500 text-xs mt-0.5">The app will appear on your home screen</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setShowIOSInstructions(false)}
                      variant="outline"
                      className="w-full h-12 border-gold text-gold hover:bg-gold hover:text-black font-semibold rounded-xl"
                    >
                      Got it!
                    </Button>
                  </div>
                ) : (
                  // Main popup content
                  <div className="text-center">
                    {/* App Icon - Using JBJ Monogram */}
                    <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto mb-5 shadow-lg overflow-hidden">
                      <img 
                        src={jbjMonogram} 
                        alt="JBJ App" 
                        className="w-full h-full object-contain p-2"
                      />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Download Our App
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-5 text-sm leading-relaxed">
                      Get the JBJ App for instant access to Dubai's premium properties and exclusive market insights.
                    </p>

                    {/* Benefits */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {['Instant Notifications', 'Offline Access', 'Faster Loading'].map((benefit, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-gray-700 text-xs font-medium flex items-center gap-1.5"
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
                      className="w-full h-14 bg-black hover:bg-gray-900 text-white font-bold text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-gold/50"
                    >
                      {isInstalling ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Installing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Download className="w-5 h-5 text-gold" />
                          <span className="text-gold">Download App</span>
                        </span>
                      )}
                    </Button>

                    {/* Arrow indicator for iOS */}
                    {isIOS && (
                      <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
                        <ArrowDown className="w-3 h-3 animate-bounce" />
                        <span>Tap to see installation steps</span>
                      </div>
                    )}

                    {/* Skip text */}
                    <button
                      onClick={handleDismiss}
                      className="mt-4 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppDownloadPopup;
