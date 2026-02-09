import { useState, useCallback } from 'react';
import { MediaAsset, StockAsset } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const generateId = () => crypto.randomUUID();
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('jbj-video-studio-session');
  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem('jbj-video-studio-session', sessionId);
  }
  return sessionId;
};

export function useMediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [stockAssets, setStockAssets] = useState<StockAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<MediaAsset | null> => {
    const sessionId = getSessionId();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 100MB.');
        return null;
      }

      // Determine file type
      let fileType: 'video' | 'audio' | 'image';
      if (file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      } else if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else {
        toast.error('Unsupported file type. Please upload video, audio, or image files.');
        return null;
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `video-studio/${sessionId}/${generateId()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload file. Please try again.');
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      // Get media metadata
      let duration: number | undefined;
      let width: number | undefined;
      let height: number | undefined;
      let thumbnailUrl: string | undefined;

      if (fileType === 'video' || fileType === 'audio') {
        const mediaElement = fileType === 'video' 
          ? document.createElement('video')
          : document.createElement('audio');
        
        await new Promise<void>((resolve) => {
          mediaElement.onloadedmetadata = () => {
            duration = mediaElement.duration;
            if (fileType === 'video') {
              width = (mediaElement as HTMLVideoElement).videoWidth;
              height = (mediaElement as HTMLVideoElement).videoHeight;
            }
            resolve();
          };
          mediaElement.onerror = () => resolve();
          mediaElement.src = URL.createObjectURL(file);
        });

        // Generate thumbnail for video
        if (fileType === 'video') {
          thumbnailUrl = await generateVideoThumbnail(file);
        }
      } else if (fileType === 'image') {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = URL.createObjectURL(file);
        });
        thumbnailUrl = publicUrl;
      }

      const asset: MediaAsset = {
        id: generateId(),
        name: file.name,
        type: fileType,
        url: publicUrl,
        thumbnailUrl,
        duration,
        width,
        height,
        fileSize: file.size,
        mimeType: file.type,
      };

      setAssets(prev => [...prev, asset]);
      setUploadProgress(100);
      toast.success(`${file.name} uploaded successfully!`);
      
      return asset;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  const uploadMultipleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const results: MediaAsset[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      setUploadProgress((i / fileArray.length) * 100);
      const result = await uploadFile(fileArray[i]);
      if (result) results.push(result);
    }

    return results;
  }, [uploadFile]);

  const deleteAsset = useCallback((assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  }, []);

  const loadStockLibrary = useCallback(async (category?: string, searchTerm?: string) => {
    setIsLoadingStock(true);
    try {
      const response = await supabase
        .from('studio_stock_library')
        .select('id, name, asset_type, file_path, thumbnail_path, duration_ms, category, tags')
        .limit(50);

      if (response.error) {
        console.error('Stock library error:', response.error);
        return;
      }

      // Filter client-side for more flexibility
      const rawData = response.data || [];
      let filteredData = [...rawData];
      
      if (category) {
        filteredData = filteredData.filter((item) => item.category === category);
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter((item) => {
          const nameMatch = item.name?.toLowerCase().includes(searchLower);
          const tagsArray = item.tags as string[] | null;
          const tagMatch = tagsArray?.some((tag) => tag.toLowerCase().includes(searchLower));
          return nameMatch || tagMatch;
        });
      }

      const stockItems: StockAsset[] = filteredData.map((item) => ({
        id: item.id,
        name: item.name || '',
        type: (item.asset_type === 'music' || item.asset_type === 'sfx') ? 'audio' as const : (item.asset_type as 'video' | 'audio' | 'image'),
        url: item.file_path || '',
        thumbnailUrl: item.thumbnail_path || undefined,
        duration: item.duration_ms ? item.duration_ms / 1000 : undefined,
        category: item.category || '',
        tags: (item.tags as string[]) || [],
        isPremium: false,
      }));

      setStockAssets(stockItems);
    } catch (err) {
      console.error('Failed to load stock library:', err);
    } finally {
      setIsLoadingStock(false);
    }
  }, []);

  return {
    assets,
    stockAssets,
    isUploading,
    uploadProgress,
    isLoadingStock,
    uploadFile,
    uploadMultipleFiles,
    deleteAsset,
    loadStockLibrary,
    setAssets,
  };
}

async function generateVideoThumbnail(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadeddata = () => {
      video.currentTime = 1; // Seek to 1 second
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    video.onerror = () => resolve(undefined);
    video.src = URL.createObjectURL(file);
  });
}
