// JBJ AI Video Studio™ - Type Definitions

export interface VideoStudioProject {
  id: string;
  name: string;
  duration: number;
  tracks: Track[];
  settings: ProjectSettings;
  createdAt: Date;
  // NOTE: autoDeleteAt removed - zero auto-deletion policy per user requirement
  // All projects are saved permanently until user explicitly deletes
}

export interface ProjectSettings {
  width: number;
  height: number;
  frameRate: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  backgroundColor: string;
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'voiceover' | 'text' | 'effects';
  name: string;
  locked: boolean;
  muted: boolean;
  visible: boolean;
  clips: Clip[];
}

export interface Clip {
  id: string;
  trackId: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'subtitle' | 'effect' | 'transition';
  name: string;
  startTime: number;
  duration: number;
  source: ClipSource;
  transform: ClipTransform;
  keyframes: Keyframe[];
  effects: ClipEffect[];
  audio?: AudioSettings;
  text?: TextSettings;
  subtitle?: SubtitleSettings;
}

export interface ClipSource {
  url: string;
  thumbnailUrl?: string;
  inPoint: number;
  outPoint: number;
  originalDuration: number;
}

export interface ClipTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
}

export interface Keyframe {
  id: string;
  time: number;
  property: 'x' | 'y' | 'scaleX' | 'scaleY' | 'rotation' | 'opacity' | 'volume';
  value: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface ClipEffect {
  id: string;
  type: 'filter' | 'transition' | 'overlay' | 'blur' | 'vignette';
  name: string;
  settings: Record<string, any>;
}

export interface AudioSettings {
  volume: number;
  fadeIn: number;
  fadeOut: number;
  muted: boolean;
  normalized: boolean;
  noiseReduction: boolean;
}

export interface TextSettings {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  backgroundColor?: string;
  textAlign: 'left' | 'center' | 'right';
  position: 'top' | 'center' | 'bottom' | 'custom';
  style: 'clean' | 'bold' | 'highlight' | 'lower-third';
}

export interface SubtitleSettings extends TextSettings {
  startTime: number;
  endTime: number;
  language: string;
  isRTL: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
}

export interface StockAsset extends MediaAsset {
  category: string;
  tags: string[];
  isPremium: boolean;
}

export interface ExportPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'custom';
  icon: string;
}

export interface RenderJob {
  id: string;
  projectId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  outputUrls?: Record<string, string>;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TeleprompterSettings {
  script: string;
  fontSize: number;
  scrollSpeed: number;
  mirrorMode: boolean;
  countdownSeconds: number;
}

export interface VoiceoverSettings {
  voice: string;
  language: string;
  speed: number;
  pitch: number;
}

export interface TransitionDefinition {
  id: string;
  name: string;
  category: 'fade' | 'dissolve' | 'slide' | 'zoom';
  duration: number;
  description: string;
}

export type TimelineMode = 'select' | 'cut' | 'trim' | 'pan';

export interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  scrollX: number;
  selectedClipIds: string[];
  mode: TimelineMode;
  snapEnabled: boolean;
}

// Voice options for AI TTS
export const VOICE_OPTIONS = [
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', gender: 'male' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', gender: 'female' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', gender: 'female' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', gender: 'male' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', gender: 'male' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', gender: 'male' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', gender: 'neutral' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', gender: 'male' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', gender: 'female' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', gender: 'female' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', gender: 'female' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'male' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', gender: 'male' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', gender: 'female' },
] as const;

// Supported languages for translation and TTS
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', rtl: false },
  { code: 'ar', name: 'Arabic', rtl: true },
  { code: 'hi', name: 'Hindi', rtl: false },
  { code: 'ur', name: 'Urdu', rtl: true },
  { code: 'zh', name: 'Chinese', rtl: false },
  { code: 'es', name: 'Spanish', rtl: false },
  { code: 'fr', name: 'French', rtl: false },
  { code: 'de', name: 'German', rtl: false },
  { code: 'ru', name: 'Russian', rtl: false },
  { code: 'pt', name: 'Portuguese', rtl: false },
  { code: 'ja', name: 'Japanese', rtl: false },
  { code: 'ko', name: 'Korean', rtl: false },
  { code: 'it', name: 'Italian', rtl: false },
  { code: 'nl', name: 'Dutch', rtl: false },
  { code: 'tr', name: 'Turkish', rtl: false },
  { code: 'fa', name: 'Persian', rtl: true },
  { code: 'he', name: 'Hebrew', rtl: true },
  { code: 'pl', name: 'Polish', rtl: false },
  { code: 'th', name: 'Thai', rtl: false },
  { code: 'vi', name: 'Vietnamese', rtl: false },
  { code: 'id', name: 'Indonesian', rtl: false },
  { code: 'ms', name: 'Malay', rtl: false },
  { code: 'tl', name: 'Tagalog', rtl: false },
  { code: 'bn', name: 'Bengali', rtl: false },
  { code: 'ta', name: 'Tamil', rtl: false },
  { code: 'te', name: 'Telugu', rtl: false },
  { code: 'ml', name: 'Malayalam', rtl: false },
  { code: 'sw', name: 'Swahili', rtl: false },
] as const;

// Export presets
export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'reels', name: 'Reels/TikTok', width: 1080, height: 1920, aspectRatio: '9:16', platform: 'tiktok', icon: '📱' },
  { id: 'youtube', name: 'YouTube', width: 1920, height: 1080, aspectRatio: '16:9', platform: 'youtube', icon: '▶️' },
  { id: 'instagram', name: 'Instagram Feed', width: 1080, height: 1080, aspectRatio: '1:1', platform: 'instagram', icon: '📷' },
  { id: 'portrait', name: 'Portrait', width: 1080, height: 1350, aspectRatio: '4:5', platform: 'instagram', icon: '🖼️' },
];

// Subtitle styles
export const SUBTITLE_STYLES = [
  { id: 'clean', name: 'Premium Clean', description: 'White text, subtle shadow' },
  { id: 'bold', name: 'Social Bold', description: 'Large text with background' },
  { id: 'highlight', name: 'Karaoke Highlight', description: 'Word-by-word animation' },
  { id: 'lower-third', name: 'Lower Third', description: 'Luxury branded style' },
] as const;

// Color filter presets
export const FILTER_PRESETS = [
  { id: 'none', name: 'None' },
  { id: 'warm', name: 'Warm' },
  { id: 'cool', name: 'Cool' },
  { id: 'cinematic', name: 'Cinematic' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'luxury-gold', name: 'Luxury Gold' },
] as const;

// Transition types
export const TRANSITION_TYPES = [
  { id: 'fade', name: 'Fade', icon: '◐' },
  { id: 'dissolve', name: 'Dissolve', icon: '◑' },
  { id: 'slide-left', name: 'Slide Left', icon: '◀' },
  { id: 'slide-right', name: 'Slide Right', icon: '▶' },
  { id: 'zoom-in', name: 'Zoom In', icon: '🔍' },
  { id: 'wipe', name: 'Wipe', icon: '▬' },
] as const;
