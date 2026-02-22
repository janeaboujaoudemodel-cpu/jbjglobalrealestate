import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  GraduationCap,
  Award,
  CheckCircle,
  ArrowUpRight,
  Clock,
  BadgeCheck,
  FileText,
  Star
} from "lucide-react";

const CERTIFICATIONS = [
  {
    title: "Digital Marketing Mastery",
    duration: "6 hours",
    modules: 10,
    description: "Social media strategies, lead generation, content creation, and personal branding for brokers.",
    badge: "Certified",
  },
  {
    title: "Quality & Service Excellence",
    duration: "5 hours",
    modules: 8,
    description: "Delivering 5-star customer experiences, handling complaints, and exceeding expectations.",
    badge: "Excellence",
  },
  {
    title: "Client Relations & Communication",
    duration: "6 hours",
    modules: 9,
    description: "Building rapport, active listening, negotiation psychology, and maintaining long-term relationships.",
    badge: "Professional",
  },
  {
    title: "Luxury Sales Specialist",
    duration: "8 hours",
    modules: 12,
    description: "VIP client handling, high-net-worth psychology, ultra-premium property positioning.",
    badge: "Elite",
  },
  {
    title: "Business Development Pro",
    duration: "5 hours",
    modules: 7,
    description: "Prospecting strategies, networking techniques, referral systems, and partnership building.",
    badge: "Advanced",
  },
  {
    title: "Time Management & Productivity",
    duration: "4 hours",
    modules: 6,
    description: "Prioritization, goal setting, workflow optimization, and work-life balance for sales professionals.",
    badge: "Master",
  },
];

// Unified light blue theme for all certification cards with glow effect
const CARD_THEME = {
  bg: "bg-black/40 backdrop-blur-sm",
  border: "border-2 border-sky-400/50 hover:border-sky-300",
  glow: "shadow-[0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)]",
  iconBg: "bg-sky-500/20 border border-sky-400/30",
  iconText: "text-sky-400",
  badge: "bg-sky-500/20 text-sky-300 border-sky-400/30",
};

export function BrokerToolkitAcademy() {
  return (
    <section id="section-academy" className="py-8 md:py-10 bg-black">
      <div className="container mx-auto px-4">
        {/* Active Sky Blue Layer */}
        <div className="bg-gradient-to-br from-sky-900/90 via-sky-900/80 to-sky-950/90 border border-sky-500/30 rounded-2xl p-6 md:p-8 shadow-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-sky-500/20 text-sky-300 border-sky-400/30 mb-4">
              <GraduationCap className="w-3 h-3 mr-1" />
              JBJ Academy
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Professional <span className="text-sky-400">Development Courses</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Complete our internal certification courses and earn verified JBJ badges. 
              Go beyond real estate with skills in marketing, client relations, and business development.
            </p>
          </motion.div>

          {/* Certifications Grid - All cards with unified light blue glow theme */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {CERTIFICATIONS.map((cert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`${CARD_THEME.bg} ${CARD_THEME.border} ${CARD_THEME.glow} transition-all h-full`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${CARD_THEME.iconBg} rounded-xl flex items-center justify-center`}>
                        <Award className={`w-6 h-6 ${CARD_THEME.iconText}`} />
                      </div>
                      <Badge className={CARD_THEME.badge}>
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        {cert.badge}
                      </Badge>
                    </div>
                    <h3 className="text-sky-300 font-semibold text-lg mb-2">{cert.title}</h3>
                    <p className="text-zinc-400 text-sm mb-4">{cert.description}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {cert.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {cert.modules} modules
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Benefits Section - Premium Blue 3D Box with Blue & White Glow */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98, rotateX: 2 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            whileHover={{ scale: 1.02, rotateX: -2, rotateY: 2 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative bg-gradient-to-br from-sky-600 via-sky-700 to-sky-800 border-2 border-sky-400/60 rounded-2xl p-8 text-center overflow-hidden"
            style={{
              boxShadow: `
                0 0 40px rgba(56,189,248,0.4),
                0 0 60px rgba(255,255,255,0.15),
                0 20px 40px rgba(0,0,0,0.3),
                inset 0 2px 4px rgba(255,255,255,0.2),
                inset 0 -2px 4px rgba(0,0,0,0.2)
              `,
              transform: "perspective(1000px) translateZ(0)",
            }}
          >
            {/* 3D Shine effect */}
            <span className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-2xl" />
            
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-center gap-2 relative z-10">
              <Star className="w-5 h-5 text-gold" />
              Why Get Certified?
            </h3>
            <div className="grid md:grid-cols-4 gap-6 relative z-10">
              {[
                "Verified badge on your profile",
                "Priority lead allocation",
                "Higher commission tiers",
                "Access to VIP training"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 justify-center text-white text-sm">
                  <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
