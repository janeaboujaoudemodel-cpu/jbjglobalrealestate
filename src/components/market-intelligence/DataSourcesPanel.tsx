import { motion } from "framer-motion";
import {
  Database,
  ExternalLink,
  RefreshCw,
  Shield,
} from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";
import { OPEN_DATA_SOURCES } from "@/config/open-data-config";
import {
  MI_EYEBROW,
  MI_H2,
  MI_LEAD,
  MI_CARD_TITLE,
  MI_BODY,
  MI_CAPTION,
} from "./MarketIntelligenceTypography";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <IconTile icon={Icon as any} tone="emerald" size="lg" className={`mi-no-flip ${className}`} />
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
          <div data-mi-source-grid className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3 max-w-6xl mx-auto items-stretch">
            {OPEN_DATA_SOURCES.map((source) => {
              return (
                <motion.div key={source.id} variants={fadeInUp} className="h-full">
                  <article
                    data-mi-source-card
                    data-surface="light"
                    className="mi-source-card surface-light mi-gold-frame flex h-full min-h-[430px] flex-col rounded-2xl p-6"
                  >
                      <div className="flex items-start justify-between gap-3">
                        <IconBox icon={Database} />
                        <span className="mi-chip-champagne shrink-0 capitalize">
                          <RefreshCw className="w-3.5 h-3.5" />
                          {source.updateFrequency}
                        </span>
                      </div>

                      <div className="mt-5 min-h-[9.75rem]">
                        <h3 className={`${MI_CARD_TITLE} mb-1 min-h-[3.25rem]`}>{source.name}</h3>
                        <p className={`${MI_CAPTION} mb-3 min-h-[1rem]`}>{source.provider}</p>
                        <p className={`${MI_BODY} min-h-[4.75rem]`}>{source.description}</p>
                      </div>

                      <div className="mt-4 grid min-h-[5.75rem] content-start grid-cols-2 gap-2">
                        {source.dataTypes.map((type) => (
                          <span key={type} className="mi-chip-champagne justify-center capitalize">
                            {type}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto flex min-h-[2rem] items-center gap-2 pt-5 text-xs font-semibold leading-none text-[#1A1A1A]">
                        <span className="mi-mini-icon"><Shield className="w-3.5 h-3.5" /></span>
                        <span>Official Government Source</span>
                      </div>

                      <a
                        href={source.url || "#"}
                        target={source.url ? "_blank" : undefined}
                        rel={source.url ? "noopener noreferrer" : undefined}
                        aria-disabled={!source.url}
                        data-no-contrast-guard
                        className="mi-cta-emerald mt-4 w-full rounded-lg text-sm"
                      >
                        <span>Visit Source</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                  </article>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
