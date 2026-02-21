import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Home,
  FileText,
  Briefcase,
  Calendar,
  Settings,
  Shield,
  MessageCircle,
  HelpCircle,
  Lightbulb,
  Building2,
  Key,
  ChevronRight,
  CheckCircle2,
  Clock,
  Edit3,
  Mail,
  Phone,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserProfile {
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  status: string;
  created_at: string;
  subject: string;
}

interface IdeaSubmission {
  id: string;
  status: string;
  created_at: string;
  draw_ticket_number: string | null;
}

interface PropertyAction {
  type: 'buy' | 'sell' | 'rent';
  count: number;
  lastUpdated: string | null;
}

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ideas, setIdeas] = useState<IdeaSubmission[]>([]);
  const [careerSubmitted, setCareerSubmitted] = useState(false);
  const [propertySell, setPropertySell] = useState(0);
  const [propertyBuy, setPropertyBuy] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Fetch user profile from profiles table if exists
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name,
          phone: profileData.phone_number,
          date_of_birth: null,
          photo_url: null
        });
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone_number || '',
          date_of_birth: ''
        });
      }

      // Fetch support tickets
      const { data: ticketData } = await supabase
        .from('chat_conversations')
        .select('id, status, created_at, service_type')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ticketData) {
        setTickets(ticketData.map((t, i) => ({
          id: t.id,
          ticket_number: `TKT-${String(i + 1).padStart(4, '0')}`,
          status: t.status,
          created_at: t.created_at,
          subject: t.service_type || 'General Inquiry'
        })));
      }

      // Fetch idea submissions
      const { data: ideaData } = await supabase
        .from('best_idea_submissions')
        .select('id, status, created_at, draw_ticket_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ideaData) {
        setIdeas(ideaData);
      }

      // Check for career applications
      const { data: careerData, count } = await supabase
        .from('broker_onboarding_progress')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);
      
      setCareerSubmitted((count || 0) > 0);

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          phone_number: formData.phone,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setProfile(prev => ({
        ...prev,
        full_name: formData.full_name,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        photo_url: prev?.photo_url || null
      }));
      setEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'completed':
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'pending':
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-gold/30">
              <AvatarImage src={profile?.photo_url || ""} />
              <AvatarFallback className="text-2xl bg-gold/20 text-gold">
                {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-black mb-1">
                {profile?.full_name || 'Welcome, Investor'}
              </h1>
              <p className="text-zinc-500 text-sm flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
              {profile?.phone && (
                <p className="text-zinc-500 text-sm flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                <Badge className="bg-gold/10 text-gold border-gold/30">
                  <User className="h-3 w-3 mr-1" />
                  Investor Account
                </Badge>
                <Badge variant="outline" className="border-gold/30 text-black">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Member
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/ai-hub')} variant="primary">
                <Home className="h-4 w-4 mr-2" />
                Explore Tools
              </Button>
              <Button onClick={() => navigate('/properties')} variant="secondary">
                <Building2 className="h-4 w-4 mr-2" />
                View Properties
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-500/30 hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Home className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{propertyBuy}</p>
                <p className="text-xs text-zinc-500">Properties Bought</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/30 hover:shadow-[0_4px_20px_rgba(34,197,94,0.15)] transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <Building2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{propertySell}</p>
                <p className="text-xs text-zinc-500">Properties Listed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/30 hover:shadow-[0_4px_20px_rgba(168,85,247,0.15)] transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Briefcase className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{careerSubmitted ? '1' : '0'}</p>
                <p className="text-xs text-zinc-500">CV Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gold/30 hover:shadow-[0_4px_20px_rgba(200,167,102,0.15)] transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gold/10">
                <MessageCircle className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{tickets.length}</p>
                <p className="text-xs text-zinc-500">Support Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border-2 border-gold/30 p-1 shadow-[0_2px_10px_rgba(200,167,102,0.08)]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black">
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="ideas" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black">
            My Ideas
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="border-2 border-gold/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <ChevronRight className="h-5 w-5 text-gold" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="secondary" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/listing-portal')}
                >
                  <Building2 className="h-4 w-4 mr-3 text-gold" />
                  List Your Property for Sale
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/join')}
                >
                  <Briefcase className="h-4 w-4 mr-3 text-gold" />
                  Apply for Career
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/contact')}
                >
                  <HelpCircle className="h-4 w-4 mr-3 text-gold" />
                  Create Support Ticket
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/faq')}
                >
                  <Lightbulb className="h-4 w-4 mr-3 text-gold" />
                  Submit an Idea
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-2 border-gold/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Clock className="h-5 w-5 text-gold" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 && ideas.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No recent activity</p>
                    <p className="text-sm mt-1">Start exploring our tools and services</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.slice(0, 3).map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-4 w-4 text-gold" />
                          <div>
                            <p className="text-sm font-medium text-black">{ticket.subject}</p>
                            <p className="text-xs text-zinc-500">{format(new Date(ticket.created_at), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                      </div>
                    ))}
                    {ideas.slice(0, 2).map((idea) => (
                      <div key={idea.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-4 w-4 text-gold" />
                          <div>
                            <p className="text-sm font-medium text-black">Idea Submission</p>
                            <p className="text-xs text-zinc-500">{format(new Date(idea.created_at), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(idea.status)}>{idea.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets">
          <Card className="border-2 border-gold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <MessageCircle className="h-5 w-5 text-gold" />
                My Support Tickets
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Track all your support requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-black mb-2">No Support Tickets</p>
                  <p className="text-sm mb-4">You haven't created any support tickets yet</p>
                  <Button onClick={() => navigate('/contact')} variant="primary">
                    Create New Ticket
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-zinc-200 hover:border-gold/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gold/10">
                          <MessageCircle className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{ticket.subject}</p>
                          <p className="text-sm text-zinc-500">
                            {ticket.ticket_number} • {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ideas Tab */}
        <TabsContent value="ideas">
          <Card className="border-2 border-gold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <Lightbulb className="h-5 w-5 text-gold" />
                My Ideas & Suggestions
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Track your submitted ideas and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ideas.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-black mb-2">No Ideas Submitted</p>
                  <p className="text-sm mb-4">Share your ideas to help us improve</p>
                  <Button onClick={() => navigate('/faq')} variant="primary">
                    Submit an Idea
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {ideas.map((idea) => (
                    <div key={idea.id} className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-zinc-200 hover:border-gold/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gold/10">
                          <Lightbulb className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-black">Idea Submission</p>
                          <p className="text-sm text-zinc-500">
                            {idea.draw_ticket_number || 'Processing'} • {format(new Date(idea.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(idea.status)}>{idea.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Settings */}
            <Card className="border-2 border-gold/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-black">
                    <User className="h-5 w-5 text-gold" />
                    Profile Information
                  </CardTitle>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setEditingProfile(!editingProfile)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {editingProfile ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingProfile ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-black">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="border-gold/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-black">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="border-gold/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-black">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        className="border-gold/30"
                      />
                    </div>
                    <Button onClick={handleSaveProfile} variant="primary" className="w-full">
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-2 border-b border-zinc-200">
                      <span className="text-zinc-500">Full Name</span>
                      <span className="font-medium text-black">{profile?.full_name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-zinc-200">
                      <span className="text-zinc-500">Email</span>
                      <span className="font-medium text-black">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-zinc-200">
                      <span className="text-zinc-500">Phone</span>
                      <span className="font-medium text-black">{profile?.phone || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-zinc-500">Date of Birth</span>
                      <span className="font-medium text-black">{profile?.date_of_birth || 'Not set'}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-2 border-gold/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Lock className="h-5 w-5 text-gold" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="secondary" 
                  className="w-full justify-start"
                  onClick={() => navigate('/auth?mode=reset')}
                >
                  <Key className="h-4 w-4 mr-3 text-gold" />
                  Change Password
                </Button>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Email Verified</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">Your email has been verified</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestorDashboard;
