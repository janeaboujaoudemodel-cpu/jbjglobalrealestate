import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StudioProject, TimelineState, CanvasSettings, AICreativeSettings, PropertySnapshot } from '../types';
import type { Json } from '@/integrations/supabase/types';

const AUTOSAVE_INTERVAL = 5000; // 5 seconds

export function useStudioProject(projectId: string | undefined) {
  const [project, setProject] = useState<StudioProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedRef = useRef<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load project
  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('studio_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      // Parse JSON fields with proper defaults
      const timelineState = (data.timeline_state as unknown as TimelineState) || { 
        tracks: [], 
        duration: 0, 
        currentTime: 0, 
        zoom: 1 
      };
      
      const canvasSettings = (data.canvas_settings as unknown as CanvasSettings) || { 
        format: '16:9' as const, 
        quality: '1080p' as const 
      };
      
      const aiSettings = (data.ai_settings as unknown as AICreativeSettings) || {
        creativityLevel: 'balanced' as const,
        brandStrictness: 'branded' as const,
        targetAudience: 'end_users' as const,
        promptHistory: [],
      };
      
      const propertySnapshot = (data.property_snapshot as unknown as PropertySnapshot) || null;

      const parsedProject: StudioProject = {
        id: data.id,
        user_id: data.user_id,
        session_id: data.session_id,
        name: data.name,
        description: data.description,
        status: (data.status || 'draft') as 'draft' | 'published' | 'archived',
        project_type: (data.project_type || 'video') as 'video' | 'image' | 'pdf' | 'marketing_pack',
        property_id: data.property_id,
        property_snapshot: propertySnapshot,
        timeline_state: timelineState,
        canvas_settings: canvasSettings,
        ai_settings: aiSettings,
        is_shared: data.is_shared ?? false,
        share_token: data.share_token,
        share_mode: (data.share_mode || 'read_only') as 'read_only' | 'collaborate',
        last_autosave_at: data.last_autosave_at,
        autosave_version: data.autosave_version ?? 0,
        thumbnail_url: data.thumbnail_url,
        tags: data.tags || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setProject(parsedProject);
      lastSavedRef.current = JSON.stringify(parsedProject);
    } catch (err) {
      console.error('Failed to load project:', err);
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save
  useEffect(() => {
    if (!project || !hasUnsavedChanges) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveProject();
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [project, hasUnsavedChanges]);

  // Save project
  const saveProject = useCallback(async () => {
    if (!project || !projectId) return;

    const currentState = JSON.stringify(project);
    if (currentState === lastSavedRef.current) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('studio_projects')
        .update({
          name: project.name,
          description: project.description,
          status: project.status,
          timeline_state: project.timeline_state as unknown as Json,
          canvas_settings: project.canvas_settings as unknown as Json,
          ai_settings: project.ai_settings as unknown as Json,
          property_id: project.property_id,
          property_snapshot: project.property_snapshot as unknown as Json,
          is_shared: project.is_shared,
          share_mode: project.share_mode,
          last_autosave_at: new Date().toISOString(),
          autosave_version: (project.autosave_version || 0) + 1,
        })
        .eq('id', projectId);

      if (error) throw error;

      lastSavedRef.current = currentState;
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to save project:', err);
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  }, [project, projectId]);

  // Update project
  const updateProject = useCallback((updates: Partial<StudioProject>) => {
    setProject((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Update timeline
  const updateTimeline = useCallback((updates: Partial<TimelineState>) => {
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        timeline_state: { ...prev.timeline_state, ...updates },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Update canvas settings
  const updateCanvasSettings = useCallback((updates: Partial<CanvasSettings>) => {
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        canvas_settings: { ...prev.canvas_settings, ...updates },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Update AI settings
  const updateAISettings = useCallback((updates: Partial<AICreativeSettings>) => {
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ai_settings: { ...prev.ai_settings, ...updates },
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Rename project
  const renameProject = useCallback(async (newName: string) => {
    if (!project || !projectId) return;

    try {
      const { error } = await supabase
        .from('studio_projects')
        .update({ name: newName })
        .eq('id', projectId);

      if (error) throw error;

      setProject((prev) => prev ? { ...prev, name: newName } : prev);
      toast.success('Project renamed');
    } catch (err) {
      console.error('Failed to rename:', err);
      toast.error('Failed to rename project');
    }
  }, [project, projectId]);

  // Link property
  const linkProperty = useCallback(async (propertyId: string, snapshot: PropertySnapshot) => {
    updateProject({
      property_id: propertyId,
      property_snapshot: snapshot,
    });
    toast.success('Property linked to project');
  }, [updateProject]);

  // Generate share link
  const generateShareLink = useCallback(async () => {
    if (!project || !projectId) return null;

    try {
      const { data, error } = await supabase.rpc('generate_share_token');
      if (error) throw error;

      const shareToken = data;

      await supabase
        .from('studio_projects')
        .update({
          share_token: shareToken,
          is_shared: true,
        })
        .eq('id', projectId);

      setProject((prev) => prev ? { ...prev, share_token: shareToken, is_shared: true } : prev);

      const shareUrl = `${window.location.origin}/studio/share/${shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied!');
      
      return shareUrl;
    } catch (err) {
      console.error('Failed to generate share link:', err);
      toast.error('Failed to generate share link');
      return null;
    }
  }, [project, projectId]);

  return {
    project,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    updateProject,
    updateTimeline,
    updateCanvasSettings,
    updateAISettings,
    saveProject,
    renameProject,
    linkProperty,
    generateShareLink,
    reload: loadProject,
  };
}
