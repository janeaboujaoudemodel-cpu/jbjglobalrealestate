import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SectionDivider } from '@/components/ui/section-divider';
import {
  BrokerToolkitSupport,
  BrokerToolkitEducation,
  BrokerToolkitAcademy,
  BrokerToolkitOperations,
  BrokerToolkitCRM,
  BrokerToolkitGrowth,
  BrokerToolkitReferral,
  BrokerToolkitTools,
} from '@/components/broker-toolkit';
import {
  BarChart3, Users, FileText, User, Mail, Camera, UserCheck,
  BookOpen, Award, ArrowRight, Briefcase, Phone,
  GraduationCap, Target, MessageSquare, Calendar, Video,
  FileCheck, StickyNote, Home, Upload, TrendingUp,
  Sparkles, Shield, ArrowUpRight, ClipboardList
} from 'lucide-react';

const quickAccessCards = [
  { title: 'Broker Dashboard', desc: 'Performance & analytics', icon: BarChart3, href: '/broker-dashboard', color: 'from-fuchsia-500 to-purple-600' },
  { title: 'CRM', desc: 'Manage leads & clients', icon: Users, href: '/crm', color: 'from-violet-500 to-purple-600' },
  { title: 'Listing Portal', desc: 'Upload & manage listings', icon: Upload, href: '/listing-portal', color: 'from-emerald-500 to-teal-600' },
  { title: 'My Profile', desc: 'Account & settings', icon: User, href: '/my-account', color: 'from-blue-500 to-indigo-600' },
  { title: 'Broker Education', desc: 'Courses & books', icon: GraduationCap, href: '/broker-education', color: 'from-amber-500 to-orange-600' },
  { title: 'Certification', desc: 'Get certified', icon: Award, href: '/services/broker-certification', color: 'from-rose-500 to-pink-600' },
];

const brokerAITools = [
  { title: 'Lead Qualification', desc: 'AI-powered lead scoring', icon: Target, href: '/ai-lead-qualification' },
  { title: 'Objection Handler', desc: 'AI responses to objections', icon: MessageSquare, href: '/ai-objection-handler' },
  { title: 'AI Email Generator', desc: 'Professional property emails', icon: Mail, href: '/ai-email-generator' },
  { title: 'Client Matcher', desc: 'AI-powered lead matching', icon: UserCheck, href: '/ai-client-matcher' },
  { title: 'Meeting Summarizer', desc: 'Summarize meetings', icon: Video, href: '/ai-meeting-summarizer' },
  { title: 'Call Summarizer', desc: 'Summarize client calls', icon: Phone, href: '/ai-call-summarizer' },
];

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
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              JBJ Broker Hub
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-zinc-400 text-lg">
              Your command center for training, education, listings, CRM, and broker operations.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-10 space-y-10">
        {/* Quick Access */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickAccessCards.map(card => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={card.title}
                  onClick={() => navigate(card.href)}
                  className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-2xl p-5 text-left hover:border-fuchsia-500/50 transition-all group"
                  whileHover={{ y: -2 }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{card.title}</h3>
                  <p className="text-zinc-500 text-xs">{card.desc}</p>
                  <ArrowRight className="w-4 h-4 text-fuchsia-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Broker AI Tools */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">AI Sales & Communication Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {brokerAITools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.title}
                  onClick={() => navigate(tool.href)}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left hover:border-fuchsia-500/40 transition-all group"
                >
                  <Icon className="w-5 h-5 text-fuchsia-400 mb-2" />
                  <h3 className="text-white font-medium text-sm">{tool.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1">{tool.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explore All Tools CTA */}
        <div className="bg-gradient-to-r from-indigo-900/30 to-fuchsia-900/30 border border-fuchsia-500/20 rounded-2xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-fuchsia-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Explore All AI Tools</h3>
          <p className="text-zinc-400 text-sm mb-4">Access 30+ free AI tools including creative suites, corporate tools, and productivity apps.</p>
          <Button onClick={() => navigate('/ai-hub')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">
            Go to JBJ Tools Hub
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Divider */}
      <SectionDivider />

      {/* Broker Toolkit Sections - Education, Training, Operations, etc. */}
      <BrokerToolkitTools />
      <SectionDivider />
      <BrokerToolkitSupport />
      <SectionDivider />
      <BrokerToolkitEducation />
      <SectionDivider />
      <BrokerToolkitAcademy />
      <SectionDivider />
      <BrokerToolkitOperations />
      <SectionDivider />
      <BrokerToolkitCRM />
      <SectionDivider />
      <BrokerToolkitGrowth />
      <SectionDivider />
      <BrokerToolkitReferral />

      {/* Bottom CTA */}
      <section className="py-10 bg-black">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-fuchsia-950/40 to-purple-950/40 border border-fuchsia-500/20 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-2">Access All AI Tools</h3>
            <p className="text-zinc-400 text-sm mb-4">Browse the complete collection of 30+ AI-powered tools.</p>
            <Button onClick={() => navigate('/ai-hub')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white border-0">
              Go to JBJ Tools Hub
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </section>
  );
};

export default BrokerHub;
