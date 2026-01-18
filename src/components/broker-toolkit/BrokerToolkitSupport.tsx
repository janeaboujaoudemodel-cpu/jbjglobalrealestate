import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users,
  UserCheck,
  Shield,
  Calendar,
  Target,
  UserCog,
  Camera,
  Video,
  Palette,
  Megaphone,
  Instagram,
  PenTool,
  MessageCircle
} from "lucide-react";

const SUPPORT_TEAM = [
  {
    role: 'HR Manager',
    name: 'Jessica',
    description: 'One-on-one support for recruitment, training, and career development.',
    icon: UserCheck,
  },
  {
    role: 'Broker Admin',
    name: 'Nadia Al-Rashid',
    description: 'Dedicated admin for broker operations, listings, and documentation.',
    icon: Shield,
  },
  {
    role: 'Personal Assistant',
    name: 'Layla',
    description: 'Task scheduling, follow-ups, and daily coordination.',
    icon: Calendar,
  },
  {
    role: 'Property Coach',
    name: 'Senior Mentor',
    description: 'Dedicated mentor for deal closing and performance improvement.',
    icon: Target,
  },
  {
    role: 'HR Assistant',
    name: 'Recruitment Support',
    description: 'CV collection, interview scheduling, and candidate communication.',
    icon: UserCog,
  },
];

const MEDIA_TEAM = [
  {
    role: 'Photographer',
    name: 'Visual Team',
    description: 'Professional listing photography.',
    icon: Camera,
  },
  {
    role: 'Videographer',
    name: 'Media Team',
    description: 'Property videos and drone footage.',
    icon: Video,
  },
  {
    role: 'Graphic Designer',
    name: 'Creative Studio',
    description: 'Social media and brand materials.',
    icon: Palette,
  },
  {
    role: 'Digital Marketing',
    name: 'Ads & Campaigns',
    description: 'Google, Meta, and TikTok ads.',
    icon: Megaphone,
  },
  {
    role: 'Social Media',
    name: 'Content Strategy',
    description: 'Posts and engagement strategy.',
    icon: Instagram,
  },
  {
    role: 'Video Editor',
    name: 'Post-Production',
    description: 'Editing and motion graphics.',
    icon: PenTool,
  },
];

export function BrokerToolkitSupport() {
  return (
    <section id="section-support" className="py-16 md:py-20 bg-pink-950/80">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-pink-500/30 text-pink-300 border-pink-400/50 mb-4">
            <Users className="w-3 h-3 mr-1" />
            Dedicated Support Team
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your Personal <span className="text-pink-300">Success Team</span>
          </h2>
          <p className="text-pink-200/70 max-w-2xl mx-auto">
            A full team of professionals dedicated to helping you succeed — all included in your membership.
          </p>
        </motion.div>

        {/* Professional Support */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-300" />
            Professional Support
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {SUPPORT_TEAM.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-pink-900/50 border border-pink-500/30 hover:border-pink-400 hover:bg-pink-900/70 transition-all h-full">
                  <CardContent className="p-5">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                      <member.icon className="w-6 h-6 text-pink-300" />
                    </div>
                    <h4 className="text-white font-semibold mb-1">{member.role}</h4>
                    <p className="text-pink-300 text-sm mb-2">{member.name}</p>
                    <p className="text-pink-200/60 text-xs">{member.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Media & Marketing Team - Teal theme */}
        <div className="bg-teal-950/80 rounded-2xl p-8 border border-teal-500/30">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-300" />
            Media & Marketing Team
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {MEDIA_TEAM.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="bg-teal-900/50 border border-teal-500/30 hover:border-teal-400 hover:bg-teal-900/70 transition-all h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <member.icon className="w-5 h-5 text-teal-300" />
                    </div>
                    <h4 className="text-white font-medium text-sm mb-0.5">{member.role}</h4>
                    <p className="text-teal-200/60 text-xs">{member.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
