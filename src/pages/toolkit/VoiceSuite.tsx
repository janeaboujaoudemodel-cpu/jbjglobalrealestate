/**
 * Voice & Audio Suite - Embeds REAL VoiceStudio with tabs for all audio tools
 * Tabs: TTS/Cloning | Voice-to-Text | Audio Enhancement (REAL FFmpeg) | Translation
 * ALL real tools - no placeholders
 */

import React, { lazy, Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Mic, FileAudio, Sparkles, Languages, ArrowLeft, Upload, Play, Pause, Download, Loader2, Volume2, Radio, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { audioEnhanceService, EnhanceProgress } from '@/lib/ffmpeg/audioEnhanceService';

// Lazy load the REAL VoiceStudio PAGE
const VoiceStudio = lazy(() => import('@/pages/toolkit/VoiceStudio'));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

// Voice-to-Text Component
function VoiceToTextPanel() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [language, setLanguage] = useState('en');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error('Could not access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  }, []);

  const transcribe = useCallback(async () => {
    if (!audioFile) return;
    
    setProcessing(true);
    try {
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });

      const response = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio, language },
      });

      if (response.error) throw response.error;
      
      if (response.data.text) {
        setTranscription(response.data.text);
        toast.success('Transcription complete!');
      } else if (response.data.error) {
        toast.error(response.data.error);
      }
    } catch (error) {
      toast.error('Transcription failed');
    } finally {
      setProcessing(false);
    }
  }, [audioFile, language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileAudio className="h-5 w-5 text-gold" />
              Voice to Text
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs ml-2">FREE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? 'destructive' : 'default'}
                className={isRecording ? '' : 'bg-gold text-black hover:bg-gold/90'}
              >
                {isRecording ? 'Stop Recording' : 'Record Audio'}
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-slate-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload Audio
              </Button>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            </div>

            {audioUrl && (
              <div className="p-3 bg-slate-800 rounded-lg">
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label className="text-slate-300">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={transcribe} disabled={!audioFile || processing} className="bg-gold text-black hover:bg-gold/90">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Transcribe'}
              </Button>
            </div>

            {transcription && (
              <div className="space-y-2">
                <Label className="text-slate-300">Transcription</Label>
                <Textarea value={transcription} readOnly rows={6} className="bg-slate-800 border-slate-600 text-white" />
                <Button
                  variant="outline"
                  className="border-slate-600"
                  onClick={() => {
                    navigator.clipboard.writeText(transcription);
                    toast.success('Copied to clipboard');
                  }}
                >
                  Copy Text
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// REAL Audio Enhancement Component using FFmpeg WASM
function AudioCleanupPanel() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<EnhanceProgress | null>(null);
  const [enhancedBlob, setEnhancedBlob] = useState<Blob | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [enhanceMode, setEnhanceMode] = useState<'quick' | 'voice' | 'music'>('quick');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memory cleanup: revoke object URLs on unmount or when they change
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
    };
  }, [audioUrl, enhancedUrl]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      // Validate file size (max 100MB for client-side processing)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File too large. Maximum 100MB for audio enhancement.');
        return;
      }
      // Revoke previous URLs to prevent memory leaks
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
      
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setEnhancedUrl(null);
      setEnhancedBlob(null);
      setProgress(null);
    }
  }, [audioUrl, enhancedUrl]);

  const enhanceAudio = useCallback(async () => {
    if (!audioFile) return;
    
    setProcessing(true);
    setProgress({ percent: 0, stage: 'loading', message: 'Initializing...' });
    
    try {
      let resultBlob: Blob;
      
      // Use the appropriate enhancement preset based on mode
      switch (enhanceMode) {
        case 'voice':
          resultBlob = await audioEnhanceService.optimizeVoice(audioFile, setProgress);
          break;
        case 'music':
          resultBlob = await audioEnhanceService.masterMusic(audioFile, setProgress);
          break;
        case 'quick':
        default:
          resultBlob = await audioEnhanceService.quickCleanup(audioFile, setProgress);
          break;
      }
      
      // Clean up previous URL
      if (enhancedUrl) {
        URL.revokeObjectURL(enhancedUrl);
      }
      
      setEnhancedBlob(resultBlob);
      setEnhancedUrl(URL.createObjectURL(resultBlob));
      toast.success('Audio enhanced successfully with real FFmpeg processing!');
    } catch (error) {
      console.error('Audio enhancement failed:', error);
      toast.error(error instanceof Error ? error.message : 'Audio enhancement failed');
    } finally {
      setProcessing(false);
    }
  }, [audioFile, enhanceMode, enhancedUrl]);

  const downloadEnhanced = useCallback(() => {
    if (!enhancedUrl || !enhancedBlob) return;
    
    const a = document.createElement('a');
    a.href = enhancedUrl;
    const originalName = audioFile?.name.replace(/\.[^/.]+$/, '') || 'audio';
    a.download = `${originalName}_enhanced.mp3`;
    a.click();
    toast.success('Enhanced audio downloaded!');
  }, [enhancedUrl, enhancedBlob, audioFile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              Real Audio Enhancement
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs ml-2">FFmpeg WASM</Badge>
            </CardTitle>
            <p className="text-sm text-slate-400 mt-2">
              Real audio processing with noise reduction, EQ, compression, and normalization
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enhancement Mode Selection */}
            <div className="space-y-2">
              <Label className="text-slate-300">Enhancement Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={enhanceMode === 'quick' ? 'default' : 'outline'}
                  onClick={() => setEnhanceMode('quick')}
                  className={enhanceMode === 'quick' ? 'bg-gold text-black' : 'border-slate-600'}
                  disabled={processing}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Quick Clean
                </Button>
                <Button
                  variant={enhanceMode === 'voice' ? 'default' : 'outline'}
                  onClick={() => setEnhanceMode('voice')}
                  className={enhanceMode === 'voice' ? 'bg-gold text-black' : 'border-slate-600'}
                  disabled={processing}
                >
                  <Radio className="w-4 h-4 mr-2" />
                  Voice/Podcast
                </Button>
                <Button
                  variant={enhanceMode === 'music' ? 'default' : 'outline'}
                  onClick={() => setEnhanceMode('music')}
                  className={enhanceMode === 'music' ? 'bg-gold text-black' : 'border-slate-600'}
                  disabled={processing}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Music Master
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                {enhanceMode === 'quick' && 'Basic cleanup: removes background noise and normalizes volume'}
                {enhanceMode === 'voice' && 'Optimized for speech: compression, de-essing, voice EQ'}
                {enhanceMode === 'music' && 'Music mastering: wide frequency range, gentle limiting'}
              </p>
            </div>

            {/* File Upload */}
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              className="border-slate-600 text-slate-300"
              disabled={processing}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Audio File (max 100MB)
            </Button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              onChange={handleFileUpload} 
            />

            {audioUrl && (
              <div className="space-y-4">
                {/* Original Audio */}
                <div className="p-3 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-400 text-sm">Original Audio</p>
                    <span className="text-xs text-slate-500">
                      {audioFile && `${(audioFile.size / 1024 / 1024).toFixed(1)}MB`}
                    </span>
                  </div>
                  <audio controls src={audioUrl} className="w-full" />
                </div>

                {/* Progress */}
                {processing && progress && (
                  <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-gold animate-spin" />
                      <span className="text-sm text-white">{progress.message}</span>
                    </div>
                    <Progress value={progress.percent} className="h-2" />
                    <p className="text-xs text-slate-500">
                      Stage: {progress.stage} • {progress.percent}%
                    </p>
                  </div>
                )}

                {/* Enhance Button */}
                <Button 
                  onClick={enhanceAudio} 
                  disabled={processing} 
                  className="w-full bg-gold text-black hover:bg-gold/90"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing with FFmpeg...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Enhance Audio (Real Processing)
                    </>
                  )}
                </Button>

                {/* Enhanced Result */}
                {enhancedUrl && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-emerald-400 text-sm font-medium">✓ Enhanced Audio</p>
                      <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">
                        {enhancedBlob && `${(enhancedBlob.size / 1024 / 1024).toFixed(1)}MB`}
                      </Badge>
                    </div>
                    <audio controls src={enhancedUrl} className="w-full" />
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={downloadEnhanced}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Enhanced Audio
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                <strong>Real FFmpeg Processing:</strong> Uses WebAssembly FFmpeg for actual audio filtering including 
                high-pass/low-pass EQ, noise reduction (afftdn), dynamic compression, and EBU R128 loudness normalization.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Audio Translation Component
function AudioTranslationPanel() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ar');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedText, setTranslatedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  }, []);

  const translateAudio = useCallback(async () => {
    if (!audioFile) return;
    
    setProcessing(true);
    setProgress(10);

    try {
      // Step 1: Transcribe
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });

      setProgress(30);

      const transcribeResponse = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio, language: sourceLang },
      });

      if (transcribeResponse.error || !transcribeResponse.data.text) {
        throw new Error('Transcription failed');
      }

      setProgress(60);

      // Step 2: Translate using AI
      const translateResponse = await supabase.functions.invoke('auto-translate', {
        body: { 
          text: transcribeResponse.data.text,
          targetLang: targetLang,
          sourceLang: sourceLang
        },
      });

      setProgress(90);

      if (translateResponse.data?.translatedText) {
        setTranslatedText(translateResponse.data.translatedText);
        toast.success('Translation complete!');
      } else {
        // Fallback: just show transcription with note
        setTranslatedText(`[Original (${sourceLang})]: ${transcribeResponse.data.text}\n\n[Note: Translation service unavailable - please use an external translator]`);
        toast.info('Transcription complete. External translation may be needed.');
      }

      setProgress(100);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [audioFile, sourceLang, targetLang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Languages className="h-5 w-5 text-gold" />
              Audio Translation
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs ml-2">FREE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-slate-600 text-slate-300">
              <Upload className="w-4 h-4 mr-2" />
              Upload Audio File
            </Button>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />

            {audioUrl && (
              <div className="p-3 bg-slate-800 rounded-lg">
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">From</Label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">To</Label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={translateAudio} disabled={!audioFile || processing} className="w-full bg-gold text-black hover:bg-gold/90">
              {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Translating...</> : 'Translate Audio'}
            </Button>

            {processing && <Progress value={progress} className="h-2" />}

            {translatedText && (
              <div className="space-y-2">
                <Label className="text-slate-300">Translated Text</Label>
                <Textarea value={translatedText} readOnly rows={6} className="bg-slate-800 border-slate-600 text-white" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VoiceSuite() {
  return (
    <>
      <SEOHead 
        title="Voice & Audio Suite | JBJ Royal Tools"
        description="AI voice generation, text-to-speech, voice-to-text, audio enhancement, and translation tools."
      />
      
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/toolkit">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600"
                  style={{ color: '#a1a1aa', backgroundColor: 'transparent' }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" style={{ color: '#a1a1aa' }} />
                  <span style={{ color: '#a1a1aa' }}>Back to Royal Tools Hub</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 flex items-center justify-center">
                <Mic className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Voice & Audio <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-400 text-sm">TTS, voice cloning, transcription, enhancement & translation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - 4 tabs with REAL tools */}
        <Tabs defaultValue="tts" className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 overflow-x-auto">
                <TabsTrigger
                  value="tts"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline">Voice Studio</span>
                </TabsTrigger>
                <TabsTrigger
                  value="stt"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FileAudio className="w-4 h-4" />
                  <span className="hidden sm:inline">Voice-to-Text</span>
                </TabsTrigger>
                <TabsTrigger
                  value="enhance"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Enhance</span>
                </TabsTrigger>
                <TabsTrigger
                  value="translate"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Languages className="w-4 h-4" />
                  <span className="hidden sm:inline">Translate</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            <TabsContent value="tts" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <VoiceStudio />
              </Suspense>
            </TabsContent>

            <TabsContent value="stt" className="mt-0">
              <VoiceToTextPanel />
            </TabsContent>

            <TabsContent value="enhance" className="mt-0">
              <AudioCleanupPanel />
            </TabsContent>

            <TabsContent value="translate" className="mt-0">
              <AudioTranslationPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
