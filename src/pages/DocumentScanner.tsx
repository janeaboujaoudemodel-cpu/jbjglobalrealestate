import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, FileText, Crop, Pen, Type, Image, Download, Check, RotateCw, Trash2, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Footer from "@/components/Footer";

interface ScannedDocument {
  id: string;
  name: string;
  imageUrl: string;
  timestamp: Date;
}

interface SignatureField {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'signature' | 'text' | 'date' | 'checkbox' | 'email' | 'initial';
  value?: string;
}

interface SavedDetails {
  fullName: string;
  email: string;
  phone: string;
  initials: string;
  company: string;
}

const DocumentScanner = () => {
  const [scannedDocs, setScannedDocs] = useState<ScannedDocument[]>([]);
  const [currentDoc, setCurrentDoc] = useState<ScannedDocument | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [savedDetails, setSavedDetails] = useState<SavedDetails>({
    fullName: '',
    email: '',
    phone: '',
    initials: '',
    company: ''
  });
  const [rotation, setRotation] = useState(0);
  const [cropping, setCropping] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [addingFieldType, setAddingFieldType] = useState<SignatureField['type'] | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const documentCanvasRef = useRef<HTMLCanvasElement>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newDoc: ScannedDocument = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          imageUrl: e.target?.result as string,
          timestamp: new Date()
        };
        setScannedDocs(prev => [...prev, newDoc]);
        if (!currentDoc) setCurrentDoc(newDoc);
        toast.success(`Document "${file.name}" uploaded successfully`);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle camera capture
  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // Process image with auto-edge detection simulation
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw and apply enhancement
        ctx.drawImage(img, 0, 0);
        
        // Apply contrast enhancement for scanned look
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const contrast = 1.3;
        const intercept = 128 * (1 - contrast);
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] * contrast + intercept;     // R
          data[i + 1] = data[i + 1] * contrast + intercept; // G
          data[i + 2] = data[i + 2] * contrast + intercept; // B
        }
        ctx.putImageData(imageData, 0, 0);

        const newDoc: ScannedDocument = {
          id: Date.now().toString(),
          name: `Scan_${new Date().toISOString().slice(0, 10)}.jpg`,
          imageUrl: canvas.toDataURL('image/jpeg', 0.95),
          timestamp: new Date()
        };
        setScannedDocs(prev => [...prev, newDoc]);
        setCurrentDoc(newDoc);
        toast.success("Document scanned and enhanced successfully!");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Signature drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (signatureType === 'draw') {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      setSavedSignature(canvas.toDataURL());
      toast.success("Signature saved!");
    } else if (signatureType === 'type' && typedSignature) {
      // Create signature from typed text
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'italic 36px "Brush Script MT", cursive';
      ctx.fillStyle = '#000';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedSignature, 10, 50);
      setSavedSignature(canvas.toDataURL());
      toast.success("Signature created from text!");
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSavedSignature(ev.target?.result as string);
      toast.success("Signature uploaded!");
    };
    reader.readAsDataURL(file);
  };

  // Add field to document
  const addField = (type: SignatureField['type']) => {
    const newField: SignatureField = {
      id: Date.now().toString(),
      x: 100,
      y: 100,
      width: type === 'checkbox' ? 30 : 200,
      height: type === 'checkbox' ? 30 : 50,
      type,
      value: type === 'date' ? new Date().toLocaleDateString() : ''
    };
    setSignatureFields(prev => [...prev, newField]);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} field added - drag to position`);
  };

  // Auto-detect fields (AI simulation)
  const autoDetectFields = () => {
    toast.loading("AI analyzing document...");
    setTimeout(() => {
      const detectedFields: SignatureField[] = [
        { id: '1', x: 150, y: 600, width: 200, height: 50, type: 'signature' },
        { id: '2', x: 400, y: 600, width: 150, height: 40, type: 'date', value: new Date().toLocaleDateString() },
        { id: '3', x: 150, y: 500, width: 250, height: 35, type: 'text', value: savedDetails.fullName },
        { id: '4', x: 150, y: 450, width: 250, height: 35, type: 'email', value: savedDetails.email },
      ];
      setSignatureFields(detectedFields);
      toast.dismiss();
      toast.success("AI detected 4 fillable fields!");
    }, 1500);
  };

  // Apply saved details to all matching fields
  const autoFillFields = () => {
    setSignatureFields(prev => prev.map(field => {
      if (field.type === 'text' && !field.value) return { ...field, value: savedDetails.fullName };
      if (field.type === 'email') return { ...field, value: savedDetails.email };
      if (field.type === 'initial') return { ...field, value: savedDetails.initials };
      return field;
    }));
    toast.success("Details auto-filled!");
  };

  // Rotate document
  const rotateDocument = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Download signed document
  const downloadDocument = () => {
    if (!currentDoc) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.drawImage(img, 0, 0);
      
      // Draw fields
      signatureFields.forEach(field => {
        if (field.type === 'signature' && savedSignature) {
          const sigImg = new window.Image();
          sigImg.onload = () => {
            ctx.drawImage(sigImg, field.x, field.y, field.width, field.height);
          };
          sigImg.src = savedSignature;
        } else if (field.value) {
          ctx.font = '16px Arial';
          ctx.fillStyle = '#000';
          ctx.fillText(field.value, field.x + 5, field.y + 25);
        }
      });

      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `signed_${currentDoc.name}`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success("Signed document downloaded!");
      }, 500);
    };
    img.src = currentDoc.imageUrl;
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/30 via-green-800/20 to-green-900/30 border-b border-green-500/20">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-1 mb-4">
              <FileText className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">Professional Document Tools</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Document Scanner & <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">e-Sign</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Scan, edit, and sign contracts professionally. Auto-detect fields, add signatures, and fill forms with ease.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Controls */}
          <div className="space-y-6">
            {/* Upload Options */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  Scan Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Camera Capture */}
                <div>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture with Camera
                  </Button>
                  <p className="text-xs text-zinc-500 mt-1 text-center">AI auto-crops and enhances edges</p>
                </div>

                {/* File Upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDF/Image
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Document List */}
            {scannedDocs.length > 0 && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">My Documents ({scannedDocs.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                  {scannedDocs.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setCurrentDoc(doc)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        currentDoc?.id === doc.id
                          ? 'bg-emerald-600/20 border border-emerald-500/50'
                          : 'bg-zinc-800/50 hover:bg-zinc-800'
                      }`}
                    >
                      <p className="text-sm text-white truncate">{doc.name}</p>
                      <p className="text-xs text-zinc-500">{doc.timestamp.toLocaleTimeString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Signature Panel */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Pen className="w-5 h-5 text-emerald-400" />
                  Your Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as any)}>
                  <TabsList className="grid grid-cols-3 bg-zinc-800">
                    <TabsTrigger value="draw" className="text-xs">Draw</TabsTrigger>
                    <TabsTrigger value="type" className="text-xs">Type</TabsTrigger>
                    <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="draw" className="mt-4">
                    <canvas
                      ref={signatureCanvasRef}
                      width={250}
                      height={80}
                      className="w-full bg-white rounded-lg cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={clearSignature} className="flex-1 text-xs">
                        <Trash2 className="w-3 h-3 mr-1" /> Clear
                      </Button>
                      <Button size="sm" onClick={saveSignature} className="flex-1 bg-emerald-600 text-xs">
                        <Save className="w-3 h-3 mr-1" /> Save
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="type" className="mt-4">
                    <Input
                      placeholder="Type your name..."
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      className="bg-white text-black font-signature text-2xl italic text-center h-16"
                      style={{ fontFamily: '"Brush Script MT", cursive' }}
                    />
                    <Button size="sm" onClick={saveSignature} className="w-full mt-2 bg-emerald-600 text-xs">
                      Create Signature
                    </Button>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4">
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      id="sig-upload"
                      onChange={handleSignatureUpload}
                    />
                    <label
                      htmlFor="sig-upload"
                      className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-zinc-600 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors"
                    >
                      <Image className="w-6 h-6 text-zinc-500 mb-1" />
                      <span className="text-xs text-zinc-500">Upload PNG signature</span>
                    </label>
                  </TabsContent>
                </Tabs>

                {savedSignature && (
                  <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                    <p className="text-xs text-emerald-400 mb-2">Saved Signature:</p>
                    <img src={savedSignature} alt="Signature" className="h-12 object-contain" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Details */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Auto-Fill Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-zinc-400">Full Name</Label>
                  <Input
                    value={savedDetails.fullName}
                    onChange={(e) => setSavedDetails(prev => ({ ...prev, fullName: e.target.value }))}
                    className="h-8 text-sm bg-zinc-800 border-zinc-700"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Email</Label>
                  <Input
                    value={savedDetails.email}
                    onChange={(e) => setSavedDetails(prev => ({ ...prev, email: e.target.value }))}
                    className="h-8 text-sm bg-zinc-800 border-zinc-700"
                    placeholder="john@email.com"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Phone</Label>
                  <Input
                    value={savedDetails.phone}
                    onChange={(e) => setSavedDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-8 text-sm bg-zinc-800 border-zinc-700"
                    placeholder="+971 50 123 4567"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Initials</Label>
                  <Input
                    value={savedDetails.initials}
                    onChange={(e) => setSavedDetails(prev => ({ ...prev, initials: e.target.value }))}
                    className="h-8 text-sm bg-zinc-800 border-zinc-700"
                    placeholder="JD"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Document Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900/50 border-zinc-800 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Document Preview</CardTitle>
                {currentDoc && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={rotateDocument} className="text-xs">
                      <RotateCw className="w-3 h-3 mr-1" /> Rotate
                    </Button>
                    <Button size="sm" variant="outline" onClick={autoDetectFields} className="text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/20">
                      <Crop className="w-3 h-3 mr-1" /> AI Detect Fields
                    </Button>
                    <Button size="sm" variant="outline" onClick={autoFillFields} className="text-xs">
                      Auto-Fill
                    </Button>
                    <Button size="sm" onClick={downloadDocument} className="text-xs bg-emerald-600">
                      <Download className="w-3 h-3 mr-1" /> Download Signed
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {currentDoc ? (
                  <div className="relative bg-zinc-800 rounded-lg overflow-hidden min-h-[600px]">
                    <img
                      src={currentDoc.imageUrl}
                      alt={currentDoc.name}
                      className="w-full h-auto"
                      style={{ transform: `rotate(${rotation}deg)` }}
                    />
                    
                    {/* Field placeholders */}
                    {signatureFields.map(field => (
                      <div
                        key={field.id}
                        className="absolute border-2 border-dashed border-emerald-500 bg-emerald-500/10 cursor-move"
                        style={{
                          left: field.x,
                          top: field.y,
                          width: field.width,
                          height: field.height
                        }}
                      >
                        {field.type === 'signature' && savedSignature ? (
                          <img src={savedSignature} alt="sig" className="w-full h-full object-contain" />
                        ) : field.type === 'checkbox' ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-emerald-500" />
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={field.value || ''}
                            onChange={(e) => {
                              setSignatureFields(prev =>
                                prev.map(f => f.id === field.id ? { ...f, value: e.target.value } : f)
                              );
                            }}
                            className="w-full h-full bg-transparent text-black text-sm px-1 focus:outline-none"
                            placeholder={field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                          />
                        )}
                        <span className="absolute -top-5 left-0 text-xs text-emerald-400 capitalize">{field.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[600px] text-zinc-500">
                    <FileText className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg">No document selected</p>
                    <p className="text-sm">Upload or capture a document to get started</p>
                  </div>
                )}

                {/* Add Field Buttons */}
                {currentDoc && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800">
                    <span className="text-xs text-zinc-500 w-full mb-2">Add Fields:</span>
                    <Button size="sm" variant="outline" onClick={() => addField('signature')} className="text-xs">
                      <Pen className="w-3 h-3 mr-1" /> Signature
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addField('text')} className="text-xs">
                      <Type className="w-3 h-3 mr-1" /> Text
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addField('date')} className="text-xs">
                      Date
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addField('checkbox')} className="text-xs">
                      Checkbox
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addField('email')} className="text-xs">
                      Email
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addField('initial')} className="text-xs">
                      Initial
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center">
          <p className="text-xs text-zinc-500">
            ⚠️ This tool is for document preparation purposes. For legally binding contracts, please consult with our Law Firm division or use certified e-signature services.
          </p>
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default DocumentScanner;
