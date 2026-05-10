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
    color: "text-[#1A1A1A]",
    description: "Points, levels & rewards"
  },
];

export function BrokerToolkitStats() {
  return (
    <section className="py-12 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] relative">
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              {/* Card with darker champagne fill, equal sizing */}
              <div className="bg-gradient-to-br from-[#EFE6D6] via-[#ECE2D2] to-[#D8C7A6] border-2 border-[#1A1A1A] rounded-xl p-4 h-full flex flex-col items-center justify-center transition-all duration-300 group-hover:border-[#B89555] group-hover:shadow-lg group-hover:shadow-gold/20">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#1A1A1A] mb-2 group-hover:bg-[#EFE6D6] transition-all">
                  <stat.icon className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-0.5">
                  {stat.value}
                </div>
                <div className="text-[#1A1A1A] font-semibold text-xs mb-0.5">{stat.label}</div>
                <div className="text-[#1A1A1A]/70 text-[10px] hidden md:block leading-tight">{stat.description}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}