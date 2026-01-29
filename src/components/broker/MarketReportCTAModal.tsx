import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Sparkles, 
  Target, 
  ArrowRight,
  Crown,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { FounderContent } from "@/components/FounderContent";

interface MarketReportCTAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
}

const CTA_OPTIONS = [
  {
    id: "resources",
    title: "Broker Toolkit",
    subtitle: "Guides & Resources",
    description: "Practical guides covering closing techniques, lead generation, and market insights",
    icon: GraduationCap,
    color: "from-purple-500 to-purple-700",
    benefits: ["Educational guides", "Expert insights", "Free resources"],
    href: "/broker-toolkit#resources",
  },
  {
    id: "tools",
    title: "Professional Tools",
    subtitle: "AI-Powered Solutions",
    description: "Generate property reports, AI comparisons, and branded materials in seconds",
    icon: Sparkles,
    color: "from-blue-500 to-blue-700",
    benefits: ["PDF generator", "AI recommendations", "Property analysis"],
    href: "/ai-hub",
  },
  {
    id: "full",
    title: "All Resources",
    subtitle: "Tools + Guides",
    description: "Access all our AI tools and educational resources for free",
    icon: Crown,
    color: "from-gold to-gold-dark",
    benefits: ["All tools included", "Free access", "Regular updates"],
    href: "/broker-toolkit",
    recommended: true,
  },
];

export default function MarketReportCTAModal({ 
  open, 
  onOpenChange, 
  userName 
}: MarketReportCTAModalProps) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedOption) {
      const option = CTA_OPTIONS.find(o => o.id === selectedOption);
      if (option) {
        onOpenChange(false);
        navigate(option.href);
      }
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-white via-zinc-50 to-white border-gold/30 text-zinc-900 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold via-gold to-gold-dark flex items-center justify-center shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl">
            {userName ? `Welcome, ${userName}!` : "Your Report is Ready!"}
          </DialogTitle>
          <DialogDescription className="text-zinc-600 text-base">
            Found the insights valuable? Take your real estate career to the next level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-center text-sm text-zinc-500 mb-4">
            Choose the path that fits your goals:
          </p>

          {CTA_OPTIONS.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedOption(option.id)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all relative overflow-hidden ${
                selectedOption === option.id
                  ? "border-gold bg-gold/5 shadow-lg"
                  : "border-zinc-200 hover:border-zinc-300 bg-white"
              }`}
            >
              {option.recommended && (
                <Badge className="absolute top-3 right-3 bg-gold text-black text-xs">
                  Recommended
                </Badge>
              )}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center flex-shrink-0`}>
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-zinc-900">{option.title}</span>
                    {selectedOption === option.id && (
                      <CheckCircle2 className="w-4 h-4 text-gold" />
                    )}
                  </div>
                  <p className="text-gold text-sm font-medium">{option.subtitle}</p>
                  <p className="text-zinc-500 text-sm mt-1">{option.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {option.benefits.map((benefit, i) => (
                      <Badge 
                        key={i}
                        variant="outline" 
                        className="text-xs border-zinc-300 text-zinc-600"
                      >
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-200">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-zinc-500 hover:text-zinc-700"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedOption}
            className="flex-1 bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110"
          >
            Explore {selectedOption ? CTA_OPTIONS.find(o => o.id === selectedOption)?.title : "Options"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="text-center mt-4">
          <FounderContent fallback={null}>
            <p className="text-zinc-300 text-xs font-medium">Jane Bou Jaoude</p>
            <p className="text-gold text-xs mt-0.5">Founder & CEO</p>
            <p className="text-zinc-500 text-xs mt-0.5">JBJ Global Real Estate</p>
          </FounderContent>
        </div>
      </DialogContent>
    </Dialog>
  );
}
