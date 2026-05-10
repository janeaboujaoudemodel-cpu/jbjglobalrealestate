import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText,
  Upload,
  Star,
  Calendar,
  Video,
  Mail,
  Phone,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

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
  source?: string;
}

// Sample CV data - in production this would come from database
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
    source: 'Website',
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
    source: 'LinkedIn',
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
    source: 'Referral',
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
    source: 'Direct',
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
    source: 'Website',
  },
];

const CVManagementCenter = () => {
  const [cvEntries, setCvEntries] = useState<CVEntry[]>(SAMPLE_CVS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState<CVEntry | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [hrAssigned, setHrAssigned] = useState('');

  // Calculate counts dynamically
  const counts = {
    collected: cvEntries.filter(cv => cv.category === 'collected').length,
    pending: cvEntries.filter(cv => cv.category === 'pending').length,
    flagged: cvEntries.filter(cv => cv.category === 'flagged').length,
    rejected: cvEntries.filter(cv => cv.category === 'rejected').length,
  };

  const getFilteredCVs = () => {
    let filtered = cvEntries;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(cv => cv.category === categoryFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cv => cv.status === statusFilter);
    }
    
    if (genderFilter !== 'all') {
      filtered = filtered.filter(cv => cv.gender === genderFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cv =>
        cv.candidateName.toLowerCase().includes(query) ||
        cv.positionApplied.toLowerCase().includes(query) ||
        cv.email.toLowerCase().includes(query) ||
        cv.experience?.toLowerCase().includes(query) ||
        cv.education?.toLowerCase().includes(query) ||
        cv.languages?.some(lang => lang.toLowerCase().includes(query))
      );
    }
    
    return filtered.sort((a, b) => b.ranking - a.ranking);
  };

  const getCVStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-300',
      reviewed: 'bg-blue-100 text-blue-700 border-blue-300',
      interview_scheduled: 'bg-purple-100 text-purple-700 border-purple-300',
      rejected: 'bg-red-100 text-red-700 border-red-300',
      hired: 'bg-green-100 text-green-700 border-green-300',
    };
    const labels: Record<string, string> = {
      pending: 'Pending Review',
      reviewed: 'Reviewed',
      interview_scheduled: 'Interview Scheduled',
      rejected: 'Rejected',
      hired: 'Hired',
    };
    return <Badge className={styles[status] || 'bg-[#F7F2EA] text-[#1A1A1A]/70'}>{labels[status] || status}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      collected: 'bg-blue-100 text-blue-700 border-blue-300',
      pending: 'bg-amber-100 text-amber-700 border-amber-300',
      flagged: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      rejected: 'bg-red-100 text-red-700 border-red-300',
    };
    return <Badge className={styles[category]}>{category.charAt(0).toUpperCase() + category.slice(1)}</Badge>;
  };

  const handleScheduleInterview = (cv: CVEntry) => {
    setSelectedCV(cv);
    setShowScheduleModal(true);
  };

  const confirmScheduleInterview = () => {
    if (!selectedCV || !interviewDate || !interviewTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setCvEntries(prev => prev.map(cv => 
      cv.id === selectedCV.id ? { ...cv, status: 'interview_scheduled' as const } : cv
    ));
    
    toast.success(`Interview scheduled with ${selectedCV.candidateName} on ${interviewDate} at ${interviewTime}`);
    setShowScheduleModal(false);
    setSelectedCV(null);
    setInterviewDate('');
    setInterviewTime('');
    setInterviewNotes('');
    setHrAssigned('');
  };

  const handleContact = (cv: CVEntry) => {
    if (cv.email) {
      window.location.href = `mailto:${cv.email}?subject=Regarding your application for ${cv.positionApplied} at JBJ Global Real Estate`;
    }
  };

  const handleViewCV = (cv: CVEntry) => {
    toast.info(`Opening CV for ${cv.candidateName}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#FDFBF7] border-crm-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-crm-text text-xl font-bold">
                <FileText className="h-6 w-6 text-[#1A1A1A]" />
                CV Management Center
              </CardTitle>
              <CardDescription className="text-crm-text-muted mt-1">
                All uploaded CVs and candidate applications are stored here
              </CardDescription>
            </div>
            <Button variant="primary" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload CV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Counter Cards - Auto-updating */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`bg-[#FDFBF7] border cursor-pointer transition-all duration-200 hover:shadow-md ${categoryFilter === 'collected' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-crm-border'}`}
          onClick={() => setCategoryFilter(categoryFilter === 'collected' ? 'all' : 'collected')}
        >
          <CardContent className="p-4 text-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-crm-text">{counts.collected}</p>
            <p className="text-sm text-crm-text-muted font-medium">Collected</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-[#FDFBF7] border cursor-pointer transition-all duration-200 hover:shadow-md ${categoryFilter === 'pending' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-crm-border'}`}
          onClick={() => setCategoryFilter(categoryFilter === 'pending' ? 'all' : 'pending')}
        >
          <CardContent className="p-4 text-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-crm-text">{counts.pending}</p>
            <p className="text-sm text-crm-text-muted font-medium">Pending</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-[#FDFBF7] border cursor-pointer transition-all duration-200 hover:shadow-md ${categoryFilter === 'flagged' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-crm-border'}`}
          onClick={() => setCategoryFilter(categoryFilter === 'flagged' ? 'all' : 'flagged')}
        >
          <CardContent className="p-4 text-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-crm-text">{counts.flagged}</p>
            <p className="text-sm text-crm-text-muted font-medium">Flagged</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-[#FDFBF7] border cursor-pointer transition-all duration-200 hover:shadow-md ${categoryFilter === 'rejected' ? 'border-red-500 ring-2 ring-red-200' : 'border-crm-border'}`}
          onClick={() => setCategoryFilter(categoryFilter === 'rejected' ? 'all' : 'rejected')}
        >
          <CardContent className="p-4 text-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-crm-text">{counts.rejected}</p>
            <p className="text-sm text-crm-text-muted font-medium">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#FDFBF7] border-crm-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-crm-text-muted" />
              <Input
                placeholder="Search by name, position, language, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#FDFBF7] border-crm-border text-crm-text placeholder:text-crm-text-muted focus:ring-2 focus:ring-gold/30 focus:border-[#B89555]"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-[#FDFBF7] border border-crm-border rounded-lg text-crm-text text-sm font-medium focus:ring-2 focus:ring-gold/30 focus:border-[#B89555] transition-all"
            >
              <option value="all">All Categories</option>
              <option value="collected">Collected</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[#FDFBF7] border border-crm-border rounded-lg text-crm-text text-sm font-medium focus:ring-2 focus:ring-gold/30 focus:border-[#B89555] transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-4 py-2 bg-[#FDFBF7] border border-crm-border rounded-lg text-crm-text text-sm font-medium focus:ring-2 focus:ring-gold/30 focus:border-[#B89555] transition-all"
            >
              <option value="all">All Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* CV Cards List */}
      <div className="space-y-4">
        {getFilteredCVs().map((cv) => (
          <Card 
            key={cv.id} 
            className="bg-crm-text border-l-4 border-l-gold border-r-0 border-t-0 border-b-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  {/* Header Row */}
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-14 w-14 border-2 border-[#B89555]/40">
                      <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A] font-bold text-xl">
                        {cv.candidateName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-lg">{cv.candidateName}</h4>
                      <p className="text-[#1A1A1A] font-semibold">{cv.positionApplied}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCVStatusBadge(cv.status)}
                      {getCategoryBadge(cv.category)}
                    </div>
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-[#1A1A1A]/70 text-xs uppercase tracking-wide font-medium mb-1">Email</p>
                      <p className="text-white font-medium">{cv.email}</p>
                    </div>
                    <div>
                      <p className="text-[#1A1A1A]/70 text-xs uppercase tracking-wide font-medium mb-1">Phone</p>
                      <p className="text-white font-medium">{cv.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#1A1A1A]/70 text-xs uppercase tracking-wide font-medium mb-1">Experience</p>
                      <p className="text-white font-medium">{cv.experience}</p>
                    </div>
                    <div>
                      <p className="text-[#1A1A1A]/70 text-xs uppercase tracking-wide font-medium mb-1">Education</p>
                      <p className="text-white font-medium">{cv.education}</p>
                    </div>
                    <div>
                      <p className="text-[#1A1A1A]/70 text-xs uppercase tracking-wide font-medium mb-1">Upload Date</p>
                      <p className="text-white font-medium">{cv.uploadDate}</p>
                    </div>
                  </div>
                  
                  {/* Tags Row */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Badge className="bg-zinc-700 text-gray-200 font-medium border-0">
                      Source: {cv.source || cv.uploadedBy}
                    </Badge>
                    <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30 font-semibold">
                      <Star className="h-3 w-3 mr-1" />
                      Ranking: {cv.ranking}/10
                    </Badge>
                    {cv.languages && cv.languages.length > 0 && (
                      <Badge variant="outline" className="text-[#1A1A1A]/70 border-[#1A1A1A]">
                        Languages: {cv.languages.join(', ')}
                      </Badge>
                    )}
                    {cv.gender && (
                      <Badge variant="outline" className="text-[#1A1A1A]/70 border-[#1A1A1A] capitalize">
                        <User className="h-3 w-3 mr-1" />
                        {cv.gender}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <Button 
                    size="sm" 
                    className="bg-[#FDFBF7] border border-[#B89555] text-crm-text hover:bg-[#EFE6D6] hover:text-white font-semibold transition-all duration-200 gap-2"
                    onClick={() => handleViewCV(cv)}
                  >
                    <FileText className="h-4 w-4" />
                    View CV
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-[#FDFBF7] border border-[#B89555] text-crm-text hover:bg-[#EFE6D6] hover:text-white font-semibold transition-all duration-200 gap-2"
                    onClick={() => handleContact(cv)}
                  >
                    <Mail className="h-4 w-4" />
                    Contact
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-[#EFE6D6] text-white hover:bg-[#EFE6D6]-dark font-semibold transition-all duration-200 gap-2"
                    onClick={() => handleScheduleInterview(cv)}
                  >
                    <Calendar className="h-4 w-4" />
                    Schedule Interview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {getFilteredCVs().length === 0 && (
          <Card className="bg-[#FDFBF7] border-crm-border">
            <CardContent className="py-16 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-crm-text-muted opacity-40" />
              <p className="text-crm-text-muted text-lg">No CVs found matching your criteria</p>
              <p className="text-crm-text-muted text-sm mt-1">Try adjusting your filters or search query</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Schedule Interview Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="bg-[#FDFBF7] border-crm-border text-crm-text max-w-md">
          <DialogHeader>
            <DialogTitle className="text-crm-text font-bold text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#1A1A1A]" />
              Schedule Interview
            </DialogTitle>
          </DialogHeader>
          
          {selectedCV && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-crm-highlight rounded-lg">
                <Avatar className="h-10 w-10 border border-[#B89555]/30">
                  <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A] font-bold">
                    {selectedCV.candidateName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-crm-text">{selectedCV.candidateName}</p>
                  <p className="text-sm text-crm-text-muted">{selectedCV.positionApplied}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-crm-text font-medium">Date *</Label>
                  <Input 
                    type="date" 
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="mt-1 bg-[#FDFBF7] border-crm-border text-crm-text focus:ring-gold/30 focus:border-[#B89555]"
                  />
                </div>
                <div>
                  <Label className="text-crm-text font-medium">Time *</Label>
                  <Input 
                    type="time" 
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="mt-1 bg-[#FDFBF7] border-crm-border text-crm-text focus:ring-gold/30 focus:border-[#B89555]"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-crm-text font-medium">HR Responsible</Label>
                <select
                  value={hrAssigned}
                  onChange={(e) => setHrAssigned(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#FDFBF7] border border-crm-border rounded-lg text-crm-text focus:ring-2 focus:ring-gold/30 focus:border-[#B89555]"
                >
                  <option value="">Select HR Member</option>
                  <option value="david">David Carter - Head of Recruitment</option>
                  <option value="jessica">Jessica - HR Manager</option>
                  <option value="hr-assistant">HR Assistant</option>
                </select>
              </div>
              
              <div>
                <Label className="text-crm-text font-medium">Notes</Label>
                <Textarea 
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Interview notes, preparation reminders..."
                  className="mt-1 bg-[#FDFBF7] border-crm-border text-crm-text placeholder:text-crm-text-muted focus:ring-gold/30 focus:border-[#B89555] min-h-[80px]"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowScheduleModal(false)}
              className="border-crm-border text-crm-text hover:bg-crm-highlight"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmScheduleInterview}
              variant="primary"
            >
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CVManagementCenter;
