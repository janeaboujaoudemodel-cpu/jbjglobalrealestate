import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  User,
  Upload,
  ChevronRight,
  Sparkles,
  Camera,
  Lock,
  Users,
  Image,
  Shirt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface PreJoinScreenProps {
  roomCode?: string;
  onJoin: (data: PreJoinData) => void;
  onCancel?: () => void;
}

interface PreJoinData {
  name: string;
  photo?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  roomType: 'meeting-room' | 'video-call';
  roomCode: string;
}

export const PreJoinScreen: React.FC<PreJoinScreenProps> = ({
  roomCode,
  onJoin,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [roomType, setRoomType] = useState<'meeting-room' | 'video-call'>('video-call');
  const [enteredRoomCode, setEnteredRoomCode] = useState(roomCode || '');
  const [hasPermissions, setHasPermissions] = useState(false);

  // Initialize camera preview
  useEffect(() => {
    const initCamera = async () => {
      if (!isVideoOff && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: !isMuted,
          });
          videoRef.current.srcObject = stream;
          setHasPermissions(true);
        } catch (error) {
          console.error('Camera error:', error);
          toast.error('Could not access camera. Please check permissions.');
        }
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOff, isMuted]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        toast.success('Photo uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJoin = () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!enteredRoomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    onJoin({
      name,
      photo: photo || undefined,
      isMuted,
      isVideoOff,
      roomType,
      roomCode: enteredRoomCode,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <Card className="bg-[#FDFBF7]/80 backdrop-blur-sm border-[#B89555]/20 overflow-hidden">
          <CardHeader className="text-center border-b border-[#1A1A1A] bg-gradient-to-r from-gold/10 via-transparent to-gold/10">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-3">
              <Sparkles className="w-7 h-7 text-[#1A1A1A]" />
              JBJ Meet
              <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border border-[#B89555]/30">Premium</Badge>
            </CardTitle>
            <p className="text-white/70 text-sm">
              Configure your audio and video before joining
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Video Preview */}
              <div className="space-y-4">
                <Label className="text-white/85 text-sm">Camera Preview</Label>
                <div className="relative aspect-video bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#1A1A1A]">
                  {!isVideoOff ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {photo ? (
                        <img 
                          src={photo} 
                          alt="Your photo" 
                          className="w-32 h-32 rounded-full object-cover border-4 border-[#B89555]/30"
                         loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-[#1A1A1A] flex items-center justify-center border-4 border-[#1A1A1A]">
                          <User className="w-16 h-16 text-white/90" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Camera overlay controls */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                    <Button
                      size="sm"
                      variant={isMuted ? 'destructive' : 'outline'}
                      onClick={() => setIsMuted(!isMuted)}
                      className="rounded-full w-12 h-12"
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={isVideoOff ? 'destructive' : 'outline'}
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className="rounded-full w-12 h-12"
                    >
                      {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                {/* Privacy notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-[#1A1A1A]">
                    <strong>Privacy Notice:</strong> Your camera and microphone start muted for your privacy. 
                    You can unmute them before or after joining.
                  </p>
                </div>
              </div>

              {/* Join Form */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <Label className="text-white/85 text-sm mb-2 block">Your Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-[#1A1A1A] border-[#1A1A1A] text-white"
                  />
                </div>

                {/* Room Code */}
                <div>
                  <Label className="text-white/85 text-sm mb-2 block flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#1A1A1A]" />
                    Room Code *
                  </Label>
                  <Input
                    value={enteredRoomCode}
                    onChange={(e) => setEnteredRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    className="bg-[#1A1A1A] border-[#1A1A1A] text-white font-mono uppercase"
                    maxLength={8}
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <Label className="text-white/85 text-sm mb-2 block">Profile Photo</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-[#1A1A1A] border-[#1A1A1A] text-white/85 hover:bg-[#1A1A1A]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {photo ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {photo && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Photo uploaded successfully
                    </p>
                  )}
                </div>

                {/* Room Type */}
                <div>
                  <Label className="text-white/85 text-sm mb-2 block">Meeting Type</Label>
                  <RadioGroup
                    value={roomType}
                    onValueChange={(val) => setRoomType(val as 'meeting-room' | 'video-call')}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="video-call"
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        roomType === 'video-call'
                          ? 'border-[#B89555] bg-[#EFE6D6]/10'
                          : 'border-[#1A1A1A] bg-[#1A1A1A] hover:border-[#1A1A1A]'
                      }`}
                    >
                      <RadioGroupItem value="video-call" id="video-call" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-[#1A1A1A]" />
                          <span className="font-medium text-white">Video Call</span>
                        </div>
                        <p className="text-xs text-white/70 mt-1">Standard video grid</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="meeting-room"
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        roomType === 'meeting-room'
                          ? 'border-[#B89555] bg-[#EFE6D6]/10'
                          : 'border-[#1A1A1A] bg-[#1A1A1A] hover:border-[#1A1A1A]'
                      }`}
                    >
                      <RadioGroupItem value="meeting-room" id="meeting-room" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#1A1A1A]" />
                          <span className="font-medium text-white">Board Room</span>
                        </div>
                        <p className="text-xs text-white/70 mt-1">Virtual table view</p>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                {/* Features preview */}
                <div className="p-4 bg-[#1A1A1A]/50 rounded-xl border border-[#1A1A1A]">
                  <p className="text-xs text-white/70 mb-2">Available Features:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-[#1A1A1A] text-white/70">
                      <Camera className="w-3 h-3 mr-1" />
                      4K Camera
                    </Badge>
                    <Badge variant="outline" className="border-[#1A1A1A] text-white/70">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Beauty Filters
                    </Badge>
                    <Badge variant="outline" className="border-[#1A1A1A] text-white/70">
                      <Image className="w-3 h-3 mr-1" />
                      AI Backgrounds
                    </Badge>
                    <Badge variant="outline" className="border-[#1A1A1A] text-white/70">
                      <Shirt className="w-3 h-3 mr-1" />
                      AI Outfit
                    </Badge>
                  </div>
                </div>

                {/* Join Button */}
                <Button
                  onClick={handleJoin}
                  disabled={!name.trim() || !enteredRoomCode.trim()}
                  className="w-full h-12 bg-gradient-to-r from-gold to-gold/80 text-[#1A1A1A] font-semibold hover:from-gold/90 hover:to-gold/70"
                >
                  Join Meeting
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>

                {onCancel && (
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    className="w-full border-[#1A1A1A] text-white/70"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PreJoinScreen;
