import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SocialConnection, PublishingPreset, ScheduledPost } from '../types';
import type { Json } from '@/integrations/supabase/types';

export function useSocialPublishing() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [presets, setPresets] = useState<PublishingPreset[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load connections and presets
  useEffect(() => {
    loadConnections();
    loadPresets();
  }, []);

  const loadConnections = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('studio_social_accounts')
        .select('*')
        .eq('user_id', userData.user.id);

      if (error) throw error;
      setConnections(data?.map((c) => ({
        id: c.id,
        platform: c.platform as 'instagram' | 'tiktok' | 'youtube' | 'linkedin',
        account_name: c.account_name ?? undefined,
        account_id: c.account_id ?? undefined,
        is_active: c.is_connected ?? false,
        last_used_at: c.last_used_at ?? undefined,
      })) || []);
    } catch (err) {
      console.error('Failed to load connections:', err);
    }
  };

  const loadPresets = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('studio_publish_presets')
        .select('*')
        .eq('user_id', userData.user.id);

      if (error) throw error;
      setPresets(data?.map((p) => ({
        id: p.id,
        name: p.name,
        is_default: p.is_default ?? false,
        platforms: p.platform ? [p.platform] : [],
        caption_template: p.caption_template ?? undefined,
        hashtag_sets: (p.hashtag_sets as unknown as PublishingPreset['hashtag_sets']) || [],
        cta_text: p.cta_text ?? undefined,
        contact_info: p.contact_info as unknown as PublishingPreset['contact_info'],
        tone: (p.tone || 'professional') as 'professional' | 'casual' | 'luxury' | 'urgent',
        language: 'en',
      })) || []);
    } catch (err) {
      console.error('Failed to load presets:', err);
    }
  };

  const loadScheduledPosts = async (projectId?: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      let query = supabase
        .from('studio_scheduled_posts')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('scheduled_for');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setScheduledPosts(data?.map((p) => ({
        id: p.id,
        project_id: p.project_id ?? '',
        platform: p.platform,
        post_type: p.post_type as 'reel' | 'story' | 'post' | 'short',
        content_url: p.content_url ?? undefined,
        caption: p.caption ?? undefined,
        hashtags: p.hashtags ?? undefined,
        scheduled_for: p.scheduled_for,
        timezone: p.timezone ?? 'Asia/Dubai',
        status: p.status as 'scheduled' | 'posted' | 'failed' | 'cancelled',
      })) || []);
    } catch (err) {
      console.error('Failed to load scheduled posts:', err);
    }
  };

  const connectPlatform = useCallback(async (platform: string) => {
    // This would initiate OAuth flow - for now, show message
    toast.info(`Connect ${platform} coming soon. Use share link for now.`);
  }, []);

  const disconnectPlatform = useCallback(async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('studio_social_accounts')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      toast.success('Platform disconnected');
    } catch (err) {
      console.error('Failed to disconnect:', err);
      toast.error('Failed to disconnect platform');
    }
  }, []);

  const savePreset = useCallback(async (preset: Omit<PublishingPreset, 'id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Please sign in to save presets');
        return;
      }

      const { data, error } = await supabase
        .from('studio_publish_presets')
        .insert({
          user_id: userData.user.id,
          name: preset.name,
          is_default: preset.is_default,
          platform: preset.platforms[0] || 'instagram',
          caption_template: preset.caption_template ?? null,
          hashtag_sets: preset.hashtag_sets as unknown as Json,
          cta_text: preset.cta_text ?? null,
          contact_info: preset.contact_info as unknown as Json,
          tone: preset.tone,
        })
        .select()
        .single();

      if (error) throw error;
      await loadPresets();
      toast.success('Preset saved');
      return data;
    } catch (err) {
      console.error('Failed to save preset:', err);
      toast.error('Failed to save preset');
    }
  }, []);

  const schedulePost = useCallback(async (post: Omit<ScheduledPost, 'id' | 'status'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Please sign in to schedule posts');
        return;
      }

      const { data, error } = await supabase
        .from('studio_scheduled_posts')
        .insert({
          project_id: post.project_id,
          user_id: userData.user.id,
          platform: post.platform,
          post_type: post.post_type,
          content_url: post.content_url ?? null,
          caption: post.caption ?? null,
          hashtags: post.hashtags ?? null,
          scheduled_for: post.scheduled_for,
          timezone: post.timezone,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      await loadScheduledPosts(post.project_id);
      toast.success('Post scheduled');
      return data;
    } catch (err) {
      console.error('Failed to schedule post:', err);
      toast.error('Failed to schedule post');
    }
  }, []);

  const cancelScheduledPost = useCallback(async (postId: string) => {
    try {
      const { error } = await supabase
        .from('studio_scheduled_posts')
        .update({ status: 'cancelled' })
        .eq('id', postId);

      if (error) throw error;
      setScheduledPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: 'cancelled' as const } : p))
      );
      toast.success('Post cancelled');
    } catch (err) {
      console.error('Failed to cancel post:', err);
      toast.error('Failed to cancel post');
    }
  }, []);

  const generateCaption = useCallback((
    property: any,
    platform: string,
    tone: string = 'professional'
  ) => {
    const price = property?.price_from
      ? `AED ${(property.price_from / 1000000).toFixed(1)}M`
      : 'Price on request';
    const location = property?.area_name || property?.location || 'Dubai';
    const developer = property?.developer_name || '';
    const bedrooms = property?.bedrooms_min && property?.bedrooms_max
      ? `${property.bedrooms_min}-${property.bedrooms_max} BR`
      : '';

    const templates: Record<string, Record<string, string>> = {
      professional: {
        instagram: `🏠 ${property?.name || 'New Property'}\n\n📍 ${location}${developer ? ` by ${developer}` : ''}\n💰 Starting from ${price}${bedrooms ? `\n🛏️ ${bedrooms}` : ''}\n\n✨ Premium investment opportunity in Dubai's most sought-after location.\n\n📲 Contact us for exclusive viewing`,
        tiktok: `${property?.name || 'Dream Home'} in ${location} 🏠✨ ${price} | DM for details`,
        youtube: `${property?.name || 'Property Tour'} | ${location} | ${price} | JBJ Global Real Estate`,
        linkedin: `Presenting ${property?.name || 'an exceptional property'} in ${location}.\n\nKey highlights:\n• ${price}\n${bedrooms ? `• ${bedrooms}\n` : ''}${developer ? `• By ${developer}\n` : ''}\nContact JBJ Global Real Estate for more information.`,
      },
      luxury: {
        instagram: `✨ Extraordinary Living Awaits\n\n${property?.name || 'The Residence'}\n${location}\n\nFrom ${price}\n\n🔑 Private viewings available`,
        tiktok: `This is luxury 🤑 ${property?.name} | ${location}`,
        youtube: `Exclusive: ${property?.name || 'Luxury Property'} | ${location}`,
        linkedin: `Discover unparalleled luxury at ${property?.name || 'this exclusive property'} in ${location}. Starting from ${price}.`,
      },
    };

    return templates[tone]?.[platform] || templates.professional.instagram;
  }, []);

  const generateHashtags = useCallback((property: any, platform: string) => {
    const base = ['#DubaiRealEstate', '#JBJGlobal', '#LuxuryLiving', '#DubaiProperty'];
    const location = property?.area_name ? [`#${property.area_name.replace(/\s/g, '')}`] : [];
    const developer = property?.developer_name ? [`#${property.developer_name.replace(/\s/g, '')}`] : [];
    
    const platformSpecific: Record<string, string[]> = {
      instagram: ['#DubaiLife', '#InvestInDubai', '#UAERealEstate'],
      tiktok: ['#fyp', '#dubai', '#realestate', '#luxury'],
      youtube: ['#PropertyTour', '#RealEstateInvestment'],
      linkedin: ['#Investment', '#RealEstateMarket', '#UAE'],
    };

    return [...base, ...location, ...developer, ...(platformSpecific[platform] || [])];
  }, []);

  return {
    connections,
    presets,
    scheduledPosts,
    isLoading,
    loadConnections,
    loadPresets,
    loadScheduledPosts,
    connectPlatform,
    disconnectPlatform,
    savePreset,
    schedulePost,
    cancelScheduledPost,
    generateCaption,
    generateHashtags,
  };
}
