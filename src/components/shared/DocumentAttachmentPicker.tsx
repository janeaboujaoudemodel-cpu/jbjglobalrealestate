import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BrandAssetPicker } from '@/components/brand-assets/BrandAssetPicker';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import { useNavigate } from 'react-router-dom';
import {
  Paperclip, Stamp, Signature, FileText, CreditCard,
  Image, Mail, PenTool, X, Download, Eye, Shield, Badge as BadgeIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface DocumentAttachment {
  id: string;
  name: string;
  type: 'file' | 'stamp' | 'signature' | 'letterhead' | 'business_card' | 'logo' | 'email_signature';
  /** SVG string or data URI or URL */
  content: string;
  /** MIME type for files */
  mimeType?: string;
  /** File size in bytes */
  size?: number;
}

type BrandAssetType = 'stamp' | 'logo' | 'business_card' | 'signature' | 'letterhead' | 'email_signature';

interface DocumentAttachmentPickerProps {
  /** Which context is using this picker */
  context: 'email' | 'chat';
  onAttach: (attachment: DocumentAttachment) => void;
  onClose: () => void;
}

const ASSET_OPTIONS: { type: BrandAssetType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'stamp', label: 'Official Stamp', icon: <Stamp className="w-4 h-4" />, description: 'Insert company stamp' },
  { type: 'signature', label: 'Signature', icon: <Signature className="w-4 h-4" />, description: 'Insert signature' },
  { type: 'letterhead', label: 'Letterhead', icon: <FileText className="w-4 h-4" />, description: 'Insert letterhead' },
  { type: 'business_card', label: 'Business Card', icon: <CreditCard className="w-4 h-4" />, description: 'Attach business card' },
  { type: 'logo', label: 'Logo', icon: <Image className="w-4 h-4" />, description: 'Insert company logo' },
  { type: 'email_signature', label: 'Email Signature', icon: <Mail className="w-4 h-4" />, description: 'Insert email signature' },
];

export function DocumentAttachmentPicker({ context, onAttach, onClose }: DocumentAttachmentPickerProps) {
  const [showBrandPicker, setShowBrandPicker] = useState<BrandAssetType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUri = reader.result as string;
        onAttach({
          id: crypto.randomUUID(),
          name: file.name,
          type: 'file',
          content: dataUri,
          mimeType: file.type,
          size: file.size,
        });
        toast.success(`Attached: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleBrandAssetSelect = (asset: any) => {
    const content = asset.svg_content
      ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(asset.svg_content)))}`
      : asset.thumbnail_url || '';

    onAttach({
      id: asset.id,
      name: asset.name,
      type: asset.asset_type as DocumentAttachment['type'],
      content,
    });
    setShowBrandPicker(null);
    onClose();
  };

  if (showBrandPicker) {
    return (
      <BrandAssetPicker
        filterType={showBrandPicker}
        onSelect={handleBrandAssetSelect}
        onClose={() => setShowBrandPicker(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#C9A84C]/30 w-[90vw] max-w-[420px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#C9A84C]/15 bg-gradient-to-r from-[#FDFBF7] to-white">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-[#C9A84C]" />
            <span className="font-semibold text-sm text-black">Attach Document or Asset</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-[#C9A84C]/10 flex items-center justify-center">
            <X className="w-4 h-4 text-black/60" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-1.5">
          {/* File upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#C9A84C]/5 border border-transparent hover:border-[#C9A84C]/20 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
              <Paperclip className="w-4 h-4 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-sm font-medium text-black">Upload File</p>
              <p className="text-[11px] text-black/50">Images, PDFs, documents</p>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Divider */}
          <div className="flex items-center gap-2 py-1.5 px-2">
            <div className="flex-1 h-px bg-[#C9A84C]/15" />
            <span className="text-[10px] text-black/30 uppercase tracking-wider font-medium">Brand Assets</span>
            <div className="flex-1 h-px bg-[#C9A84C]/15" />
          </div>

          {/* Brand asset options */}
          {ASSET_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => setShowBrandPicker(opt.type)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#C9A84C]/5 border border-transparent hover:border-[#C9A84C]/20 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                {React.cloneElement(opt.icon as React.ReactElement, { className: 'w-4 h-4 text-[#C9A84C]' })}
              </div>
              <div>
                <p className="text-sm font-medium text-black">{opt.label}</p>
                <p className="text-[11px] text-black/50">{opt.description}</p>
              </div>
            </button>
          ))}

          {/* E-Signature shortcut — only in email context */}
          {context === 'email' && (
            <>
              <div className="flex items-center gap-2 py-1.5 px-2">
                <div className="flex-1 h-px bg-[#C9A84C]/15" />
                <span className="text-[10px] text-black/30 uppercase tracking-wider font-medium">Actions</span>
                <div className="flex-1 h-px bg-[#C9A84C]/15" />
              </div>
              <button
                onClick={() => { onClose(); navigate('/e-signature/create'); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <PenTool className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">Send for E-Signature</p>
                  <p className="text-[11px] text-black/50">Create a document for signing</p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Type-specific styling config for attachment chips and chat renderers */
const TYPE_STYLES: Record<string, { border: string; bg: string; badge: string; badgeLabel: string; icon: React.ReactNode }> = {
  stamp: { border: 'border-[#C9A84C]/40', bg: 'bg-[#C9A84C]/5', badge: 'bg-[#C9A84C]/15 text-[#C9A84C]', badgeLabel: 'Official Stamp', icon: <Stamp className="w-4 h-4 text-[#C9A84C]" /> },
  signature: { border: 'border-indigo-300/50', bg: 'bg-indigo-50/50', badge: 'bg-indigo-100 text-indigo-700', badgeLabel: 'Signature', icon: <Signature className="w-4 h-4 text-indigo-500" /> },
  letterhead: { border: 'border-slate-300/50', bg: 'bg-slate-50/50', badge: 'bg-slate-100 text-slate-700', badgeLabel: 'Letterhead', icon: <FileText className="w-4 h-4 text-slate-500" /> },
  business_card: { border: 'border-amber-300/50', bg: 'bg-amber-50/50', badge: 'bg-amber-100 text-amber-700', badgeLabel: 'Business Card', icon: <CreditCard className="w-4 h-4 text-amber-600" /> },
  logo: { border: 'border-emerald-300/50', bg: 'bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-700', badgeLabel: 'Logo', icon: <Image className="w-4 h-4 text-emerald-500" /> },
  email_signature: { border: 'border-blue-300/50', bg: 'bg-blue-50/50', badge: 'bg-blue-100 text-blue-700', badgeLabel: 'Email Signature', icon: <Mail className="w-4 h-4 text-blue-500" /> },
};

/** Renders an attachment chip/preview for display in compose areas — type-aware */
export function AttachmentChip({ attachment, onRemove }: { attachment: DocumentAttachment; onRemove: () => void }) {
  const isImage = attachment.mimeType?.startsWith('image/') || ['stamp', 'signature', 'logo', 'letterhead', 'business_card', 'email_signature'].includes(attachment.type);
  const style = TYPE_STYLES[attachment.type];

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 group border",
      style ? `${style.bg} ${style.border}` : "bg-[#FDFBF7] border-[#C9A84C]/20"
    )}>
      {style?.icon || (isImage && attachment.content ? (
        <img src={attachment.content} alt={attachment.name} className="w-6 h-6 object-contain rounded" />
      ) : (
        <FileText className="w-4 h-4 text-[#C9A84C]" />
      ))}
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-foreground truncate max-w-[120px]">{attachment.name}</p>
        {style ? (
          <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider", style.badge)}>
            {style.badgeLabel}
          </span>
        ) : (
          <p className="text-[9px] text-muted-foreground">File</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded-full hover:bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3 text-destructive" />
      </button>
    </div>
  );
}

/** Renders an attachment in a chat message bubble — type-aware */
export function ChatAttachmentRenderer({ attachment }: { attachment: DocumentAttachment }) {
  const isImage = attachment.mimeType?.startsWith('image/') || ['stamp', 'signature', 'logo', 'letterhead', 'business_card', 'email_signature'].includes(attachment.type);
  const style = TYPE_STYLES[attachment.type];

  // Stamp: render with gold border and SVG renderer when possible
  if (attachment.type === 'stamp' && attachment.content) {
    // Check if content is SVG data URI
    const isSvgDataUri = attachment.content.startsWith('data:image/svg+xml');
    return (
      <div className="mt-2 rounded-xl overflow-hidden border-2 border-[#C9A84C]/30 bg-[#C9A84C]/5 p-3 max-w-[200px]">
        <div className="flex items-center gap-1.5 mb-2">
          <Shield className="w-3 h-3 text-[#C9A84C]" />
          <span className="text-[9px] font-bold text-[#C9A84C] uppercase tracking-wider">Official Stamp</span>
        </div>
        {isSvgDataUri ? (
          <div className="flex justify-center">
            <img src={attachment.content} alt={attachment.name} className="max-h-[120px] object-contain" />
          </div>
        ) : (
          <img src={attachment.content} alt={attachment.name} className="max-h-[120px] object-contain rounded" />
        )}
        <p className="text-[10px] text-muted-foreground mt-2 truncate">{attachment.name}</p>
      </div>
    );
  }

  // Signature: handwriting-style card
  if (attachment.type === 'signature' && attachment.content) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-indigo-200 bg-indigo-50/30 p-3 max-w-[200px]">
        <div className="flex items-center gap-1.5 mb-2">
          <Signature className="w-3 h-3 text-indigo-500" />
          <span className="text-[9px] font-semibold text-indigo-600 uppercase tracking-wider">Signature</span>
        </div>
        <img src={attachment.content} alt={attachment.name} className="max-h-[80px] object-contain rounded opacity-90" style={{ filter: 'contrast(1.1)' }} />
        <p className="text-[10px] text-muted-foreground mt-2 truncate">{attachment.name}</p>
      </div>
    );
  }

  // Business Card: card layout with shadow
  if (attachment.type === 'business_card' && attachment.content) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-amber-200 bg-white shadow-md p-2 max-w-[220px]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <CreditCard className="w-3 h-3 text-amber-600" />
          <span className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider">Business Card</span>
        </div>
        <img src={attachment.content} alt={attachment.name} className="w-full h-auto rounded-lg" />
        <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{attachment.name}</p>
      </div>
    );
  }

  // Letterhead: company-branded document card
  if (attachment.type === 'letterhead' && attachment.content) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 max-w-[200px]">
        <div className="flex items-center gap-1.5 mb-2">
          <FileText className="w-3 h-3 text-slate-500" />
          <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">Letterhead</span>
        </div>
        <div className="border-t-2 border-[#C9A84C] pt-2">
          <img src={attachment.content} alt={attachment.name} className="max-h-[120px] object-contain rounded" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 truncate">{attachment.name}</p>
      </div>
    );
  }

  // Logo: centered with brand badge
  if (attachment.type === 'logo' && attachment.content) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-emerald-200 bg-white p-3 max-w-[180px] flex flex-col items-center">
        <div className="flex items-center gap-1.5 mb-2 self-start">
          <Image className="w-3 h-3 text-emerald-500" />
          <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider">Logo</span>
        </div>
        <img src={attachment.content} alt={attachment.name} className="max-h-[100px] object-contain" />
        <p className="text-[10px] text-muted-foreground mt-2 truncate self-start">{attachment.name}</p>
      </div>
    );
  }

  // Email Signature: formatted signature block
  if (attachment.type === 'email_signature' && attachment.content) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-blue-200 bg-blue-50/30 p-3 max-w-[220px]">
        <div className="flex items-center gap-1.5 mb-2">
          <Mail className="w-3 h-3 text-blue-500" />
          <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider">Email Signature</span>
        </div>
        <img src={attachment.content} alt={attachment.name} className="max-h-[100px] object-contain rounded" />
        <p className="text-[10px] text-muted-foreground mt-2 truncate">{attachment.name}</p>
      </div>
    );
  }

  // Generic image fallback
  if (isImage && attachment.content) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-[#C9A84C]/15 bg-white/80 p-2 max-w-[200px]">
        <img src={attachment.content} alt={attachment.name} className="max-h-[150px] object-contain rounded" />
        <p className="text-[10px] text-muted-foreground mt-1 truncate">{attachment.name}</p>
      </div>
    );
  }

  // Document / PDF / file card
  return (
    <div className="mt-2 flex items-center gap-2 bg-white border border-[#C9A84C]/15 rounded-lg px-3 py-2 max-w-[250px]">
      <FileText className="w-5 h-5 text-[#C9A84C] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{attachment.name}</p>
        {attachment.size && (
          <p className="text-[10px] text-muted-foreground">
            {attachment.size < 1024 * 1024
              ? `${(attachment.size / 1024).toFixed(1)} KB`
              : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`}
          </p>
        )}
      </div>
      {attachment.content && (
        <a href={attachment.content} download={attachment.name} className="shrink-0">
          <Download className="w-4 h-4 text-[#C9A84C] hover:text-[#B8973F]" />
        </a>
      )}
    </div>
  );
}
