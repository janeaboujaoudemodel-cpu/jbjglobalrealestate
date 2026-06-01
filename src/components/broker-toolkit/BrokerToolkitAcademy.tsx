import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { GraduationCap, Award, Clock, FileText, CheckCircle, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const CERTIFICATIONS = [
  { title: "Digital Marketing Mastery", duration: "6 hours", modules: 10, description: "Social media strategies, lead generation, and personal branding for brokers.", badge: "Certified" },
  { title: "Quality & Service Excellence", duration: "5 hours", modules: 8, description: "Delivering 5-star customer experiences and exceeding expectations.", badge: "Excellence" },
  { title: "Client Relations & Communication", duration: "6 hours", modules: 9, description: "Building rapport, active listening, and negotiation psychology.", badge: "Professional" },
  { title: "Luxury Sales Specialist", duration: "8 hours", modules: 12, description: "VIP client handling and ultra-premium property positioning.", badge: "Elite" },
  { title: "Business Development Pro", duration: "5 hours", modules: 7, description: "Prospecting, networking, and partnership building.", badge: "Advanced" },
  { title: "Time Management & Productivity", duration: "4 hours", modules: 6, description: "Prioritization, goal setting, and workflow optimization.", badge: "Master" },
];

const BENEFITS = [
  "Verified badge on your profile",
  "Priority lead allocation",
  "Higher commission tiers",
  "Access to VIP training",
];

export function BrokerToolkitAcademy() {
  return (
    <section id="section-academy" className="jj-band jj-band--surface py-14 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 mb-3">
            <GraduationCap className="w-3 h-3 mr-1.5" />
            JBJ Academy
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1A1A1A] mb-3">
            Professional development courses
          </h2>
          <p className="text-[#1A1A1A]/70 text-base">
            Earn verified JBJ badges and go beyond real estate with marketing, client relations, and business development.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto mb-10">
          {CERTIFICATIONS.map((cert, i) => (
            <motion.div
              key={cert.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              viewport={{ once: true }}
              className="bg-[#FDFBF7] border border-[#B89555]/25 hover:border-[#B89555]/55 rounded-2xl p-5 h-full flex flex-col transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <IconTile icon={Award} tone="gold" size="md" />
                <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 font-semibold">
                  {cert.badge}
                </span>
              </div>
              <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1.5 leading-snug">
                {cert.title}
              </h3>
              <p className="text-[13px] text-[#1A1A1A]/65 leading-relaxed flex-1 mb-4">
                {cert.description}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-[#1A1A1A]/60 pt-3 border-t border-[#B89555]/15">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {cert.duration}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {cert.modules} modules
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#FDFBF7] border border-[#B89555]/25 rounded-2xl p-6 md:p-8 max-w-5xl mx-auto"
        >
          <h3 className="text-center text-[15px] font-semibold text-[#1A1A1A] mb-5">
            Why get certified?
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-[#1A1A1A]/80">
                <CheckCircle className="w-4 h-4 text-[#B89555] flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Link
              to="/jbj-academy"
              data-cta="academy-open"
              className="jj-cta-dark inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium"
            >
              Open JBJ Academy
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
