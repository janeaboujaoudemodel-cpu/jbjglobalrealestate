/**
 * Voice & Audio Suite - Embeds the REAL VoiceStudio page
 * Only VoiceStudio exists as a real tool - no fake panels
 */

import React, { lazy, Suspense } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Mic, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load the REAL VoiceStudio PAGE
const VoiceStudio = lazy(() => import('@/pages/toolkit/VoiceStudio'));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

export default function VoiceSuite() {
  return (
    <>
      <SEOHead 
        title="Voice & Audio Suite | JBJ Royal Tools"
        description="AI voice generation, text-to-speech, and voice enhancement tools."
      />
      
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/toolkit">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Toolkit
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 flex items-center justify-center">
                <Mic className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Voice & Audio <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-400 text-sm">Text-to-speech, voice recording & enhancement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real VoiceStudio page embedded - no fake tabs */}
        <Suspense fallback={<LoadingSpinner />}>
          <VoiceStudio />
        </Suspense>
      </div>
    </>
  );
}
