import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Mic, 
  Languages, 
  Maximize2
} from 'lucide-react';
import { BeautyFiltersPanel } from './BeautyFiltersPanel';
import { VideoResizePanel } from './VideoResizePanel';
import { VoiceoverRecorder } from './VoiceoverRecorder';
import { CaptionTranslator } from './CaptionTranslator';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  language: string;
  translations?: Record<string, string>;
}

interface IntegratedToolsPanelProps {
  onAddVoiceover?: (audioBlob: Blob, duration: number) => void;
  onAddAIVoice?: (audioUrl: string, duration: number) => void;
}

export function IntegratedToolsPanel({ onAddVoiceover, onAddAIVoice }: IntegratedToolsPanelProps) {
  const [activeTab, setActiveTab] = useState('voice');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);

  const tabs = [
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'captions', label: 'Captions', icon: Languages },
    { id: 'beauty', label: 'Beauty', icon: Sparkles },
    { id: 'resize', label: 'Resize', icon: Maximize2 },
  ];

  const handleRecordingComplete = useCallback((blob: Blob, duration: number) => {
    onAddVoiceover?.(blob, duration);
  }, [onAddVoiceover]);

  const handleAIVoiceGenerated = useCallback((url: string, duration: number) => {
    onAddAIVoice?.(url, duration);
  }, [onAddAIVoice]);

  const handleTranscribe = useCallback(async (): Promise<SubtitleSegment[]> => {
    // Mock transcription for now
    const mockSubtitles: SubtitleSegment[] = [
      { id: '1', startTime: 0, endTime: 2, text: 'Welcome to this video.', language: 'en' },
      { id: '2', startTime: 2, endTime: 5, text: 'Today we will explore something amazing.', language: 'en' },
    ];
    return mockSubtitles;
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-slate-800 bg-slate-900 p-0 h-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold py-2 px-1 text-xs gap-1"
            >
              <tab.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="voice" className="mt-0 h-full p-3">
            <VoiceoverRecorder 
              onRecordingComplete={handleRecordingComplete}
              onAIVoiceGenerated={handleAIVoiceGenerated}
            />
          </TabsContent>

          <TabsContent value="captions" className="mt-0 h-full p-3">
            <CaptionTranslator 
              subtitles={subtitles}
              onSubtitlesUpdate={setSubtitles}
              onTranscribe={handleTranscribe}
            />
          </TabsContent>

          <TabsContent value="beauty" className="mt-0 h-full">
            <BeautyFiltersPanel />
          </TabsContent>

          <TabsContent value="resize" className="mt-0 h-full">
            <VideoResizePanel />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
