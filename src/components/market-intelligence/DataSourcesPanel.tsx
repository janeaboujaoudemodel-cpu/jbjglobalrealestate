import { motion } from "framer-motion";
import { 
  Database, RefreshCw, Shield, CheckCircle,
  ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OPEN_DATA_SOURCES } from "@/config/open-data-config";
import {
  MI_EYEBROW,
  MI_H2,
  MI_LEAD,
  MI_CARD_TITLE,
  MI_BODY,
  MI_BODY_MUTED,
  MI_CAPTION,
  MI_CHIP,
} from "./MarketIntelligenceTypography";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

/* Data-viz semantic palette for cadence (kept as Tailwind utilities, not inline hex). */
const frequencyClasses: Record<string, string> = {
  daily: 'bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/45',
  weekly: 'bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/35',
  monthly: 'bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/45',
  quarterly: 'bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/45',
};

const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div className={`mi-icon-tile mi-icon-tile-lg mi-no-flip ${className}`}>
    <Icon className="w-5 h-5" />
  </div>
);

export const DataSourcesPanel = () => {
  return (
    <section className="surface-light py-10 bg-[#FDFBF7]" data-surface="light">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {/* Section Header */}
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <span className={`${MI_EYEBROW} mb-4 block`}>
              Understanding the Market
            </span>
            <h2 className={`${MI_H2} mb-4`}>
              Powered by Official Government Sources
            </h2>
            <p className={`${MI_LEAD} max-w-2xl mx-auto`}>
              Market Intelligence is powered by official government sources and JBJ review workflows, with daily freshness checks for live-facing market context.
            </p>
          </motion.div>

          {/* Data Sources Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {OPEN_DATA_SOURCES.map((source) => {
              return (
                <motion.div key={source.id} variants={fadeInUp}>
                  <Card className="mi-gold-frame h-full rounded-2xl transition-shadow hover:shadow-[0_18px_40px_rgba(26,26,26,0.10)]">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <IconBox icon={Database} />
                        <span className="mi-chip-emerald shrink-0 capitalize">
                          <RefreshCw className="w-3.5 h-3.5" />
                          {source.updateFrequency}
                        </span>
                      </div>

                      <h3 className={`${MI_CARD_TITLE} mb-1`}>{source.name}</h3>
                      <p className={`${MI_CAPTION} mb-3`}>{source.provider}</p>
                      <p className={`${MI_BODY} mb-4`}>{source.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {source.dataTypes.map((type) => (
                          <span key={type} className="mi-chip-emerald capitalize">
                            {type}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold leading-none text-[#1A1A1A] mb-4">
                        <Shield className="w-4 h-4 text-[#064E3B]" />
                        Official Government Source
                      </div>

                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-no-contrast-guard
                          className="mi-cta-emerald w-full text-sm rounded-lg"
                        >
                          <span>Visit Source</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
