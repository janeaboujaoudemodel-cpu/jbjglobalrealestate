import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
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
  Sparkles,
  Keyboard,
  Clapperboard,
} from 'lucide-react';
import { Track, Clip, TimelineMode } from '../types';
import { ShortcutCheatSheet } from '../layout/ShortcutCheatSheet';

// ── Transition definitions for the context menu ─────────────────────────────
const QUICK_TRANSITIONS = [
  { id: 'fade-black',   name: 'Fade Black',    duration: 1.0 },
  { id: 'fade-white',   name: 'Fade White',    duration: 0.75 },
  { id: 'dissolve',     name: 'Dissolve',      duration: 1.0 },
  { id: 'slide-left',   name: 'Slide Left',    duration: 0.8 },
  { id: 'slide-right',  name: 'Slide Right',   duration: 0.8 },
  { id: 'zoom-in',      name: 'Zoom In',       duration: 0.75 },
  { id: 'zoom-out',     name: 'Zoom Out',      duration: 0.75 },
];

// ── Tool button with hover tooltip showing keyboard shortcut badge ─────────────
function ToolBtn({
  active,
  onClick,
  label,
  shortcut,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  shortcut: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Button
        size="sm"
        variant={active ? 'default' : 'ghost'}
        onClick={onClick}
        className={active ? 'bg-gold text-black' : 'text-slate-400'}
      >
        {children}
      </Button>

      {/* Tooltip with shortcut badge */}
      {hovered && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] pointer-events-none animate-fade-in"
          style={{ whiteSpace: 'nowrap' }}
        >
          {/* Arrow pointing up */}
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid rgba(245,158,11,0.3)' }}
          />
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{
              background: 'rgba(15,23,42,0.97)',
              border: '1px solid rgba(245,158,11,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'rgba(226,232,240,1)' }}>{label}</span>
            <kbd
              className="inline-flex items-center justify-center rounded font-mono font-bold text-[10px] px-1.5 py-0.5 min-w-[1.4rem]"
              style={{
                background: 'rgba(245,158,11,0.18)',
                border: '1px solid rgba(245,158,11,0.5)',
                color: '#F59E0B',
                boxShadow: '0 1px 0 rgba(0,0,0,0.4)',
              }}
            >
              {shortcut}
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
}

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
  onAddTransition?: (trackId: string, time: number, transition: { id: string; name: string; duration: number }) => void;
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
  onAddTransition,
}: TimelineEditorProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [collapsedTracks, setCollapsedTracks] = useState<Set<string>>(new Set());
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [hoveredGap, setHoveredGap] = useState<string | null>(null);

  // Open cheat-sheet on "?"
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?') setShowCheatSheet(prev => !prev);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

    if (snapEnabled && Math.abs(newTime - currentTime) < 0.5) {
      newTime = currentTime;
    }

    onMoveClip(dragClipId, newTime);
  }, [isDragging, dragClipId, dragOffset, pixelsPerSecond, snapEnabled, currentTime, onMoveClip]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragClipId(null);
  }, []);

  const handleTransitionDrop = useCallback((
    e: React.DragEvent,
    trackId: string,
    insertAtTime: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredGap(null);
    const raw = e.dataTransfer.getData('transition');
    if (!raw || !onAddTransition) return;
    try {
      const data = JSON.parse(raw) as { id: string; name: string; duration: number };
      onAddTransition(trackId, insertAtTime, data);
    } catch { /* ignore */ }
  }, [onAddTransition]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, handleMouseUp]);

  const toggleTrackCollapse = (trackId: string) => {
    setCollapsedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) newSet.delete(trackId);
      else newSet.add(trackId);
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
    <>
      {/* ── Keyboard cheat-sheet modal ── */}
      <ShortcutCheatSheet open={showCheatSheet} onClose={() => setShowCheatSheet(false)} />

      <div className="h-full flex flex-col bg-slate-900">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80 overflow-visible z-10 relative">
          <div className="flex items-center gap-1">
            <ToolBtn active={mode === 'select'} onClick={() => onModeChange('select')} label="Select" shortcut="V">
              <MousePointer2 className="w-4 h-4" />
            </ToolBtn>
            <ToolBtn active={mode === 'cut'} onClick={() => onModeChange('cut')} label="Cut" shortcut="C">
              <Scissors className="w-4 h-4" />
            </ToolBtn>
            <ToolBtn active={mode === 'pan'} onClick={() => onModeChange('pan')} label="Pan" shortcut="H">
              <Hand className="w-4 h-4" />
            </ToolBtn>

            <div className="w-px h-4 bg-slate-700 mx-2" />

            <ToolBtn active={snapEnabled} onClick={onToggleSnap} label="Snap" shortcut="S">
              <Magnet className="w-4 h-4" />
            </ToolBtn>

            {selectedClipIds.length > 0 && (
              <>
                <div className="w-px h-4 bg-slate-700 mx-2" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => selectedClipIds.forEach(onDeleteClip)}
                  className="text-red-400 hover:text-red-300"
                  title="Delete Selected (Del)"
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

            <div className="w-px h-4 bg-slate-700 mx-1" />

            {/* ? shortcut help button */}
            <button
              onClick={() => setShowCheatSheet(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.3)'; }}
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-3 h-3" />
              <kbd className="font-mono text-[10px]">?</kbd>
            </button>
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
                  <div className="absolute inset-0 bg-slate-900/30" />

                  {/* Clips */}
                  {!collapsedTracks.has(track.id) && track.clips.map((clip) => {
                    const isTransition = clip.type === 'transition';
                    return (
                      <ContextMenu key={clip.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className={`absolute top-1 bottom-1 rounded cursor-pointer border-2 transition-colors ${
                              isTransition
                                ? 'bg-purple-600/80 border-purple-400 flex items-center justify-center'
                                : getTrackColor(track.type)
                            } ${
                              selectedClipIds.includes(clip.id)
                                ? 'border-gold ring-2 ring-gold/30'
                                : isTransition
                                ? 'border-purple-400 hover:border-purple-200'
                                : 'border-transparent hover:border-white/30'
                            }`}
                            style={{
                              left: clip.startTime * pixelsPerSecond,
                              width: Math.max(clip.duration * pixelsPerSecond, 24),
                              zIndex: isTransition ? 10 : 1,
                            }}
                            onMouseDown={(e) => !track.locked && handleClipMouseDown(e, clip)}
                            title={isTransition ? `${clip.name} transition` : clip.name}
                          >
                            {isTransition ? (
                              <span className="text-[10px] font-bold text-white text-center leading-tight px-0.5 truncate">
                                ◇ {clip.name}
                              </span>
                            ) : (
                              <div className="h-full px-1.5 flex items-center overflow-hidden">
                                <span className="text-xs text-white/90 truncate">{clip.name}</span>
                              </div>
                            )}

                            {selectedClipIds.includes(clip.id) && !isTransition && (
                              <>
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize hover:bg-gold" />
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize hover:bg-gold" />
                              </>
                            )}
                          </div>
                        </ContextMenuTrigger>

                        <ContextMenuContent className="z-[10200] bg-slate-900 border-slate-700 text-slate-100 min-w-[200px]">
                          <ContextMenuLabel className="text-slate-400 text-[11px] uppercase tracking-wider">
                            <Clapperboard className="inline w-3 h-3 mr-1.5 text-purple-400" />
                            {clip.name}
                          </ContextMenuLabel>
                          <ContextMenuSeparator className="bg-slate-700" />

                          {/* Add Transition Before */}
                          {onAddTransition && !isTransition && (
                            <ContextMenuSub>
                              <ContextMenuSubTrigger className="focus:bg-slate-800 data-[state=open]:bg-slate-800 text-slate-200">
                                <span className="mr-2 text-purple-400">◁</span>
                                Add Transition Before
                              </ContextMenuSubTrigger>
                              <ContextMenuSubContent className="z-[10300] bg-slate-900 border-slate-700 text-slate-100 min-w-[160px]">
                                {QUICK_TRANSITIONS.map((t) => (
                                  <ContextMenuItem
                                    key={t.id}
                                    className="focus:bg-slate-800 text-slate-200 cursor-pointer"
                                    onSelect={() => onAddTransition(track.id, clip.startTime, t)}
                                  >
                                    <span className="mr-2 text-purple-400 text-[11px]">◇</span>
                                    <span className="flex-1">{t.name}</span>
                                    <span className="text-[10px] text-slate-500 ml-2">{t.duration}s</span>
                                  </ContextMenuItem>
                                ))}
                              </ContextMenuSubContent>
                            </ContextMenuSub>
                          )}

                          {/* Add Transition After */}
                          {onAddTransition && !isTransition && (
                            <ContextMenuSub>
                              <ContextMenuSubTrigger className="focus:bg-slate-800 data-[state=open]:bg-slate-800 text-slate-200">
                                <span className="mr-2 text-purple-400">▷</span>
                                Add Transition After
                              </ContextMenuSubTrigger>
                              <ContextMenuSubContent className="z-[10300] bg-slate-900 border-slate-700 text-slate-100 min-w-[160px]">
                                {QUICK_TRANSITIONS.map((t) => (
                                  <ContextMenuItem
                                    key={t.id}
                                    className="focus:bg-slate-800 text-slate-200 cursor-pointer"
                                    onSelect={() => onAddTransition(track.id, clip.startTime + clip.duration, t)}
                                  >
                                    <span className="mr-2 text-purple-400 text-[11px]">◇</span>
                                    <span className="flex-1">{t.name}</span>
                                    <span className="text-[10px] text-slate-500 ml-2">{t.duration}s</span>
                                  </ContextMenuItem>
                                ))}
                              </ContextMenuSubContent>
                            </ContextMenuSub>
                          )}

                          <ContextMenuSeparator className="bg-slate-700" />

                          {/* Split */}
                          <ContextMenuItem
                            className="focus:bg-slate-800 text-slate-200 cursor-pointer"
                            onSelect={() => onSplitClip(clip.id, currentTime)}
                          >
                            <Scissors className="mr-2 w-3.5 h-3.5 text-slate-400" />
                            Split at Playhead
                          </ContextMenuItem>

                          {/* Delete */}
                          <ContextMenuItem
                            className="focus:bg-red-900/50 text-red-400 cursor-pointer"
                            onSelect={() => onDeleteClip(clip.id)}
                          >
                            <Trash2 className="mr-2 w-3.5 h-3.5" />
                            Delete Clip
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}

                  {/* Gap Drop Zones — shown between consecutive clips */}
                  {!collapsedTracks.has(track.id) && onAddTransition && (() => {
                    const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);
                    return sorted.slice(0, -1).map((clip, i) => {
                      const nextClip = sorted[i + 1];
                      const gapStart = clip.startTime + clip.duration;
                      const gapEnd   = nextClip.startTime;
                      const gapWidth = gapEnd - gapStart;
                      if (gapEnd <= gapStart) return null;
                      const gapKey = `${track.id}-gap-${i}`;
                      const isHovered = hoveredGap === gapKey;
                      const insertTime = gapStart + gapWidth / 2;
                      return (
                        <div
                          key={gapKey}
                          className={`absolute top-0 h-full z-20 rounded transition-all ${
                            isHovered ? 'bg-purple-500/30 border border-purple-400' : 'bg-transparent border border-dashed border-transparent hover:border-purple-500/50'
                          }`}
                          style={{
                            left: gapStart * pixelsPerSecond,
                            width: Math.max(gapWidth * pixelsPerSecond, 8),
                            minWidth: 8,
                          }}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setHoveredGap(gapKey); }}
                          onDragLeave={() => setHoveredGap(null)}
                          onDrop={(e) => handleTransitionDrop(e, track.id, insertTime)}
                        >
                          {isHovered && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-purple-300 text-[10px] font-bold">+ Drop</span>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}

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
    </>
  );
}
