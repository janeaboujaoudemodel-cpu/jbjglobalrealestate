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
  daily: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  weekly: 'bg-blue-100 text-blue-700 border-blue-300',
  monthly: 'bg-amber-100 text-amber-700 border-amber-300',
  quarterly: 'bg-purple-100 text-purple-700 border-purple-300',
};

/* ============================================================
 * ICON BOX STYLE - Active Champagne + Gold Border + Black Icon
 * ============================================================ */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div 
    className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 border-gold transition-all duration-300 hover:shadow-[0_8px_20px_rgba(200,167,102,0.4)] ${className}`}
    style={{
      background: 'linear-gradient(135deg, hsl(32 28% 13%) 0%, hsl(33 27% 15%) 50%, hsl(33 28% 11%) 100%)',
    }}
  >
    <Icon className="w-6 h-6 text-gold" />
  </div>
);

export const DataSourcesPanel = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <div className="jj-layer-2">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
              Powered by Official Open Data
            </h2>
            <p className="text-gold/70 max-w-2xl mx-auto">
              All Market Intelligence is derived exclusively from official government Open Data sources. 
              We do not scrape, republish, or use proprietary third-party data.
            </p>
          </motion.div>

          {/* Data Sources Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {OPEN_DATA_SOURCES.map((source) => (
              <motion.div key={source.id} variants={fadeInUp}>
                <Card className="jj-card-inner hover:border-white transition-all h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <IconBox icon={Database} />
                      <Badge className={`${frequencyColors[source.updateFrequency]} border`}>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        {source.updateFrequency}
                      </Badge>
                    </div>

                    <h3 className="text-black font-semibold text-lg mb-1">{source.name}</h3>
                    <p className="text-gold text-sm mb-3">{source.provider}</p>
                    <p className="text-black/90 text-sm mb-4">{source.description}</p>

                    {/* Data Types */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {source.dataTypes.map((type) => (
                        <span 
                          key={type}
                          className="px-2 py-1 bg-white/50 text-black/70 text-xs rounded-md capitalize"
                        >
                          {type}
                        </span>
                      ))}
                    </div>

                    {/* Verification Badge */}
                    <div className="flex items-center gap-2 text-emerald-600 text-xs">
                      <Shield className="w-4 h-4" />
                      Official Government Source
                    </div>

                    {source.url && (
                      <a 
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-gold hover:text-black text-sm mt-4 transition-colors"
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
                className="flex items-center gap-2 text-black font-medium"
              >
                <item.icon className="w-5 h-5 text-emerald-600" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};