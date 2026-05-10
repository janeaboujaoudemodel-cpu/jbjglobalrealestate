import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Lightbulb, CheckCircle, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AIToolGuideProps {
  description: string;
  steps: string[];
  benefits: string[];
  accentColor: string;
}

const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", icon: "text-emerald-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", icon: "text-purple-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: "text-blue-400" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400", icon: "text-teal-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: "text-orange-400" },
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", icon: "text-indigo-400" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", icon: "text-rose-400" },
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", icon: "text-cyan-400" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", icon: "text-violet-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-[#1A1A1A]", icon: "text-[#1A1A1A]" },
  pink: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400", icon: "text-pink-400" },
  red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: "text-red-400" },
  lime: { bg: "bg-lime-500/10", border: "border-lime-500/30", text: "text-lime-400", icon: "text-lime-400" },
  sky: { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", icon: "text-sky-400" },
  gold: { bg: "bg-[#EFE6D6]/10", border: "border-[#B89555]/30", text: "text-[#1A1A1A]", icon: "text-[#1A1A1A]" },
};

const AIToolGuide = ({ description, steps, benefits, accentColor }: AIToolGuideProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = colorClasses[accentColor] || colorClasses.gold;

  return (
    <Card className={`${colors.bg} ${colors.border} border mb-6`}>
      <CardContent className="p-4">
        {/* Always visible: Description */}
        <div className="flex items-start gap-3">
          <Lightbulb className={`h-5 w-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className="text-[#1A1A1A]/70 text-sm leading-relaxed">{description}</p>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1 mt-3 text-sm font-medium ${colors.text} hover:underline`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Guide
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  How to Use This Tool
                </>
              )}
            </button>
          </div>
        </div>

        {/* Expandable: Steps & Benefits */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-[#1A1A1A]/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Steps */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className={`h-4 w-4 ${colors.icon}`} />
                    <span className="text-sm font-semibold text-white">How to Use</span>
                  </div>
                  <ol className="space-y-2">
                    {steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[#1A1A1A]/70">
                        <span className={`w-5 h-5 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center flex-shrink-0 text-xs font-bold`}>
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Benefits */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className={`h-4 w-4 ${colors.icon}`} />
                    <span className="text-sm font-semibold text-white">Benefits</span>
                  </div>
                  <ul className="space-y-2">
                    {benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[#1A1A1A]/70">
                        <CheckCircle className={`h-4 w-4 ${colors.icon} flex-shrink-0 mt-0.5`} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default AIToolGuide;
