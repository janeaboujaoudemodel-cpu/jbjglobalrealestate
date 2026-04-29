// Hook for translating a single field of a database row.
// First checks public.content_translations for a curated/cached value,
// then falls back to the generic translate-batch engine.

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslationSync, subscribeTranslations } from './translateClient';

interface Options {
  tableName: string;
  rowId: string | number | null | undefined;
  field: string;
  source: string | null | undefined;
  domain?: string;
}

export function useTranslatedField({
  tableName,
  rowId,
  field,
  source,
  domain = 'content',
}: Options): string {
  const { language } = useLanguage();
  const [override, setOverride] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeTranslations(() => setTick((n) => n + 1));
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setOverride(null);
    if (language === 'en' || !source || !rowId) return;
    (async () => {
      const { data } = await supabase
        .from('content_translations')
        .select('translated_text')
        .eq('table_name', tableName)
        .eq('row_id', String(rowId))
        .eq('field', field)
        .eq('lang', language)
        .maybeSingle();
      if (!cancelled && data?.translated_text) {
        setOverride(data.translated_text);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tableName, rowId, field, language, source]);

  if (!source) return '';
  if (language === 'en') return source;
  if (override) return override;
  return getTranslationSync(source, language, domain);
}
