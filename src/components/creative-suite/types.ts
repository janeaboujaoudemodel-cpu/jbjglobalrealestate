/**
 * JBJ RealEstate Creative Suite™ Types
 */

export interface StudioProject {
  id: string;
  user_id?: string | null;
  session_id?: string | null;
  name: string;
  description?: string | null;
  status: 'draft' | 'published' | 'archived';
  project_type: 'video' | 'image' | 'pdf' | 'marketing_pack';
  property_id?: string | null;
  property_snapshot?: PropertySnapshot | null;
  timeline_state: TimelineState;
  canvas_settings: CanvasSettings;
  ai_settings: AICreativeSettings;
  is_shared: boolean;
  share_token?: string | null;
  share_mode: 'read_only' | 'collaborate';
  last_autosave_at?: string | null;
  autosave_version: number;
  thumbnail_url?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface PropertySnapshot {
  id: string;
  name: string;
  slug: string;
  developer_name?: string;
  area_name?: string;
  emirate?: string;
  location?: string;
  price_from?: number;
  price_to?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  payment_plan?: string;
  expected_completion?: string;
  cover_image_url?: string;
  images?: string[];
  amenities?: string[];
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface TimelineState {
  tracks: TimelineTrack[];
  duration: number;
  currentTime: number;
  zoom: number;
}

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'voiceover' | 'text' | 'effects' | 'overlay';
  name: string;
  locked: boolean;
  muted: boolean;
  clips: TimelineClip[];
}

export interface TimelineClip {
  id: string;
  trackId: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'subtitle' | 'effect' | 'overlay';
  name: string;
  startTime: number;
  duration: number;
  source: ClipSource;
  transform: ClipTransform;
  effects: ClipEffect[];
  keyframes: ClipKeyframe[];
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

export interface ClipEffect {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface ClipKeyframe {
  id: string;
  time: number;
  property: 'x' | 'y' | 'scaleX' | 'scaleY' | 'rotation' | 'opacity';
  value: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface CanvasSettings {
  format: '16:9' | '9:16' | '1:1' | '4:5';
  quality: '720p' | '1080p' | '4k';
  backgroundColor?: string;
  safeZones?: boolean;
}

export interface AICreativeSettings {
  creativityLevel: 'safe' | 'balanced' | 'bold';
  brandStrictness: 'minimal' | 'branded' | 'fully_branded';
  targetAudience: 'investors' | 'end_users' | 'brokers';
  promptHistory: AIPrompt[];
}

export interface AIPrompt {
  id: string;
  prompt: string;
  response?: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

// Social Media Publishing
export interface SocialConnection {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin';
  account_name?: string;
  account_id?: string;
  is_active: boolean;
  last_used_at?: string;
}

export interface PublishingPreset {
  id: string;
  name: string;
  is_default: boolean;
  platforms: string[];
  caption_template?: string;
  hashtag_sets: HashtagSet[];
  cta_text?: string;
  contact_info?: ContactInfo;
  tone: 'professional' | 'casual' | 'luxury' | 'urgent';
  language: string;
}

export interface HashtagSet {
  name: string;
  hashtags: string[];
}

export interface ContactInfo {
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
}

export interface ScheduledPost {
  id: string;
  project_id: string;
  platform: string;
  post_type: 'reel' | 'story' | 'post' | 'short';
  content_url?: string;
  caption?: string;
  hashtags?: string[];
  scheduled_for: string;
  timezone: string;
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled';
}

// Trending Audio
export interface TrendingAudio {
  id: string;
  platform: string;
  region: string;
  category?: string;
  audio_title: string;
  audio_artist?: string;
  audio_url?: string;
  preview_url?: string;
  trend_score: number;
  usage_count: number;
}

// Export Presets
export interface ExportPreset {
  id: string;
  name: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general';
  format: 'reel' | 'story' | 'post' | 'short' | 'video';
  width: number;
  height: number;
  aspectRatio: string;
  icon: string;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'reels_9x16', name: 'Reels / TikTok', platform: 'instagram', format: 'reel', width: 1080, height: 1920, aspectRatio: '9:16', icon: '📱' },
  { id: 'youtube_16x9', name: 'YouTube', platform: 'youtube', format: 'video', width: 1920, height: 1080, aspectRatio: '16:9', icon: '🎬' },
  { id: 'square_1x1', name: 'Square Post', platform: 'instagram', format: 'post', width: 1080, height: 1080, aspectRatio: '1:1', icon: '⬜' },
  { id: 'portrait_4x5', name: 'Portrait', platform: 'instagram', format: 'post', width: 1080, height: 1350, aspectRatio: '4:5', icon: '📷' },
  { id: 'story_9x16', name: 'Story', platform: 'instagram', format: 'story', width: 1080, height: 1920, aspectRatio: '9:16', icon: '📲' },
  { id: 'shorts_9x16', name: 'YouTube Shorts', platform: 'youtube', format: 'short', width: 1080, height: 1920, aspectRatio: '9:16', icon: '▶️' },
];

// Creative Jobs
export interface CreativeJob {
  id: string;
  project_id?: string;
  job_type: 'render' | 'transcribe' | 'translate' | 'reframe' | 'pdf_generate' | 'ai_generate' | 'publish';
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error_message?: string;
  created_at: string;
}

// Marketing Pack
export interface MarketingPack {
  reelsVideo?: string;
  youtubeVideo?: string;
  squareVideo?: string;
  storyVideo?: string;
  thumbnails: string[];
  pdfFlyer?: string;
  captions: {
    platform: string;
    caption: string;
    hashtags: string[];
  }[];
  subtitles?: {
    language: string;
    srt?: string;
    vtt?: string;
  }[];
}
