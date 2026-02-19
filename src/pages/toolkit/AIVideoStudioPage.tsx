import React from 'react';
import { AIVideoStudio } from '@/components/ai-video-studio/AIVideoStudio';

export default function AIVideoStudioPage() {
  return (
    <div className="w-full overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      <AIVideoStudio />
    </div>
  );
}
