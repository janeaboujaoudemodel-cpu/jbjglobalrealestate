import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import InvestorDocumentVault from "@/components/investor/InvestorDocumentVault";
import CTABand from "@/components/home/CTABand";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import {
  LayoutDashboard,
  Building2,
  FileText,
  TrendingUp,
  Bell,
  Settings,
  User,
  ChevronDown,
  LogOut,
  Eye,
  Download,
  Clock,
  MapPin,
  BarChart3,
  Briefcase,
  FolderOpen,
  HelpCircle,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Shield,
  Heart,
  Search,
  ListChecks,
  Phone,
  Mail,
  BookOpen,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Types
interface InvestorProfile {
  id: string;
  full_name: string | null;
  photo_url: string | null;
  phone_number: string | null;
}

interface LinkedProperty {
  id: string;
  name: string;
  location: string;
  emirate: string;
  type: 'off-plan' | 'ready';
  status: 'owned' | 'reserved' | 'under_evaluation';
  image_url: string | null;
}

interface Report {
  id: string;
  name: string;
  type: 'market' | 'area' | 'project';
  generated_at: string;
  file_url: string | null;
}

interface Document {
  id: string;
  name: string;
  property_name: string | null;
  uploaded_at: string;
  file_url: string | null;
}

interface ActivityItem {
  id: string;
  type: 'status_update' | 'admin_action' | 'report_available' | 'notification';
  message: string;
  created_at: string;
}

interface RequestItem {
  id: string;
  type: 'consultation' | 'shortlist' | 'list_property' | 'support';
  label: string;
  status: 'not_submitted' | 'submitted' | 'in_review';
}

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard data states
  const [linkedProperties, setLinkedProperties] = useState<LinkedProperty[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([
    { id: '1', type: 'consultation', label: 'Private Consultation Request', status: 'not_submitted' },
    { id: '2', type: 'shortlist', label: 'Curated Shortlist Request', status: 'not_submitted' },
    { id: '3', type: 'list_property', label: 'List Your Property Request', status: 'not_submitted' },
    { id: '4', type: 'support', label: 'Support Ticket', status: 'not_submitted' },
  ]);

  // KPI stats
  const [stats, setStats] = useState({
    watchlistProjects: 0,
    savedSearches: 0,
    reportsAvailable: 0,
    activeRequests: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/investor-dashboard");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          id: profileData.id,
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          photo_url: null,
        });
      }

      // Fetch linked properties (from favorites as watchlist)
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('id, project_id, created_at')
        .eq('user_id', user.id)
        .limit(10);

      if (favoritesData && favoritesData.length > 0) {
        const projectIds = favoritesData.map(f => f.project_id);
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name, location, emirate, status')
          .in('id', projectIds);

        if (projectsData) {
          const properties: LinkedProperty[] = projectsData.map(p => ({
            id: p.id,
            name: p.name,
            location: p.location || '',
            emirate: p.emirate || 'Dubai',
            type: p.status === 'off-plan' ? 'off-plan' : 'ready',
            status: 'under_evaluation' as const,
            image_url: null,
          }));
          setLinkedProperties(properties);
          setStats(prev => ({ 
            ...prev, 
            watchlistProjects: properties.length,
          }));
        }
      }

      // Fetch support tickets as activities
      const { data: ticketData } = await supabase
        .from('chat_conversations')
        .select('id, status, created_at, service_type')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ticketData) {
        const activityItems: ActivityItem[] = ticketData.map(t => ({
          id: t.id,
          type: 'notification' as const,
          message: `Support ticket: ${t.service_type || 'General Inquiry'} - ${t.status}`,
          created_at: t.created_at,
        }));
        setActivities(activityItems);
        
        // Update active requests count
        const activeCount = ticketData.filter(t => t.status !== 'closed').length;
        setStats(prev => ({ ...prev, activeRequests: activeCount }));
      }

      setStats(prev => ({ ...prev, reportsAvailable: 0, savedSearches: 0 }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status: LinkedProperty['status']) => {
    const styles = {
      owned: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      reserved: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      under_evaluation: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    };
    const labels = {
      owned: 'Owned',
      reserved: 'Reserved',
      under_evaluation: 'Under Evaluation',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: 'off-plan' | 'ready') => {
    return (
      <Badge variant="outline" className={type === 'off-plan' ? 'border-gold/50 text-gold' : 'border-emerald-500/50 text-emerald-600'}>
        {type === 'off-plan' ? 'Off-Plan' : 'Ready'}
      </Badge>
    );
  };

  const getRequestStatusBadge = (status: RequestItem['status']) => {
    const styles = {
      not_submitted: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30',
      submitted: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      in_review: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    };
    const labels = {
      not_submitted: 'Not Submitted',
      submitted: 'Submitted',
      in_review: 'In Review',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const whatsappMessage = "Hi JBJ Global Real Estate, I'm an investor and I'd like support with my dashboard.";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-6"
        >
          {/* HERO / HEADER BLOCK */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="w-20 h-20 border-2 border-gold/30">
                      <AvatarImage src={profile?.photo_url || undefined} />
                      <AvatarFallback className="bg-gold/20 text-gold text-xl">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left">
                      <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1">
                        Investor Dashboard
                      </h1>
                      <p className="text-lg font-medium text-foreground mb-1">
                        Your Portfolio. Your Reports. One Private Workspace.
                      </p>
                      <p className="text-muted-foreground text-sm mb-3">
                        A secure investor workspace for tracking watchlists, accessing market intelligence, and managing your requests with JBJ Global Real Estate.
                      </p>
                      <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                        <Badge className="bg-gold/20 text-gold border-gold/30">
                          <User className="w-3 h-3 mr-1" />
                          Investor Account
                        </Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" className="gap-2">
                        <span className="hidden sm:inline">{profile?.full_name || user?.email?.split('@')[0]}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate('/my-account')}>
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Hero CTAs */}
                <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                  <Link to="/contact?type=consultation">
                    <Button variant="primary">
                      Request a Private Consultation
                    </Button>
                  </Link>
                  <a href={getWhatsAppUrl(whatsappMessage)} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Ask JBJ on WhatsApp
                    </Button>
                  </a>
                </div>

                <p className="text-xs text-muted-foreground mt-4 text-center md:text-left">
                  Information shown here is personalized and may depend on the data you choose to add. Market information is provided for guidance and is subject to change.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* SECTION 1: Snapshot (KPI Cards Row) */}
          <motion.div variants={fadeInUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.watchlistProjects}</p>
                      <p className="text-xs text-muted-foreground">Watchlist Projects</p>
                      <p className="text-[10px] text-muted-foreground/70">Projects you saved for comparison.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <Search className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.savedSearches}</p>
                      <p className="text-xs text-muted-foreground">Saved Searches</p>
                      <p className="text-[10px] text-muted-foreground/70">Filters you saved for quick access.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.reportsAvailable}</p>
                      <p className="text-xs text-muted-foreground">Reports Available</p>
                      <p className="text-[10px] text-muted-foreground/70">Market/area reports you can open anytime.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <ListChecks className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.activeRequests}</p>
                      <p className="text-xs text-muted-foreground">Active Requests</p>
                      <p className="text-[10px] text-muted-foreground/70">Consultations, shortlist requests, and support tickets.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* SECTION 2: Quick Actions */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gold" />
              Quick Actions
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/contact?type=shortlist">
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] hover:border-gold transition-colors cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                      <ListChecks className="w-5 h-5 text-gold" />
                    </div>
                    <h4 className="font-semibold text-foreground group-hover:text-gold transition-colors mb-1">Get a Curated Shortlist</h4>
                    <p className="text-xs text-muted-foreground">Tell us your budget, timeline, and priorities — we'll prepare a curated shortlist with clear comparisons.</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/compare">
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] hover:border-gold transition-colors cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                      <BarChart3 className="w-5 h-5 text-gold" />
                    </div>
                    <h4 className="font-semibold text-foreground group-hover:text-gold transition-colors mb-1">Compare Projects</h4>
                    <p className="text-xs text-muted-foreground">Compare price per sqft, payment plan structure, handover timing, and location positioning.</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/contact?type=roi">
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] hover:border-gold transition-colors cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                      <TrendingUp className="w-5 h-5 text-gold" />
                    </div>
                    <h4 className="font-semibold text-foreground group-hover:text-gold transition-colors mb-1">Request ROI Snapshot</h4>
                    <p className="text-xs text-muted-foreground">Receive a structured rental/resale context snapshot based on available official data sources.</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/contact?type=advisor">
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] hover:border-gold transition-colors cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                      <MessageCircle className="w-5 h-5 text-gold" />
                    </div>
                    <h4 className="font-semibold text-foreground group-hover:text-gold transition-colors mb-1">Speak to an Advisor</h4>
                    <p className="text-xs text-muted-foreground">Book a private consultation for investment strategy and market navigation.</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.div>

          {/* SECTION 3: Your Watchlist */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-gold" />
              Your Watchlist
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Save projects you want to revisit, compare, or discuss with our team.
            </p>
            {linkedProperties.length === 0 ? (
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <CardContent className="p-8 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">No projects saved yet.</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Add projects to your watchlist from the Buy Properties portal, then return here to compare and request a shortlist.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Link to="/properties?transactionType=buy">
                      <Button variant="primary">
                        Browse Buy Properties
                      </Button>
                    </Link>
                    <Link to="/contact?type=shortlist">
                      <Button variant="secondary">
                        Request a Shortlist
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {linkedProperties.map((property) => (
                  <Card key={property.id} className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] overflow-hidden group hover:border-gold transition-colors">
                    <div className="aspect-video relative overflow-hidden bg-zinc-100">
                      {property.image_url ? (
                        <img 
                          src={property.image_url} 
                          alt={property.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {getTypeBadge(property.type)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-1 line-clamp-1">{property.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3" />
                        {property.location}, {property.emirate}
                      </p>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(property.status)}
                        <div className="flex gap-2">
                          <Link to={`/project/${property.id}`}>
                            <Button variant="secondary" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>

          {/* SECTION 4: Portfolio Views */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gold" />
              Portfolio Views
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Build a simple view of your holdings and target allocations. You control what you add.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <CardContent className="p-5 text-center">
                  <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-foreground">Owned Assets</p>
                  <Badge className="mt-2 bg-zinc-500/10 text-zinc-500 border-zinc-500/30">Coming Soon</Badge>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <CardContent className="p-5 text-center">
                  <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-foreground">Target Assets (Wishlist)</p>
                  <p className="text-xs text-muted-foreground mt-1">Add from watchlist</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <CardContent className="p-5 text-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-foreground">Rental Performance Notes</p>
                  <p className="text-xs text-muted-foreground mt-1">Optional</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <CardContent className="p-5 text-center">
                  <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-foreground">Document Vault</p>
                  <p className="text-xs text-muted-foreground mt-1">Private</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Portfolio views appear once you add at least one asset or wishlist target. You can start by requesting setup support.
            </p>
            <div className="mt-3">
              <Link to="/contact?type=portfolio">
                <Button variant="secondary">
                  Request Portfolio Setup
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* SECTION 5: Report Access */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              Report Access
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Open the latest market and area intelligence available to you.
            </p>
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Link to="/market-intelligence" className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gold/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-gold" />
                        <span className="font-medium text-foreground">Market Overview</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                    </div>
                  </Link>
                  <Link to="/market-intelligence/areas" className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gold/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gold" />
                        <span className="font-medium text-foreground">Area Intelligence</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                    </div>
                  </Link>
                  <Link to="/market-intelligence/reports" className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gold/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gold" />
                        <span className="font-medium text-foreground">Market Reports</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                    </div>
                  </Link>
                  <Link to="/market-intelligence/methodology" className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gold/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-gold" />
                        <span className="font-medium text-foreground">Methodology & Sources</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2">
              Reports are built from aggregated official open-data sources where available, and are provided for informational purposes only.
            </p>
          </motion.div>

          {/* SECTION 6: My Documents (Upload & Sync) */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gold" />
              My Documents
            </h3>
            <InvestorDocumentVault userId={user?.id || ""} />
          </motion.div>

          {/* SECTION 7: Requests & Support */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-gold" />
              Requests & Support
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track your active requests and submissions in one place.
            </p>
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Request Type</TableHead>
                    <TableHead className="text-right text-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium text-foreground">{request.label}</TableCell>
                      <TableCell className="text-right">
                        {getRequestStatusBadge(request.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <p className="text-xs text-muted-foreground mt-2">
              Once you submit a request, its status will appear here.
            </p>
          </motion.div>

          {/* SECTION 8: How This Dashboard Works */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gold" />
              How This Dashboard Works
            </h3>
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>You can explore the platform freely as a visitor.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>When you submit an investor request (shortlist, consultation, or report access), your dashboard becomes your private workspace.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>You decide what you add (watchlist, portfolio items, documents).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>JBJ may respond to your requests and upload report files or comparisons into your workspace, visible only to you and authorized JBJ administrators.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* SECTION 9: Compliance & Privacy (Compact) */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold" />
              Trust, Privacy & Use of Information
            </h3>
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <CardContent className="p-6">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>Information is provided for guidance and is subject to change.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>Market intelligence and tools are informational and do not guarantee outcomes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>Your data is treated as confidential and is accessible only to you and authorized JBJ administrators.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>If partner services are introduced (legal, mortgage, visa), the client contracts directly with the independent licensed partner.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer CTA Strip */}
          <motion.div variants={fadeInUp}>
            <div className="border-2 border-gold/40 bg-gradient-to-r from-[#1a1a1a] via-[#222] to-[#1a1a1a] p-6 md:p-8 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 justify-center md:justify-start uppercase tracking-wider">
                      <HelpCircle className="w-5 h-5 text-gold" />
                      Need Assistance?
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Our investment advisors are here to help with your portfolio, reports, and strategy.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/contact?type=consultation">
                      <Button variant="primary">
                        Request a Private Consultation
                      </Button>
                    </Link>
                    <a href={getWhatsAppUrl(whatsappMessage)} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Ask JBJ on WhatsApp
                      </Button>
                    </a>
                  </div>
                </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
