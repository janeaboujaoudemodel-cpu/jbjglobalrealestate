import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePointsLedger } from '@/hooks/usePointsLedger';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3, Heart, Star, User, Calculator, TrendingUp,
  Home, BookOpen, FileText, Compass, ArrowRight, Sparkles,
  PieChart, Search, Shield, MapPin, Trophy, FolderOpen,
  FileSignature, ArrowUpRight, Palette, Wrench, Ticket,
  FileUp, Award
} from 'lucide-react';
import { format } from 'date-fns';

// Book cover imports
import investorEducationCover from '@/assets/books/investor-education-cover.jpg';
import marketIntelligenceCover from '@/assets/books/market-intelligence-cover.jpg';
import goldenVisaCover from '@/assets/books/golden-visa-cover.jpg';
import buyerGuideCover from '@/assets/books/buyer-guide-cover.jpg';

const quickCards = [
  { title: 'Dashboard', desc: 'Overview of your investments', icon: BarChart3, href: '/investor-dashboard', color: 'from-fuchsia-500 to-purple-600' },
  { title: 'Favorites', desc: 'Saved properties', icon: Heart, href: '/favorites', color: 'from-rose-500 to-pink-600' },
  { title: 'Shortlisted', desc: 'Compare properties', icon: Star, href: '/compare', color: 'from-amber-500 to-orange-600' },
  { title: 'My Profile', desc: 'Account settings', icon: User, href: '/profile', color: 'from-blue-500 to-indigo-600' },
  { title: 'My Listings', desc: 'Manage your listings', icon: FileSignature, href: '/listing-portal', color: 'from-emerald-500 to-teal-600' },
  { title: 'My Documents', desc: 'Uploaded documents', icon: FolderOpen, href: '/investor-documents', color: 'from-cyan-500 to-blue-600' },
];

const aiTools = [
  { title: 'Property Analyzer', desc: 'AI-powered property evaluation', icon: Search, href: '/ai-property-analyzer' },
  { title: 'ROI Calculator', desc: 'Calculate return on investment', icon: TrendingUp, href: '/ai-roi-calculator' },
  { title: 'Mortgage Calculator', desc: 'Plan your financing', icon: Calculator, href: '/mortgage-calculator' },
  { title: 'Home Finder', desc: 'AI quiz to find your match', icon: Home, href: '/quiz' },
  { title: 'Price Predictor', desc: 'Forecast market trends', icon: PieChart, href: '/ai-price-predictor' },
  { title: 'Neighborhood Insights', desc: 'Area intelligence', icon: MapPin, href: '/ai-neighborhood-insights' },
];

const investorBooks = [
  { title: 'Investor Education Guide', cover: investorEducationCover, href: '/investor-education' },
  { title: 'Market Intelligence Report', cover: marketIntelligenceCover, href: '/market-intelligence' },
  { title: 'Golden Visa UAE Guide', cover: goldenVisaCover, href: '/guides/golden-visa-uae' },
  { title: "Buyer's Guide", cover: buyerGuideCover, href: '/buyer-guide' },
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
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setTicketsLoading(false); return; }
    const fetchTickets = async () => {
      try {
        const { data } = await supabase
          .from('support_tickets')
          .select('id, ticket_number, subject, status, priority, created_at')
          .eq('email', user.email || '')
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) setSupportTickets(data);
      } catch (err) {
        console.error('Error fetching tickets:', err);
      } finally {
        setTicketsLoading(false);
      }
    };
    fetchTickets();
  }, [user]);

  const openTickets = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

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
              Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-zinc-400">Your central hub for property investment tools, insights, and portfolio management.</p>
            {/* Favorites & Shortlist */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <Link
                to="/favorites"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500/15 to-pink-500/15 border border-rose-500/30 text-rose-400 hover:border-rose-400 hover:bg-rose-500/20 transition-all text-sm font-medium"
              >
                <Heart className="w-4 h-4" />
                My Favorites
              </Link>
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20 transition-all text-sm font-medium"
              >
                <Star className="w-4 h-4" />
                My Shortlist
              </Link>
            </div>
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

        {/* Quick Access - Premium */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickCards.map(card => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={card.title}
                  onClick={() => navigate(card.href)}
                  className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-fuchsia-500/25 rounded-2xl p-5 text-left hover:border-fuchsia-400/60 transition-all group overflow-hidden"
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1 relative z-10">{card.title}</h3>
                  <p className="text-zinc-500 text-xs relative z-10">{card.desc}</p>
                  <ArrowRight className="w-4 h-4 text-fuchsia-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Books, Guides & Intelligence - Bookshelf */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            Books, Guides & Intelligence
          </h2>
          <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-amber-500/20 overflow-hidden">
            <CardContent className="p-8">
              {/* Bookshelf */}
              <div className="flex flex-wrap justify-center gap-8">
                {investorBooks.map((book) => (
                  <motion.button
                    key={book.title}
                    onClick={() => navigate(book.href)}
                    className="group flex flex-col items-center gap-3 w-36"
                    whileHover={{ y: -8 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {/* Book with 3D effect */}
                    <div className="relative w-32 h-44 rounded-r-md overflow-hidden shadow-[4px_4px_20px_rgba(0,0,0,0.6)] group-hover:shadow-[6px_6px_30px_rgba(200,167,102,0.3)] transition-shadow">
                      {/* Spine effect */}
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 to-transparent z-10" />
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Glossy overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-zinc-400 text-center font-medium group-hover:text-amber-300 transition-colors leading-tight">
                      {book.title}
                    </p>
                  </motion.button>
                ))}
              </div>
              {/* Shelf line */}
              <div className="mt-6 h-1 bg-gradient-to-r from-transparent via-amber-800/50 to-transparent rounded-full" />
            </CardContent>
          </Card>
        </div>

        {/* AI Investment Tools */}
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

        {/* Support Tickets */}
        {user && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-fuchsia-400" />
              Support Tickets
            </h2>
            <Card className="bg-zinc-900/60 border border-zinc-800">
              <CardContent className="p-6">
                {supportTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <Ticket className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500">No support tickets</p>
                    <Button
                      className="mt-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium"
                      onClick={() => navigate('/support')}
                    >
                      Create a Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-zinc-400">{openTickets} open ticket{openTickets !== 1 ? 's' : ''}</p>
                      <Button
                        size="sm"
                        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium"
                        onClick={() => navigate('/support')}
                      >
                        New Ticket
                      </Button>
                    </div>
                    {supportTickets.map((ticket: any) => (
                      <button
                        key={ticket.id}
                        onClick={() => navigate(`/support?ticket=${ticket.id}`)}
                        className="w-full flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div>
                          <p className="text-sm text-white">{ticket.subject}</p>
                          <p className="text-xs text-zinc-500">#{ticket.ticket_number} · {format(new Date(ticket.created_at), 'MMM d')}</p>
                        </div>
                        <Badge className={
                          ticket.status === 'open' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }>
                          {ticket.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Documents */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-fuchsia-400" />
            My Documents
          </h2>
          <Card className="bg-zinc-900/60 border border-fuchsia-500/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Emirates ID', icon: FileText },
                  { label: 'Title Deeds', icon: FileText },
                  { label: 'SPA / Contracts', icon: FileText },
                  { label: 'Other Documents', icon: Award },
                ].map(doc => (
                  <div key={doc.label} className="p-4 bg-zinc-800/50 rounded-xl text-center border border-zinc-700/50 hover:border-fuchsia-500/30 transition-colors cursor-pointer">
                    <doc.icon className="w-8 h-8 mx-auto text-fuchsia-400 mb-2" />
                    <p className="text-xs text-zinc-400">{doc.label}</p>
                  </div>
                ))}
              </div>
              <Button
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium"
                onClick={() => navigate('/investor-documents')}
              >
                <FileUp className="w-4 h-4 mr-2" />
                Upload & Manage Documents
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Explore All Tools CTA */}
        <div className="bg-gradient-to-r from-indigo-900/30 to-fuchsia-900/30 border border-fuchsia-500/20 rounded-2xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-fuchsia-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Explore All AI Tools</h3>
          <p className="text-zinc-400 text-sm mb-4">Access 30+ free AI tools including creative suites, corporate tools, and productivity apps.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/ai-hub')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-medium">
              Go to JBJ Tools Hub
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={() => navigate('/ai-hub?suite=creative')} className="bg-pink-600 hover:bg-pink-700 text-white font-medium">
              <Palette className="w-4 h-4 mr-2" />
              Creative Suite
            </Button>
            <Button onClick={() => navigate('/ai-hub?suite=productivity')} className="bg-teal-600 hover:bg-teal-700 text-white font-medium">
              <Wrench className="w-4 h-4 mr-2" />
              Productivity Suite
            </Button>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 border border-fuchsia-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to Find Your Next Investment?</h3>
          <p className="text-zinc-400 text-sm mb-4">Browse 10,000+ properties across Dubai's top communities.</p>
          <Button onClick={() => navigate('/properties')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-medium">
            Browse Properties
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default InvestorHub;
