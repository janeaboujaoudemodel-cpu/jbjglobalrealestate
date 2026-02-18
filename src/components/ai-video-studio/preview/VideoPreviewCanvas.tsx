import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface VideoPreviewCanvasProps {
  clips: Array<{
    id: string;
    type: 'video' | 'audio' | 'image';
    url: string;
    startTime: number;
    duration: number;
  }>;
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  onTimeUpdate: (time: number) => void;
  onTogglePlayback: () => void;
}

export function VideoPreviewCanvas({
  clips,
  currentTime,
  isPlaying,
  duration,
  onTimeUpdate,
  onTogglePlayback,
}: VideoPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Find the active video clip at current time
  const activeVideoClip = clips.find(
    clip => clip.type === 'video' && 
    currentTime >= clip.startTime && 
    currentTime < clip.startTime + clip.duration
  );

  // Update video time when currentTime changes
  useEffect(() => {
    if (videoRef.current && activeVideoClip) {
      const clipTime = currentTime - activeVideoClip.startTime;
      if (Math.abs(videoRef.current.currentTime - clipTime) > 0.1) {
        videoRef.current.currentTime = clipTime;
      }
    }
  }, [currentTime, activeVideoClip]);

  // Handle playback state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Playback loop for timeline advancement
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onTimeUpdate(currentTime + 0.1);
      if (currentTime >= duration) {
        onTogglePlayback();
        onTimeUpdate(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, onTimeUpdate, onTogglePlayback]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleSeek = useCallback((value: number[]) => {
    onTimeUpdate(value[0]);
  }, [onTimeUpdate]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
    if (videoRef.current) {
      videoRef.current.volume = value[0];
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const skipBackward = useCallback(() => {
    onTimeUpdate(Math.max(0, currentTime - 5));
  }, [currentTime, onTimeUpdate]);

  const skipForward = useCallback(() => {
    onTimeUpdate(Math.min(duration, currentTime + 5));
  }, [currentTime, duration, onTimeUpdate]);

  const handleStop = useCallback(() => {
    if (isPlaying) onTogglePlayback();
    onTimeUpdate(0);
  }, [isPlaying, onTogglePlayback, onTimeUpdate]);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-slate-950">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl w-full max-w-4xl aspect-video">
          {activeVideoClip ? (
            <video
              ref={videoRef}
              src={activeVideoClip.url}
              className="w-full h-full object-contain"
              muted={isMuted}
              playsInline
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-400 text-lg">No media at playhead</p>
                <p className="text-slate-500 text-sm mt-2">
                  Add media to the timeline to preview
                </p>
              </div>
            </div>
          )}

          {/* Time Overlay */}
          <div className="absolute top-3 right-3 bg-black/80 px-2 py-1 rounded text-xs font-mono text-white border border-white/10">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-700 bg-slate-900">
        {/* Timeline Scrubber */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left - Time Display */}
          <div className="flex items-center gap-2 w-32">
            <span className="text-sm font-mono text-slate-300">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Center - Playback Controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={skipBackward}
              className="text-white hover:text-amber-300 hover:bg-slate-700"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStop}
              className="text-white hover:text-amber-300 hover:bg-slate-700"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={onTogglePlayback}
              className="bg-amber-500 text-black hover:bg-amber-400 w-10 h-10 rounded-full font-bold"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={skipForward}
              className="text-white hover:text-amber-300 hover:bg-slate-700"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Right - Volume & Fullscreen */}
          <div className="flex items-center gap-2 w-32 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-white hover:text-amber-300 hover:bg-slate-700"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <div className="w-16">
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:text-amber-300 hover:bg-slate-700"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
