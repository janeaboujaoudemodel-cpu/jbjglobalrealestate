import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Calculator,
  FileSignature,
  Share2,
  VideoIcon,
  Table2,
  FolderOpen,
  Handshake,
  BookOpen,
  Mic,
  Heart,
  DollarSign,
  UserCog,
  Image,
  Instagram,
  Layout,
  Sparkles,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

// (A) Professional Support
const PROFESSIONAL_SUPPORT = [
  {
    role: 'HR Manager',
    name: 'Jessica',
    description: 'One-on-one support for recruitment, training, and career development.',
    icon: UserCheck,
    color: 'text-pink-400',
    glowColor: 'shadow-pink-500/30',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  {
    role: 'Admin / Receptionist',
    name: 'JBJ Admin Team',
    description: 'Handles listings, documentation, and client coordination.',
    icon: Shield,
    color: 'text-blue-400',
    glowColor: 'shadow-blue-500/30',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    role: 'Personal Assistant',
    name: 'AI & Human',
    description: 'Task scheduling, follow-ups, and daily coordination.',
    icon: Calendar,
    color: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  {
    role: 'Property Coach',
    name: 'Senior Mentor',
    description: 'Dedicated mentor for deal closing and performance improvement.',
    icon: Target,
    color: 'text-green-400',
    glowColor: 'shadow-green-500/30',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  {
    role: 'HR Assistant',
    name: 'Recruitment Support',
    description: 'CV collection, interview scheduling, and candidate communication.',
    icon: UserCog,
    color: 'text-violet-400',
    glowColor: 'shadow-violet-500/30',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
];

// (B) Media & Marketing
const MEDIA_MARKETING = [
  {
    role: 'Photographer',
    name: 'Visual Team',
    description: 'Professional listing photography for your properties.',
    icon: Camera,
    color: 'text-amber-400',
    glowColor: 'shadow-amber-500/30',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  {
    role: 'Videographer',
    name: 'Media Team',
    description: 'High-quality property video production and drone footage.',
    icon: Video,
    color: 'text-purple-400',
    glowColor: 'shadow-purple-500/30',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  {
    role: 'Graphic Designer',
    name: 'Creative Studio',
    description: 'Social media graphics, flyers, and brand materials.',
    icon: Palette,
    color: 'text-rose-400',
    glowColor: 'shadow-rose-500/30',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
  {
    role: 'Digital Marketing Manager',
    name: 'Ads & Campaigns',
    description: 'Google, Meta, and TikTok ads management.',
    icon: Megaphone,
    color: 'text-orange-400',
    glowColor: 'shadow-orange-500/30',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  {
    role: 'Social Media Manager',
    name: 'Content Strategy',
    description: 'Content calendar, posts, and engagement strategy.',
    icon: Instagram,
    color: 'text-pink-400',
    glowColor: 'shadow-pink-500/30',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  {
    role: 'Video Editor',
    name: 'Post-Production',
    description: 'Editing, color grading, and motion graphics.',
    icon: PenTool,
    color: 'text-red-400',
    glowColor: 'shadow-red-500/30',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
];

// (C) Training & Development
const TRAINING_DEVELOPMENT = [
  {
    name: 'Real Estate Foundations',
    description: 'Core knowledge for starting in real estate',
    icon: BookOpen,
    color: 'text-blue-400',
    glowColor: 'shadow-blue-500/30',
    bgColor: 'bg-blue-500/10',
  },
  {
    name: 'Social Media Mastery',
    description: 'Build your personal brand online',
    icon: Instagram,
    color: 'text-pink-400',
    glowColor: 'shadow-pink-500/30',
    bgColor: 'bg-pink-500/10',
  },
  {
    name: 'Client Handling',
    description: 'Professional communication techniques',
    icon: Handshake,
    color: 'text-green-400',
    glowColor: 'shadow-green-500/30',
    bgColor: 'bg-green-500/10',
  },
  {
    name: 'Negotiation Skills',
    description: 'Win-win deal making strategies',
    icon: DollarSign,
    color: 'text-yellow-400',
    glowColor: 'shadow-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
  },
  {
    name: 'Objection Management',
    description: 'Overcome client concerns effectively',
    icon: Shield,
    color: 'text-orange-400',
    glowColor: 'shadow-orange-500/30',
    bgColor: 'bg-orange-500/10',
  },
  {
    name: 'Closing Techniques',
    description: 'Seal deals with confidence',
    icon: Target,
    color: 'text-red-400',
    glowColor: 'shadow-red-500/30',
    bgColor: 'bg-red-500/10',
  },
  {
    name: 'Personal Branding',
    description: 'Stand out in the market',
    icon: Star,
    color: 'text-purple-400',
    glowColor: 'shadow-purple-500/30',
    bgColor: 'bg-purple-500/10',
  },
  {
    name: 'AI Marketing',
    description: 'Leverage AI for lead generation',
    icon: Brain,
    color: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
  },
];

// (D) Tools & Operations
const TOOLS_OPERATIONS = [
  {
    name: 'JBJ AI Property Comparison',
    description: 'Compare properties side-by-side with AI insights',
    icon: Layout,
    link: '/ai-hub',
    color: 'text-purple-400',
    glowColor: 'shadow-purple-500/30',
    bgColor: 'bg-purple-500/10',
  },
  {
    name: 'JBJ Property Evaluator',
    description: 'Get instant property valuations',
    icon: TrendingUp,
    link: '/property-evaluation',
    color: 'text-green-400',
    glowColor: 'shadow-green-500/30',
    bgColor: 'bg-green-500/10',
  },
  {
    name: 'JBJ Mortgage Calculator',
    description: 'Calculate payments and affordability',
    icon: Calculator,
    link: '/mortgage-calculator',
    color: 'text-blue-400',
    glowColor: 'shadow-blue-500/30',
    bgColor: 'bg-blue-500/10',
  },
  {
    name: 'JBJ Scan & Sign',
    description: 'Digital document signing',
    icon: FileSignature,
    link: '/ai-hub',
    color: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
  },
  {
    name: 'JBJ Business Card Scanner',
    description: 'AI-powered contact extraction',
    icon: CreditCard,
    link: '/business-card-scanner',
    color: 'text-gold',
    glowColor: 'shadow-gold/30',
    bgColor: 'bg-gold/10',
  },
  {
    name: 'JBJ Spreadsheet',
    description: 'Property tracking and analysis',
    icon: Table2,
    link: '/ai-hub',
    color: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
  },
  {
    name: 'JBJ CRM',
    description: 'Complete lead management system',
    icon: Users,
    link: '/crm',
    color: 'text-pink-400',
    glowColor: 'shadow-pink-500/30',
    bgColor: 'bg-pink-500/10',
  },
  {
    name: 'JBJ Documents',
    description: 'Contracts, templates, and files',
    icon: FolderOpen,
    link: '/ai-hub',
    color: 'text-yellow-400',
    glowColor: 'shadow-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
  },
  {
    name: 'JBJ Video Meet',
    description: 'HD video calls with clients',
    icon: VideoIcon,
    link: '/video-meeting',
    color: 'text-blue-400',
    glowColor: 'shadow-blue-500/30',
    bgColor: 'bg-blue-500/10',
  },
  {
    name: 'JBJ Referral Hub',
    description: 'Earn through referrals — Open to everyone',
    icon: Share2,
    link: '/referral',
    color: 'text-orange-400',
    glowColor: 'shadow-orange-500/30',
    bgColor: 'bg-orange-500/10',
    badge: 'Open to All',
  },
  {
    name: 'JBJ Content Generator',
    description: 'AI-powered marketing content',
    icon: Sparkles,
    link: '/ai-hub',
    color: 'text-violet-400',
    glowColor: 'shadow-violet-500/30',
    bgColor: 'bg-violet-500/10',
  },
];

const AdvancedBrokerToolkit = () => {
  const navigate = useNavigate();

  const renderTeamCard = (member: typeof PROFESSIONAL_SUPPORT[0], index: number) => (
    <motion.div key={index} variants={fadeInUp}>
      <Card className={`bg-zinc-900/60 border ${member.borderColor} hover:border-gold transition-all duration-300 h-full shadow-lg ${member.glowColor} hover:shadow-xl hover:shadow-gold/30 group-hover:scale-[1.02]`}>
        <CardContent className="p-5">
          <div className={`w-12 h-12 ${member.bgColor} rounded-xl flex items-center justify-center mb-4`}>
            <member.icon className={`h-6 w-6 ${member.color}`} />
          </div>
          <h4 className="text-white font-semibold mb-1">{member.role}</h4>
          <p className={`${member.color} text-sm mb-2`}>{member.name}</p>
          <p className="text-zinc-500 text-sm">{member.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderTrainingCard = (item: typeof TRAINING_DEVELOPMENT[0], index: number) => (
    <motion.div key={index} variants={fadeInUp}>
      <Card className={`bg-zinc-900/60 border-zinc-800 hover:border-gold transition-all duration-300 h-full shadow-lg ${item.glowColor} hover:shadow-xl hover:shadow-gold/30 cursor-pointer group`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white text-sm font-medium">{item.name}</h4>
              <p className="text-zinc-500 text-xs truncate">{item.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderToolCard = (tool: typeof TOOLS_OPERATIONS[0], index: number) => (
    <motion.div key={index} variants={fadeInUp}>
      <Link to={tool.link}>
        <Card className={`bg-zinc-900/60 border-zinc-800 hover:border-gold transition-all duration-300 h-full shadow-lg ${tool.glowColor} hover:shadow-xl hover:shadow-gold/30 group cursor-pointer`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${tool.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <tool.icon className={`h-5 w-5 ${tool.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-white text-sm font-medium truncate">{tool.name}</h4>
                  {'badge' in tool && tool.badge && (
                    <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] px-1.5 py-0">
                      {tool.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-zinc-500 text-xs truncate">{tool.description}</p>
              </div>
              <ArrowRight className={`h-4 w-4 ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-black via-zinc-950 to-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge className="bg-gold/20 text-gold border-gold/30 mb-4">
            <Briefcase className="w-3 h-3 mr-1" />
            Advanced Broker Toolkit
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Everything You Need to <span className="text-gold">Succeed</span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Access professional support, media services, training, and AI-powered tools — all included in your JBJ membership.
          </p>
        </motion.div>

        {/* Tabs for categories */}
        <Tabs defaultValue="support" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-transparent h-auto mb-8">
            <TabsTrigger 
              value="support" 
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold data-[state=active]:border-gold/40 border border-zinc-700 bg-zinc-900/50 py-3"
            >
              <Users className="h-4 w-4 mr-2" />
              Professional Support
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/40 border border-zinc-700 bg-zinc-900/50 py-3"
            >
              <Camera className="h-4 w-4 mr-2" />
              Media & Marketing
            </TabsTrigger>
            <TabsTrigger 
              value="training" 
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:border-green-500/40 border border-zinc-700 bg-zinc-900/50 py-3"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Training
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/40 border border-zinc-700 bg-zinc-900/50 py-3"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Tools & Operations
            </TabsTrigger>
          </TabsList>

          {/* (A) Professional Support */}
          <TabsContent value="support">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
            >
              {PROFESSIONAL_SUPPORT.map((member, index) => renderTeamCard(member, index))}
            </motion.div>
          </TabsContent>

          {/* (B) Media & Marketing */}
          <TabsContent value="media">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {MEDIA_MARKETING.map((member, index) => renderTeamCard(member, index))}
            </motion.div>
          </TabsContent>

          {/* (C) Training & Development */}
          <TabsContent value="training">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {TRAINING_DEVELOPMENT.map((item, index) => renderTrainingCard(item, index))}
            </motion.div>
          </TabsContent>

          {/* (D) Tools & Operations */}
          <TabsContent value="tools">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {TOOLS_OPERATIONS.map((tool, index) => renderToolCard(tool, index))}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/broker-toolkit">
              <Button className="gap-2 bg-gold hover:bg-gold/90 text-black px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-gold/20">
                <Award className="h-5 w-5" />
                Join Broker Circle — Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/ai-hub">
              <Button variant="secondary" className="gap-2 px-8 py-6 text-lg">
                <Brain className="h-5 w-5" />
                Explore All Tools
              </Button>
            </Link>
          </div>
          
          {/* Contact Info */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-zinc-500">
            <a href="mailto:support@jbj.ae" className="flex items-center gap-2 hover:text-gold transition-colors">
              <Mail className="h-4 w-4" />
              support@jbj.ae
            </a>
            <a href="tel:+971565911000" className="flex items-center gap-2 hover:text-gold transition-colors">
              <Phone className="h-4 w-4" />
              +971 56 591 1000
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AdvancedBrokerToolkit;
