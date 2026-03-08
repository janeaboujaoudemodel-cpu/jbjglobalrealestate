import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MessageSquare, Users, Activity, Shield, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmployeeChatHub from '@/components/employee-chat/EmployeeChatHub';
import { allTeamMembers } from '@/config/team-members';
import { ScrollToTopButton } from '@/components/ScrollToTop';

const EmployeeChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/crm');
        return;
      }

      const { data: profile } = await supabase
        .from('crm_users_profile')
        .select('crm_role')
        .eq('user_id', user.id)
        .single();

      const authorizedRoles = ['Owner', 'Founder', 'Admin', 'Director', 'Manager', 'Department Head'];
      if (profile && authorizedRoles.includes(profile.crm_role || '')) {
        setIsAuthorized(true);
      } else {
        navigate('/crm');
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const onlineCount = Math.floor(allTeamMembers.length * 0.7);
  const totalEmployees = allTeamMembers.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          <p className="text-black/60 text-sm font-medium">Loading Team Chat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <ScrollToTopButton />
      
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-[#C9A84C]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0 hover:bg-[#C9A84C]/10 border border-[#C9A84C]/20"
            >
              <ArrowLeft className="h-5 w-5 text-black" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-[#C9A84C]" />
                Team Chat Hub
              </h1>
              <p className="text-black/60 text-sm">
                Direct communication with your team members
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Card className="bg-white border border-[#C9A84C]/20 shadow-sm">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Wifi className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-black">{onlineCount}</p>
                  <p className="text-xs text-black/60">Online Now</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-[#C9A84C]/20 shadow-sm">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20">
                  <Users className="h-4 w-4 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-black">{totalEmployees}</p>
                  <p className="text-xs text-black/60">Total Team</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-[#C9A84C]/20 shadow-sm">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-black">24/7</p>
                  <p className="text-xs text-black/60">Available</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-[#C9A84C]/20 shadow-sm">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-black">Secure</p>
                  <p className="text-xs text-black/60">Encrypted</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <EmployeeChatHub />
      </div>
    </div>
  );
};

export default EmployeeChatPage;
