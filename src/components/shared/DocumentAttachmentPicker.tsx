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

/** Renders an attachment chip/preview for display in compose areas */
export function AttachmentChip({ attachment, onRemove }: { attachment: DocumentAttachment; onRemove: () => void }) {
  const isImage = attachment.mimeType?.startsWith('image/') || ['stamp', 'signature', 'logo', 'letterhead', 'business_card', 'email_signature'].includes(attachment.type);

  const typeLabels: Record<string, string> = {
    file: 'File',
    stamp: 'Stamp',
    signature: 'Signature',
    letterhead: 'Letterhead',
    business_card: 'Business Card',
    logo: 'Logo',
    email_signature: 'Email Signature',
  };

  return (
    <div className="inline-flex items-center gap-2 bg-[#FDFBF7] border border-[#C9A84C]/20 rounded-lg px-2.5 py-1.5 group">
      {isImage && attachment.content ? (
        <img src={attachment.content} alt={attachment.name} className="w-6 h-6 object-contain rounded" />
      ) : (
        <FileText className="w-4 h-4 text-[#C9A84C]" />
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-black truncate max-w-[120px]">{attachment.name}</p>
        <p className="text-[9px] text-black/40">{typeLabels[attachment.type] || 'File'}</p>
      </div>
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded-full hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3 text-red-500" />
      </button>
    </div>
  );
}

/** Renders an attachment in a chat message bubble */
export function ChatAttachmentRenderer({ attachment }: { attachment: DocumentAttachment }) {
  const isImage = attachment.mimeType?.startsWith('image/') || ['stamp', 'signature', 'logo', 'letterhead', 'business_card', 'email_signature'].includes(attachment.type);

  if (isImage && attachment.content) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-[#C9A84C]/15 bg-white/80 p-2 max-w-[200px]">
        <img src={attachment.content} alt={attachment.name} className="max-h-[150px] object-contain rounded" />
        <p className="text-[10px] text-black/50 mt-1 truncate">{attachment.name}</p>
      </div>
    );
  }

  // Document / PDF / file card
  return (
    <div className="mt-2 flex items-center gap-2 bg-white border border-[#C9A84C]/15 rounded-lg px-3 py-2 max-w-[250px]">
      <FileText className="w-5 h-5 text-[#C9A84C] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-black truncate">{attachment.name}</p>
        {attachment.size && (
          <p className="text-[10px] text-black/40">
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
