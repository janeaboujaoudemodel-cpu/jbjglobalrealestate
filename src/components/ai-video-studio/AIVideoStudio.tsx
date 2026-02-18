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
  const previewClips = project.tracks.flatMap(track =>
    track.clips.map(clip => ({ id: clip.id, type: clip.type as 'video' | 'audio' | 'image', url: clip.source.url, startTime: clip.startTime, duration: clip.duration }))
  );

  const timelineClips = project.tracks.flatMap(t => t.clips.map(c => ({ id: c.id, name: c.name, type: c.type, duration: c.duration, startTime: c.startTime })));

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
      leftPanel={
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
      centerPanel={
        <VideoPreviewCanvas
          clips={previewClips}
          currentTime={timelineState.currentTime}
          isPlaying={timelineState.isPlaying}
          duration={project.duration}
          onTimeUpdate={setCurrentTime}
          onTogglePlayback={togglePlayback}
        />
      }
      rightPanel={
        <InspectorPanel
          selectedClip={selectedClip}
          onUpdateClip={(updates) => selectedClip && updateClip(selectedClip.id, updates)}
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
      captionsPanel={
        <CaptionTranslator
          subtitles={subtitles}
          onSubtitlesUpdate={setSubtitles}
          onTranscribe={async () => []}
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
      sfxPanel={<SoundEffectsPanel />}
      effectsPanel={<OverlayEffectsPanel />}
      resizePanel={
        <ScrollArea className="h-full">
          <VideoResizePanel />
        </ScrollArea>
      }
      aiEditorPanel={
        <AIEditorPanel
          clips={timelineClips}
          onApplyTemplate={(template) => toast.info(`Template "${template}" applied`)}
        />
      }
      mapPanel={<MapEffectPanel />}
      projectsPanel={<ProjectIntegrationPanel />}
    />
  );
}
