import { AlertTriangle, Shield, Lock, FileText, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

interface LegalDisclaimerProps {
  variant?: "full" | "compact" | "investment" | "ai-tools" | "brokerage";
  className?: string;
}

const LegalDisclaimer = ({ variant = "compact", className = "" }: LegalDisclaimerProps) => {
  const currentYear = new Date().getFullYear();

  if (variant === "full") {
    return (
      <div className={`bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h4 className="text-white font-semibold">Legal Notice & Disclaimer</h4>
            <p className="text-zinc-500 text-xs">JBJ Global Real Estate | Brokerage</p>
          </div>
        </div>

        <div className="space-y-4 text-zinc-400 text-sm">
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Brokerage Services:</strong> JBJ Global Real Estate is a 
              brokerage providing property sales, leasing, and holiday home services within the UAE.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">No Regulated Advice:</strong> We do not provide legal, mortgage, financial, 
              or investment advice. For these services, we can introduce you to independent professionals 
              who contract directly with you.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Intellectual Property:</strong> This website, its design, AI-powered tools, 
              and all associated content are the exclusive intellectual property of 
              <span className="text-gold"> Jane Abou Jaoude</span> and <span className="text-gold">JBJ Global Real Estate</span>.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Third-Party Services:</strong> Legal, mortgage, and property management 
              services referenced on this platform are provided by independent professionals. Clients 
              contract directly with these providers.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800">
          <p className="text-zinc-600 text-xs text-center">
            © {currentYear} JBJ Global Real Estate | 
            <Link to="/privacy" className="text-gold hover:underline ml-1">Privacy Policy</Link> | 
            <Link to="/terms" className="text-gold hover:underline ml-1">Terms of Service</Link>
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
            <p className="text-amber-200 text-sm font-medium mb-1">Brokerage Disclaimer</p>
            <p className="text-amber-200/70 text-xs leading-relaxed">
              JBJ Global Real Estate is a real estate brokerage. We do not provide legal, mortgage, 
              financial, or investment advice. Third-party services are provided by independent 
              professionals who contract directly with clients.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "ai-tools") {
    return (
      <div className={`bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-purple-200 text-sm font-medium mb-1">AI Tool Disclaimer</p>
            <p className="text-purple-200/70 text-xs leading-relaxed">
              AI-generated analysis is for informational purposes only and does not constitute professional advice. 
              Results should be verified independently. These tools are proprietary to JBJ Global Real Estate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default compact variant
  return (
    <div className={`text-center ${className}`}>
      <p className="text-zinc-600 text-xs leading-relaxed">
        © {currentYear} JBJ Global Real Estate. All Rights Reserved. 
        <span className="block mt-1">
          Brokerage services only. Third-party services via independent professionals.
        </span>
      </p>
    </div>
  );
};

export default LegalDisclaimer;
