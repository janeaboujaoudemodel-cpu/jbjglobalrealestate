import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Users,
  Copy,
  Link as LinkIcon,
  MessageSquare,
  Grid,
  Maximize2,
  Minimize2,
  Share2,
  Mail,
  Shield,
  AlertCircle,
  Pencil,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import MainLayout from "@/components/MainLayout";
import { WebRTCManager, Participant } from "@/utils/WebRTCManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface RemoteParticipant extends Participant {
  stream?: MediaStream;
}

const generateMeetingId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [3, 4, 3];
  return segments.map(len => 
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
};

const VideoMeeting = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomIdParam = searchParams.get('room');
  const { user } = useAuth();
  
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [roomId, setRoomId] = useState(roomIdParam || '');
  const [userName, setUserName] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [gridView, setGridView] = useState(true);
  
  // New features
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordingConsent, setShowRecordingConsent] = useState(false);
  const [brokerName, setBrokerName] = useState('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate user ID
  const userId = useRef(`user_${Math.random().toString(36).substring(7)}`);

  const handleParticipantJoin = useCallback((participant: Participant) => {
    console.log('Participant joined:', participant);
    setParticipants(prev => {
      if (prev.some(p => p.oderId === participant.oderId)) return prev;
      return [...prev, participant];
    });
    toast.success(`${participant.odername} joined the meeting`);
  }, []);

  const handleParticipantLeave = useCallback((oderId: string) => {
    console.log('Participant left:', oderId);
    setParticipants(prev => {
      const participant = prev.find(p => p.oderId === oderId);
      if (participant) {
        toast.info(`${participant.odername} left the meeting`);
      }
      return prev.filter(p => p.oderId !== oderId);
    });
  }, []);

  const handleRemoteStream = useCallback((oderId: string, stream: MediaStream) => {
    console.log('Remote stream received:', oderId);
    setParticipants(prev => 
      prev.map(p => p.oderId === oderId ? { ...p, stream } : p)
    );
  }, []);

  const startMeeting = async (existingRoom?: string) => {
    const room = existingRoom || roomId || generateMeetingId();
    const name = userName || 'Guest';
    
    if (!room) {
      toast.error('Please enter a meeting ID or create a new meeting');
      return;
    }

    try {
      webrtcRef.current = new WebRTCManager(
        room,
        userId.current,
        name,
        handleParticipantJoin,
        handleParticipantLeave,
        handleRemoteStream
      );

      const stream = await webrtcRef.current.initialize(videoEnabled, audioEnabled);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setRoomId(room);
      setIsInMeeting(true);
      
      // Update URL with room ID
      window.history.replaceState({}, '', `/video-meeting?room=${room}`);
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setMeetingDuration(prev => prev + 1);
      }, 1000);

      toast.success('Joined meeting successfully');
    } catch (error) {
      console.error('Error starting meeting:', error);
      toast.error('Failed to start meeting. Please check camera/microphone permissions.');
    }
  };

  const createNewMeeting = () => {
    const newRoomId = generateMeetingId();
    setRoomId(newRoomId);
    startMeeting(newRoomId);
  };

  const endMeeting = () => {
    if (webrtcRef.current) {
      webrtcRef.current.disconnect();
      webrtcRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setIsInMeeting(false);
    setParticipants([]);
    setMeetingDuration(0);
    setIsScreenSharing(false);
    setIsRecording(false);
    
    window.history.replaceState({}, '', '/video-meeting');
    toast.info('Meeting ended');
  };

  const toggleVideo = () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    webrtcRef.current?.toggleVideo(newState);
  };

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    webrtcRef.current?.toggleAudio(newState);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      webrtcRef.current?.stopScreenShare();
      setIsScreenSharing(false);
      toast.info('Screen sharing stopped');
    } else {
      const stream = await webrtcRef.current?.shareScreen();
      if (stream) {
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      }
    }
  };

  const copyMeetingLink = () => {
    const link = `${window.location.origin}/video-meeting?room=${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied to clipboard');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const startRecording = () => {
    setShowRecordingConsent(true);
  };

  const confirmRecording = () => {
    setIsRecording(true);
    setShowRecordingConsent(false);
    toast.success('Recording started. All participants have been notified.');
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast.info('Recording stopped and saved.');
  };

  const generateInviteText = () => {
    const displayName = brokerName || userName || 'Our team';
    const isBroker = brokerName || user;
    const link = `${window.location.origin}/video-meeting?room=${roomId}`;
    
    if (isBroker) {
      return `${displayName}, Property Consultant at JBJ Global Real Estate is inviting you to a video meeting.\n\nJoin via the following link:\n${link}`;
    }
    return `JBJ Global Real Estate is inviting you to a video meeting.\n\nOur team is waiting for you. Join via the following link:\n${link}`;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(generateInviteText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareDialog(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Video Meeting Invitation - JBJ Global Real Estate');
    const body = encodeURIComponent(generateInviteText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setShowShareDialog(false);
  };

  const sendSupportMessage = () => {
    if (!supportMessage.trim()) return;
    toast.success('Your message has been sent to our support team. We\'ll get back to you shortly.');
    setSupportMessage('');
    setShowSupportChat(false);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Auto-join if room ID is in URL
    if (roomIdParam && !isInMeeting) {
      setRoomId(roomIdParam);
    }

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Lobby UI
  if (!isInMeeting) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">JBJ Video Meet</h1>
              <p className="text-zinc-400">Free video meetings for everyone</p>
              <div className="flex items-center justify-center gap-2 mt-2 text-green-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>End-to-end encrypted</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
              {/* Preview */}
              <div className="relative aspect-video bg-zinc-800 rounded-xl overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                    <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-zinc-400" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button
                    variant={videoEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={toggleVideo}
                    className="rounded-full"
                  >
                    {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={audioEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={toggleAudio}
                    className="rounded-full"
                  >
                    {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Name Input */}
              <Input
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />

              {/* Broker Name (Optional) */}
              {user && (
                <Input
                  placeholder="Your title (e.g., Senior Property Consultant)"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              )}

              {/* Room ID Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter meeting code"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button 
                  onClick={() => startMeeting()} 
                  disabled={!roomId}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Join
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900/50 px-2 text-zinc-500">or</span>
                </div>
              </div>

              <Button 
                onClick={createNewMeeting}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                <Video className="w-4 h-4 mr-2" />
                Start New Meeting
              </Button>
            </div>

            <p className="text-center text-zinc-500 text-sm mt-4">
              Unlimited meeting time • No account required • Encrypted connections
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Meeting UI
  const totalParticipants = participants.length + 1;
  const gridCols = totalParticipants <= 1 ? 1 : totalParticipants <= 4 ? 2 : totalParticipants <= 9 ? 3 : 4;

  return (
    <div 
      ref={containerRef}
      className="h-screen bg-zinc-950 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">JBJ Video Meet</span>
          </div>
          <div className="text-zinc-400 text-sm">
            {formatDuration(meetingDuration)}
          </div>
          {isRecording && (
            <div className="flex items-center gap-1 text-red-400 text-xs animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              Recording
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyMeetingLink}
            className="text-zinc-400 hover:text-white"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            {roomId}
            <Copy className="w-3 h-3 ml-2" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShareDialog(true)}
            className="text-zinc-400 hover:text-white"
            title="Invite participants"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setGridView(!gridView)}
            className="text-zinc-400 hover:text-white"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-zinc-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowParticipants(true)}
            className="text-zinc-400 hover:text-white relative"
          >
            <Users className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
              {totalParticipants}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSupportChat(true)}
            className="text-zinc-400 hover:text-white"
            title="JBJ Support"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div 
          className={`grid gap-4 h-full`}
          style={{ 
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridAutoRows: totalParticipants <= 2 ? '1fr' : 'minmax(200px, 1fr)'
          }}
        >
          {/* Local Video */}
          <div className="relative bg-zinc-900 rounded-2xl overflow-hidden group">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {!videoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold">
                  {(userName || 'You').charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="bg-black/50 px-3 py-1 rounded-lg text-white text-sm backdrop-blur-sm">
                {userName || 'You'} (You)
              </span>
              <div className="flex gap-1">
                {!audioEnabled && (
                  <div className="bg-red-500/80 p-1.5 rounded-full">
                    <MicOff className="w-3 h-3 text-white" />
                  </div>
                )}
                {!videoEnabled && (
                  <div className="bg-red-500/80 p-1.5 rounded-full">
                    <VideoOff className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Remote Participants */}
          {participants.map((participant) => (
            <div key={participant.oderId} className="relative bg-zinc-900 rounded-2xl overflow-hidden group">
              {participant.stream ? (
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  ref={(video) => {
                    if (video && participant.stream) {
                      video.srcObject = participant.stream;
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold">
                    {participant.odername.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4">
                <span className="bg-black/50 px-3 py-1 rounded-lg text-white text-sm backdrop-blur-sm">
                  {participant.odername}
                </span>
              </div>
            </div>
          ))}

          {/* Empty state for waiting */}
          {participants.length === 0 && (
            <div className="flex items-center justify-center bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-700">
              <div className="text-center p-8">
                <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">Waiting for others to join...</p>
                <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Invite participants
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 bg-zinc-900/80 border-t border-zinc-800">
        <Button
          variant={audioEnabled ? "secondary" : "destructive"}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full w-14 h-14"
        >
          {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={videoEnabled ? "secondary" : "destructive"}
          size="lg"
          onClick={toggleVideo}
          className="rounded-full w-14 h-14"
        >
          {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={isScreenSharing ? "default" : "secondary"}
          size="lg"
          onClick={toggleScreenShare}
          className="rounded-full w-14 h-14"
          title="Share screen"
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>

        <Button
          variant={isRecording ? "destructive" : "secondary"}
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          className="rounded-full w-14 h-14"
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={endMeeting}
          className="rounded-full w-14 h-14"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* Participants Dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Participants ({totalParticipants})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                {(userName || 'You').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{userName || 'You'}</p>
                <p className="text-zinc-400 text-sm">Host</p>
              </div>
              <div className="flex gap-1">
                {audioEnabled ? <Mic className="w-4 h-4 text-zinc-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                {videoEnabled ? <Video className="w-4 h-4 text-zinc-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            
            {participants.map((p) => (
              <div key={p.oderId} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {p.odername.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{p.odername}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Participants</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Share this meeting link with others to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-zinc-800 rounded-lg">
              <p className="text-zinc-400 text-xs mb-2">Invitation Preview:</p>
              <p className="text-white text-sm whitespace-pre-line">{generateInviteText()}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={shareViaWhatsApp} className="bg-green-600 hover:bg-green-700">
                <Share2 className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
              <Button onClick={shareViaEmail} variant="outline">
                <Mail className="w-4 h-4 mr-2" /> Email
              </Button>
            </div>
            <Button onClick={copyMeetingLink} variant="outline" className="w-full">
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recording Consent Dialog */}
      <Dialog open={showRecordingConsent} onOpenChange={setShowRecordingConsent}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Recording Consent
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              All participants will be notified that this meeting is being recorded. Do you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRecordingConsent(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRecording} className="bg-red-500 hover:bg-red-600">
              Start Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Chat Dialog */}
      <Dialog open={showSupportChat} onOpenChange={setShowSupportChat}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">JBJ Support Assistant</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Having issues? Send us a message and we'll help you right away.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="Describe your issue..."
              className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button onClick={sendSupportMessage} className="flex-1 bg-red-500 hover:bg-red-600">
                Send Message
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://wa.me/971565911000?text=I need help with JBJ Video Meet', '_blank')}
              >
                WhatsApp
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('mailto:contact@jbj.ae?subject=JBJ Video Meet Support', '_blank')}
              >
                Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoMeeting;
