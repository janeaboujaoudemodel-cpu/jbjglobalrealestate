import { motion } from "framer-motion";
import { Sparkles, Clock } from "lucide-react";

interface FreeAccessBadgeProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export default function FreeAccessBadge({ variant = "default", className = "" }: FreeAccessBadgeProps) {
  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 border border-white/20 rounded-full text-white text-xs font-medium ${className}`}>
        <Sparkles className="w-3 h-3" />
        FREE
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-white" />
        <span className="text-white text-xs font-semibold uppercase tracking-wide">Free Access</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/20 rounded-xl ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-bold">Limited Time: FREE Access</p>
          <p className="text-white/50 text-xs">No credit card required</p>
        </div>
      </div>
      <Clock className="w-4 h-4 text-white/60 animate-pulse" />
    </motion.div>
  );
}
