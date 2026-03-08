import { useState, useRef, useCallback } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Download,
  Upload,
  Undo,
  Redo,
  FileText,
  Printer,
  Type
} from "lucide-react";
import { toast } from "sonner";
import MainLayout from "@/components/MainLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FONT_SIZES = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];
const FONT_FAMILIES = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS'
];

const Documents = () => {
  const [title, setTitle] = useState("Untitled Document");
  const [fontSize, setFontSize] = useState("14");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleFontSize = (size: string) => {
    setFontSize(size);
    const sizeMap: Record<string, string> = {
      '8': '1', '10': '2', '12': '3', '14': '4', 
      '16': '5', '18': '5', '20': '6', '24': '6',
      '28': '7', '32': '7', '36': '7', '48': '7', '72': '7'
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

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      execCommand('insertImage', url);
      toast.success("Image inserted");
    }
  };

  const handlePrint = () => {
    const content = editorRef.current?.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow && content) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: ${fontFamily}; padding: 40px; }
              img { max-width: 100%; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToHTML = () => {
    const content = editorRef.current?.innerHTML;
    if (!content) return;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: ${fontFamily}; padding: 40px; max-width: 800px; margin: 0 auto; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
    
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
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'img'],
            ALLOWED_ATTR: ['href', 'class', 'style', 'src', 'alt', 'width', 'height'],
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Themed Header — Champagne Gold */}
        <div className="border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-full px-4 py-1 mb-4">
                <FileText className="w-4 h-4 text-[#8B7355]" />
                <span className="text-black text-sm font-medium">Document Editor</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
                Documents & Spreadsheets
              </h1>
              <p className="text-zinc-600">
                Create, edit, and export professional documents with rich text formatting
              </p>
            </div>
          </div>
        </div>

        {/* Document Title Input */}
        <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 px-4 py-3">
          <div className="flex items-center gap-4 max-w-7xl mx-auto">
            <FileText className="h-6 w-6 text-[#8B7355]" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-medium border-0 bg-transparent focus-visible:ring-0 max-w-md text-black focus:text-black caret-black placeholder:text-zinc-500"
              placeholder="Untitled Document"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 px-4 py-2 flex flex-wrap items-center gap-1">
          {/* Undo/Redo */}
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('undo')}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('redo')}>
            <Redo className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gold/30 mx-1" />
          
          {/* Font Family */}
          <Select value={fontFamily} onValueChange={handleFontFamily}>
            <SelectTrigger className="w-[140px] h-8 bg-white/80 border-gold/40 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom">
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Font Size */}
          <Select value={fontSize} onValueChange={handleFontSize}>
            <SelectTrigger className="w-[70px] h-8 bg-white/80 border-gold/40 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom">
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Custom Size Input */}
          <Input
            type="number"
            min={1}
            max={200}
            placeholder="px"
            className="w-[60px] h-8 bg-white/80 border-gold/40 text-black text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if (val) handleFontSize(val);
              }
            }}
          />
          
          <div className="w-px h-6 bg-gold/30 mx-1" />
          
          {/* Text Formatting */}
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('bold')}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('italic')}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('underline')}>
            <Underline className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gold/30 mx-1" />
          
          {/* Headings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10">
                <Type className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'p')}>
                Normal Text
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h1')}>
                <Heading1 className="h-4 w-4 mr-2" /> Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h2')}>
                <Heading2 className="h-4 w-4 mr-2" /> Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h3')}>
                <Heading3 className="h-4 w-4 mr-2" /> Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="w-px h-6 bg-gold/30 mx-1" />
          
          {/* Alignment */}
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('justifyLeft')}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('justifyCenter')}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('justifyRight')}>
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('justifyFull')}>
            <AlignJustify className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gold/30 mx-1" />
          
          {/* Lists */}
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => execCommand('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gold/30 mx-1" />
          
          {/* Insert */}
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10">
                <Link className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insert Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <Button onClick={insertLink} className="w-full">Insert Link</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={insertImage}>
            <Image className="h-4 w-4" />
          </Button>
          
          <div className="flex-1" />
          
          {/* Actions */}
          <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10">
                <Download className="h-4 w-4 mr-1" /> <span className="text-black">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToHTML}>
                Export as HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToText}>
                Export as Text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <label>
            <Button variant="outline" size="sm" className="border-gold/30 text-black hover:bg-gold/10" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" /> <span className="text-black">Import</span>
              </span>
            </Button>
            <input 
              type="file" 
              accept=".txt,.html" 
              className="hidden" 
              onChange={importDocument}
            />
          </label>
        </div>

        {/* Editor Area */}
        <div className="flex justify-center p-8 min-h-[calc(100vh-280px)]">
          <div className="bg-white shadow-lg w-full max-w-[816px] min-h-[1056px] p-16 border border-gold/20 rounded-lg">
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
        </div>
      </div>
    </MainLayout>
  );
};

export default Documents;