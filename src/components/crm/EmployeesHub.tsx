import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Bot,
  UserCheck,
  Briefcase,
  MessageSquare,
  Phone,
  Mail,
  Video,
  Brain,
  Palette,
  DollarSign,
  Camera,
  Shield,
  Crown,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'admin' | 'hr' | 'finance' | 'media' | 'brokers' | 'ai';
  type: 'human' | 'ai';
  avatar?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'away' | 'busy';
  leads?: number;
  performance?: number;
  description?: string;
}

const TEAM_MEMBERS: Employee[] = [
  // Human Staff
  {
    id: 'jane',
    name: 'Jane Abou Jaoude',
    role: 'CEO & Founder',
    department: 'admin',
    type: 'human',
    email: 'jane@jbj.ae',
    phone: '+971 56 591 1000',
    status: 'active',
    description: 'Visionary leader driving JBJ Global Real Estate success',
  },
  {
    id: 'jessica',
    name: 'Jessica',
    role: 'HR Manager',
    department: 'hr',
    type: 'human',
    email: 'hr@jbj.ae',
    status: 'active',
    description: 'Manages recruitment, onboarding, and team development',
  },
  {
    id: 'david',
    name: 'David Carter',
    role: 'Head of Recruitment / COO',
    department: 'hr',
    type: 'human',
    email: 'recruitment@jbj.ae',
    status: 'active',
    description: 'Oversees operations and second-round interviews',
  },
  // AI Assistants
  {
    id: 'ai-assistant',
    name: 'JBJ AI Assistant',
    role: 'Central AI Coordinator',
    department: 'ai',
    type: 'ai',
    status: 'active',
    description: 'Coordinates between departments, handles inquiries, and automates workflows',
  },
  {
    id: 'ai-designer',
    name: 'JBJ Design Studio',
    role: 'AI Graphic Designer',
    department: 'media',
    type: 'ai',
    status: 'active',
    description: 'Creates social media content, presentations, and marketing materials',
  },
  {
    id: 'ai-finance',
    name: 'JBJ Finance Advisor',
    role: 'AI Financial Analyst',
    department: 'finance',
    type: 'ai',
    status: 'active',
    description: 'Provides market analysis, mortgage calculations, and property valuations',
  },
  {
    id: 'ai-receptionist',
    name: 'JBJ Virtual Receptionist',
    role: 'AI Receptionist',
    department: 'admin',
    type: 'ai',
    status: 'active',
    description: 'Handles calls, schedules meetings, and manages inquiries 24/7',
  },
];

interface EmployeesHubProps {
  userId: string;
  brokers?: Employee[];
}

const EmployeesHub = ({ userId, brokers = [] }: EmployeesHubProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Sample brokers data if none provided
  const sampleBrokers: Employee[] = brokers.length > 0 ? brokers : [
    {
      id: 'broker-1',
      name: 'Ahmed Hassan',
      role: 'Senior Broker',
      department: 'brokers',
      type: 'human',
      email: 'ahmed@jbj.ae',
      phone: '+971 50 123 4567',
      status: 'active',
      leads: 24,
      performance: 92,
    },
    {
      id: 'broker-2',
      name: 'Sarah Johnson',
      role: 'Property Consultant',
      department: 'brokers',
      type: 'human',
      email: 'sarah@jbj.ae',
      phone: '+971 55 987 6543',
      status: 'active',
      leads: 18,
      performance: 85,
    },
  ];

  const allEmployees = [...TEAM_MEMBERS, ...sampleBrokers];

  const getFilteredEmployees = () => {
    if (activeTab === 'all') return allEmployees;
    if (activeTab === 'ai') return allEmployees.filter(e => e.type === 'ai');
    if (activeTab === 'human') return allEmployees.filter(e => e.type === 'human');
    if (activeTab === 'brokers') return allEmployees.filter(e => e.department === 'brokers');
    return allEmployees.filter(e => e.department === activeTab);
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'hr': return <UserCheck className="h-4 w-4" />;
      case 'finance': return <DollarSign className="h-4 w-4" />;
      case 'media': return <Camera className="h-4 w-4" />;
      case 'brokers': return <Briefcase className="h-4 w-4" />;
      case 'ai': return <Bot className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleChat = (employee: Employee) => {
    toast.success(`Starting chat with ${employee.name}...`);
    // In production, this would open a chat interface
  };

  const handleCall = (employee: Employee) => {
    if (employee.phone) {
      window.location.href = `tel:${employee.phone}`;
    } else {
      toast.info(`${employee.name} doesn't have a phone number listed`);
    }
  };

  const handleEmail = (employee: Employee) => {
    if (employee.email) {
      window.location.href = `mailto:${employee.email}`;
    } else {
      toast.info(`${employee.name} doesn't have an email listed`);
    }
  };

  const stats = {
    total: allEmployees.length,
    human: allEmployees.filter(e => e.type === 'human').length,
    ai: allEmployees.filter(e => e.type === 'ai').length,
    brokers: allEmployees.filter(e => e.department === 'brokers').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="h-7 w-7 text-gold" />
            JBJ Employees Hub
          </h2>
          <p className="text-muted-foreground mt-1">AI-powered team management & coordination</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Team</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <UserCheck className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.human}</p>
            <p className="text-xs text-muted-foreground">Human Staff</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Bot className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.ai}</p>
            <p className="text-xs text-muted-foreground">AI Assistants</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Briefcase className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.brokers}</p>
            <p className="text-xs text-muted-foreground">Brokers</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900/50 border border-zinc-800 grid w-full grid-cols-5">
          <TabsTrigger value="all" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            All
          </TabsTrigger>
          <TabsTrigger value="human" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            Human
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            AI
          </TabsTrigger>
          <TabsTrigger value="brokers" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            Brokers
          </TabsTrigger>
          <TabsTrigger value="hr" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            HR
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-3">
            {getFilteredEmployees().map((employee) => (
              <Card 
                key={employee.id} 
                className={`bg-card border-border hover:border-gold/30 transition-colors cursor-pointer ${
                  employee.type === 'ai' ? 'border-purple-500/20 bg-purple-500/5' : ''
                }`}
                onClick={() => setSelectedEmployee(employee)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-gold/30">
                          <AvatarFallback className={`${employee.type === 'ai' ? 'bg-purple-600' : 'bg-gold/20'} text-white font-bold`}>
                            {employee.type === 'ai' ? <Bot className="h-6 w-6" /> : employee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${getStatusColor(employee.status)} border-2 border-background`} />
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{employee.name}</p>
                          {employee.type === 'ai' && (
                            <Badge className="bg-purple-600/20 text-purple-400 text-xs border-purple-500/30">
                              <Bot className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                          {employee.role === 'CEO & Founder' && (
                            <Crown className="h-4 w-4 text-gold" />
                          )}
                        </div>
                        <p className="text-sm text-gold">{employee.role}</p>
                        {employee.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-md">{employee.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions & Stats */}
                    <div className="flex items-center gap-3">
                      {/* Broker Stats */}
                      {employee.department === 'brokers' && (
                        <div className="hidden md:flex items-center gap-4 text-sm">
                          {employee.leads !== undefined && (
                            <div className="text-center">
                              <p className="text-white font-bold">{employee.leads}</p>
                              <p className="text-xs text-muted-foreground">Leads</p>
                            </div>
                          )}
                          {employee.performance !== undefined && (
                            <div className="text-center">
                              <p className="text-green-400 font-bold">{employee.performance}%</p>
                              <p className="text-xs text-muted-foreground">Performance</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-muted"
                          onClick={(e) => { e.stopPropagation(); handleChat(employee); }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        {employee.email && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-muted"
                            onClick={(e) => { e.stopPropagation(); handleEmail(employee); }}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {employee.phone && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-muted"
                            onClick={(e) => { e.stopPropagation(); handleCall(employee); }}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {getFilteredEmployees().length === 0 && (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No employees found in this category</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeesHub;
