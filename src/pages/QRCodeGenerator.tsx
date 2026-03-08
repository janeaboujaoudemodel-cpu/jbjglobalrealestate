import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Download, Copy, Link, Mail, Phone, MapPin, Wifi, FileText } from "lucide-react";
import { toast } from "sonner";

const QR_TYPES = [
  { id: "url", label: "URL / Website", icon: Link, placeholder: "https://jbj.ae" },
  { id: "email", label: "Email", icon: Mail, placeholder: "contact@jbj.ae" },
  { id: "phone", label: "Phone", icon: Phone, placeholder: "+971501234567" },
  { id: "text", label: "Plain Text", icon: FileText, placeholder: "Your text here..." },
  { id: "location", label: "Location", icon: MapPin, placeholder: "25.2048,55.2708" },
  { id: "wifi", label: "WiFi", icon: Wifi, placeholder: "SSID:password" },
];

const QR_SIZES = [100, 150, 200, 250, 300, 400, 500];

const QRCodeGenerator = () => {
  const [qrType, setQrType] = useState("url");
  const [qrData, setQrData] = useState("https://jbj.ae");
  const [qrSize, setQrSize] = useState(300);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  const buildQrData = (): string => {
    switch (qrType) {
      case "email": return `mailto:${qrData}`;
      case "phone": return `tel:${qrData}`;
      case "wifi": {
        const [ssid, pass] = qrData.split(':');
        return `WIFI:T:WPA;S:${ssid};P:${pass || ''};;`;
      }
      default: return qrData;
    }
  };

  const qrUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(buildQrData())}&color=${fgColor.replace('#','')}&bgcolor=${bgColor.replace('#','')}&margin=2`
    : "";

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("QR Code downloaded");
    } catch { toast.error("Download failed"); }
  };

  const handleCopy = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success("QR Code copied to clipboard");
    } catch { toast.error("Copy failed"); }
  };

  const currentType = QR_TYPES.find(t => t.id === qrType)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-full px-4 py-1 mb-4">
              <QrCode className="w-4 h-4 text-[#8B7355]" />
              <span className="text-black text-sm font-medium">QR Code Generator</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">QR Code Generator</h1>
            <p className="text-zinc-600">Generate custom QR codes for URLs, contacts, WiFi, and more</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-white/80 border border-gold/20 rounded-xl p-6 space-y-5">
              <div>
                <Label className="font-semibold text-black">QR Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {QR_TYPES.map(t => (
                    <button key={t.id} onClick={() => { setQrType(t.id); setQrData(""); }}
                      className={`flex items-center gap-1.5 p-2.5 rounded-lg text-xs font-medium border transition-all ${qrType === t.id ? 'bg-black text-white border-black' : 'bg-white text-zinc-700 border-gold/30 hover:bg-gold/10'}`}>
                      <t.icon className="h-3.5 w-3.5" />{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="font-semibold text-black">{currentType.label} Data</Label>
                <Input value={qrData} onChange={(e) => setQrData(e.target.value)} placeholder={currentType.placeholder} className="mt-1" />
              </div>
              <div>
                <Label className="font-semibold text-black">Size</Label>
                <Select value={String(qrSize)} onValueChange={(v) => setQrSize(Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{QR_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}×{s}px</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="font-semibold text-black">Foreground</Label>
                  <div className="flex gap-2 mt-1 items-center">
                    <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                    <span className="text-xs text-muted-foreground">{fgColor}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="font-semibold text-black">Background</Label>
                  <div className="flex gap-2 mt-1 items-center">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                    <span className="text-xs text-muted-foreground">{bgColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="bg-white border border-gold/20 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
              {qrData ? (
                <img src={qrUrl} alt="QR Code" className="max-w-full" style={{ width: Math.min(qrSize, 400), height: Math.min(qrSize, 400) }} />
              ) : (
                <div className="text-center text-muted-foreground">
                  <QrCode className="h-16 w-16 mx-auto mb-3 opacity-30" />
                  <p>Enter data to generate QR code</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleDownload} disabled={!qrData} className="flex-1 bg-black text-white hover:bg-zinc-800">
                <Download className="h-4 w-4 mr-2" /> Download PNG
              </Button>
              <Button onClick={handleCopy} disabled={!qrData} variant="outline" className="flex-1 border-gold/30">
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
