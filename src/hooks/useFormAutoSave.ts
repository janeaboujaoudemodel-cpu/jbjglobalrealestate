import { useEffect, useRef, useCallback } from 'react';
import { UseFormReturn, FieldValues, Path, PathValue } from 'react-hook-form';

// Simple encryption for form drafts - uses base64 + XOR for obfuscation
// This prevents casual reading of localStorage but isn't military-grade
const DRAFT_KEY_PREFIX = 'jbj_form_draft_';
const ENCRYPTION_KEY = 'JBJ_SECURE_DRAFT_2026';

const encrypt = (text: string): string => {
  try {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  } catch {
    return '';
  }
};

const decrypt = (encoded: string): string => {
  try {
    const decoded = atob(encoded);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return '';
  }
};

interface AutoSaveOptions {
  formId: string;
  debounceMs?: number;
  excludeFields?: string[];
  expiryHours?: number;
}

interface SavedDraft {
  data: Record<string, unknown>;
  timestamp: number;
  expiryMs: number;
}

export const useFormAutoSave = <T extends FieldValues>(
  form: UseFormReturn<T>,
  options: AutoSaveOptions
) => {
  const { formId, debounceMs = 500, excludeFields = [], expiryHours = 24 } = options;
  const storageKey = `${DRAFT_KEY_PREFIX}${formId}`;
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);

  // Save form data to encrypted localStorage
  const saveDraft = useCallback((data: Partial<T>) => {
    try {
      // Filter out excluded fields and sensitive data
      const dataToSave = { ...data };
      excludeFields.forEach((field) => {
        delete dataToSave[field as keyof T];
      });

      const draft: SavedDraft = {
        data: dataToSave as Record<string, unknown>,
        timestamp: Date.now(),
        expiryMs: expiryHours * 60 * 60 * 1000,
      };

      const encrypted = encrypt(JSON.stringify(draft));
      if (encrypted) {
        localStorage.setItem(storageKey, encrypted);
      }
    } catch (error) {
      console.warn('Failed to save form draft:', error);
    }
  }, [storageKey, excludeFields, expiryHours]);

  // Load saved draft from localStorage
  const loadDraft = useCallback((): Partial<T> | null => {
    try {
      const encrypted = localStorage.getItem(storageKey);
      if (!encrypted) return null;

      const decrypted = decrypt(encrypted);
      if (!decrypted) {
        localStorage.removeItem(storageKey);
        return null;
      }

      const draft: SavedDraft = JSON.parse(decrypted);
      
      // Check if draft has expired
      if (Date.now() - draft.timestamp > draft.expiryMs) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return draft.data as Partial<T>;
    } catch {
      localStorage.removeItem(storageKey);
      return null;
    }
  }, [storageKey]);

  // Clear saved draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore errors
    }
  }, [storageKey]);

  // Restore draft on mount
  useEffect(() => {
    const savedDraft = loadDraft();
    if (savedDraft && Object.keys(savedDraft).length > 0) {
      isRestoringRef.current = true;
      
      // Restore each field
      Object.entries(savedDraft).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          form.setValue(key as Path<T>, value as PathValue<T, Path<T>>, { 
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      });

      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    }
  }, [form, loadDraft]);

  // Watch form changes and auto-save with debounce
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Don't save while restoring
      if (isRestoringRef.current) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save
      saveTimeoutRef.current = setTimeout(() => {
        // Only save if there's meaningful data
        const hasData = Object.entries(data).some(
          ([key, value]) => 
            !excludeFields.includes(key) && 
            value !== undefined && 
            value !== null && 
            value !== ''
        );

        if (hasData) {
          saveDraft(data as Partial<T>);
        }
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, saveDraft, debounceMs, excludeFields]);

  return {
    clearDraft,
    loadDraft,
    hasDraft: !!loadDraft(),
  };
};

export default useFormAutoSave;
