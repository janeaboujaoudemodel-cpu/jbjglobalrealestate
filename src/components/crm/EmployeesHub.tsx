import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Bot,
  UserCheck,
  Briefcase,
  MessageSquare,
  Phone,
  Mail,
  Video,
  Palette,
  DollarSign,
  Shield,
  Crown,
  Building2,
  ChevronRight,
  Search,
  FileText,
  Upload,
  Star,
  Calendar,
  Sparkles,
  AlertTriangle,
  Code,
  Heart,
  Folder,
  Settings,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useCRMActionLog } from '@/hooks/useCRMActionLog';
import CVCenter from './CVCenter';
import TrainingManagement from './TrainingManagement';

// Import team members from centralized config
import { 
  allTeamMembers, 
  teamByDepartment,
  executiveTeam,
  salesTeam,
  hrTeam,
  marketingTeam,
  creativeTeam,
  financeTeam,
  operationsTeam,
  itTeam,
  adminTeam,
  softwareEngineeringTeam,
  projectManagementTeam,
  contentTeam,
  customerHappinessTeam,
  clientRelationsTeam,
  legalTeam,
  afterSalesTeam,
  vipClientRelationsTeam,
  TeamMember,
  getTeamMemberById
} from '@/config/team-members';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  type: 'human' | 'ai';
  avatar?: string;
  email?: string;
  status: 'active' | 'away' | 'busy' | 'inactive';
  leads?: number;
  performance?: number;
  description?: string;
  responsibilities?: string[];
  languages?: string[];
  nationality?: string;
  reportsTo?: string;
  hierarchyLevel?: number;
}

interface CVEntry {
  id: string;
  candidateName: string;
  email: string;
  phone?: string;
  positionApplied: string;
  uploadDate: string;
  uploadedBy: string;
  gender?: 'male' | 'female' | 'other';
  languages?: string[];
  age?: number;
  category: 'collected' | 'flagged' | 'rejected' | 'pending';
  ranking: number;
  status: 'pending' | 'reviewed' | 'interview_scheduled' | 'rejected' | 'hired';
  experience: string;
  education: string;
}

// Helper to convert TeamMember to Employee format
const teamMemberToEmployee = (member: TeamMember): Employee => ({
  id: member.id,
  name: member.name,
  role: member.role,
  department: member.department,
  type: member.isAI ? 'ai' : 'human',
  avatar: member.avatar,
  email: member.email,
  status: member.status === 'online' ? 'active' : member.status === 'away' ? 'away' : 'inactive',
  description: member.bio,
  responsibilities: member.specializations,
  languages: member.languages,
  nationality: member.nationality,
  reportsTo: member.reportsTo,
  hierarchyLevel: member.hierarchyLevel,
});

// Convert all team members from config to Employee format - this is the single source of truth
const TEAM_MEMBERS_FROM_CONFIG: Employee[] = allTeamMembers.map(teamMemberToEmployee);

// Sample brokers for demo purposes when no real brokers are passed
const SAMPLE_BROKERS: Employee[] = [
  {
    id: 'broker-1',
    name: 'Ahmed Hassan',
    role: 'Senior Broker',
    department: 'Sales',
    type: 'human',
    email: 'ahmed@JBJ.ae',
    status: 'active',
    leads: 24,
    performance: 92,
    description: 'Specializes in luxury off-plan properties',
  },
  {
    id: 'broker-2',
    name: 'Sarah Johnson',
    role: 'Property Consultant',
    department: 'Sales',
    type: 'human',
    email: 'sarah@JBJ.ae',
    status: 'active',
    leads: 18,
    performance: 85,
    description: 'Expert in villa communities and ready properties',
  },
  {
    id: 'broker-3',
    name: 'Michael Chen',
    role: 'Investment Specialist',
    department: 'Sales',
    type: 'human',
    email: 'michael@JBJ.ae',
    status: 'active',
    leads: 31,
    performance: 94,
    description: 'Focus on high-net-worth client portfolios',
  },
];

// Sample CV entries
const SAMPLE_CVS: CVEntry[] = [
  {
    id: 'cv-1',
    candidateName: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+971 50 111 2222',
    positionApplied: 'Property Consultant',
    uploadDate: '2026-01-10',
    uploadedBy: 'Website Career Form',
    ranking: 8,
    status: 'interview_scheduled',
    experience: '5 years of real estate experience',
    education: 'MBA in Real Estate Management',
    category: 'collected',
    gender: 'male',
    languages: ['English', 'Arabic'],
    age: 32,
  },
  {
    id: 'cv-2',
    candidateName: 'Emily Brown',
    email: 'emily.brown@email.com',
    phone: '+971 55 333 4444',
    positionApplied: 'Marketing Coordinator',
    uploadDate: '2026-01-09',
    uploadedBy: 'LinkedIn Application',
    ranking: 7,
    status: 'reviewed',
    experience: '3 years in digital marketing',
    education: 'Bachelor in Marketing',
    category: 'collected',
    gender: 'female',
    languages: ['English', 'French'],
    age: 28,
  },
  {
    id: 'cv-3',
    candidateName: 'Ali Mohammed',
    email: 'ali.m@email.com',
    phone: '+971 52 555 6666',
    positionApplied: 'Senior Broker',
    uploadDate: '2026-01-08',
    uploadedBy: 'Referral',
    ranking: 9,
    status: 'pending',
    experience: '8 years in luxury real estate',
    education: 'Master in Business Administration',
    category: 'pending',
    gender: 'male',
    languages: ['Arabic', 'English', 'Hindi'],
    age: 35,
  },
  {
    id: 'cv-4',
    candidateName: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+971 50 777 8888',
    positionApplied: 'Junior Broker',
    uploadDate: '2026-01-07',
    uploadedBy: 'HR Direct Upload',
    ranking: 6,
    status: 'pending',
    experience: '2 years in sales',
    education: 'Bachelor in Business',
    category: 'flagged',
    gender: 'female',
    languages: ['English', 'Mandarin'],
    age: 25,
  },
  {
    id: 'cv-5',
    candidateName: 'Ahmed Hassan',
    email: 'ahmed.h@email.com',
    phone: '+971 56 999 0000',
    positionApplied: 'Finance Officer',
    uploadDate: '2026-01-05',
    uploadedBy: 'Website Career Form',
    ranking: 5,
    status: 'rejected',
    experience: '4 years in accounting',
    education: 'Bachelor in Finance',
    category: 'rejected',
    gender: 'male',
    languages: ['Arabic', 'English'],
    age: 30,
  },
];

interface EmployeesHubProps {
  userId: string;
  brokers?: Employee[];
}

const EmployeesHub = ({ userId, brokers = [] }: EmployeesHubProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [cvEntries, setCvEntries] = useState<CVEntry[]>(SAMPLE_CVS);
  const [cvSearchQuery, setCvSearchQuery] = useState('');
  const [cvFilter, setCvFilter] = useState<string>('all');
  const [cvCategoryFilter, setCvCategoryFilter] = useState<string>('all');
  const [cvGenderFilter, setCvGenderFilter] = useState<string>('all');
  
  const { logAction } = useCRMActionLog();

  const allBrokers = brokers.length > 0 ? brokers : SAMPLE_BROKERS;
  // Use team members from centralized config for accurate counts
  const allEmployees = useMemo(() => [...TEAM_MEMBERS_FROM_CONFIG], []);

  const getFilteredEmployees = () => {
    let filtered = allEmployees;
    
    // Filter by tab - map to department names from config
    if (activeTab !== 'all') {
      if (activeTab === 'ai') {
        filtered = allEmployees.filter(e => e.type === 'ai');
      } else if (activeTab === 'human') {
        filtered = allEmployees.filter(e => e.type === 'human');
      } else if (activeTab === 'executive') {
        filtered = allEmployees.filter(e => e.department === 'Executive');
      } else if (activeTab === 'sales') {
        filtered = allEmployees.filter(e => e.department === 'Sales' || e.department === 'Client Relations');
      } else if (activeTab === 'hr') {
        filtered = allEmployees.filter(e => e.department === 'Human Resources');
      } else if (activeTab === 'marketing') {
        filtered = allEmployees.filter(e => 
          e.department === 'Marketing' || 
          e.department === 'Marketing & Content' || 
          e.department === 'Design' || 
          e.department === 'Media'
        );
      } else if (activeTab === 'tech') {
        filtered = allEmployees.filter(e => 
          e.department === 'Software Engineering' || 
          e.department === 'Technology' || 
          e.department === 'IT'
        );
      } else if (activeTab === 'admin') {
        filtered = allEmployees.filter(e => e.department === 'Administration' || e.department === 'Operations');
      } else if (activeTab === 'finance') {
        filtered = allEmployees.filter(e => e.department === 'Finance');
      } else if (activeTab === 'customerHappiness') {
        filtered = allEmployees.filter(e => e.department === 'Customer Happiness');
      } else {
        // Fallback: search by department containing tab name
        filtered = allEmployees.filter(e => e.department.toLowerCase().includes(activeTab.toLowerCase()));
      }
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.role.toLowerCase().includes(query) ||
        e.department.toLowerCase().includes(query)
      );
    }
    
    // Sort by hierarchy level
    return filtered.sort((a, b) => (a.hierarchyLevel || 99) - (b.hierarchyLevel || 99));
  };

  // Group employees by department for organized display
  const getGroupedEmployees = () => {
    const filtered = getFilteredEmployees();
    const grouped: Record<string, Employee[]> = {};
    
    filtered.forEach(emp => {
      const dept = emp.department;
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(emp);
    });
    
    // Sort each department by hierarchy level
    Object.keys(grouped).forEach(dept => {
      grouped[dept].sort((a, b) => (a.hierarchyLevel || 99) - (b.hierarchyLevel || 99));
    });
    
    return grouped;
  };

  // Department order for display
  const departmentDisplayOrder = [
    'Executive',
    'Legal',
    'Sales',
    'Client Relations',
    'VIP Client Relations',
    'After Sales',
    'Marketing',
    'Content',
    'Creative & Media',
    'Human Resources',
    'Finance',
    'Operations',
    'Software Engineering',
    'Project Management',
    'IT',
    'Administration',
    'Customer Happiness',
  ];

  const getFilteredCVs = () => {
    let filtered = cvEntries;
    
    // Filter by status
    if (cvFilter !== 'all') {
      filtered = filtered.filter(cv => cv.status === cvFilter);
    }
    
    // Filter by category (Collected, Flagged, Rejected, Pending)
    if (cvCategoryFilter !== 'all') {
      filtered = filtered.filter(cv => cv.category === cvCategoryFilter);
    }
    
    // Filter by gender
    if (cvGenderFilter !== 'all') {
      filtered = filtered.filter(cv => cv.gender === cvGenderFilter);
    }
    
    // Enhanced search - search by name, position, email, languages, or gender keywords
    if (cvSearchQuery) {
      const query = cvSearchQuery.toLowerCase();
      filtered = filtered.filter(cv =>
        cv.candidateName.toLowerCase().includes(query) ||
        cv.positionApplied.toLowerCase().includes(query) ||
        cv.email.toLowerCase().includes(query) ||
        cv.experience?.toLowerCase().includes(query) ||
        cv.education?.toLowerCase().includes(query) ||
        cv.languages?.some(lang => lang.toLowerCase().includes(query)) ||
        (cv.gender && cv.gender.toLowerCase().includes(query)) ||
        (query === 'female' && cv.gender === 'female') ||
        (query === 'male' && cv.gender === 'male') ||
        (query === 'english' && cv.languages?.includes('English')) ||
        (query === 'arabic' && cv.languages?.includes('Arabic')) ||
        (query === 'marketing' && cv.positionApplied.toLowerCase().includes('marketing'))
      );
    }
    
    // Sort by ranking (highest first)
    return filtered.sort((a, b) => b.ranking - a.ranking);
  };

  const getDepartmentIcon = (department: string) => {
    const dept = department.toLowerCase();
    if (dept.includes('admin') || dept.includes('operations')) return <Shield className="h-4 w-4" />;
    if (dept.includes('human') || dept.includes('hr')) return <UserCheck className="h-4 w-4" />;
    if (dept.includes('finance')) return <DollarSign className="h-4 w-4" />;
    if (dept.includes('marketing') || dept.includes('media') || dept.includes('design')) return <Palette className="h-4 w-4" />;
    if (dept.includes('sales') || dept.includes('client')) return <Briefcase className="h-4 w-4" />;
    if (dept.includes('executive')) return <Crown className="h-4 w-4" />;
    if (dept.includes('software') || dept.includes('tech') || dept.includes('it')) return <Code className="h-4 w-4" />;
    if (dept.includes('customer') || dept.includes('happiness')) return <Heart className="h-4 w-4" />;
    if (dept.includes('project')) return <Folder className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'inactive': return 'bg-zinc-500';
      default: return 'bg-gray-500';
    }
  };

  const getCVStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending Review</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Reviewed</Badge>;
      case 'interview_scheduled':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Interview Scheduled</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      case 'hired':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleChat = (employee: Employee) => {
    // Open email chat for employees
    if (employee.email) {
      logAction({
        actionType: 'chat',
        targetName: employee.name,
        targetContact: employee.email,
        employeeId: employee.id,
        notes: `Initiated chat with ${employee.name}`,
      });
      window.location.href = `mailto:${employee.email}?subject=Chat with ${employee.name}`;
    } else {
      toast.info(`${employee.name} doesn't have contact info listed`);
    }
  };

  const handleCall = (employee: Employee) => {
    logAction({
      actionType: 'call',
      targetName: employee.name,
      targetContact: '+971565911000',
      employeeId: employee.id,
      notes: `Called company line for ${employee.name}`,
    });
    window.location.href = `tel:+971565911000`;
  };

  const handleEmail = (employee: Employee) => {
    if (employee.email) {
      logAction({
        actionType: 'email',
        targetName: employee.name,
        targetContact: employee.email,
        employeeId: employee.id,
        notes: `Sent email to ${employee.name}`,
      });
      window.location.href = `mailto:${employee.email}`;
    } else {
      toast.info(`${employee.name} doesn't have an email listed`);
    }
  };

  const handleVideoMeeting = (employee: Employee) => {
    if (employee.email) {
      logAction({
        actionType: 'video',
        targetName: employee.name,
        targetContact: employee.email,
        employeeId: employee.id,
        notes: `Started video meeting with ${employee.name}`,
      });
      window.open(`https://meet.google.com/new?authuser=${employee.email}`, '_blank');
    } else {
      toast.info('Video meeting requires an email address. Feature coming soon.');
    }
  };

  const handleScheduleInterview = (cv: CVEntry) => {
    toast.success(`Scheduling interview with ${cv.candidateName}...`);
    setCvEntries(prev => prev.map(c => 
      c.id === cv.id ? { ...c, status: 'interview_scheduled' as const } : c
    ));
  };

  // Calculate stats from real team config data
  const stats = useMemo(() => ({
    total: allEmployees.length,
    human: allEmployees.filter(e => e.type === 'human').length,
    executive: allEmployees.filter(e => e.department === 'Executive').length,
    sales: allEmployees.filter(e => e.department === 'Sales' || e.department === 'Client Relations').length,
    hr: allEmployees.filter(e => e.department === 'Human Resources').length,
    marketing: allEmployees.filter(e => 
      e.department === 'Marketing' || 
      e.department === 'Marketing & Content' || 
      e.department === 'Design' || 
      e.department === 'Media'
    ).length,
    finance: allEmployees.filter(e => e.department === 'Finance').length,
    tech: allEmployees.filter(e => 
      e.department === 'Software Engineering' || 
      e.department === 'Technology' || 
      e.department === 'IT'
    ).length,
    admin: allEmployees.filter(e => e.department === 'Administration' || e.department === 'Operations').length,
    customerHappiness: allEmployees.filter(e => e.department === 'Customer Happiness').length,
    projectMgmt: allEmployees.filter(e => e.department === 'Project Management').length,
    pendingCVs: cvEntries.filter(cv => cv.status === 'pending').length,
  }), [allEmployees, cvEntries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-white rounded-xl border border-crm-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-crm-text flex items-center gap-3">
            <Building2 className="h-7 w-7 text-gold" />
            JBJ Employees Hub
          </h2>
          <p className="text-crm-text-muted mt-1">Team Management & HR Center</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/video-meeting">
            <Button variant="dark" className="gap-2">
              <Video className="h-4 w-4" />
              JBJ Video Meet
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - CLICKABLE to filter - WHITE BACKGROUND */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card 
          className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-200 ${activeTab === 'all' ? 'border-gold ring-2 ring-gold/20' : 'border-crm-border'}`}
          onClick={() => setActiveTab('all')}
        >
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-gold mx-auto mb-2" />
            <p className="text-xl font-bold text-crm-text">{stats.total}</p>
            <p className="text-xs text-crm-text-muted font-medium">Total Team</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-200 ${activeTab === 'human' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-crm-border'}`}
          onClick={() => setActiveTab('human')}
        >
          <CardContent className="p-4 text-center">
            <UserCheck className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-crm-text">{stats.human}</p>
            <p className="text-xs text-crm-text-muted font-medium">Human Staff</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-200 ${activeTab === 'executive' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-crm-border'}`}
          onClick={() => setActiveTab('executive')}
        >
          <CardContent className="p-4 text-center">
            <Crown className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-crm-text">{stats.executive}</p>
            <p className="text-xs text-crm-text-muted font-medium">Executive</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-200 ${activeTab === 'sales' ? 'border-green-500 ring-2 ring-green-200' : 'border-crm-border'}`}
          onClick={() => setActiveTab('sales')}
        >
          <CardContent className="p-4 text-center">
            <Briefcase className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-crm-text">{stats.sales}</p>
            <p className="text-xs text-crm-text-muted font-medium">Sales</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-200 ${activeTab === 'hr' ? 'border-pink-500 ring-2 ring-pink-200' : 'border-crm-border'}`}
          onClick={() => setActiveTab('hr')}
        >
          <CardContent className="p-4 text-center">
            <UserCheck className="h-5 w-5 text-pink-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-crm-text">{stats.hr}</p>
            <p className="text-xs text-crm-text-muted font-medium">HR Team</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-200 ${activeTab === 'marketing' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-crm-border'}`}
          onClick={() => setActiveTab('marketing')}
        >
          <CardContent className="p-4 text-center">
            <Palette className="h-5 w-5 text-orange-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-crm-text">{stats.marketing}</p>
            <p className="text-xs text-crm-text-muted font-medium">Marketing</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-200 ${activeTab === 'cv' ? 'border-gold ring-2 ring-gold/20' : 'border-crm-border'}`}
          onClick={() => setActiveTab('cv')}
        >
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 text-gold mx-auto mb-2" />
            <p className="text-xl font-bold text-gold">{cvEntries.length}</p>
            <p className="text-xs text-crm-text-muted font-medium">CV Center</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-200 ${activeTab === 'training' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-crm-border'}`}
          onClick={() => setActiveTab('training')}
        >
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-crm-text">Training</p>
            <p className="text-xs text-crm-text-muted font-medium">Programs</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Tabs hidden, controlled by cards above */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* TabsList removed - using top cards for filtering instead */}

        {/* Search Bar - WHITE BACKGROUND */}
        {activeTab !== 'cv' && activeTab !== 'training' && (
          <div className="mt-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-crm-text-muted" />
              <Input
                placeholder="Search employees by name, role, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-crm-border text-crm-text placeholder:text-crm-text-muted focus:ring-2 focus:ring-gold/30 focus:border-gold"
              />
            </div>
          </div>
        )}

        {/* CV Center Tab Content */}
        <TabsContent value="cv" className="mt-4">
          <CVCenter userId={userId} />
        </TabsContent>

        {/* Training Management Tab Content */}
        <TabsContent value="training" className="mt-4">
          <TrainingManagement />
        </TabsContent>

        {/* Employee List Tab Content - Grouped by Department */}
        {activeTab !== 'cv' && (
          <TabsContent value={activeTab} className="mt-4">
            <div className="space-y-6">
              {(() => {
                const grouped = getGroupedEmployees();
                const departments = Object.keys(grouped).sort((a, b) => {
                  const aIdx = departmentDisplayOrder.indexOf(a);
                  const bIdx = departmentDisplayOrder.indexOf(b);
                  if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
                  if (aIdx === -1) return 1;
                  if (bIdx === -1) return -1;
                  return aIdx - bIdx;
                });
                
                return departments.map(dept => (
                  <div key={dept} className="space-y-3">
                    {/* Department Header */}
                    <div className="flex items-center gap-3 pb-2 border-b border-crm-border">
                      <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center">
                        {getDepartmentIcon(dept)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-crm-text">{dept}</h3>
                        <p className="text-xs text-crm-text-muted">{grouped[dept].length} member{grouped[dept].length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    
                    {/* Department Employees */}
                    <div className="grid gap-3">
                      {grouped[dept].map((employee) => (
                        <Card 
                          key={employee.id} 
                          className="bg-white border border-crm-border hover:border-gold/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {/* Avatar - Use actual team photos */}
                                <div className="relative">
                                  <Avatar className="h-12 w-12 border-2 border-gold/30">
                                    {/* GLOBAL IMAGE RULE - LOCKED (FINAL): max zoom, crop from bottom */}
                                    {employee.avatar ? (
                                      <AvatarImage src={employee.avatar} alt={employee.name} className="bg-zinc-900" />
                                    ) : null}
                                    <AvatarFallback className="bg-gold/10 text-gold font-bold">
                                      {employee.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${getStatusColor(employee.status)} border-2 border-white`} />
                                </div>

                                {/* Info - No AI labels */}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-crm-text">{employee.name}</p>
                                    {employee.role === 'Founder & CEO' && (
                                      <Crown className="h-4 w-4 text-gold" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gold font-medium">{employee.role}</p>
                                  
                                  {/* Reports To */}
                                  {employee.reportsTo && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <ChevronRight className="h-3 w-3 text-crm-text-muted rotate-[-90deg]" />
                                      <span className="text-[11px] text-crm-text-muted">Reports to: </span>
                                      <span className="text-[11px] text-crm-text font-medium">
                                        {(() => {
                                          const manager = getTeamMemberById(employee.reportsTo);
                                          return manager ? manager.name.split(' ')[0] + ' ' + manager.name.split(' ')[1]?.charAt(0) + '.' : employee.reportsTo;
                                        })()}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {employee.languages && employee.languages.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {employee.languages.slice(0, 3).map((lang, idx) => (
                                        <Badge key={idx} variant="outline" className="text-[10px] py-0 text-crm-text-muted border-crm-border">
                                          {lang}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions & Stats */}
                              <div className="flex items-center gap-3">
                                {/* Quick Actions - HIGH VISIBILITY BUTTONS */}
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm"
                                    className="h-9 px-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-md transition-all duration-200 hover:scale-105"
                                    onClick={(e) => { e.stopPropagation(); handleChat(employee); }}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1.5" />
                                    Chat
                                  </Button>
                                  {employee.email && (
                                    <Button 
                                      size="sm"
                                      className="h-9 px-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md transition-all duration-200 hover:scale-105"
                                      onClick={(e) => { e.stopPropagation(); handleEmail(employee); }}
                                    >
                                      <Mail className="h-4 w-4 mr-1.5" />
                                      Email
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm"
                                    className="h-9 px-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-medium shadow-md transition-all duration-200 hover:scale-105"
                                    onClick={(e) => { e.stopPropagation(); handleVideoMeeting(employee); }}
                                  >
                                    <Video className="h-4 w-4 mr-1.5" />
                                    Meet
                                  </Button>
                                </div>

                                <ChevronRight className="h-5 w-5 text-crm-text-muted" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ));
              })()}

              {getFilteredEmployees().length === 0 && (
                <Card className="bg-white border-crm-border">
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-crm-text-muted opacity-50" />
                    <p className="text-crm-text-muted">No employees found in this category</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EmployeesHub;
