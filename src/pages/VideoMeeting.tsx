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
  MessageCircle,
  Hand,
  Settings,
  Volume2,
  Camera,
  Image,
  Sparkles,
  Crown,
  UserX,
  VolumeX,
  Send,
  X,
  ChevronDown,
  Brain,
  Loader2
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MeetingAIAssistant } from "@/components/video-meet/MeetingAIAssistant";
import { useChatHistoryLogger } from "@/hooks/useChatHistoryLogger";

interface RemoteParticipant extends Participant {
  stream?: MediaStream;
  handRaised?: boolean;
  isMuted?: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

const generateMeetingId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [3, 4, 3];
  return segments.map(len => 
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
};

// Virtual backgrounds
const VIRTUAL_BACKGROUNDS = [
  { id: 'none', name: 'None', color: 'transparent' },
  { id: 'blur', name: 'Blur Background', color: 'blur' },
  { id: 'office', name: 'Modern Office', color: '#1a1a2e' },
  { id: 'beach', name: 'Beach Sunset', color: '#ff6b6b' },
  { id: 'mountains', name: 'Mountains', color: '#4a90a4' },
  { id: 'jbj', name: 'JBJ Branded', color: '#A8925A' },
];

const VideoMeeting = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomIdParam = searchParams.get('room');
  const { user } = useAuth();
  
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [roomId, setRoomId] = useState(roomIdParam || '');
  const [userName, setUserName] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showMediaPrompt, setShowMediaPrompt] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [gridView, setGridView] = useState(true);
  
  // Enhanced features
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordingConsent, setShowRecordingConsent] = useState(false);
  const [brokerName, setBrokerName] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  
  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Device selection
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedSpeakerDevice, setSelectedSpeakerDevice] = useState('');
  
  // Virtual backgrounds
  const [selectedBackground, setSelectedBackground] = useState('none');
  const [beautyFilter, setBeautyFilter] = useState(false);
  const [brightnessLevel, setBrightnessLevel] = useState(100);
  
  // Host controls
  const [isHost, setIsHost] = useState(false);
  
  // AI Assistant
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [meetingContext, setMeetingContext] = useState<any>({});
  const [showMeetingEndedDialog, setShowMeetingEndedDialog] = useState(false);
  const [meetingEndedBy, setMeetingEndedBy] = useState('');
  
  // Media initialization state
  const [isMediaInitializing, setIsMediaInitializing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const { logChat } = useChatHistoryLogger();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Generate user ID
  const userId = useRef(`user_${Math.random().toString(36).substring(7)}`);

  // Enumerate available devices with proper error handling
  const enumerateDevices = useCallback(async () => {
    try {
      // First request basic permission to get device labels
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        tempStream.getTracks().forEach(track => track.stop());
      } catch (permErr) {
        console.log('Initial permission request (expected to potentially fail):', permErr);
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 4)}` }));
      const audioInputs = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 4)}` }));
      const audioOutputs = devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 4)}` }));
      
      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);
      setSpeakerDevices(audioOutputs);
      
      if (videoInputs.length && !selectedVideoDevice) setSelectedVideoDevice(videoInputs[0].deviceId);
      if (audioInputs.length && !selectedAudioDevice) setSelectedAudioDevice(audioInputs[0].deviceId);
      if (audioOutputs.length && !selectedSpeakerDevice) setSelectedSpeakerDevice(audioOutputs[0].deviceId);
      
      setMediaError(null);
    } catch (error) {
      console.error('Error enumerating devices:', error);
      setMediaError('Could not access media devices. Please ensure camera/microphone permissions are granted.');
    }
  }, [selectedVideoDevice, selectedAudioDevice, selectedSpeakerDevice]);

  useEffect(() => {
    enumerateDevices();
  }, [enumerateDevices]);

  const handleParticipantJoin = useCallback((participant: Participant) => {
    console.log('Participant joined:', participant);
    setParticipants(prev => {
      if (prev.some(p => p.oderId === participant.oderId)) return prev;
      return [...prev, { ...participant, handRaised: false, isMuted: false }];
    });
    
    // Add system message to chat
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'System',
      message: `${participant.odername} joined the meeting`,
      timestamp: new Date(),
      isSystem: true
    }]);
    
    // Play join sound
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 'AAAAAA');
    audio.volume = 0.3;
    audio.play().catch(() => {});
    
    toast.success(`${participant.odername} joined the meeting`);
  }, []);

  const handleParticipantLeave = useCallback((oderId: string) => {
    console.log('Participant left:', oderId);
    setParticipants(prev => {
      const participant = prev.find(p => p.oderId === oderId);
      if (participant) {
        setChatMessages(msgs => [...msgs, {
          id: Date.now().toString(),
          sender: 'System',
          message: `${participant.odername} left the meeting`,
          timestamp: new Date(),
          isSystem: true
        }]);
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

    setIsMediaInitializing(true);
    setMediaError(null);

    try {
      // Request media permissions explicitly first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined
        }
      });

      // Initialize WebRTC with the obtained stream
      webrtcRef.current = new WebRTCManager(
        room,
        userId.current,
        name,
        handleParticipantJoin,
        handleParticipantLeave,
        handleRemoteStream
      );

      // Initialize with stream
      await webrtcRef.current.initialize(true, true);
      
      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Enable both by default since we got permission
      setVideoEnabled(true);
      setAudioEnabled(true);

      setRoomId(room);
      setIsInMeeting(true);
      setIsHost(!existingRoom || existingRoom === room);
      
      // Update URL with room ID
      window.history.replaceState({}, '', `/video-meeting?room=${room}`);
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setMeetingDuration(prev => prev + 1);
      }, 1000);

      // Log meeting start
      logChat({
        session_id: room,
        role: 'user',
        message: `Started video meeting: ${room}`,
        source: 'video_meeting',
        user_name: name
      });

      toast.success('Joined meeting successfully! Camera and microphone enabled.');
    } catch (error: any) {
      console.error('Error starting meeting:', error);
      
      let errorMessage = 'Failed to start meeting.';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera and microphone access denied. Please allow access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'The selected camera/microphone is not available.';
      }
      
      setMediaError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsMediaInitializing(false);
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
    setChatMessages([]);
    setHandRaised(false);
    
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

  const toggleHandRaise = () => {
    setHandRaised(!handRaised);
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'System',
      message: handRaised ? `${userName || 'You'} lowered their hand` : `${userName || 'You'} raised their hand`,
      timestamp: new Date(),
      isSystem: true
    }]);
    toast.info(handRaised ? 'Hand lowered' : 'Hand raised');
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;
    
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: userName || 'You',
      message: newMessage.trim(),
      timestamp: new Date()
    }]);
    setNewMessage('');
    
    // Scroll to bottom
    setTimeout(() => {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
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
    
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'System',
      message: 'This meeting is now being recorded',
      timestamp: new Date(),
      isSystem: true
    }]);
    
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
    window.location.href = `https://wa.me/?text=${text}`;
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

  // Host controls
  const muteParticipant = (participantId: string) => {
    setParticipants(prev => prev.map(p => 
      p.oderId === participantId ? { ...p, isMuted: !p.isMuted } : p
    ));
    toast.info('Participant muted');
  };

  const removeParticipant = (participantId: string) => {
    const participant = participants.find(p => p.oderId === participantId);
    if (participant) {
      toast.success(`${participant.odername} has been removed from the meeting`);
      setParticipants(prev => prev.filter(p => p.oderId !== participantId));
    }
  };

  const muteAll = () => {
    setParticipants(prev => prev.map(p => ({ ...p, isMuted: true })));
    toast.success('All participants muted');
  };

  const endMeetingForAll = () => {
    // Show professional ending message to all participants
    setMeetingEndedBy(userName || 'Host');
    setShowMeetingEndedDialog(true);
    
    // Log the meeting end
    logChat({
      session_id: roomId,
      role: 'assistant',
      message: 'Meeting ended by host',
      source: 'video_meeting'
    });
    
    setTimeout(() => {
      setShowMeetingEndedDialog(false);
      endMeeting();
    }, 3000);
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
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">JBJ <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">Video Meet</span></h1>
              <p className="text-zinc-400">Free professional video meetings for everyone</p>
              <div className="flex items-center justify-center gap-2 mt-2 text-violet-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>End-to-end encrypted • Unlimited time</span>
              </div>
            </div>

            <div className="bg-violet-900/20 border border-violet-500/30 rounded-2xl p-6 space-y-6">
              {/* Preview */}
              <div className="relative aspect-video bg-zinc-800 rounded-xl overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                  style={{ filter: beautyFilter ? 'contrast(1.1) brightness(1.05)' : 'none' }}
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
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setShowSettings(true)}
                    className="rounded-full"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Name Input */}
              <Input
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50"
              />

              {/* Broker Name (Optional) */}
              {user && (
                <Input
                  placeholder="Your title (e.g., Senior Property Consultant)"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50"
                />
              )}

              {/* Room ID Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter meeting code"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50"
                />
                <Button 
                  onClick={() => startMeeting()} 
                  disabled={!roomId}
                  className="bg-violet-500 hover:bg-violet-600"
                >
                  Join
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-violet-500/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-violet-900/20 px-2 text-zinc-500">or</span>
                </div>
              </div>

              <Button 
                onClick={createNewMeeting}
                className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700"
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

        {/* Settings Dialog (Lobby) */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Meeting Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Camera Selection */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Camera
                </Label>
                <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {videoDevices.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="text-white">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Microphone Selection */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Microphone
                </Label>
                <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {audioDevices.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="text-white">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Speaker Selection */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> Speaker
                </Label>
                <Select value={selectedSpeakerDevice} onValueChange={setSelectedSpeakerDevice}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select speaker" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {speakerDevices.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="text-white">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Virtual Background */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Image className="w-4 h-4" /> Virtual Background
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {VIRTUAL_BACKGROUNDS.map(bg => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBackground(bg.id)}
                      className={`p-2 rounded-lg text-xs text-center border transition-all ${
                        selectedBackground === bg.id 
                          ? 'border-red-500 bg-red-500/20' 
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                      style={{ backgroundColor: bg.color !== 'transparent' && bg.color !== 'blur' ? bg.color + '30' : undefined }}
                    >
                      <span className="text-white">{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Beauty Filter */}
              <div className="flex items-center justify-between">
                <Label className="text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Beauty Filter
                </Label>
                <Switch 
                  checked={beautyFilter} 
                  onCheckedChange={setBeautyFilter}
                />
              </div>

              {/* Brightness */}
              <div className="space-y-2">
                <Label className="text-white">Brightness: {brightnessLevel}%</Label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightnessLevel}
                  onChange={(e) => setBrightnessLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
            {isHost && (
              <span className="px-2 py-0.5 text-xs bg-gold/20 text-gold rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Host
              </span>
            )}
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
            onClick={() => setShowChat(!showChat)}
            className={`${showChat ? 'text-white bg-zinc-800' : 'text-zinc-400'} hover:text-white`}
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
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
          {isHost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-700">
                <DropdownMenuItem onClick={muteAll} className="text-white hover:bg-zinc-800">
                  <VolumeX className="w-4 h-4 mr-2" /> Mute All
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem onClick={endMeetingForAll} className="text-red-400 hover:bg-zinc-800">
                  <PhoneOff className="w-4 h-4 mr-2" /> End Meeting for All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className={`${showAIAssistant ? 'text-gold bg-gold/20' : 'text-zinc-400'} hover:text-gold`}
            title="AI Assistant (Private)"
          >
            <Brain className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSupportChat(true)}
            className="text-zinc-400 hover:text-white"
            title="JBJ Support"
          >
            <MessageCircle className="w-4 h-4 text-green-500" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className={`flex-1 p-4 overflow-auto ${showChat ? 'mr-80' : ''}`}>
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
                style={{ 
                  filter: `brightness(${brightnessLevel / 100}) ${beautyFilter ? 'contrast(1.1)' : ''}`,
                }}
              />
              {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold">
                    {(userName || 'You').charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              {handRaised && (
                <div className="absolute top-4 right-4 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
                  <Hand className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="bg-black/50 px-3 py-1 rounded-lg text-white text-sm backdrop-blur-sm flex items-center gap-2">
                  {userName || 'You'} (You)
                  {isHost && <Crown className="w-3 h-3 text-gold" />}
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
                {participant.handRaised && (
                  <div className="absolute top-4 right-4 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
                    <Hand className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="bg-black/50 px-3 py-1 rounded-lg text-white text-sm backdrop-blur-sm">
                    {participant.odername}
                  </span>
                  {participant.isMuted && (
                    <div className="bg-red-500/80 p-1.5 rounded-full">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                {/* Host controls overlay */}
                {isHost && (
                  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="w-8 h-8 rounded-full"
                      onClick={() => muteParticipant(participant.oderId)}
                    >
                      {participant.isMuted ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-8 h-8 rounded-full"
                      onClick={() => removeParticipant(participant.oderId)}
                    >
                      <UserX className="w-3 h-3" />
                    </Button>
                  </div>
                )}
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

        {/* Chat Sidebar */}
        {showChat && (
          <div className="fixed right-0 top-16 bottom-24 w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-white font-semibold">Meeting Chat</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
                <X className="w-4 h-4 text-zinc-400" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
              <div className="space-y-3">
                {chatMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`${msg.isSystem ? 'text-center' : ''}`}
                  >
                    {msg.isSystem ? (
                      <span className="text-xs text-zinc-500 italic">{msg.message}</span>
                    ) : (
                      <div className="bg-zinc-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-sm font-medium">{msg.sender}</span>
                          <span className="text-zinc-500 text-xs">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-sm">{msg.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button size="icon" onClick={sendChatMessage} className="bg-red-500 hover:bg-red-600">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-4 bg-zinc-900/80 border-t border-zinc-800">
        <Button
          variant={audioEnabled ? "secondary" : "destructive"}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full w-14 h-14"
          title={audioEnabled ? 'Mute' : 'Unmute'}
        >
          {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={videoEnabled ? "secondary" : "destructive"}
          size="lg"
          onClick={toggleVideo}
          className="rounded-full w-14 h-14"
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
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
          variant={handRaised ? "default" : "secondary"}
          size="lg"
          onClick={toggleHandRaise}
          className={`rounded-full w-14 h-14 ${handRaised ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          title={handRaised ? 'Lower hand' : 'Raise hand'}
        >
          <Hand className="h-5 w-5" />
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
          variant="secondary"
          size="lg"
          onClick={() => setShowSettings(true)}
          className="rounded-full w-14 h-14"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={endMeeting}
          className="rounded-full w-14 h-14"
          title="Leave meeting"
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
                <p className="text-white font-medium flex items-center gap-2">
                  {userName || 'You'}
                  {isHost && <Crown className="w-4 h-4 text-gold" />}
                </p>
                <p className="text-zinc-400 text-sm">{isHost ? 'Host' : 'You'}</p>
              </div>
              <div className="flex gap-1">
                {audioEnabled ? <Mic className="w-4 h-4 text-zinc-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                {videoEnabled ? <Video className="w-4 h-4 text-zinc-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            
            {participants.map((p) => (
              <div key={p.oderId} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg group">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {p.odername.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium flex items-center gap-2">
                    {p.odername}
                    {p.handRaised && <Hand className="w-4 h-4 text-amber-400" />}
                  </p>
                </div>
                <div className="flex gap-1">
                  {p.isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-zinc-400" />}
                </div>
                {isHost && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => muteParticipant(p.oderId)}>
                      {p.isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-400" onClick={() => removeParticipant(p.oderId)}>
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                )}
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

      {/* Settings Dialog (In-meeting) */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Meeting Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Camera Selection */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Camera className="w-4 h-4" /> Camera
              </Label>
              <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {videoDevices.map(d => (
                    <SelectItem key={d.deviceId} value={d.deviceId} className="text-white">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Microphone Selection */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Mic className="w-4 h-4" /> Microphone
              </Label>
              <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {audioDevices.map(d => (
                    <SelectItem key={d.deviceId} value={d.deviceId} className="text-white">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speaker Selection */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Speaker
              </Label>
              <Select value={selectedSpeakerDevice} onValueChange={setSelectedSpeakerDevice}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select speaker" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {speakerDevices.map(d => (
                    <SelectItem key={d.deviceId} value={d.deviceId} className="text-white">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Virtual Background */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Image className="w-4 h-4" /> Virtual Background
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {VIRTUAL_BACKGROUNDS.map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBackground(bg.id)}
                    className={`p-2 rounded-lg text-xs text-center border transition-all ${
                      selectedBackground === bg.id 
                        ? 'border-red-500 bg-red-500/20' 
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                    style={{ backgroundColor: bg.color !== 'transparent' && bg.color !== 'blur' ? bg.color + '30' : undefined }}
                  >
                    <span className="text-white">{bg.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Beauty Filter */}
            <div className="flex items-center justify-between">
              <Label className="text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Beauty Filter
              </Label>
              <Switch 
                checked={beautyFilter} 
                onCheckedChange={setBeautyFilter}
              />
            </div>

            {/* Brightness */}
            <div className="space-y-2">
              <Label className="text-white">Brightness: {brightnessLevel}%</Label>
              <input
                type="range"
                min="50"
                max="150"
                value={brightnessLevel}
                onChange={(e) => setBrightnessLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
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
                onClick={() => window.location.href = 'https://wa.me/971565911000?text=I%20need%20help%20with%20JBJ%20Video%20Meet'}
              >
                WhatsApp
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('mailto:contact@JBJ.ae?subject=JBJ Video Meet Support', '_blank')}
              >
                Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Prompt Dialog - Shows when joining meeting */}
      <Dialog open={showMediaPrompt} onOpenChange={setShowMediaPrompt}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Privacy First
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Your camera and microphone are OFF by default for your privacy. Enable them when you're ready to participate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
              <p className="text-white text-sm mb-4 text-center">
                Click the buttons below to enable your devices:
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant={audioEnabled ? "default" : "outline"}
                  onClick={() => {
                    setAudioEnabled(true);
                    webrtcRef.current?.toggleAudio(true);
                    toast.success('Microphone enabled');
                  }}
                  className={audioEnabled ? "bg-green-600 hover:bg-green-700" : "border-zinc-600"}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {audioEnabled ? 'Mic On' : 'Enable Mic'}
                </Button>
                <Button
                  variant={videoEnabled ? "default" : "outline"}
                  onClick={() => {
                    setVideoEnabled(true);
                    webrtcRef.current?.toggleVideo(true);
                    toast.success('Camera enabled');
                  }}
                  className={videoEnabled ? "bg-green-600 hover:bg-green-700" : "border-zinc-600"}
                >
                  <Video className="w-4 h-4 mr-2" />
                  {videoEnabled ? 'Camera On' : 'Enable Camera'}
                </Button>
              </div>
            </div>
            <Button
              onClick={() => setShowMediaPrompt(false)}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              Continue to Meeting
            </Button>
          </div>
          <p className="text-zinc-500 text-xs text-center">
            End-to-end encrypted — No data shared without your permission
          </p>
        </DialogContent>
      </Dialog>

      {/* Meeting Ended Dialog */}
      <Dialog open={showMeetingEndedDialog} onOpenChange={setShowMeetingEndedDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md text-center">
          <div className="py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center mx-auto">
              <Video className="w-10 h-10 text-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Meeting Ended</h2>
              <p className="text-zinc-400">
                This meeting has been ended by {meetingEndedBy || 'the host'}.
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
              <p className="text-gold text-sm font-medium">JBJ Global Real Estate</p>
              <p className="text-zinc-500 text-xs mt-1">
                Thank you for joining our video meeting. We appreciate your time.
              </p>
            </div>
            <p className="text-zinc-500 text-sm">
              You will be redirected shortly...
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Panel */}
      <MeetingAIAssistant
        isVisible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        meetingContext={meetingContext}
        onSuggestion={(suggestion) => {
          setMeetingContext(prev => ({ ...prev, ...suggestion }));
        }}
      />
    </div>
  );
};

export default VideoMeeting;
