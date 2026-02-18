import React, { useCallback, useEffect, useState } from 'react';
import { AIVideoStudioLayout } from './layout/AIVideoStudioLayout';
import { AIVideoStudioTopBar } from './layout/AIVideoStudioTopBar';
import { AIVideoStudioExportBar } from './layout/AIVideoStudioExportBar';
import { MediaLibraryPanel } from './panels/MediaLibraryPanel';
import { InspectorPanel } from './panels/InspectorPanel';
import { VideoPreviewCanvas } from './preview/VideoPreviewCanvas';
import { TimelineEditor } from './timeline/TimelineEditor';
import { VoiceoverRecorder } from './features/VoiceoverRecorder';
import { BeautyFiltersPanel } from './features/BeautyFiltersPanel';
import { VideoResizePanel } from './features/VideoResizePanel';
import { CaptionTranslator } from './features/CaptionTranslator';
import { TextOverlayPanel } from './features/TextOverlayPanel';
import { SoundEffectsPanel } from './features/SoundEffectsPanel';
import { OverlayEffectsPanel } from './features/OverlayEffectsPanel';
import { AIEditorPanel } from './features/AIEditorPanel';
import { MapEffectPanel } from './features/MapEffectPanel';
import { ProjectIntegrationPanel } from './features/ProjectIntegrationPanel';
import { useVideoStudioProject } from './hooks/useVideoStudioProject';
import { useMediaLibrary } from './hooks/useMediaLibrary';
import { MediaAsset, StockAsset, Clip, ExportPreset, RenderJob } from './types';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';


interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  language: string;
  translations?: Record<string, string>;
}

export function AIVideoStudio() {
  const {
    project,
    timelineState,
    addClip,
    updateClip,
    deleteClip,
    splitClip,
    moveClip,
    addTrack,
    deleteTrack,
    updateTrack,
    renameProject,
    newProject,
    selectClip,
    deselectAll,
    setCurrentTime,
    togglePlayback,
    setZoom,
    setMode,
    toggleSnap,
    getSelectedClips,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useVideoStudioProject();

  const {
    assets,
    stockAssets,
    isUploading,
    uploadProgress,
    isLoadingStock,
    uploadMultipleFiles,
    deleteAsset,
    loadStockLibrary,
  } = useMediaLibrary();

  const [selectedExportPreset, setSelectedExportPreset] = useState('youtube');
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);

  useEffect(() => {
    loadStockLibrary();
  }, [loadStockLibrary]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlayback(); break;
        case 'Delete':
        case 'Backspace':
          if (timelineState.selectedClipIds.length > 0) {
            timelineState.selectedClipIds.forEach(deleteClip);
          }
          break;
        case 'z':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
          break;
        case 'v': setMode('select'); break;
        case 'c': if (!e.metaKey && !e.ctrlKey) setMode('cut'); break;
        case 'h': setMode('pan'); break;
        case 's': if (!e.metaKey && !e.ctrlKey) toggleSnap(); break;
        case 'Escape': deselectAll(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, deleteClip, timelineState.selectedClipIds, setMode, toggleSnap, deselectAll, undo, redo]);

  const handleAddToTimeline = useCallback((asset: MediaAsset | StockAsset) => {
    const trackType = asset.type === 'video' ? 'video' : asset.type === 'audio' ? 'audio' : 'video';
    const track = project.tracks.find(t => t.type === trackType);
    if (!track) { toast.error('No suitable track found'); return; }
    const lastClipEnd = track.clips.reduce((max, clip) => Math.max(max, clip.startTime + clip.duration), 0);
    const newClip: Omit<Clip, 'id'> = {
      trackId: track.id,
      type: asset.type,
      name: asset.name,
      startTime: lastClipEnd,
      duration: asset.duration || 5,
      source: { url: asset.url, thumbnailUrl: asset.thumbnailUrl, inPoint: 0, outPoint: asset.duration || 5, originalDuration: asset.duration || 5 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      keyframes: [],
      effects: [],
    };
    addClip(track.id, newClip);
    toast.success(`Added "${asset.name}" to timeline`);
  }, [project.tracks, addClip]);

  const handleUpload = useCallback((files: FileList) => {
    uploadMultipleFiles(files);
  }, [uploadMultipleFiles]);

  const handleExportSingle = useCallback((preset: ExportPreset) => {
    setIsExporting(true);
    setRenderJob({ id: crypto.randomUUID(), projectId: project.id, status: 'queued', progress: 0, createdAt: new Date() });
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setRenderJob(prev => prev ? { ...prev, progress, status: progress < 100 ? 'processing' : 'completed' } : null);
      if (progress >= 100) { clearInterval(interval); setIsExporting(false); toast.success(`Export complete: ${preset.name}`); }
    }, 500);
  }, [project.id]);

  const handleExportAll = useCallback(() => {
    setIsExporting(true);
    toast.info('Exporting all formats...');
    setTimeout(() => { setIsExporting(false); toast.success('All exports complete!'); }, 3000);
  }, []);

  const handleExport = useCallback(() => {
    const preset = { id: selectedExportPreset, name: 'YouTube', width: 1920, height: 1080, aspectRatio: '16:9', platform: 'youtube' as const, icon: '▶️' };
    handleExportSingle(preset);
  }, [selectedExportPreset, handleExportSingle]);

  const selectedClips = getSelectedClips();
  const selectedClip = selectedClips.length === 1 ? selectedClips[0] : null;

  // Build preview clips (video/image) — text clips rendered separately
  const previewClips = project.tracks
    .filter(t => t.type !== 'text')
    .flatMap(track =>
      track.clips.map(clip => ({ id: clip.id, type: clip.type as 'video' | 'audio' | 'image', url: clip.source.url, startTime: clip.startTime, duration: clip.duration }))
    );

  // Text clips that are active at current time
  const activeTextClips = project.tracks
    .filter(t => t.type === 'text')
    .flatMap(t => t.clips)
    .filter(c =>
      timelineState.currentTime >= c.startTime &&
      timelineState.currentTime < c.startTime + c.duration &&
      c.text
    );

  const timelineClips = project.tracks.flatMap(t => t.clips.map(c => ({ id: c.id, name: c.name, type: c.type, duration: c.duration, startTime: c.startTime })));

  // Handler: add a text clip from the TextOverlayPanel
  const handleAddTextClip = useCallback((clipData: {
    text: import('./types').TextSettings;
    startTime: number;
    duration: number;
    animation: string;
  }) => {
    const textTrack = project.tracks.find(t => t.type === 'text');
    if (!textTrack) { toast.error('No text track found'); return; }
    addClip(textTrack.id, {
      trackId: textTrack.id,
      type: 'text',
      name: clipData.text.content.slice(0, 30) || 'Text',
      startTime: clipData.startTime,
      duration: clipData.duration,
      source: { url: '', inPoint: 0, outPoint: clipData.duration, originalDuration: clipData.duration },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      keyframes: [],
      effects: [{ id: crypto.randomUUID(), type: 'overlay', name: 'animation', settings: { animation: clipData.animation } }],
      text: clipData.text,
    });
  }, [project.tracks, addClip]);


  return (
    <AIVideoStudioLayout
      topBar={
        <AIVideoStudioTopBar
          projectName={project.name}
          onRename={renameProject}
          onNewProject={newProject}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          renderJob={renderJob}
          onExport={handleExport}
        />
      }
      centerPanel={
        <VideoPreviewCanvas
          clips={previewClips}
          textClips={activeTextClips}
          currentTime={timelineState.currentTime}
          isPlaying={timelineState.isPlaying}
          duration={project.duration}
          onTimeUpdate={setCurrentTime}
          onTogglePlayback={togglePlayback}
          onUpload={handleUpload}
        />
      }
      timeline={
        <TimelineEditor
          tracks={project.tracks}
          currentTime={timelineState.currentTime}
          duration={project.duration}
          zoom={timelineState.zoom}
          mode={timelineState.mode}
          snapEnabled={timelineState.snapEnabled}
          selectedClipIds={timelineState.selectedClipIds}
          onTimeChange={setCurrentTime}
          onZoomChange={setZoom}
          onModeChange={setMode}
          onToggleSnap={toggleSnap}
          onSelectClip={selectClip}
          onMoveClip={moveClip}
          onSplitClip={splitClip}
          onDeleteClip={deleteClip}
          onUpdateTrack={updateTrack}
          onAddTrack={addTrack}
          onDeleteTrack={deleteTrack}
        />
      }
      exportBar={
        <AIVideoStudioExportBar
          selectedPreset={selectedExportPreset}
          onSelectPreset={setSelectedExportPreset}
          onExportSingle={handleExportSingle}
          onExportAll={handleExportAll}
          isExporting={isExporting}
        />
      }
      mediaPanel={
        <MediaLibraryPanel
          assets={assets}
          stockAssets={stockAssets}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          isLoadingStock={isLoadingStock}
          onUpload={uploadMultipleFiles}
          onLoadStock={loadStockLibrary}
          onAddToTimeline={handleAddToTimeline}
          onDeleteAsset={deleteAsset}
        />
      }
      inspectorPanel={
        <InspectorPanel
          selectedClip={selectedClip}
          onUpdateClip={(updates) => selectedClip && updateClip(selectedClip.id, updates)}
        />
      }
      captionsPanel={
        <CaptionTranslator
          subtitles={subtitles}
          onSubtitlesUpdate={setSubtitles}
          onTranscribe={async () => []}
        />
      }
      textPanel={
        <TextOverlayPanel
          onAddTextClip={handleAddTextClip}
          currentTime={timelineState.currentTime}
        />
      }
      voicePanel={
        <VoiceoverRecorder
          onRecordingComplete={(blob, duration) => toast.success('Voiceover ready')}
          onAIVoiceGenerated={(url, duration) => toast.success('AI voice generated')}
        />
      }
      beautyPanel={
        <ScrollArea className="h-full">
          <BeautyFiltersPanel />
        </ScrollArea>
      }
      sfxPanel={
        <SoundEffectsPanel
          onAddToTimeline={(sfx) => {
            const track = project.tracks.find(t => t.type === 'audio');
            if (!track) { toast.error('No audio track found'); return; }
            const lastEnd = track.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
            addClip(track.id, {
              trackId: track.id,
              type: 'audio',
              name: sfx.name,
              startTime: lastEnd,
              duration: sfx.duration,
              source: { url: sfx.url, thumbnailUrl: undefined, inPoint: 0, outPoint: sfx.duration, originalDuration: sfx.duration },
              transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
              keyframes: [],
              effects: [],
            });
          }}
        />
      }
      effectsPanel={<OverlayEffectsPanel />}
      resizePanel={
        <ScrollArea className="h-full">
          <VideoResizePanel />
        </ScrollArea>
      }
      aiEditorPanel={
        <AIEditorPanel
          clips={timelineClips}
          onApplyTemplate={(template, editPlan) => {
            if (editPlan && editPlan.length > 0 && timelineClips.length > 0) {
              // Reorder clips on the video track using the AI edit plan
              const videoTrack = project.tracks.find(t => t.type === 'video');
              if (videoTrack) {
                let cursor = 0;
                editPlan.forEach(step => {
                  const sourceClip = videoTrack.clips[step.clipIndex];
                  if (sourceClip) {
                    updateClip(sourceClip.id, {
                      startTime: cursor,
                      duration: step.duration,
                    });
                    cursor += step.duration;
                  }
                });
                toast.success(`🎬 "${template}" applied — ${editPlan.length} clips assembled!`);
              } else {
                toast.info(`Template "${template}" applied`);
              }
            } else {
              toast.info(`Template "${template}" applied`);
            }
          }}
        />
      }
      mapPanel={
        <MapEffectPanel
          onAddToTimeline={(sfx) => {
            const videoTrack = project.tracks.find(t => t.type === 'video');
            if (!videoTrack) { toast.error('No video track found'); return; }
            const lastEnd = videoTrack.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
            addClip(videoTrack.id, {
              trackId: videoTrack.id,
              type: 'image',
              name: sfx.name,
              startTime: lastEnd,
              duration: sfx.duration,
              source: { url: sfx.url, thumbnailUrl: undefined, inPoint: 0, outPoint: sfx.duration, originalDuration: sfx.duration },
              transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
              keyframes: [],
              effects: [],
            });
            toast.success(`🗺️ Map effect added to timeline!`);
          }}
        />
      }
      projectsPanel={
        <ProjectIntegrationPanel
          onCreateVideoAd={(clips, projectName) => {
            const videoTrack = project.tracks.find(t => t.type === 'video');
            const audioTrack = project.tracks.find(t => t.type === 'audio');
            const textTrack  = project.tracks.find(t => t.type === 'text');

            let videoCursor  = videoTrack?.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0) ?? 0;
            let audioCursor  = audioTrack?.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0) ?? 0;
            let textCursor   = textTrack?.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0) ?? 0;

            clips.forEach(clip => {
              // Music → audio track
              if (clip.url.startsWith('music://')) {
                if (!audioTrack) return;
                addClip(audioTrack.id, {
                  trackId: audioTrack.id,
                  type: 'audio',
                  name: clip.name,
                  startTime: audioCursor,
                  duration: clip.duration,
                  source: { url: clip.url, inPoint: 0, outPoint: clip.duration, originalDuration: clip.duration },
                  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
                  keyframes: [],
                  effects: [],
                  audio: { volume: 0.5, fadeIn: 1, fadeOut: 2, muted: false, normalized: true, noiseReduction: false },
                });
                audioCursor += clip.duration;
              // Text overlay → text track
              } else if (clip.type === 'text' && textTrack) {
                addClip(textTrack.id, {
                  trackId: textTrack.id,
                  type: 'text',
                  name: clip.name,
                  startTime: textCursor,
                  duration: clip.duration,
                  source: { url: clip.url, inPoint: 0, outPoint: clip.duration, originalDuration: clip.duration },
                  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
                  keyframes: [],
                  effects: [],
                  text: {
                    content: clip.textOverlay?.content ?? '',
                    fontFamily: 'Georgia, serif',
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    textAlign: 'left',
                    position: 'bottom',
                    style: 'lower-third',
                  },
                });
                textCursor += clip.duration;
              // Photo → video track
              } else if (videoTrack) {
                addClip(videoTrack.id, {
                  trackId: videoTrack.id,
                  type: 'image',
                  name: clip.name,
                  startTime: videoCursor,
                  duration: clip.duration,
                  source: { url: clip.url, thumbnailUrl: clip.url, inPoint: 0, outPoint: clip.duration, originalDuration: clip.duration },
                  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
                  keyframes: [],
                  effects: [],
                });
                videoCursor += clip.duration;
              }
            });

            toast.success(`🎬 "${projectName}" video ad ready! Scroll the timeline to see all clips.`);
          }}
        />
      }
    />
  );
}
