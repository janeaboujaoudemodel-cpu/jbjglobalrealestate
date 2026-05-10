import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  MonitorUp,
  Users,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VideoCallPanelProps {
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  onCallEnd?: (duration: number, outcome: string) => void;
}

export function VideoCallPanel({ 
  leadId, 
  leadName, 
  leadPhone,
  onCallEnd 
}: VideoCallPanelProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callDialogOpen, setCallDialogOpen] = useState(false);

  const startCall = () => {
    if (!leadPhone) {
      toast.error("No phone number available for this lead");
      return;
    }
    
    setIsCallActive(true);
    setCallDialogOpen(true);
    toast.info(`Initiating call to ${leadName || leadPhone}...`);
    
    // Simulate call duration timer
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    
    // Store interval ID for cleanup
    (window as any).callInterval = interval;
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallDialogOpen(false);
    
    if ((window as any).callInterval) {
      clearInterval((window as any).callInterval);
    }
    
    const duration = callDuration;
    setCallDuration(0);
    
    if (onCallEnd && duration > 0) {
      onCallEnd(duration, "completed");
    }
    
    toast.success(`Call ended. Duration: ${formatDuration(duration)}`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    toast.info(isVideoEnabled ? "Camera disabled" : "Camera enabled");
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    toast.info(isAudioEnabled ? "Microphone muted" : "Microphone unmuted");
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast.info(isScreenSharing ? "Screen sharing stopped" : "Screen sharing started");
  };

  return (
    <>
      <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Video className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Video Call Center</CardTitle>
                <p className="text-[#1A1A1A]/70 text-sm mt-1">
                  Voice and video calls with leads
                </p>
              </div>
            </div>
            <Badge 
              className={isCallActive 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30/30"
              }
            >
              {isCallActive ? "In Call" : "Available"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={startCall}
              disabled={isCallActive || !leadPhone}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-12"
            >
              <Phone className="h-4 w-4 mr-2" />
              Start Call
            </Button>
            <Button
              onClick={startCall}
              disabled={isCallActive || !leadPhone}
              className="bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              <Video className="h-4 w-4 mr-2" />
              Video Call
            </Button>
          </div>

          {/* Call Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#1A1A1A]">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-xs text-[#1A1A1A]/70">Calls Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#1A1A1A]">8:45</div>
              <div className="text-xs text-[#1A1A1A]/70">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">85%</div>
              <div className="text-xs text-[#1A1A1A]/70">Answer Rate</div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="p-3 rounded-lg bg-[#1A1A1A]/50 border border-[#1A1A1A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm text-[#1A1A1A]/70">Twilio Integration</span>
              </div>
              <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">
                Setup Required
              </Badge>
            </div>
            <p className="text-xs text-[#1A1A1A]/70 mt-2">
              Connect your Twilio account for live voice and video calling
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Call Dialog */}
      <Dialog open={callDialogOpen} onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              Call in Progress
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Video Area */}
            <div className="relative aspect-video bg-[#1A1A1A] rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                {isVideoEnabled ? (
                  <div className="text-center">
                    <Users className="h-16 w-16 text-[#1A1A1A]/70 mx-auto mb-4" />
                    <p className="text-[#1A1A1A]/70">Video feed will appear here</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <VideoOff className="h-16 w-16 text-[#1A1A1A]/70 mx-auto mb-4" />
                    <p className="text-[#1A1A1A]/70">Camera is disabled</p>
                  </div>
                )}
              </div>
              
              {/* Call Info Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-[#1A1A1A]/50 backdrop-blur-sm">
                  <span className="text-white font-medium">{leadName || "Unknown"}</span>
                </div>
              </div>
              
              {/* Duration Overlay */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/80">
                <Clock className="h-4 w-4 text-white" />
                <span className="text-white font-mono">{formatDuration(callDuration)}</span>
              </div>
              
              {/* Self Preview */}
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-[#1A1A1A] rounded-lg border-2 border-[#1A1A1A] overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-[#1A1A1A]/70">You</span>
                </div>
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleAudio}
                className={`h-14 w-14 rounded-full ${
                  isAudioEnabled 
                    ? "bg-[#1A1A1A] border-[#1A1A1A] text-white hover:bg-[#1A1A1A]" 
                    : "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                }`}
              >
                {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleVideo}
                className={`h-14 w-14 rounded-full ${
                  isVideoEnabled 
                    ? "bg-[#1A1A1A] border-[#1A1A1A] text-white hover:bg-[#1A1A1A]" 
                    : "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                }`}
              >
                {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleScreenShare}
                className={`h-14 w-14 rounded-full ${
                  isScreenSharing 
                    ? "bg-blue-500/20 border-blue-500/30 text-blue-400" 
                    : "bg-[#1A1A1A] border-[#1A1A1A] text-white hover:bg-[#1A1A1A]"
                }`}
              >
                <MonitorUp className="h-6 w-6" />
              </Button>
              
              <Button
                onClick={endCall}
                className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
