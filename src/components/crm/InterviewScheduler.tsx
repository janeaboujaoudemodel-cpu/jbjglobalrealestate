import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Mail, MessageSquare, Calendar as CalendarIcon, User, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import type { CVCandidate } from './CVRankingCard';

interface InterviewSchedulerProps {
  open: boolean;
  onClose: () => void;
  candidate: CVCandidate | null;
  stage: 'first' | 'second';
  onSchedule: (candidateId: string, date: Date, stage: 'first' | 'second') => void;
}

const InterviewScheduler = ({
  open,
  onClose,
  candidate,
  stage,
  onSchedule
}: InterviewSchedulerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!candidate) return null;

  const interviewer = stage === 'first' 
    ? { name: 'Jessica', title: 'HR Manager', avatar: 'J' }
    : { name: 'David Carter', title: 'Head of Recruitment / COO', avatar: 'D' };

  const handleSchedule = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    setIsSending(true);

    // Simulate sending invitations
    await new Promise(resolve => setTimeout(resolve, 1500));

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const interviewDate = new Date(selectedDate);
    interviewDate.setHours(hours, minutes, 0, 0);

    onSchedule(candidate.id, interviewDate, stage);
    
    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">Interview Scheduled!</p>
        <p className="text-sm text-muted-foreground">
          {stage === 'first' ? 'First' : 'Second'} interview with {interviewer.name} scheduled for {format(interviewDate, 'MMM d, yyyy')} at {selectedTime}.
        </p>
        <p className="text-xs text-green-400">✓ Email invitation sent</p>
        <p className="text-xs text-green-400">✓ WhatsApp notification sent</p>
        <p className="text-xs text-green-400">✓ Added to JBJ Calendar & Notes</p>
        <p className="text-xs text-green-400">✓ Task created in My Tasks</p>
        <p className="text-xs text-green-400">✓ Alert notification created</p>
      </div>
    );

    setIsSending(false);
    onClose();
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <Video className="h-6 w-6 text-gold" />
            Schedule {stage === 'first' ? 'First' : 'Second'} Interview
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left: Candidate & Interviewer Info */}
          <div className="space-y-4">
            {/* Candidate Card */}
            <Card className="bg-background/50 border-border">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Candidate</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-gold">
                      {candidate.candidateName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{candidate.candidateName}</p>
                    <p className="text-sm text-gold">{candidate.position}</p>
                    <p className="text-xs text-muted-foreground">{candidate.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interviewer Card */}
            <Card className="bg-background/50 border-border">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Interviewer</h4>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stage === 'first' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                    <span className={`text-lg font-bold ${stage === 'first' ? 'text-blue-400' : 'text-purple-400'}`}>
                      {interviewer.avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{interviewer.name}</p>
                    <p className="text-sm text-muted-foreground">{interviewer.title}</p>
                    <Badge variant="outline" className={`text-xs mt-1 ${stage === 'first' ? 'border-blue-500/30 text-blue-400' : 'border-purple-500/30 text-purple-400'}`}>
                      {stage === 'first' ? 'HR Interview' : 'Management Interview'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Preview */}
            {stage === 'second' && (
              <Card className="bg-purple-500/10 border-purple-500/30">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-purple-400 mb-2">Message to Candidate</h4>
                  <p className="text-sm text-muted-foreground italic">
                    "Congratulations! You've completed your first interview with me. Your second interview will be {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'soon'} at {selectedTime} with Mr. David Carter, our Head of Recruitment. Please confirm your attendance below."
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Interview Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or specific topics to discuss..."
                className="bg-background border-border text-white"
                rows={3}
              />
            </div>
          </div>

          {/* Right: Date & Time Selection */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Select Date
              </h4>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-lg border border-border bg-background"
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Time
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mt-4 p-3 bg-background/50 rounded-lg border border-border">
          <h4 className="text-sm font-medium text-white mb-2">Automatic Notifications</h4>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Mail className="h-3 w-3" /> Email Invitation
            </span>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <MessageSquare className="h-3 w-3" /> WhatsApp Message
            </span>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CalendarIcon className="h-3 w-3" /> JBJ Calendar Event
            </span>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Video className="h-3 w-3" /> JBJ Video Meet Link
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSchedule}
            disabled={isSending || !selectedDate}
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin mr-2" />
                Sending Invitations...
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Schedule Interview
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewScheduler;
