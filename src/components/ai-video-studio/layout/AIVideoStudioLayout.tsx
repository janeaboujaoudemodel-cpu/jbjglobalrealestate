import React, { ReactNode } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface AIVideoStudioLayoutProps {
  topBar: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  timeline: ReactNode;
  exportBar: ReactNode;
}

export function AIVideoStudioLayout({
  topBar,
  leftPanel,
  centerPanel,
  rightPanel,
  timeline,
  exportBar,
}: AIVideoStudioLayoutProps) {
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
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full overflow-hidden border-r border-slate-800 bg-slate-900/50">
                  {leftPanel}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800 hover:bg-gold/50 transition-colors" />

              {/* Center Panel - Preview */}
              <ResizablePanel defaultSize={55} minSize={30}>
                <div className="h-full overflow-hidden bg-slate-950">
                  {centerPanel}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800 hover:bg-gold/50 transition-colors" />

              {/* Right Panel - Inspector */}
              <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                <div className="h-full overflow-hidden border-l border-slate-800 bg-slate-900/50">
                  {rightPanel}
                </div>
              </ResizablePanel>
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
