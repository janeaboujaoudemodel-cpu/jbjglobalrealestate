import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Home, 
  Plus, 
  Clock, 
  MessageSquare,
  FileUp,
  Settings,
  Bell,
  ChevronRight,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'Marina View Tower - 2BR',
    location: 'Dubai Marina',
    status: 'active',
    type: 'Sale',
    price: 'AED 2,500,000',
    views: 145,
    inquiries: 12
  },
  {
    id: '2',
    title: 'Downtown Residence - 1BR',
    location: 'Downtown Dubai',
    status: 'pending',
    type: 'Rent',
    price: 'AED 120,000/yr',
    views: 0,
    inquiries: 0
  }
];

const MOCK_MESSAGES = [
  {
    id: '1',
    from: 'JBJ Team',
    subject: 'Your listing has been approved',
    preview: 'Congratulations! Your property at Marina View Tower...',
    time: '2 hours ago',
    unread: true
  },
  {
    id: '2',
    from: 'Sarah - Agent',
    subject: 'Viewing scheduled for your property',
    preview: 'A viewing has been scheduled for tomorrow at 3 PM...',
    time: '1 day ago',
    unread: false
  }
];

const MOCK_DOCUMENTS = [
  { name: 'Title Deed - Marina View', type: 'PDF', uploadedAt: 'Jan 15, 2025' },
  { name: 'NOC Certificate', type: 'PDF', uploadedAt: 'Jan 10, 2025' }
];

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profileName, setProfileName] = useState("Property Owner");

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">Pending Review</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Sold</Badge>;
      default:
        return <Badge className="bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30/30">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
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
              <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
              <p className="text-white/70">Manage your properties, track listings, and communicate with JBJ</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-[#F7F2EA] text-[#1A1A1A]">
                      {profileName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium">{profileName}</p>
                    <p className="text-xs text-white/70">Property Owner</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#FDFBF7] border-[#1A1A1A]">
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
                <DropdownMenuSeparator className="bg-[#F7F2EA]" />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-400 cursor-pointer">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Home className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{MOCK_LISTINGS.length}</p>
                    <p className="text-xs text-white/70">My Listings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{MOCK_LISTINGS.filter(l => l.status === 'active').length}</p>
                    <p className="text-xs text-white/70">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{MOCK_LISTINGS.filter(l => l.status === 'pending').length}</p>
                    <p className="text-xs text-white/70">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{MOCK_MESSAGES.filter(m => m.unread).length}</p>
                    <p className="text-xs text-white/70">New Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* My Listings */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">My Listings</CardTitle>
                      <CardDescription>Properties you've listed with JBJ</CardDescription>
                    </div>
                    <Link to="/seller-listing">
                      <Button className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                        <Plus className="w-4 h-4 mr-2" /> List New Property
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {MOCK_LISTINGS.map((listing) => (
                        <div 
                          key={listing.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-[#F7F2EA]/50 hover:bg-[#1A1A1A] transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#EFE6D6] flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-white/70" />
                            </div>
                            <div>
                              <h4 className="font-medium">{listing.title}</h4>
                              <p className="text-sm text-white/70">{listing.location} • {listing.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                              <p className="font-semibold text-[#1A1A1A]">{listing.price}</p>
                              <p className="text-xs text-white/70">{listing.views} views • {listing.inquiries} inquiries</p>
                            </div>
                            {getStatusBadge(listing.status)}
                            <ChevronRight className="w-5 h-5 text-white/90" />
                          </div>
                        </div>
                      ))}
                      
                      {MOCK_LISTINGS.length === 0 && (
                        <div className="text-center py-8">
                          <Home className="w-12 h-12 text-[#1A1A1A]/70 mx-auto mb-4" />
                          <p className="text-white/70">No listings yet</p>
                          <Link to="/seller-listing">
                            <Button className="mt-4 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                              List Your First Property
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Listing Status Timeline */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
                  <CardHeader>
                    <CardTitle className="text-xl">Listing Status Timeline</CardTitle>
                    <CardDescription>Track the progress of your listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="w-0.5 h-12 bg-[#EFE6D6]" />
                        </div>
                        <div>
                          <p className="font-medium">Listing Submitted</p>
                          <p className="text-sm text-white/70">Marina View Tower - 2BR</p>
                          <p className="text-xs text-white/90">Jan 14, 2025 at 10:30 AM</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="w-0.5 h-12 bg-[#EFE6D6]" />
                        </div>
                        <div>
                          <p className="font-medium">Documents Verified</p>
                          <p className="text-sm text-white/70">Title deed and NOC confirmed</p>
                          <p className="text-xs text-white/90">Jan 15, 2025 at 2:15 PM</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">Listing Published</p>
                          <p className="text-sm text-white/70">Now live on JBJ platform</p>
                          <p className="text-xs text-white/90">Jan 15, 2025 at 4:00 PM</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Messages */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#1A1A1A]" />
                      Messages from JBJ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {MOCK_MESSAGES.map((message) => (
                        <div 
                          key={message.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            message.unread ? 'bg-[#EFE6D6]/10 border border-[#B89555]/20' : 'bg-[#F7F2EA]/50 hover:bg-[#1A1A1A]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{message.from}</p>
                            <span className="text-xs text-white/90">{message.time}</span>
                          </div>
                          <p className="text-sm text-white/85">{message.subject}</p>
                          <p className="text-xs text-white/90 mt-1 truncate">{message.preview}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Documents */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#1A1A1A]" />
                      Documents
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-[#1A1A1A]">
                      <FileUp className="w-4 h-4 mr-1" /> Upload
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {MOCK_DOCUMENTS.map((doc, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                        >
                          <FileText className="w-8 h-8 text-red-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-white/90">{doc.uploadedAt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Support */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-gradient-to-br from-gold/10 to-amber-500/5 border-[#B89555]/30">
                  <CardContent className="p-6 text-center">
                    <HelpCircle className="w-10 h-10 text-[#1A1A1A] mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Need Help?</h3>
                    <p className="text-sm text-white/70 mb-4">
                      Our team is here to assist with your listings
                    </p>
                    <Link to="/contact">
                      <Button className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                        Contact Support
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
