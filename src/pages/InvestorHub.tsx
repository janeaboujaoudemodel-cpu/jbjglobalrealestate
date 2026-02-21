import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3, Heart, Star, User, Calculator, TrendingUp,
  Home, BookOpen, FileText, Compass, ArrowRight, Sparkles,
  PieChart, Search, Shield, MapPin
} from 'lucide-react';

const quickCards = [
  { title: 'Dashboard', desc: 'Overview of your investments', icon: BarChart3, href: '/investor-dashboard', color: 'from-fuchsia-500 to-purple-600' },
  { title: 'Favorites', desc: 'Saved properties', icon: Heart, href: '/favorites', color: 'from-rose-500 to-pink-600' },
  { title: 'Shortlisted', desc: 'Compare properties', icon: Star, href: '/compare', color: 'from-amber-500 to-orange-600' },
  { title: 'My Profile', desc: 'Account settings', icon: User, href: '/profile', color: 'from-blue-500 to-indigo-600' },
];

const aiTools = [
  { title: 'Property Analyzer', desc: 'AI-powered property evaluation', icon: Search, href: '/ai-property-analyzer' },
  { title: 'ROI Calculator', desc: 'Calculate return on investment', icon: TrendingUp, href: '/ai-roi-calculator' },
  { title: 'Mortgage Calculator', desc: 'Plan your financing', icon: Calculator, href: '/mortgage-calculator' },
  { title: 'Home Finder', desc: 'AI quiz to find your match', icon: Home, href: '/quiz' },
  { title: 'Price Predictor', desc: 'Forecast market trends', icon: PieChart, href: '/ai-price-predictor' },
  { title: 'Neighborhood Insights', desc: 'Area intelligence', icon: MapPin, href: '/ai-neighborhood-insights' },
];

const resources = [
  { title: 'Investor Education', desc: 'Learning resources', icon: BookOpen, href: '/investor-education' },
  { title: 'Buyer Guide', desc: 'Step-by-step buying guide', icon: FileText, href: '/buyer-guide' },
  { title: 'Listing Portal', desc: 'AI-powered property listing', icon: FileText, href: '/listing-portal' },
  { title: 'Market Intelligence', desc: 'Reports & data', icon: Compass, href: '/market-intelligence' },
  { title: 'Golden Visa Guide', desc: 'UAE residency through investment', icon: Shield, href: '/guides/golden-visa-uae' },
];

const InvestorHub = () => {
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
              Investor Hub
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋
            </h1>
            <p className="text-zinc-400">Your central hub for property investment tools, insights, and portfolio management.</p>
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

        {/* AI Tools */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">AI Investment Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {aiTools.map(tool => {
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

        {/* Resources */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Education & Guides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {resources.map(res => {
              const Icon = res.icon;
              return (
                <button
                  key={res.title}
                  onClick={() => navigate(res.href)}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left hover:border-fuchsia-500/40 transition-all"
                >
                  <Icon className="w-5 h-5 text-fuchsia-400 mb-2" />
                  <h3 className="text-white font-medium text-sm">{res.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1">{res.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 border border-fuchsia-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to Find Your Next Investment?</h3>
          <p className="text-zinc-400 text-sm mb-4">Browse 10,000+ properties across Dubai's top communities.</p>
          <Button onClick={() => navigate('/properties')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">
            Browse Properties
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default InvestorHub;
