import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Target,
  Users,
  BarChart3,
  Phone,
  Mail,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Zap
} from "lucide-react";

const CRM_FEATURES = [
  {
    title: "Lead Management",
    description: "Track, organize, and prioritize all your leads in one place",
    icon: Users,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    title: "Pipeline Tracking",
    description: "Visual pipeline to track deals from contact to closing",
    icon: TrendingUp,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Activity Logging",
    description: "Log calls, emails, meetings, and follow-ups automatically",
    icon: BarChart3,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "One-Click Contact",
    description: "Call, email, or WhatsApp leads with a single click",
    icon: Phone,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Email Campaigns",
    description: "Send personalized email campaigns to your leads",
    icon: Mail,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "AI Insights",
    description: "Get AI-powered recommendations for lead prioritization",
    icon: Zap,
    color: "text-gold",
    bgColor: "bg-gold/10",
  },
];

export function BrokerToolkitCRM() {
  return (
    <section id="section-crm" className="py-16 md:py-20 bg-zinc-900/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4">
            <Target className="w-3 h-3 mr-1" />
            CRM & Lead Management
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Manage Leads Like a <span className="text-green-400">Pro</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Our built-in CRM helps you track every lead, automate follow-ups, and close more deals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {CRM_FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white border border-zinc-200 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="text-black font-semibold mb-1">{feature.title}</h3>
                      <p className="text-zinc-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CRM Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Organize Your Leads?
              </h3>
              <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
                Access the full JBJ CRM with lead scoring, pipeline management, and AI-powered insights.
              </p>
              <Link to="/crm">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:brightness-110 px-8">
                  <Target className="w-5 h-5 mr-2" />
                  Open CRM Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
