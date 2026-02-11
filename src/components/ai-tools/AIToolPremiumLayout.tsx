import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";

interface AIToolPremiumLayoutProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accentColor: string;
  gradientFrom: string;
  children: ReactNode;
  badge?: string;
  description?: string;
  showFinancialDisclaimer?: boolean;
}

const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string; gradient: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/20",
    gradient: "from-emerald-400 to-green-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
    gradient: "from-purple-400 to-violet-400",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
    gradient: "from-blue-400 to-cyan-400",
  },
  teal: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    text: "text-teal-400",
    glow: "shadow-teal-500/20",
    gradient: "from-teal-400 to-cyan-400",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
    gradient: "from-orange-400 to-amber-400",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    text: "text-indigo-400",
    glow: "shadow-indigo-500/20",
    gradient: "from-indigo-400 to-purple-400",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
    glow: "shadow-rose-500/20",
    gradient: "from-rose-400 to-pink-400",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
    gradient: "from-cyan-400 to-blue-400",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400",
    glow: "shadow-violet-500/20",
    gradient: "from-violet-400 to-purple-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
    gradient: "from-amber-400 to-yellow-400",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    glow: "shadow-pink-500/20",
    gradient: "from-pink-400 to-rose-400",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-red-500/20",
    gradient: "from-red-400 to-rose-400",
  },
  lime: {
    bg: "bg-lime-500/10",
    border: "border-lime-500/30",
    text: "text-lime-400",
    glow: "shadow-lime-500/20",
    gradient: "from-lime-400 to-green-400",
  },
  sky: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    text: "text-sky-400",
    glow: "shadow-sky-500/20",
    gradient: "from-sky-400 to-blue-400",
  },
  gold: {
    bg: "bg-gold/10",
    border: "border-gold/30",
    text: "text-gold",
    glow: "shadow-gold/20",
    gradient: "from-gold to-amber-400",
  },
};

const gradientClasses: Record<string, string> = {
  emerald: "from-emerald-950/60 via-emerald-950/30 to-black",
  purple: "from-purple-950/60 via-purple-950/30 to-black",
  blue: "from-blue-950/60 via-blue-950/30 to-black",
  teal: "from-teal-950/60 via-teal-950/30 to-black",
  orange: "from-orange-950/60 via-orange-950/30 to-black",
  indigo: "from-indigo-950/60 via-indigo-950/30 to-black",
  rose: "from-rose-950/60 via-rose-950/30 to-black",
  cyan: "from-cyan-950/60 via-cyan-950/30 to-black",
  violet: "from-violet-950/60 via-violet-950/30 to-black",
  amber: "from-amber-950/60 via-amber-950/30 to-black",
  pink: "from-pink-950/60 via-pink-950/30 to-black",
  red: "from-red-950/60 via-red-950/30 to-black",
  lime: "from-lime-950/60 via-lime-950/30 to-black",
  sky: "from-sky-950/60 via-sky-950/30 to-black",
  gold: "from-gold/20 via-zinc-950 to-black",
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const AIToolPremiumLayout = ({
  title,
  subtitle,
  icon,
  accentColor,
  gradientFrom,
  children,
  badge = "AI-Powered",
  description,
  showFinancialDisclaimer = false,
}: AIToolPremiumLayoutProps) => {
  const navigate = useNavigate();
  const colors = colorClasses[accentColor] || colorClasses.gold;
  const gradient = gradientClasses[gradientFrom] || gradientClasses.gold;

  // Extract the gradient word from title (usually the second word or last word)
  const titleWords = title.split(" ");
  const gradientWordIndex = titleWords.findIndex(word => 
    word.toLowerCase().includes("calculator") || 
    word.toLowerCase().includes("predictor") || 
    word.toLowerCase().includes("analyzer") ||
    word.toLowerCase().includes("insights") ||
    word.toLowerCase().includes("handler") ||
    word.toLowerCase().includes("scheduler") ||
    word.toLowerCase().includes("summarizer") ||
    word.toLowerCase().includes("hub") ||
    word.toLowerCase().includes("report") ||
    word.toLowerCase().includes("generator") ||
    word.toLowerCase().includes("script") ||
    word.toLowerCase().includes("reviewer") ||
    word.toLowerCase().includes("qualification") ||
    word.toLowerCase().includes("analysis")
  );
  
  const beforeGradient = gradientWordIndex > 0 ? titleWords.slice(0, gradientWordIndex).join(" ") : title.split(" ")[0];
  const gradientWord = gradientWordIndex >= 0 ? titleWords.slice(gradientWordIndex).join(" ") : titleWords.slice(1).join(" ");

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - Colored Gradient Theme */}
      <section className={`pt-32 pb-16 bg-gradient-to-b ${gradient}`}>
        <div className="container mx-auto px-4">
          {/* Back Button - Always readable on dark backgrounds */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="dark-outline"
              size="sm"
              onClick={() => {
                // Check referrer to determine if there's a real previous page
                const referrer = document.referrer;
                const hasRealHistory = referrer && referrer.includes(window.location.hostname);
                if (hasRealHistory) {
                  navigate(-1);
                } else {
                  navigate('/toolkit');
                }
              }}
              className="mb-6 relative z-10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bg} border ${colors.border} rounded-full mb-6`}>
              <div className={colors.text}>{icon}</div>
              <span className={`${colors.text} text-xs font-semibold uppercase tracking-wider`}>{badge}</span>
            </div>
            
            {/* Title with gradient colored word */}
            <h1 
              className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {beforeGradient}{" "}
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${colors.gradient}`}>
                {gradientWord}
              </span>
            </h1>
            
            {/* Subtitle/Description */}
            <p className="text-zinc-400 text-lg md:text-xl mb-4">
              {subtitle}
            </p>
            
            {/* Powered by AI */}
            <p className={`${colors.text} opacity-70 text-sm`}>
              <Sparkles className="inline h-4 w-4 mr-1" />
              Powered by AI • Data-driven insights • Real-time analysis
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            {children}

            {showFinancialDisclaimer && (
              <div className="mt-8 p-4 bg-zinc-900/60 border border-gold/20 rounded-xl">
                <p className="text-zinc-400 text-sm leading-relaxed">
                  <strong className="text-zinc-300">Disclaimer:</strong> This AI-generated analysis is for informational purposes only. Does not constitute financial, investment, or legal advice.{" "}
                  <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
                  Past performance does not guarantee future results.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AIToolPremiumLayout;