import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, FileText, Upload, Calendar, 
  Briefcase, Mail, Phone, Plus, Brain, 
  CheckCircle, XCircle, Clock, Video, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import CVSearchFilters from './CVSearchFilters';
import CVRankingCard, { type CVCandidate } from './CVRankingCard';
import InterviewScheduler from './InterviewScheduler';
import CVViewer from '@/components/hr/CVViewer';

interface EmployeeCenterProps {
  userId: string;
}

const EmployeeCenter = ({ userId }: EmployeeCenterProps) => {
  const [candidates, setCandidates] = useState<CVCandidate[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    candidateName: '',
    position: '',
    email: '',
    phone: ''
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [positionFilter, setPositionFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Interview scheduling
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CVCandidate | null>(null);
  const [interviewStage, setInterviewStage] = useState<'first' | 'second'>('first');

  // CV Viewer
  const [showCVViewer, setShowCVViewer] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState<CVCandidate | null>(null);

  // Mock initial data with AI analysis
  useEffect(() => {
    setCandidates([
      {
        id: '1',
        candidateName: 'Ahmed Hassan',
        position: 'Senior Broker',
        email: 'ahmed@example.com',
        phone: '+971 50 123 4567',
        uploadDate: new Date('2024-01-08'),
        fileName: 'Ahmed_Hassan_CV.pdf',
        fileUrl: '#',
        status: 'analyzed',
        aiRanking: 1,
        aiScore: 92,
        aiAnalysis: {
          experience: '8 years in real estate',
          education: 'MBA in Business Administration',
          skills: ['Negotiation', 'Property Valuation', 'CRM Systems', 'Client Relations', 'Market Analysis'],
          certifications: ['RERA Certified', 'Sales Excellence'],
          achievements: ['Top Performer 2023', '$50M in sales'],
          relevanceScore: 92,
          recommendation: 'Highly qualified candidate with extensive experience in luxury real estate. Strong recommendation for senior broker position.'
        }
      },
      {
        id: '2',
        candidateName: 'Sarah Johnson',
        position: 'Property Consultant',
        email: 'sarah@example.com',
        phone: '+971 55 987 6543',
        uploadDate: new Date('2024-01-07'),
        fileName: 'Sarah_Johnson_Resume.pdf',
        fileUrl: '#',
        status: 'interview_scheduled',
        interviewStage: 'first',
        firstInterviewDate: new Date('2024-01-10T12:00:00'),
        aiRanking: 2,
        aiScore: 85,
        aiAnalysis: {
          experience: '5 years in property sales',
          education: 'Bachelor in Marketing',
          skills: ['Sales', 'Customer Service', 'Property Tours', 'Social Media Marketing'],
          certifications: ['RERA Certified'],
          achievements: ['100+ successful sales'],
          relevanceScore: 85,
          recommendation: 'Strong candidate with solid sales background. Excellent communication skills noted.'
        }
      },
      {
        id: '3',
        candidateName: 'Mohamed Ali',
        position: 'Marketing Manager',
        email: 'mohamed@example.com',
        phone: '+971 52 456 7890',
        uploadDate: new Date('2024-01-06'),
        fileName: 'Mohamed_Ali_CV.pdf',
        fileUrl: '#',
        status: 'interviewed',
        interviewStage: 'first',
        firstInterviewDate: new Date('2024-01-08T10:00:00'),
        aiRanking: 3,
        aiScore: 78,
        aiAnalysis: {
          experience: '6 years in digital marketing',
          education: 'Master in Digital Marketing',
          skills: ['SEO', 'Content Marketing', 'Social Media', 'Analytics', 'Campaign Management'],
          certifications: ['Google Analytics', 'HubSpot'],
          achievements: ['Led campaigns with 500% ROI'],
          relevanceScore: 78,
          recommendation: 'Good marketing background. May need additional real estate industry training.'
        }
      },
      {
        id: '4',
        candidateName: 'Lisa Chen',
        position: 'Senior Broker',
        email: 'lisa@example.com',
        phone: '+971 56 111 2222',
        uploadDate: new Date('2024-01-05'),
        fileName: 'Lisa_Chen_CV.pdf',
        fileUrl: '#',
        status: 'approved',
        interviewStage: 'completed',
        firstInterviewDate: new Date('2024-01-03T14:00:00'),
        secondInterviewDate: new Date('2024-01-05T11:00:00'),
        aiRanking: 4,
        aiScore: 88,
        aiAnalysis: {
          experience: '10 years in luxury real estate',
          education: 'Bachelor in Business',
          skills: ['Luxury Sales', 'VIP Clients', 'International Markets', 'Mandarin', 'Arabic'],
          certifications: ['RERA Certified', 'Luxury Property Specialist'],
          achievements: ['$100M portfolio', 'Top 1% agent'],
          relevanceScore: 88,
          recommendation: 'Exceptional candidate for high-end properties. Multi-lingual advantage.'
        }
      },
      {
        id: '5',
        candidateName: 'James Wilson',
        position: 'Finance Manager',
        email: 'james@example.com',
        phone: '+971 50 333 4444',
        uploadDate: new Date('2024-01-04'),
        fileName: 'James_Wilson_CV.pdf',
        fileUrl: '#',
        status: 'pending',
        aiRanking: undefined,
        aiScore: undefined
      }
    ]);
  }, []);

  // Get unique positions
  const positions = useMemo(() => {
    return [...new Set(candidates.map(c => c.position))];
  }, [candidates]);

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.candidateName.toLowerCase().includes(term) ||
        c.position.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
      );
    }

    // Position filter
    if (positionFilter !== 'all') {
      result = result.filter(c => c.position === positionFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Tab filter
    if (activeTab === 'pending') {
      result = result.filter(c => c.status === 'pending');
    } else if (activeTab === 'interviews') {
      result = result.filter(c => ['interview_scheduled', 'interviewed'].includes(c.status));
    } else if (activeTab === 'approved') {
      result = result.filter(c => c.status === 'approved');
    } else if (activeTab === 'rejected') {
      result = result.filter(c => c.status === 'rejected' || c.status === 'on_hold');
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
        break;
      case 'oldest':
        result.sort((a, b) => a.uploadDate.getTime() - b.uploadDate.getTime());
        break;
      case 'ranking':
        result.sort((a, b) => (a.aiRanking || 999) - (b.aiRanking || 999));
        break;
      case 'name':
        result.sort((a, b) => a.candidateName.localeCompare(b.candidateName));
        break;
    }

    return result;
  }, [candidates, searchTerm, sortBy, positionFilter, experienceFilter, statusFilter, activeTab]);

  // Stats
  const stats = useMemo(() => ({
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    analyzed: candidates.filter(c => c.aiScore !== undefined).length,
    interviews: candidates.filter(c => ['interview_scheduled', 'interviewed'].includes(c.status)).length,
    approved: candidates.filter(c => c.status === 'approved').length,
    rejected: candidates.filter(c => c.status === 'rejected').length
  }), [candidates]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadForm.candidateName || !uploadForm.email) {
      toast.error('Please fill in candidate name and email');
      return;
    }

    setIsUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newCandidate: CVCandidate = {
      id: Date.now().toString(),
      candidateName: uploadForm.candidateName,
      position: uploadForm.position || 'Unspecified',
      email: uploadForm.email,
      phone: uploadForm.phone || 'N/A',
      uploadDate: new Date(),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      status: 'pending'
    };

    setCandidates(prev => [newCandidate, ...prev]);
    setUploadForm({ candidateName: '', position: '', email: '', phone: '' });
    setShowUploadForm(false);
    setIsUploading(false);
    toast.success(`CV uploaded for ${uploadForm.candidateName}. AI analysis will begin shortly.`);

    // Simulate AI analysis
    setTimeout(() => {
      analyzeCV(newCandidate.id);
    }, 2000);
  };

  const analyzeCV = async (candidateId: string) => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          status: 'analyzed' as const,
          aiScore: Math.floor(Math.random() * 30) + 60,
          aiRanking: prev.filter(p => p.aiScore).length + 1,
          aiAnalysis: {
            experience: '3-5 years estimated',
            education: 'Degree detected',
            skills: ['Communication', 'Sales', 'Customer Service'],
            certifications: [],
            achievements: ['Previous role achievements noted'],
            relevanceScore: Math.floor(Math.random() * 30) + 60,
            recommendation: 'Candidate shows potential. Recommend interview to assess further.'
          }
        };
      }
      return c;
    }));

    setIsAnalyzing(false);
    toast.success('AI analysis complete! Candidate has been ranked.');
  };

  const handleScheduleInterview = (candidateId: string, stage: 'first' | 'second') => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setInterviewStage(stage);
      setShowScheduler(true);
    }
  };

  const handleInterviewScheduled = (candidateId: string, date: Date, stage: 'first' | 'second') => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          status: 'interview_scheduled' as const,
          interviewStage: stage,
          ...(stage === 'first' 
            ? { firstInterviewDate: date }
            : { secondInterviewDate: date }
          )
        };
      }
      return c;
    }));
  };

  const handleUpdateStatus = (candidateId: string, status: CVCandidate['status']) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return { ...c, status };
      }
      return c;
    }));
    
    const statusMessages: Record<string, string> = {
      approved: 'Candidate approved and moved to Employees list!',
      rejected: 'Candidate rejected.',
      on_hold: 'Candidate placed on hold for future consideration.'
    };
    
    toast.success(statusMessages[status] || 'Status updated');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-[#1A1A1A]" />
            Employee Center
          </h2>
          <p className="text-muted-foreground mt-1">AI-powered recruitment & employee management</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload CV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-[#1A1A1A] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total CVs</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Brain className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.analyzed}</p>
            <p className="text-xs text-muted-foreground">AI Analyzed</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Video className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.interviews}</p>
            <p className="text-xs text-muted-foreground">Interviews</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="bg-card border-[#B89555]/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#1A1A1A]" />
              Upload New CV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Candidate Name *"
                value={uploadForm.candidateName}
                onChange={(e) => setUploadForm(prev => ({ ...prev, candidateName: e.target.value }))}
                className="bg-background border-border text-white"
              />
              <Input
                placeholder="Position Applied For"
                value={uploadForm.position}
                onChange={(e) => setUploadForm(prev => ({ ...prev, position: e.target.value }))}
                className="bg-background border-border text-white"
              />
              <Input
                placeholder="Email Address *"
                type="email"
                value={uploadForm.email}
                onChange={(e) => setUploadForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-background border-border text-white"
              />
              <Input
                placeholder="Phone Number"
                value={uploadForm.phone}
                onChange={(e) => setUploadForm(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-background border-border text-white"
              />
            </div>
            <label className="block">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-[#B89555]/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload CV, Cover Letter, or Documents
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX (Max 10MB) — AI will analyze automatically</p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            {isUploading && (
              <div className="flex items-center gap-2 text-[#1A1A1A]">
                <div className="w-4 h-4 border-2 border-[#B89555]/30 border-t-gold rounded-full animate-spin" />
                <span className="text-sm">Uploading & starting AI analysis...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <CVSearchFilters
        onSearch={setSearchTerm}
        onSortChange={setSortBy}
        onPositionFilter={setPositionFilter}
        onExperienceFilter={setExperienceFilter}
        onStatusFilter={setStatusFilter}
        positions={positions}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            All CVs ({candidates.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="interviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            Interviews ({stats.interviews})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            Approved ({stats.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            Rejected/Hold ({stats.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* AI Ranking Header */}
          {sortBy === 'ranking' && filteredCandidates.some(c => c.aiScore) && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <Brain className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">
                Showing candidates ranked by AI analysis for position relevance
              </span>
            </div>
          )}

          {/* Candidates List */}
          <div className="space-y-3">
            {filteredCandidates.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No candidates found</p>
                </CardContent>
              </Card>
            ) : (
              filteredCandidates.map((candidate, index) => (
                <CVRankingCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={sortBy === 'ranking' && candidate.aiScore ? index + 1 : undefined}
                  onView={(id) => {
                    const c = candidates.find(cand => cand.id === id);
                    if (c) {
                      setViewingCandidate(c);
                      setShowCVViewer(true);
                    }
                  }}
                  onDownload={(id) => {
                    const c = candidates.find(cand => cand.id === id);
                    if (c?.fileUrl && c.fileUrl !== '#') {
                      window.open(c.fileUrl, '_blank');
                    } else {
                      toast.error('No CV file available');
                    }
                  }}
                  onScheduleInterview={handleScheduleInterview}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Interview Scheduler Modal */}
      <InterviewScheduler
        open={showScheduler}
        onClose={() => setShowScheduler(false)}
        candidate={selectedCandidate}
        stage={interviewStage}
        onSchedule={handleInterviewScheduled}
      />

      {/* CV Viewer Modal */}
      {viewingCandidate && (
        <CVViewer
          open={showCVViewer}
          onClose={() => {
            setShowCVViewer(false);
            setViewingCandidate(null);
          }}
          candidateId={viewingCandidate.id}
          candidateName={viewingCandidate.candidateName}
          cvUrl={viewingCandidate.fileUrl !== '#' ? viewingCandidate.fileUrl : null}
          cvFileName={viewingCandidate.fileName}
          candidateData={{
            email: viewingCandidate.email,
            phone: viewingCandidate.phone,
            position: viewingCandidate.position,
            uploadDate: viewingCandidate.uploadDate,
            aiAnalysis: viewingCandidate.aiAnalysis
          }}
        />
      )}
    </div>
  );
};

export default EmployeeCenter;
