import React, { useState, useCallback } from 'react';
import { SaveProjectBar, ToolContentWrapper } from '@/components/toolkit/SaveProjectBar';
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

interface CaptionsTranslateProps { embedded?: boolean; }

export default function CaptionsTranslate({ embedded = false }: CaptionsTranslateProps) {
  const [projectName, setProjectName] = useState('Caption Project');
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
    <div style={{ background: "#0C0E14", minHeight: "100vh" }}>
      {!embedded && (
        <header style={{ borderBottom: "1px solid rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.06)" }}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 transition-colors rounded-lg px-3 py-2"
              style={{ color: "rgba(255,255,255,0.45)", border: "1px solid rgba(99,102,241,0.2)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"}>
              <ArrowLeft className="h-5 w-5" /><span>Back to Toolkit</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#818CF8" }}>
              <Languages className="w-3 h-3" /> AI Transcription
            </div>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 0 32px rgba(201,168,76,0.15)" }}>
            <Languages className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Captions & Translation</h1>
          <p className="max-w-xl mx-auto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Auto-transcribe your videos and translate captions to 15+ languages with full RTL support.
          </p>
        </div>

        {/* Save Project Bar */}
        <div className="mb-5">
          <SaveProjectBar
            projectName={projectName}
            onNameChange={setProjectName}
            onSave={() => {
              if (!transcription) { toast.error('Nothing to save'); return; }
              localStorage.setItem(`captions-project-${Date.now()}`, JSON.stringify({ name: projectName, transcription, savedAt: new Date().toISOString() }));
              toast.success(`Project "${projectName}" saved!`);
            }}
            onClear={() => {
              if (!confirm('Clear this project?')) return;
              setFile(null); setTranscription(null); setTranslations({});
              setSelectedLanguages([]); setProjectName('Caption Project');
              toast.success('Project cleared');
            }}
            canSave={!!transcription}
            accentColor="#C9A84C"
            accentBorder="rgba(201,168,76,0.3)"
          />
        </div>

        <ToolContentWrapper accentColor="#C9A84C">
        {/* Steps */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { step: 1, label: 'Upload Video', icon: Upload },
            { step: 2, label: 'Transcribe', icon: Subtitles },
            { step: 3, label: 'Translate & Export', icon: Globe },
          ].map(({ step, label }) => (
            <div key={step} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold mb-2" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
                {step}
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Upload Area */}
        {!file && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-300"
            style={{ border: "2px dashed rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.02)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.6)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.02)"; }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: "rgba(201,168,76,0.5)" }} />
            <p className="text-white font-medium mb-2">Drop your video or audio file here</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>MP4, MOV, WebM, MP3, WAV (max 5 min)</p>
            <input id="file-input" type="file" accept="video/*,audio/*" onChange={handleFileSelect} className="hidden" />
          </div>
        )}

        {/* File Selected */}
        {file && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)" }}>
                <Play className="h-6 w-6 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => { setFile(null); setTranscription(null); setTranslations({}); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                style={{ background: "rgba(239,68,68,0.65)", border: "1px solid rgba(239,68,68,0.7)" }}>
                Remove
              </button>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
              <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" />
              <label htmlFor="consent" className="text-sm cursor-pointer" style={{ color: "rgba(255,255,255,0.5)" }}>
                I own this content or have permission to edit it. Projects are saved automatically.
              </label>
            </div>

            {/* Transcribe Button */}
            {!transcription && (
              <Button variant="primary" size="lg" className="w-full" onClick={handleTranscribe} disabled={!consent || isProcessing}>
                {isProcessing ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" />Transcribing... {Math.round(progress)}%</>
                ) : (
                  <><Subtitles className="h-5 w-5 mr-2" />Transcribe Audio</>
                )}
              </Button>
            )}

            {isProcessing && <Progress value={progress} className="h-2" />}

            {/* Transcription Result */}
            {transcription && (
              <div className="space-y-6">
                <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />Transcription Complete
                    </h3>
              <button onClick={() => downloadSRT(transcription, 'en')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all" style={{ background: "rgba(201,168,76,0.3)", border: "1px solid rgba(201,168,76,0.7)" }}>
                        <Download className="h-4 w-4 mr-1" />Download SRT
                      </button>
                  </div>
                  <div className="p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{transcription}</pre>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.18)" }}>
                  <div className="p-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
                    <h3 className="font-semibold text-white mb-4">Select Languages to Translate</h3>
                    <input
                      type="text"
                      placeholder="Search languages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl text-white placeholder-white/30 focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.25)" }}
                    />
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {filteredLanguages.map((lang) => (
                      <button key={lang.code} onClick={() => toggleLanguage(lang.code)}
                      className="flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-all"
                        style={{
                          background: selectedLanguages.includes(lang.code) ? "rgba(201,168,76,0.22)" : "rgba(255,255,255,0.08)",
                          border: `1px solid ${selectedLanguages.includes(lang.code) ? "rgba(201,168,76,0.65)" : "rgba(255,255,255,0.2)"}`,
                          color: selectedLanguages.includes(lang.code) ? "#C9A84C" : "rgba(255,255,255,0.88)",
                        }}>
                        <span>{lang.name}</span>
                        {lang.rtl && <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>(RTL)</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedLanguages.length > 0 && (
                  <Button variant="primary" size="lg" className="w-full" onClick={handleTranslate} disabled={isProcessing}>
                    {isProcessing ? (
                      <><Loader2 className="h-5 w-5 animate-spin mr-2" />Translating... {Math.round(progress)}%</>
                    ) : (
                      <><Languages className="h-5 w-5 mr-2" />Translate to {selectedLanguages.length} Language(s)</>
                    )}
                  </Button>
                )}

                {/* Translation Results */}
                {Object.keys(translations).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-white">Translations Ready</h3>
                    {Object.entries(translations).map(([lang, content]) => {
                      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang);
                      return (
                        <div key={lang} className="rounded-2xl overflow-hidden" style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.18)" }}>
                          <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
                            <span className="text-white font-semibold">{langInfo?.name}</span>
                            <button onClick={() => downloadSRT(content, lang)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all" style={{ background: "rgba(201,168,76,0.3)", border: "1px solid rgba(201,168,76,0.7)" }}>
                              <Download className="h-4 w-4 mr-1" />SRT
                            </button>
                          </div>
                          <div className="p-4" dir={langInfo?.rtl ? 'rtl' : 'ltr'}>
                            <pre className="text-sm whitespace-pre-wrap font-mono" style={{ color: "rgba(255,255,255,0.65)" }}>{content}</pre>
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
        <div className="mt-8 p-4 rounded-xl text-center" style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.12)" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            Free tool with fair-usage limits · Max 5 minutes per video · 3 jobs per hour
          </p>
        </div>
        </ToolContentWrapper>
      </main>
    </div>
  );
}
