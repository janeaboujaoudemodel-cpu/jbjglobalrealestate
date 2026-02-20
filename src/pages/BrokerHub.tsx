import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3, Users, FileText, User, Mail, Camera, UserCheck,
  BookOpen, Award, ArrowRight, Briefcase, Phone,
  GraduationCap, Target, MessageSquare, Calendar, Video,
  FileCheck, StickyNote, Home, Upload, TrendingUp,
  Sparkles, LayoutDashboard, ClipboardList, Shield
} from 'lucide-react';

const suiteCategories = [
  {
    title: 'Dashboard & CRM',
    color: 'fuchsia',
    tools: [
      { title: 'Broker Dashboard', desc: 'Performance overview & analytics', icon: BarChart3, href: '/broker-dashboard' },
      { title: 'CRM', desc: 'Manage leads & clients', icon: Users, href: '/crm' },
      { title: 'Lead Management', desc: 'Track & convert leads', icon: Target, href: '/crm/leads' },
      { title: 'My Profile', desc: 'Account & settings', icon: User, href: '/my-account' },
    ],
  },
  {
    title: 'AI Sales Tools',
    color: 'purple',
    tools: [
      { title: 'Lead Qualification', desc: 'AI-powered lead scoring', icon: Target, href: '/ai-lead-qualification' },
      { title: 'Objection Handler', desc: 'AI responses to client objections', icon: MessageSquare, href: '/ai-objection-handler' },
      { title: 'Follow-up Scheduler', desc: 'Smart follow-up timing', icon: Calendar, href: '/ai-followup-scheduler' },
      { title: 'Client Matcher', desc: 'AI-powered lead matching', icon: UserCheck, href: '/ai-client-matcher' },
      { title: 'AI Email Generator', desc: 'Professional property emails', icon: Mail, href: '/ai-email-generator' },
    ],
  },
  {
    title: 'Communication & Meetings',
    color: 'violet',
    tools: [
      { title: 'Meeting Summarizer', desc: 'Summarize meetings with action items', icon: Video, href: '/ai-meeting-summarizer' },
      { title: 'Call Summarizer', desc: 'Summarize client calls', icon: Phone, href: '/ai-call-summarizer' },
      { title: 'Contract Reviewer', desc: 'AI contract analysis', icon: FileCheck, href: '/ai-contract-reviewer' },
      { title: 'Video Meet', desc: 'Professional video meetings', icon: Video, href: '/video-meeting' },
    ],
  },
  {
    title: 'Content & Marketing',
    color: 'rose',
    tools: [
      { title: 'Social Media', desc: 'Generate social content', icon: Briefcase, href: '/ai-social-media' },
      { title: 'Description Writer', desc: 'AI property descriptions', icon: FileText, href: '/ai-description-writer' },
      { title: 'Video Tour Script', desc: 'Engaging tour scripts', icon: Video, href: '/ai-video-tour-script' },
      { title: 'Business Card Scanner', desc: 'Scan & save contacts', icon: Camera, href: '/business-card-scanner' },
    ],
  },
  {
    title: 'Listings & Portals',
    color: 'emerald',
    tools: [
      { title: 'Listing Portal', desc: 'Upload listings for sale or rent', icon: Upload, href: '/listing-portal' },
      { title: 'Property Coach', desc: 'AI property guidance', icon: Home, href: '/ai-property-analyzer' },
      { title: 'Market Report', desc: 'Generate market analysis', icon: TrendingUp, href: '/ai-market-report' },
      { title: 'Competitor Analysis', desc: 'Analyze competitor listings', icon: BarChart3, href: '/ai-competitor-analysis' },
    ],
  },
  {
    title: 'Notes & Productivity',
    color: 'cyan',
    tools: [
      { title: 'AI Notes', desc: 'Smart note-taking with AI', icon: StickyNote, href: '/ai-notes' },
      { title: 'Calendar & Tasks', desc: 'Manage schedule & tasks', icon: Calendar, href: '/ai-calendar' },
      { title: 'Document Generator', desc: 'Professional documents', icon: FileText, href: '/ai-document-generator' },
      { title: 'Translation Hub', desc: 'Multi-language support', icon: ClipboardList, href: '/ai-translation-hub' },
    ],
  },
  {
    title: 'Training & Certification',
    color: 'amber',
    tools: [
      { title: 'Broker Education', desc: 'Courses & certifications', icon: GraduationCap, href: '/broker-education' },
      { title: 'Training Portal', desc: 'Onboarding & modules', icon: BookOpen, href: '/broker/training' },
      { title: 'Broker Resources', desc: 'Templates & guides', icon: FileText, href: '/broker-resources' },
      { title: 'Certification', desc: 'Get certified', icon: Award, href: '/services/broker-certification' },
    ],
  },
];

const colorMap: Record<string, { gradient: string; border: string; text: string; bg: string; iconBg: string }> = {
  fuchsia: { gradient: 'from-fuchsia-600 to-purple-700', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/8', iconBg: 'bg-fuchsia-500/15' },
  purple: { gradient: 'from-purple-600 to-violet-700', border: 'border-purple-500/30', text: 'text-purple-400', bg: 'bg-purple-500/8', iconBg: 'bg-purple-500/15' },
  violet: { gradient: 'from-violet-600 to-purple-700', border: 'border-violet-500/30', text: 'text-violet-400', bg: 'bg-violet-500/8', iconBg: 'bg-violet-500/15' },
  rose: { gradient: 'from-rose-600 to-pink-700', border: 'border-rose-500/30', text: 'text-rose-400', bg: 'bg-rose-500/8', iconBg: 'bg-rose-500/15' },
  emerald: { gradient: 'from-emerald-600 to-teal-700', border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/8', iconBg: 'bg-emerald-500/15' },
  cyan: { gradient: 'from-cyan-600 to-blue-700', border: 'border-cyan-500/30', text: 'text-cyan-400', bg: 'bg-cyan-500/8', iconBg: 'bg-cyan-500/15' },
  amber: { gradient: 'from-amber-600 to-yellow-700', border: 'border-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500/8', iconBg: 'bg-amber-500/15' },
};

const BrokerHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero */}
      <div className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/30 via-black to-purple-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,100,255,0.08),transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <Link
            to="/toolkit"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors mb-8 text-sm"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Toolkit
          </Link>

          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Broker Intelligence Hub
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-zinc-400 text-lg">
              Your command center for leads, tools, training, and performance tracking.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-fuchsia-400 rounded-full" />
                {suiteCategories.reduce((acc, c) => acc + c.tools.length, 0)} Tools
              </span>
              <span>|</span>
              <span>{suiteCategories.length} Categories</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tool Categories */}
      <div className="container mx-auto px-4 pb-20 space-y-10">
        {suiteCategories.map((category, catIdx) => {
          const colors = colorMap[category.color] || colorMap.fuchsia;
          return (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.08 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${colors.gradient}`} />
                <h2 className="text-lg font-bold text-white">{category.title}</h2>
                <span className="text-xs text-zinc-500">{category.tools.length} tools</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {category.tools.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.title}
                      onClick={() => navigate(tool.href)}
                      className={`group relative bg-zinc-950/80 border ${colors.border} rounded-xl p-4 text-left hover:border-opacity-80 transition-all duration-200 hover:shadow-lg overflow-hidden`}
                    >
                      {/* Hover gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity`} />
                      <div className="relative">
                        <div className={`w-9 h-9 rounded-lg ${colors.iconBg} flex items-center justify-center mb-3`}>
                          <Icon className={`w-4.5 h-4.5 ${colors.text}`} />
                        </div>
                        <h3 className="text-white font-semibold text-sm mb-1">{tool.title}</h3>
                        <p className="text-zinc-500 text-xs leading-relaxed">{tool.desc}</p>
                        <ArrowRight className={`w-3.5 h-3.5 ${colors.text} mt-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* CTA */}
        <div className="bg-gradient-to-r from-fuchsia-950/40 to-purple-950/40 border border-fuchsia-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Access All AI Tools</h3>
          <p className="text-zinc-400 text-sm mb-4">Browse the complete collection of 30+ AI-powered tools.</p>
          <Button onClick={() => navigate('/business-suite/all-tools')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white border-0">
            View All Tools
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BrokerHub;
