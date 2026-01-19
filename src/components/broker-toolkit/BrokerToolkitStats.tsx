import { motion } from "framer-motion";
import { 
  Wrench, 
  BookOpen, 
  Users, 
  Trophy, 
  Download
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
    <section className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] relative">
      {/* Top gold glow divider */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)',
          boxShadow: '0 0 20px rgba(212,175,55,0.4), 0 0 40px rgba(212,175,55,0.2)',
        }}
      />
      
      {/* Bottom gold glow divider */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)',
          boxShadow: '0 0 20px rgba(212,175,55,0.4), 0 0 40px rgba(212,175,55,0.2)',
        }}
      />
      
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
              {/* Card with black border, gold on hover */}
              <div className="bg-white/80 border-2 border-black rounded-xl p-4 transition-all duration-300 group-hover:border-gold group-hover:shadow-lg group-hover:shadow-gold/20">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border-2 border-black mb-3 group-hover:border-gold transition-all">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-gold font-semibold text-sm mb-1">{stat.label}</div>
                <div className="text-black text-xs hidden md:block">{stat.description}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}