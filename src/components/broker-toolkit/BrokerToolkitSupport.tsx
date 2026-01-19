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
import { Link } from "react-router-dom";

const SUPPORT_TEAM = [
  {
    role: 'HR Manager',
    name: 'Jessica',
    description: 'One-on-one support for recruitment, training, and career development.',
    icon: UserCheck,
    link: '/hr-agent',
  },
  {
    role: 'Broker Admin',
    name: 'Nadia Al-Rashid',
    description: 'Dedicated admin for broker operations, listings, and documentation.',
    icon: Shield,
    link: '/broker-admin-assistant',
  },
  {
    role: 'Personal Assistant',
    name: 'Layla',
    description: 'Task scheduling, follow-ups, and daily coordination.',
    icon: Calendar,
    link: '/executive-assistant',
  },
  {
    role: 'Property Coach',
    name: 'Senior Mentor',
    description: 'Dedicated mentor for deal closing and performance improvement.',
    icon: Target,
    link: '/employee-hub',
  },
  {
    role: 'HR Assistant',
    name: 'Recruitment Support',
    description: 'CV collection, interview scheduling, and candidate communication.',
    icon: UserCog,
    link: '/hr-agent',
  },
];

const MEDIA_TEAM = [
  {
    role: 'Photographer',
    name: 'Visual Team',
    description: 'Professional listing photography.',
    icon: Camera,
    link: '/employee-hub',
  },
  {
    role: 'Video Producer',
    name: 'Oliver Wright',
    description: 'Cinematic property tours and videos.',
    icon: Video,
    link: '/video-builder',
  },
  {
    role: 'Graphic Designer',
    name: 'Marcus Bennett',
    description: 'Social media and brand materials.',
    icon: Palette,
    link: '/jbj-design-studio',
  },
  {
    role: 'Digital Marketing',
    name: 'Ryan Campbell',
    description: 'Google, Meta, and TikTok ads.',
    icon: Megaphone,
    link: '/employee-hub',
  },
  {
    role: 'Social Media',
    name: 'Content Strategy',
    description: 'Posts and engagement strategy.',
    icon: Instagram,
    link: '/employee-hub',
  },
  {
    role: 'Content Editor',
    name: 'Henry Crawford',
    description: 'Post-production editing and effects.',
    icon: PenTool,
    link: '/video-builder',
  },
];

export function BrokerToolkitSupport() {
  return (
    <section id="section-support" className="py-16 md:py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-pink-500/30 text-pink-200 border-pink-400/50 mb-4">
            <Users className="w-3 h-3 mr-1" />
            Dedicated Support Team
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your Personal <span className="text-pink-300">Success Team</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
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
                <Link to={member.link}>
                  <Card className="bg-pink-900/60 border border-pink-500/30 hover:border-pink-400 hover:bg-pink-900/80 transition-all h-full shadow-lg shadow-pink-500/10 cursor-pointer">
                    <CardContent className="p-5">
                      <div className="w-12 h-12 bg-pink-500/30 rounded-xl flex items-center justify-center mb-4">
                        <member.icon className="w-6 h-6 text-pink-200" />
                      </div>
                      <h4 className="text-white font-semibold mb-1">{member.role}</h4>
                      <p className="text-pink-300 text-sm mb-2">{member.name}</p>
                      <p className="text-pink-200/60 text-xs">{member.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Media & Marketing Team - Teal theme as a separate section within pink */}
        <div className="bg-teal-950/80 rounded-2xl p-8 border border-teal-500/30">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <Camera className="w-6 h-6 text-teal-300" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Media & <span className="text-teal-300">Marketing Team</span>
              </h3>
            </div>
            <p className="text-teal-200/70 text-sm max-w-lg mx-auto">
              Professional photography, video production, and digital marketing support.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {MEDIA_TEAM.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Link to={member.link}>
                  <Card className="bg-teal-900/60 border border-teal-500/30 hover:border-teal-400 hover:bg-teal-900/80 transition-all h-full shadow-lg shadow-teal-500/10 cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 bg-teal-500/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <member.icon className="w-5 h-5 text-teal-200" />
                      </div>
                      <h4 className="text-white font-medium text-sm mb-0.5">{member.role}</h4>
                      <p className="text-teal-200/60 text-xs">{member.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
