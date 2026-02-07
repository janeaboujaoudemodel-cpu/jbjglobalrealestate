/**
 * AI Reply Engine Hook - JBJ Global Real Estate
 * Generates AI-powered replies in Owner's style
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { CommThread, CommMessage } from './useOwnerInbox';

export interface AIReplyRequest {
  threadId: string;
  thread: CommThread;
  messages: CommMessage[];
  templateId?: string;
  customInstructions?: string;
  replyType: 'text' | 'email' | 'voice';
  language?: string;
}

export interface AIReplyDraft {
  id: string;
  thread_id: string;
  draft_type: string;
  subject: string | null;
  content: string;
  voice_script: string | null;
  voice_url: string | null;
  template_id: string | null;
  ai_model_used: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface CommTemplate {
  id: string;
  name: string;
  category: string;
  channel_types: string[];
  subject: string | null;
  content: string;
  voice_script: string | null;
  variables: string[];
  is_active: boolean;
  use_count: number;
}

export interface ToneProfile {
  id: string;
  profile_name: string;
  assistant_type: 'owner' | 'company';
  formality_level: number;
  emoji_usage: number;
  message_length: string;
  language_switching: boolean;
  preferred_languages: string[];
  signature: string | null;
  sample_messages: string[] | null;
}

export function useAIReplyEngine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['owner-comm-templates'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('owner_comm_templates')
        .select('*')
        .eq('is_active', true)
        .order('use_count', { ascending: false });
      if (error) throw error;
      return data as CommTemplate[];
    },
    enabled: !!user?.id,
  });

  // Fetch tone profile
  const { data: toneProfile } = useQuery({
    queryKey: ['owner-tone-profile'],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('owner_comm_tone_profiles')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as ToneProfile | null;
    },
    enabled: !!user?.id,
  });

  // Fetch learning data
  const { data: learningData = [] } = useQuery({
    queryKey: ['owner-ai-learning'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('owner_comm_ai_learning')
        .select('*')
        .order('importance_score', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Generate AI Reply
  const generateReply = useMutation({
    mutationFn: async (request: AIReplyRequest) => {
      setGeneratingFor(request.threadId);

      const { data, error } = await supabase.functions.invoke('owner-ai-reply', {
        body: {
          action: 'generate_reply',
          thread: request.thread,
          messages: request.messages,
          templateId: request.templateId,
          customInstructions: request.customInstructions,
          replyType: request.replyType,
          language: request.language || 'en',
          toneProfile: toneProfile,
          learningExamples: learningData.slice(0, 10),
        },
      });

      if (error) throw error;
      return data as { draft: AIReplyDraft; reasoning: string };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner-ai-drafts', variables.threadId] });
      toast.success('AI reply generated');
    },
    onError: (error) => {
      console.error('AI reply error:', error);
      toast.error('Failed to generate reply');
    },
    onSettled: () => {
      setGeneratingFor(null);
    },
  });

  // Generate voice reply
  const generateVoiceReply = useMutation({
    mutationFn: async ({ script, threadId }: { script: string; threadId: string }) => {
      const { data, error } = await supabase.functions.invoke('owner-voice-generate', {
        body: {
          script,
          threadId,
          voiceId: 'owner_voice', // Configured ElevenLabs voice ID
        },
      });

      if (error) throw error;
      return data as { audioUrl: string; durationSeconds: number };
    },
    onSuccess: () => {
      toast.success('Voice reply generated');
    },
    onError: () => {
      toast.error('Failed to generate voice');
    },
  });

  // Save learning from correction
  const saveCorrection = useMutation({
    mutationFn: async ({
      originalContent,
      correctedContent,
      context,
    }: {
      originalContent: string;
      correctedContent: string;
      context?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('owner_comm_ai_learning')
        .insert({
          user_id: user.id,
          learning_type: 'correction',
          original_content: originalContent,
          corrected_content: correctedContent,
          context,
          importance_score: 0.8,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-ai-learning'] });
      toast.success('Correction saved - AI will learn from this');
    },
  });

  // Approve and send draft
  const approveDraft = useMutation({
    mutationFn: async ({
      draftId,
      threadId,
      content,
      voiceUrl,
    }: {
      draftId: string;
      threadId: string;
      content: string;
      voiceUrl?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create the message
      const { data: message, error: msgError } = await supabase
        .from('owner_comm_messages')
        .insert({
          thread_id: threadId,
          user_id: user.id,
          direction: 'outbound',
          sender_name: 'Jane Bou Jaoude',
          sender_identifier: 'owner',
          content,
          content_type: voiceUrl ? 'voice' : 'text',
          voice_url: voiceUrl,
          is_ai_generated: true,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Update draft as approved
      await supabase
        .from('owner_comm_ai_drafts')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          sent_message_id: message.id,
        })
        .eq('id', draftId);

      // Update thread status
      await supabase
        .from('owner_comm_threads')
        .update({
          last_message_preview: content.substring(0, 100),
          last_message_at: new Date().toISOString(),
          status: 'waiting',
        })
        .eq('id', threadId);

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-inbox-threads'] });
      toast.success('Reply sent');
    },
    onError: () => {
      toast.error('Failed to send reply');
    },
  });

  // Get drafts for a thread
  const useDrafts = (threadId: string | null) => {
    return useQuery({
      queryKey: ['owner-ai-drafts', threadId],
      queryFn: async () => {
        if (!threadId) return [];
        const { data, error } = await supabase
          .from('owner_comm_ai_drafts')
          .select('*')
          .eq('thread_id', threadId)
          .eq('is_approved', false)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as AIReplyDraft[];
      },
      enabled: !!threadId,
    });
  };

  return {
    templates,
    toneProfile,
    learningData,
    generatingFor,
    generateReply: generateReply.mutate,
    generateVoiceReply: generateVoiceReply.mutate,
    saveCorrection: saveCorrection.mutate,
    approveDraft: approveDraft.mutate,
    isGenerating: generateReply.isPending,
    isGeneratingVoice: generateVoiceReply.isPending,
    useDrafts,
  };
}

export default useAIReplyEngine;
