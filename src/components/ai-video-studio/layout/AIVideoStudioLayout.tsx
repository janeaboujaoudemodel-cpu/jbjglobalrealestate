import React, { ReactNode, useState, useImperativeHandle, forwardRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Languages, Mic, Sparkles, Music2, Layers, Maximize2,
  Map, Bot, FolderOpen, ChevronUp, ChevronDown, Settings2, Type, Clapperboard, UserSquare2, History
} from 'lucide-react';

// ─── Luxury palette tokens ────────────────────────────────────────────────────
const C = {
  bgPrimary:    '#0A0A0F',
  bgSurface:    '#111118',
  bgCard:       '#18181F',
  bgButton:     '#1E1E28',
  bgButtonHov:  '#252530',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderActive: 'rgba(255,255,255,0.14)',
  borderAccent: 'rgba(200,168,122,0.35)',
  textPrimary:  '#F1F0EE',
  textSecondary:'#8A8A9A',
  accent:       '#C8A87A',
  accentGlow:   'rgba(200,168,122,0.15)',
  accentTabBg:  'rgba(200,168,122,0.1)',
  danger:       '#E05252',
} as const;

export interface AIVideoStudioLayoutHandle {
  toggleTool: (toolId: string) => void;
  openTool: (toolId: string) => void;
}

interface AIVideoStudioLayoutProps {
  topBar: ReactNode;
  centerPanel: ReactNode;
  timeline: ReactNode;
  exportBar: ReactNode;
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
  talkingAgentPanel?: ReactNode;
  historyPanel?: ReactNode;
}

const TOOL_TABS = [
  { id: 'media',          label: 'Media',       icon: FolderOpen    },
  { id: 'talking-agent',  label: 'AI Agent',    icon: UserSquare2   },
  { id: 'captions',       label: 'Captions',    icon: Languages     },
  { id: 'voice',          label: 'Voice',       icon: Mic           },
  { id: 'beauty',         label: 'Beauty',      icon: Sparkles      },
  { id: 'text',           label: 'Text',        icon: Type          },
  { id: 'sfx',            label: 'Sound FX',    icon: Music2        },
  { id: 'effects',        label: 'Effects',     icon: Layers        },
  { id: 'transitions',    label: 'Transitions', icon: Clapperboard  },
  { id: 'resize',         label: 'Resize',      icon: Maximize2     },
  { id: 'map',            label: 'Map',         icon: Map           },
  { id: 'ai-editor',      label: 'AI Editor',   icon: Bot           },
  { id: 'inspector',      label: 'Inspector',   icon: Settings2     },
  { id: 'projects',       label: 'Projects',    icon: FolderOpen    },
  { id: 'history',        label: 'Ad History',  icon: History       },
];

export const AIVideoStudioLayout = forwardRef<AIVideoStudioLayoutHandle, AIVideoStudioLayoutProps>(
function AIVideoStudioLayout({
  topBar, centerPanel, timeline, exportBar,
  mediaPanel, inspectorPanel, captionsPanel, textPanel, voicePanel,
  beautyPanel, sfxPanel, effectsPanel, transitionsPanel, resizePanel,
  mapPanel, aiEditorPanel, projectsPanel, talkingAgentPanel, historyPanel,
}, ref) {
  const isMobile = useIsMobile();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  useImperativeHandle(ref, () => ({
    toggleTool(toolId: string) {
      setActiveTool(prev => {
        if (prev === toolId) { setToolsExpanded(exp => !exp); return prev; }
        setToolsExpanded(true);
        return toolId;
      });
    },
    openTool(toolId: string) {
      setActiveTool(toolId);
      setToolsExpanded(true);
    },
  }), []);

  const toolPanelContent: Record<string, ReactNode> = {
    media: mediaPanel, captions: captionsPanel, voice: voicePanel,
    beauty: beautyPanel, text: textPanel, sfx: sfxPanel,
    effects: effectsPanel, transitions: transitionsPanel, resize: resizePanel,
    map: mapPanel, 'ai-editor': aiEditorPanel, inspector: inspectorPanel,
    projects: projectsPanel, 'talking-agent': talkingAgentPanel, history: historyPanel,
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
    <div
      className="flex-shrink-0 sticky top-[64px] z-20"
      style={{ background: C.bgSurface, borderTop: `1px solid ${C.borderSubtle}`, borderBottom: `1px solid ${C.borderSubtle}` }}
    >
      {/* Horizontal Tool Tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide">
        {TOOL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;
          const isOpenActive = isActive && toolsExpanded;
          return (
            <button
              key={tab.id}
              onClick={() => handleToolClick(tab.id)}
              style={{
                background: isOpenActive ? C.accentTabBg : isActive ? 'rgba(200,168,122,0.06)' : C.bgButton,
                border: isOpenActive
                  ? `1px solid ${C.borderAccent}`
                  : isActive
                  ? `1px solid rgba(200,168,122,0.2)`
                  : `1px solid ${C.borderSubtle}`,
                color: isActive ? C.accent : C.textSecondary,
                boxShadow: isOpenActive ? `0 0 10px ${C.accentGlow}` : undefined,
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 hover:opacity-90"
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
              style={{ color: C.textSecondary }}
              className="p-1.5 rounded transition-all hover:opacity-80"
            >
              {toolsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Active Tool Panel — auto height, no internal scroll cap */}
      {activeTool && toolsExpanded && toolPanelContent[activeTool] && (
        <div style={{ background: C.bgPrimary, borderTop: `1px solid ${C.borderSubtle}` }}>
          {toolPanelContent[activeTool]}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: C.bgPrimary, color: C.textPrimary }}>
        {/* TopBar sticky */}
        <div className="flex-shrink-0 sticky top-0 z-30" style={{ borderBottom: `1px solid ${C.borderSubtle}` }}>
          {topBar}
        </div>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
          <TabsList
            className="flex-shrink-0 w-full justify-start rounded-none px-2 h-10"
            style={{ background: C.bgSurface, borderBottom: `1px solid ${C.borderSubtle}` }}
          >
            {['preview', 'media', 'inspector'].map(v => (
              <TabsTrigger
                key={v}
                value={v}
                className="text-xs rounded-md capitalize"
                style={{ color: C.textSecondary }}
              >
                {v}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="preview" className="flex-none m-0" style={{ height: 240, background: C.bgPrimary }}>
            {centerPanel}
          </TabsContent>
          <TabsContent value="media" className="m-0" style={{ background: C.bgSurface }}>
            {mediaPanel}
          </TabsContent>
          <TabsContent value="inspector" className="m-0" style={{ background: C.bgSurface }}>
            {inspectorPanel}
          </TabsContent>
        </Tabs>

        <ToolsBar />

        <div className="flex-shrink-0 h-32 overflow-x-auto overflow-y-hidden" style={{ background: C.bgSurface, borderTop: `1px solid ${C.borderSubtle}` }}>
          {timeline}
        </div>

        <div className="flex-shrink-0" style={{ borderTop: `1px solid ${C.borderSubtle}` }}>
          {exportBar}
        </div>
      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen" style={{ background: C.bgPrimary, color: C.textPrimary }}>

      {/* Top Bar — sticky */}
      <div className="flex-shrink-0 sticky top-0 z-30" style={{ borderBottom: `1px solid ${C.borderSubtle}` }}>
        {topBar}
      </div>

      {/* Preview — FIXED height, NEVER shrinks */}
      <div
        className="flex-shrink-0 w-full"
        style={{ height: 360, background: C.bgPrimary }}
      >
        {centerPanel}
      </div>

      {/* Tools bar + active tool panel (sticky below topbar, auto-expands) */}
      <ToolsBar />

      {/* Timeline — fixed height */}
      <div
        className="flex-shrink-0 h-44 overflow-auto overscroll-contain"
        style={{ background: '#090910', borderTop: `1px solid ${C.borderSubtle}` }}
      >
        {timeline}
      </div>

      {/* Export Bar — sticky to bottom */}
      <div
        className="flex-shrink-0 sticky bottom-0 z-20"
        style={{ borderTop: `1px solid ${C.borderSubtle}`, background: C.bgSurface }}
      >
        {exportBar}
      </div>
    </div>
  );
});
