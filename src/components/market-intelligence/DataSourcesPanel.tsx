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

const frequencyColors: Record<string, { bg: string; fg: string; bd: string }> = {
  daily: { bg: '#D1FAE5', fg: '#065F46', bd: '#6EE7B7' },
  weekly: { bg: '#DBEAFE', fg: '#1E3A8A', bd: '#93C5FD' },
  monthly: { bg: '#FEF3C7', fg: '#92400E', bd: '#FCD34D' },
  quarterly: { bg: '#EDE9FE', fg: '#5B21B6', bd: '#C4B5FD' },
};

const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{ backgroundColor: '#000000', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
  >
    <Icon className="w-6 h-6" style={{ color: '#ffffff' }} />
  </div>
);

export const DataSourcesPanel = () => {
  return (
    <section className="py-16" style={{ backgroundColor: '#FFFFFF' }} data-surface="light">
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
            <span className="text-xs uppercase tracking-[0.3em] mb-4 block font-semibold" style={{ color: '#6b7280' }}>
              Data Sources
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#000000' }}>
              Powered by Official Open Data
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: '#374151' }}>
              All Market Intelligence is derived exclusively from official government Open Data sources.
              We do not scrape, republish, or use proprietary third-party data.
            </p>
          </motion.div>

          {/* Data Sources Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {OPEN_DATA_SOURCES.map((source) => {
              const fc = frequencyColors[source.updateFrequency] || frequencyColors.monthly;
              return (
                <motion.div key={source.id} variants={fadeInUp}>
                  <Card
                    className="h-full transition-all hover:shadow-lg"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <IconBox icon={Database} />
                        <Badge
                          className="whitespace-nowrap border"
                          style={{ backgroundColor: fc.bg, color: fc.fg, borderColor: fc.bd }}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" style={{ color: fc.fg }} />
                          {source.updateFrequency}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg mb-1" style={{ color: '#000000' }}>{source.name}</h3>
                      <p className="text-sm mb-3 font-medium" style={{ color: '#4B5563' }}>{source.provider}</p>
                      <p className="text-sm mb-4" style={{ color: '#1F2937' }}>{source.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {source.dataTypes.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 font-medium text-xs rounded-md capitalize"
                            style={{ backgroundColor: '#F3F4F6', color: '#000000' }}
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium" style={{ color: '#059669' }}>
                        <Shield className="w-4 h-4" style={{ color: '#059669' }} />
                        Official Government Source
                      </div>

                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm mt-4 font-semibold underline-offset-4 hover:underline"
                          style={{ color: '#000000' }}
                        >
                          Visit Source
                          <ExternalLink className="w-3 h-3" style={{ color: '#000000' }} />
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
                className="flex items-center gap-2 font-medium"
                style={{ color: '#000000' }}
              >
                <item.icon className="w-5 h-5" style={{ color: '#059669' }} />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};