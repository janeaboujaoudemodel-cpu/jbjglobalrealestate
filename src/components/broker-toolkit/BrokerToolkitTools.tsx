import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Wrench,
  ArrowRight,
  Layout,
  TrendingUp,
  Calculator,
  FileSignature,
  CreditCard,
  Table2,
  Users,
  FolderOpen,
  Video,
  Share2,
  Sparkles,
  Lock,
  Unlock
} from "lucide-react";

const TOOLS = [
  {
    name: 'JBJ AI Property Comparison',
    description: 'Compare up to 3 properties with AI-powered insights',
    icon: Layout,
    link: '/ai-hub',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    tier: 'free',
  },
  {
    name: 'JBJ Property Evaluator',
    description: 'Get instant AI-powered property valuations',
    icon: TrendingUp,
    link: '/property-evaluation',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    tier: 'free',
  },
  {
    name: 'JBJ Mortgage Calculator',
    description: 'Calculate payments and affordability instantly',
    icon: Calculator,
    link: '/mortgage-calculator',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    tier: 'free',
  },
  {
    name: 'JBJ Scan & Sign',
    description: 'Digital document signing and scanning',
    icon: FileSignature,
    link: '/ai-hub',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    tier: 'member',
  },
  {
    name: 'JBJ Business Card Scanner',
    description: 'AI-powered contact extraction from cards',
    icon: CreditCard,
    link: '/business-card-scanner',
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    borderColor: 'border-gold/30',
    tier: 'free',
  },
  {
    name: 'JBJ Spreadsheet',
    description: 'Property tracking and analysis tools',
    icon: Table2,
    link: '/ai-hub',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    tier: 'member',
  },
  {
    name: 'JBJ CRM',
    description: 'Complete lead management system',
    icon: Users,
    link: '/crm',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    tier: 'member',
  },
  {
    name: 'JBJ Documents',
    description: 'Contracts, templates, and files',
    icon: FolderOpen,
    link: '/ai-hub',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    tier: 'member',
  },
  {
    name: 'JBJ Video Meet',
    description: 'HD video calls with clients',
    icon: Video,
    link: '/video-meeting',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    tier: 'member',
  },
  {
    name: 'JBJ Referral Hub',
    description: 'Earn through referrals — Open to everyone',
    icon: Share2,
    link: '/referral',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    tier: 'free',
    badge: 'Open to All',
  },
  {
    name: 'JBJ Content Generator',
    description: 'AI-powered marketing content creation',
    icon: Sparkles,
    link: '/ai-hub',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    tier: 'member',
  },
];

export function BrokerToolkitTools() {
  return (
    <section id="section-tools" className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
            <Wrench className="w-3 h-3 mr-1" />
            AI-Powered Tools
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Professional Tools for <span className="text-purple-400">Modern Brokers</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Generate stunning presentations, manage leads, and close deals faster with our AI-powered toolkit.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <Link to={tool.link}>
                <Card className={`bg-white border border-zinc-200 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 h-full group cursor-pointer`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${tool.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <tool.icon className={`w-6 h-6 ${tool.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-black font-semibold truncate">{tool.name}</h3>
                          {tool.badge && (
                            <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] px-1.5 py-0 flex-shrink-0">
                              {tool.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-zinc-600 text-sm mb-2">{tool.description}</p>
                        <div className="flex items-center gap-2">
                          {tool.tier === 'free' ? (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Unlock className="w-3 h-3" />
                              Free Access
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gold">
                              <Lock className="w-3 h-3" />
                              Member Access
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className={`w-5 h-5 ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
