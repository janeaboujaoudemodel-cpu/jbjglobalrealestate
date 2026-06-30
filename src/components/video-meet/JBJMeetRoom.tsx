import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Settings,
  Users,
  MessageSquare,
  Sparkles,
  Camera,
  Volume2,
  VolumeX,
  Maximize2,
  Grid3X3,
  LayoutGrid,
  Image,
  Shirt,
  Eye,
  FlipHorizontal,
  Wand2,
  X,
  Check,
  Lock,
  User,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AIBackgroundGenerator from './AIBackgroundGenerator';
import BeautyFiltersPanel from './BeautyFiltersPanel';

interface Participant {
  id: string;
  name: string;
  photo?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isHost: boolean;
  isSpeaking: boolean;
}

interface JBJMeetRoomProps {
  roomCode: string;
  roomType: 'meeting-room' | 'video-call';
  userName: string;
  userPhoto?: string;
  isHost?: boolean;
  onLeave: () => void;
}

const INITIAL_BEAUTY_SETTINGS = {
  enabled: false,
  skinSmoothing: 0,
  brightness: 0,
  contrast: 0,
  warmth: 0,
  faceSlimming: 0,
  eyeEnlargement: 0,
  contour: 0,
  lipColor: 'none',
  blush: 0,
  makeupPreset: 'none',
  hairColor: 'none',
};

export const JBJMeetRoom: React.FC<JBJMeetRoomProps> = ({
  roomCode,
  roomType,
  userName,
  userPhoto,
  isHost = false,
  onLeave,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [is4KEnabled, setIs4KEnabled] = useState(true);
  const [isCameraFlipped, setIsCameraFlipped] = useState(false);
  const [isCameraTracking, setIsCameraTracking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const [showBeautyFilters, setShowBeautyFilters] = useState(false);
  const [showOutfitChanger, setShowOutfitChanger] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('none');
  const [beautySettings, setBeautySettings] = useState(INITIAL_BEAUTY_SETTINGS);
  const [outfitPrompt, setOutfitPrompt] = useState('');
  const [currentOutfit, setCurrentOutfit] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'speaker'>('grid');
  const [meetingDuration, setMeetingDuration] = useState(0);

  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: userName, photo: userPhoto, isMuted: true, isVideoOff: true, isHost, isSpeaking: false },
  ]);

  // Meeting timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      if (isVideoOn && videoRef.current) {
        try {
          const constraints: MediaStreamConstraints = {
            video: is4KEnabled 
              ? { width: { ideal: 3840 }, height: { ideal: 2160 } }
              : { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: !isMuted,
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          videoRef.current.srcObject = stream;
        } catch (error) {
          console.error('Camera error:', error);
          toast.error('Could not access camera');
        }
      }
    };

    initCamera();
  }, [isVideoOn, is4KEnabled, isMuted]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    setParticipants(prev => prev.map(p => 
      p.id === '1' ? { ...p, isVideoOff: isVideoOn } : p
    ));
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setParticipants(prev => prev.map(p => 
      p.id === '1' ? { ...p, isMuted: !isMuted } : p
    ));
  };

  const handleShareScreen = async () => {
    try {
      if (!isScreenSharing) {
        await navigator.mediaDevices.getDisplayMedia({ video: true });
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      } else {
        setIsScreenSharing(false);
        toast.info('Screen sharing stopped');
      }
    } catch (error) {
      toast.error('Could not share screen');
    }
  };

  const handleSelectBackground = (bgId: string, customUrl?: string) => {
    setSelectedBackground(bgId);
    toast.success('Background updated');
  };

  const handleGenerateOutfit = async () => {
    if (!outfitPrompt.trim()) {
      toast.error('Please describe your desired outfit');
      return;
    }
    
    toast.loading('Generating outfit...');
    
    // Simulate AI outfit generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentOutfit(outfitPrompt);
    toast.dismiss();
    toast.success('Outfit applied successfully!');
    setShowOutfitChanger(false);
  };

  const handleLeave = () => {
    if (isHost) {
      toast.info('Ending meeting for all participants...');
    }
    onLeave();
  };

  // Render meeting room table view for board meetings
  const renderMeetingRoomView = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Meeting Table */}
      <div className="relative">
        <div className="w-[600px] h-[300px] bg-gradient-to-b from-[#2a2018] to-[#1a1410] rounded-[100px] border-4 border-[#B89555]/30 shadow-2xl">
          <div className="absolute inset-4 bg-gradient-to-b from-[#3a3020] to-[#2a2018] rounded-[80px] flex items-center justify-center">
            <span className="text-[#1A1A1A]/70 text-2xl font-bold tracking-widest">JBJ GLOBAL</span>
          </div>
        </div>

        {/* Participants around table */}
        <div className="absolute inset-0">
          {participants.map((participant, index) => {
            const angle = (index * (360 / Math.max(participants.length, 4))) - 90;
            const radiusX = 350;
            const radiusY = 200;
            const x = radiusX * Math.cos((angle * Math.PI) / 180);
            const y = radiusY * Math.sin((angle * Math.PI) / 180);

            return (
              <motion.div
                key={participant.id}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}px - 40px)`,
                  top: `calc(50% + ${y}px - 40px)`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`relative w-20 h-20 rounded-full border-3 ${
 participant.isSpeaking 
 ? 'border-[color:var(--emerald-1)]/30 shadow-lg shadow-green-400/50' 
 : 'border-[#B89555]/50'
 } bg-[#1A1A1A] overflow-hidden`}>
                  {participant.photo ? (
                    <img 
                      src={participant.photo} 
                      alt={participant.name}
                      className="w-full h-full object-cover"
                     loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white/90" />
                    </div>
                  )}
                  
                  {/* Status indicators */}
                  {participant.isMuted && (
                    <div className="absolute bottom-0 left-0 bg-red-500 rounded-full p-1">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {participant.isVideoOff && (
                    <div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-1">
                      <VideoOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {participant.isHost && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-[#EFE6D6] rounded-full px-2 py-0.5">
                      <span className="text-[8px] text-[#1A1A1A] font-bold">HOST</span>
                    </div>
                  )}
                </div>
                <p className="text-center text-xs text-white mt-1 truncate max-w-20">
                  {participant.name}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Render video call grid view
  const renderVideoCallView = () => (
    <div className={`w-full h-full grid gap-2 p-4 ${
 participants.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
 participants.length <= 4 ? 'grid-cols-2' :
 participants.length <= 9 ? 'grid-cols-3' :
 'grid-cols-4'
 }`}>
      {participants.map((participant) => (
        <div
          key={participant.id}
          className={`relative rounded-xl overflow-hidden bg-[#FDFBF7] border ${
 participant.isSpeaking 
 ? 'border-[color:var(--emerald-1)]/30 shadow-lg shadow-green-400/30' 
 : 'border-[#1A1A1A]'
 }`}
        >
          {!participant.isVideoOff ? (
            <video
              ref={participant.id === '1' ? videoRef : undefined}
              autoPlay
              muted={participant.id === '1'}
              playsInline
              className={`w-full h-full object-cover ${isCameraFlipped ? 'scale-x-[-1]' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1A1A1A]">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[#B89555]/30">
                {participant.photo ? (
                  <img 
                    src={participant.photo} 
                    alt={participant.name}
                    className="w-full h-full object-cover"
                   loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1A1A1A]">
                    <User className="w-10 h-10 text-white/90" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Name tag */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <Badge className="bg-[#1A1A1A]/60 text-white">
              {participant.name}
              {participant.isHost && <span className="ml-1 text-[#1A1A1A]">• Host</span>}
            </Badge>
            {participant.isMuted && (
              <div className="bg-red-500/80 rounded-full p-1">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Current outfit indicator */}
          {participant.id === '1' && currentOutfit && (
            <Badge className="absolute top-2 left-2 bg-purple-500/80 text-white">
              <Shirt className="w-3 h-3 mr-1" />
              AI Outfit Active
            </Badge>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#1A1A1A] flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FDFBF7] border-b border-[#1A1A1A]">
        <div className="flex items-center gap-4">
          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
            LIVE
          </Badge>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/70" />
            <span className="text-white font-mono">{formatDuration(meetingDuration)}</span>
          </div>
          <Badge variant="outline" className="border-[#1A1A1A] text-white/70">
            <Lock className="w-3 h-3 mr-1" />
            {roomCode}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {is4KEnabled && (
            <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border border-[#B89555]/30">4K</Badge>
          )}
          <Badge variant="outline" className="border-[#1A1A1A] text-white/70">
            <Users className="w-3 h-3 mr-1" />
            {participants.length}
          </Badge>
          
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[#1A1A1A]">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-[#1A1A1A]' : ''}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode('speaker')}
              className={viewMode === 'speaker' ? 'bg-[#1A1A1A]' : ''}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        {roomType === 'meeting-room' ? renderMeetingRoomView() : renderVideoCallView()}

        {/* Side panels */}
        <AnimatePresence>
          {showBackgroundPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-4"
            >
              <AIBackgroundGenerator
                selectedBackground={selectedBackground}
                onSelectBackground={handleSelectBackground}
                onClose={() => setShowBackgroundPanel(false)}
              />
            </motion.div>
          )}

          {showBeautyFilters && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-4"
            >
              <BeautyFiltersPanel
                settings={beautySettings}
                onChange={setBeautySettings}
                onClose={() => setShowBeautyFilters(false)}
                isOwnerOrBroker={isHost}
              />
            </motion.div>
          )}

          {showOutfitChanger && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-4"
            >
              <Card className="bg-[#FDFBF7] border-[#1A1A1A] w-96">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Shirt className="w-5 h-5 text-[#1A1A1A]" />
                      AI Outfit Changer
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowOutfitChanger(false)}
                      className="h-8 w-8 text-white/70 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-white/85 text-sm mb-2 block">
                      Describe your desired outfit
                    </Label>
                    <textarea
                      value={outfitPrompt}
                      onChange={(e) => setOutfitPrompt(e.target.value)}
                      placeholder="e.g., Navy blue business suit with gold tie and pocket square..."
                      className="w-full h-24 bg-[#1A1A1A] border-[#1A1A1A] text-white rounded-lg p-3 text-sm resize-none"
                    />
                  </div>

                  {currentOutfit && (
                    <div className="p-3 jj-surface-emerald-soft border border-[color:var(--emerald-1)]/30/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        <span>Current outfit: {currentOutfit}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerateOutfit}
                    disabled={!outfitPrompt.trim()}
                    className="w-full bg-gradient-to-r from-gold to-gold/80 text-[#1A1A1A] font-semibold hover:from-gold/90 hover:to-gold/70"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Outfit
                  </Button>

                  {currentOutfit && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentOutfit(null);
                        toast.info('Outfit removed');
                      }}
                      className="w-full border-[#1A1A1A] text-white/70"
                    >
                      Remove Current Outfit
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-4 px-4 py-4 bg-[#FDFBF7] border-t border-[#1A1A1A]">
        {/* Mic */}
        <Button
          size="lg"
          variant={isMuted ? 'destructive' : 'outline'}
          onClick={toggleMute}
          className={`rounded-full w-14 h-14 ${!isMuted ? 'bg-[#1A1A1A] hover:bg-[#1A1A1A] border-none' : ''}`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        {/* Video */}
        <Button
          size="lg"
          variant={!isVideoOn ? 'destructive' : 'outline'}
          onClick={toggleVideo}
          className={`rounded-full w-14 h-14 ${isVideoOn ? 'bg-[#1A1A1A] hover:bg-[#1A1A1A] border-none' : ''}`}
        >
          {!isVideoOn ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>

        {/* Screen share */}
        <Button
          size="lg"
          variant="outline"
          onClick={handleShareScreen}
          className={`rounded-full w-14 h-14 ${isScreenSharing ? 'jj-surface-emerald hover:jj-surface-emerald border-none' : 'bg-[#1A1A1A] hover:bg-[#1A1A1A] border-none'}`}
        >
          <Monitor className="w-6 h-6" />
        </Button>

        {/* Camera flip */}
        <Button
          size="lg"
          variant="outline"
          onClick={() => setIsCameraFlipped(!isCameraFlipped)}
          className="rounded-full w-14 h-14 bg-[#1A1A1A] hover:bg-[#1A1A1A] border-none"
        >
          <FlipHorizontal className="w-6 h-6" />
        </Button>

        {/* Camera tracking */}
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setIsCameraTracking(!isCameraTracking);
            toast.success(isCameraTracking ? 'Camera tracking off' : 'Camera tracking on');
          }}
          className={`rounded-full w-14 h-14 ${isCameraTracking ? 'bg-[#EFE6D6] hover:bg-[#EFE6D6]/90' : 'bg-[#1A1A1A] hover:bg-[#1A1A1A]'} border-none`}
        >
          <Eye className={`w-6 h-6 ${isCameraTracking ? 'text-[#1A1A1A]' : ''}`} />
        </Button>

        <div className="w-px h-10 bg-[#1A1A1A] mx-2" />

        {/* Background */}
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setShowBackgroundPanel(!showBackgroundPanel);
            setShowBeautyFilters(false);
            setShowOutfitChanger(false);
          }}
          className={`rounded-full w-14 h-14 ${showBackgroundPanel ? 'bg-[#EFE6D6] hover:bg-[#EFE6D6]/90' : 'bg-[#1A1A1A] hover:bg-[#1A1A1A]'} border-none`}
        >
          <Image className={`w-6 h-6 ${showBackgroundPanel ? 'text-[#1A1A1A]' : ''}`} />
        </Button>

        {/* Beauty filters */}
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setShowBeautyFilters(!showBeautyFilters);
            setShowBackgroundPanel(false);
            setShowOutfitChanger(false);
          }}
          className={`rounded-full w-14 h-14 ${showBeautyFilters ? 'bg-[#EFE6D6] hover:bg-[#EFE6D6]/90' : 'bg-[#1A1A1A] hover:bg-[#1A1A1A]'} border-none`}
        >
          <Sparkles className={`w-6 h-6 ${showBeautyFilters ? 'text-[#1A1A1A]' : ''}`} />
        </Button>

        {/* Outfit changer */}
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setShowOutfitChanger(!showOutfitChanger);
            setShowBackgroundPanel(false);
            setShowBeautyFilters(false);
          }}
          className={`rounded-full w-14 h-14 ${showOutfitChanger ? 'bg-[#EFE6D6] hover:bg-[#EFE6D6]/90' : 'bg-[#1A1A1A] hover:bg-[#1A1A1A]'} border-none`}
        >
          <Shirt className={`w-6 h-6 ${showOutfitChanger ? 'text-[#1A1A1A]' : ''}`} />
        </Button>

        <div className="w-px h-10 bg-[#1A1A1A] mx-2" />

        {/* Participants */}
        <Button
          size="lg"
          variant="outline"
          onClick={() => setShowParticipants(!showParticipants)}
          className="rounded-full w-14 h-14 bg-[#1A1A1A] hover:bg-[#1A1A1A] border-none"
        >
          <Users className="w-6 h-6" />
        </Button>

        {/* Chat */}
        <Button
          size="lg"
          variant="outline"
          onClick={() => setShowChat(!showChat)}
          className="rounded-full w-14 h-14 bg-[#1A1A1A] hover:bg-[#1A1A1A] border-none"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        {/* Settings */}
        <Button
          size="lg"
          variant="outline"
          onClick={() => setShowSettings(true)}
          className="rounded-full w-14 h-14 bg-[#1A1A1A] hover:bg-[#1A1A1A] border-none"
        >
          <Settings className="w-6 h-6" />
        </Button>

        <div className="w-px h-10 bg-[#1A1A1A] mx-2" />

        {/* Leave */}
        <Button
          size="lg"
          variant="destructive"
          onClick={handleLeave}
          className="rounded-full px-6 h-14"
        >
          <PhoneOff className="w-6 h-6 mr-2" />
          Leave
        </Button>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#1A1A1A]" />
              Meeting Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 4K Video */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">4K Video Quality</Label>
                <p className="text-xs text-white/70">High resolution camera output</p>
              </div>
              <Switch
                checked={is4KEnabled}
                onCheckedChange={setIs4KEnabled}
              />
            </div>

            {/* Camera Tracking */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Camera Tracking</Label>
                <p className="text-xs text-white/70">Auto-follow as you move</p>
              </div>
              <Switch
                checked={isCameraTracking}
                onCheckedChange={setIsCameraTracking}
              />
            </div>

            {/* Speaker */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Speaker Output</Label>
                <p className="text-xs text-white/70">High-quality audio playback</p>
              </div>
              <Switch
                checked={isSpeakerOn}
                onCheckedChange={setIsSpeakerOn}
              />
            </div>

            {/* Microphone Quality */}
            <div>
              <Label className="text-white mb-2 block">Microphone Enhancement</Label>
              <p className="text-xs text-white/70 mb-2">Professional studio-quality audio</p>
              <Badge className="jj-surface-emerald-soft text-green-400">
                <Volume2 className="w-3 h-3 mr-1" />
                Active - Studio Quality
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JBJMeetRoom;
