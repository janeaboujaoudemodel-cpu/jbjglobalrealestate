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
    title: "RERA Fundamentals",
    duration: "8 hours",
    modules: 12,
    description: "UAE real estate regulations, laws, and compliance requirements.",
    badge: "Official",
    color: "gold",
  },
  {
    title: "Sales Excellence",
    duration: "6 hours",
    modules: 8,
    description: "Advanced selling techniques, negotiation, and closing mastery.",
    badge: "Professional",
    color: "blue",
  },
  {
    title: "Luxury Property Specialist",
    duration: "10 hours",
    modules: 15,
    description: "Premium market knowledge, VIP client handling, and ultra-luxury sales.",
    badge: "Elite",
    color: "purple",
  },
  {
    title: "Off-Plan Expert",
    duration: "5 hours",
    modules: 7,
    description: "Developer relations, payment plans, and new project launches.",
    badge: "Specialist",
    color: "emerald",
  },
  {
    title: "Digital Marketing Pro",
    duration: "4 hours",
    modules: 6,
    description: "Social media, lead generation, and personal branding.",
    badge: "Certified",
    color: "orange",
  },
  {
    title: "Client Relations Master",
    duration: "5 hours",
    modules: 8,
    description: "Building lasting relationships and maximizing referrals.",
    badge: "Master",
    color: "pink",
  },
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    gold: { bg: "bg-gold/10", border: "border-gold/40", text: "text-gold", badge: "bg-gold/20 text-gold border-gold/30" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400", badge: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    pink: { bg: "bg-pink-500/10", border: "border-pink-500/40", text: "text-pink-400", badge: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  };
  return colors[color] || colors.gold;
};

export function BrokerToolkitAcademy() {
  return (
    <section id="section-academy" className="py-16 md:py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-gold/20 text-gold border-gold/30 mb-4">
            <GraduationCap className="w-3 h-3 mr-1" />
            JBJ Academy
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Certification <span className="text-gold">Courses</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Earn industry-recognized certifications and showcase your expertise with verified badges.
          </p>
        </motion.div>

        {/* Certifications Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {CERTIFICATIONS.map((cert, i) => {
            const colors = getColorClasses(cert.color);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`bg-zinc-900/80 ${colors.border} hover:border-gold/60 transition-all h-full`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                        <Award className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <Badge className={colors.badge}>
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        {cert.badge}
                      </Badge>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{cert.title}</h3>
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
            );
          })}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30 rounded-2xl p-8 text-center"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-gold" />
            Why Get Certified?
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              "Verified badge on your profile",
              "Priority lead allocation",
              "Higher commission tiers",
              "Access to VIP training"
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 justify-center text-zinc-300 text-sm">
                <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
