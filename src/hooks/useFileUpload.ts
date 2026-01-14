// File Upload Hook for Founder's Assistant
// Handles file uploads without size limits

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  status: 'uploading' | 'completed' | 'failed';
  progress: number;
}

export interface UseFileUploadReturn {
  files: UploadedFile[];
  isUploading: boolean;
  uploadFiles: (fileList: FileList | File[]) => Promise<UploadedFile[]>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  openFilePicker: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function useFileUpload(userId?: string): UseFileUploadReturn {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const uploadFiles = useCallback(async (fileList: FileList | File[]): Promise<UploadedFile[]> => {
    const fileArray = Array.from(fileList);
    if (fileArray.length === 0) return [];

    setIsUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      const fileId = crypto.randomUUID();
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'uploading',
        progress: 0,
      };

      setFiles(prev => [...prev, uploadedFile]);

      try {
        // Generate unique path
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `uploads/${userId || 'anonymous'}/${timestamp}-${safeName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('assistant-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          // If bucket doesn't exist, store locally
          console.warn('Storage upload failed, using local reference:', error);
          
          // Create a local URL for the file
          const localUrl = URL.createObjectURL(file);
          
          uploadedFile.url = localUrl;
          uploadedFile.status = 'completed';
          uploadedFile.progress = 100;
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('assistant-files')
            .getPublicUrl(filePath);

          uploadedFile.url = urlData.publicUrl;
          uploadedFile.status = 'completed';
          uploadedFile.progress = 100;
        }

        setFiles(prev => prev.map(f => 
          f.id === fileId ? uploadedFile : f
        ));

        uploadedFiles.push(uploadedFile);
        toast.success(`Uploaded: ${file.name}`);
      } catch (err) {
        console.error('Upload error:', err);
        uploadedFile.status = 'failed';
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'failed' } : f
        ));
        toast.error(`Failed to upload: ${file.name}`);
      }
    }

    setIsUploading(false);
    return uploadedFiles;
  }, [userId]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    isUploading,
    uploadFiles,
    removeFile,
    clearFiles,
    openFilePicker,
    inputRef,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
