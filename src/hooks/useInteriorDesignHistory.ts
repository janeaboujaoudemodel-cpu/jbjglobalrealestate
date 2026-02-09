import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DesignHistoryItem {
  id: string;
  mode: string;
  projectName: string;
  roomName: string;
  propertyType: string;
  designStyle: string;
  colorPalette: string;
  purpose: string;
  customNotes: string;
  imageUrl: string;
  notes: string;
  createdAt: string;
}

export interface DesignInput {
  mode: 'concept' | 'redesign' | 'staging' | 'chat';
  projectName: string;
  roomName: string;
  propertyType: string;
  propertySize?: string;
  designStyle: string;
  colorPalette: string;
  purpose: string;
  customNotes: string;
  photos?: string[];
  floorPlan?: string;
}

export interface DesignResult {
  images: string[];
  notes: string;
  createdAt: string;
}

export function useInteriorDesignHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch history from ai_job_master
  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_job_master')
        .select('*')
        .eq('user_id', user.id)
        .eq('tool_name', 'interior-design-generate')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const items: DesignHistoryItem[] = (data || []).map((row) => {
        const input = row.input_payload as Record<string, unknown> || {};
        const output = row.output_payload as Record<string, unknown> || {};
        
        return {
          id: row.id,
          mode: (input.mode as string) || 'concept',
          projectName: (input.project_name as string) || 'Untitled Project',
          roomName: (input.room_name as string) || '',
          propertyType: (input.property_type as string) || '',
          designStyle: (input.design_style as string) || '',
          colorPalette: (input.color_palette as string) || '',
          purpose: (input.purpose as string) || '',
          customNotes: (input.custom_notes as string) || '',
          imageUrl: (output.image_url as string) || '',
          notes: (output.notes as string) || '',
          createdAt: row.created_at || new Date().toISOString(),
        };
      });

      setHistory(items);
    } catch (error) {
      console.error('Error fetching design history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Upload base64 image to storage and return URL
  const uploadImageToStorage = async (base64Data: string, projectName: string): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      // Convert base64 to blob
      const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      
      const blob = new Blob([bytes], { type: mimeType });
      const fileName = `${user.id}/${projectName.replace(/[^a-zA-Z0-9]/g, '_')}/${Date.now()}.${extension}`;

      const { data, error } = await supabase.storage
        .from('interior-designs')
        .upload(fileName, blob, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('Storage upload error:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('interior-designs')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image to storage:', error);
      return null;
    }
  };

  // Save a new design to history
  const saveDesign = useCallback(async (
    input: DesignInput,
    result: DesignResult,
    processingTimeMs: number
  ): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Please sign in to save your designs');
      return null;
    }

    setIsSaving(true);
    try {
      // Upload image to storage if it's base64
      let imageUrl = result.images[0];
      if (imageUrl && imageUrl.startsWith('data:')) {
        const uploadedUrl = await uploadImageToStorage(imageUrl, input.projectName);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { data, error } = await supabase
        .from('ai_job_master')
        .insert({
          user_id: user.id,
          tool_name: 'interior-design-generate',
          status: 'completed',
          input_payload: {
            mode: input.mode,
            project_name: input.projectName,
            room_name: input.roomName,
            property_type: input.propertyType,
            property_size: input.propertySize,
            design_style: input.designStyle,
            color_palette: input.colorPalette,
            purpose: input.purpose,
            custom_notes: input.customNotes,
          },
          output_payload: {
            image_url: imageUrl,
            notes: result.notes,
          },
          intelligence_features: {
            style_detected: input.designStyle,
            color_scheme: input.colorPalette,
            room_type: input.roomName,
            mode: input.mode,
          },
          processing_time_ms: processingTimeMs,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local history
      const newItem: DesignHistoryItem = {
        id: data.id,
        mode: input.mode,
        projectName: input.projectName,
        roomName: input.roomName,
        propertyType: input.propertyType,
        designStyle: input.designStyle,
        colorPalette: input.colorPalette,
        purpose: input.purpose,
        customNotes: input.customNotes,
        imageUrl: imageUrl || '',
        notes: result.notes,
        createdAt: data.created_at,
      };

      setHistory(prev => [newItem, ...prev]);
      toast.success('Design saved to your history');
      return data.id;
    } catch (error) {
      console.error('Error saving design:', error);
      toast.error('Failed to save design to history');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // Delete a design from history
  const deleteDesign = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('ai_job_master')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Design removed from history');
      return true;
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error('Failed to delete design');
      return false;
    }
  }, [user?.id]);

  return {
    history,
    isLoading,
    isSaving,
    fetchHistory,
    saveDesign,
    deleteDesign,
  };
}

export default useInteriorDesignHistory;
