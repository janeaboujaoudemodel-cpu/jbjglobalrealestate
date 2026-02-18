import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('captions');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);

  const tabs = [
    { id: 'captions', label: 'Captions', icon: Languages },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'beauty', label: 'Beauty', icon: Sparkles },
    { id: 'resize', label: 'Resize', icon: Maximize2 },
  ];

  // No-op stub — CaptionTranslator now handles its own transcription internally
  const handleTranscribe = async (): Promise<SubtitleSegment[]> => [];

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-slate-800 bg-slate-900 p-0 h-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-400 data-[state=active]:text-amber-400 py-2 px-1 text-xs gap-1"
            >
              <tab.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="captions" className="mt-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
            <CaptionTranslator 
              subtitles={subtitles}
              onSubtitlesUpdate={setSubtitles}
              onTranscribe={handleTranscribe}
            />
          </TabsContent>

          <TabsContent value="voice" className="mt-0 h-full p-3">
            <VoiceoverRecorder 
              onRecordingComplete={(blob, duration) => onAddVoiceover?.(blob, duration)}
              onAIVoiceGenerated={(url, duration) => onAddAIVoice?.(url, duration)}
            />
          </TabsContent>

          <TabsContent value="beauty" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <BeautyFiltersPanel />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resize" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <VideoResizePanel />
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
