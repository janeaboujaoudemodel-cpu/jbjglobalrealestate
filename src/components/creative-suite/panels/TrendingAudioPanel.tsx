import React, { useState, useEffect } from 'react';
import { Music, TrendingUp, Play, Pause, Plus, Search, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { TrendingAudio } from '../types';

interface TrendingAudioPanelProps {
  platform: string;
  onSelectAudio: (audio: TrendingAudio) => void;
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'upbeat', label: 'Upbeat' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'ambient', label: 'Ambient' },
];

const REGIONS = [
  { value: 'global', label: 'Global' },
  { value: 'uae', label: 'UAE' },
  { value: 'gcc', label: 'GCC' },
  { value: 'usa', label: 'USA' },
  { value: 'europe', label: 'Europe' },
];

// Mock trending audio data (would come from API in production)
const MOCK_TRENDING: TrendingAudio[] = [
  { id: '1', platform: 'instagram', region: 'global', category: 'upbeat', audio_title: 'Money Rain', audio_artist: 'Travis Scott', trend_score: 98, usage_count: 1200000 },
  { id: '2', platform: 'instagram', region: 'global', category: 'luxury', audio_title: 'Started From The Bottom', audio_artist: 'Drake', trend_score: 95, usage_count: 890000 },
  { id: '3', platform: 'tiktok', region: 'global', category: 'energetic', audio_title: 'Rich Flex', audio_artist: '21 Savage', trend_score: 92, usage_count: 750000 },
  { id: '4', platform: 'instagram', region: 'uae', category: 'luxury', audio_title: 'Dubai Nights', audio_artist: 'Arabic Remix', trend_score: 88, usage_count: 450000 },
  { id: '5', platform: 'tiktok', region: 'global', category: 'upbeat', audio_title: 'Chill Vibes', audio_artist: 'Lo-Fi Beats', trend_score: 85, usage_count: 320000 },
];

export function TrendingAudioPanel({ platform, onSelectAudio }: TrendingAudioPanelProps) {
  const [audios, setAudios] = useState<TrendingAudio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('global');
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    loadTrendingAudio();
  }, [platform, category, region]);

  const loadTrendingAudio = async () => {
    setIsLoading(true);
    try {
      // Try to load from database first
      const { data, error } = await supabase
        .from('studio_trending_audio')
        .select('*')
        .eq('platform', platform)
        .order('trend_score', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        setAudios(data.map((a) => ({
          id: a.id,
          platform: a.platform,
          region: a.region || 'global',
          category: a.category || undefined,
          audio_title: a.audio_title,
          audio_artist: a.audio_artist || undefined,
          audio_url: a.audio_url || undefined,
          preview_url: a.preview_url || undefined,
          trend_score: a.trend_score || 0,
          usage_count: a.usage_count || 0,
        })));
      } else {
        // Use mock data if no data in database
        setAudios(MOCK_TRENDING.filter((a) => 
          a.platform === platform || a.platform === 'instagram'
        ));
      }
    } catch (err) {
      console.error('Failed to load trending audio:', err);
      setAudios(MOCK_TRENDING.filter((a) => 
        a.platform === platform || a.platform === 'instagram'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAudios = audios.filter((audio) => {
    const matchesSearch = !search || 
      audio.audio_title.toLowerCase().includes(search.toLowerCase()) ||
      audio.audio_artist?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || audio.category === category;
    const matchesRegion = region === 'global' || audio.region === region;
    return matchesSearch && matchesCategory && matchesRegion;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const togglePlay = (audioId: string) => {
    setPlayingId((prev) => (prev === audioId ? null : audioId));
    // In production, would actually play audio preview
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="font-semibold text-white">Trending Audio</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audio..."
              className="pl-10 bg-slate-900 border-slate-600 text-white text-sm"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-28 bg-slate-900 border-slate-600 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-28 bg-slate-900 border-slate-600 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-[#1A1A1A] animate-spin" />
          </div>
        ) : filteredAudios.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Music className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No trending audio found</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredAudios.map((audio, index) => (
              <div
                key={audio.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-6 text-center">
                  <span className={`text-sm font-bold ${index < 3 ? 'text-[#1A1A1A]' : 'text-slate-500'}`}>
                    {index + 1}
                  </span>
                </div>

                <button
                  onClick={() => togglePlay(audio.id)}
                  className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-[#EFE6D6]/20 transition-colors"
                >
                  {playingId === audio.id ? (
                    <Pause className="w-4 h-4 text-[#1A1A1A]" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{audio.audio_title}</p>
                  {audio.audio_artist && (
                    <p className="text-xs text-slate-400 truncate">{audio.audio_artist}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <TrendingUp className="w-3 h-3" />
                    {audio.trend_score}%
                  </div>
                  <p className="text-[10px] text-slate-500">{formatNumber(audio.usage_count)} uses</p>
                </div>

                <Button
                  size="sm"
                  onClick={() => onSelectAudio(audio)}
                  className="bg-[#EFE6D6]/20 hover:bg-[#EFE6D6]/30 text-[#1A1A1A]"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
