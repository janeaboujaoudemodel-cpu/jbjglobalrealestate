/**
 * Voice & Audio Suite - Master page for all audio output tools
 * Tabs: Voice Studio | Voice-to-Text | Audio Cleanup | Translation
 */

import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { 
  Mic, FileAudio, Wand2, Languages, ArrowLeft, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load the components
const VoiceoverRecorder = lazy(() => import('@/components/ai-video-studio/features/VoiceoverRecorder').then(m => ({ default: m.VoiceoverRecorder })));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

// Speech-to-Text Panel
const SpeechToTextPanel = () => (
  <div className="p-8 text-center">
    <FileAudio className="w-16 h-16 text-gold mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">Voice-to-Text (STT)</h3>
    <p className="text-zinc-400 max-w-md mx-auto mb-6">
      Upload audio files or record directly to get accurate transcriptions powered by AI.
    </p>
    <div className="max-w-xl mx-auto space-y-4">
      <div className="p-6 bg-slate-800/50 rounded-xl border-2 border-dashed border-gold/30 hover:border-gold/50 transition-colors cursor-pointer">
        <FileAudio className="w-10 h-10 text-gold/60 mx-auto mb-3" />
        <p className="text-white font-medium">Drop audio file here</p>
        <p className="text-zinc-500 text-sm mt-1">MP3, WAV, M4A up to 25MB</p>
      </div>
      <p className="text-zinc-500 text-sm">Supports 50+ languages with automatic detection</p>
    </div>
  </div>
);

// Audio Cleanup Panel
const AudioCleanupPanel = () => (
  <div className="p-8 text-center">
    <Wand2 className="w-16 h-16 text-gold mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">Audio Cleanup</h3>
    <p className="text-zinc-400 max-w-md mx-auto mb-6">
      Remove background noise, enhance voice clarity, and improve audio quality.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
      {[
        { title: 'Noise Removal', desc: 'Remove background noise' },
        { title: 'Voice Enhancement', desc: 'Boost clarity and presence' },
        { title: 'Volume Normalize', desc: 'Balance audio levels' },
      ].map((feature) => (
        <div key={feature.title} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20">
          <h4 className="text-white font-medium mb-1">{feature.title}</h4>
          <p className="text-zinc-500 text-xs">{feature.desc}</p>
        </div>
      ))}
    </div>
    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm">
      <Sparkles className="w-4 h-4" />
      Coming Soon
    </div>
  </div>
);

// Audio Translation Panel
const AudioTranslationPanel = () => (
  <div className="p-8 text-center">
    <Languages className="w-16 h-16 text-gold mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">Audio Translation</h3>
    <p className="text-zinc-400 max-w-md mx-auto mb-6">
      Translate spoken audio to another language while preserving voice characteristics.
    </p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
      {['English', 'Arabic', 'Russian', 'Chinese', 'Hindi', 'French', 'Spanish', 'German'].map((lang) => (
        <div key={lang} className="p-3 bg-slate-800/50 rounded-lg border border-gold/20 hover:border-gold/50 transition-colors cursor-pointer">
          <p className="text-sm text-white">{lang}</p>
        </div>
      ))}
    </div>
    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm">
      <Sparkles className="w-4 h-4" />
      Coming Soon
    </div>
  </div>
);

export default function VoiceSuite() {
  const [activeTab, setActiveTab] = useState('tts');

  const tabs = [
    { id: 'tts', label: 'Voice Studio', icon: Mic, description: 'Text-to-speech & cloning' },
    { id: 'stt', label: 'Voice-to-Text', icon: FileAudio, description: 'Speech recognition' },
    { id: 'cleanup', label: 'Audio Cleanup', icon: Wand2, description: 'Noise removal & enhancement' },
    { id: 'translate', label: 'Translation', icon: Languages, description: 'Translate audio' },
  ];

  return (
    <>
      <SEOHead 
        title="Voice & Audio Suite | JBJ Royal Tools"
        description="AI voice generation, speech-to-text, audio cleanup, and translation tools for professional content."
      />
      
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/toolkit">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Toolkit
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
                <p className="text-zinc-400 text-sm">
                  TTS, speech recognition, cleanup & translation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            <TabsContent value="tts" className="mt-0">
              <div className="max-w-4xl mx-auto p-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <VoiceoverRecorder 
                    onRecordingComplete={() => {}}
                    onAIVoiceGenerated={() => {}}
                  />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="stt" className="mt-0 bg-slate-950 min-h-[60vh]">
              <SpeechToTextPanel />
            </TabsContent>

            <TabsContent value="cleanup" className="mt-0 bg-slate-950 min-h-[60vh]">
              <AudioCleanupPanel />
            </TabsContent>

            <TabsContent value="translate" className="mt-0 bg-slate-950 min-h-[60vh]">
              <AudioTranslationPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
