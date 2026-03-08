import { useState, useRef, useCallback } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3, Link, Image, Download, Upload,
  Undo, Redo, FileText, Printer, Type, Loader2, ScanLine, Replace, Wand2,
  QrCode, Palette, Stamp, PenTool
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const FONT_SIZES = ['8','10','12','14','16','18','20','24','28','32','36','48','72'];
const FONT_FAMILIES = ['Arial','Times New Roman','Georgia','Verdana','Courier New','Comic Sans MS','Impact','Trebuchet MS'];

const Documents = () => {
  const [title, setTitle] = useState("Untitled Document");
  const [fontSize, setFontSize] = useState("14");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Image upload
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // OCR / Scanner
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  // Find & Replace
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [findReplaceLoading, setFindReplaceLoading] = useState(false);
  const [useAiReplace, setUseAiReplace] = useState(false);

  // AI Prompt Edit
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptLoading, setAiPromptLoading] = useState(false);

  // QR Code
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrText, setQrText] = useState("https://jbj.ae");
  const [qrSize, setQrSize] = useState(150);
  const [qrColor, setQrColor] = useState("#000000");

  // Color / Gradient
  const [headerColor1, setHeaderColor1] = useState("#C8A766");
  const [headerColor2, setHeaderColor2] = useState("#8B7355");
  const [showHeaderBand, setShowHeaderBand] = useState(false);
  const [showFooterBand, setShowFooterBand] = useState(false);

  // Stamp / Signature from session
  const stampSvg = sessionStorage.getItem('esignature_stamp_svg');
  const [showStamp, setShowStamp] = useState(false);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleFontSize = (size: string) => {
    setFontSize(size);
    const sizeMap: Record<string, string> = {
      '8':'1','10':'2','12':'3','14':'4','16':'5','18':'5','20':'6','24':'6','28':'7','32':'7','36':'7','48':'7','72':'7'
    };
    execCommand('fontSize', sizeMap[size] || '4');
  };

  const handleFontFamily = (font: string) => {
    setFontFamily(font);
    execCommand('fontName', font);
  };

  const insertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl("");
      setLinkDialogOpen(false);
      toast.success("Link inserted");
    }
  };

  const insertImageFromUrl = () => {
    if (imageUrl) {
      execCommand('insertImage', imageUrl);
      setImageUrl("");
      setImageDialogOpen(false);
      toast.success("Image inserted");
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error("Please select an image file"); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error("Image must be under 100MB"); return; }
    setIsUploadingImage(true);
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `document-images/${timestamp}-${safeName}`;
      const { error } = await supabase.storage.from('public-assets').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (error) {
        const localUrl = URL.createObjectURL(file);
        execCommand('insertImage', localUrl);
        toast.success("Image inserted (local)");
      } else {
        const { data: { publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(filePath);
        execCommand('insertImage', publicUrl);
        toast.success("Image uploaded & inserted");
      }
      setImageDialogOpen(false);
    } catch { toast.error("Failed to upload image"); }
    finally { setIsUploadingImage(false); if (imageInputRef.current) imageInputRef.current.value = ''; }
  };

  // === OCR SCANNER ===
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('document-ocr', {
        body: { file_base64: base64, file_type: file.type, action: 'extract' },
      });
      if (error) throw error;
      if (data?.text && editorRef.current) {
        // Convert markdown to basic HTML
        const html = markdownToHtml(data.text);
        editorRef.current.innerHTML = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p','br','strong','em','u','h1','h2','h3','h4','ul','ol','li','a','span','div','table','tr','td','th','thead','tbody'],
          ALLOWED_ATTR: ['href','class','style'],
          ALLOW_DATA_ATTR: false
        });
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
        toast.success("Document scanned & text extracted!");
      } else {
        toast.error("No text could be extracted");
      }
    } catch (err: any) {
      console.error('OCR error:', err);
      toast.error(err?.message || "Failed to scan document");
    } finally {
      setOcrLoading(false);
      setOcrDialogOpen(false);
      if (ocrInputRef.current) ocrInputRef.current.value = '';
    }
  };

  // === FIND & REPLACE ===
  const handleFindReplace = async () => {
    if (!findText) return;
    if (!editorRef.current) return;

    if (!useAiReplace) {
      // Simple text find & replace
      const html = editorRef.current.innerHTML;
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const count = (html.match(regex) || []).length;
      editorRef.current.innerHTML = html.replace(regex, replaceText);
      toast.success(`Replaced ${count} occurrence(s)`);
      setFindReplaceOpen(false);
      return;
    }

    // AI-powered find & replace using OCR on current content screenshot
    setFindReplaceLoading(true);
    try {
      const content = editorRef.current.innerText;
      // Use the lovable-ai function for text replacement
      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: {
          messages: [
            { role: "system", content: "You are a document editor. Given the document text below, replace ALL occurrences of the specified text. Return ONLY the modified document text. Preserve all formatting and structure." },
            { role: "user", content: `Document:\n${content}\n\nReplace every occurrence of "${findText}" with "${replaceText}". Return ONLY the modified text.` },
          ],
        },
      });
      if (error) throw error;
      const result = data?.choices?.[0]?.message?.content?.trim();
      if (result) {
        editorRef.current.innerHTML = `<p>${result.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
        toast.success("AI replacement complete!");
      }
    } catch (err: any) {
      toast.error(err?.message || "AI replacement failed");
    } finally {
      setFindReplaceLoading(false);
      setFindReplaceOpen(false);
    }
  };

  // === AI PROMPT EDIT ===
  const handleAiPromptEdit = async () => {
    if (!aiPrompt || !editorRef.current) return;
    setAiPromptLoading(true);
    try {
      const content = editorRef.current.innerText;
      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: {
          messages: [
            { role: "system", content: "You are a professional document editor. Given the document text, apply the user's editing instruction and return the modified document. Preserve structure and formatting. Return ONLY the modified text." },
            { role: "user", content: `Document:\n${content}\n\nInstruction: ${aiPrompt}\n\nReturn ONLY the modified document text.` },
          ],
        },
      });
      if (error) throw error;
      const result = data?.choices?.[0]?.message?.content?.trim();
      if (result) {
        const html = markdownToHtml(result);
        editorRef.current.innerHTML = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p','br','strong','em','u','h1','h2','h3','h4','ul','ol','li','a','span','div','table','tr','td','th','thead','tbody'],
          ALLOWED_ATTR: ['href','class','style'],
          ALLOW_DATA_ATTR: false
        });
        toast.success("Document updated with AI!");
      }
    } catch (err: any) {
      toast.error(err?.message || "AI edit failed");
    } finally {
      setAiPromptLoading(false);
      setAiPromptOpen(false);
      setAiPrompt("");
    }
  };

  // === QR CODE ===
  const insertQrCode = () => {
    const colorHex = qrColor.replace('#', '');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}&color=${colorHex}&bgcolor=ffffff&margin=2`;
    execCommand('insertImage', qrUrl);
    setQrDialogOpen(false);
    toast.success("QR Code inserted");
  };

  // === STAMP INSERT ===
  const insertStamp = () => {
    if (!stampSvg || !editorRef.current) {
      toast.error("No stamp found. Generate one in the Stamp Generator first.");
      return;
    }
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(stampSvg)}`;
    execCommand('insertImage', svgDataUrl);
    toast.success("Company stamp inserted");
  };

  const markdownToHtml = (md: string): string => {
    let html = md;
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br/>');
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';
    return html;
  };

  const handlePrint = () => {
    const content = editorRef.current?.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow && content) {
      const headerStyle = showHeaderBand ? `<div style="height:8px;background:linear-gradient(90deg,${headerColor1},${headerColor2});margin-bottom:20px;border-radius:4px;"></div>` : '';
      const footerStyle = showFooterBand ? `<div style="height:8px;background:linear-gradient(90deg,${headerColor1},${headerColor2});margin-top:20px;border-radius:4px;"></div>` : '';
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:${fontFamily};padding:40px;}img{max-width:100%;}</style></head><body>${headerStyle}${content}${footerStyle}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToHTML = () => {
    const content = editorRef.current?.innerHTML;
    if (!content) return;
    const headerBand = showHeaderBand ? `<div style="height:8px;background:linear-gradient(90deg,${headerColor1},${headerColor2});margin-bottom:20px;border-radius:4px;"></div>` : '';
    const footerBand = showFooterBand ? `<div style="height:8px;background:linear-gradient(90deg,${headerColor1},${headerColor2});margin-top:20px;border-radius:4px;"></div>` : '';
    const html = `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:${fontFamily};padding:40px;max-width:800px;margin:0 auto;}img{max-width:100%;}</style></head><body>${headerBand}${content}${footerBand}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document exported");
  };

  const exportToText = () => {
    const content = editorRef.current?.innerText;
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document exported as text");
  };

  const importDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (editorRef.current) {
        if (file.name.endsWith('.html')) {
          const match = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          const htmlContent = match ? match[1] : content;
          editorRef.current.innerHTML = DOMPurify.sanitize(htmlContent, {
            ALLOWED_TAGS: ['p','br','strong','em','u','h1','h2','h3','ul','ol','li','a','span','div','table','tr','td','th','thead','tbody','img'],
            ALLOWED_ATTR: ['href','class','style','src','alt','width','height'],
            ALLOW_DATA_ATTR: false
          });
        } else {
          editorRef.current.innerText = content;
        }
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
        toast.success("Document imported");
      }
    };
    reader.readAsText(file);
  };

  const gradientStyle = showHeaderBand || showFooterBand
    ? `linear-gradient(90deg, ${headerColor1}, ${headerColor2})`
    : undefined;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Header */}
        <div className="border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-full px-4 py-1 mb-4">
                <FileText className="w-4 h-4 text-[#8B7355]" />
                <span className="text-black text-sm font-medium">Document Editor</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">Documents & Spreadsheets</h1>
              <p className="text-zinc-600">Create, scan, edit, and export professional documents with AI-powered tools</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 px-4 py-3">
          <div className="flex items-center gap-4 max-w-7xl mx-auto">
            <FileText className="h-6 w-6 text-[#8B7355]" />
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xl font-medium border-0 bg-transparent focus-visible:ring-0 max-w-md text-black" placeholder="Untitled Document" />
          </div>
        </div>

        {/* Toolbar Row 1 — Formatting */}
        <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 px-4 py-2 flex flex-wrap items-center gap-1">
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('undo')}><Undo className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('redo')}><Redo className="h-4 w-4" /></Button>
          <div className="w-px h-6 bg-gold/30 mx-1" />

          <Select value={fontFamily} onValueChange={handleFontFamily}>
            <SelectTrigger className="w-[140px] h-8 bg-white/80 border-gold/40 text-black"><SelectValue /></SelectTrigger>
            <SelectContent side="bottom">{FONT_FAMILIES.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fontSize} onValueChange={handleFontSize}>
            <SelectTrigger className="w-[70px] h-8 bg-white/80 border-gold/40 text-black"><SelectValue /></SelectTrigger>
            <SelectContent side="bottom">{FONT_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" min={1} max={200} placeholder="px" className="w-[60px] h-8 bg-white/80 border-gold/40 text-black text-sm" onKeyDown={(e) => { if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value; if (val) handleFontSize(val); } }} />
          <div className="w-px h-6 bg-gold/30 mx-1" />

          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('bold')}><Bold className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('italic')}><Italic className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('underline')}><Underline className="h-4 w-4" /></Button>
          <div className="w-px h-6 bg-gold/30 mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10"><Type className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'p')}>Normal Text</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h1')}><Heading1 className="h-4 w-4 mr-2" /> Heading 1</DropdownMenuItem>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h2')}><Heading2 className="h-4 w-4 mr-2" /> Heading 2</DropdownMenuItem>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h3')}><Heading3 className="h-4 w-4 mr-2" /> Heading 3</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="w-px h-6 bg-gold/30 mx-1" />

          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('justifyLeft')}><AlignLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('justifyCenter')}><AlignCenter className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('justifyRight')}><AlignRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('justifyFull')}><AlignJustify className="h-4 w-4" /></Button>
          <div className="w-px h-6 bg-gold/30 mx-1" />

          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('insertUnorderedList')}><List className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
        </div>

        {/* Toolbar Row 2 — AI Tools + Insert + Actions */}
        <div className="bg-gradient-to-r from-[#F5F0E6] via-[#EDE4D3] to-[#E8DCC8] border-b border-gold/20 px-4 py-2 flex flex-wrap items-center gap-1">
          {/* Scanner / OCR */}
          <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-800 hover:bg-amber-100/50 font-medium">
                <ScanLine className="h-4 w-4 mr-1" /> Scan Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>📄 Scan & Extract Text</DialogTitle>
                <DialogDescription>Upload any document or image — AI will extract all text and load it into the editor.</DialogDescription>
              </DialogHeader>
              <input ref={ocrInputRef} type="file" accept="image/*,.pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff" className="hidden" onChange={handleOcrUpload} />
              <Button onClick={() => ocrInputRef.current?.click()} disabled={ocrLoading} className="w-full h-24 border-2 border-dashed border-amber-400/50 bg-amber-50/30 hover:bg-amber-50/60 text-amber-800" variant="outline">
                {ocrLoading ? <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Scanning document...</span>
                  : <span className="flex flex-col items-center gap-1"><ScanLine className="h-6 w-6" /> Click to upload document or image</span>}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Supports: JPG, PNG, WebP, BMP, TIFF, PDF (first page)</p>
            </DialogContent>
          </Dialog>

          {/* Find & Replace */}
          <Dialog open={findReplaceOpen} onOpenChange={setFindReplaceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-blue-500/40 text-blue-800 hover:bg-blue-100/50 font-medium">
                <Replace className="h-4 w-4 mr-1" /> Find & Replace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>🔍 Find & Replace</DialogTitle>
                <DialogDescription>Replace text in your document. Enable AI mode for intelligent replacements.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Find</Label><Input value={findText} onChange={(e) => setFindText(e.target.value)} placeholder="e.g. XYZ Company" /></div>
                <div><Label>Replace with</Label><Input value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder="e.g. JBJ Global" /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={useAiReplace} onCheckedChange={setUseAiReplace} />
                  <Label className="text-sm">AI-powered replacement (context-aware)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleFindReplace} disabled={findReplaceLoading || !findText}>
                  {findReplaceLoading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Replacing...</> : "Replace All"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* AI Prompt Edit */}
          <Dialog open={aiPromptOpen} onOpenChange={setAiPromptOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-purple-500/40 text-purple-800 hover:bg-purple-100/50 font-medium">
                <Wand2 className="h-4 w-4 mr-1" /> AI Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>✨ AI Document Editor</DialogTitle>
                <DialogDescription>Write a prompt to modify your document using AI.</DialogDescription>
              </DialogHeader>
              <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. Make this more professional, translate to Arabic, add bullet points..." rows={4} />
              <DialogFooter>
                <Button onClick={handleAiPromptEdit} disabled={aiPromptLoading || !aiPrompt}>
                  {aiPromptLoading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing...</> : "Apply Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="w-px h-6 bg-gold/30 mx-1" />

          {/* Insert: Link */}
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10"><Link className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Insert Link</DialogTitle></DialogHeader>
              <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              <Button onClick={insertLink} className="w-full">Insert Link</Button>
            </DialogContent>
          </Dialog>

          {/* Insert: Image */}
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10"><Image className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Insert Image</DialogTitle></DialogHeader>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1">Upload from Device</TabsTrigger>
                  <TabsTrigger value="url" className="flex-1">Paste URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4 pt-4">
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileUpload} />
                  <Button onClick={() => imageInputRef.current?.click()} disabled={isUploadingImage} className="w-full h-24 border-2 border-dashed border-gold/40 bg-transparent hover:bg-gold/5 text-muted-foreground" variant="outline">
                    {isUploadingImage ? <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Uploading...</span>
                      : <span className="flex flex-col items-center gap-1"><Upload className="h-6 w-6" /> Click to select an image</span>}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Max 100MB · JPG, PNG, WebP, GIF</p>
                </TabsContent>
                <TabsContent value="url" className="space-y-4 pt-4">
                  <Input placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                  <Button onClick={insertImageFromUrl} className="w-full" disabled={!imageUrl}>Insert Image</Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          {/* QR Code */}
          <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10">
                <QrCode className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>📱 Insert QR Code</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>URL or Text</Label><Input value={qrText} onChange={(e) => setQrText(e.target.value)} placeholder="https://jbj.ae" /></div>
                <div className="flex gap-4">
                  <div className="flex-1"><Label>Size (px)</Label><Input type="number" value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))} min={50} max={500} /></div>
                  <div><Label>Color</Label><input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)} className="w-10 h-10 rounded border border-gold/30 cursor-pointer" /></div>
                </div>
                {qrText && (
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}&color=${qrColor.replace('#','')}&bgcolor=ffffff&margin=2`} alt="QR Preview" className="max-w-[200px]" />
                  </div>
                )}
              </div>
              <DialogFooter><Button onClick={insertQrCode} disabled={!qrText}>Insert QR Code</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Stamp */}
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={insertStamp} title="Insert Company Stamp">
            <Stamp className="h-4 w-4" />
          </Button>

          {/* Signature placeholder */}
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => { window.location.href = '/e-signature'; }} title="Go to E-Signature">
            <PenTool className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gold/30 mx-1" />

          {/* Color Wheel for Header/Footer Bands */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10">
                <Palette className="h-4 w-4 mr-1" /> Colors
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-4 w-64">
              <p className="text-xs font-bold mb-2 text-zinc-600 uppercase tracking-wider">Document Colors / Ombré</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={showHeaderBand} onCheckedChange={setShowHeaderBand} />
                  <span className="text-sm">Header Band</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={showFooterBand} onCheckedChange={setShowFooterBand} />
                  <span className="text-sm">Footer Band</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-16">Color 1</Label>
                  <input type="color" value={headerColor1} onChange={(e) => setHeaderColor1(e.target.value)} className="w-8 h-8 rounded cursor-pointer border" />
                  <span className="text-xs text-muted-foreground">{headerColor1}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-16">Color 2</Label>
                  <input type="color" value={headerColor2} onChange={(e) => setHeaderColor2(e.target.value)} className="w-8 h-8 rounded cursor-pointer border" />
                  <span className="text-xs text-muted-foreground">{headerColor2}</span>
                </div>
                {(showHeaderBand || showFooterBand) && (
                  <div className="h-4 rounded" style={{ background: `linear-gradient(90deg, ${headerColor1}, ${headerColor2})` }} />
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* Actions */}
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10"><Download className="h-4 w-4 mr-1" /> <span className="text-black">Export</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToHTML}>Export as HTML</DropdownMenuItem>
              <DropdownMenuItem onClick={exportToText}>Export as Text</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <label>
            <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" asChild>
              <span><Upload className="h-4 w-4 mr-1" /> <span className="text-black">Import</span></span>
            </Button>
            <input type="file" accept=".txt,.html,.md,.csv,.json,.xml" className="hidden" onChange={importDocument} />
          </label>
        </div>

        {/* Editor Area */}
        <div className="flex justify-center p-8 min-h-[calc(100vh-360px)]">
          <div className="bg-white shadow-lg w-full max-w-[816px] min-h-[1056px] border border-gold/20 rounded-lg overflow-hidden">
            {/* Header Band */}
            {showHeaderBand && (
              <div className="h-3 w-full" style={{ background: gradientStyle }} />
            )}
            <div className="p-16">
              <div
                ref={editorRef}
                contentEditable
                className="outline-none min-h-full text-gray-900"
                style={{ fontFamily, fontSize: `${fontSize}px` }}
                suppressContentEditableWarning
              >
                <p>Start typing your document here...</p>
              </div>
            </div>
            {/* Footer Band */}
            {showFooterBand && (
              <div className="h-3 w-full mt-auto" style={{ background: gradientStyle }} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Documents;
