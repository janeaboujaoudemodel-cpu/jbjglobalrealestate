import { Shield, Lock } from "lucide-react";
import { FounderContent } from "@/components/FounderContent";

interface CopyrightNoticeProps {
  variant?: "inline" | "banner" | "floating";
  className?: string;
}

const CopyrightNotice = ({ variant = "inline", className = "" }: CopyrightNoticeProps) => {
  const currentYear = new Date().getFullYear();

  if (variant === "banner") {
    return (
      <div className={`bg-[#FDFBF7]/95 backdrop-blur-md py-4 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center">
            <Shield className="w-5 h-5 text-[#1A1A1A] flex-shrink-0" />
            <p className="text-white/70 text-xs md:text-sm">
              <span className="text-[#1A1A1A] font-semibold">© {currentYear} JBJ Global Real Estate.</span>{" "}
              All rights reserved. This platform, including all AI tools, designs, and intellectual property, 
              is exclusively owned by <span className="text-white">JBJ Global Real Estate</span>.
              <FounderContent>
                <span className="text-white"> (Founder & CEO Jane Bou Jaoude)</span>
              </FounderContent>
              Unauthorized reproduction is strictly prohibited.
            </p>
            <Lock className="w-4 h-4 text-[#1A1A1A]/70 flex-shrink-0 hidden md:block" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div className={`fixed bottom-4 left-4 z-40 max-w-xs ${className}`}>
        <div className="bg-[#1A1A1A]/90 backdrop-blur-xl border-0 rounded-lg px-4 py-3 shadow-2xl shadow-black/50">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#1A1A1A] text-xs font-semibold mb-1">Protected Content</p>
              <p className="text-white/90 text-[10px] leading-relaxed">
                © {currentYear} JBJ Global Real Estate. All intellectual property rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Shield className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
      <p className="text-white/90 text-xs">
        © {currentYear} JBJ Global Real Estate. All Rights Reserved.
      </p>
    </div>
  );
};

export default CopyrightNotice;
