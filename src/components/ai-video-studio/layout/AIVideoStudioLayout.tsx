import React, { ReactNode, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

interface AIVideoStudioLayoutProps {
  topBar: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  toolsPanel?: ReactNode;
  timeline: ReactNode;
  exportBar: ReactNode;
}

export function AIVideoStudioLayout({
  topBar,
  leftPanel,
  centerPanel,
  rightPanel,
  toolsPanel,
  timeline,
  exportBar,
}: AIVideoStudioLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
        {/* Top Bar */}
        <div className="flex-shrink-0 border-b border-slate-800">
          {topBar}
        </div>

        {/* Tabbed Panels */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex-shrink-0 w-full justify-start bg-slate-900 border-b border-slate-800 rounded-none px-2 h-10">
              <TabsTrigger value="preview" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md">Preview</TabsTrigger>
              <TabsTrigger value="media" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md">Media</TabsTrigger>
              <TabsTrigger value="inspector" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md">Inspector</TabsTrigger>
              {toolsPanel && (
                <TabsTrigger value="tools" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-md">Tools</TabsTrigger>
              )}
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
            {toolsPanel && (
              <TabsContent value="tools" className="flex-1 min-h-0 m-0 overflow-auto bg-slate-900/50">
                {toolsPanel}
              </TabsContent>
            )}
          </Tabs>

          {/* Timeline - horizontal scroll strip */}
          <div className="flex-shrink-0 h-32 overflow-x-auto overflow-y-hidden bg-slate-900 border-t border-slate-800">
            {timeline}
          </div>
        </div>

        {/* Export Bar */}
        <div className="flex-shrink-0 border-t border-slate-800">
          {exportBar}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-slate-800">
        {topBar}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="vertical" className="h-full">
          {/* Upper Section (Panels) */}
          <ResizablePanel defaultSize={65} minSize={40}>
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Left Panel - Media Library */}
              <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
                <div className="h-full overflow-hidden border-r border-slate-800 bg-slate-900/50">
                  {leftPanel}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800 hover:bg-gold/50 transition-colors" />

              {/* Center Panel - Preview */}
              <ResizablePanel defaultSize={44} minSize={25}>
                <div className="h-full overflow-hidden bg-slate-950">
                  {centerPanel}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800 hover:bg-gold/50 transition-colors" />

              {/* Right Panel - Inspector */}
              <ResizablePanel defaultSize={20} minSize={12} maxSize={30}>
                <div className="h-full overflow-hidden border-l border-slate-800 bg-slate-900/50">
                  {rightPanel}
                </div>
              </ResizablePanel>

              {/* Tools Panel (integrated video tools) */}
              {toolsPanel && (
                <>
                  <ResizableHandle withHandle className="bg-slate-800 hover:bg-gold/50 transition-colors" />
                  <ResizablePanel defaultSize={18} minSize={12} maxSize={28}>
                    <div className="h-full overflow-hidden border-l border-slate-800 bg-slate-900/50">
                      {toolsPanel}
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-800 hover:bg-gold/50 transition-colors" />

          {/* Timeline Section */}
          <ResizablePanel defaultSize={35} minSize={20} maxSize={60}>
            <div className="h-full overflow-hidden bg-slate-900 border-t border-slate-800">
              {timeline}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Export Bar */}
      <div className="flex-shrink-0 border-t border-slate-800">
        {exportBar}
      </div>
    </div>
  );
}
