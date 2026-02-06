import { useState, useCallback, useEffect } from 'react';
import { 
  VideoStudioProject, 
  Track, 
  Clip, 
  TimelineState,
  ProjectSettings 
} from '../types';

const generateId = () => crypto.randomUUID();

const defaultSettings: ProjectSettings = {
  width: 1920,
  height: 1080,
  frameRate: 30,
  aspectRatio: '16:9',
  backgroundColor: '#000000',
};

const createDefaultTracks = (): Track[] => [
  { id: generateId(), type: 'video', name: 'Video 1', locked: false, muted: false, visible: true, clips: [] },
  { id: generateId(), type: 'video', name: 'Video 2', locked: false, muted: false, visible: true, clips: [] },
  { id: generateId(), type: 'audio', name: 'Audio', locked: false, muted: false, visible: true, clips: [] },
  { id: generateId(), type: 'voiceover', name: 'Voiceover', locked: false, muted: false, visible: true, clips: [] },
  { id: generateId(), type: 'text', name: 'Text/Captions', locked: false, muted: false, visible: true, clips: [] },
  { id: generateId(), type: 'effects', name: 'Effects', locked: false, muted: false, visible: true, clips: [] },
];

const createNewProject = (): VideoStudioProject => ({
  id: generateId(),
  name: 'Untitled Project',
  duration: 60,
  tracks: createDefaultTracks(),
  settings: defaultSettings,
  createdAt: new Date(),
  // NOTE: No auto-delete - permanent storage per user requirement
});

const defaultTimelineState: TimelineState = {
  currentTime: 0,
  isPlaying: false,
  zoom: 1,
  scrollX: 0,
  selectedClipIds: [],
  mode: 'select',
  snapEnabled: true,
};

export function useVideoStudioProject() {
  const [project, setProject] = useState<VideoStudioProject>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem('jbj-video-studio-project');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          autoDeleteAt: new Date(parsed.autoDeleteAt),
        };
      } catch {
        return createNewProject();
      }
    }
    return createNewProject();
  });

  const [timelineState, setTimelineState] = useState<TimelineState>(defaultTimelineState);
  const [history, setHistory] = useState<VideoStudioProject[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Autosave to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('jbj-video-studio-project', JSON.stringify(project));
    }, 1000);
    return () => clearTimeout(timer);
  }, [project]);

  // Calculate total duration from clips
  const calculateDuration = useCallback((tracks: Track[]) => {
    let maxEnd = 0;
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipEnd = clip.startTime + clip.duration;
        if (clipEnd > maxEnd) maxEnd = clipEnd;
      });
    });
    return Math.max(maxEnd, 10); // Minimum 10 seconds
  }, []);

  const pushHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(project)));
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [project, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      setProject(history[historyIndex]);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setProject(history[historyIndex + 1]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  const addClip = useCallback((trackId: string, clip: Omit<Clip, 'id'>) => {
    pushHistory();
    setProject(prev => {
      const newTracks = prev.tracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            clips: [...track.clips, { ...clip, id: generateId() }],
          };
        }
        return track;
      });
      return {
        ...prev,
        tracks: newTracks,
        duration: calculateDuration(newTracks),
      };
    });
  }, [pushHistory, calculateDuration]);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        ),
      })),
    }));
  }, []);

  const deleteClip = useCallback((clipId: string) => {
    pushHistory();
    setProject(prev => {
      const newTracks = prev.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(clip => clip.id !== clipId),
      }));
      return {
        ...prev,
        tracks: newTracks,
        duration: calculateDuration(newTracks),
      };
    });
    setTimelineState(prev => ({
      ...prev,
      selectedClipIds: prev.selectedClipIds.filter(id => id !== clipId),
    }));
  }, [pushHistory, calculateDuration]);

  const splitClip = useCallback((clipId: string, time: number) => {
    pushHistory();
    setProject(prev => {
      const newTracks = prev.tracks.map(track => {
        const clipIndex = track.clips.findIndex(c => c.id === clipId);
        if (clipIndex === -1) return track;

        const clip = track.clips[clipIndex];
        const splitPoint = time - clip.startTime;
        
        if (splitPoint <= 0 || splitPoint >= clip.duration) return track;

        const firstClip: Clip = {
          ...clip,
          duration: splitPoint,
          source: {
            ...clip.source,
            outPoint: clip.source.inPoint + splitPoint,
          },
        };

        const secondClip: Clip = {
          ...clip,
          id: generateId(),
          startTime: time,
          duration: clip.duration - splitPoint,
          source: {
            ...clip.source,
            inPoint: clip.source.inPoint + splitPoint,
          },
        };

        const newClips = [...track.clips];
        newClips.splice(clipIndex, 1, firstClip, secondClip);

        return { ...track, clips: newClips };
      });

      return { ...prev, tracks: newTracks };
    });
  }, [pushHistory]);

  const moveClip = useCallback((clipId: string, newStartTime: number, newTrackId?: string) => {
    setProject(prev => {
      let clipToMove: Clip | undefined;
      let sourceTrackId: string | undefined;

      // Find the clip
      prev.tracks.forEach(track => {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clipToMove = clip;
          sourceTrackId = track.id;
        }
      });

      if (!clipToMove || !sourceTrackId) return prev;

      const targetTrackId = newTrackId || sourceTrackId;
      const snappedTime = timelineState.snapEnabled 
        ? Math.round(newStartTime * 10) / 10 
        : newStartTime;

      const newTracks = prev.tracks.map(track => {
        if (track.id === sourceTrackId && track.id !== targetTrackId) {
          // Remove from source track
          return {
            ...track,
            clips: track.clips.filter(c => c.id !== clipId),
          };
        }
        if (track.id === targetTrackId) {
          if (track.id === sourceTrackId) {
            // Move within same track
            return {
              ...track,
              clips: track.clips.map(c =>
                c.id === clipId ? { ...c, startTime: Math.max(0, snappedTime) } : c
              ),
            };
          } else {
            // Add to target track
            return {
              ...track,
              clips: [...track.clips, { ...clipToMove!, startTime: Math.max(0, snappedTime), trackId: targetTrackId }],
            };
          }
        }
        return track;
      });

      return {
        ...prev,
        tracks: newTracks,
        duration: calculateDuration(newTracks),
      };
    });
  }, [timelineState.snapEnabled, calculateDuration]);

  const addTrack = useCallback((type: Track['type'], name?: string) => {
    pushHistory();
    const trackCount = project.tracks.filter(t => t.type === type).length + 1;
    const newTrack: Track = {
      id: generateId(),
      type,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${trackCount}`,
      locked: false,
      muted: false,
      visible: true,
      clips: [],
    };
    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));
  }, [project.tracks, pushHistory]);

  const deleteTrack = useCallback((trackId: string) => {
    pushHistory();
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId),
    }));
  }, [pushHistory]);

  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      ),
    }));
  }, []);

  const updateSettings = useCallback((settings: Partial<ProjectSettings>) => {
    setProject(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const renameProject = useCallback((name: string) => {
    setProject(prev => ({ ...prev, name }));
  }, []);

  const newProject = useCallback(() => {
    if (confirm('Create a new project? Unsaved changes will be lost.')) {
      setProject(createNewProject());
      setTimelineState(defaultTimelineState);
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, []);

  const selectClip = useCallback((clipId: string, multiSelect = false) => {
    setTimelineState(prev => ({
      ...prev,
      selectedClipIds: multiSelect
        ? prev.selectedClipIds.includes(clipId)
          ? prev.selectedClipIds.filter(id => id !== clipId)
          : [...prev.selectedClipIds, clipId]
        : [clipId],
    }));
  }, []);

  const deselectAll = useCallback(() => {
    setTimelineState(prev => ({ ...prev, selectedClipIds: [] }));
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    setTimelineState(prev => ({ ...prev, currentTime: Math.max(0, time) }));
  }, []);

  const togglePlayback = useCallback(() => {
    setTimelineState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setTimelineState(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(10, zoom)) }));
  }, []);

  const setMode = useCallback((mode: TimelineState['mode']) => {
    setTimelineState(prev => ({ ...prev, mode }));
  }, []);

  const toggleSnap = useCallback(() => {
    setTimelineState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled }));
  }, []);

  const getSelectedClips = useCallback((): Clip[] => {
    const clips: Clip[] = [];
    project.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (timelineState.selectedClipIds.includes(clip.id)) {
          clips.push(clip);
        }
      });
    });
    return clips;
  }, [project.tracks, timelineState.selectedClipIds]);

  return {
    project,
    timelineState,
    setProject,
    addClip,
    updateClip,
    deleteClip,
    splitClip,
    moveClip,
    addTrack,
    deleteTrack,
    updateTrack,
    updateSettings,
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
    canUndo: historyIndex >= 0,
    canRedo: historyIndex < history.length - 1,
  };
}
