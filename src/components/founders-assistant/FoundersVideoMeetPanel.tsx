import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  Copy,
  Mail,
  MessageSquare,
  CheckCircle,
  Loader2,
  Settings,
  Mic,
  MicOff,
  Camera,
  CameraOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ScheduledMeeting {
  id: string;
  title: string;
  date: Date;
  duration: number;
  participants: string[];
  meetingLink: string;
}

const FoundersVideoMeetPanel: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [participants, setParticipants] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>([]);

  const handleCreateMeeting = async () => {
    if (!meetingTitle) {
      toast.error('Please enter a meeting title');
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate meeting creation with JBJ Video Meet
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const meetingId = `jbj-${Date.now().toString(36)}`;
      const link = `${window.location.origin}/video-meeting/${meetingId}`;
      
      setGeneratedLink(link);
      
      // Add to scheduled meetings
      const newMeeting: ScheduledMeeting = {
        id: meetingId,
        title: meetingTitle,
        date: meetingDate ? new Date(`${meetingDate}T${meetingTime || '00:00'}`) : new Date(),
        duration: 60,
        participants: participants.split(',').map(p => p.trim()).filter(Boolean),
        meetingLink: link,
      };
      
      setScheduledMeetings(prev => [...prev, newMeeting]);
      
      toast.success('JBJ Video Meet link created!', {
        description: 'Link has been generated and is ready to share',
      });
    } catch (error) {
      toast.error('Failed to create meeting');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Meeting link copied to clipboard');
  };

  const handleSendInvite = (method: 'email' | 'whatsapp') => {
    const subject = encodeURIComponent(`Meeting Invitation: ${meetingTitle}`);
    const body = encodeURIComponent(`You're invited to a JBJ Video Meeting.\n\nMeeting: ${meetingTitle}\nLink: ${generatedLink}\n\nBest regards,\nJBJ Global Real Estate`);
    
    if (method === 'email') {
      window.open(`mailto:${participants}?subject=${subject}&body=${body}`);
    } else {
      const text = encodeURIComponent(`You're invited to a JBJ Video Meeting!\n\n📹 ${meetingTitle}\n🔗 ${generatedLink}`);
      window.open(`https://wa.me/?text=${text}`);
    }
    
    toast.success(`Invite sent via ${method}`);
  };

  const handleJoinMeeting = () => {
    if (generatedLink) {
      const meetingId = generatedLink.split('/').pop();
      navigate(`/video-meeting/${meetingId}`);
    }
  };

  const handleTestSetup = () => {
    navigate('/video-meeting/test');
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="bg-[#0E0E0E] border-gold/20 hover:border-gold/40 transition-all cursor-pointer group"
          onClick={() => setIsCreating(true)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-gold" />
            </div>
            <h3 className="text-white font-semibold">New Meeting</h3>
            <p className="text-sm text-gray-400 mt-1">Create instant JBJ Meet</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-[#0E0E0E] border-gold/20 hover:border-gold/40 transition-all cursor-pointer group"
          onClick={() => navigate('/video-meeting/calendar')}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold">Schedule Meeting</h3>
            <p className="text-sm text-gray-400 mt-1">Plan for later</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-[#0E0E0E] border-gold/20 hover:border-gold/40 transition-all cursor-pointer group"
          onClick={handleTestSetup}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold">Test Setup</h3>
            <p className="text-sm text-gray-400 mt-1">Check camera & mic</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Meeting Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-[#0E0E0E] border-gold/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-gold" />
                Create JBJ Video Meet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Meeting Title</Label>
                  <Input
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="e.g., Property Viewing with Mr. Ahmed"
                    className="bg-[#1A1A1A] border-gold/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Participants (emails, comma-separated)</Label>
                  <Input
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="e.g., client@email.com, colleague@jbj.ae"
                    className="bg-[#1A1A1A] border-gold/20 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Date (optional for instant meetings)</Label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="bg-[#1A1A1A] border-gold/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Time</Label>
                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="bg-[#1A1A1A] border-gold/20 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCreateMeeting}
                  disabled={isGenerating || !meetingTitle}
                  className="bg-gold hover:bg-gold/90 text-black"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Create Meeting
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  className="border-gold/20 text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
              </div>

              {/* Generated Link */}
              {generatedLink && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Meeting Created Successfully!</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="bg-[#1A1A1A] border-gold/20 text-white flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="border-gold/20 text-gold hover:bg-gold/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleJoinMeeting}
                      className="bg-gold hover:bg-gold/90 text-black"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Join Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendInvite('email')}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Invite
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendInvite('whatsapp')}
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scheduled Meetings */}
      <Card className="bg-[#0E0E0E] border-gold/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold" />
            Scheduled Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledMeetings.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-gold/30 mx-auto mb-4" />
              <p className="text-gray-400">No scheduled meetings</p>
              <p className="text-sm text-gray-500 mt-1">Create a meeting to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledMeetings.map((meeting) => (
                <Card key={meeting.id} className="bg-[#1A1A1A] border-gold/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{meeting.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {meeting.date.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {meeting.participants.length || 0} participants
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(meeting.meetingLink);
                            toast.success('Link copied');
                          }}
                          variant="outline"
                          className="border-gold/20 text-gold hover:bg-gold/10"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/video-meeting/${meeting.id}`)}
                          className="bg-gold hover:bg-gold/90 text-black"
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FoundersVideoMeetPanel;
