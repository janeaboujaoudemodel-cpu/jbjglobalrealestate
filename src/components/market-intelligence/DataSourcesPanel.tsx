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
  daily: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  weekly: 'bg-blue-100 text-blue-800 border-blue-300',
  monthly: 'bg-amber-100 text-amber-800 border-amber-300',
  quarterly: 'bg-violet-100 text-violet-800 border-violet-300',
};

const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div
    data-no-contrast-guard
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 bg-[#102540] border border-[#102540]/40 shadow-sm allow-white ${className}`}
  >
    <Icon className="w-6 h-6 text-white allow-white" />
  </div>
);

export const DataSourcesPanel = () => {
  return (
    <section className="surface-light py-16 bg-background" data-surface="light">
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
              All Market Intelligence is derived exclusively from official government sources
              and licensed market data partners. We do not scrape, republish, or rely on
              proprietary third-party platforms.
            </p>
          </motion.div>

          {/* Data Sources Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {OPEN_DATA_SOURCES.map((source) => {
              const fc = frequencyClasses[source.updateFrequency] || frequencyClasses.monthly;
              return (
                <motion.div key={source.id} variants={fadeInUp}>
                  <Card className="h-full transition-all hover:shadow-lg bg-card border-2 border-[#102540]/45">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <IconBox icon={Database} />
                        <Badge className={`whitespace-nowrap border ${fc}`}>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          {source.updateFrequency}
                        </Badge>
                      </div>

                      <h3 className={`${MI_CARD_TITLE} mb-1`}>{source.name}</h3>
                      <p className={`${MI_CAPTION} mb-3`}>{source.provider}</p>
                      <p className={`${MI_BODY} mb-4`}>{source.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {source.dataTypes.map((type) => (
                          <span
                            key={type}
                            className={`${MI_CHIP} px-2 py-1 rounded-md capitalize bg-muted text-foreground`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold leading-none text-emerald-700">
                        <Shield className="w-4 h-4" />
                        Official Government Source
                      </div>

                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm mt-4 font-semibold leading-none underline-offset-4 hover:underline text-foreground"
                        >
                          Visit Source
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Trust Indicators */}
          <motion.div
            className="mt-12 flex flex-wrap justify-center gap-6"
            variants={fadeInUp}
          >
            {[
              { icon: CheckCircle, text: 'No Scraping' },
              { icon: CheckCircle, text: 'No Private Platforms' },
              { icon: CheckCircle, text: 'Official Sources Only' },
              { icon: CheckCircle, text: 'Analytics & Aggregation' },
            ].map((item) => (
              <div
                key={item.text}
                className={`${MI_BODY} flex items-center gap-2`}
              >
                <item.icon className="w-5 h-5 text-emerald-700" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
