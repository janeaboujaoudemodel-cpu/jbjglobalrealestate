import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Upload, Mic, FileText, Bot, Film, CloudUpload, Sparkles } from 'lucide-react';
import { Clip } from '../types';

// ── Example real-estate "inspiration" thumbnails (Unsplash, no key needed) ──
const EXAMPLE_VIDEOS = [
  {
    id: 1,
    label: 'Luxury Villa',
    sublabel: 'Dubai Hills · 5BR',
    img: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=320&q=75&auto=format&fit=crop',
    accent: '#F59E0B',
  },
  {
    id: 2,
    label: 'Waterfront Penthouse',
    sublabel: 'Palm Jumeirah · 3BR',
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=320&q=75&auto=format&fit=crop',
    accent: '#818CF8',
  },
  {
    id: 3,
    label: 'Downtown Tower',
    sublabel: 'Business Bay · Studio',
    img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=320&q=75&auto=format&fit=crop',
    accent: '#34D399',
  },
  {
    id: 4,
    label: 'Desert Estate',
    sublabel: 'Al Barari · 6BR',
    img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=320&q=75&auto=format&fit=crop',
    accent: '#F472B6',
  },
];

function InspirationCarousel() {
  const [active, setActive] = useState(0);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % EXAMPLE_VIDEOS.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Main card */}
      <div className="relative rounded-xl overflow-hidden aspect-video shadow-xl mb-2" style={{ border: `1.5px solid ${EXAMPLE_VIDEOS[active].accent}55` }}>
        {EXAMPLE_VIDEOS.map((v, i) => (
          <div
            key={v.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === active ? 1 : 0 }}
          >
            <img src={v.img} alt={v.label} className="w-full h-full object-cover" loading="lazy" />
            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
            {/* Play badge */}
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${v.accent}cc` }}>
              <Play className="w-3 h-3 text-black ml-0.5" />
            </div>
            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
              <p className="text-white text-xs font-bold leading-tight">{v.label}</p>
              <p className="text-white/60 text-[10px] leading-tight">{v.sublabel}</p>
            </div>
          </div>
        ))}
        {/* AI badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(0,0,0,0.65)', color: EXAMPLE_VIDEOS[active].accent, border: `1px solid ${EXAMPLE_VIDEOS[active].accent}55` }}>
          <Sparkles className="w-2.5 h-2.5" /> AI Ready
        </div>
      </div>

      {/* Dot navigation */}
      <div className="flex items-center justify-center gap-1.5">
        {EXAMPLE_VIDEOS.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setActive(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? 18 : 6,
              height: 6,
              background: i === active ? v.accent : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-1.5 mt-2">
        {EXAMPLE_VIDEOS.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setActive(i)}
            className="flex-1 rounded-lg overflow-hidden transition-all duration-200"
            style={{
              outline: i === active ? `2px solid ${v.accent}` : '2px solid transparent',
              outlineOffset: 1,
              opacity: i === active ? 1 : 0.5,
            }}
          >
            <img src={v.img} alt={v.label} className="w-full aspect-video object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}

export interface TransitionClipPreview {
  id: string;
  startTime: number;
  duration: number;
  transitionId: string;
  easing: string;
}

interface VideoPreviewCanvasProps {
  clips: Array<{
    id: string;
    type: 'video' | 'audio' | 'image';
    url: string;
    startTime: number;
    duration: number;
  }>;
  transitionClips?: TransitionClipPreview[];
  textClips?: Clip[];
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

// ── Easing functions ──────────────────────────────────────────────────────────
function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'easeIn':    return t * t;
    case 'easeOut':   return t * (2 - t);
    case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    default:          return t; // linear
  }
}

// ── CSS overlay for each transition type ─────────────────────────────────────
function TransitionOverlay({ transitionId, progress, easing }: { transitionId: string; progress: number; easing: string }) {
  const p = applyEasing(Math.max(0, Math.min(1, progress)), easing);

  // fade-black / fade-white / fade-blur: mid-point = full coverage
  if (transitionId.startsWith('fade-black')) {
    // 0→0.5: fade to black; 0.5→1: fade out from black
    const opacity = p <= 0.5 ? p * 2 : (1 - p) * 2;
    return <div className="absolute inset-0 pointer-events-none bg-black" style={{ opacity }} />;
  }
  if (transitionId.startsWith('fade-white')) {
    const opacity = p <= 0.5 ? p * 2 : (1 - p) * 2;
    return <div className="absolute inset-0 pointer-events-none bg-white" style={{ opacity }} />;
  }
  if (transitionId.startsWith('fade-blur')) {
    const blur = p <= 0.5 ? p * 2 * 12 : (1 - p) * 2 * 12;
    const opacity = p <= 0.5 ? p * 2 : (1 - p) * 2;
    return <div className="absolute inset-0 pointer-events-none" style={{ backdropFilter: `blur(${blur}px)`, opacity }} />;
  }

  // dissolve: cross-fade overlay from semi-transparent black
  if (transitionId.startsWith('dissolve')) {
    const opacity = p <= 0.5 ? p * 2 * 0.6 : (1 - p) * 2 * 0.6;
    return <div className="absolute inset-0 pointer-events-none bg-black" style={{ opacity }} />;
  }

  // slide-left: incoming frame slides in from right
  if (transitionId === 'slide-left') {
    const translate = (1 - p) * 100;
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" style={{ transform: `translateX(${translate}%)` }} />
      </div>
    );
  }
  // slide-right: incoming frame slides in from left
  if (transitionId === 'slide-right') {
    const translate = (p - 1) * 100;
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" style={{ transform: `translateX(${translate}%)` }} />
      </div>
    );
  }
  // slide-up: incoming frame slides in from bottom
  if (transitionId === 'slide-up') {
    const translate = (1 - p) * 100;
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" style={{ transform: `translateY(${translate}%)` }} />
      </div>
    );
  }

  // zoom-in: scale up from center
  if (transitionId === 'zoom-in') {
    const scale = 1 + p * 0.3;
    const opacity = p <= 0.5 ? p * 2 * 0.4 : (1 - p) * 2 * 0.4;
    return <div className="absolute inset-0 pointer-events-none bg-black" style={{ transform: `scale(${scale})`, opacity, transformOrigin: 'center' }} />;
  }
  // zoom-out: scale down
  if (transitionId === 'zoom-out') {
    const scale = 1.3 - p * 0.3;
    const opacity = p <= 0.5 ? p * 2 * 0.4 : (1 - p) * 2 * 0.4;
    return <div className="absolute inset-0 pointer-events-none bg-black" style={{ transform: `scale(${scale})`, opacity, transformOrigin: 'center' }} />;
  }
  // zoom-punch: quick punch zoom
  if (transitionId === 'zoom-punch') {
    const peak = Math.sin(p * Math.PI);
    const scale = 1 + peak * 0.25;
    return <div className="absolute inset-0 pointer-events-none" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }} />;
  }

  // Fallback: simple fade
  const opacity = p <= 0.5 ? p * 2 : (1 - p) * 2;
  return <div className="absolute inset-0 pointer-events-none bg-black" style={{ opacity }} />;
}

export function VideoPreviewCanvas({
  clips,
  transitionClips = [],
  textClips = [],
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
      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
        <div
          className={`relative bg-black overflow-hidden shadow-2xl w-full max-w-full h-full transition-all ${
            isDragOver ? 'ring-2 ring-amber-400' : ''
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

              {/* ── Active Text Overlays ── */}
              {textClips.map(clip => {
                if (!clip.text) return null;
                const t = clip.text;
                const anim = clip.effects.find(e => e.name === 'animation')?.settings?.animation ?? 'none';
                const posClass =
                  t.position === 'top'    ? 'top-4'    :
                  t.position === 'bottom' ? 'bottom-4' :
                  'top-1/2 -translate-y-1/2';
                const animClass =
                  anim === 'fade-in'    ? 'animate-fade-in'  :
                  anim === 'slide-up'   ? 'animate-slide-up' :
                  anim === 'zoom-in'    ? 'animate-zoom-in'  :
                  '';
                return (
                  <div
                    key={clip.id}
                    className={`absolute left-0 right-0 flex justify-${t.textAlign === 'left' ? 'start' : t.textAlign === 'right' ? 'end' : 'center'} px-6 ${posClass} ${animClass}`}
                  >
                    <span
                      style={{
                        fontFamily: t.fontFamily,
                        fontSize: `clamp(12px, ${t.fontSize * 0.055}vw, ${t.fontSize}px)`,
                        fontWeight: t.fontWeight,
                        color: t.color,
                        background: t.backgroundColor ?? 'transparent',
                        textAlign: t.textAlign,
                        padding: t.backgroundColor ? '4px 12px' : '0',
                        borderRadius: t.backgroundColor ? '6px' : '0',
                        display: 'inline-block',
                        maxWidth: '90%',
                        wordBreak: 'break-word',
                        lineHeight: 1.2,
                        textShadow: !t.backgroundColor ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {t.content}
                    </span>
                  </div>
                );
              })}

              {/* ── Live Transition Overlays ── */}
              {transitionClips
                .filter(tc => currentTime >= tc.startTime && currentTime <= tc.startTime + tc.duration)
                .map(tc => {
                  const progress = tc.duration > 0
                    ? (currentTime - tc.startTime) / tc.duration
                    : 0;
                  return (
                    <TransitionOverlay
                      key={tc.id}
                      transitionId={tc.transitionId}
                      progress={progress}
                      easing={tc.easing}
                    />
                  );
                })}

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
            /* ── Welcome / Empty State ── */
            <div
              className="w-full h-full flex flex-col items-center justify-center overflow-y-auto"
              style={{ padding: '12px 16px' }}
            >
              {isDragOver ? (
                /* ── Active Drop State ── */
                <div className="flex flex-col items-center gap-3 animate-fade-in">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.18)', border: '2.5px dashed #F59E0B' }}
                  >
                    <CloudUpload className="w-9 h-9 text-amber-400 animate-bounce" />
                  </div>
                  <p className="text-amber-300 text-base font-bold">Drop your file here</p>
                  <p className="text-amber-200/50 text-xs">Video, audio or image</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-4 max-w-md">
                  {/* Header */}
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-1">
                      <Film className="w-5 h-5 text-amber-400" />
                      <h2 className="text-white text-lg font-bold tracking-tight">AI Video Studio</h2>
                    </div>
                    <p className="text-slate-400 text-xs">Create, edit and dub real estate videos with AI</p>
                  </div>

                  {/* ── Animated inspiration carousel ── */}
                  <InspirationCarousel />

                  {/* ── Drop zone ── */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl flex flex-col items-center gap-2 py-4 px-4 transition-all duration-200 group"
                    style={{
                      background: 'rgba(245,158,11,0.06)',
                      border: '2px dashed rgba(245,158,11,0.35)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.13)';
                      (e.currentTarget as HTMLElement).style.border = '2px dashed rgba(245,158,11,0.75)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(245,158,11,0.12)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.06)';
                      (e.currentTarget as HTMLElement).style.border = '2px dashed rgba(245,158,11,0.35)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                      style={{ background: 'rgba(245,158,11,0.15)' }}
                    >
                      <CloudUpload className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white text-xs font-semibold">Drop a video here or click to browse</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">MP4, MOV, AVI · up to 2GB</p>
                    </div>
                  </button>

                  {/* Quick action grid */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {QUICK_ACTIONS.filter(a => a.id !== 'upload').map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action.id)}
                          className="flex items-center gap-2.5 p-3 rounded-xl transition-all group text-left"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.4)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                            style={{ background: 'rgba(245,158,11,0.12)' }}
                          >
                            <Icon className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-white text-[11px] font-semibold leading-tight">{action.label}</p>
                            <p className="text-slate-500 text-[10px] leading-tight mt-0.5">{action.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
