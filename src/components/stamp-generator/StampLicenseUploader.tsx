/**
 * StampLicenseUploader — Upload trade license / business document
 * AI extracts company name EN + AR, registration number, city
 */
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, Loader2, Check, FileText, X, Sparkles } from 'lucide-react';

interface ExtractedData {
  company_name?: string;
  arabic_company_name?: string;
  registration_number?: string;
  city?: string;
  country?: string;
}

interface Props {
  onExtracted: (data: ExtractedData) => void;
}

export function StampLicenseUploader({ onExtracted }: Props) {
  const { session } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setFileName(file.name);
    setExtracting(true);
    setExtracted(null);

    try {
      // Convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      bytes.forEach(b => binary += String.fromCharCode(b));
      const base64 = btoa(binary);

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stamp-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type === 'application/pdf' ? 'image/jpeg' : file.type, // Gemini vision handles images; PDFs first page
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Extraction failed');
      }

      const data: ExtractedData = await res.json();
      setExtracted(data);
      toast.success('Details extracted successfully!');
    } catch (err: any) {
      console.error('Extraction error:', err);
      toast.error(err.message || 'Could not extract details. Please fill in manually.');
    }
    setExtracting(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleApply() {
    if (!extracted) return;
    onExtracted(extracted);
    toast.success('Details applied to form!');
  }

  function handleClear() {
    setExtracted(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="border border-[hsl(var(--gold)/0.3)] bg-gradient-to-br from-[hsl(var(--gold)/0.03)] to-white rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[hsl(var(--gold)/0.1)] flex items-center justify-center flex-shrink-0">
          <Sparkles size={15} className="text-[hsl(var(--gold))]"/>
        </div>
        <div>
          <p className="font-semibold text-sm text-[hsl(var(--foreground))]">AI Auto-Fill from Trade License</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Upload a trade license or any business document to auto-extract company details</p>
        </div>
      </div>

      {!extracted ? (
        <>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all ${
              dragging
                ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]'
                : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] hover:bg-[hsl(var(--gold)/0.02)]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
            />
            {extracting ? (
              <>
                <Loader2 size={28} className="text-[hsl(var(--gold))] animate-spin"/>
                <div className="text-center">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">Extracting company details…</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">AI is reading {fileName}</p>
                </div>
              </>
            ) : (
              <>
                <Upload size={28} className="text-[hsl(var(--gold)/0.6)]"/>
                <div className="text-center">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">Drop your trade license here</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">JPG, PNG, PDF · Max 10MB</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)]">
                  <FileText size={13}/> Browse File
                </Button>
              </>
            )}
          </div>
        </>
      ) : (
        /* Extracted results */
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <Check size={15} className="text-green-600"/>
            Details extracted from {fileName}
          </div>

          <div className="bg-[hsl(var(--pearl-1))] rounded-xl p-4 space-y-2 text-sm">
            {extracted.company_name && (
              <div className="flex items-start gap-2">
                <span className="text-[hsl(var(--muted-foreground))] text-xs min-w-[90px]">Company (EN)</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{extracted.company_name}</span>
              </div>
            )}
            {extracted.arabic_company_name && (
              <div className="flex items-start gap-2">
                <span className="text-[hsl(var(--muted-foreground))] text-xs min-w-[90px]">Company (AR)</span>
                <span className="font-medium text-[hsl(var(--foreground))]" dir="rtl">{extracted.arabic_company_name}</span>
              </div>
            )}
            {extracted.registration_number && (
              <div className="flex items-start gap-2">
                <span className="text-[hsl(var(--muted-foreground))] text-xs min-w-[90px]">Reg. No.</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{extracted.registration_number}</span>
              </div>
            )}
            {(extracted.city || extracted.country) && (
              <div className="flex items-start gap-2">
                <span className="text-[hsl(var(--muted-foreground))] text-xs min-w-[90px]">Location</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{[extracted.city, extracted.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1.5 text-sm">
              <Check size={14}/> Use These Details
            </Button>
            <Button variant="outline" onClick={handleClear} className="gap-1.5 text-sm">
              <X size={14}/> Try Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
