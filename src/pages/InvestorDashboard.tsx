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
import Footer from "@/components/Footer";
import GlobalHeader from "@/components/GlobalHeader";
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

interface InsightCard {
  area: string;
  indicator: string;
  summary: string;
  timestamp: string;
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
  const [insights] = useState<InsightCard[]>([
    { area: "Dubai Marina", indicator: "Growth", summary: "Sustained demand in waterfront units.", timestamp: "Jan 2026" },
    { area: "Business Bay", indicator: "Stability", summary: "Steady pricing with high occupancy.", timestamp: "Jan 2026" },
    { area: "Palm Jumeirah", indicator: "Premium", summary: "Continued interest in luxury segment.", timestamp: "Jan 2026" },
  ]);

  // KPI stats
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeInvestments: 0,
    underReview: 0,
    reportsAvailable: 0,
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

      // Fetch linked properties (from favorites as portfolio)
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('id, project_id, created_at')
        .eq('user_id', user.id)
        .limit(10);

      if (favoritesData && favoritesData.length > 0) {
        // Get project details for favorites
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
            image_url: null, // Projects table doesn't have main_image_url
          }));
          setLinkedProperties(properties);
          setStats(prev => ({ 
            ...prev, 
            totalProperties: properties.length,
            underReview: properties.filter(p => p.status === 'under_evaluation').length,
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
      }

      // Set mock report count (will be replaced with real data when reports table exists)
      setStats(prev => ({ ...prev, reportsAvailable: 0 }));

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <GlobalHeader />

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-8"
        >
          {/* SECTION 1: Dashboard Header */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black border border-gold/20">
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
                      <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1">
                        Investor Dashboard
                      </h1>
                      <p className="text-zinc-400 text-sm mb-3">
                        Overview of your investments, activity, and reports
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gold/20 text-gold border-gold/30">
                          <User className="w-3 h-3 mr-1" />
                          Investor Account
                        </Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
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
              </CardContent>
            </Card>
          </motion.div>

          {/* SECTION 2: Quick Stats Row (KPI Cards) */}
          <motion.div variants={fadeInUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2 border-gold/30">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.totalProperties}</p>
                      <p className="text-xs text-muted-foreground">Total Properties Linked</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.activeInvestments}</p>
                      <p className="text-xs text-muted-foreground">Active Investments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.underReview}</p>
                      <p className="text-xs text-muted-foreground">Under Review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.reportsAvailable}</p>
                      <p className="text-xs text-muted-foreground">Reports Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* SECTION 3: My Portfolio */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gold" />
              My Portfolio
            </h3>
            {linkedProperties.length === 0 ? (
              <Card className="border-2 border-gold/30">
                <CardContent className="p-8 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No properties linked yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse our properties and add them to your portfolio
                  </p>
                  <Link to="/properties">
                    <Button variant="primary">
                      Explore Properties
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {linkedProperties.map((property) => (
                  <Card key={property.id} className="border-2 border-gold/30 overflow-hidden group hover:border-gold transition-colors">
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

          {/* SECTION 4: Investment Insights */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold" />
              Investment Insights
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {insights.map((insight, index) => (
                <Card key={index} className="border-2 border-gold/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{insight.area}</h4>
                      <Badge className={
                        insight.indicator === 'Growth' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : insight.indicator === 'Stability'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                          : 'bg-gold/10 text-gold border-gold/30'
                      }>
                        {insight.indicator}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.summary}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {insight.timestamp}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center italic">
              Insights are informational only. No ROI guarantees or projections.
            </p>
          </motion.div>

          {/* SECTION 5: Reports Access */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              My Reports
            </h3>
            <Card className="border-2 border-gold/30">
              {reports.length === 0 ? (
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No reports available</p>
                  <p className="text-sm text-muted-foreground">
                    Reports are generated internally by JBJ systems and will appear here when available.
                  </p>
                </CardContent>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date Generated</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{report.type}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(report.generated_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="secondary" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </motion.div>

          {/* SECTION 6: Document Center */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gold" />
              Documents
            </h3>
            <Card className="border-2 border-gold/30">
              {documents.length === 0 ? (
                <CardContent className="p-8 text-center">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No documents available</p>
                  <p className="text-sm text-muted-foreground">
                    Secure documents will appear here when uploaded by your advisor.
                  </p>
                </CardContent>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Related Property</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.property_name || '—'}</TableCell>
                        <TableCell>{format(new Date(doc.uploaded_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="secondary" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Documents are visible only to you and authorized JBJ advisors.
            </p>
          </motion.div>

          {/* SECTION 7: Activity & Notifications */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold" />
              Recent Activity
            </h3>
            <Card className="border-2 border-gold/30">
              {activities.length === 0 ? (
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Status updates, admin actions, and notifications will appear here.
                  </p>
                </CardContent>
              ) : (
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                          {activity.type === 'status_update' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {activity.type === 'admin_action' && <User className="w-4 h-4 text-blue-500" />}
                          {activity.type === 'report_available' && <FileText className="w-4 h-4 text-purple-500" />}
                          {activity.type === 'notification' && <Bell className="w-4 h-4 text-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{activity.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(activity.created_at), 'MMM d, yyyy · h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>

          {/* SECTION 8: Profile & Settings Shortcut */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold" />
              Quick Settings
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/my-account">
                <Card className="border-2 border-gold/30 hover:border-gold transition-colors cursor-pointer group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <User className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-gold transition-colors">My Profile</h4>
                      <p className="text-xs text-muted-foreground">Update your information</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/settings/notifications">
                <Card className="border-2 border-gold/30 hover:border-gold transition-colors cursor-pointer group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <Bell className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-gold transition-colors">Notification Preferences</h4>
                      <p className="text-xs text-muted-foreground">Manage alerts</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/settings/security">
                <Card className="border-2 border-gold/30 hover:border-gold transition-colors cursor-pointer group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <Shield className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-gold transition-colors">Security Settings</h4>
                      <p className="text-xs text-muted-foreground">Password & access</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.div>

          {/* SECTION 9: Support & Assistance */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2 justify-center md:justify-start">
                      <HelpCircle className="w-5 h-5 text-gold" />
                      Need Assistance?
                    </h3>
                    <p className="text-zinc-400">
                      Our investment advisors are here to help with your portfolio.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/contact?type=advisor">
                      <Button variant="primary">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact Advisor
                      </Button>
                    </Link>
                    <Link to="/contact?type=support">
                      <Button variant="secondary">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Submit Support Request
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* SECTION 10: Compliance Footer Note */}
          <motion.div variants={fadeInUp}>
            <div className="text-center py-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
                This dashboard provides informational access to properties and market insights.
                JBJ Global Real Estate does not provide financial guarantees or residency approvals through this platform.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
