import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  RefreshCw, 
  CheckCircle2,
  Sparkles,
  Share2,
  ZoomIn
} from 'lucide-react';
import { toast } from 'sonner';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { DesignMode } from './DesignModeSelector';

interface DesignResultsGalleryProps {
  images: string[];
  notes: string;
  projectName: string;
  onRequestRevision: () => void;
  onGenerateAnother: () => void;
  isSaving: boolean;
  mode?: DesignMode;
}

// Get button variant based on mode
const getButtonVariant = (mode?: DesignMode): "ai-fuchsia" | "ai-blue" | "ai-emerald" | "ai-orange" => {
  switch (mode) {
    case 'concept':
      return 'ai-fuchsia';
    case 'redesign':
      return 'ai-blue';
    case 'staging':
      return 'ai-emerald';
    case 'chat':
      return 'ai-orange';
    default:
      return 'ai-fuchsia';
  }
};

const DesignResultsGallery = ({
  images,
  notes,
  projectName,
  onRequestRevision,
  onGenerateAnother,
  isSaving,
  mode,
}: DesignResultsGalleryProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const downloadImage = async () => {
    if (!images.length) return;
    
    setIsDownloading(true);
    try {
      const imageUrl = images[0];
      
      // Handle base64 images
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${projectName || 'interior-design'}.png`;
        link.click();
      } else {
        // Handle URL images
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName || 'interior-design'}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadPdf = async () => {
    if (!images.length) return;
    
    setIsDownloading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();
      const margin = 40;

      const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      let y = height - margin;

      // Title
      page.drawText('JBJ Global Real Estate — AI Interior Design', {
        x: margin,
        y,
        size: 16,
        font: titleFont,
      });
      y -= 22;

      // Project info
      const meta = `Project: ${projectName || 'Your Design'} • Created: ${new Date().toLocaleDateString()}`;
      page.drawText(meta, { x: margin, y, size: 10, font: bodyFont });
      y -= 30;

      // Try to embed image (skip if webp)
      const imageUrl = images[0];
      if (imageUrl) {
        try {
          let imageBytes: Uint8Array;
          let mimeType: string;

          if (imageUrl.startsWith('data:')) {
            const match = imageUrl.match(/^data:(.*?);base64,(.*)$/);
            if (match) {
              mimeType = match[1];
              imageBytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0));
            } else {
              throw new Error('Invalid data URL');
            }
          } else {
            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            imageBytes = new Uint8Array(arrayBuffer);
            mimeType = response.headers.get('content-type') || 'image/png';
          }

          if (!mimeType.includes('webp')) {
            const embedded = mimeType.includes('png') 
              ? await pdfDoc.embedPng(imageBytes)
              : await pdfDoc.embedJpg(imageBytes);

            const maxW = width - margin * 2;
            const maxH = 360;
            const scale = Math.min(maxW / embedded.width, maxH / embedded.height);
            const imgW = embedded.width * scale;
            const imgH = embedded.height * scale;

            y -= imgH;
            page.drawImage(embedded, {
              x: margin + (maxW - imgW) / 2,
              y,
              width: imgW,
              height: imgH,
            });
            y -= 20;
          }
        } catch (e) {
          console.log('Could not embed image in PDF');
        }
      }

      // Notes
      if (notes) {
        page.drawText('Design Notes:', { x: margin, y, size: 12, font: titleFont });
        y -= 18;

        const bullets = notes.split('\n').filter(Boolean).slice(0, 8);
        for (const line of bullets) {
          const cleanLine = line.replace(/^[-•]\s*/, '');
          if (cleanLine && y > margin + 20) {
            page.drawText(`• ${cleanLine.slice(0, 80)}`, { x: margin, y, size: 10, font: bodyFont });
            y -= 14;
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes) as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName || 'interior-design'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded!');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const shareDesign = async () => {
    if (!images.length) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${projectName} - AI Interior Design`,
          text: 'Check out this AI-generated interior design!',
        });
      } catch (e) {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const buttonVariant = getButtonVariant(mode);

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden"
      >
        {/* Success Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Your Design is Ready!</h3>
              <p className="text-sm text-zinc-500">{projectName || 'AI Generated Design'}</p>
            </div>
          </div>
          
          {isSaving && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
              <div className="w-3 h-3 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin mr-2" />
              Saving to history...
            </Badge>
          )}
        </div>

        {/* Image Gallery */}
        <div className="p-6">
          <div className="relative rounded-xl overflow-hidden bg-zinc-800">
            {images[0] && (
              <img
                src={images[0]}
                alt="Generated interior design"
                className="w-full h-auto cursor-zoom-in"
                onClick={() => setSelectedImage(images[0])}
              />
            )}
            <button
              onClick={() => setSelectedImage(images[0])}
              className="absolute bottom-4 right-4 p-2 bg-black/60 rounded-lg hover:bg-black/80 transition-colors"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Design Notes */}
        {notes && (
          <div className="px-6 pb-6">
            <h4 className="text-sm font-semibold text-zinc-300 mb-3">Design Notes</h4>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t border-zinc-800 flex flex-wrap gap-3">
          <Button
            onClick={downloadImage}
            disabled={isDownloading}
            variant={buttonVariant}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Image
          </Button>
          
          <Button
            onClick={downloadPdf}
            disabled={isDownloading}
            variant="dark-outline"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          
          <Button
            onClick={shareDesign}
            variant="dark-outline"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <div className="flex-1" />
          
          <Button
            onClick={onGenerateAnother}
            variant="dark-outline"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Another
          </Button>
          
          <Button
            onClick={onRequestRevision}
            variant="dark-outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Request Revision
          </Button>
        </div>
      </motion.div>

      {/* Lightbox */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size design"
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      )}
    </div>
  );
};

export default DesignResultsGallery;
