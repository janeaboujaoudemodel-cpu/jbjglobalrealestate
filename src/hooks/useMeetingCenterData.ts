import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface SummaryItem {
  id: string;
  type: 'meeting' | 'call' | 'voice-ai';
  clientName: string;
  date: string;
  summary: string;
  actionItems: string[];
  source: 'ai_job_master' | 'voice_call_logs';
  rawData?: Record<string, unknown>;
}

interface OutputPayload {
  summary?: string;
  executiveSummary?: string;
  actionItems?: Array<string | { task?: string }>;
  keyPoints?: unknown[];
  clientNeeds?: string[];
  nextSteps?: string[];
  sentiment?: string;
  clientSentiment?: string;
}

interface InputPayload {
  clientName?: string;
  meetingTitle?: string;
  meetingType?: string;
  notesLength?: number;
  hasAudio?: boolean;
}

interface VoiceCallMetadata {
  summary?: string;
  transcript?: string;
  client_name?: string;
}

const parseOutputPayload = (payload: Json | null): OutputPayload => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }
  return payload as unknown as OutputPayload;
};

const parseInputPayload = (payload: Json): InputPayload => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }
  return payload as unknown as InputPayload;
};

const parseVoiceMetadata = (metadata: Json | null): VoiceCallMetadata => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  return metadata as unknown as VoiceCallMetadata;
};

const mapJobToSummaryItem = (job: {
  id: string;
  tool_name: string;
  input_payload: Json;
  output_payload: Json | null;
  created_at: string | null;
}): SummaryItem => {
  const inputPayload = parseInputPayload(job.input_payload);
  const outputPayload = parseOutputPayload(job.output_payload);

  const type: 'meeting' | 'call' = job.tool_name === 'ai-meeting-summarizer' ? 'meeting' : 'call';
  const clientName = inputPayload.clientName || inputPayload.meetingTitle || inputPayload.meetingType || 'Unknown';
  const summary = outputPayload.summary || outputPayload.executiveSummary || 'No summary available';
  
  // Handle action items which could be strings or objects
  const actionItems = (outputPayload.actionItems || []).map((item) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null && 'task' in item) {
      return (item as { task?: string }).task || '';
    }
    return '';
  }).filter(Boolean);

  return {
    id: job.id,
    type,
    clientName,
    date: job.created_at || new Date().toISOString(),
    summary,
    actionItems,
    source: 'ai_job_master',
    rawData: outputPayload as Record<string, unknown>,
  };
};

const mapVoiceCallToSummaryItem = (call: {
  id: string;
  conversation_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  metadata: Json | null;
}): SummaryItem => {
  const metadata = parseVoiceMetadata(call.metadata);

  return {
    id: call.id,
    type: 'voice-ai',
    clientName: metadata.client_name || `Voice AI Call`,
    date: call.started_at || new Date().toISOString(),
    summary: metadata.summary || `Voice call - ${call.duration_seconds ? `${Math.round(call.duration_seconds / 60)} min` : 'Duration unknown'}`,
    actionItems: [],
    source: 'voice_call_logs',
    rawData: {
      conversation_id: call.conversation_id,
      duration_seconds: call.duration_seconds,
      ...metadata,
    },
  };
};

export const useMeetingCenterData = () => {
  const queryClient = useQueryClient();

  const { data: aiJobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['meeting-center-jobs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('ai_job_master')
        .select('id, tool_name, input_payload, output_payload, created_at')
        .in('tool_name', ['ai-meeting-summarizer', 'ai-call-summarizer'])
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const { data: voiceCalls, isLoading: isLoadingVoice } = useQuery({
    queryKey: ['meeting-center-voice'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('voice_call_logs')
        .select('id, conversation_id, started_at, ended_at, duration_seconds, metadata')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  // Combine and sort all summaries
  const allSummaries: SummaryItem[] = [
    ...(aiJobs || []).map(mapJobToSummaryItem),
    ...(voiceCalls || []).map(mapVoiceCallToSummaryItem),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['meeting-center-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['meeting-center-voice'] });
  };

  return {
    summaries: allSummaries,
    isLoading: isLoadingJobs || isLoadingVoice,
    refetch,
  };
};
