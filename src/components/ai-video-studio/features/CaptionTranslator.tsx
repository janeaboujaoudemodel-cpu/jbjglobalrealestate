import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wand2, 
  Loader2, 
  Languages, 
  Download,
  Upload
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, SUBTITLE_STYLES } from '../types';
import { toast } from 'sonner';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  language: string;
  translations?: Record<string, string>;
}

interface CaptionTranslatorProps {
  subtitles: SubtitleSegment[];
  onSubtitlesUpdate: (subtitles: SubtitleSegment[]) => void;
  onTranscribe: () => Promise<SubtitleSegment[]>;
}

export function CaptionTranslator({ 
  subtitles, 
  onSubtitlesUpdate,
  onTranscribe 
}: CaptionTranslatorProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [subtitleStyle, setSubtitleStyle] = useState('clean');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleTranscribe = useCallback(async () => {
    setIsTranscribing(true);
    try {
      const newSubtitles = await onTranscribe();
      onSubtitlesUpdate(newSubtitles);
      toast.success(`Transcribed ${newSubtitles.length} segments`);
    } catch (error) {
      toast.error('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscribe, onSubtitlesUpdate]);

  const handleTranslate = useCallback(async () => {
    if (selectedLanguages.length === 0) {
      toast.error('Please select at least one language');
      return;
    }
    
    if (subtitles.length === 0) {
      toast.error('No subtitles to translate');
      return;
    }
    
    setIsTranslating(true);
    
    try {
      // Prepare texts for batch translation
      const textsToTranslate = subtitles.map(s => s.text);
      
      // Translate to each selected language
      for (const langCode of selectedLanguages) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-translate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              texts: textsToTranslate,
              targetLang: langCode,
            }),
          }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const translations = data.translations || [];
        
        // Update subtitles with translations
        const updatedSubtitles = subtitles.map((sub, idx) => ({
          ...sub,
          translations: {
            ...sub.translations,
            [langCode]: translations[idx] || sub.text,
          },
        }));
        
        onSubtitlesUpdate(updatedSubtitles);
      }
      
      toast.success(`Translated to ${selectedLanguages.length} language(s)`);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate subtitles');
    } finally {
      setIsTranslating(false);
    }
  }, [subtitles, selectedLanguages, onSubtitlesUpdate]);

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const updateSubtitleText = (id: string, text: string) => {
    onSubtitlesUpdate(
      subtitles.map(s => s.id === id ? { ...s, text } : s)
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const exportSRT = useCallback(() => {
    if (subtitles.length === 0) {
      toast.error('No subtitles to export');
      return;
    }
    
    let srt = '';
    subtitles.forEach((sub, idx) => {
      const startTime = formatTime(sub.startTime).replace('.', ',');
      const endTime = formatTime(sub.endTime).replace('.', ',');
      srt += `${idx + 1}\n${startTime} --> ${endTime}\n${sub.text}\n\n`;
    });
    
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Exported SRT file');
  }, [subtitles]);

  const exportVTT = useCallback(() => {
    if (subtitles.length === 0) {
      toast.error('No subtitles to export');
      return;
    }
    
    let vtt = 'WEBVTT\n\n';
    subtitles.forEach((sub) => {
      vtt += `${formatTime(sub.startTime)} --> ${formatTime(sub.endTime)}\n${sub.text}\n\n`;
    });
    
    const blob = new Blob([vtt], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.vtt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Exported VTT file');
  }, [subtitles]);

  return (
    <div className="space-y-4">
      {/* Transcribe Section */}
      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <h4 className="text-sm font-medium text-gold mb-3 flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Auto-Transcribe
        </h4>
        
        <Button
          onClick={handleTranscribe}
          disabled={isTranscribing}
          className="w-full bg-gold text-black hover:bg-gold/90"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Transcribing...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Transcribe Audio
            </>
          )}
        </Button>
      </div>

      {/* Translation Section */}
      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <h4 className="text-sm font-medium text-gold mb-3 flex items-center gap-2">
          <Languages className="w-4 h-4" />
          Translate
        </h4>
        
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').slice(0, 10).map((lang) => (
              <Button
                key={lang.code}
                size="sm"
                variant={selectedLanguages.includes(lang.code) ? 'default' : 'outline'}
                onClick={() => toggleLanguage(lang.code)}
                className={
                  selectedLanguages.includes(lang.code)
                    ? 'bg-gold text-black hover:bg-gold/90 h-7 text-xs'
                    : 'border-slate-700 text-slate-400 h-7 text-xs'
                }
              >
                {lang.name}
                {lang.rtl && ' ←'}
              </Button>
            ))}
          </div>
          
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || selectedLanguages.length === 0}
            className="w-full bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="w-4 h-4 mr-2" />
                Translate to {selectedLanguages.length} Language(s)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Style Selection */}
      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <Label className="text-xs text-slate-400">Subtitle Style</Label>
        <Select value={subtitleStyle} onValueChange={setSubtitleStyle}>
          <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-sm mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBTITLE_STYLES.map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subtitle List */}
      {subtitles.length > 0 && (
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white">
              Subtitles ({subtitles.length})
            </h4>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={exportSRT} className="text-slate-400 h-7 text-xs">
                <Download className="w-3 h-3 mr-1" />
                SRT
              </Button>
              <Button size="sm" variant="ghost" onClick={exportVTT} className="text-slate-400 h-7 text-xs">
                <Download className="w-3 h-3 mr-1" />
                VTT
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {subtitles.map((sub) => (
                <div 
                  key={sub.id}
                  className="p-2 bg-slate-900/50 rounded border border-slate-700"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{formatTime(sub.startTime)} → {formatTime(sub.endTime)}</span>
                  </div>
                  {editingId === sub.id ? (
                    <Input
                      value={sub.text}
                      onChange={(e) => updateSubtitleText(sub.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                      className="h-7 bg-slate-800 border-slate-700 text-sm"
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-sm text-white cursor-pointer hover:text-gold"
                      onClick={() => setEditingId(sub.id)}
                    >
                      {sub.text}
                    </p>
                  )}
                  
                  {/* Show translations */}
                  {sub.translations && Object.keys(sub.translations).length > 0 && (
                    <div className="mt-1 space-y-1">
                      {Object.entries(sub.translations).map(([lang, text]) => {
                        const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang);
                        return (
                          <p 
                            key={lang} 
                            className="text-xs text-slate-400"
                            dir={langInfo?.rtl ? 'rtl' : 'ltr'}
                          >
                            <span className="text-slate-500">{langInfo?.name}:</span> {text}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
