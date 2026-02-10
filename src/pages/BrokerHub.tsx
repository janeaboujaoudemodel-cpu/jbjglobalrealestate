import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3, Users, FileText, User, Mail, Camera, UserCheck,
  BookOpen, Award, ArrowRight, Sparkles, Briefcase, Phone,
  LayoutDashboard, GraduationCap, Target
} from 'lucide-react';

const quickCards = [
  { title: 'CRM', desc: 'Manage leads & clients', icon: Users, href: '/crm', color: 'from-fuchsia-500 to-purple-600' },
  { title: 'Dashboard', desc: 'Performance overview', icon: BarChart3, href: '/broker-dashboard', color: 'from-blue-500 to-indigo-600' },
  { title: 'Lead Management', desc: 'Track & convert leads', icon: Target, href: '/crm/leads', color: 'from-amber-500 to-orange-600' },
  { title: 'My Profile', desc: 'Account & settings', icon: User, href: '/my-account', color: 'from-emerald-500 to-teal-600' },
];

const brokerTools = [
  { title: 'AI Email Generator', desc: 'Professional property emails', icon: Mail, href: '/ai-email-generator' },
  { title: 'Business Card Scanner', desc: 'Scan & save contacts', icon: Camera, href: '/business-card-scanner' },
  { title: 'Client Matcher', desc: 'AI-powered lead matching', icon: UserCheck, href: '/ai-client-matcher' },
  { title: 'Description Writer', desc: 'AI property descriptions', icon: FileText, href: '/ai-description-writer' },
  { title: 'Social Media', desc: 'Generate social content', icon: Briefcase, href: '/ai-social-media' },
  { title: 'Call Summarizer', desc: 'Summarize client calls', icon: Phone, href: '/ai-call-summarizer' },
];

const training = [
  { title: 'Broker Education', desc: 'Courses & certifications', icon: GraduationCap, href: '/broker-education' },
  { title: 'Training Portal', desc: 'Onboarding & modules', icon: BookOpen, href: '/broker/training' },
  { title: 'Broker Resources', desc: 'Templates & guides', icon: FileText, href: '/broker-resources' },
  { title: 'Certification', desc: 'Get certified', icon: Award, href: '/services/broker-certification' },
];

const BrokerHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero */}
      <div className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-black to-purple-900/15" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Broker Hub
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''} 🏆
            </h1>
            <p className="text-zinc-400">Your command center for leads, tools, training, and performance tracking.</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20 space-y-12">
        {/* Quick Access */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickCards.map(card => {
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

        {/* Broker Tools */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">AI Broker Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {brokerTools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.title}
                  onClick={() => navigate(tool.href)}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left hover:border-fuchsia-500/40 transition-all"
                >
                  <Icon className="w-5 h-5 text-fuchsia-400 mb-2" />
                  <h3 className="text-white font-medium text-sm">{tool.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1">{tool.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Training */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Training & Certification</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {training.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => navigate(item.href)}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left hover:border-fuchsia-500/40 transition-all"
                >
                  <Icon className="w-5 h-5 text-fuchsia-400 mb-2" />
                  <h3 className="text-white font-medium text-sm">{item.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 border border-fuchsia-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Boost Your Performance</h3>
          <p className="text-zinc-400 text-sm mb-4">Access all 30+ AI tools to close more deals.</p>
          <Button onClick={() => navigate('/ai-hub')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">
            View All Tools
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BrokerHub;
