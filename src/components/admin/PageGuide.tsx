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
            "gap-2 border-2 border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]",
            "hover:border-[#B89555] hover:bg-[#EFE6D6]/10 text-[#1A1A1A] font-medium",
            "shadow-[0_2px_10px_rgba(200,167,102,0.15)]",
            className
          )}
        >
          <HelpCircle className="w-4 h-4 text-[#1A1A1A]" />
          Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-[#1A1A1A] text-xl">
            {guide.icon || <Info className="w-6 h-6 text-[#1A1A1A]" />}
            {guide.title}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 rounded-xl bg-[#FDFBF7]/60 border border-[#B89555]/20">
              <p className="text-[#1A1A1A] leading-relaxed">{guide.description}</p>
            </div>

            {/* What is it? */}
            <div>
              <h3 className="flex items-center gap-2 text-[#1A1A1A] font-semibold mb-3">
                <Info className="w-5 h-5 text-blue-500" />
                What is this?
              </h3>
              <p className="text-[#1A1A1A]/80 leading-relaxed pl-7">{guide.whatIs}</p>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="flex items-center gap-2 text-[#1A1A1A] font-semibold mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Benefits
              </h3>
              <ul className="space-y-2 pl-7">
                {guide.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[#1A1A1A]/80">
                    <span className="text-[#1A1A1A] font-bold mt-0.5">•</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* How to Use */}
            <div>
              <h3 className="flex items-center gap-2 text-[#1A1A1A] font-semibold mb-3">
                <ArrowRight className="w-5 h-5 text-[#1A1A1A]" />
                How to Use
              </h3>
              <ol className="space-y-3 pl-7">
                {guide.howToUse.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[#1A1A1A]/80">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EFE6D6]/20 text-[#1A1A1A] font-bold text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {guide.tips && guide.tips.length > 0 && (
              <div className="p-4 rounded-xl bg-[#EFE6D6]/10 border border-[#B89555]/30">
                <h3 className="flex items-center gap-2 text-[#1A1A1A] font-semibold mb-3">
                  <Lightbulb className="w-5 h-5 text-[#1A1A1A]" />
                  Pro Tips
                </h3>
                <ul className="space-y-2">
                  {guide.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[#1A1A1A]/80">
                      <Lightbulb className="w-3.5 h-3.5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
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
