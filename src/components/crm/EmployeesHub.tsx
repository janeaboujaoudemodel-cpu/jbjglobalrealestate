import { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'admin' | 'hr' | 'finance' | 'marketing' | 'brokers' | 'ai' | 'executive';
  type: 'human' | 'ai';
  avatar?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'away' | 'busy' | 'inactive';
  leads?: number;
  performance?: number;
  description?: string;
  responsibilities?: string[];
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
  category: 'collected' | 'flagged' | 'archived' | 'pending';
  ranking: number;
  status: 'pending' | 'reviewed' | 'interview_scheduled' | 'rejected' | 'hired';
  experience: string;
  education: string;
}

// Comprehensive team members organized by department
const TEAM_MEMBERS: Employee[] = [
  // Executive / Admin
  {
    id: 'jane',
    name: 'Jane Abou Jaoude',
    role: 'Founder',
    department: 'admin',
    type: 'human',
    email: 'jane@jbj.ae',
    phone: '+971 56 591 1000',
    status: 'active',
    description: 'Visionary leader and founder of JBJ Global Real Estate',
    responsibilities: ['Strategic Direction', 'Business Development', 'Key Partnerships', 'Platform Vision'],
  },
  {
    id: 'head-sales',
    name: 'Head of Sales',
    role: 'Sales Director',
    department: 'brokers',
    type: 'human',
    email: 'sales@jbj.ae',
    status: 'active',
    description: 'Leads the sales team and drives revenue targets',
    responsibilities: ['Sales Strategy', 'Team Performance', 'Client Relations', 'Revenue Growth'],
  },
  {
    id: 'marketing-director',
    name: 'Marketing Director',
    role: 'Head of Marketing',
    department: 'marketing',
    type: 'human',
    email: 'marketing@jbj.ae',
    status: 'active',
    description: 'Oversees all marketing initiatives and brand strategy',
    responsibilities: ['Brand Strategy', 'Campaign Management', 'Market Research', 'Digital Marketing'],
  },
  {
    id: 'ai-receptionist',
    name: 'JBJ Virtual Receptionist',
    role: 'AI Receptionist',
    department: 'admin',
    type: 'ai',
    status: 'active',
    description: 'Handles calls, schedules meetings, and manages inquiries 24/7',
    responsibilities: ['Call Handling', 'Meeting Scheduling', 'Inquiry Management'],
  },
  
  // HR Department
  {
    id: 'jessica',
    name: 'Jessica',
    role: 'HR Manager',
    department: 'hr',
    type: 'human',
    email: 'hr@jbj.ae',
    status: 'active',
    description: 'Manages recruitment, onboarding, and team development',
    responsibilities: ['Recruitment', 'Onboarding', 'Training Coordination', 'First Interviews'],
  },
  {
    id: 'david',
    name: 'David Carter',
    role: 'Head of Recruitment / COO',
    department: 'hr',
    type: 'human',
    email: 'recruitment@jbj.ae',
    status: 'active',
    description: 'Oversees operations and second-round management interviews',
    responsibilities: ['Operations', 'Second-Round Interviews', 'Final Hiring Decisions'],
  },
  {
    id: 'hr-assistant',
    name: 'HR Assistant',
    role: 'HR Coordinator',
    department: 'hr',
    type: 'human',
    email: 'hrteam@jbj.ae',
    status: 'active',
    description: 'Supports HR operations and candidate communication',
    responsibilities: ['CV Collection', 'Interview Scheduling', 'Candidate Communication'],
  },
  
  // Marketing Department
  {
    id: 'media-lead',
    name: 'Media Manager',
    role: 'Media & Marketing Lead',
    department: 'marketing',
    type: 'human',
    email: 'media@jbj.ae',
    status: 'active',
    description: 'Leads all marketing campaigns and brand strategy',
    responsibilities: ['Campaign Strategy', 'Brand Management', 'Content Planning'],
  },
  {
    id: 'designer',
    name: 'Graphic Designer',
    role: 'Creative Designer',
    department: 'marketing',
    type: 'human',
    email: 'design@jbj.ae',
    status: 'active',
    description: 'Creates all visual content and marketing materials',
    responsibilities: ['Graphic Design', 'Social Media Creatives', 'Brand Assets'],
  },
  {
    id: 'videographer',
    name: 'Videographer',
    role: 'Video Production Specialist',
    department: 'marketing',
    type: 'human',
    email: 'video@jbj.ae',
    status: 'active',
    description: 'Produces professional property videos and promotional content',
    responsibilities: ['Property Videos', 'Drone Footage', 'Video Production'],
  },
  {
    id: 'photographer',
    name: 'Photographer',
    role: 'Property Photographer',
    department: 'marketing',
    type: 'human',
    email: 'photo@jbj.ae',
    status: 'active',
    description: 'Captures high-quality property photography',
    responsibilities: ['Property Photography', 'Listing Images', 'Virtual Tours'],
  },
  {
    id: 'editor',
    name: 'Video Editor',
    role: 'Post-Production Editor',
    department: 'marketing',
    type: 'human',
    email: 'editing@jbj.ae',
    status: 'active',
    description: 'Handles all video editing and post-production',
    responsibilities: ['Video Editing', 'Color Grading', 'Motion Graphics'],
  },
  
  // Finance Department
  {
    id: 'finance-officer',
    name: 'Finance Officer',
    role: 'Financial Manager',
    department: 'finance',
    type: 'human',
    email: 'finance@jbj.ae',
    status: 'active',
    description: 'Manages company finances, commissions, and accounting',
    responsibilities: ['Financial Planning', 'Commission Management', 'Reporting'],
  },
  {
    id: 'accountant',
    name: 'Accountant',
    role: 'Senior Accountant',
    department: 'finance',
    type: 'human',
    email: 'accounts@jbj.ae',
    status: 'active',
    description: 'Handles bookkeeping and financial records',
    responsibilities: ['Bookkeeping', 'Invoicing', 'Tax Compliance'],
  },
  
  // Executive Assistant
  {
    id: 'exec-assistant',
    name: 'Executive Assistant',
    role: 'Personal Assistant to CEO',
    department: 'executive',
    type: 'human',
    email: 'assistant@jbj.ae',
    status: 'active',
    description: 'Supports CEO with scheduling, coordination, and tasks',
    responsibilities: ['Calendar Management', 'Travel Coordination', 'Task Prioritization'],
  },
  
  // AI Team Members
  {
    id: 'ai-assistant',
    name: 'JBJ AI Assistant',
    role: 'Central AI Coordinator',
    department: 'ai',
    type: 'ai',
    status: 'active',
    description: 'Coordinates between departments, handles inquiries, and automates workflows',
    responsibilities: ['Task Coordination', 'Inquiry Handling', 'Workflow Automation'],
  },
  {
    id: 'ai-designer',
    name: 'JBJ Design Studio',
    role: 'AI Graphic Designer',
    department: 'ai',
    type: 'ai',
    status: 'active',
    description: 'Creates social media content, presentations, and marketing materials',
    responsibilities: ['Template Generation', 'Social Media Graphics', 'Presentations'],
  },
  {
    id: 'ai-finance',
    name: 'JBJ Finance Advisor',
    role: 'AI Financial Analyst',
    department: 'ai',
    type: 'ai',
    status: 'active',
    description: 'Provides market analysis, mortgage calculations, and property valuations',
    responsibilities: ['Market Analysis', 'Mortgage Calculations', 'Property Valuations'],
  },
  {
    id: 'ai-crm',
    name: 'JBJ CRM Manager',
    role: 'AI Lead Manager',
    department: 'ai',
    type: 'ai',
    status: 'active',
    description: 'Manages leads, tracks follow-ups, and automates CRM tasks',
    responsibilities: ['Lead Tracking', 'Follow-up Automation', 'Pipeline Management'],
  },
];

// Sample brokers data
const SAMPLE_BROKERS: Employee[] = [
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
    description: 'Specializes in luxury off-plan properties',
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
    description: 'Expert in villa communities and ready properties',
  },
  {
    id: 'broker-3',
    name: 'Michael Chen',
    role: 'Investment Specialist',
    department: 'brokers',
    type: 'human',
    email: 'michael@jbj.ae',
    phone: '+971 52 456 7890',
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
    experience: '5 years in Dubai real estate',
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
    category: 'archived',
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

  const allBrokers = brokers.length > 0 ? brokers : SAMPLE_BROKERS;
  const allEmployees = [...TEAM_MEMBERS, ...allBrokers];

  const getFilteredEmployees = () => {
    let filtered = allEmployees;
    
    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'ai') {
        filtered = allEmployees.filter(e => e.type === 'ai');
      } else if (activeTab === 'human') {
        filtered = allEmployees.filter(e => e.type === 'human');
      } else {
        filtered = allEmployees.filter(e => e.department === activeTab);
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
    
    return filtered;
  };

  const getFilteredCVs = () => {
    let filtered = cvEntries;
    
    // Filter by status
    if (cvFilter !== 'all') {
      filtered = filtered.filter(cv => cv.status === cvFilter);
    }
    
    // Filter by category (Collected, Flagged, Archived, Pending)
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
    switch (department) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'hr': return <UserCheck className="h-4 w-4" />;
      case 'finance': return <DollarSign className="h-4 w-4" />;
      case 'marketing': return <Palette className="h-4 w-4" />;
      case 'brokers': return <Briefcase className="h-4 w-4" />;
      case 'ai': return <Bot className="h-4 w-4" />;
      case 'executive': return <Crown className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
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
    // Open in-app chat or WhatsApp if phone available
    if (employee.phone) {
      const phone = employee.phone.replace(/\s+/g, '').replace('+', '');
      window.open(`https://wa.me/${phone}`, '_blank');
    } else if (employee.email) {
      window.location.href = `mailto:${employee.email}?subject=Chat with ${employee.name}`;
    } else {
      toast.info(`${employee.name} doesn't have contact info listed`);
    }
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

  const handleVideoMeeting = (employee: Employee) => {
    // Open video meeting link or calendar
    if (employee.email) {
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

  const stats = {
    total: allEmployees.length,
    human: allEmployees.filter(e => e.type === 'human').length,
    ai: allEmployees.filter(e => e.type === 'ai').length,
    brokers: allEmployees.filter(e => e.department === 'brokers').length,
    hr: allEmployees.filter(e => e.department === 'hr').length,
    marketing: allEmployees.filter(e => e.department === 'marketing').length,
    pendingCVs: cvEntries.filter(cv => cv.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="h-7 w-7 text-gold" />
            JBJ Employees Hub
          </h2>
          <p className="text-muted-foreground mt-1">Team Management & HR Center</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/video-meeting">
            <Button variant="outline" className="gap-2 border-gold/30 hover:bg-gold/10">
              <Video className="h-4 w-4" />
              JBJ Video Meet
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - CLICKABLE to filter */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card 
          className={`bg-card border-border cursor-pointer hover:border-gold/50 transition-colors ${activeTab === 'all' ? 'border-gold ring-1 ring-gold/30' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-gold mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Team</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-card border-border cursor-pointer hover:border-blue-400/50 transition-colors ${activeTab === 'human' ? 'border-blue-400 ring-1 ring-blue-400/30' : ''}`}
          onClick={() => setActiveTab('human')}
        >
          <CardContent className="p-4 text-center">
            <UserCheck className="h-5 w-5 text-blue-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats.human}</p>
            <p className="text-xs text-muted-foreground">Human Staff</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-card border-border cursor-pointer hover:border-purple-400/50 transition-colors ${activeTab === 'ai' ? 'border-purple-400 ring-1 ring-purple-400/30' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <CardContent className="p-4 text-center">
            <Sparkles className="h-5 w-5 text-purple-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats.ai}</p>
            <p className="text-xs text-muted-foreground">Assistants</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-card border-border cursor-pointer hover:border-green-400/50 transition-colors ${activeTab === 'brokers' ? 'border-green-400 ring-1 ring-green-400/30' : ''}`}
          onClick={() => setActiveTab('brokers')}
        >
          <CardContent className="p-4 text-center">
            <Briefcase className="h-5 w-5 text-green-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats.brokers}</p>
            <p className="text-xs text-muted-foreground">Brokers</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-card border-border cursor-pointer hover:border-pink-400/50 transition-colors ${activeTab === 'hr' ? 'border-pink-400 ring-1 ring-pink-400/30' : ''}`}
          onClick={() => setActiveTab('hr')}
        >
          <CardContent className="p-4 text-center">
            <UserCheck className="h-5 w-5 text-pink-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats.hr}</p>
            <p className="text-xs text-muted-foreground">HR Team</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-card border-border cursor-pointer hover:border-orange-400/50 transition-colors ${activeTab === 'marketing' ? 'border-orange-400 ring-1 ring-orange-400/30' : ''}`}
          onClick={() => setActiveTab('marketing')}
        >
          <CardContent className="p-4 text-center">
            <Palette className="h-5 w-5 text-orange-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats.marketing}</p>
            <p className="text-xs text-muted-foreground">Marketing</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-card border-border border-gold/30 cursor-pointer hover:border-gold transition-colors ${activeTab === 'cv' ? 'border-gold ring-1 ring-gold/30' : ''}`}
          onClick={() => setActiveTab('cv')}
        >
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 text-gold mx-auto mb-2" />
            <p className="text-xl font-bold text-gold">{stats.pendingCVs}</p>
            <p className="text-xs text-muted-foreground">Pending CVs</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900/50 border border-zinc-800 grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="all" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs">
            All
          </TabsTrigger>
          <TabsTrigger value="executive" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs">
            Executive
          </TabsTrigger>
          <TabsTrigger value="hr" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs">
            HR
          </TabsTrigger>
          <TabsTrigger value="admin" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs">
            Admin
          </TabsTrigger>
          <TabsTrigger value="marketing" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs">
            Marketing
          </TabsTrigger>
          <TabsTrigger value="finance" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs">
            Finance
          </TabsTrigger>
          <TabsTrigger value="brokers" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs">
            Brokers
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs">
            AI Team
          </TabsTrigger>
          <TabsTrigger value="cv" className="data-[state=active]:bg-gold data-[state=active]:text-black text-xs">
            CV Collected
          </TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        {activeTab !== 'cv' && (
          <div className="mt-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, role, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-800"
              />
            </div>
          </div>
        )}

        {/* CV Collected Tab Content */}
        <TabsContent value="cv" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5 text-gold" />
                    CV Collection & Candidate Management
                  </CardTitle>
                  <CardDescription>
                    All uploaded CVs and candidate applications are stored here
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2 border-gold/30">
                    <Upload className="h-4 w-4" />
                    Upload CV
                  </Button>
                </div>
              </div>
              
              {/* CV Filters */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, position, language, gender, skills..."
                    value={cvSearchQuery}
                    onChange={(e) => setCvSearchQuery(e.target.value)}
                    className="pl-10 bg-zinc-900/50 border-zinc-800"
                  />
                </div>
                {/* Category Filter - NEW */}
                <select
                  value={cvCategoryFilter}
                  onChange={(e) => setCvCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-white text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="collected">📂 Collected CVs</option>
                  <option value="pending">⏳ Pending CVs</option>
                  <option value="flagged">🚩 Flagged CVs</option>
                  <option value="archived">📁 Archived CVs</option>
                </select>
                {/* Status Filter */}
                <select
                  value={cvFilter}
                  onChange={(e) => setCvFilter(e.target.value)}
                  className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Review</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
                {/* Gender Filter - NEW */}
                <select
                  value={cvGenderFilter}
                  onChange={(e) => setCvGenderFilter(e.target.value)}
                  className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-white text-sm"
                >
                  <option value="all">All Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              {/* Quick filter badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge 
                  variant={cvCategoryFilter === 'collected' ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-gold/20"
                  onClick={() => setCvCategoryFilter(cvCategoryFilter === 'collected' ? 'all' : 'collected')}
                >
                  📂 Collected ({cvEntries.filter(cv => cv.category === 'collected').length})
                </Badge>
                <Badge 
                  variant={cvCategoryFilter === 'flagged' ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-red-500/20 text-yellow-400"
                  onClick={() => setCvCategoryFilter(cvCategoryFilter === 'flagged' ? 'all' : 'flagged')}
                >
                  🚩 Flagged ({cvEntries.filter(cv => cv.category === 'flagged').length})
                </Badge>
                <Badge 
                  variant={cvCategoryFilter === 'archived' ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-zinc-500/20"
                  onClick={() => setCvCategoryFilter(cvCategoryFilter === 'archived' ? 'all' : 'archived')}
                >
                  📁 Archived ({cvEntries.filter(cv => cv.category === 'archived').length})
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {getFilteredCVs().map((cv) => (
                    <Card key={cv.id} className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="h-10 w-10 border border-gold/30">
                                <AvatarFallback className="bg-gold/20 text-gold font-bold">
                                  {cv.candidateName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-white font-semibold">{cv.candidateName}</h4>
                                <p className="text-gold text-sm">{cv.positionApplied}</p>
                              </div>
                              {getCVStatusBadge(cv.status)}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                              <div>
                                <p className="text-muted-foreground">Email</p>
                                <p className="text-white">{cv.email}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Experience</p>
                                <p className="text-white">{cv.experience}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Education</p>
                                <p className="text-white">{cv.education}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Upload Date</p>
                                <p className="text-white">{cv.uploadDate}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-3">
                              <Badge className="bg-zinc-800 text-zinc-300">
                                Source: {cv.uploadedBy}
                              </Badge>
                              <Badge className="bg-gold/20 text-gold border-gold/30">
                                <Star className="h-3 w-3 mr-1" />
                                AI Ranking: {cv.ranking}/10
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 border-gold/30 hover:bg-gold/10"
                              onClick={() => handleScheduleInterview(cv)}
                            >
                              <Video className="h-4 w-4" />
                              Schedule Interview
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <FileText className="h-4 w-4" />
                              View CV
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Mail className="h-4 w-4" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {getFilteredCVs().length === 0 && (
                    <div className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No CVs found matching your criteria</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee List Tab Content */}
        {activeTab !== 'cv' && (
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
                          <div className="flex items-center gap-2 flex-wrap">
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
                            <Badge variant="outline" className="text-xs">
                              {getDepartmentIcon(employee.department)}
                              <span className="ml-1 capitalize">{employee.department}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gold">{employee.role}</p>
                          {employee.description && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-md">{employee.description}</p>
                          )}
                          {employee.responsibilities && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {employee.responsibilities.slice(0, 3).map((resp, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] py-0">
                                  {resp}
                                </Badge>
                              ))}
                            </div>
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
                          {employee.type === 'human' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-muted"
                              onClick={(e) => { e.stopPropagation(); handleVideoMeeting(employee); }}
                            >
                              <Video className="h-4 w-4" />
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
        )}
      </Tabs>
    </div>
  );
};

export default EmployeesHub;
