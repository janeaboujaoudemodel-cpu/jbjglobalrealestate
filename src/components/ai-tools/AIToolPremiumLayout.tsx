import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface AIToolPremiumLayoutProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accentColor: string;
  gradientFrom: string;
  children: ReactNode;
  badge?: string;
}

const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  teal: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    text: "text-teal-400",
    glow: "shadow-teal-500/20",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    text: "text-indigo-400",
    glow: "shadow-indigo-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
    glow: "shadow-rose-500/20",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400",
    glow: "shadow-violet-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    glow: "shadow-pink-500/20",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  lime: {
    bg: "bg-lime-500/10",
    border: "border-lime-500/30",
    text: "text-lime-400",
    glow: "shadow-lime-500/20",
  },
  sky: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    text: "text-sky-400",
    glow: "shadow-sky-500/20",
  },
  gold: {
    bg: "bg-gold/10",
    border: "border-gold/30",
    text: "text-gold",
    glow: "shadow-gold/20",
  },
};

const gradientClasses: Record<string, string> = {
  emerald: "from-emerald-900/40 via-zinc-950 to-zinc-950",
  purple: "from-purple-900/40 via-zinc-950 to-zinc-950",
  blue: "from-blue-900/40 via-zinc-950 to-zinc-950",
  teal: "from-teal-900/40 via-zinc-950 to-zinc-950",
  orange: "from-orange-900/40 via-zinc-950 to-zinc-950",
  indigo: "from-indigo-900/40 via-zinc-950 to-zinc-950",
  rose: "from-rose-900/40 via-zinc-950 to-zinc-950",
  cyan: "from-cyan-900/40 via-zinc-950 to-zinc-950",
  violet: "from-violet-900/40 via-zinc-950 to-zinc-950",
  amber: "from-amber-900/40 via-zinc-950 to-zinc-950",
  pink: "from-pink-900/40 via-zinc-950 to-zinc-950",
  red: "from-red-900/40 via-zinc-950 to-zinc-950",
  lime: "from-lime-900/40 via-zinc-950 to-zinc-950",
  sky: "from-sky-900/40 via-zinc-950 to-zinc-950",
  gold: "from-gold/20 via-zinc-950 to-zinc-950",
};

const AIToolPremiumLayout = ({
  title,
  subtitle,
  icon,
  accentColor,
  gradientFrom,
  children,
  badge = "AI-Powered",
}: AIToolPremiumLayoutProps) => {
  const navigate = useNavigate();
  const colors = colorClasses[accentColor] || colorClasses.gold;
  const gradient = gradientClasses[gradientFrom] || gradientClasses.gold;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${gradient}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-zinc-800/50"
      >
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-zinc-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`p-4 rounded-2xl ${colors.bg} ${colors.border} border shadow-lg ${colors.glow}`}
            >
              {icon}
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-3xl font-bold text-white"
                >
                  {title}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    {badge}
                  </Badge>
                </motion.div>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-zinc-400 mt-2 max-w-2xl"
              >
                {subtitle}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AIToolPremiumLayout;
