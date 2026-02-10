import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, DollarSign } from "lucide-react";

const STORAGE_KEY = "currency_tooltip_dismissed";

export function CurrencyTooltip() {
  const [show, setShow] = useState(false);
  const location = useLocation();

  // Only show on properties pages where currency selector actually exists
  const isPropertiesPage = location.pathname === "/properties" || location.pathname === "/properties-reelly";

  useEffect(() => {
    if (!isPropertiesPage) {
      setShow(false);
      return;
    }
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isPropertiesPage]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[9999] max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div
        className="relative rounded-xl border-2 border-gold/50 p-4 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)",
        }}
      >
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gold/20 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-foreground/60" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Change Currency</p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              You can switch between 10 currencies using the currency selector in the filters above.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="mt-3 w-full py-2 rounded-lg bg-gold text-black text-sm font-semibold hover:bg-gold/90 transition-colors"
        >
          Got it
        </button>
      </div>
      {/* Arrow pointing up */}
      <div className="absolute -top-2 right-8 w-4 h-4 rotate-45 border-l-2 border-t-2 border-gold/50" style={{ background: "#FDFBF7" }} />
    </div>
  );
}
