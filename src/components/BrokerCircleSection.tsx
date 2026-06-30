import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CombinedContactNewsletter from '@/components/CombinedContactNewsletter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  UserCheck,
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const SUPPORT_TEAM = [
  { role: 'HR Manager', name: 'Jessica', description: 'One-on-one support for recruitment, training, and career development.', icon: UserCheck },
  { role: 'Admin / Receptionist', name: 'JBJ Admin Team', description: 'Handles listings, documentation, and client coordination.', icon: Shield },
  { role: 'Property Coach', name: 'Senior Mentor', description: 'Dedicated mentor for deal closing and performance improvement.', icon: Target },
  { role: 'Photographer', name: 'Visual Team', description: 'Professional listing photography for your properties.', icon: Camera },
  { role: 'Video Producer', name: 'Oliver Wright', description: 'Cinematic property tours and brand documentaries.', icon: Video },
  { role: 'Content Editor', name: 'Henry Crawford', description: 'Post-production editing, color grading, and visual effects.', icon: PenTool },
  { role: 'Marketing Team', name: 'Digital Marketing', description: 'Ad management, campaigns, and lead generation support.', icon: Megaphone },
  { role: 'Personal Assistant', name: 'Layla', description: 'Task scheduling, follow-ups, and daily coordination.', icon: Calendar },
];

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

// Reusable emerald metallic icon tile (white glyph on emerald) — matches sidebar standard.
const EmeraldTile = ({ icon: Icon, size = 'md' }: { icon: any; size?: 'sm' | 'md' | 'lg' }) => {
  const dims = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  const iconDims = size === 'lg' ? 'h-7 w-7' : size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  return (
    <div
      className={`${dims} rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#0B5A43] via-[#064E3B] to-[#053929] border border-[#B89555]/40 shadow-[0_8px_22px_-10px_rgba(6,78,59,0.85),inset_0_1px_0_rgba(255,255,255,0.18)]`}
    >
      <Icon className={`${iconDims} text-white`} strokeWidth={2.1} />
    </div>
  );
};

const BrokerCircleSection = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[#050B09] via-[#07140F] to-[#050B09] relative overflow-hidden">
      {/* Ambient emerald glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full bg-[#064E3B]/25 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-[#B89555]/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge className="bg-gradient-to-br from-[#0B5A43] via-[#064E3B] to-[#053929] text-white border border-[#B89555]/40 mb-4 shadow-md">
            <Star className="w-3 h-3 mr-1 text-white" />
            <span className="text-white">JBJ Broker Circle</span>
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Ready to join the{' '}
            <span className="bg-gradient-to-r from-[#B89555] via-[#D4B26A] to-[#B89555] bg-clip-text text-transparent">
              Broker Circle
            </span>
            ?
          </h2>
          <p className="text-white/75 text-lg">
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
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
            <EmeraldTile icon={Users} size="sm" />
            Your dedicated support team
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUPPORT_TEAM.map((member, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="bg-white/[0.04] backdrop-blur-sm border border-[#B89555]/30 hover:border-[#B89555]/60 hover:bg-white/[0.06] transition-all duration-300 h-full rounded-2xl">
                  <CardContent className="p-5">
                    <EmeraldTile icon={member.icon} />
                    <h4 className="text-white font-semibold mt-4 mb-1">{member.role}</h4>
                    <p className="text-[#D4B26A] text-sm mb-2 font-medium">{member.name}</p>
                    <p className="text-white/70 text-sm leading-relaxed">{member.description}</p>
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
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <EmeraldTile icon={Bot} size="sm" />
              Explore our AI tools
            </h3>
            <Link to="/ai-hub">
              <Button className="gap-2 jj-pill-emerald-metallic">
                <Brain className="h-4 w-4 text-white" />
                <span className="text-white">Visit JBJ Hub</span>
                <ArrowRight className="h-4 w-4 text-white" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            {AI_TOOLS.map((tool, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Link to="/ai-hub">
                  <Card className="bg-white/[0.04] backdrop-blur-sm border border-[#B89555]/30 hover:border-[#B89555]/60 hover:bg-white/[0.07] transition-all duration-300 h-full group rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <EmeraldTile icon={tool.icon} size="sm" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium truncate">{tool.name}</h4>
                          <p className="text-white/65 text-xs truncate">{tool.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits Highlights — Emerald frame */}
        <motion.div
          className="rounded-3xl p-[1.5px] mb-12 bg-gradient-to-br from-[#B89555]/60 via-[#064E3B]/40 to-[#B89555]/60"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="rounded-3xl bg-gradient-to-br from-[#07140F] via-[#0A1E16] to-[#07140F] p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: GraduationCap, title: 'Free training', text: 'Access all courses, guides, and educational materials at no cost.' },
                { icon: Bot, title: 'Free AI tools', text: 'Use all 10+ AI-powered tools without any subscription fees.' },
                { icon: Users, title: 'Full team support', text: 'Dedicated HR, marketing, and admin support for your success.' },
              ].map((b, i) => (
                <div key={i} className="text-center flex flex-col items-center">
                  <EmeraldTile icon={b.icon} size="lg" />
                  <h4 className="text-white font-semibold mt-4 mb-2">{b.title}</h4>
                  <p className="text-white/70 text-sm">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Card — unified to homepage "Ready to Get Started" */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <CombinedContactNewsletter
            id="broker-circle-cta"
            title="Ready to Join the JBJ Broker Circle?"
            subtitle="Talk to our team and unlock free training, AI tools, and full back-office support."
          />
        </motion.div>
      </div>
    </section>
  );
};

export default BrokerCircleSection;
