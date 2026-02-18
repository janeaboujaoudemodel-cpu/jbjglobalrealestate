import React, { ReactNode, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Languages, Mic, Sparkles, Music2, Layers, Maximize2, Map, Bot, FolderOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIVideoStudioLayoutProps {
  topBar: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  timeline: ReactNode;
  exportBar: ReactNode;
  // Tool panel content keyed by tool id
  captionsPanel?: ReactNode;
  voicePanel?: ReactNode;
  beautyPanel?: ReactNode;
  sfxPanel?: ReactNode;
  effectsPanel?: ReactNode;
  resizePanel?: ReactNode;
  mapPanel?: ReactNode;
  aiEditorPanel?: ReactNode;
  projectsPanel?: ReactNode;
}

const TOOL_TABS = [
  { id: 'captions', label: 'Captions', icon: Languages },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'beauty', label: 'Beauty', icon: Sparkles },
  { id: 'sfx', label: 'Sound FX', icon: Music2 },
  { id: 'effects', label: 'Effects', icon: Layers },
  { id: 'resize', label: 'Resize', icon: Maximize2 },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'ai-editor', label: 'AI Editor', icon: Bot },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
];

export function AIVideoStudioLayout({
  topBar,
  leftPanel,
  centerPanel,
  rightPanel,
  timeline,
  exportBar,
  captionsPanel,
  voicePanel,
  beautyPanel,
  sfxPanel,
  effectsPanel,
  resizePanel,
  mapPanel,
  aiEditorPanel,
  projectsPanel,
}: AIVideoStudioLayoutProps) {
  const isMobile = useIsMobile();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  const toolPanelContent: Record<string, ReactNode> = {
    captions: captionsPanel,
    voice: voicePanel,
    beauty: beautyPanel,
    sfx: sfxPanel,
    effects: effectsPanel,
    resize: resizePanel,
    map: mapPanel,
    'ai-editor': aiEditorPanel,
    projects: projectsPanel,
  };

  const handleToolClick = (toolId: string) => {
    if (activeTool === toolId) {
      setToolsExpanded(prev => !prev);
    } else {
      setActiveTool(toolId);
      setToolsExpanded(true);
    }
  };

  const ToolsBar = () => (
    <div className="flex-shrink-0 bg-slate-900 border-t border-slate-700">
      {/* Horizontal Tool Tabs */}
      <div className="flex items-center gap-1 px-2 py-1 overflow-x-auto scrollbar-hide">
        {TOOL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleToolClick(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isActive && toolsExpanded
                  ? 'bg-amber-500 text-black'
                  : isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
        <div className="ml-auto flex-shrink-0">
          {activeTool && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setToolsExpanded(prev => !prev)}
              className="text-slate-400 hover:text-white h-7 w-7 p-0"
            >
              {toolsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Active Tool Panel */}
      {activeTool && toolsExpanded && toolPanelContent[activeTool] && (
        <div className="border-t border-slate-700 h-64 overflow-hidden bg-slate-900/80">
          {toolPanelContent[activeTool]}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex-shrink-0 border-b border-slate-700">
          {topBar}
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex-shrink-0 w-full justify-start bg-slate-900 border-b border-slate-700 rounded-none px-2 h-10">
              <TabsTrigger value="preview" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md text-slate-300">Preview</TabsTrigger>
              <TabsTrigger value="media" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md text-slate-300">Media</TabsTrigger>
              <TabsTrigger value="inspector" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md text-slate-300">Inspector</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-1 min-h-0 m-0 overflow-auto bg-slate-950">
              {centerPanel}
            </TabsContent>
            <TabsContent value="media" className="flex-1 min-h-0 m-0 overflow-auto bg-slate-900/50">
              {leftPanel}
            </TabsContent>
            <TabsContent value="inspector" className="flex-1 min-h-0 m-0 overflow-auto bg-slate-900/50">
              {rightPanel}
            </TabsContent>
          </Tabs>

          <ToolsBar />

          <div className="flex-shrink-0 h-32 overflow-x-auto overflow-y-hidden bg-slate-900 border-t border-slate-700">
            {timeline}
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-slate-700">
          {exportBar}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-slate-700">
        {topBar}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Upper 3-column section */}
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Media Library */}
            <ResizablePanel defaultSize={18} minSize={12} maxSize={28}>
              <div className="h-full overflow-hidden border-r border-slate-700 bg-slate-900/50">
                {leftPanel}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-slate-700 hover:bg-amber-500/50 transition-colors" />

            {/* Center Panel - Preview */}
            <ResizablePanel defaultSize={54} minSize={30}>
              <div className="h-full overflow-hidden bg-slate-950">
                {centerPanel}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-slate-700 hover:bg-amber-500/50 transition-colors" />

            {/* Right Panel - Inspector */}
            <ResizablePanel defaultSize={28} minSize={18} maxSize={35}>
              <div className="h-full overflow-hidden border-l border-slate-700 bg-slate-900/50">
                {rightPanel}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Horizontal CapCut-style Tools Bar (full width) */}
        <ToolsBar />

        {/* Timeline */}
        <div className="flex-shrink-0 h-48 overflow-hidden bg-slate-900 border-t border-slate-700">
          {timeline}
        </div>
      </div>

      {/* Export Bar */}
      <div className="flex-shrink-0 border-t border-slate-700">
        {exportBar}
      </div>
    </div>
  );
}
