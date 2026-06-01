import { motion } from "framer-motion";
import { Wrench, BookOpen, Users, Trophy, Download } from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";

const STATS = [
  {
    value: "11+",
    label: "AI-Powered Tools",
    icon: Wrench,
    description: "Property comparison, CRM, documents & more",
  },
  {
    value: "24",
    label: "Training Modules",
    icon: BookOpen,
    description: "Videos, guides, and playbooks",
  },
  {
    value: "4",
    label: "Free PDF Books",
    icon: Download,
    description: "Objection handling, scripts & more",
  },
  {
    value: "5",
    label: "Support Team Members",
    icon: Users,
    description: "HR, Admin, Coach & Media",
  },
  {
    value: "∞",
    label: "Growth Potential",
    icon: Trophy,
    description: "Points, levels & rewards",
  },
];

export function BrokerToolkitStats() {
  return (
    <section className="jj-band jj-band--surface py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              viewport={{ once: true }}
              className="bg-[#FDFBF7] rounded-2xl p-5 flex flex-col items-center text-center border border-[#B89555]/25 hover:border-[#B89555]/55 transition-colors"
            >
              <IconTile icon={stat.icon} tone="gold" size="md" className="mb-3" />
              <div className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] leading-none mb-1.5">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-[#1A1A1A] mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-[#1A1A1A]/65 leading-snug hidden md:block">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
