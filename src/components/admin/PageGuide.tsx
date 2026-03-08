/**
 * PageGuide Component
 * Universal guide modal for admin pages - explains what each page is for
 */

import React from 'react';
import { HelpCircle, X, Lightbulb, Info, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface GuideContent {
  title: string;
  icon?: React.ReactNode;
  description: string;
  whatIs: string;
  benefits: string[];
  howToUse: string[];
  tips?: string[];
}

interface PageGuideProps {
  guide: GuideContent;
  className?: string;
}

const PageGuide: React.FC<PageGuideProps> = ({ guide, className }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]",
            "hover:border-gold hover:bg-gold/10 text-black font-medium",
            "shadow-[0_2px_10px_rgba(200,167,102,0.15)]",
            className
          )}
        >
          <HelpCircle className="w-4 h-4 text-gold" />
          Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-black text-xl">
            {guide.icon || <Info className="w-6 h-6 text-gold" />}
            {guide.title}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 rounded-xl bg-white/60 border border-gold/20">
              <p className="text-black leading-relaxed">{guide.description}</p>
            </div>

            {/* What is it? */}
            <div>
              <h3 className="flex items-center gap-2 text-black font-semibold mb-3">
                <Info className="w-5 h-5 text-blue-500" />
                What is this?
              </h3>
              <p className="text-black/80 leading-relaxed pl-7">{guide.whatIs}</p>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="flex items-center gap-2 text-black font-semibold mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Benefits
              </h3>
              <ul className="space-y-2 pl-7">
                {guide.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-black/80">
                    <span className="text-gold font-bold mt-0.5">•</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* How to Use */}
            <div>
              <h3 className="flex items-center gap-2 text-black font-semibold mb-3">
                <ArrowRight className="w-5 h-5 text-gold" />
                How to Use
              </h3>
              <ol className="space-y-3 pl-7">
                {guide.howToUse.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-black/80">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold font-bold text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {guide.tips && guide.tips.length > 0 && (
              <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
                <h3 className="flex items-center gap-2 text-black font-semibold mb-3">
                  <Lightbulb className="w-5 h-5 text-gold" />
                  Pro Tips
                </h3>
                <ul className="space-y-2">
                  {guide.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-black/80">
                      <Lightbulb className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PageGuide;
