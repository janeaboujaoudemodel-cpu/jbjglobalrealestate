import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export type HuntTargetType = 'investor' | 'broker' | 'employee';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type ProspectStatus = 'new' | 'contacted' | 'responded' | 'qualified' | 'negotiating' | 'converted' | 'rejected' | 'not_interested';

export interface HuntCampaign {
  id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  target_type: HuntTargetType;
  status: CampaignStatus;
  target_criteria: Json;
  message_template: string | null;
  follow_up_template: string | null;
  auto_follow_up: boolean | null;
  follow_up_days: number | null;
  total_prospects: number | null;
  contacted_count: number | null;
  response_count: number | null;
  conversion_count: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface HuntProspect {
  id: string;
  campaign_id: string | null;
  target_type: HuntTargetType;
  status: ProspectStatus;
  full_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  company: string | null;
  job_title: string | null;
  location: string | null;
  experience_years: number | null;
  specializations: string[] | null;
  investment_capacity: string | null;
  languages: string[] | null;
  notes: string | null;
  ai_score: number | null;
  ai_analysis: string | null;
  qualification_notes: string | null;
  source: string | null;
  last_contacted_at: string | null;
  last_response_at: string | null;
  follow_up_date: string | null;
  converted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface HuntTemplate {
  id: string;
  created_by: string | null;
  name: string;
  target_type: HuntTargetType;
  template_type: string | null;
  subject: string | null;
  content: string;
  variables: string[] | null;
  is_active: boolean | null;
  use_count: number | null;
  response_rate: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface HuntOutreach {
  id: string;
  prospect_id: string | null;
  campaign_id: string | null;
  sent_by: string | null;
  channel: string | null;
  message_type: string | null;
  subject: string | null;
  content: string;
  ai_generated: boolean | null;
  ai_personalization: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  responded_at: string | null;
  response_content: string | null;
  created_at: string | null;
}

export function useHuntingSystem() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<HuntCampaign[]>([]);
  const [prospects, setProspects] = useState<HuntProspect[]>([]);
  const [templates, setTemplates] = useState<HuntTemplate[]>([]);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async (targetType?: HuntTargetType) => {
    setLoading(true);
    try {
      let query = supabase
        .from('hunt_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (targetType) {
        query = query.eq('target_type', targetType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setCampaigns((data || []) as HuntCampaign[]);
      return (data || []) as HuntCampaign[];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create campaign
  const createCampaign = useCallback(async (campaign: {
    name: string;
    description?: string;
    target_type: HuntTargetType;
    status?: CampaignStatus;
    message_template?: string;
    auto_follow_up?: boolean;
    follow_up_days?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('hunt_campaigns')
        .insert({
          name: campaign.name,
          description: campaign.description || null,
          target_type: campaign.target_type,
          status: campaign.status || 'draft',
          message_template: campaign.message_template || null,
          auto_follow_up: campaign.auto_follow_up || false,
          follow_up_days: campaign.follow_up_days || 3,
          created_by: user?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Campaign created successfully');
      await fetchCampaigns();
      return data as HuntCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      return null;
    }
  }, [user?.id, fetchCampaigns]);

  // Update campaign
  const updateCampaign = useCallback(async (id: string, updates: Partial<{
    name: string;
    description: string;
    status: CampaignStatus;
    message_template: string;
    auto_follow_up: boolean;
    follow_up_days: number;
    start_date: string;
    end_date: string;
  }>) => {
    try {
      const { data, error } = await supabase
        .from('hunt_campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Campaign updated');
      await fetchCampaigns();
      return data as HuntCampaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
      return null;
    }
  }, [fetchCampaigns]);

  // Fetch prospects
  const fetchProspects = useCallback(async (campaignId?: string, targetType?: HuntTargetType) => {
    setLoading(true);
    try {
      let query = supabase
        .from('hunt_prospects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      if (targetType) {
        query = query.eq('target_type', targetType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setProspects((data || []) as HuntProspect[]);
      return (data || []) as HuntProspect[];
    } catch (error) {
      console.error('Error fetching prospects:', error);
      toast.error('Failed to load prospects');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Add prospect
  const addProspect = useCallback(async (prospect: {
    full_name: string;
    target_type: HuntTargetType;
    status?: ProspectStatus;
    email?: string;
    phone?: string;
    linkedin_url?: string;
    company?: string;
    job_title?: string;
    location?: string;
    notes?: string;
    source?: string;
    campaign_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('hunt_prospects')
        .insert({
          full_name: prospect.full_name,
          target_type: prospect.target_type,
          status: prospect.status || 'new',
          email: prospect.email || null,
          phone: prospect.phone || null,
          linkedin_url: prospect.linkedin_url || null,
          company: prospect.company || null,
          job_title: prospect.job_title || null,
          location: prospect.location || null,
          notes: prospect.notes || null,
          source: prospect.source || null,
          campaign_id: prospect.campaign_id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Prospect added');
      return data as HuntProspect;
    } catch (error) {
      console.error('Error adding prospect:', error);
      toast.error('Failed to add prospect');
      return null;
    }
  }, []);

  // Update prospect status
  const updateProspectStatus = useCallback(async (id: string, status: ProspectStatus, notes?: string) => {
    try {
      const updates: Record<string, unknown> = { 
        status,
        updated_at: new Date().toISOString(),
      };
      
      if (status === 'contacted') {
        updates.last_contacted_at = new Date().toISOString();
      } else if (status === 'responded') {
        updates.last_response_at = new Date().toISOString();
      } else if (status === 'converted') {
        updates.converted_at = new Date().toISOString();
      }
      
      if (notes) {
        updates.qualification_notes = notes;
      }
      
      const { data, error } = await supabase
        .from('hunt_prospects')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast.success(`Prospect marked as ${status}`);
      return data as HuntProspect;
    } catch (error) {
      console.error('Error updating prospect:', error);
      toast.error('Failed to update prospect');
      return null;
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async (targetType?: HuntTargetType) => {
    try {
      let query = supabase
        .from('hunt_templates')
        .select('*')
        .eq('is_active', true)
        .order('use_count', { ascending: false });
      
      if (targetType) {
        query = query.eq('target_type', targetType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setTemplates((data || []) as HuntTemplate[]);
      return (data || []) as HuntTemplate[];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }, []);

  // Create outreach message
  const createOutreach = useCallback(async (outreach: {
    prospect_id: string;
    campaign_id?: string | null;
    channel: string;
    subject?: string;
    content: string;
    message_type?: string;
    ai_generated?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('hunt_outreach')
        .insert({
          prospect_id: outreach.prospect_id,
          campaign_id: outreach.campaign_id || null,
          channel: outreach.channel,
          subject: outreach.subject || null,
          content: outreach.content,
          message_type: outreach.message_type || 'initial',
          ai_generated: outreach.ai_generated || false,
          sent_by: user?.id || null,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update prospect status to contacted
      if (outreach.prospect_id) {
        await updateProspectStatus(outreach.prospect_id, 'contacted');
      }
      
      toast.success('Message sent');
      return data as HuntOutreach;
    } catch (error) {
      console.error('Error creating outreach:', error);
      toast.error('Failed to send message');
      return null;
    }
  }, [user?.id, updateProspectStatus]);

  // Get campaign stats
  const getCampaignStats = useCallback((targetType?: HuntTargetType) => {
    const filtered = targetType 
      ? campaigns.filter(c => c.target_type === targetType)
      : campaigns;
    
    const totalContacted = filtered.reduce((sum, c) => sum + (c.contacted_count || 0), 0);
    const totalConversions = filtered.reduce((sum, c) => sum + (c.conversion_count || 0), 0);
    
    return {
      totalCampaigns: filtered.length,
      activeCampaigns: filtered.filter(c => c.status === 'active').length,
      totalProspects: filtered.reduce((sum, c) => sum + (c.total_prospects || 0), 0),
      totalContacted,
      totalResponses: filtered.reduce((sum, c) => sum + (c.response_count || 0), 0),
      totalConversions,
      conversionRate: totalContacted > 0 ? (totalConversions / totalContacted * 100).toFixed(1) : '0',
    };
  }, [campaigns]);

  return {
    loading,
    campaigns,
    prospects,
    templates,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    fetchProspects,
    addProspect,
    updateProspectStatus,
    fetchTemplates,
    createOutreach,
    getCampaignStats,
  };
}

export default useHuntingSystem;
