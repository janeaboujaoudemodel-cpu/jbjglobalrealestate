import { useState, useRef, useCallback, useEffect } from "react";
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
  QrCode, Palette, Stamp, PenTool, ChevronDown, LayoutTemplate, X, Lock
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
import { ScrollArea } from "@/components/ui/scroll-area";

/* ═══════════════════════════════════════════════════════════════════════════ */
/* CONSTANTS                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const FONT_SIZES = ['8','9','10','11','12','14','16','18','20','22','24','28','32','36','42','48','56','64','72','96'];

const FONT_FAMILIES = [
  'Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New',
  'Trebuchet MS', 'Garamond', 'Palatino Linotype', 'Book Antiqua',
  'Playfair Display', 'Montserrat', 'Roboto', 'Lora', 'Merriweather',
  'Raleway', 'Open Sans', 'Poppins', 'Inter', 'Oswald', 'Nunito',
  'PT Serif', 'Source Sans Pro', 'Crimson Text', 'DM Sans', 'Libre Baskerville',
  'Cormorant Garamond', 'Josefin Sans', 'Quicksand', 'Cinzel', 'Spectral',
  'Noto Sans Arabic', 'Amiri',
];

const GOOGLE_FONTS_IMPORT = FONT_FAMILIES.filter(f => !['Arial','Times New Roman','Georgia','Verdana','Courier New','Trebuchet MS','Garamond','Palatino Linotype','Book Antiqua'].includes(f))
  .map(f => f.replace(/ /g, '+')).join('&family=');

const DOC_TEMPLATES: { id: string; label: string; category: string; html: string }[] = [
  { id: "offer-letter", label: "Offer Letter", category: "Real Estate", html: `<h1 style="text-align:center;color:#1e293b;">OFFER TO PURCHASE</h1><p style="text-align:right;"><strong>Date:</strong> _______________</p><p><strong>To:</strong> _______________<br/><strong>Property:</strong> _______________<br/><strong>Unit No:</strong> _______________</p><h2>1. Purchase Price</h2><p>The Buyer hereby offers to purchase the above property for the sum of AED ______________ (Amount in words: __________________).</p><h2>2. Payment Plan</h2><p>Booking Amount: AED ______________<br/>First Installment: AED ______________<br/>On Handover: AED ______________</p><h2>3. Terms & Conditions</h2><ul><li>Subject to developer approval</li><li>Valid for 7 days from date of offer</li><li>Buyer acknowledges receipt of all project documentation</li></ul><br/><br/><div style="display:flex;justify-content:space-between;"><div><p>____________________<br/><strong>Buyer Signature</strong></p></div><div><p>____________________<br/><strong>Agent Signature</strong></p></div></div>` },
  { id: "mou", label: "MOU Agreement", category: "Real Estate", html: `<h1 style="text-align:center;color:#1e293b;">MEMORANDUM OF UNDERSTANDING</h1><p style="text-align:center;">This MOU is entered into on ______________ between:</p><h2>Party A (Seller)</h2><p>Name: ______________<br/>Passport/Emirates ID: ______________<br/>Contact: ______________</p><h2>Party B (Buyer)</h2><p>Name: ______________<br/>Passport/Emirates ID: ______________<br/>Contact: ______________</p><h2>Property Details</h2><p>Location: ______________<br/>Unit: ______________<br/>Area (sq ft): ______________<br/>Agreed Price: AED ______________</p><h2>Terms</h2><ol><li>Security deposit of AED ______________ to be paid upon signing.</li><li>Transfer to be completed within 30 days.</li><li>Both parties agree to cooperate for NOC and DLD transfer.</li></ol><br/><div style="display:flex;justify-content:space-between;"><div><p>____________________<br/><strong>Seller</strong></p></div><div><p>____________________<br/><strong>Buyer</strong></p></div><div><p>____________________<br/><strong>Witness</strong></p></div></div>` },
  { id: "noc", label: "NOC Letter", category: "Real Estate", html: `<h1 style="text-align:center;color:#1e293b;">NO OBJECTION CERTIFICATE</h1><p style="text-align:right;">Date: ______________<br/>Ref: NOC-______________</p><p>To Whom It May Concern,</p><p>This is to certify that we, <strong>______________</strong>, have no objection to the transfer/sale of the below mentioned property:</p><p><strong>Property:</strong> ______________<br/><strong>Unit No:</strong> ______________<br/><strong>Owner:</strong> ______________</p><p>This NOC is valid for 30 days from the date of issuance.</p><br/><p>Authorized Signatory<br/>____________________<br/>Name: ______________<br/>Designation: ______________</p>` },
  { id: "broker-agreement", label: "Broker Agreement", category: "Real Estate", html: `<h1 style="text-align:center;color:#1e293b;">BROKERAGE AGREEMENT</h1><p>This Agreement is made between:</p><p><strong>Brokerage Firm:</strong> JBJ GLOBAL REAL ESTATE<br/><strong>License No:</strong> ______________<br/><strong>RERA No:</strong> ______________</p><p><strong>Client:</strong> ______________</p><h2>Scope of Services</h2><ul><li>Property marketing and listing</li><li>Client viewings and negotiations</li><li>Transaction coordination until completion</li></ul><h2>Commission</h2><p>The agreed commission rate is ______% of the total transaction value, payable upon successful completion.</p><br/><div style="display:flex;justify-content:space-between;"><div><p>____________________<br/><strong>Brokerage</strong></p></div><div><p>____________________<br/><strong>Client</strong></p></div></div>` },
  { id: "commission-invoice", label: "Commission Invoice", category: "Finance", html: `<h1 style="text-align:center;color:#1e293b;">COMMISSION INVOICE</h1><p style="text-align:right;">Invoice #: ______________<br/>Date: ______________</p><p><strong>From:</strong> JBJ GLOBAL REAL ESTATE<br/><strong>To:</strong> ______________</p><table style="width:100%;border-collapse:collapse;margin:20px 0;"><tr style="background:#f1f5f9;"><th style="border:1px solid #e2e8f0;padding:8px;text-align:left;">Description</th><th style="border:1px solid #e2e8f0;padding:8px;text-align:right;">Amount (AED)</th></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">Commission on Property Sale - Unit ______________</td><td style="border:1px solid #e2e8f0;padding:8px;text-align:right;">______________</td></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">VAT (5%)</td><td style="border:1px solid #e2e8f0;padding:8px;text-align:right;">______________</td></tr><tr style="font-weight:bold;"><td style="border:1px solid #e2e8f0;padding:8px;">Total</td><td style="border:1px solid #e2e8f0;padding:8px;text-align:right;">______________</td></tr></table><p><strong>Bank Details:</strong><br/>Bank: ______________<br/>IBAN: ______________<br/>SWIFT: ______________</p>` },
  { id: "tenancy", label: "Tenancy Contract", category: "Real Estate", html: `<h1 style="text-align:center;color:#1e293b;">TENANCY CONTRACT (EJARI)</h1><p style="text-align:center;">Contract No: ______________</p><h2>Landlord</h2><p>Name: ______________<br/>Emirates ID: ______________</p><h2>Tenant</h2><p>Name: ______________<br/>Emirates ID: ______________<br/>Passport: ______________</p><h2>Property</h2><p>Address: ______________<br/>Type: Apartment / Villa / Office<br/>Area (sq ft): ______________<br/>Furnished: Yes / No</p><h2>Lease Terms</h2><p>Start Date: ______________<br/>End Date: ______________<br/>Annual Rent: AED ______________<br/>No. of Cheques: ______________<br/>Security Deposit: AED ______________</p><h2>Conditions</h2><ol><li>Tenant shall not sublease without written consent.</li><li>Maintenance of AC and appliances is tenant's responsibility.</li><li>60 days' notice required for non-renewal.</li></ol>` },
  { id: "handover", label: "Handover Checklist", category: "Real Estate", html: `<h1 style="text-align:center;color:#1e293b;">PROPERTY HANDOVER CHECKLIST</h1><p>Property: ______________<br/>Unit: ______________<br/>Date: ______________</p><table style="width:100%;border-collapse:collapse;margin:20px 0;"><tr style="background:#f1f5f9;"><th style="border:1px solid #e2e8f0;padding:8px;">Item</th><th style="border:1px solid #e2e8f0;padding:8px;">Condition</th><th style="border:1px solid #e2e8f0;padding:8px;">Notes</th></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">Keys & Access Cards</td><td style="border:1px solid #e2e8f0;padding:8px;">☐ Good ☐ Damaged</td><td style="border:1px solid #e2e8f0;padding:8px;"></td></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">Walls & Paint</td><td style="border:1px solid #e2e8f0;padding:8px;">☐ Good ☐ Damaged</td><td style="border:1px solid #e2e8f0;padding:8px;"></td></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">Flooring</td><td style="border:1px solid #e2e8f0;padding:8px;">☐ Good ☐ Damaged</td><td style="border:1px solid #e2e8f0;padding:8px;"></td></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">Kitchen Appliances</td><td style="border:1px solid #e2e8f0;padding:8px;">☐ Good ☐ Damaged</td><td style="border:1px solid #e2e8f0;padding:8px;"></td></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">Bathrooms</td><td style="border:1px solid #e2e8f0;padding:8px;">☐ Good ☐ Damaged</td><td style="border:1px solid #e2e8f0;padding:8px;"></td></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">AC System</td><td style="border:1px solid #e2e8f0;padding:8px;">☐ Good ☐ Damaged</td><td style="border:1px solid #e2e8f0;padding:8px;"></td></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">Electrical & Lights</td><td style="border:1px solid #e2e8f0;padding:8px;">☐ Good ☐ Damaged</td><td style="border:1px solid #e2e8f0;padding:8px;"></td></tr><tr><td style="border:1px solid #e2e8f0;padding:8px;">Windows & Balcony</td><td style="border:1px solid #e2e8f0;padding:8px;">☐ Good ☐ Damaged</td><td style="border:1px solid #e2e8f0;padding:8px;"></td></tr></table><br/><div style="display:flex;justify-content:space-between;"><div><p>____________________<br/><strong>Landlord / Developer</strong></p></div><div><p>____________________<br/><strong>Buyer / Tenant</strong></p></div></div>` },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/* HSL WHEEL HELPERS                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* COMPONENT                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

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
  const [hue1, setHue1] = useState(40);
  const [sat1, setSat1] = useState(65);
  const [lit1, setLit1] = useState(55);
  const [hue2, setHue2] = useState(25);
  const [sat2, setSat2] = useState(40);
  const [lit2, setLit2] = useState(45);
  const [gradientDir, setGradientDir] = useState<"horizontal"|"vertical"|"diagonal"|"radial">("horizontal");
  const [showHeaderBand, setShowHeaderBand] = useState(false);
  const [showFooterBand, setShowFooterBand] = useState(false);

  // Stamp / Signature
  const [stampDialogOpen, setStampDialogOpen] = useState(false);
  const [stampSource, setStampSource] = useState<"upload" | "saved" | "generate">("upload");
  const [stampUploading, setStampUploading] = useState(false);
  const stampFileRef = useRef<HTMLInputElement>(null);
  const licenseFileRef = useRef<HTMLInputElement>(null);

  // Template sidebar
  const [showTemplates, setShowTemplates] = useState(false);

  // Load Google Fonts
  useEffect(() => {
    if (!document.getElementById('gfonts-doc')) {
      const link = document.createElement('link');
      link.id = 'gfonts-doc';
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS_IMPORT}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  const headerColor1 = hslToHex(hue1, sat1, lit1);
  const headerColor2 = hslToHex(hue2, sat2, lit2);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleFontSize = (size: string) => {
    setFontSize(size);
    const sizeMap: Record<string, string> = { '8':'1','9':'1','10':'2','11':'2','12':'3','14':'4','16':'5','18':'5','20':'6','22':'6','24':'6','28':'7','32':'7','36':'7','42':'7','48':'7','56':'7','64':'7','72':'7','96':'7' };
    execCommand('fontSize', sizeMap[size] || '4');
  };

  const handleFontFamily = (font: string) => {
    setFontFamily(font);
    execCommand('fontName', font);
  };

  const insertLink = () => {
    if (linkUrl) { execCommand('createLink', linkUrl); setLinkUrl(""); setLinkDialogOpen(false); toast.success("Link inserted"); }
  };

  const insertImageFromUrl = () => {
    if (imageUrl) { execCommand('insertImage', imageUrl); setImageUrl(""); setImageDialogOpen(false); toast.success("Image inserted"); }
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

  // OCR
  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('document-ocr', { body: { file_base64: base64, file_type: file.type, action: 'extract' } });
      if (error) throw error;
      if (data?.text && editorRef.current) {
        const html = markdownToHtml(data.text);
        editorRef.current.innerHTML = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p','br','strong','em','u','h1','h2','h3','h4','ul','ol','li','a','span','div','table','tr','td','th','thead','tbody'],
          ALLOWED_ATTR: ['href','class','style'], ALLOW_DATA_ATTR: false
        });
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
        toast.success("Document scanned & text extracted!");
      } else { toast.error("No text could be extracted"); }
    } catch (err: any) { toast.error(err?.message || "Failed to scan document"); }
    finally { setOcrLoading(false); setOcrDialogOpen(false); if (ocrInputRef.current) ocrInputRef.current.value = ''; }
  };

  // Find & Replace
  const handleFindReplace = async () => {
    if (!findText || !editorRef.current) return;
    if (!useAiReplace) {
      const html = editorRef.current.innerHTML;
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const count = (html.match(regex) || []).length;
      editorRef.current.innerHTML = html.replace(regex, replaceText);
      toast.success(`Replaced ${count} occurrence(s)`);
      setFindReplaceOpen(false);
      return;
    }
    setFindReplaceLoading(true);
    try {
      const content = editorRef.current.innerText;
      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: { messages: [
          { role: "system", content: "You are a document editor. Given the document text below, replace ALL occurrences of the specified text. Return ONLY the modified document text. Preserve all formatting and structure." },
          { role: "user", content: `Document:\n${content}\n\nReplace every occurrence of "${findText}" with "${replaceText}". Return ONLY the modified text.` },
        ] },
      });
      if (error) throw error;
      const result = data?.choices?.[0]?.message?.content?.trim();
      if (result) { editorRef.current.innerHTML = `<p>${result.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`; toast.success("AI replacement complete!"); }
    } catch (err: any) { toast.error(err?.message || "AI replacement failed"); }
    finally { setFindReplaceLoading(false); setFindReplaceOpen(false); }
  };

  // AI Edit
  const handleAiPromptEdit = async () => {
    if (!aiPrompt || !editorRef.current) return;
    setAiPromptLoading(true);
    try {
      const content = editorRef.current.innerText;
      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: { messages: [
          { role: "system", content: "You are a professional document editor. Given the document text, apply the user's editing instruction and return the modified document. Preserve structure and formatting. Return ONLY the modified text." },
          { role: "user", content: `Document:\n${content}\n\nInstruction: ${aiPrompt}\n\nReturn ONLY the modified document text.` },
        ] },
      });
      if (error) throw error;
      const result = data?.choices?.[0]?.message?.content?.trim();
      if (result) {
        const html = markdownToHtml(result);
        editorRef.current.innerHTML = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p','br','strong','em','u','h1','h2','h3','h4','ul','ol','li','a','span','div','table','tr','td','th','thead','tbody'],
          ALLOWED_ATTR: ['href','class','style'], ALLOW_DATA_ATTR: false
        });
        toast.success("Document updated with AI!");
      }
    } catch (err: any) { toast.error(err?.message || "AI edit failed"); }
    finally { setAiPromptLoading(false); setAiPromptOpen(false); setAiPrompt(""); }
  };

  // QR Code
  const insertQrCode = () => {
    const colorHex = qrColor.replace('#', '');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}&color=${colorHex}&bgcolor=ffffff&margin=2`;
    execCommand('insertImage', qrUrl);
    setQrDialogOpen(false);
    toast.success("QR Code inserted");
  };

  // Stamp Insert
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (editorRef.current) {
        execCommand('insertImage', reader.result as string);
        toast.success("Stamp inserted");
      }
    };
    reader.readAsDataURL(file);
    setStampDialogOpen(false);
  };

  const loadSavedStamp = () => {
    const svgData = sessionStorage.getItem('esignature_stamp_svg');
    const preview = sessionStorage.getItem('jbj_stamp_preview');
    if (svgData) {
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgData)}`;
      execCommand('insertImage', svgDataUrl);
      toast.success("Stamp inserted from Stamp Generator");
    } else if (preview) {
      execCommand('insertImage', preview);
      toast.success("Stamp inserted from saved preview");
    } else {
      toast.info("No saved stamp found. Create one in the Stamp Generator first.");
    }
    setStampDialogOpen(false);
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStampUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('document-ocr', { body: { file_base64: base64, file_type: file.type, action: 'extract' } });
      if (error) throw error;
      const text = data?.text || "";
      // Generate a simple stamp SVG from extracted text
      const lines = text.split('\n').filter((l: string) => l.trim()).slice(0, 5);
      const companyName = lines[0] || "Company Name";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="#1e3a5f" stroke-width="4"/><circle cx="100" cy="100" r="80" fill="none" stroke="#1e3a5f" stroke-width="2"/><text x="100" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e3a5f" font-family="Arial">${companyName.slice(0, 25)}</text><text x="100" y="105" text-anchor="middle" font-size="9" fill="#1e3a5f" font-family="Arial">${(lines[1] || "").slice(0, 30)}</text><text x="100" y="125" text-anchor="middle" font-size="8" fill="#1e3a5f" font-family="Arial">${(lines[2] || "").slice(0, 30)}</text><line x1="30" y1="140" x2="170" y2="140" stroke="#1e3a5f" stroke-width="1"/><text x="100" y="160" text-anchor="middle" font-size="8" fill="#1e3a5f" font-family="Arial">OFFICIAL STAMP</text></svg>`;
      const svgUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      execCommand('insertImage', svgUrl);
      toast.success("Stamp generated from trade license!");
    } catch (err: any) { toast.error(err?.message || "Failed to generate stamp from license"); }
    finally { setStampUploading(false); setStampDialogOpen(false); }
  };

  // Templates
  const loadTemplate = (template: typeof DOC_TEMPLATES[0]) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(template.html, {
        ALLOWED_TAGS: ['p','br','strong','em','u','h1','h2','h3','h4','ul','ol','li','a','span','div','table','tr','td','th','thead','tbody'],
        ALLOWED_ATTR: ['href','class','style'], ALLOW_DATA_ATTR: false
      });
      setTitle(template.label);
      toast.success(`${template.label} template loaded`);
      setShowTemplates(false);
    }
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

  const getGradientStyle = () => {
    switch (gradientDir) {
      case "vertical": return `linear-gradient(180deg, ${headerColor1}, ${headerColor2})`;
      case "diagonal": return `linear-gradient(135deg, ${headerColor1}, ${headerColor2})`;
      case "radial": return `radial-gradient(circle, ${headerColor1}, ${headerColor2})`;
      default: return `linear-gradient(90deg, ${headerColor1}, ${headerColor2})`;
    }
  };

  const gradientStyle = (showHeaderBand || showFooterBand) ? getGradientStyle() : undefined;

  const handlePrint = () => {
    const content = editorRef.current?.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow && content) {
      const headerStyle = showHeaderBand ? `<div style="height:8px;background:${getGradientStyle()};margin-bottom:20px;border-radius:4px;"></div>` : '';
      const footerStyle = showFooterBand ? `<div style="height:8px;background:${getGradientStyle()};margin-top:20px;border-radius:4px;"></div>` : '';
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title><link href="https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS_IMPORT}&display=swap" rel="stylesheet"><style>body{font-family:${fontFamily};padding:40px;}img{max-width:100%;}</style></head><body>${headerStyle}${content}${footerStyle}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToHTML = () => {
    const content = editorRef.current?.innerHTML;
    if (!content) return;
    const headerBand = showHeaderBand ? `<div style="height:8px;background:${getGradientStyle()};margin-bottom:20px;border-radius:4px;"></div>` : '';
    const footerBand = showFooterBand ? `<div style="height:8px;background:${getGradientStyle()};margin-top:20px;border-radius:4px;"></div>` : '';
    const html = `<!DOCTYPE html><html><head><title>${title}</title><link href="https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS_IMPORT}&display=swap" rel="stylesheet"><style>body{font-family:${fontFamily};padding:40px;max-width:800px;margin:0 auto;}img{max-width:100%;}</style></head><body>${headerBand}${content}${footerBand}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/\s+/g, '_')}.html`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Document exported");
  };

  const exportToText = () => {
    const content = editorRef.current?.innerText;
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/\s+/g, '_')}.txt`; a.click();
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
          editorRef.current.innerHTML = DOMPurify.sanitize(match ? match[1] : content, {
            ALLOWED_TAGS: ['p','br','strong','em','u','h1','h2','h3','ul','ol','li','a','span','div','table','tr','td','th','thead','tbody','img'],
            ALLOWED_ATTR: ['href','class','style','src','alt','width','height'], ALLOW_DATA_ATTR: false
          });
        } else { editorRef.current.innerText = content; }
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
        toast.success("Document imported");
      }
    };
    reader.readAsText(file);
  };

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* RENDER — 3-Panel Layout                                                  */
  /* ═════════════════════════════════════════════════════════════════════════ */

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Header */}
        <div className="border-b-2 border-[hsl(var(--gold)/0.3)] bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <div className="max-w-[1600px] mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F5EBD7, #D4C4A8)", border: "1px solid rgba(184,148,62,0.4)" }}>
                  <FileText className="w-5 h-5" style={{ color: "#B8943E" }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Document <span style={{ color: "#B8943E" }}>Designer</span></h1>
                  <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>Create, scan & export professional documents</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input value={title} onChange={e => setTitle(e.target.value)} className="text-sm font-medium border-[hsl(var(--gold)/0.3)] bg-white/60 focus-visible:ring-[hsl(var(--gold)/0.5)] max-w-[240px] h-8" placeholder="Document title" />
                <Button variant="outline" size="sm" className="border-[hsl(var(--gold)/0.3)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)] h-8" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="border-[hsl(var(--gold)/0.3)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)] h-8"><Download className="h-4 w-4 mr-1" /> Export</Button></DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                    <DropdownMenuItem onClick={exportToHTML} className="text-[hsl(var(--popover-foreground))] hover:bg-[hsl(var(--accent))]">Export as HTML</DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToText} className="text-[hsl(var(--popover-foreground))] hover:bg-[hsl(var(--accent))]">Export as Text</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <label>
                  <Button variant="outline" size="sm" className="border-[hsl(var(--gold)/0.3)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)] h-8" asChild>
                    <span><Upload className="h-4 w-4 mr-1" /> Import</span>
                  </Button>
                  <input type="file" accept=".txt,.html,.md,.csv,.json,.xml" className="hidden" onChange={importDocument} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Panel Layout */}
        <div className="max-w-[1600px] mx-auto flex" style={{ height: "calc(100vh - 100px)" }}>

          {/* ── LEFT SIDEBAR: AI & Insert Tools ── */}
          <div className="w-[260px] shrink-0 border-r border-[hsl(var(--gold)/0.2)] bg-gradient-to-b from-[#FDFBF7] to-[#F5EFE3] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            <div className="p-3 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">AI Tools</p>

              {/* Scan */}
              <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start border-amber-500/30 text-amber-800 hover:bg-amber-50/60 text-xs h-8">
                    <ScanLine className="h-3.5 w-3.5 mr-2" /> Scan Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                  <DialogHeader><DialogTitle className="text-[hsl(var(--popover-foreground))]">📄 Scan & Extract Text</DialogTitle><DialogDescription>Upload any document or image — AI will extract all text.</DialogDescription></DialogHeader>
                  <input ref={ocrInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleOcrUpload} />
                  <Button onClick={() => ocrInputRef.current?.click()} disabled={ocrLoading} className="w-full h-20 border-2 border-dashed border-amber-400/50 bg-amber-50/30 hover:bg-amber-50/60 text-amber-800" variant="outline">
                    {ocrLoading ? <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Scanning...</span> : <span className="flex flex-col items-center gap-1"><ScanLine className="h-5 w-5" /> Upload document or image</span>}
                  </Button>
                </DialogContent>
              </Dialog>

              {/* Find & Replace */}
              <Dialog open={findReplaceOpen} onOpenChange={setFindReplaceOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start border-blue-500/30 text-blue-800 hover:bg-blue-50/60 text-xs h-8">
                    <Replace className="h-3.5 w-3.5 mr-2" /> Find & Replace
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                  <DialogHeader><DialogTitle className="text-[hsl(var(--popover-foreground))]">🔍 Find & Replace</DialogTitle><DialogDescription>Replace text. Enable AI for intelligent replacements.</DialogDescription></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Find</Label><Input value={findText} onChange={e => setFindText(e.target.value)} placeholder="e.g. XYZ Company" /></div>
                    <div><Label>Replace with</Label><Input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="e.g. JBJ Global" /></div>
                    <div className="flex items-center gap-2"><Switch checked={useAiReplace} onCheckedChange={setUseAiReplace} /><Label className="text-sm">AI-powered</Label></div>
                  </div>
                  <DialogFooter><Button onClick={handleFindReplace} disabled={findReplaceLoading || !findText}>{findReplaceLoading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Replacing...</> : "Replace All"}</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              {/* AI Edit */}
              <Dialog open={aiPromptOpen} onOpenChange={setAiPromptOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start border-purple-500/30 text-purple-800 hover:bg-purple-50/60 text-xs h-8">
                    <Wand2 className="h-3.5 w-3.5 mr-2" /> AI Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                  <DialogHeader><DialogTitle className="text-[hsl(var(--popover-foreground))]">✨ AI Document Editor</DialogTitle><DialogDescription>Write a prompt to modify your document.</DialogDescription></DialogHeader>
                  <Textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. Make this more professional, translate to Arabic..." rows={4} />
                  <DialogFooter><Button onClick={handleAiPromptEdit} disabled={aiPromptLoading || !aiPrompt}>{aiPromptLoading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing...</> : "Apply Changes"}</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="border-t border-[hsl(var(--border))] my-2" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Insert</p>

              {/* Link */}
              <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)]"><Link className="h-3.5 w-3.5 mr-2" /> Insert Link</Button></DialogTrigger>
                <DialogContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]"><DialogHeader><DialogTitle>Insert Link</DialogTitle></DialogHeader><Input placeholder="https://example.com" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} /><Button onClick={insertLink} className="w-full">Insert</Button></DialogContent>
              </Dialog>

              {/* Image */}
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)]"><Image className="h-3.5 w-3.5 mr-2" /> Insert Image</Button></DialogTrigger>
                <DialogContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                  <DialogHeader><DialogTitle>Insert Image</DialogTitle></DialogHeader>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="w-full"><TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger><TabsTrigger value="url" className="flex-1">URL</TabsTrigger></TabsList>
                    <TabsContent value="upload" className="space-y-3 pt-3">
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileUpload} />
                      <Button onClick={() => imageInputRef.current?.click()} disabled={isUploadingImage} className="w-full h-20 border-2 border-dashed border-[hsl(var(--gold)/0.4)] bg-transparent hover:bg-[hsl(var(--gold)/0.05)]" variant="outline">
                        {isUploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-5 w-5 mr-2" /> Select image</>}
                      </Button>
                    </TabsContent>
                    <TabsContent value="url" className="space-y-3 pt-3">
                      <Input placeholder="https://example.com/image.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                      <Button onClick={insertImageFromUrl} className="w-full" disabled={!imageUrl}>Insert</Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              {/* QR Code */}
              <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)]"><QrCode className="h-3.5 w-3.5 mr-2" /> QR Code</Button></DialogTrigger>
                <DialogContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                  <DialogHeader><DialogTitle>📱 Insert QR Code</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>URL or Text</Label><Input value={qrText} onChange={e => setQrText(e.target.value)} /></div>
                    <div className="flex gap-3"><div className="flex-1"><Label>Size</Label><Input type="number" value={qrSize} onChange={e => setQrSize(Number(e.target.value))} min={50} max={500} /></div><div><Label>Color</Label><input type="color" value={qrColor} onChange={e => setQrColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" /></div></div>
                    {qrText && <div className="flex justify-center p-3 bg-white rounded border"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}&color=${qrColor.replace('#','')}&bgcolor=ffffff&margin=2`} alt="QR" className="max-w-[150px]" /></div>}
                  </div>
                  <DialogFooter><Button onClick={insertQrCode} disabled={!qrText}>Insert</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Stamp */}
              <Dialog open={stampDialogOpen} onOpenChange={setStampDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)]"><Stamp className="h-3.5 w-3.5 mr-2" /> Company Stamp</Button></DialogTrigger>
                <DialogContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                  <DialogHeader><DialogTitle className="text-[hsl(var(--popover-foreground))]">🏛 Insert Company Stamp</DialogTitle><DialogDescription>Upload a stamp, load from Stamp Generator, or generate from trade license.</DialogDescription></DialogHeader>
                  <div className="space-y-3">
                    <input ref={stampFileRef} type="file" accept="image/*" className="hidden" onChange={handleStampUpload} />
                    <input ref={licenseFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleLicenseUpload} />
                    <Button variant="outline" onClick={() => stampFileRef.current?.click()} className="w-full justify-start h-12 border-[hsl(var(--gold)/0.3)]">
                      <Upload className="h-4 w-4 mr-2" /> Upload Stamp Image
                    </Button>
                    <Button variant="outline" onClick={loadSavedStamp} className="w-full justify-start h-12 border-[hsl(var(--gold)/0.3)]">
                      <Stamp className="h-4 w-4 mr-2" /> Load from Stamp Generator
                    </Button>
                    <Button variant="outline" onClick={() => licenseFileRef.current?.click()} disabled={stampUploading} className="w-full justify-start h-12 border-[hsl(var(--gold)/0.3)]">
                      {stampUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                      Generate from Trade License
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Signature */}
              <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => { window.location.href = '/e-signature'; }}>
                <PenTool className="h-3.5 w-3.5 mr-2" /> E-Signature
              </Button>

              <div className="border-t border-[hsl(var(--border))] my-2" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Templates</p>

              <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => setShowTemplates(!showTemplates)}>
                <LayoutTemplate className="h-3.5 w-3.5 mr-2" /> Document Templates
              </Button>

              {showTemplates && (
                <div className="space-y-1 pl-1">
                  {DOC_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => loadTemplate(t)}
                      className="w-full text-left px-2 py-1.5 rounded-md text-[11px] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--gold)/0.1)] transition-colors flex items-center gap-2">
                      <FileText className="w-3 h-3 text-[hsl(var(--gold))]" />
                      <span>{t.label}</span>
                      <span className="ml-auto text-[9px] text-[hsl(var(--muted-foreground))]">{t.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── CENTER: Floating Toolbar + Preview ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Floating Toolbar */}
            <div className="bg-white/90 backdrop-blur border-b border-[hsl(var(--gold)/0.2)] px-3 py-1.5 flex flex-wrap items-center gap-1 sticky top-0 z-10">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('undo')}><Undo className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('redo')}><Redo className="h-3.5 w-3.5" /></Button>
              <div className="w-px h-5 bg-[hsl(var(--gold)/0.2)] mx-0.5" />

              <Select value={fontFamily} onValueChange={handleFontFamily}>
                <SelectTrigger className="w-[130px] h-7 text-xs bg-white/80 border-[hsl(var(--gold)/0.3)]"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[300px] bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                  {FONT_FAMILIES.map(f => <SelectItem key={f} value={f} className="text-[hsl(var(--popover-foreground))]"><span style={{ fontFamily: f }}>{f}</span></SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fontSize} onValueChange={handleFontSize}>
                <SelectTrigger className="w-[60px] h-7 text-xs bg-white/80 border-[hsl(var(--gold)/0.3)]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">{FONT_SIZES.map(s => <SelectItem key={s} value={s} className="text-[hsl(var(--popover-foreground))]">{s}</SelectItem>)}</SelectContent>
              </Select>
              <div className="w-px h-5 bg-[hsl(var(--gold)/0.2)] mx-0.5" />

              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('bold')}><Bold className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('italic')}><Italic className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('underline')}><Underline className="h-3.5 w-3.5" /></Button>
              <div className="w-px h-5 bg-[hsl(var(--gold)/0.2)] mx-0.5" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]"><Type className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'p')} className="text-[hsl(var(--popover-foreground))]">Normal Text</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h1')} className="text-[hsl(var(--popover-foreground))]"><Heading1 className="h-4 w-4 mr-2" /> Heading 1</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h2')} className="text-[hsl(var(--popover-foreground))]"><Heading2 className="h-4 w-4 mr-2" /> Heading 2</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h3')} className="text-[hsl(var(--popover-foreground))]"><Heading3 className="h-4 w-4 mr-2" /> Heading 3</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="w-px h-5 bg-[hsl(var(--gold)/0.2)] mx-0.5" />

              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('justifyLeft')}><AlignLeft className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('justifyCenter')}><AlignCenter className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('justifyRight')}><AlignRight className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('justifyFull')}><AlignJustify className="h-3.5 w-3.5" /></Button>
              <div className="w-px h-5 bg-[hsl(var(--gold)/0.2)] mx-0.5" />

              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('insertUnorderedList')}><List className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[hsl(var(--gold)/0.1)]" onClick={() => execCommand('insertOrderedList')}><ListOrdered className="h-3.5 w-3.5" /></Button>
            </div>

            {/* Centered Document Preview */}
            <div className="flex-1 overflow-y-auto flex justify-center p-6" style={{ background: "linear-gradient(180deg, #F0EAD8 0%, #E8DFC8 100%)" }}>
              <div className="bg-white shadow-xl w-full max-w-[816px] min-h-[1056px] border border-[hsl(var(--gold)/0.2)] rounded-lg overflow-hidden">
                {showHeaderBand && <div className="h-3 w-full" style={{ background: gradientStyle }} />}
                <div className="p-12 sm:p-16">
                  <div ref={editorRef} contentEditable className="outline-none min-h-full text-[hsl(var(--foreground))]" style={{ fontFamily, fontSize: `${fontSize}px` }} suppressContentEditableWarning>
                    <p>Start typing your document here...</p>
                  </div>
                </div>
                {showFooterBand && <div className="h-3 w-full mt-auto" style={{ background: gradientStyle }} />}
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR: Formatting & Colors ── */}
          <div className="w-[240px] shrink-0 border-l border-[hsl(var(--gold)/0.2)] bg-gradient-to-b from-[#FDFBF7] to-[#F5EFE3] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            <div className="p-3 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Color Palette</p>

              {/* Header/Footer Bands */}
              <div className="bg-white rounded-lg border border-[hsl(var(--border))] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">Header Band</Label>
                  <Switch checked={showHeaderBand} onCheckedChange={setShowHeaderBand} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">Footer Band</Label>
                  <Switch checked={showFooterBand} onCheckedChange={setShowFooterBand} />
                </div>
              </div>

              {/* HSL Color 1 */}
              <div className="bg-white rounded-lg border border-[hsl(var(--border))] p-3 space-y-2">
                <Label className="text-[10px] font-bold text-[hsl(var(--foreground))]">Color 1</Label>
                <div>
                  <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Hue {hue1}°</Label>
                  <input type="range" min={0} max={360} value={hue1} onChange={e => setHue1(+e.target.value)} className="w-full h-2 accent-[hsl(var(--gold))]"
                    style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)", borderRadius: 4 }} />
                </div>
                <div>
                  <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Saturation {sat1}%</Label>
                  <input type="range" min={0} max={100} value={sat1} onChange={e => setSat1(+e.target.value)} className="w-full h-2 accent-[hsl(var(--gold))]" />
                </div>
                <div>
                  <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Lightness {lit1}%</Label>
                  <input type="range" min={5} max={95} value={lit1} onChange={e => setLit1(+e.target.value)} className="w-full h-2 accent-[hsl(var(--gold))]" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border" style={{ background: headerColor1 }} />
                  <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{headerColor1}</span>
                </div>
              </div>

              {/* HSL Color 2 */}
              <div className="bg-white rounded-lg border border-[hsl(var(--border))] p-3 space-y-2">
                <Label className="text-[10px] font-bold text-[hsl(var(--foreground))]">Color 2</Label>
                <div>
                  <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Hue {hue2}°</Label>
                  <input type="range" min={0} max={360} value={hue2} onChange={e => setHue2(+e.target.value)} className="w-full h-2 accent-[hsl(var(--gold))]"
                    style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)", borderRadius: 4 }} />
                </div>
                <div>
                  <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Saturation {sat2}%</Label>
                  <input type="range" min={0} max={100} value={sat2} onChange={e => setSat2(+e.target.value)} className="w-full h-2 accent-[hsl(var(--gold))]" />
                </div>
                <div>
                  <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Lightness {lit2}%</Label>
                  <input type="range" min={5} max={95} value={lit2} onChange={e => setLit2(+e.target.value)} className="w-full h-2 accent-[hsl(var(--gold))]" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border" style={{ background: headerColor2 }} />
                  <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{headerColor2}</span>
                </div>
              </div>

              {/* Gradient Direction */}
              <div className="bg-white rounded-lg border border-[hsl(var(--border))] p-3 space-y-2">
                <Label className="text-[10px] font-bold text-[hsl(var(--foreground))]">Gradient Direction</Label>
                <div className="grid grid-cols-2 gap-1">
                  {(["horizontal","vertical","diagonal","radial"] as const).map(dir => (
                    <button key={dir} onClick={() => setGradientDir(dir)}
                      className={`px-2 py-1 rounded text-[9px] capitalize border transition-all ${gradientDir === dir ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}>
                      {dir}
                    </button>
                  ))}
                </div>
                {/* Preview strip */}
                <div className="h-6 rounded-lg border" style={{ background: getGradientStyle() }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Documents;
