import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Crown, Star, TrendingUp, Mail, Phone, Calendar, 
  Download, Eye, Video, MessageSquare, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { format } from 'date-fns';

export interface CVCandidate {
  id: string;
  candidateName: string;
  position: string;
  email: string;
  phone: string;
  uploadDate: Date;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'analyzed' | 'interview_scheduled' | 'interviewed' | 'shortlisted' | 'approved' | 'rejected' | 'on_hold';
  aiRanking?: number;
  aiScore?: number;
  aiAnalysis?: {
    experience: string;
    education: string;
    skills: string[];
    certifications: string[];
    achievements: string[];
    relevanceScore: number;
    recommendation: string;
  };
  interviewStage?: 'first' | 'second' | 'completed';
  interviewNotes?: string;
  firstInterviewDate?: Date;
  secondInterviewDate?: Date;
}

interface CVRankingCardProps {
  candidate: CVCandidate;
  rank?: number;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onScheduleInterview: (id: string, stage: 'first' | 'second') => void;
  onUpdateStatus: (id: string, status: CVCandidate['status']) => void;
}

const CVRankingCard = ({
  candidate,
  rank,
  onView,
  onDownload,
  onScheduleInterview,
  onUpdateStatus
}: CVRankingCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600 text-white';
      case 'shortlisted': return 'bg-emerald-600 text-white';
      case 'interview_scheduled': return 'bg-blue-600 text-white';
      case 'interviewed': return 'bg-indigo-600 text-white';
      case 'analyzed': return 'bg-purple-600 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      case 'on_hold': return 'bg-orange-600 text-white';
      default: return 'bg-[#1A1A1A] text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'interview_scheduled': return 'Interview Scheduled';
      case 'on_hold': return 'On Hold';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getRankBadge = () => {
    if (!rank) return null;
    if (rank === 1) return <Crown className="h-5 w-5 text-[#1A1A1A]" />;
    if (rank === 2) return <Star className="h-5 w-5 text-[#1A1A1A]/70" />;
    if (rank === 3) return <Star className="h-5 w-5 text-[#1A1A1A]-dark" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <Card className={`bg-card border-border hover:border-[#B89555]/30 transition-all ${rank === 1 ? 'border-[#B89555]/50 bg-[#EFE6D6]/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Rank Badge */}
          {rank && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border">
              {getRankBadge()}
            </div>
          )}

          {/* Avatar */}
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
            <span className="text-xl font-bold text-[#1A1A1A]">
              {candidate.candidateName.charAt(0)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-white text-lg">{candidate.candidateName}</h4>
                <p className="text-sm text-[#1A1A1A]">{candidate.position}</p>
              </div>
              <div className="flex items-center gap-2">
                {candidate.aiScore && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full">
                    <TrendingUp className="h-3 w-3 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400">{candidate.aiScore}%</span>
                  </div>
                )}
                <Badge className={getStatusColor(candidate.status)}>
                  {getStatusLabel(candidate.status)}
                </Badge>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {candidate.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {candidate.phone}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(candidate.uploadDate, 'MMM d, yyyy')}
              </span>
            </div>

            {/* AI Analysis Summary */}
            {candidate.aiAnalysis && (
              <div className="mt-3 p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">Experience:</span>
                  <span className="text-xs text-white">{candidate.aiAnalysis.experience}</span>
                  <span className="text-xs text-muted-foreground ml-4">Education:</span>
                  <span className="text-xs text-white">{candidate.aiAnalysis.education}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {candidate.aiAnalysis.skills.slice(0, 5).map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-[#B89555]/30 text-[#1A1A1A]">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.aiAnalysis.skills.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{candidate.aiAnalysis.skills.length - 5} more</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  "{candidate.aiAnalysis.recommendation}"
                </p>
              </div>
            )}

            {/* Interview Info */}
            {candidate.interviewStage && (
              <div className="mt-3 flex items-center gap-4 text-sm">
                {candidate.firstInterviewDate && (
                  <span className="flex items-center gap-1 text-blue-400">
                    <Video className="h-3 w-3" />
                    1st Interview: {format(candidate.firstInterviewDate, 'MMM d, HH:mm')}
                  </span>
                )}
                {candidate.secondInterviewDate && (
                  <span className="flex items-center gap-1 text-purple-400">
                    <Video className="h-3 w-3" />
                    2nd Interview: {format(candidate.secondInterviewDate, 'MMM d, HH:mm')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(candidate.id)}
                className="text-[#1A1A1A] bg-[#FDFBF7] border-[#B89555]/30 hover:bg-[#F7F2EA] font-medium shadow-sm"
              >
                <Eye className="h-4 w-4 mr-1" />
                Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(candidate.id)}
                className="text-[#1A1A1A] bg-amber-100 border-amber-400 hover:bg-amber-200 font-medium shadow-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                CV
              </Button>
            </div>
            
            {/* Interview Actions */}
            {candidate.status !== 'rejected' && candidate.status !== 'approved' && (
              <div className="flex gap-2">
                {!candidate.interviewStage && candidate.status === 'analyzed' && (
                  <Button
                    size="sm"
                    onClick={() => onScheduleInterview(candidate.id, 'first')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md"
                  >
                    <Video className="h-3 w-3 mr-1" />
                    Schedule Interview
                  </Button>
                )}
                {candidate.interviewStage === 'first' && candidate.status === 'interviewed' && (
                  <Button
                    size="sm"
                    onClick={() => onScheduleInterview(candidate.id, 'second')}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md"
                  >
                    <Video className="h-3 w-3 mr-1" />
                    2nd Round Interview
                  </Button>
                )}
              </div>
            )}

            {/* Approval Actions */}
            {candidate.interviewStage === 'completed' && candidate.status !== 'approved' && candidate.status !== 'rejected' && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(candidate.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(candidate.id, 'on_hold')}
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Hold
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(candidate.id, 'rejected')}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CVRankingCard;
