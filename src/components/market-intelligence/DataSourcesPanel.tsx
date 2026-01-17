import { motion } from "framer-motion";
import { 
  Database, RefreshCw, Shield, CheckCircle,
  ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OPEN_DATA_SOURCES } from "@/config/open-data-config";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const frequencyColors = {
  daily: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  weekly: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  monthly: 'bg-gold/10 text-gold border-gold/30',
  quarterly: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export const DataSourcesPanel = () => {
  return (
    <section className="py-16">
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
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
              Data Sources
            </span>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Powered by Official Open Data
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              All Market Intelligence is derived exclusively from official government Open Data sources. 
              We do not scrape, republish, or use proprietary third-party data.
            </p>
          </motion.div>

          {/* Data Sources Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {OPEN_DATA_SOURCES.map((source) => (
              <motion.div key={source.id} variants={fadeInUp}>
                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
                        <Database className="w-6 h-6 text-gold" />
                      </div>
                      <Badge className={`${frequencyColors[source.updateFrequency]} border`}>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        {source.updateFrequency}
                      </Badge>
                    </div>

                    <h3 className="text-white font-semibold text-lg mb-1">{source.name}</h3>
                    <p className="text-gold/80 text-sm mb-3">{source.provider}</p>
                    <p className="text-zinc-500 text-sm mb-4">{source.description}</p>

                    {/* Data Types */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {source.dataTypes.map((type) => (
                        <span 
                          key={type}
                          className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-md capitalize"
                        >
                          {type}
                        </span>
                      ))}
                    </div>

                    {/* Verification Badge */}
                    <div className="flex items-center gap-2 text-emerald-400 text-xs">
                      <Shield className="w-4 h-4" />
                      Official Government Source
                    </div>

                    {source.url && (
                      <a 
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-gold hover:text-gold-light text-sm mt-4 transition-colors"
                      >
                        Visit Source
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
                className="flex items-center gap-2 text-zinc-400"
              >
                <item.icon className="w-5 h-5 text-emerald-400" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
