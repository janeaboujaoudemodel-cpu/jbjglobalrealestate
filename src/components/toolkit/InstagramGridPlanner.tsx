/**
 * Instagram Grid Planner — two-mode component
 * Preview Mode: visual grid + per-photo caption panel
 * Instagram Connect Mode: Post Now + Schedule wired to backend
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Grid3x3, Upload, Plus, Trash2, Send, CheckCircle2, Clock, Loader2,
  ExternalLink, AlertCircle, Instagram, CalendarIcon, ImageIcon, Pencil,
  ChevronRight, X, Hash, RotateCcw, Copy, Bell, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, startOfMinute } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ── Design tokens (match BeautyFilters.tsx) ──────────────────────────────────
const I = {
  bg: "#0C0E14",
  surface: "rgba(99,102,241,0.06)",
  border: "rgba(99,102,241,0.2)",
  borderHover: "rgba(99,102,241,0.55)",
  accent: "#6366F1",
  text: "#818CF8",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  btnGrad: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
  btnShadow: "0 4px 20px rgba(99,102,241,0.4)",
  igGrad: "linear-gradient(135deg, #E1306C, #833AB4)",
  igShadow: "0 4px 20px rgba(225,48,108,0.4)",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface GridPhoto {
  id: string;
  url: string;
  file?: File;
  caption: string;
  scheduledAt?: string; // ISO
}

interface PublishedRecord {
  postUrl: string;
  postedAt: string;
  postId?: string;
}

interface ScheduledRecord {
  dbId: string;
  scheduledAt: string;
}

const HASHTAG_SUGGESTIONS: Record<string, string[]> = {
  realestate: ['#realestate', '#dubai', '#property', '#luxuryliving', '#investment', '#jbj'],
  luxury: ['#luxury', '#luxuryrealestate', '#highend', '#premium', '#exclusivelisting'],
  lifestyle: ['#lifestyle', '#interiordesign', '#architecture', '#homesweethome', '#dreamhome'],
  business: ['#business', '#entrepreneur', '#success', '#realestateagent', '#broker'],
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: I.text }}>{children}</h4>
);

function CaptionPanel({
  photo,
  onUpdate,
  onClose,
}: {
  photo: GridPhoto;
  onUpdate: (caption: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(photo.caption);
  const charLimit = 2200;
  const remaining = charLimit - draft.length;

  const addHashtag = (tag: string) => {
    const updated = draft ? `${draft} ${tag}` : tag;
    setDraft(updated);
  };

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: I.surface, border: `1px solid ${I.borderHover}` }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Pencil className="h-3 w-3" style={{ color: I.text }} />
          Edit Caption
        </p>
        <button onClick={onClose} className="p-1 rounded" style={{ color: I.dim }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Preview thumbnail */}
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
          <img src={photo.url} alt="" className="w-full h-full object-cover" />
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Write a caption… use # for hashtags and @ for mentions"
          rows={4}
          maxLength={charLimit}
          className="flex-1 text-xs text-white bg-transparent resize-none outline-none placeholder:text-white/30 leading-relaxed"
          style={{ borderBottom: `1px solid ${I.border}` }}
          autoFocus
        />
      </div>

      {/* Character count */}
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: remaining < 50 ? '#EF4444' : I.dim }}>
          {remaining} characters remaining
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setDraft('')}
            title="Clear"
            className="p-1 rounded" style={{ color: I.dim }}>
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(draft); toast.success('Caption copied'); }}
            title="Copy"
            className="p-1 rounded" style={{ color: I.dim }}>
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Hashtag pills */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold" style={{ color: I.text }}>
          <Hash className="h-3 w-3 inline mr-1" />Quick Hashtags
        </p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(HASHTAG_SUGGESTIONS).map(([category, tags]) =>
            tags.slice(0, 3).map(tag => (
              <button
                key={tag}
                onClick={() => addHashtag(tag)}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(99,102,241,0.15)", border: `1px solid rgba(99,102,241,0.3)`, color: I.text }}>
                {tag}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={() => { onUpdate(draft); onClose(); toast.success('Caption saved'); }}
        className="w-full py-2 rounded-lg text-xs font-semibold text-white"
        style={{ background: I.btnGrad, boxShadow: I.btnShadow }}>
        Save Caption
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  presets?: string[];
  selectedPreset?: string;
}

export default function InstagramGridPlanner({ selectedPreset }: Props) {
  const gridFileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<GridPhoto[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'preview' | 'instagram'>('preview');

  // Preview mode state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Instagram Connect state
  const [igConnected, setIgConnected] = useState(false);
  const [igAccessToken, setIgAccessToken] = useState('');
  const [igAccountId, setIgAccountId] = useState('');
  const [igAccountName, setIgAccountName] = useState('');
  const [showIgSetup, setShowIgSetup] = useState(false);

  // Per-photo action state
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [publishedMap, setPublishedMap] = useState<Record<string, PublishedRecord>>({});
  const [scheduledMap, setScheduledMap] = useState<Record<string, ScheduledRecord>>({});
  const [scheduleDateMap, setScheduleDateMap] = useState<Record<string, { date?: Date; time: string }>>({}); // photoId → { date, time }

  // Scheduled posts list from DB
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  // ── Fetch scheduled posts from DB ──────────────────────────────────────────
  const fetchScheduledPosts = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setLoadingScheduled(true);
    const { data } = await supabase
      .from('instagram_scheduled_posts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('scheduled_at', { ascending: true });
    setScheduledPosts(data || []);
    setLoadingScheduled(false);
  }, []);

  useEffect(() => {
    if (mode === 'instagram') fetchScheduledPosts();
  }, [mode, fetchScheduledPosts]);

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: GridPhoto[] = files.map(f => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      file: f,
      caption: '',
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  }, []);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    setPhotos(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(idx, 0, moved);
      return arr;
    });
    setDragIndex(idx);
  };

  // ── Caption update ─────────────────────────────────────────────────────────
  const updateCaption = (id: string, caption: string) =>
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, caption } : p));

  // ── IG Connect ─────────────────────────────────────────────────────────────
  const handleConnect = () => {
    if (!igAccessToken.trim() || !igAccountId.trim()) {
      toast.error('Enter both Access Token and Account ID');
      return;
    }
    setIgConnected(true);
    setIgAccountName(`@account_${igAccountId.slice(-4)}`);
    setShowIgSetup(false);
    toast.success('Instagram Business account connected!');
  };

  const handleDisconnect = () => {
    setIgConnected(false);
    setIgAccessToken('');
    setIgAccountId('');
    setIgAccountName('');
    toast.info('Disconnected');
  };

  // ── Convert blob URL to base64 ─────────────────────────────────────────────
  const toDataUrl = async (url: string): Promise<string> => {
    const blob = await fetch(url).then(r => r.blob());
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // ── Post Now ───────────────────────────────────────────────────────────────
  const handlePostNow = async (photo: GridPhoto) => {
    if (!igConnected) { toast.error('Connect Instagram first'); return; }
    if (publishedMap[photo.id]) { toast.info('Already posted'); return; }

    setPublishingId(photo.id);
    try {
      const imageDataUrl = await toDataUrl(photo.url);
      const { data, error } = await supabase.functions.invoke('instagram-publish', {
        body: { imageDataUrl, caption: photo.caption, accessToken: igAccessToken, accountId: igAccountId },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Publish failed');
      setPublishedMap(prev => ({
        ...prev,
        [photo.id]: { postUrl: data.postUrl, postedAt: format(new Date(), 'MMM d, HH:mm'), postId: data.postId },
      }));
      toast.success('Posted to Instagram! 🎉');
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPublishingId(null);
    }
  };

  // ── Compute ISO from date+time picker ─────────────────────────────────────
  const getScheduledISO = (photoId: string): string | null => {
    const entry = scheduleDateMap[photoId];
    if (!entry?.date || !entry?.time) return null;
    const [hours, minutes] = entry.time.split(':').map(Number);
    const dt = new Date(entry.date);
    dt.setHours(hours, minutes, 0, 0);
    return dt.toISOString();
  };

  // ── Schedule ───────────────────────────────────────────────────────────────
  const handleSchedule = async (photo: GridPhoto) => {
    if (!igConnected) { toast.error('Connect Instagram first'); return; }
    const scheduledAtISO = getScheduledISO(photo.id);
    if (!scheduledAtISO) { toast.error('Pick a date & time to schedule'); return; }
    if (new Date(scheduledAtISO) <= new Date()) { toast.error('Scheduled time must be in the future'); return; }

    setSchedulingId(photo.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Upload image to storage for the scheduled post
      const imageDataUrl = await toDataUrl(photo.url);
      const base64Match = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!base64Match) throw new Error('Invalid image');
      const mimeType = base64Match[1];
      const binaryData = Uint8Array.from(atob(base64Match[2]), c => c.charCodeAt(0));
      const ext = mimeType.split('/')[1] || 'jpg';
      const fileName = `scheduled/${session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('instagram-grid-photos')
        .upload(fileName, binaryData, { contentType: mimeType, upsert: false });
      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage.from('instagram-grid-photos').getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      // Insert into DB — include credentials so cron job can publish
      const { data: inserted, error: dbErr } = await supabase
        .from('instagram_scheduled_posts')
        .insert({
          user_id: session.user.id,
          image_url: imageUrl,
          caption: photo.caption,
          scheduled_at: scheduledAtISO,
          status: 'scheduled',
          access_token: igAccessToken,
          account_id: igAccountId,
        })
        .select('id')
        .single();
      if (dbErr) throw new Error(`Schedule failed: ${dbErr.message}`);

      setScheduledMap(prev => ({
        ...prev,
        [photo.id]: { dbId: inserted.id, scheduledAt: scheduledAtISO },
      }));
      toast.success(`Scheduled for ${format(new Date(scheduledAtISO), 'MMM d, HH:mm')} ✅`);
      fetchScheduledPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Schedule failed');
    } finally {
      setSchedulingId(null);
    }
  };

  // ── Cancel scheduled ────────────────────────────────────────────────────────
  const handleCancelSchedule = async (photoId: string) => {
    const rec = scheduledMap[photoId];
    if (!rec) return;
    await supabase.from('instagram_scheduled_posts').update({ status: 'cancelled' }).eq('id', rec.dbId);
    setScheduledMap(prev => { const n = { ...prev }; delete n[photoId]; return n; });
    toast.info('Scheduled post cancelled');
    fetchScheduledPosts();
  };

  const editingPhoto = photos.find(p => p.id === editingId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" style={{ color: I.text }} />
            Instagram Grid Planner
          </h3>
          <p className="text-xs mt-0.5" style={{ color: I.muted }}>
            Plan your feed layout · Add captions · Publish or schedule directly
          </p>
        </div>
        <button
          onClick={() => gridFileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: I.btnGrad, boxShadow: I.btnShadow }}>
          <Plus className="h-4 w-4" /> Add Photos
        </button>
        <input ref={gridFileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
      </div>

      {/* Mode Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${I.border}` }}>
        {([
          { m: 'preview', Icon: Grid3x3, label: 'Preview Mode', desc: 'Plan layout · Add captions' },
          { m: 'instagram', Icon: Instagram, label: 'Instagram Connect', desc: 'Post Now · Schedule' },
        ] as const).map(({ m, Icon, label, desc }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200"
            style={{
              background: mode === m ? I.igGrad : 'transparent',
              boxShadow: mode === m ? I.igShadow : 'none',
            }}>
            <Icon className="h-4 w-4 shrink-0" style={{ color: mode === m ? '#fff' : I.text }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: mode === m ? '#fff' : I.text }}>{label}</p>
              <p className="text-[10px]" style={{ color: mode === m ? 'rgba(255,255,255,0.7)' : I.dim }}>{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── PREVIEW MODE ── */}
      {mode === 'preview' && (
        <div className="space-y-4">
          {photos.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center cursor-pointer"
              style={{ border: `2px dashed ${I.border}`, background: I.surface }}
              onClick={() => gridFileInputRef.current?.click()}>
              <Grid3x3 className="h-12 w-12 mx-auto mb-4" style={{ color: "rgba(99,102,241,0.4)" }} />
              <p className="text-white font-semibold mb-1">Drop photos to start planning</p>
              <p className="text-xs mb-5" style={{ color: I.dim }}>
                Drag to rearrange · Click ✏ to write captions · Apply presets
              </p>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: I.btnGrad, boxShadow: I.btnShadow }}>
                <Upload className="h-4 w-4" /> Upload Photos
              </span>
            </div>
          ) : (
            <>
              {/* Grid */}
              <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                <SectionLabel>📱 Feed Preview — drag to rearrange · click ✏ to add caption</SectionLabel>
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: Math.max(9, Math.ceil(photos.length / 3) * 3) }, (_, i) => {
                    const photo = photos[i];
                    const isSelected = editingId === photo?.id;
                    return (
                      <div
                        key={i}
                        draggable={!!photo}
                        onDragStart={() => photo && handleDragStart(i)}
                        onDragOver={e => photo && handleDragOver(e, i)}
                        onDragEnd={() => setDragIndex(null)}
                        onClick={() => photo && setEditingId(isSelected ? null : photo.id)}
                        className="relative aspect-square rounded-sm overflow-hidden cursor-pointer group"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: isSelected ? `2px solid #E1306C` : `1px solid rgba(255,255,255,0.06)`,
                        }}>
                        {photo ? (
                          <>
                            <img src={photo.url} alt="" className="w-full h-full object-cover" />

                            {/* Caption badge */}
                            {photo.caption && !isSelected && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-[8px] leading-tight line-clamp-2">{photo.caption}</p>
                              </div>
                            )}

                            {/* Selected ring label */}
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center"
                                style={{ background: "rgba(225,48,108,0.15)" }}>
                                <Pencil className="h-5 w-5 text-white" />
                              </div>
                            )}

                            {/* Caption indicator dot */}
                            {photo.caption && (
                              <div className="absolute top-1 left-1 w-2 h-2 rounded-full"
                                style={{ background: '#22C55E' }} title="Has caption" />
                            )}

                            {/* Action buttons */}
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={e => { e.stopPropagation(); setEditingId(photo.id); }}
                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(99,102,241,0.9)' }}>
                                <Pencil className="h-2.5 w-2.5 text-white" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setPhotos(prev => prev.filter((_, gi) => gi !== i)); if (editingId === photo.id) setEditingId(null); }}
                                className="w-5 h-5 rounded-full flex items-center justify-center bg-red-500/80">
                                <Trash2 className="h-2.5 w-2.5 text-white" />
                              </button>
                            </div>

                            {/* Position label */}
                            <div className="absolute bottom-1 right-1 text-[8px] font-bold px-1 rounded"
                              style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)" }}>
                              #{i + 1}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-4 w-4" style={{ color: "rgba(255,255,255,0.1)" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${I.border}` }}>
                  <p className="text-[10px]" style={{ color: I.dim }}>
                    <span className="text-white font-semibold">{photos.length}</span> photo{photos.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px]" style={{ color: I.dim }}>
                    <span className="text-white font-semibold">{photos.filter(p => p.caption).length}</span> with captions
                  </p>
                  <p className="text-[10px]" style={{ color: I.dim }}>
                    <span className="text-white font-semibold">{Math.ceil(photos.length / 3)}</span> rows
                  </p>
                </div>
              </div>

              {/* Caption editor panel */}
              {editingId && editingPhoto && (
                <CaptionPanel
                  photo={editingPhoto}
                  onUpdate={caption => updateCaption(editingId, caption)}
                  onClose={() => setEditingId(null)}
                />
              )}

              {/* Quick caption list (all photos) */}
              {!editingId && (
                <div className="rounded-xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                  <SectionLabel>✏️ All Captions</SectionLabel>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {photos.map((photo, idx) => (
                      <div key={photo.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                          <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            value={photo.caption}
                            onChange={e => updateCaption(photo.id, e.target.value)}
                            placeholder={`Caption for photo #${idx + 1}…`}
                            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"
                            style={{ borderBottom: `1px solid ${I.border}`, paddingBottom: 4 }}
                          />
                        </div>
                        <button
                          onClick={() => setEditingId(photo.id)}
                          className="p-1 shrink-0 rounded"
                          style={{ color: I.text }}>
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPhotos(prev => prev.map(p => ({ ...p, caption: '' })))}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ background: "rgba(99,102,241,0.15)", border: `1px solid rgba(99,102,241,0.3)` }}>
                  <RotateCcw className="h-4 w-4" /> Clear All Captions
                </button>
                <button
                  onClick={() => setMode('instagram')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: I.igGrad, boxShadow: I.igShadow }}>
                  <Send className="h-4 w-4" /> Connect & Publish
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── INSTAGRAM CONNECT MODE ── */}
      {mode === 'instagram' && (
        <div className="space-y-4">
          {/* Connection card */}
          {!igConnected ? (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(225,48,108,0.15)", border: "1px solid rgba(225,48,108,0.3)" }}>
                  <Instagram className="h-5 w-5" style={{ color: "#E1306C" }} />
                </div>
                <div>
                  <p className="text-white font-semibold">Connect Instagram Business Account</p>
                  <p className="text-xs" style={{ color: I.muted }}>Business or Creator account required</p>
                </div>
              </div>

              {!showIgSetup ? (
                <div className="space-y-3">
                  <div className="rounded-xl p-4 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-xs font-semibold text-white mb-2">Setup Steps</p>
                    {[
                      '1. Go to developers.facebook.com → My Apps → Create App',
                      '2. Add Instagram Graph API product to your app',
                      '3. Request instagram_content_publish permission',
                      '4. Generate a long-lived access token (60-day validity)',
                      '5. Find your Instagram Business User ID via API Explorer',
                    ].map(step => (
                      <p key={step} className="text-[11px] flex gap-2" style={{ color: I.dim }}>
                        <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" style={{ color: I.text }} />{step}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowIgSetup(true)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: I.igGrad, boxShadow: I.igShadow }}>
                    Enter Credentials
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Access Token', value: igAccessToken, setter: setIgAccessToken, type: 'password', placeholder: 'EAAxxxxx… (long-lived token)' },
                    { label: 'Instagram Business Account ID', value: igAccountId, setter: setIgAccountId, type: 'text', placeholder: '17841400000000000' },
                  ].map(({ label, value, setter, type, placeholder }) => (
                    <div key={label}>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: I.text }}>{label}</label>
                      <input
                        type={type}
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white bg-transparent outline-none"
                        style={{ border: `1px solid ${I.border}`, background: "rgba(255,255,255,0.04)" }} />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => setShowIgSetup(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                      style={{ border: `1px solid ${I.border}`, color: I.muted }}>Cancel</button>
                    <button onClick={handleConnect}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: I.igGrad }}>Connect Account</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" style={{ color: "#22C55E" }} />
                <p className="text-sm font-semibold text-white">Connected: {igAccountName}</p>
              </div>
              <button onClick={handleDisconnect} className="text-xs px-3 py-1 rounded-lg"
                style={{ color: I.dim, border: `1px solid ${I.border}` }}>Disconnect</button>
            </div>
          )}

          {/* Photos queue */}
          {photos.length === 0 ? (
            <div className="rounded-2xl p-8 text-center cursor-pointer"
              style={{ border: `2px dashed ${I.border}`, background: I.surface }}
              onClick={() => gridFileInputRef.current?.click()}>
              <ImageIcon className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(99,102,241,0.4)" }} />
              <p className="text-white font-semibold mb-1">No photos in queue</p>
              <p className="text-xs mb-4" style={{ color: I.dim }}>
                Add photos via the button above or switch to Preview Mode first
              </p>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: I.btnGrad }}>
                <Upload className="h-4 w-4" /> Add Photos
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <SectionLabel>📤 Publishing Queue ({photos.length} photo{photos.length !== 1 ? 's' : ''})</SectionLabel>
              {photos.map(photo => {
                const posted = publishedMap[photo.id];
                const scheduled = scheduledMap[photo.id];
                const isPosting = publishingId === photo.id;
                const isScheduling = schedulingId === photo.id;
                const schedEntry = scheduleDateMap[photo.id];
                const hasSchedule = !!(schedEntry?.date && schedEntry?.time);
                const scheduledISO = getScheduledISO(photo.id);

                return (
                  <div key={photo.id}
                    className="rounded-xl p-4"
                    style={{
                      background: I.surface,
                      border: `1px solid ${posted ? 'rgba(34,197,94,0.4)' : scheduled ? 'rgba(234,179,8,0.4)' : I.border}`,
                    }}>
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative">
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        {posted && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: "rgba(34,197,94,0.4)" }}>
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                        )}
                        {scheduled && !posted && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: "rgba(234,179,8,0.4)" }}>
                            <Bell className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Caption */}
                        <textarea
                          value={photo.caption}
                          onChange={e => updateCaption(photo.id, e.target.value)}
                          placeholder="Write a caption for this post…"
                          rows={2}
                          disabled={!!posted || !!scheduled}
                          className="w-full bg-transparent text-white text-xs resize-none outline-none placeholder:text-white/30 leading-relaxed"
                          style={{ borderBottom: (posted || scheduled) ? 'none' : `1px solid ${I.border}`, paddingBottom: 4 }}
                        />

                        {/* Status badges */}
                        {posted ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
                              <CheckCircle2 className="h-2.5 w-2.5" /> POSTED {posted.postedAt}
                            </span>
                            <a href={posted.postUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: I.text }}>
                              <ExternalLink className="h-2.5 w-2.5" /> View Post
                            </a>
                          </div>
                        ) : scheduled ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: "rgba(234,179,8,0.15)", color: "#EAB308" }}>
                              <Clock className="h-2.5 w-2.5" /> SCHEDULED {format(new Date(scheduled.scheduledAt), 'MMM d, HH:mm')}
                            </span>
                            <button
                              onClick={() => handleCancelSchedule(photo.id)}
                              className="text-[10px] px-2 py-0.5 rounded"
                              style={{ color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* ── Shadcn Calendar Date + Time Picker ── */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Date Picker */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    className={cn(
                                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                                      schedEntry?.date ? "text-white" : "text-white/40"
                                    )}
                                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${I.border}` }}>
                                    <CalendarDays className="h-3 w-3" style={{ color: I.text }} />
                                    {schedEntry?.date
                                      ? format(schedEntry.date, 'MMM d, yyyy')
                                      : 'Pick date'}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0 z-50"
                                  align="start"
                                  style={{ background: "#1a1c23", border: `1px solid ${I.border}` }}>
                                  <Calendar
                                    mode="single"
                                    selected={schedEntry?.date}
                                    onSelect={(date) =>
                                      setScheduleDateMap(prev => ({
                                        ...prev,
                                        [photo.id]: { ...prev[photo.id], date, time: prev[photo.id]?.time || '10:00' },
                                      }))
                                    }
                                    disabled={(d) => d < addMinutes(new Date(), 5)}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto text-white")}
                                  />
                                </PopoverContent>
                              </Popover>

                              {/* Time input */}
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${I.border}` }}>
                                <Clock className="h-3 w-3 shrink-0" style={{ color: I.text }} />
                                <input
                                  type="time"
                                  value={schedEntry?.time || ''}
                                  onChange={e =>
                                    setScheduleDateMap(prev => ({
                                      ...prev,
                                      [photo.id]: { ...prev[photo.id], time: e.target.value },
                                    }))
                                  }
                                  className="bg-transparent text-white text-[11px] outline-none w-[72px]"
                                  style={{ colorScheme: 'dark' }}
                                />
                              </div>

                              {/* Scheduled label */}
                              {scheduledISO && (
                                <span className="text-[10px]" style={{ color: I.dim }}>
                                  → {format(new Date(scheduledISO), 'EEE MMM d, HH:mm')}
                                </span>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                                className="p-1.5 rounded-lg" style={{ color: I.dim }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>

                              {/* Schedule button */}
                              <button
                                onClick={() => handleSchedule(photo)}
                                disabled={!igConnected || isScheduling || !hasSchedule}
                                title={!hasSchedule ? 'Pick a date & time to schedule' : ''}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-all"
                                style={{
                                  background: igConnected && hasSchedule ? "rgba(234,179,8,0.25)" : "rgba(99,102,241,0.2)",
                                  border: `1px solid ${igConnected && hasSchedule ? 'rgba(234,179,8,0.5)' : 'transparent'}`,
                                }}>
                                {isScheduling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
                                {isScheduling ? 'Saving…' : 'Schedule'}
                              </button>

                              {/* Post Now button */}
                              <button
                                onClick={() => handlePostNow(photo)}
                                disabled={!igConnected || isPosting}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                                style={{ background: igConnected ? I.igGrad : "rgba(99,102,241,0.2)" }}>
                                {isPosting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                {isPosting ? 'Posting…' : 'Post Now'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Post All Drafts */}
              {igConnected && photos.some(p => !publishedMap[p.id] && !scheduledMap[p.id]) && (
                <button
                  onClick={async () => {
                    const drafts = photos.filter(p => !publishedMap[p.id] && !scheduledMap[p.id]);
                    toast.info(`Posting ${drafts.length} draft(s)…`);
                    for (const photo of drafts) await handlePostNow(photo);
                  }}
                  disabled={!!publishingId}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: I.igGrad, boxShadow: I.igShadow }}>
                  <Send className="h-4 w-4" />
                  Post All Drafts ({photos.filter(p => !publishedMap[p.id] && !scheduledMap[p.id]).length})
                </button>
              )}
            </div>
          )}

          {/* Scheduled Queue from DB */}
          {scheduledPosts.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: I.surface, border: `1px solid rgba(234,179,8,0.25)` }}>
              <SectionLabel>⏰ Scheduled Queue ({scheduledPosts.filter(p => p.status === 'scheduled').length} pending)</SectionLabel>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scheduledPosts.map(post => (
                  <div key={post.id} className="flex items-center gap-3 py-2"
                    style={{ borderBottom: `1px solid ${I.border}` }}>
                    <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white truncate">{post.caption || '(no caption)'}</p>
                      <p className="text-[9px]" style={{ color: I.dim }}>
                        {format(new Date(post.scheduled_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      post.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      post.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      post.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {post.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API note */}
          <div className="rounded-xl p-3 flex items-start gap-2"
            style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.2)" }}>
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#EAB308" }} />
            <p className="text-[10px]" style={{ color: I.dim }}>
              Instagram requires a <strong className="text-white">Business or Creator</strong> account. Personal accounts cannot publish via API. Access tokens expire every 60 days and must be renewed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
