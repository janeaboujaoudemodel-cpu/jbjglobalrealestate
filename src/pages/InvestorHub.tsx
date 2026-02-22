import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePointsLedger } from '@/hooks/usePointsLedger';
import {
  BarChart3, Heart, Star, User, Calculator, TrendingUp,
  Home, BookOpen, FileText, Compass, ArrowRight, Sparkles,
  PieChart, Search, Shield, MapPin, Trophy, FolderOpen,
  FileSignature, ArrowUpRight
} from 'lucide-react';

const quickCards = [
  { title: 'Dashboard', desc: 'Overview of your investments', icon: BarChart3, href: '/investor-dashboard', color: 'from-fuchsia-500 to-purple-600' },
  { title: 'Favorites', desc: 'Saved properties', icon: Heart, href: '/favorites', color: 'from-rose-500 to-pink-600' },
  { title: 'Shortlisted', desc: 'Compare properties', icon: Star, href: '/compare', color: 'from-amber-500 to-orange-600' },
  { title: 'My Profile', desc: 'Account settings', icon: User, href: '/profile', color: 'from-blue-500 to-indigo-600' },
  { title: 'My Listings', desc: 'Manage your listings', icon: FileSignature, href: '/listing-portal', color: 'from-emerald-500 to-teal-600' },
  { title: 'My Documents', desc: 'Uploaded documents', icon: FolderOpen, href: '/my-account', color: 'from-cyan-500 to-blue-600' },
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

const tierConfig = [
  { min: 0, max: 4999, name: 'Bronze', color: 'from-amber-700 to-amber-900', text: 'text-amber-300' },
  { min: 5000, max: 14999, name: 'Silver', color: 'from-zinc-400 to-zinc-600', text: 'text-zinc-200' },
  { min: 15000, max: 29999, name: 'Gold', color: 'from-yellow-500 to-amber-600', text: 'text-yellow-200' },
  { min: 30000, max: 49999, name: 'Platinum', color: 'from-cyan-400 to-blue-600', text: 'text-cyan-200' },
  { min: 50000, max: Infinity, name: 'Diamond', color: 'from-purple-400 to-fuchsia-600', text: 'text-purple-200' },
];

function getTier(points: number) {
  return tierConfig.find(t => points >= t.min && points <= t.max) || tierConfig[0];
}

const InvestorHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { summary, isLoading } = usePointsLedger();
  const tier = getTier(summary.totalPoints);

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
              JBJ Investor Hub
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋
            </h1>
            <p className="text-zinc-400">Your central hub for property investment tools, insights, and portfolio management.</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20 space-y-12">
        {/* Points & Tier */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-zinc-900/60 border border-fuchsia-500/20 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center flex-shrink-0`}>
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-zinc-400 text-sm mb-1">Your Tier</p>
                    <h3 className={`text-2xl font-bold ${tier.text}`}>{tier.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{isLoading ? '...' : summary.totalPoints.toLocaleString()}</p>
                      <p className="text-zinc-500 text-xs">Total Points</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">{isLoading ? '...' : summary.dealPoints.toLocaleString()}</p>
                      <p className="text-zinc-500 text-xs">Deal Points</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{isLoading ? '...' : summary.activityPoints.toLocaleString()}</p>
                      <p className="text-zinc-500 text-xs">Activity</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-400">{isLoading ? '...' : summary.referralPoints.toLocaleString()}</p>
                      <p className="text-zinc-500 text-xs">Referral</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Access */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
