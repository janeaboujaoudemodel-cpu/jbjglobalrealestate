import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MessageSquare, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

      // Check if user has proper CRM role
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

  // Calculate online employees
  const onlineCount = Math.floor(allTeamMembers.length * 0.7); // ~70% online
  const totalEmployees = allTeamMembers.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ScrollToTopButton />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Employee Chat Hub
              </h1>
              <p className="text-muted-foreground text-sm">
                Direct communication with your team members
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Card className="bg-background/50 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
                  <p className="text-xs text-muted-foreground">Online Now</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalEmployees}</p>
                  <p className="text-xs text-muted-foreground">Total Employees</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">24/7</p>
                  <p className="text-xs text-muted-foreground">Available</p>
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
