import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Languages, 
  FileText, 
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

const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'Arabic', rtl: true },
  { code: 'zh', name: 'Chinese (Mandarin)', rtl: false },
  { code: 'nl', name: 'Dutch', rtl: false },
  { code: 'en', name: 'English', rtl: false },
  { code: 'fr', name: 'French', rtl: false },
  { code: 'de', name: 'German', rtl: false },
  { code: 'he', name: 'Hebrew', rtl: true },
  { code: 'hi', name: 'Hindi', rtl: false },
  { code: 'id', name: 'Indonesian', rtl: false },
  { code: 'it', name: 'Italian', rtl: false },
  { code: 'ja', name: 'Japanese', rtl: false },
  { code: 'ko', name: 'Korean', rtl: false },
  { code: 'fa', name: 'Persian', rtl: true },
  { code: 'pl', name: 'Polish', rtl: false },
  { code: 'pt', name: 'Portuguese', rtl: false },
  { code: 'ru', name: 'Russian', rtl: false },
  { code: 'es', name: 'Spanish', rtl: false },
  { code: 'th', name: 'Thai', rtl: false },
  { code: 'tr', name: 'Turkish', rtl: false },
  { code: 'uk', name: 'Ukrainian', rtl: false },
  { code: 'ur', name: 'Urdu', rtl: true },
  { code: 'vi', name: 'Vietnamese', rtl: false },
];

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
    setProgress(0);

    try {
      // Simulate transcription progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 300));
        setProgress(i);
      }

      // Mock transcription result
      setTranscription(`[00:00:00] Welcome to this property tour.
[00:00:05] Today we're exploring a stunning villa in Dubai Marina.
[00:00:12] The living space features floor-to-ceiling windows.
[00:00:18] Notice the premium marble flooring throughout.
[00:00:25] The kitchen includes top-of-the-line appliances.`);

      toast.success('Transcription complete!');
    } catch (error) {
      toast.error('Failed to transcribe. Please try again.');
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
      
      for (let i = 0; i < selectedLanguages.length; i++) {
        const lang = selectedLanguages[i];
        await new Promise(r => setTimeout(r, 500));
        setProgress(((i + 1) / selectedLanguages.length) * 100);
        
        // Mock translation
        newTranslations[lang] = `[Translated to ${SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name}]\n${transcription}`;
      }

      setTranslations(newTranslations);
      toast.success(`Translated to ${selectedLanguages.length} language(s)!`);
    } catch (error) {
      toast.error('Translation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSRT = (content: string, lang: string) => {
    const srtContent = content.split('\n').map((line, i) => {
      const match = line.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(.*)/);
      if (match) {
        return `${i + 1}\n${match[1]},000 --> ${match[1]},999\n${match[2]}\n`;
      }
      return '';
    }).join('\n');

    const blob = new Blob([srtContent], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions_${lang}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/toolkit" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Toolkit</span>
          </Link>
          <div className="text-sm text-slate-500">
            Files auto-delete after 2 hours
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
            Auto-transcribe your videos and translate captions to 100+ languages with full RTL support.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { step: 1, label: 'Upload Video', icon: Upload },
            { step: 2, label: 'Transcribe', icon: Subtitles },
            { step: 3, label: 'Translate & Export', icon: Globe },
          ].map(({ step, label, icon: Icon }) => (
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
                I own this content or have permission to edit it. I understand files are processed securely and auto-deleted after 2 hours.
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
                    Transcribing... {progress}%
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
