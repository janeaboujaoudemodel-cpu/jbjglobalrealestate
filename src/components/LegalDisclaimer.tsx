import { AlertTriangle, Shield, Lock, FileText, Building2, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";

interface LegalDisclaimerProps {
  variant?: "full" | "compact" | "investment" | "ai-tools" | "brokerage";
  className?: string;
}

const LegalDisclaimer = ({ variant = "compact", className = "" }: LegalDisclaimerProps) => {
  const currentYear = new Date().getFullYear();

  if (variant === "full") {
    return (
      <div className={`bg-[#FDFBF7]/80 backdrop-blur-md border border-[#1A1A1A] rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div>
            <h4 className="text-white font-semibold">Legal Notice & Disclaimer</h4>
            <p className="text-white/90 text-xs">JBJ Global Real Estate | Brokerage</p>
          </div>
        </div>

        <div className="space-y-4 text-white/70 text-sm">
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-[#1A1A1A] flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Brokerage Services:</strong> JBJ Global Real Estate is a 
              licensed brokerage providing property sales, rentals, and holiday home services within the UAE.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#1A1A1A] flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Partner Services:</strong> For legal matters and mortgage services, 
              we can introduce you to our licensed partners who contract directly with you.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#1A1A1A] flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Intellectual Property:</strong> This website, its design, AI-powered tools, 
              and all associated content are the exclusive intellectual property of 
              <span className="text-[#1A1A1A]"> Jane Bou Jaoude</span> and <span className="text-[#1A1A1A]">JBJ Global Real Estate</span>.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-[#1A1A1A] flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Third-Party Services:</strong> Legal and mortgage 
              services referenced on this platform are provided by independent professionals. Clients 
              contract directly with these providers.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#1A1A1A]">
          <p className="text-[#1A1A1A]/70 text-xs text-center">
            © {currentYear} JBJ Global Real Estate | 
            <Link to="/privacy" className="text-[#1A1A1A] hover:underline ml-1">Privacy Policy</Link> | 
            <Link to="/terms" className="text-[#1A1A1A] hover:underline ml-1">Terms of Service</Link>
          </p>
        </div>
      </div>
    );
  }

  if (variant === "investment" || variant === "brokerage") {
    return (
      <div className={`bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 text-sm font-medium mb-1">Brokerage Services</p>
            <p className="text-amber-200/70 text-xs leading-relaxed">
              JBJ Global Real Estate is a licensed real estate brokerage. For legal or mortgage services, 
              we can connect you with our licensed partners.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "ai-tools") {
    return (
      <div className={`bg-gradient-to-br from-[#032820] via-[#021611] to-black border border-white/30 rounded-xl p-5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] ${className}`} data-ai-tools-disclaimer data-surface="emerald" data-on-dark="true" data-no-contrast-guard>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#032820] via-[#021611] to-black border border-white/35 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-1">AI Tool Disclaimer</p>
            <p className="text-white/82 text-xs leading-relaxed">
              AI outputs support information and comparisons based on available data and inputs. 
              They are not guarantees and do not replace official documents or registration records.
            </p>
          </div>
        </div>
        
        <div className="border-t border-white/34 pt-4">
          <p className="text-white/82 text-xs mb-3">
            For legal, mortgage, or visa guidance, contact our team to connect you with our licensed partners.
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href={getWhatsAppUrl("Hello, I used your AI tool and would like expert guidance.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-colors border border-white/35 hover:border-white/50"
              style={{ background: "linear-gradient(135deg, #032820 0%, #021611 52%, #000000 100%)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              <MessageCircle className="w-3.5 h-3.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              WhatsApp Us
            </a>
            <a 
              href={`tel:${CONTACT_INFO.phone}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-colors border border-white/35 hover:border-white/50"
              style={{ background: "linear-gradient(135deg, #032820 0%, #021611 52%, #000000 100%)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              <Phone className="w-3.5 h-3.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              {CONTACT_INFO.phone}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Default compact variant
  return (
    <div className={`text-center ${className}`}>
      <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">
        © {currentYear} JBJ Global Real Estate. All Rights Reserved. 
        <span className="block mt-1">
          Licensed brokerage services. Partner services via independent professionals.
        </span>
      </p>
    </div>
  );
};

export default LegalDisclaimer;