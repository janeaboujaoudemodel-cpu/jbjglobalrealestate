import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  FileText,
  Download,
  Brain,
  Star,
  GraduationCap,
  Briefcase,
  Award,
  Video,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import type { CVCandidate } from './CVRankingCard';

interface CVDetailModalProps {
  open: boolean;
  onClose: () => void;
  candidate: CVCandidate | null;
  onScheduleInterview: (id: string, stage: 'first' | 'second') => void;
  onUpdateStatus: (id: string, status: CVCandidate['status']) => void;
  onAddNotes: (id: string, notes: string) => void;
}

const CVDetailModal = ({
  open,
  onClose,
  candidate,
  onScheduleInterview,
  onUpdateStatus,
  onAddNotes,
}: CVDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!candidate) return null;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onAddNotes(candidate.id, notes);
    setIsSaving(false);
    setNotes('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600';
      case 'shortlisted': return 'bg-emerald-600';
      case 'interview_scheduled': return 'bg-blue-600';
      case 'interviewed': return 'bg-indigo-600';
      case 'analyzed': return 'bg-purple-600';
      case 'rejected': return 'bg-red-600';
      case 'on_hold': return 'bg-orange-600';
      default: return 'bg-[#1A1A1A]';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4 text-white">
            <div className="w-14 h-14 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#1A1A1A]">
                {candidate.candidateName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{candidate.candidateName}</h2>
              <p className="text-sm text-[#1A1A1A] font-medium">{candidate.position}</p>
            </div>
            <Badge className={`ml-auto ${getStatusColor(candidate.status)} text-white`}>
              {candidate.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-muted/50 w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Contact Info */}
            <Card className="bg-background/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-[#1A1A1A]" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${candidate.email}`} className="text-[#1A1A1A] hover:underline">
                    {candidate.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${candidate.phone}`} className="text-white hover:text-[#1A1A1A]">
                    {candidate.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Applied: {format(candidate.uploadDate, 'MMMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* AI Score Card */}
            {candidate.aiScore && (
              <Card className="bg-purple-500/10 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">AI Score</p>
                        <p className="text-2xl font-bold text-purple-400">{candidate.aiScore}%</p>
                      </div>
                    </div>
                    {candidate.aiRanking && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Position Rank</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">#{candidate.aiRanking}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {candidate.status === 'analyzed' && (
                <Button
                  onClick={() => onScheduleInterview(candidate.id, 'first')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Schedule 1st Interview
                </Button>
              )}
              {candidate.interviewStage === 'first' && candidate.status === 'interviewed' && (
                <Button
                  onClick={() => onScheduleInterview(candidate.id, 'second')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Schedule 2nd Interview
                </Button>
              )}
              {candidate.interviewStage === 'completed' && !['approved', 'rejected'].includes(candidate.status) && (
                <>
                  <Button
                    onClick={() => onUpdateStatus(candidate.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onUpdateStatus(candidate.id, 'on_hold')}
                    className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Hold
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onUpdateStatus(candidate.id, 'rejected')}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
            </div>

            {/* Notes Section */}
            <Card className="bg-background/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#1A1A1A]" />
                  Add Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add interview notes, observations, or comments..."
                  className="bg-background border-border text-white min-h-[100px]"
                />
                <Button
                  variant="primary"
                  onClick={handleSaveNotes}
                  disabled={!notes.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="ai-analysis" className="mt-4 space-y-4">
            {candidate.aiAnalysis ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-background/50 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#1A1A1A]" />
                        Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white">{candidate.aiAnalysis.experience}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/50 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-[#1A1A1A]" />
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white">{candidate.aiAnalysis.education}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-background/50 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-[#1A1A1A]" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {candidate.aiAnalysis.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="border-[#B89555]/30 text-[#1A1A1A]">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {candidate.aiAnalysis.certifications.length > 0 && (
                  <Card className="bg-background/50 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#1A1A1A]" />
                        Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {candidate.aiAnalysis.certifications.map((cert, idx) => (
                          <Badge key={idx} className="bg-green-600/20 text-green-400 border-green-500/30">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-purple-500/10 border-purple-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white italic">"{candidate.aiAnalysis.recommendation}"</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-background/50 border-border">
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">AI analysis pending...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analysis will be available once the CV is processed.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Interviews Tab */}
          <TabsContent value="interviews" className="mt-4 space-y-4">
            {/* First Interview */}
            <Card className={`bg-background/50 border-border ${candidate.firstInterviewDate ? 'border-blue-500/30' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-400" />
                  First Interview - Jessica (HR Manager)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.firstInterviewDate ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-white">
                        {format(candidate.firstInterviewDate, 'EEEE, MMMM d, yyyy')} at {format(candidate.firstInterviewDate, 'HH:mm')}
                      </span>
                    </div>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                      {candidate.status === 'interviewed' || candidate.interviewStage === 'completed' ? 'Completed' : 'Scheduled'}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Not scheduled yet</p>
                )}
              </CardContent>
            </Card>

            {/* Second Interview */}
            <Card className={`bg-background/50 border-border ${candidate.secondInterviewDate ? 'border-purple-500/30' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Video className="h-4 w-4 text-purple-400" />
                  Second Interview - David Carter (Head of Recruitment)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.secondInterviewDate ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-white">
                        {format(candidate.secondInterviewDate, 'EEEE, MMMM d, yyyy')} at {format(candidate.secondInterviewDate, 'HH:mm')}
                      </span>
                    </div>
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                      {candidate.interviewStage === 'completed' ? 'Completed' : 'Scheduled'}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {candidate.firstInterviewDate ? 'Pending first interview completion' : 'Requires first interview'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Interview Notes */}
            {candidate.interviewNotes && (
              <Card className="bg-background/50 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#1A1A1A]" />
                    Interview Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white whitespace-pre-wrap">{candidate.interviewNotes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4 space-y-4">
            <Card className="bg-background/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{candidate.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {format(candidate.uploadDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#1A1A1A] border-[#B89555]/30 hover:bg-[#EFE6D6]/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              🔒 All documents are encrypted and stored securely. Access is restricted to authorized personnel only.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CVDetailModal;
