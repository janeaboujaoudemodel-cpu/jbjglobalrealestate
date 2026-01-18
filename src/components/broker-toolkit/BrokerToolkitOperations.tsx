import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Building2,
  Headphones,
  FileCheck,
  Clock,
  Shield,
  Phone,
  Mail,
  MessageCircle,
  Users,
  CheckCircle,
  Zap
} from "lucide-react";
import { CONTACT_INFO } from "@/constants/stats";

const OPERATIONS_SERVICES = [
  {
    title: "Contract Processing",
    description: "Fast-track MOU, SPA, and tenancy contract preparation.",
    icon: FileCheck,
    features: ["24-48 hour turnaround", "Legal review included", "Developer coordination"],
  },
  {
    title: "Commission Tracking",
    description: "Real-time tracking of your commissions and payouts.",
    icon: Clock,
    features: ["Daily updates", "Transparent breakdown", "Direct bank transfer"],
  },
  {
    title: "Compliance Support",
    description: "RERA compliance assistance and documentation.",
    icon: Shield,
    features: ["Form A/F processing", "License renewal support", "DLD liaison"],
  },
  {
    title: "Developer Relations",
    description: "Direct coordination with developer sales teams.",
    icon: Building2,
    features: ["Unit reservations", "Payment plan negotiations", "Early access to launches"],
  },
];

const SUPPORT_CHANNELS = [
  {
    channel: "WhatsApp",
    description: "Instant responses 7 days a week",
    icon: MessageCircle,
    action: `https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent("Hi, I need operations support")}`,
    color: "text-green-400",
  },
  {
    channel: "Phone",
    description: "Direct line to operations",
    icon: Phone,
    action: `tel:${CONTACT_INFO.phoneRaw}`,
    color: "text-blue-400",
  },
  {
    channel: "Email",
    description: "Detailed inquiries & documentation",
    icon: Mail,
    action: `mailto:${CONTACT_INFO.supportEmail}`,
    color: "text-gold",
  },
];

export function BrokerToolkitOperations() {
  return (
    <section id="section-operations" className="py-16 md:py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/50 mb-4">
            <Headphones className="w-3 h-3 mr-1" />
            Operations Team
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Operations <span className="text-indigo-300">Support</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Dedicated operations team to handle contracts, compliance, and administrative tasks so you can focus on closing deals.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {OPERATIONS_SERVICES.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-indigo-900/40 border border-indigo-500/30 hover:border-indigo-400 transition-all h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <service.icon className="w-6 h-6 text-indigo-200" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-2">{service.title}</h3>
                      <p className="text-indigo-200/70 text-sm mb-3">{service.description}</p>
                      <div className="space-y-1">
                        {service.features.map((feature, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-indigo-300/80">
                            <CheckCircle className="w-3 h-3 text-indigo-400" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Operations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-indigo-950/80 to-indigo-900/40 border border-indigo-500/30 rounded-2xl p-8"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-indigo-300" />
              Contact Operations Team
            </h3>
            <p className="text-indigo-200/60 text-sm mt-2">
              Average response time: Under 2 hours during business hours
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {SUPPORT_CHANNELS.map((channel, i) => (
              <a
                key={i}
                href={channel.action}
                target={channel.channel === "WhatsApp" ? "_blank" : undefined}
                rel={channel.channel === "WhatsApp" ? "noopener noreferrer" : undefined}
              >
                <Card className="bg-indigo-900/60 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-800/60 transition-all cursor-pointer">
                  <CardContent className="p-5 text-center">
                    <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <channel.icon className={`w-6 h-6 ${channel.color}`} />
                    </div>
                    <h4 className="text-white font-medium mb-1">{channel.channel}</h4>
                    <p className="text-indigo-200/60 text-xs">{channel.description}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
