import React, { useEffect } from 'react';
import { AIVideoStudio } from '@/components/ai-video-studio/AIVideoStudio';

export default function AIVideoStudioPage() {
  // Inject a sentinel that MainLayout's useLayoutEffect looks for,
  // so it treats this page as a "dark hero" page (no top padding).
  useEffect(() => {
    const sentinel = document.createElement('div');
    sentinel.className = 'jj-hero-fullscreen';
    sentinel.style.display = 'none';
    document.body.appendChild(sentinel);
    return () => { document.body.removeChild(sentinel); };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 10000, background: '#020617' }}>
      <AIVideoStudio />
    </div>
  );
}

