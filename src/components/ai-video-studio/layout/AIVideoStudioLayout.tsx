import React, { ReactNode, useState, useImperativeHandle, forwardRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Languages, Mic, Sparkles, Music2, Layers, Maximize2,
  Map, Bot, FolderOpen, ChevronUp, ChevronDown, Settings2, Type, Clapperboard
} from 'lucide-react';

export interface AIVideoStudioLayoutHandle {
  toggleTool: (toolId: string) => void;
}

interface AIVideoStudioLayoutProps {
  topBar: ReactNode;
  centerPanel: ReactNode;
  timeline: ReactNode;
  exportBar: ReactNode;
  // Tool panel content keyed by tool id
  mediaPanel?: ReactNode;
  inspectorPanel?: ReactNode;
  captionsPanel?: ReactNode;
  textPanel?: ReactNode;
  voicePanel?: ReactNode;
  beautyPanel?: ReactNode;
  sfxPanel?: ReactNode;
  effectsPanel?: ReactNode;
  transitionsPanel?: ReactNode;
  resizePanel?: ReactNode;
  mapPanel?: ReactNode;
  aiEditorPanel?: ReactNode;
  projectsPanel?: ReactNode;
}

const TOOL_TABS = [
  { id: 'media',       label: 'Media',       icon: FolderOpen  },
  { id: 'captions',   label: 'Captions',    icon: Languages   },
  { id: 'voice',      label: 'Voice',       icon: Mic         },
  { id: 'beauty',     label: 'Beauty',      icon: Sparkles    },
  { id: 'text',       label: 'Text',        icon: Type        },
  { id: 'sfx',        label: 'Sound FX',    icon: Music2      },
  { id: 'effects',    label: 'Effects',     icon: Layers      },
  { id: 'transitions',label: 'Transitions', icon: Clapperboard},
  { id: 'resize',     label: 'Resize',      icon: Maximize2   },
  { id: 'map',        label: 'Map',         icon: Map         },
  { id: 'ai-editor',  label: 'AI Editor',   icon: Bot         },
  { id: 'inspector',  label: 'Inspector',   icon: Settings2   },
  { id: 'projects',   label: 'Projects',    icon: FolderOpen  },
];

export const AIVideoStudioLayout = forwardRef<AIVideoStudioLayoutHandle, AIVideoStudioLayoutProps>(
function AIVideoStudioLayout({
  topBar,
  centerPanel,
  timeline,
  exportBar,
  mediaPanel,
  inspectorPanel,
  captionsPanel,
  textPanel,
  voicePanel,
  beautyPanel,
  sfxPanel,
  effectsPanel,
  transitionsPanel,
  resizePanel,
  mapPanel,
  aiEditorPanel,
  projectsPanel,
}, ref) {
  const isMobile = useIsMobile();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  // Expose imperative toggle for keyboard shortcut wiring in the parent
  useImperativeHandle(ref, () => ({
    toggleTool(toolId: string) {
      setActiveTool(prev => {
        if (prev === toolId) {
          setToolsExpanded(exp => !exp);
          return prev;
        }
        setToolsExpanded(true);
        return toolId;
      });
    },
  }), []);

  const toolPanelContent: Record<string, ReactNode> = {
    media:       mediaPanel,
    captions:    captionsPanel,
    voice:       voicePanel,
    beauty:      beautyPanel,
    text:        textPanel,
    sfx:         sfxPanel,
    effects:     effectsPanel,
    transitions: transitionsPanel,
    resize:      resizePanel,
    map:         mapPanel,
    'ai-editor': aiEditorPanel,
    inspector:   inspectorPanel,
    projects:    projectsPanel,
  };

  const handleToolClick = (toolId: string) => {
    if (activeTool === toolId) {
      // Toggle collapse/expand when clicking the same tool
      setToolsExpanded(prev => !prev);
    } else {
      setActiveTool(toolId);
      setToolsExpanded(true);
    }
  };


  const ToolsBar = () => (
    <div className="flex-shrink-0 bg-slate-800 border-t border-slate-600">
      {/* Horizontal Tool Tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide">
        {TOOL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleToolClick(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
                isActive && toolsExpanded
                  ? 'bg-amber-500 text-black border-amber-500'
                  : isActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'text-slate-100 border-slate-500 bg-slate-700 hover:text-white hover:bg-slate-600 hover:border-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
        <div className="ml-auto flex-shrink-0">
          {activeTool && (
            <button
              onClick={() => setToolsExpanded(prev => !prev)}
              className="p-1.5 rounded text-slate-200 hover:text-white hover:bg-slate-600 transition-all"
            >
              {toolsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Active Tool Panel — expands to fill available space, no inner scroll trap */}
      {activeTool && toolsExpanded && toolPanelContent[activeTool] && (
        <div className="border-t border-slate-600 flex-shrink-0 bg-slate-900" style={{ height: 'clamp(260px, 38vh, 480px)' }}>
          <div className="h-full overflow-y-auto overscroll-contain">
            {toolPanelContent[activeTool]}
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
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
              {mediaPanel}
            </TabsContent>
            <TabsContent value="inspector" className="flex-1 min-h-0 m-0 overflow-auto bg-slate-900/50">
              {inspectorPanel}
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
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-slate-700">
        {topBar}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Full-width Preview — contracts when tool panel is expanded */}
        <div
          className="w-full overflow-hidden bg-slate-950"
          style={{ flex: activeTool && toolsExpanded ? '0 0 auto' : '1 1 auto', minHeight: activeTool && toolsExpanded ? 180 : 280 }}
        >
          {centerPanel}
        </div>

        {/* Horizontal CapCut-style Tools Bar (full width) */}
        <ToolsBar />

        {/* Timeline */}
        <div className="flex-shrink-0 h-44 overflow-auto bg-slate-900 border-t border-slate-700 overscroll-contain">
          {timeline}
        </div>
      </div>

      {/* Export Bar */}
      <div className="flex-shrink-0 border-t border-slate-700">
        {exportBar}
      </div>
    </div>
  );
});

