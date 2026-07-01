import React from 'react';
import { AIVideoStudio } from '@/components/ai-video-studio/AIVideoStudio';
import { ToolAnimatedFrame } from '@/components/tools/PremiumToolShell';
import { toolThemes } from '@/components/tools/toolThemes';

export default function AIVideoStudioPage() {
  return (
    <ToolAnimatedFrame theme={toolThemes.emerald}>
      <AIVideoStudio />
    </ToolAnimatedFrame>
  );
}
