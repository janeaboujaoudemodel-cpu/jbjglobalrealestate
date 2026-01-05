import { AlertTriangle, Shield, Lock, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface LegalDisclaimerProps {
  variant?: "full" | "compact" | "investment" | "ai-tools";
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
            <p className="text-zinc-500 text-xs">JJ Global Capital - Protected Platform</p>
          </div>
        </div>

        <div className="space-y-4 text-zinc-400 text-sm">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Intellectual Property:</strong> This website, its design, AI-powered tools, 
              algorithms, content, and all associated technologies are the exclusive intellectual property of 
              <span className="text-gold"> Jane Abou Jaoude</span> and <span className="text-gold">JJ Global Capital</span>.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Prohibition:</strong> Unauthorized copying, reproduction, distribution, 
              modification, or commercial use of any part of this platform is strictly prohibited and will be 
              prosecuted to the fullest extent of international copyright and intellectual property law.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
            <p>
              <strong className="text-white">Investment Disclaimer:</strong> Information provided on this platform 
              is for informational purposes only and does not constitute financial, legal, or investment advice. 
              Users should seek independent professional advice before making investment decisions.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800">
          <p className="text-zinc-600 text-xs text-center">
            © {currentYear} JJ Global Capital | Powered by JJ Holding Group | 
            <Link to="/privacy" className="text-gold hover:underline ml-1">Privacy Policy</Link> | 
            <Link to="/terms" className="text-gold hover:underline ml-1">Terms of Service</Link>
          </p>
        </div>
      </div>
    );
  }

  if (variant === "investment") {
    return (
      <div className={`bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 text-sm font-medium mb-1">Investment Disclaimer</p>
            <p className="text-amber-200/70 text-xs leading-relaxed">
              The information provided is for general informational purposes only and should not be considered 
              as financial, legal, or investment advice. Past performance is not indicative of future results. 
              Please consult with qualified professionals before making any investment decisions.
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
              AI-generated analysis and recommendations are provided for informational purposes only. 
              Results may vary and should be verified independently. These tools are proprietary to 
              JJ Global Capital and protected under intellectual property laws.
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
        © {currentYear} JJ Global Capital. All Rights Reserved. 
        <span className="block mt-1">
          Developed by <span className="text-gold">Jane Abou Jaoude</span>. 
          Unauthorized reproduction prohibited.
        </span>
      </p>
    </div>
  );
};

export default LegalDisclaimer;
