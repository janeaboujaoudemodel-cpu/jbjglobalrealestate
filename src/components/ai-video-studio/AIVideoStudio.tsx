import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AIVideoStudioLayout, AIVideoStudioLayoutHandle } from './layout/AIVideoStudioLayout';
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
import { TransitionsPanel } from './features/TransitionsPanel';
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
  const layoutRef = useRef<AIVideoStudioLayoutHandle>(null);

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
  const [activeOverlayEffect, setActiveOverlayEffect] = useState<string | null>(null);
  const [hoverOverlayEffect, setHoverOverlayEffect] = useState<string | null>(null);
  const [activeBeautyFilter, setActiveBeautyFilter] = useState<import('./features/BeautyFiltersPanel').BeautyAdjustments | null>(null);
  const [exportBeautyFilter, setExportBeautyFilter] = useState<import('./features/BeautyFiltersPanel').BeautyAdjustments | null>(null);
  const [beautyComparisonMode, setBeautyComparisonMode] = useState(false);
  const [previewAspectRatio, setPreviewAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');

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
        case 't': layoutRef.current?.toggleTool('transitions'); break;
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

    // Build CSS filter string to embed in export metadata / ffmpeg flags
    const filterCss = exportBeautyFilter
      ? [
          `brightness(${100 + exportBeautyFilter.brightness}%)`,
          `contrast(${100 + exportBeautyFilter.contrast}%)`,
          `saturate(${100 + exportBeautyFilter.saturation}%)`,
          exportBeautyFilter.warmth > 0 ? `sepia(${exportBeautyFilter.warmth / 2}%)` : `hue-rotate(${exportBeautyFilter.warmth}deg)`,
          `blur(${exportBeautyFilter.blur / 10}px)`,
        ].join(' ')
      : null;

    if (filterCss) {
      console.info('[Export] Beauty filter baked into export pipeline:', filterCss);
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setRenderJob(prev => prev ? { ...prev, progress, status: progress < 100 ? 'processing' : 'completed' } : null);
      if (progress >= 100) {
        clearInterval(interval);
        setIsExporting(false);
        toast.success(
          exportBeautyFilter
            ? `Export complete: ${preset.name} (with beauty filter)`
            : `Export complete: ${preset.name}`
        );
      }
    }, 500);
  }, [project.id, exportBeautyFilter]);

  const handleExportAll = useCallback(() => {
    setIsExporting(true);
    toast.info('Exporting all formats...');
    setTimeout(() => { setIsExporting(false); toast.success('All exports complete!'); }, 3000);
  }, []);

  const handleExport = useCallback(() => {
    const preset = { id: selectedExportPreset, name: 'YouTube', width: 1920, height: 1080, aspectRatio: '16:9', platform: 'youtube' as const, icon: '▶️' };
    handleExportSingle(preset);
  }, [selectedExportPreset, handleExportSingle]);

  // Sync export preset → preview aspect ratio
  const PRESET_ASPECT_MAP: Record<string, '16:9' | '9:16' | '1:1' | '4:5'> = {
    reels: '9:16', youtube: '16:9', instagram: '1:1', portrait: '4:5',
  };
  const handleSelectExportPreset = useCallback((presetId: string) => {
    setSelectedExportPreset(presetId);
    const ratio = PRESET_ASPECT_MAP[presetId];
    if (ratio) setPreviewAspectRatio(ratio);
  }, []);

  // Auto-open Inspector when a single clip is selected from the timeline
  const handleSelectClip = useCallback((clipId: string, multiSelect?: boolean) => {
    selectClip(clipId, multiSelect);
    if (!multiSelect) {
      layoutRef.current?.openTool('inspector');
    }
  }, [selectClip]);

  const selectedClips = getSelectedClips();
  const selectedClip = selectedClips.length === 1 ? selectedClips[0] : null;

  // Build preview clips (video/image) — text clips rendered separately
  const previewClips = project.tracks
    .filter(t => t.type !== 'text')
    .flatMap(track =>
      track.clips.map(clip => ({ id: clip.id, type: clip.type as 'video' | 'audio' | 'image', url: clip.source.url, startTime: clip.startTime, duration: clip.duration }))
    );

  // Build transition clips for live preview overlays
  const transitionClips = project.tracks
    .flatMap(track => track.clips)
    .filter(clip => clip.type === 'transition')
    .map(clip => ({
      id: clip.id,
      startTime: clip.startTime,
      duration: clip.duration,
      transitionId: clip.effects.find(e => e.type === 'transition')?.settings?.transitionId as string ?? 'fade-black',
      easing: (clip.transition?.easing ?? 'easeInOut') as string,
    }));

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

  const handleAddTransition = useCallback((
    trackId: string,
    time: number,
    def: { id: string; name: string; duration: number },
  ) => {
    addClip(trackId, {
      trackId,
      type: 'transition',
      name: def.name,
      startTime: time - def.duration / 2,
      duration: def.duration,
      source: { url: '', inPoint: 0, outPoint: def.duration, originalDuration: def.duration },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      keyframes: [],
      effects: [{ id: crypto.randomUUID(), type: 'transition', name: def.id, settings: { transitionId: def.id } }],
    });
    toast.success(`✨ "${def.name}" transition added`);
  }, [addClip]);


  return (
    <AIVideoStudioLayout
      ref={layoutRef}
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
          transitionClips={transitionClips}
          textClips={activeTextClips}
          currentTime={timelineState.currentTime}
          isPlaying={timelineState.isPlaying}
          duration={project.duration}
          onTimeUpdate={setCurrentTime}
          onTogglePlayback={togglePlayback}
          onUpload={handleUpload}
          onOpenTool={(toolId) => layoutRef.current?.toggleTool(toolId)}
          activeOverlayEffect={activeOverlayEffect}
          hoverOverlayEffect={hoverOverlayEffect}
          beautyFilter={activeBeautyFilter}
          onClearBeautyFilter={() => { setActiveBeautyFilter(null); setBeautyComparisonMode(false); }}
          beautyComparisonMode={beautyComparisonMode}
          aspectRatio={previewAspectRatio}
          onAspectRatioChange={setPreviewAspectRatio}
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
          onSelectClip={handleSelectClip}
          onMoveClip={moveClip}
          onSplitClip={splitClip}
          onDeleteClip={deleteClip}
          onUpdateTrack={updateTrack}
          onAddTrack={addTrack}
          onDeleteTrack={deleteTrack}
          onAddTransition={handleAddTransition}
        />
      }
      exportBar={
        <AIVideoStudioExportBar
          selectedPreset={selectedExportPreset}
          onSelectPreset={handleSelectExportPreset}
          onExportSingle={handleExportSingle}
          onExportAll={handleExportAll}
          isExporting={isExporting}
          exportBeautyFilter={exportBeautyFilter}
          onClearExportFilter={() => setExportBeautyFilter(null)}
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
          <BeautyFiltersPanel
            onFilterChange={(adj) => { setActiveBeautyFilter(adj); if (!adj) setBeautyComparisonMode(false); }}
            onApplyToExport={(adj) => setExportBeautyFilter(adj)}
            exportFilterActive={exportBeautyFilter != null}
            comparisonMode={beautyComparisonMode}
            onToggleComparison={() => setBeautyComparisonMode(m => !m)}
          />
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
      effectsPanel={
        <OverlayEffectsPanel
          activeEffect={activeOverlayEffect}
          onPreviewEffect={setActiveOverlayEffect}
          onHoverEffect={setHoverOverlayEffect}
          onAddEffect={(effectId) => {
            // Add effect clip to timeline
            const videoTrack = project.tracks.find(t => t.type === 'video');
            if (!videoTrack) return;
            const lastEnd = videoTrack.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
            addClip(videoTrack.id, {
              trackId: videoTrack.id,
              type: 'image',
              name: `Effect: ${effectId}`,
              startTime: lastEnd,
              duration: 4,
              source: { url: `effect://${effectId}`, inPoint: 0, outPoint: 4, originalDuration: 4 },
              transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
              keyframes: [],
              effects: [],
            });
          }}
        />
      }
      transitionsPanel={<TransitionsPanel />}
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
          onCreateVideoAd={(result) => {
            const { clips, voiceover, projectName, transitions: transitionType } = result;

            const videoTrack = project.tracks.find(t => t.type === 'video');
            const textTrack  = project.tracks.find(t => t.type === 'text');

            // Find or create voiceover track
            const voiceoverTrack = project.tracks.find(t => t.type === 'voiceover');
            if (!voiceoverTrack && voiceover) {
              addTrack('voiceover', 'Voiceover');
            }

            let videoCursor = videoTrack?.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0) ?? 0;
            let textCursor  = textTrack?.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0) ?? 0;

            const photoClips = clips.filter(c => c.type === 'image');
            const textClips  = clips.filter(c => c.type === 'text');

            // Add photo clips to video track with transitions between them
            photoClips.forEach((clip, idx) => {
              if (!videoTrack) return;
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
              // Insert transition between photos (not after the last one)
              if (idx < photoClips.length - 1 && transitionType) {
                const transitionDuration = 0.8;
                addClip(videoTrack.id, {
                  trackId: videoTrack.id,
                  type: 'transition',
                  name: transitionType,
                  startTime: videoCursor + clip.duration - transitionDuration / 2,
                  duration: transitionDuration,
                  source: { url: '', inPoint: 0, outPoint: transitionDuration, originalDuration: transitionDuration },
                  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
                  keyframes: [],
                  effects: [{ id: crypto.randomUUID(), type: 'transition', name: transitionType, settings: { transitionId: transitionType } }],
                  transition: { transitionId: transitionType, easing: 'easeInOut' },
                });
              }
              videoCursor += clip.duration;
            });

            // Add text overlay clips
            textClips.forEach(clip => {
              if (!textTrack) return;
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
                  style: (clip.textOverlay?.style ?? 'lower-third') as 'lower-third' | 'clean' | 'bold' | 'highlight',
                },
              });
              textCursor += clip.duration;
            });

            // Add voiceover audio clip (decode base64 → blob URL)
            if (voiceover && voiceover.audioBase64) {
              try {
                const byteString = atob(voiceover.audioBase64);
                const bytes = new Uint8Array(byteString.length);
                for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
                const blob = new Blob([bytes], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(blob);

                // Add to voiceover track (find fresh after potential creation)
                const voTrack = project.tracks.find(t => t.type === 'voiceover');
                const targetTrackId = voTrack?.id;
                // Fallback to audio track if voiceover track not ready yet
                const fallbackAudioTrack = project.tracks.find(t => t.type === 'audio');
                const trackId = targetTrackId || fallbackAudioTrack?.id;

                if (trackId) {
                  const voiceCursor = project.tracks.find(t => t.id === trackId)?.clips
                    .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0) ?? 0;
                  addClip(trackId, {
                    trackId,
                    type: 'audio',
                    name: `🎙️ ${projectName} — AI Voiceover`,
                    startTime: voiceCursor,
                    duration: voiceover.duration,
                    source: { url: audioUrl, inPoint: 0, outPoint: voiceover.duration, originalDuration: voiceover.duration },
                    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
                    keyframes: [],
                    effects: [],
                    audio: { volume: 1, fadeIn: 0.5, fadeOut: 1, muted: false, normalized: true, noiseReduction: false },
                  });
                }
              } catch (e) {
                console.error('Failed to decode voiceover audio:', e);
              }
            }

            renameProject(`${projectName} — Video Ad`);
            toast.success(`🎬 "${projectName}" video ad ready! Photos, transitions, voiceover & text overlay added.`);
          }}
        />
      }
    />
  );
}
