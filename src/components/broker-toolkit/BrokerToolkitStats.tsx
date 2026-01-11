import { motion } from "framer-motion";
import { 
  Wrench, 
  BookOpen, 
  Users, 
  Trophy, 
  Download,
  Star
} from "lucide-react";

const STATS = [
  { 
    value: "11+", 
    label: "AI-Powered Tools", 
    icon: Wrench,
    color: "text-purple-400",
    description: "Property comparison, CRM, documents & more"
  },
  { 
    value: "24", 
    label: "Training Modules", 
    icon: BookOpen,
    color: "text-blue-400",
    description: "Videos, guides, and playbooks"
  },
  { 
    value: "4", 
    label: "Free PDF Books", 
    icon: Download,
    color: "text-green-400",
    description: "Objection handling, scripts & more"
  },
  { 
    value: "5", 
    label: "Support Team Members", 
    icon: Users,
    color: "text-pink-400",
    description: "HR, Admin, Coach & Media"
  },
  { 
    value: "∞", 
    label: "Growth Potential", 
    icon: Trophy,
    color: "text-gold",
    description: "Points, levels & rewards"
  },
];

export function BrokerToolkitStats() {
  return (
    <section className="py-12 border-y border-zinc-800 bg-zinc-900/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800/50 mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-white font-medium text-sm mb-1">{stat.label}</div>
              <div className="text-zinc-500 text-xs hidden md:block">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
