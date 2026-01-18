import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { getWhatsAppUrl } from "@/constants/stats";

const STORAGE_KEY = "jj_whatsapp_minimized_at";
const RESTORE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

const getInitialState = (): boolean => {
  try {
    const minimizedAt = localStorage.getItem(STORAGE_KEY);
    if (!minimizedAt) return false;
    
    const elapsed = Date.now() - parseInt(minimizedAt, 10);
    if (elapsed >= RESTORE_AFTER_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const FloatingWhatsApp = () => {
  const [isMinimized, setIsMinimized] = useState(getInitialState);
  const whatsappHref = getWhatsAppUrl();

  const handleMinimize = () => {
    setIsMinimized(true);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Silent fail
    }
  };

  const handleRestore = () => {
    setIsMinimized(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent fail
    }
  };

  // Check for auto-restore periodically
  useEffect(() => {
    if (!isMinimized) return;
    
    const checkRestore = () => {
      try {
        const minimizedAt = localStorage.getItem(STORAGE_KEY);
        if (!minimizedAt) return;
        
        const elapsed = Date.now() - parseInt(minimizedAt, 10);
        if (elapsed >= RESTORE_AFTER_MS) {
          handleRestore();
        }
      } catch {
        // Silent fail
      }
    };

    // Check every minute
    const interval = setInterval(checkRestore, 60000);
    return () => clearInterval(interval);
  }, [isMinimized]);

  if (isMinimized) {
    return (
      <button
        onClick={handleRestore}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Show WhatsApp chat"
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-green-500/40 animate-ping pointer-events-none" />
      <span className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse pointer-events-none" />
      
      {/* Close button */}
      <button
        onClick={handleMinimize}
        className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full shadow-md flex items-center justify-center transition-colors z-10"
        aria-label="Minimize WhatsApp button"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      
      <a
        href={whatsappHref}
        onClick={(e) => {
          // Avoid popup blockers / iframe restrictions by navigating directly.
          e.preventDefault();
          window.location.href = whatsappHref;
        }}
        className="relative flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        aria-label="Chat with us on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="font-medium text-sm hidden sm:inline group-hover:inline">
          Chat with us
        </span>
      </a>
    </div>
  );
};

export default FloatingWhatsApp;
