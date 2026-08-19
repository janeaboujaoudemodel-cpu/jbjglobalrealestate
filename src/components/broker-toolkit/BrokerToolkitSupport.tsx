import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Users,
  HeartHandshake,
  BookOpen,
  Headphones,
  Camera,
  Megaphone,
  Video,
  Share2,
  ArrowRight,
} from "lucide-react";

const SUPPORT_TEAM = [
  {
    role: "HR Manager",
    name: "Jessica",
    description: "Hiring, onboarding, and team development",
    icon: Users,
    link: "/hr-hub",
  },
  {
    role: "Admin Coordinator", 
    name: "Sarah Thompson",
    description: "RERA compliance and operational support",
    icon: HeartHandshake,
    link: "/broker-admin-assistant",
  },
  {
    role: "Training Coach",
    name: "Emily",  // Renamed from Sarah to avoid conflict with Listing Admin Sarah
    description: "Sales scripts, objection handling, roleplay",
    icon: BookOpen,
    link: "/broker-toolkit",
  },
  {
    role: "Client Support",
    name: "Amanda",
    description: "24/7 client communication support",
    icon: Headphones,
    link: "/contact",
  },
];

const MEDIA_TEAM = [
  {
    role: "Photographer",
    name: "Studio Team",
    description: "Professional property photography",
    icon: Camera,
    link: "/jbj-design-studio",
  },
  {
    role: "Marketing",
    name: "Digital Team",
    description: "Campaigns, ads, and analytics",
    icon: Megaphone,
    link: "/ai-hub",
  },
  {
    role: "Video Producer",
    name: "Production Team",
    description: "Property tours and marketing videos",
    icon: Video,
    link: "/video-builder",
  },
  {
    role: "Social Media",
    name: "Content Team",
    description: "Brand growth and engagement",
    icon: Share2,
    link: "/ai-hub",
  },
];

export function BrokerToolkitSupport() {
  return (
    <>
      {/* SUPPORT TEAM SECTION - Pink Layer (Separate) */}
      <section id="section-support" className="py-8 md:py-10 bg-[#1A1A1A]">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Active Pink Layer */}
          <div className="bg-[#0A0A0A] border border-[#B89555]/30 rounded-2xl p-6 md:p-8 shadow-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40 mb-4">
                <Users className="w-3 h-3 mr-1" />
                Dedicated Team
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Your Personal <span className="text-[#B89555]">Success Team</span>
              </h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                A dedicated team supporting your journey from onboarding to deal closing.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {SUPPORT_TEAM.map((member, i) => (
                <motion.div
                  key={member.role}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link aria-label="Next" to={member.link}>
                    <Card className="bg-[#0A0A0A] border-2 border-[#B89555]/40 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] shadow-[0_0_20px_rgba(184,149,85,0.3)] h-full group cursor-pointer transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#EFE6D6] border border-[#B89555]/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <member.icon className="w-6 h-6 text-[#B89555]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#B89555] text-xs font-medium mb-1">{member.role}</p>
                            <h3 className="font-semibold text-white truncate">{member.name}</h3>
                            <p className="text-white/70 text-sm mt-1">{member.description}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-[#B89555] opacity-0 group-hover:opacity-100 group-hover:text-[#1A1A1A] transition-all flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MEDIA & MARKETING TEAM - Teal/Green Layer (Separate) */}
      <section className="py-8 md:py-10 bg-[#1A1A1A]">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Active Teal Layer */}
          <div className="bg-[#0A0A0A] border border-[#B89555]/30 rounded-2xl p-6 md:p-8 shadow-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40 mb-4">
                <Camera className="w-3 h-3 mr-1" />
                Creative Team
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Media & <span className="text-[#B89555]">Marketing Team</span>
              </h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                Professional creative support for your listings and personal brand.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MEDIA_TEAM.map((member, i) => (
                <motion.div
                  key={member.role}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link aria-label="Next" to={member.link}>
                    <Card className="bg-[#0A0A0A] border-2 border-[#B89555]/40 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] shadow-[0_0_20px_rgba(184,149,85,0.3)] h-full group cursor-pointer transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#EFE6D6] border border-[#B89555]/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <member.icon className="w-6 h-6 text-[#B89555]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#B89555] text-xs font-medium mb-1">{member.role}</p>
                            <h3 className="font-semibold text-white truncate">{member.name}</h3>
                            <p className="text-white/70 text-sm mt-1">{member.description}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-[#B89555] opacity-0 group-hover:opacity-100 group-hover:text-[#1A1A1A] transition-all flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
