import { useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface CalendlyEmbedProps {
  url?: string;
  className?: string;
  prefill?: {
    name?: string;
    email?: string;
  };
}

// Default Calendly URL - can be overridden via props or admin config
const DEFAULT_CALENDLY_URL = 'https://calendly.com/jbj-global-real-estate/property-consultation';

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string; prefill?: any }) => void;
      initInlineWidget: (options: { url: string; parentElement: HTMLElement; prefill?: any }) => void;
    };
  }
}

export const CalendlyEmbed = ({
  url = DEFAULT_CALENDLY_URL,
  className = '',
  prefill,
}: CalendlyEmbedProps) => {
  useEffect(() => {
    // Load Calendly script if not already loaded
    if (!document.querySelector('script[src*="calendly.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: url,
        prefill: prefill,
      });
    } else {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <button
      onClick={openCalendly}
      className={`inline-flex items-center gap-2 bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A] font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-gold/20 ${className}`}
    >
      <Calendar className="w-5 h-5" />
      <span>Book a Consultation</span>
    </button>
  );
};

// Inline embed version
export const CalendlyInline = ({
  url = DEFAULT_CALENDLY_URL,
  className = '',
  prefill,
}: CalendlyEmbedProps) => {
  useEffect(() => {
    const container = document.getElementById('calendly-inline-widget');
    
    // Load scripts
    if (!document.querySelector('script[src*="calendly.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Initialize when ready
    const initWidget = () => {
      if (window.Calendly && container) {
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: container,
          prefill: prefill,
        });
      }
    };

    // Wait for script to load
    const timer = setInterval(() => {
      if (window.Calendly) {
        initWidget();
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [url, prefill]);

  return (
    <div
      id="calendly-inline-widget"
      className={`min-h-[650px] bg-[#FDFBF7] rounded-xl overflow-hidden ${className}`}
      data-url={url}
    />
  );
};

export default CalendlyEmbed;
