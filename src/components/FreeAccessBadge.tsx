import { motion } from "framer-motion";
import { Sparkles, Clock } from "lucide-react";

interface FreeAccessBadgeProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export default function FreeAccessBadge({ variant = "default", className = "" }: FreeAccessBadgeProps) {
  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-medium ${className}`}>
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
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-gold/20 border border-emerald-500/30 rounded-full ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Free Access</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-500/10 via-gold/10 to-emerald-500/10 border border-emerald-500/30 rounded-xl ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-emerald-400 text-sm font-bold">Limited Time: FREE Access</p>
          <p className="text-zinc-500 text-xs">No credit card required</p>
        </div>
      </div>
      <Clock className="w-4 h-4 text-gold animate-pulse" />
    </motion.div>
  );
}
