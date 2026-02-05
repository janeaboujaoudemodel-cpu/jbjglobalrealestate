import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Scissors, 
  MousePointer2, 
  Hand, 
  Magnet, 
  Plus, 
  Minus,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Trash2,
  Film,
  Music,
  Mic,
  Type,
  Sparkles
} from 'lucide-react';
import { Track, Clip, TimelineMode } from '../types';

interface TimelineEditorProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  zoom: number;
  mode: TimelineMode;
  snapEnabled: boolean;
  selectedClipIds: string[];
  onTimeChange: (time: number) => void;
  onZoomChange: (zoom: number) => void;
  onModeChange: (mode: TimelineMode) => void;
  onToggleSnap: () => void;
  onSelectClip: (clipId: string, multiSelect?: boolean) => void;
  onMoveClip: (clipId: string, newStartTime: number, newTrackId?: string) => void;
  onSplitClip: (clipId: string, time: number) => void;
  onDeleteClip: (clipId: string) => void;
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  onAddTrack: (type: Track['type']) => void;
  onDeleteTrack: (trackId: string) => void;
}

const PIXELS_PER_SECOND_BASE = 50;
const TRACK_HEIGHT = 48;

export function TimelineEditor({
  tracks,
  currentTime,
  duration,
  zoom,
  mode,
  snapEnabled,
  selectedClipIds,
  onTimeChange,
  onZoomChange,
  onModeChange,
  onToggleSnap,
  onSelectClip,
  onMoveClip,
  onSplitClip,
  onDeleteClip,
  onUpdateTrack,
  onAddTrack,
  onDeleteTrack,
}: TimelineEditorProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [collapsedTracks, setCollapsedTracks] = useState<Set<string>>(new Set());

  const pixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;
  const timelineWidth = duration * pixelsPerSecond;

  const getTrackIcon = (type: Track['type']) => {
    switch (type) {
      case 'video': return <Film className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'voiceover': return <Mic className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      case 'effects': return <Sparkles className="w-4 h-4" />;
      default: return <Film className="w-4 h-4" />;
    }
  };

  const getTrackColor = (type: Track['type']) => {
    switch (type) {
      case 'video': return 'bg-blue-500/80';
      case 'audio': return 'bg-green-500/80';
      case 'voiceover': return 'bg-purple-500/80';
      case 'text': return 'bg-amber-500/80';
      case 'effects': return 'bg-pink-500/80';
      default: return 'bg-slate-500/80';
    }
  };

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const time = Math.max(0, x / pixelsPerSecond);
    onTimeChange(time);
  }, [pixelsPerSecond, onTimeChange]);

  const handleClipMouseDown = useCallback((e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation();
    
    if (mode === 'cut') {
      onSplitClip(clip.id, currentTime);
      return;
    }

    const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey;
    onSelectClip(clip.id, isMultiSelect);

    if (mode === 'select') {
      setIsDragging(true);
      setDragClipId(clip.id);
      setDragOffset(e.clientX - (clip.startTime * pixelsPerSecond));
    }
  }, [mode, currentTime, onSplitClip, onSelectClip, pixelsPerSecond]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragClipId || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft - dragOffset;
    let newTime = Math.max(0, x / pixelsPerSecond);

    // Snap to playhead if enabled
    if (snapEnabled && Math.abs(newTime - currentTime) < 0.5) {
      newTime = currentTime;
    }

    onMoveClip(dragClipId, newTime);
  }, [isDragging, dragClipId, dragOffset, pixelsPerSecond, snapEnabled, currentTime, onMoveClip]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragClipId(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, handleMouseUp]);

  const toggleTrackCollapse = (trackId: string) => {
    setCollapsedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  // Generate time markers
  const timeMarkers = [];
  const markerInterval = zoom < 0.5 ? 10 : zoom < 1 ? 5 : zoom < 2 ? 2 : 1;
  for (let t = 0; t <= duration; t += markerInterval) {
    timeMarkers.push(t);
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={mode === 'select' ? 'default' : 'ghost'}
            onClick={() => onModeChange('select')}
            className={mode === 'select' ? 'bg-gold text-black' : 'text-slate-400'}
            title="Select (V)"
          >
            <MousePointer2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={mode === 'cut' ? 'default' : 'ghost'}
            onClick={() => onModeChange('cut')}
            className={mode === 'cut' ? 'bg-gold text-black' : 'text-slate-400'}
            title="Cut (C)"
          >
            <Scissors className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={mode === 'pan' ? 'default' : 'ghost'}
            onClick={() => onModeChange('pan')}
            className={mode === 'pan' ? 'bg-gold text-black' : 'text-slate-400'}
            title="Pan (H)"
          >
            <Hand className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-slate-700 mx-2" />

          <Button
            size="sm"
            variant={snapEnabled ? 'default' : 'ghost'}
            onClick={onToggleSnap}
            className={snapEnabled ? 'bg-gold text-black' : 'text-slate-400'}
            title="Toggle Snap (S)"
          >
            <Magnet className="w-4 h-4" />
          </Button>

          {selectedClipIds.length > 0 && (
            <>
              <div className="w-px h-4 bg-slate-700 mx-2" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => selectedClipIds.forEach(onDeleteClip)}
                className="text-red-400 hover:text-red-300"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onZoomChange(Math.max(0.1, zoom - 0.25))}
            className="text-slate-400"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="w-32">
            <Slider
              value={[zoom]}
              min={0.1}
              max={5}
              step={0.1}
              onValueChange={(v) => onZoomChange(v[0])}
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onZoomChange(Math.min(5, zoom + 0.25))}
            className="text-slate-400"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <span className="text-xs text-slate-500 w-12 text-right">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex min-h-0">
        {/* Track Labels */}
        <div className="w-40 flex-shrink-0 border-r border-slate-800 bg-slate-900/50">
          <div className="h-8 border-b border-slate-800" /> {/* Time ruler spacer */}
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-2 px-2 border-b border-slate-800/50 hover:bg-slate-800/30"
              style={{ height: collapsedTracks.has(track.id) ? 24 : TRACK_HEIGHT }}
            >
              <button
                onClick={() => toggleTrackCollapse(track.id)}
                className="text-slate-500 hover:text-slate-300"
              >
                {collapsedTracks.has(track.id) ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              <span className="text-slate-400">{getTrackIcon(track.type)}</span>
              <span className="text-xs text-slate-300 flex-1 truncate">{track.name}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onUpdateTrack(track.id, { muted: !track.muted })}
                  className={track.muted ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => onUpdateTrack(track.id, { visible: !track.visible })}
                  className={!track.visible ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}
                >
                  {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => onUpdateTrack(track.id, { locked: !track.locked })}
                  className={track.locked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}
                >
                  {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
          {/* Add Track Button */}
          <div className="p-2">
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-slate-500 hover:text-slate-300 text-xs"
              onClick={() => onAddTrack('video')}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Track
            </Button>
          </div>
        </div>

        {/* Tracks Area */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-auto"
          onMouseMove={handleMouseMove}
        >
          <div style={{ width: timelineWidth, minWidth: '100%' }}>
            {/* Time Ruler */}
            <div 
              className="h-8 border-b border-slate-800 relative bg-slate-900/80 sticky top-0 z-10"
              onClick={handleTimelineClick}
            >
              {timeMarkers.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full flex flex-col justify-end"
                  style={{ left: t * pixelsPerSecond }}
                >
                  <span className="text-xs text-slate-500 px-1">
                    {Math.floor(t / 60)}:{(t % 60).toString().padStart(2, '0')}
                  </span>
                  <div className="w-px h-2 bg-slate-700" />
                </div>
              ))}
              
              {/* Playhead */}
              <div
                className="absolute top-0 h-full w-0.5 bg-gold z-20"
                style={{ left: currentTime * pixelsPerSecond }}
              >
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold rotate-45" />
              </div>
            </div>

            {/* Track Rows */}
            {tracks.map((track) => (
              <div
                key={track.id}
                className="relative border-b border-slate-800/50"
                style={{ 
                  height: collapsedTracks.has(track.id) ? 24 : TRACK_HEIGHT,
                  opacity: track.visible ? 1 : 0.5,
                }}
                onClick={handleTimelineClick}
              >
                {/* Track Background Grid */}
                <div className="absolute inset-0 bg-slate-900/30" />

                {/* Clips */}
                {!collapsedTracks.has(track.id) && track.clips.map((clip) => (
                  <div
                    key={clip.id}
                    className={`absolute top-1 bottom-1 rounded cursor-pointer border-2 transition-colors ${getTrackColor(track.type)} ${
                      selectedClipIds.includes(clip.id)
                        ? 'border-gold ring-2 ring-gold/30'
                        : 'border-transparent hover:border-white/30'
                    }`}
                    style={{
                      left: clip.startTime * pixelsPerSecond,
                      width: clip.duration * pixelsPerSecond,
                    }}
                    onMouseDown={(e) => !track.locked && handleClipMouseDown(e, clip)}
                  >
                    {/* Clip Content */}
                    <div className="h-full px-1.5 flex items-center overflow-hidden">
                      <span className="text-xs text-white/90 truncate">{clip.name}</span>
                    </div>

                    {/* Trim Handles */}
                    {selectedClipIds.includes(clip.id) && (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize hover:bg-gold" />
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize hover:bg-gold" />
                      </>
                    )}
                  </div>
                ))}

                {/* Playhead line through track */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-gold/50 pointer-events-none"
                  style={{ left: currentTime * pixelsPerSecond }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
