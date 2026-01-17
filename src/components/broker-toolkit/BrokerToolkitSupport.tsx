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
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  {
    role: 'Admin / Receptionist',
    name: 'JBJ Admin Team',
    description: 'Handles listings, documentation, and client coordination.',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    role: 'Personal Assistant',
    name: 'AI & Human',
    description: 'Task scheduling, follow-ups, and daily coordination.',
    icon: Calendar,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  {
    role: 'Property Coach',
    name: 'Senior Mentor',
    description: 'Dedicated mentor for deal closing and performance improvement.',
    icon: Target,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  {
    role: 'HR Assistant',
    name: 'Recruitment Support',
    description: 'CV collection, interview scheduling, and candidate communication.',
    icon: UserCog,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
];

const MEDIA_TEAM = [
  {
    role: 'Photographer',
    name: 'Visual Team',
    description: 'Professional listing photography.',
    icon: Camera,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    role: 'Videographer',
    name: 'Media Team',
    description: 'Property videos and drone footage.',
    icon: Video,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    role: 'Graphic Designer',
    name: 'Creative Studio',
    description: 'Social media and brand materials.',
    icon: Palette,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
  },
  {
    role: 'Digital Marketing',
    name: 'Ads & Campaigns',
    description: 'Google, Meta, and TikTok ads.',
    icon: Megaphone,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  {
    role: 'Social Media',
    name: 'Content Strategy',
    description: 'Posts and engagement strategy.',
    icon: Instagram,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
  {
    role: 'Video Editor',
    name: 'Post-Production',
    description: 'Editing and motion graphics.',
    icon: PenTool,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
];

export function BrokerToolkitSupport() {
  return (
    <section id="section-support" className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 mb-4">
            <Users className="w-3 h-3 mr-1" />
            Dedicated Support Team
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your Personal <span className="text-pink-400">Success Team</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            A full team of professionals dedicated to helping you succeed — all included in your membership.
          </p>
        </motion.div>

        {/* Professional Support */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-400" />
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
                <Card className={`bg-white border border-zinc-200 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all h-full`}>
                  <CardContent className="p-5">
                    <div className={`w-12 h-12 ${member.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                      <member.icon className={`w-6 h-6 ${member.color}`} />
                    </div>
                    <h4 className="text-black font-semibold mb-1">{member.role}</h4>
                    <p className={`${member.color} text-sm mb-2`}>{member.name}</p>
                    <p className="text-zinc-600 text-xs">{member.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Media & Marketing Team */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-400" />
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
                <Card className="bg-white border border-zinc-200 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all h-full">
                  <CardContent className="p-4 text-center">
                    <div className={`w-10 h-10 ${member.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <member.icon className={`w-5 h-5 ${member.color}`} />
                    </div>
                    <h4 className="text-black font-medium text-sm mb-0.5">{member.role}</h4>
                    <p className="text-zinc-600 text-xs">{member.description}</p>
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
