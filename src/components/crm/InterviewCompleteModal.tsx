import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Video,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  MessageSquare,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import type { CVCandidate } from './CVRankingCard';

interface InterviewCompleteModalProps {
  open: boolean;
  onClose: () => void;
  candidate: CVCandidate | null;
  stage: 'first' | 'second';
  onComplete: (candidateId: string, stage: 'first' | 'second', notes: string, decision: 'approve' | 'reject' | 'hold') => void;
  onScheduleSecond?: (candidateId: string) => void;
}

const InterviewCompleteModal = ({
  open,
  onClose,
  candidate,
  stage,
  onComplete,
  onScheduleSecond,
}: InterviewCompleteModalProps) => {
  const [decision, setDecision] = useState<'approve' | 'reject' | 'hold'>('approve');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!candidate) return null;

  const interviewer = stage === 'first'
    ? { name: 'Jessica', title: 'HR Manager', avatar: 'J', color: 'blue' }
    : { name: 'David Carter', title: 'Head of Recruitment / COO', avatar: 'D', color: 'purple' };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    onComplete(candidate.id, stage, notes, decision);

    if (stage === 'first' && decision === 'approve') {
      // Show congratulations message for first interview pass
      toast.success(
        <div className="space-y-2">
          <p className="font-semibold">✅ First Interview Passed!</p>
          <p className="text-sm text-muted-foreground">
            {candidate.candidateName} has been approved for the second round.
          </p>
          <div className="text-xs text-purple-400 mt-2 p-2 bg-purple-500/10 rounded">
            <p className="font-medium">📧 Automatic Message Sent:</p>
            <p className="italic mt-1">
              "Congratulations! You've completed your first interview. Your second interview will be with Mr. David Carter, our Head of Recruitment."
            </p>
          </div>
        </div>,
        { duration: 8000 }
      );

      // Prompt to schedule second interview
      if (onScheduleSecond) {
        setTimeout(() => {
          onScheduleSecond(candidate.id);
        }, 500);
      }
    } else if (stage === 'second') {
      const messages: Record<string, string> = {
        approve: `🎉 ${candidate.candidateName} has been approved and added to the Employees list!`,
        reject: `${candidate.candidateName} has been rejected.`,
        hold: `${candidate.candidateName} has been placed on hold for future consideration.`,
      };
      toast.success(messages[decision]);
    }

    setIsSubmitting(false);
    setNotes('');
    setDecision('approve');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <Video className={`h-6 w-6 ${stage === 'first' ? 'text-blue-400' : 'text-purple-400'}`} />
            Complete {stage === 'first' ? 'First' : 'Second'} Interview
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record your decision and notes for {candidate.candidateName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Candidate Info */}
          <Card className="bg-background/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#1A1A1A]">
                    {candidate.candidateName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-white">{candidate.candidateName}</p>
                  <p className="text-sm text-[#1A1A1A]">{candidate.position}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interviewer */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Interviewer: <span className="text-white font-medium">{interviewer.name}</span> ({interviewer.title})</span>
          </div>

          {/* Decision */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Decision</Label>
            <RadioGroup value={decision} onValueChange={(v) => setDecision(v as 'approve' | 'reject' | 'hold')}>
              <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                decision === 'approve' ? 'bg-green-500/10 border-green-500/50' : 'bg-background/50 border-border hover:border-green-500/30'
              }`}>
                <RadioGroupItem value="approve" id="approve" />
                <Label htmlFor="approve" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Approve</p>
                    <p className="text-xs text-muted-foreground">
                      {stage === 'first' ? 'Move to second interview with David Carter' : 'Add to Employees list'}
                    </p>
                  </div>
                </Label>
              </div>

              <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                decision === 'hold' ? 'bg-orange-500/10 border-orange-500/50' : 'bg-background/50 border-border hover:border-orange-500/30'
              }`}>
                <RadioGroupItem value="hold" id="hold" />
                <Label htmlFor="hold" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-white font-medium">Hold</p>
                    <p className="text-xs text-muted-foreground">Keep for future consideration</p>
                  </div>
                </Label>
              </div>

              <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                decision === 'reject' ? 'bg-red-500/10 border-red-500/50' : 'bg-background/50 border-border hover:border-red-500/30'
              }`}>
                <RadioGroupItem value="reject" id="reject" />
                <Label htmlFor="reject" className="flex items-center gap-2 cursor-pointer flex-1">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-white font-medium">Reject</p>
                    <p className="text-xs text-muted-foreground">Move to rejected candidates list</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-white font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#1A1A1A]" />
              Interview Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your observations, feedback, and comments about this interview..."
              className="bg-background border-border text-white min-h-[100px]"
            />
          </div>

          {/* Auto-notification preview for approve */}
          {stage === 'first' && decision === 'approve' && (
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-purple-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-purple-400 font-medium">Automatic Message Will Be Sent:</p>
                    <p className="text-muted-foreground text-xs mt-1 italic">
                      "Congratulations! You've completed your first interview with me. Your second interview will be tomorrow at 12:00 PM with Mr. David Carter, our Head of Recruitment. Please confirm your attendance."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="text-white border-border hover:bg-muted">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`font-semibold ${
              decision === 'approve' ? 'bg-green-600 hover:bg-green-700' :
              decision === 'reject' ? 'bg-red-600 hover:bg-red-700' :
              'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                {decision === 'approve' && <CheckCircle className="h-4 w-4 mr-2" />}
                {decision === 'reject' && <XCircle className="h-4 w-4 mr-2" />}
                {decision === 'hold' && <Clock className="h-4 w-4 mr-2" />}
                Confirm Decision
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewCompleteModal;
