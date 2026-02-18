import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Upload, Mic, FileText, Bot, Film } from 'lucide-react';

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
  onUpload?: (files: FileList) => void;
  onOpenTool?: (toolId: string) => void;
}

const QUICK_ACTIONS = [
  { id: 'upload',   icon: Upload,   label: 'Upload Video',    desc: 'Add from your device' },
  { id: 'captions', icon: FileText, label: 'Auto Captions',   desc: 'Transcribe & translate' },
  { id: 'voice',    icon: Mic,      label: 'Voice Dubbing',   desc: 'AI multilingual audio' },
  { id: 'ai-editor',icon: Bot,      label: 'AI Editor',       desc: 'Smart highlight reel' },
];

export function VideoPreviewCanvas({
  clips,
  currentTime,
  isPlaying,
  duration,
  onTimeUpdate,
  onTogglePlayback,
  onUpload,
  onOpenTool,
}: VideoPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const hasClips = clips.length > 0;

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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpload) {
      onUpload(e.target.files);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0 && onUpload) {
      onUpload(e.dataTransfer.files);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleQuickAction = useCallback((actionId: string) => {
    if (actionId === 'upload') {
      fileInputRef.current?.click();
    } else if (onOpenTool) {
      onOpenTool(actionId);
    }
  }, [onOpenTool]);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-slate-950">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div
          className={`relative bg-black rounded-lg overflow-hidden shadow-2xl w-full max-w-4xl aspect-video transition-all ${
            isDragOver ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950' : ''
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {hasClips ? (
            <>
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
                    <Film className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-lg">No media at playhead</p>
                    <p className="text-slate-500 text-sm mt-1">Move the playhead to a clip</p>
                  </div>
                </div>
              )}

              {/* Time Overlay */}
              <div className="absolute top-3 right-3 bg-black/80 px-2 py-1 rounded text-xs font-mono text-white border border-white/10">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Drag overlay hint */}
              {isDragOver && (
                <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-300 font-semibold">Drop to add to timeline</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Welcome / Empty State */
            <div className="w-full h-full flex flex-col items-center justify-center p-6">
              {isDragOver ? (
                <div className="text-center">
                  <Upload className="w-14 h-14 text-amber-400 mx-auto mb-3 animate-bounce" />
                  <p className="text-amber-300 text-lg font-semibold">Drop your file here</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <div className="flex items-center gap-2 justify-center mb-1">
                      <Film className="w-6 h-6 text-amber-400" />
                      <h2 className="text-white text-xl font-bold tracking-tight">AI Video Studio</h2>
                    </div>
                    <p className="text-slate-400 text-sm">Create, edit, and dub videos with AI</p>
                  </div>

                  {/* Quick action grid */}
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-5">
                    {QUICK_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action.id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/80 border border-slate-600 hover:border-amber-500/60 hover:bg-slate-700/80 transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-700 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                            <Icon className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors" />
                          </div>
                          <div>
                            <p className="text-white text-xs font-semibold leading-tight">{action.label}</p>
                            <p className="text-slate-400 text-xs leading-tight mt-0.5">{action.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-slate-400 hover:text-amber-400 text-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>or drop a video file here</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-700 bg-slate-900">
        {/* Timeline Scrubber */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 1}
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
