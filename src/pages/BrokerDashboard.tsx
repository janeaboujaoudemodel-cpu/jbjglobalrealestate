import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import GlobalHeader from "@/components/GlobalHeader";
import { CommandPalette } from "@/components/ui/command-palette";
import { FloatingActionBar } from "@/components/ui/floating-action-bar";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  TrendingUp,
  CheckSquare,
  Wrench,
  Bell,
  Search,
  Plus,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Settings,
  Home,
  Filter,
  MoreHorizontal,
  Briefcase,
  Target,
  DollarSign,
  UserCheck,
  FileCheck,
  AlertTriangle,
} from "lucide-react";

// Animation variants
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

interface DashboardStats {
  activeListings: number;
  activeClients: number;
  ongoingTransactions: number;
  pendingTasks: number;
  monthlyDeals: number;
  conversionRate: number;
}

interface Listing {
  id: string;
  title: string;
  status: 'draft' | 'under_review' | 'approved' | 'live';
  type: 'sale' | 'rent' | 'off_plan';
  views: number;
  inquiries: number;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  type: 'buyer' | 'seller' | 'landlord' | 'tenant';
  status: string;
  last_contact: string;
  requirements: string;
}

interface Transaction {
  id: string;
  property: string;
  client: string;
  stage: 'initial' | 'negotiation' | 'documentation' | 'transfer';
  amount: number;
  pending_docs: number;
  due_date: string;
}

interface Task {
  id: string;
  title: string;
  type: 'follow_up' | 'viewing' | 'document' | 'meeting';
  priority: 'high' | 'medium' | 'low';
  due_date: string;
  client_name?: string;
  completed: boolean;
}

export default function BrokerDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - in production, this would come from Supabase
  const [stats] = useState<DashboardStats>({
    activeListings: 12,
    activeClients: 28,
    ongoingTransactions: 5,
    pendingTasks: 8,
    monthlyDeals: 3,
    conversionRate: 24,
  });

  const [listings] = useState<Listing[]>([
    { id: '1', title: 'Marina Views Tower - 2BR', status: 'live', type: 'sale', views: 234, inquiries: 12, created_at: '2024-01-15' },
    { id: '2', title: 'Downtown Penthouse Suite', status: 'under_review', type: 'sale', views: 0, inquiries: 0, created_at: '2024-01-20' },
    { id: '3', title: 'JBR Studio - Monthly Rental', status: 'live', type: 'rent', views: 156, inquiries: 8, created_at: '2024-01-18' },
    { id: '4', title: 'Creek Harbour Villa', status: 'draft', type: 'off_plan', views: 0, inquiries: 0, created_at: '2024-01-22' },
  ]);

  const [clients] = useState<Client[]>([
    { id: '1', name: 'Ahmed Al Maktoum', type: 'buyer', status: 'Active', last_contact: '2 hours ago', requirements: 'Looking for 3BR in Marina' },
    { id: '2', name: 'Sarah Johnson', type: 'seller', status: 'Pending', last_contact: '1 day ago', requirements: 'Selling villa in Palm' },
    { id: '3', name: 'Michael Chen', type: 'tenant', status: 'Active', last_contact: '3 hours ago', requirements: '1BR rental in Downtown' },
  ]);

  const [transactions] = useState<Transaction[]>([
    { id: '1', property: 'Marina Views Tower - 2BR', client: 'Ahmed Al Maktoum', stage: 'documentation', amount: 2500000, pending_docs: 2, due_date: '2024-02-01' },
    { id: '2', property: 'JBR Studio', client: 'Michael Chen', stage: 'negotiation', amount: 85000, pending_docs: 0, due_date: '2024-02-15' },
  ]);

  const [tasks] = useState<Task[]>([
    { id: '1', title: 'Follow up with Ahmed on documentation', type: 'follow_up', priority: 'high', due_date: '2024-01-25', client_name: 'Ahmed Al Maktoum', completed: false },
    { id: '2', title: 'Property viewing - Marina Tower', type: 'viewing', priority: 'medium', due_date: '2024-01-26', client_name: 'Sarah Johnson', completed: false },
    { id: '3', title: 'Submit NOC application', type: 'document', priority: 'high', due_date: '2024-01-24', completed: false },
  ]);

  const [alerts] = useState([
    { type: 'warning', message: '2 documents pending for Marina Views transaction' },
    { type: 'info', message: 'Listing "Creek Harbour Villa" expires in 3 days' },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/broker-dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'under_review':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'draft':
        return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
    }
  };

  const getStageProgress = (stage: string) => {
    switch (stage) {
      case 'initial': return 25;
      case 'negotiation': return 50;
      case 'documentation': return 75;
      case 'transfer': return 100;
      default: return 0;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      default: return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      
      {/* Hero Section with Video */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        
        <motion.div 
          className="container mx-auto px-4 relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-4xl">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
              }}
              variants={fadeInUp}
            >
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">Broker Dashboard</span>
            </motion.div>
            
            <motion.h1 
              className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4"
              variants={fadeInUp}
            >
              Your Professional <span className="text-gold">Control Center</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg text-zinc-300 mb-8 max-w-2xl"
              variants={fadeInUp}
            >
              Manage listings, track clients, monitor transactions, and access your tools — all in one place.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setActiveTab("listings")}
                className="bg-gold hover:bg-gold/90 text-black font-semibold"
              >
                <Building2 className="w-4 h-4 mr-2" />
                View Listings
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowCommandPalette(true)}
                className="border-gold/50 text-white hover:bg-gold/10"
              >
                <Search className="w-4 h-4 mr-2" />
                Quick Search
                <kbd className="ml-2 px-2 py-0.5 bg-white/10 text-xs rounded">⌘K</kbd>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex flex-wrap gap-4">
                {alerts.map((alert, index) => (
                  <span key={index} className="text-amber-700 text-sm">{alert.message}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 border-gold/30 p-1 shadow-sm flex-wrap h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="listings" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <Building2 className="w-4 h-4 mr-2" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <Users className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <FileText className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Active Listings', value: stats.activeListings, icon: Building2, color: 'blue' },
                  { label: 'Active Clients', value: stats.activeClients, icon: Users, color: 'green' },
                  { label: 'Transactions', value: stats.ongoingTransactions, icon: FileCheck, color: 'purple' },
                  { label: 'Pending Tasks', value: stats.pendingTasks, icon: CheckSquare, color: 'amber' },
                  { label: 'Monthly Deals', value: stats.monthlyDeals, icon: Target, color: 'emerald' },
                  { label: 'Conversion', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'gold' },
                ].map((stat, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="bg-white border-2 border-gold/20 hover:border-gold/40 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-${stat.color === 'gold' ? 'gold' : stat.color + '-500'}/10 flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color === 'gold' ? 'text-gold' : `text-${stat.color}-500`}`} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { label: 'Add New Listing', icon: Plus, action: () => {}, color: 'bg-blue-500' },
                  { label: 'Add Client', icon: UserCheck, action: () => {}, color: 'bg-green-500' },
                  { label: 'Create Task', icon: CheckSquare, action: () => {}, color: 'bg-purple-500' },
                  { label: 'Broker Tools', icon: Wrench, action: () => navigate('/broker-toolkit'), color: 'bg-gold' },
                ].map((action, index) => (
                  <motion.button
                    key={index}
                    variants={fadeInUp}
                    onClick={action.action}
                    className="flex items-center gap-3 p-4 bg-white border-2 border-gold/20 rounded-xl hover:border-gold/40 hover:shadow-lg transition-all text-left"
                  >
                    <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-foreground">{action.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Listings */}
                <Card className="bg-white border-2 border-gold/20">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Recent Listings</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("listings")}>
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {listings.slice(0, 3).map((listing) => (
                      <div key={listing.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{listing.title}</p>
                          <p className="text-sm text-muted-foreground">{listing.views} views • {listing.inquiries} inquiries</p>
                        </div>
                        <Badge className={getStatusColor(listing.status)}>{listing.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card className="bg-white border-2 border-gold/20">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("tasks")}>
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckSquare className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{task.title}</p>
                            <p className="text-sm text-muted-foreground">Due: {task.due_date}</p>
                          </div>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search listings..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-gold/30">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button className="bg-gold hover:bg-gold/90 text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Listing
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {listings.map((listing) => (
                  <motion.div key={listing.id} variants={fadeInUp}>
                    <Card className="bg-white border-2 border-gold/20 hover:border-gold/40 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                              <Building2 className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{listing.title}</h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" /> {listing.views} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" /> {listing.inquiries} inquiries
                                </span>
                                <Badge variant="outline" className="capitalize">{listing.type.replace('_', ' ')}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(listing.status)}>{listing.status.replace('_', ' ')}</Badge>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search clients..." className="pl-10" />
                </div>
                <Button className="bg-gold hover:bg-gold/90 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </div>

              <div className="grid gap-4">
                {clients.map((client) => (
                  <motion.div key={client.id} variants={fadeInUp}>
                    <Card className="bg-white border-2 border-gold/20 hover:border-gold/40 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                              <span className="text-gold font-semibold">{client.name.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{client.name}</h3>
                              <p className="text-sm text-muted-foreground">{client.requirements}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <Badge variant="outline" className="capitalize">{client.type}</Badge>
                                <span>Last contact: {client.last_contact}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
              <div className="grid gap-4">
                {transactions.map((transaction) => (
                  <motion.div key={transaction.id} variants={fadeInUp}>
                    <Card className="bg-white border-2 border-gold/20">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">{transaction.property}</h3>
                            <p className="text-muted-foreground">Client: {transaction.client}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <DollarSign className="w-4 h-4 text-gold" />
                              <span className="font-semibold text-gold">AED {transaction.amount.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex-1 max-w-sm">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Stage: {transaction.stage}</span>
                              <span className="text-muted-foreground">{getStageProgress(transaction.stage)}%</span>
                            </div>
                            <Progress value={getStageProgress(transaction.stage)} className="h-2" />
                            <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                              <span>Initial</span>
                              <span>Negotiation</span>
                              <span>Docs</span>
                              <span>Transfer</span>
                            </div>
                          </div>
                          <div className="text-right">
                            {transaction.pending_docs > 0 && (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 mb-2">
                                {transaction.pending_docs} pending docs
                              </Badge>
                            )}
                            <p className="text-sm text-muted-foreground">Due: {transaction.due_date}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tasks & Reminders</h2>
                <Button className="bg-gold hover:bg-gold/90 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              <div className="grid gap-4">
                {tasks.map((task) => (
                  <motion.div key={task.id} variants={fadeInUp}>
                    <Card className={`bg-white border-2 ${task.completed ? 'border-green-500/30 bg-green-50/50' : 'border-gold/20'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500' : 'border-gold/50'}`}>
                              {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </button>
                            <div>
                              <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {task.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" /> {task.due_date}
                                </span>
                                {task.client_name && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" /> {task.client_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { label: 'Active Deals', value: stats.ongoingTransactions, change: '+2 this month', positive: true },
                  { label: 'Closed Transactions', value: stats.monthlyDeals, change: '+1 this week', positive: true },
                  { label: 'Conversion Rate', value: `${stats.conversionRate}%`, change: '+3% vs last month', positive: true },
                  { label: 'Response Time', value: '2.4h', change: '-30min vs avg', positive: true },
                ].map((metric, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="bg-white border-2 border-gold/20">
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                        <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                        <p className={`text-sm mt-2 ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.change}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card className="bg-white border-2 border-gold/20">
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    {[
                      { label: 'Calls Made', value: 45, icon: Phone },
                      { label: 'Emails Sent', value: 128, icon: Mail },
                      { label: 'Viewings Completed', value: 12, icon: Eye },
                      { label: 'Clients Contacted', value: 32, icon: Users },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                          <activity.icon className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{activity.value}</p>
                          <p className="text-sm text-muted-foreground">{activity.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <FloatingActionBar />
      <Footer />
    </div>
  );
}
