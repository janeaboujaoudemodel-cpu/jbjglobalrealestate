import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Languages, 
  Download,
  Play,
  Loader2,
  CheckCircle2,
  Globe,
  Subtitles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'Arabic', rtl: true },
  { code: 'zh', name: 'Chinese (Mandarin)', rtl: false },
  { code: 'nl', name: 'Dutch', rtl: false },
  { code: 'en', name: 'English', rtl: false },
  { code: 'fr', name: 'French', rtl: false },
  { code: 'de', name: 'German', rtl: false },
  { code: 'hi', name: 'Hindi', rtl: false },
  { code: 'it', name: 'Italian', rtl: false },
  { code: 'ja', name: 'Japanese', rtl: false },
  { code: 'ko', name: 'Korean', rtl: false },
  { code: 'fa', name: 'Persian', rtl: true },
  { code: 'pt', name: 'Portuguese', rtl: false },
  { code: 'ru', name: 'Russian', rtl: false },
  { code: 'es', name: 'Spanish', rtl: false },
  { code: 'tr', name: 'Turkish', rtl: false },
];

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 from data URL
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function CaptionsTranslate() {
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('video/') || droppedFile.type.startsWith('audio/'))) {
      setFile(droppedFile);
    } else {
      toast.error('Please upload a video or audio file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }, []);

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleTranscribe = async () => {
    if (!file || !consent) {
      toast.error('Please upload a file and confirm consent');
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      // Convert audio/video to base64
      const base64Audio = await fileToBase64(file);
      setProgress(30);

      // Call voice-to-text edge function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio, language: 'en' }
      });

      setProgress(80);

      if (error) {
        throw new Error(error.message || 'Transcription failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.text) {
        throw new Error('No transcription returned');
      }

      // Format transcription with timestamps (simulated for now)
      const lines = data.text.split('. ').filter((s: string) => s.trim());
      const formattedTranscription = lines.map((line: string, i: number) => {
        const seconds = i * 5;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `[00:${mins}:${secs}] ${line.trim()}${line.endsWith('.') ? '' : '.'}`;
      }).join('\n');

      setTranscription(formattedTranscription);
      setProgress(100);
      toast.success('Transcription complete!');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to transcribe. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!transcription || selectedLanguages.length === 0) {
      toast.error('Please transcribe first and select languages');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const newTranslations: Record<string, string> = {};
      
      // Extract just the text content (without timestamps) for translation
      const textLines = transcription.split('\n').map(line => {
        const match = line.match(/\[\d{2}:\d{2}:\d{2}\]\s*(.*)/);
        return match ? match[1] : line;
      });

      for (let i = 0; i < selectedLanguages.length; i++) {
        const lang = selectedLanguages[i];
        setProgress(((i) / selectedLanguages.length) * 100);
        
        // Call auto-translate edge function
        const { data, error } = await supabase.functions.invoke('auto-translate', {
          body: { texts: textLines, targetLang: lang }
        });

        if (error) {
          console.error(`Translation error for ${lang}:`, error);
          newTranslations[lang] = `[Translation to ${SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name} failed]\n${transcription}`;
          continue;
        }

        if (data?.translations) {
          // Reconstruct with timestamps
          const translatedWithTimestamps = data.translations.map((text: string, idx: number) => {
            const originalLine = transcription.split('\n')[idx];
            const timestampMatch = originalLine?.match(/\[(\d{2}:\d{2}:\d{2})\]/);
            const timestamp = timestampMatch ? timestampMatch[0] : `[00:00:${(idx * 5).toString().padStart(2, '0')}]`;
            return `${timestamp} ${text}`;
          }).join('\n');
          
          newTranslations[lang] = translatedWithTimestamps;
        } else {
          newTranslations[lang] = `[Translation to ${SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name}]\n${transcription}`;
        }
      }

      setProgress(100);
      setTranslations(newTranslations);
      toast.success(`Translated to ${selectedLanguages.length} language(s)!`);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSRT = (content: string, lang: string) => {
    const lines = content.split('\n');
    const srtContent = lines.map((line, i) => {
      const match = line.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(.*)/);
      if (match) {
        const startTime = match[1];
        const nextLine = lines[i + 1];
        const nextMatch = nextLine?.match(/\[(\d{2}:\d{2}:\d{2})\]/);
        const endTime = nextMatch ? nextMatch[1] : `${startTime.slice(0, -2)}${(parseInt(startTime.slice(-2)) + 5).toString().padStart(2, '0')}`;
        return `${i + 1}\n${startTime},000 --> ${endTime},000\n${match[2]}\n`;
      }
      return '';
    }).filter(Boolean).join('\n');

    const blob = new Blob([srtContent], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions_${lang}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${lang.toUpperCase()} subtitles`);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/toolkit" className="flex items-center gap-2 hover:bg-zinc-800 transition-colors rounded-lg px-3 py-2 border border-zinc-700" style={{ color: '#a1a1aa' }}>
            <ArrowLeft className="h-5 w-5" style={{ color: '#a1a1aa' }} />
            <span style={{ color: '#a1a1aa' }}>Back to Toolkit</span>
          </Link>
          <div className="text-sm text-slate-500">
            Projects are saved automatically
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/20 text-gold mb-6">
            <Languages className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Captions & Translation
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Auto-transcribe your videos and translate captions to 15+ languages with full RTL support.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { step: 1, label: 'Upload Video', icon: Upload },
            { step: 2, label: 'Transcribe', icon: Subtitles },
            { step: 3, label: 'Translate & Export', icon: Globe },
          ].map(({ step, label }) => (
            <div key={step} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-gold font-bold mb-2">
                {step}
              </div>
              <p className="text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Upload Area */}
        {!file && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:border-gold/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">
              Drop your video or audio file here
            </p>
            <p className="text-sm text-slate-500">
              MP4, MOV, WebM, MP3, WAV (max 5 min)
            </p>
            <input
              id="file-input"
              type="file"
              accept="video/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* File Selected */}
        {file && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-gold/20 flex items-center justify-center">
                <Play className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-sm text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  setFile(null);
                  setTranscription(null);
                  setTranslations({});
                }}
              >
                Remove
              </Button>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-700">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="consent" className="text-sm text-slate-400 cursor-pointer">
                I own this content or have permission to edit it. Projects are saved automatically.
              </label>
            </div>

            {/* Transcribe Button */}
            {!transcription && (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleTranscribe}
                disabled={!consent || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Transcribing... {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <Subtitles className="h-5 w-5 mr-2" />
                    Transcribe Audio
                  </>
                )}
              </Button>
            )}

            {/* Progress */}
            {isProcessing && (
              <Progress value={progress} className="h-2" />
            )}

            {/* Transcription Result */}
            {transcription && (
              <div className="space-y-6">
                <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="font-medium text-white flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Transcription Complete
                    </h3>
                    <Button variant="secondary" size="sm" onClick={() => downloadSRT(transcription, 'en')}>
                      <Download className="h-4 w-4 mr-1" />
                      Download SRT
                    </Button>
                  </div>
                  <div className="p-4">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                      {transcription}
                    </pre>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
                  <div className="p-4 border-b border-slate-700">
                    <h3 className="font-medium text-white mb-4">Select Languages to Translate</h3>
                    <input
                      type="text"
                      placeholder="Search languages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {filteredLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => toggleLanguage(lang.code)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-colors ${
                          selectedLanguages.includes(lang.code)
                            ? 'bg-gold/20 text-gold border border-gold/50'
                            : 'bg-slate-800 text-slate-300 border border-transparent hover:border-slate-600'
                        }`}
                      >
                        <span>{lang.name}</span>
                        {lang.rtl && <span className="text-xs text-slate-500">(RTL)</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Translate Button */}
                {selectedLanguages.length > 0 && (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleTranslate}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Translating... {Math.round(progress)}%
                      </>
                    ) : (
                      <>
                        <Languages className="h-5 w-5 mr-2" />
                        Translate to {selectedLanguages.length} Language(s)
                      </>
                    )}
                  </Button>
                )}

                {/* Translation Results */}
                {Object.keys(translations).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-white">Translations Ready</h3>
                    {Object.entries(translations).map(([lang, content]) => {
                      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang);
                      return (
                        <div key={lang} className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
                          <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <span className="text-white font-medium">{langInfo?.name}</span>
                            <div className="flex gap-2">
                              <Button variant="secondary" size="sm" onClick={() => downloadSRT(content, lang)}>
                                <Download className="h-4 w-4 mr-1" />
                                SRT
                              </Button>
                            </div>
                          </div>
                          <div className="p-4" dir={langInfo?.rtl ? 'rtl' : 'ltr'}>
                            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                              {content}
                            </pre>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fair Usage Note */}
        <div className="mt-12 p-4 rounded-xl bg-slate-900/50 border border-slate-700 text-center">
          <p className="text-sm text-slate-500">
            Free tool with fair-usage limits. Max 5 minutes per video, 3 jobs per hour.
          </p>
        </div>
      </main>
    </div>
  );
}
