import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  Headphones,
  Camera,
  Video,
  PenTool,
  Megaphone,
  Calendar,
  Bot,
  ArrowRight,
  ArrowUpRight,
  Star,
  Shield,
  Award,
  CheckCircle2,
  Brain,
  FileText,
  BarChart3,
  CreditCard,
  Palette,
  MessageSquare,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Target,
  Phone,
  Mail,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

// Support Team Members
const SUPPORT_TEAM = [
  {
    role: 'HR Manager',
    name: 'Jessica',
    description: 'One-on-one support for recruitment, training, and career development.',
    icon: UserCheck,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
  {
    role: 'Admin / Receptionist',
    name: 'JBJ Admin Team',
    description: 'Handles listings, documentation, and client coordination.',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    role: 'Property Coach',
    name: 'Senior Mentor',
    description: 'Dedicated mentor for deal closing and performance improvement.',
    icon: Target,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    role: 'Photographer',
    name: 'Visual Team',
    description: 'Professional listing photography for your properties.',
    icon: Camera,
    color: 'text-[#1A1A1A]',
    bgColor: 'bg-amber-500/10',
  },
  {
    role: 'Video Producer',
    name: 'Oliver Wright',
    description: 'Cinematic property tours and brand documentaries.',
    icon: Video,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    role: 'Content Editor',
    name: 'Henry Crawford',
    description: 'Post-production editing, color grading, and visual effects.',
    icon: PenTool,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  {
    role: 'Marketing Team',
    name: 'Digital Marketing',
    description: 'Ad management, campaigns, and lead generation support.',
    icon: Megaphone,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  {
    role: 'Personal Assistant',
    name: 'Layla',
    description: 'Task scheduling, follow-ups, and daily coordination.',
    icon: Calendar,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
];

// AI Tools List
const AI_TOOLS = [
  { name: 'AI Business Card Scanner', description: 'Scan and extract contact info instantly', icon: CreditCard },
  { name: 'Smart Lead Tracker', description: 'AI-powered lead management and scoring', icon: TrendingUp },
  { name: 'AI CRM Manager', description: 'Automated follow-ups and pipeline management', icon: Users },
  { name: 'Auto Scheduler', description: 'Smart appointment and viewing scheduling', icon: Calendar },
  { name: 'Document Generator', description: 'Create contracts and agreements instantly', icon: FileText },
  { name: 'AI Chat Responder', description: '24/7 automated client communication', icon: MessageSquare },
  { name: 'Property Listing Uploader', description: 'One-click multi-platform listing', icon: Briefcase },
  { name: 'Performance Dashboard', description: 'Real-time analytics and insights', icon: BarChart3 },
  { name: 'Training Portal', description: 'Free courses and educational resources', icon: GraduationCap },
  { name: 'Design Studio', description: 'AI-powered marketing material creation', icon: Palette },
];

const BrokerCircleSection = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-black via-zinc-950 to-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge className="bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 mb-4 shadow-sm">
            <Star className="w-3 h-3 mr-1 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A]">JBJ</span>
            <span className="text-[#1A1A1A] ml-1">Broker Circle</span>
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to Join the <span className="text-[#1A1A1A]">Broker Circle</span>?
          </h2>
          <p className="text-white/70 text-lg">
            Join JBJ Global Real Estate and unlock instant access to a dedicated support team, 
            professional tools, and AI-powered technology — all completely free.
          </p>
        </motion.div>

        {/* Support Team Grid */}
        <motion.div
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1A1A1A]" />
            Your Dedicated Support Team
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUPPORT_TEAM.map((member, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="bg-[#FDFBF7]/60 border-[#1A1A1A] hover:border-[#B89555]/40 transition-all duration-300 h-full">
                  <CardContent className="p-5">
                    {/* Icon container with white/gold/champagne pearl fill */}
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-xl flex items-center justify-center mb-4 border border-[#B89555]/30 shadow-md shadow-gold/20">
                      <member.icon className="h-6 w-6 text-[#1A1A1A]" />
                    </div>
                    <h4 className="text-white font-semibold mb-1">{member.role}</h4>
                    <p className="text-[#1A1A1A] text-sm mb-2">{member.name}</p>
                    <p className="text-white/90 text-sm">{member.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Tools Section */}
        <motion.div
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-400" />
              Explore Our AI Tools
            </h3>
            <Link to="/ai-hub">
              <Button variant="secondary" className="gap-2">
                <Brain className="h-4 w-4" />
                Visit JBJ Hub
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            {AI_TOOLS.map((tool, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Link to="/ai-hub">
                  <Card className="bg-[#FDFBF7]/60 border-[#1A1A1A] hover:border-purple-500/40 transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <tool.icon className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium truncate">{tool.name}</h4>
                          <p className="text-white/90 text-xs truncate">{tool.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits Highlights */}
        <motion.div
          className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-[#B89555]/30 rounded-2xl p-8 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#EFE6D6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-[#1A1A1A]" />
              </div>
              <h4 className="text-white font-semibold mb-2">Free Training</h4>
              <p className="text-white/70 text-sm">Access all courses, guides, and educational materials at no cost.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#EFE6D6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-[#1A1A1A]" />
              </div>
              <h4 className="text-white font-semibold mb-2">Free AI Tools</h4>
              <p className="text-white/70 text-sm">Use all 10+ AI-powered tools without any subscription fees.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#EFE6D6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-[#1A1A1A]" />
              </div>
              <h4 className="text-white font-semibold mb-2">Full Team Support</h4>
              <p className="text-white/70 text-sm">Dedicated HR, marketing, and admin support for your success.</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/broker-toolkit">
              <Button variant="primary" className="gap-2 px-8 py-6 text-lg">
                <Award className="h-5 w-5" />
                Join Broker Circle — It's Free
                <ArrowUpRight className="h-5 w-5 text-[#1A1A1A]" />
              </Button>
            </Link>
            <Link to="/ai-hub">
              <Button variant="secondary" className="gap-2 px-8 py-6 text-lg">
                <Brain className="h-5 w-5" />
                Explore Free Tools
              </Button>
            </Link>
          </div>
          
          {/* Contact Info */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/90">
            <a href="mailto:CONTACT@JBJ.AE" className="flex items-center gap-2 hover:text-[#1A1A1A] transition-colors">
              <Mail className="h-4 w-4" />
              CONTACT@JBJ.AE
            </a>
            <a href="tel:+971547167107" className="flex items-center gap-2 hover:text-[#1A1A1A] transition-colors">
              <Phone className="h-4 w-4" />
              +971 54 716 7107
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BrokerCircleSection;
