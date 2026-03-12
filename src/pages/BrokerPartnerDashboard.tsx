import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Briefcase, 
  Search, 
  Users, 
  FileText,
  BookOpen,
  Settings,
  Bell,
  ChevronRight,
  Building2,
  Star,
  Download,
  User,
  ExternalLink,
  TrendingUp,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Mock data for demonstration
const MOCK_SHORTLIST = [
  {
    id: '1',
    clientName: 'Ahmed K.',
    properties: 5,
    budget: 'AED 2-3M',
    lastUpdated: '2 days ago',
    status: 'active'
  },
  {
    id: '2',
    clientName: 'Sarah M.',
    properties: 3,
    budget: 'AED 1.5-2M',
    lastUpdated: '1 week ago',
    status: 'pending'
  }
];

const MOCK_REPORTS = [
  { name: 'Dubai Marina Market Report Q4 2024', type: 'Market Report', date: 'Jan 2025' },
  { name: 'Downtown Dubai Price Analysis', type: 'Area Analysis', date: 'Dec 2024' },
  { name: 'Off-Plan Investment Guide 2025', type: 'Investment Guide', date: 'Jan 2025' }
];

const QUICK_TOOLS = [
  { name: 'Property Search', icon: Search, href: '/properties', description: 'Search all listings' },
  { name: 'Area Guides', icon: MapPin, href: '/areas', description: 'Explore neighborhoods' },
  { name: 'Market Data', icon: TrendingUp, href: '/market-intelligence', description: 'Market insights' },
  { name: 'Mortgage Calc', icon: Building2, href: '/mortgage-calculator', description: 'Calculate payments' }
];

const BrokerPartnerDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profileName, setProfileName] = useState("Broker Partner");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Fetch profile name
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data?.full_name) {
        setProfileName(data.full_name);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-2">
                External Partner
              </Badge>
              <h1 className="text-3xl font-bold mb-2">Broker Partner Dashboard</h1>
              <p className="text-zinc-400">Access property tools, reports, and resources for your clients</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-zinc-800 text-purple-400">
                      {profileName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium">{profileName}</p>
                    <p className="text-xs text-zinc-400">Broker Partner</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuItem asChild>
                  <Link to="/my-account" className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-account" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-400 cursor-pointer">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>

          {/* Quick Search */}
          <motion.div variants={fadeInUp} className="mb-8">
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Property Search</h3>
                <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <Input
                      placeholder="Search properties by location, developer, or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-zinc-900/80 border-zinc-700 h-12"
                    />
                  </div>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 h-12 px-8">
                    Search
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {QUICK_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.name} to={tool.href}>
                  <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                          <Icon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-purple-400 transition-colors">{tool.name}</p>
                          <p className="text-xs text-zinc-500">{tool.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Client Shortlisting */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        Client Shortlisting
                      </CardTitle>
                      <CardDescription>Properties saved for your clients</CardDescription>
                    </div>
                    <Link to="/favorites">
                      <Button variant="outline" className="border-zinc-700">
                        Create New List
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {MOCK_SHORTLIST.map((list) => (
                        <div 
                          key={list.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <User className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                              <h4 className="font-medium">{list.clientName}</h4>
                              <p className="text-sm text-zinc-400">{list.properties} properties • {list.budget}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-zinc-500 hidden md:block">{list.lastUpdated}</span>
                            <Badge className={list.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
                              {list.status === 'active' ? 'Active' : 'Follow-up'}
                            </Badge>
                            <ChevronRight className="w-5 h-5 text-zinc-500" />
                          </div>
                        </div>
                      ))}
                      
                      {MOCK_SHORTLIST.length === 0 && (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                          <p className="text-zinc-400 mb-4">No client shortlists yet</p>
                          <Link to="/favorites">
                            <Button className="bg-purple-600 hover:bg-purple-700">
                              Create First Shortlist
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Saved Reports */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      Saved Reports
                    </CardTitle>
                    <CardDescription>Market reports and analysis documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {MOCK_REPORTS.map((report, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{report.name}</h4>
                              <p className="text-xs text-zinc-500">{report.type} • {report.date}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <Link to="/market-intelligence/reports">
                      <Button variant="link" className="text-purple-400 p-0 mt-4">
                        View All Reports <ExternalLink className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Broker Resources */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-purple-400" />
                      Broker Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Link to="/broker-resources">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                          <FileText className="w-5 h-5 text-zinc-400" />
                          <span className="text-sm">Marketing Materials</span>
                        </div>
                      </Link>
                      <Link to="/areas">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                          <MapPin className="w-5 h-5 text-zinc-400" />
                          <span className="text-sm">Area Guides</span>
                        </div>
                      </Link>
                      <Link to="/developers">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                          <Building2 className="w-5 h-5 text-zinc-400" />
                          <span className="text-sm">Developer Directory</span>
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Broker Education */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                      Broker Education
                    </CardTitle>
                    <CardDescription>Access learning materials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Link to="/broker-education">
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer">
                          <p className="font-medium text-sm mb-1">Course Library</p>
                          <p className="text-xs text-zinc-500">Access broker training materials</p>
                        </div>
                      </Link>
                      <Link to="/broker-faq">
                        <div className="p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer">
                          <p className="font-medium text-sm mb-1">Broker FAQ</p>
                          <p className="text-xs text-zinc-500">Common questions answered</p>
                        </div>
                      </Link>
                    </div>
                    <p className="text-xs text-zinc-500 mt-4">
                      <Star className="w-3 h-3 inline mr-1" />
                      Read-only access for external partners
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Partnership Info */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border-purple-500/30">
                  <CardContent className="p-6 text-center">
                    <Briefcase className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Partner with JBJ</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                      Interested in deeper collaboration? Contact our partnership team.
                    </p>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" asChild>
                      <Link to="/contact?type=partnership">Contact Partnerships</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Footer Note */}
          <motion.div variants={fadeInUp} className="mt-12 text-center">
            <p className="text-xs text-zinc-600">
              External Broker Partner access. CRM features are available to JBJ Internal Brokers only.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default BrokerPartnerDashboard;
