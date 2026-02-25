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
      {/* Multi-layer gold and white pulse rings - Highly visible */}
      <span 
        className="absolute -inset-3 rounded-full pointer-events-none"
        style={{ 
          background: 'linear-gradient(135deg, rgba(200,167,102,0.6), rgba(255,255,255,0.5))',
          animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        }}
      />
      <span 
        className="absolute -inset-5 rounded-full pointer-events-none"
        style={{ 
          boxShadow: '0 0 30px rgba(200,167,102,0.7), 0 0 60px rgba(255,255,255,0.5), 0 0 90px rgba(200,167,102,0.4)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
      <span 
        className="absolute -inset-2 rounded-full pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, rgba(200,167,102,0.4) 0%, rgba(255,255,255,0.3) 50%, transparent 70%)',
          animation: 'pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
      {/* Outer glow ring */}
      <span 
        className="absolute -inset-6 rounded-full pointer-events-none"
        style={{ 
          boxShadow: '0 0 40px rgba(255,255,255,0.4), 0 0 80px rgba(200,167,102,0.3)',
          animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
      
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
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.preventDefault();
          window.open(whatsappHref, '_blank', 'noopener,noreferrer');
        }}
        className="relative flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        style={{
          boxShadow: '0 0 30px rgba(200,167,102,0.6), 0 0 50px rgba(255,255,255,0.4), 0 4px 25px rgba(0,0,0,0.4)',
        }}
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
