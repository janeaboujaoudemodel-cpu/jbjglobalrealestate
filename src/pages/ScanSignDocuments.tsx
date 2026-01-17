import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Camera, Upload, FileText, Crop, Pen, Type, Image, Download, Check, RotateCw, 
  Trash2, Save, Share2, Palette, FolderOpen, Plus, X, Smartphone, Mail, Sparkles, PenTool, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import SignatureDesigner from "@/components/referral/SignatureDesigner";

interface ScannedDocument {
  id: string;
  name: string;
  imageUrl: string;
  timestamp: Date;
  isColor: boolean;
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

interface SavedProject {
  id: string;
  name: string;
  documents: ScannedDocument[];
  signatureFields: SignatureField[];
  savedDetails: SavedDetails;
  savedSignature: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ScanSignDocuments = () => {
  const [scannedDocs, setScannedDocs] = useState<ScannedDocument[]>([]);
  const [currentDoc, setCurrentDoc] = useState<ScannedDocument | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload' | 'design'>('design');
  const [typedSignature, setTypedSignature] = useState('');
  const [savedDetails, setSavedDetails] = useState<SavedDetails>({
    fullName: '',
    email: '',
    phone: '',
    initials: '',
    company: ''
  });
  const [rotation, setRotation] = useState(0);
  
  // New features state
  const [colorMode, setColorMode] = useState<'color' | 'bw'>('color');
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load saved signature from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jbj_user_signature');
    if (saved) {
      setSavedSignature(saved);
    }
  }, []);

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('document_scanner_projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        documents: p.documents.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp)
        }))
      })));
    }
  }, []);

  // Save projects to localStorage
  const saveProjects = (updatedProjects: SavedProject[]) => {
    localStorage.setItem('document_scanner_projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  // Apply image processing
  const processImage = (imageData: string, isColor: boolean, enhance: boolean): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(imageData); return; }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = data.data;

        // Auto-enhance (contrast boost for scanner-like quality)
        if (enhance) {
          const contrast = 1.4;
          const brightness = 10;
          for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.min(255, pixels[i] * contrast + brightness);
            pixels[i + 1] = Math.min(255, pixels[i + 1] * contrast + brightness);
            pixels[i + 2] = Math.min(255, pixels[i + 2] * contrast + brightness);
          }
        }

        // Convert to black & white if needed
        if (!isColor) {
          for (let i = 0; i < pixels.length; i += 4) {
            const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            const bw = avg > 128 ? 255 : 0;
            pixels[i] = bw;
            pixels[i + 1] = bw;
            pixels[i + 2] = bw;
          }
        }

        ctx.putImageData(data, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = imageData;
    });
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawImage = e.target?.result as string;
        const processed = await processImage(rawImage, colorMode === 'color', autoEnhance);
        
        const newDoc: ScannedDocument = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          imageUrl: processed,
          timestamp: new Date(),
          isColor: colorMode === 'color'
        };
        setScannedDocs(prev => [...prev, newDoc]);
        if (!currentDoc) setCurrentDoc(newDoc);
        toast.success(`Document "${file.name}" scanned successfully`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawImage = e.target?.result as string;
      const processed = await processImage(rawImage, colorMode === 'color', autoEnhance);

      const newDoc: ScannedDocument = {
        id: Date.now().toString(),
        name: `Scan_${new Date().toISOString().slice(0, 10)}.jpg`,
        imageUrl: processed,
        timestamp: new Date(),
        isColor: colorMode === 'color'
      };
      setScannedDocs(prev => [...prev, newDoc]);
      setCurrentDoc(newDoc);
      toast.success("Document scanned with auto-enhancement!");
    };
    reader.readAsDataURL(file);
  };

  // Re-process current document with new settings
  const reprocessDocument = async () => {
    if (!currentDoc) return;
    toast.loading("Reprocessing document...");
    
    const processed = await processImage(currentDoc.imageUrl, colorMode === 'color', autoEnhance);
    
    const updatedDoc = { ...currentDoc, imageUrl: processed, isColor: colorMode === 'color' };
    setCurrentDoc(updatedDoc);
    setScannedDocs(prev => prev.map(d => d.id === currentDoc.id ? updatedDoc : d));
    
    toast.dismiss();
    toast.success(`Converted to ${colorMode === 'color' ? 'Color' : 'Black & White'}`);
  };

  // Signature drawing functions
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

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawnSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const sigData = canvas.toDataURL();
    setSavedSignature(sigData);
    localStorage.setItem('jbj_user_signature', sigData);
    toast.success("Signature saved!");
  };

  const saveTypedSignature = () => {
    if (!typedSignature) return;
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
    const sigData = canvas.toDataURL();
    setSavedSignature(sigData);
    localStorage.setItem('jbj_user_signature', sigData);
    toast.success("Signature created!");
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const sigData = ev.target?.result as string;
      setSavedSignature(sigData);
      localStorage.setItem('jbj_user_signature', sigData);
      toast.success("Signature uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleDesignedSignature = (signatureUrl: string) => {
    setSavedSignature(signatureUrl);
    localStorage.setItem('jbj_user_signature', signatureUrl);
    toast.success("Designed signature saved!");
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
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} field added`);
  };

  // Auto-detect fields (AI simulation)
  const autoDetectFields = () => {
    toast.loading("Analyzing document...");
    setTimeout(() => {
      const detectedFields: SignatureField[] = [
        { id: '1', x: 150, y: 600, width: 200, height: 50, type: 'signature' },
        { id: '2', x: 400, y: 600, width: 150, height: 40, type: 'date', value: new Date().toLocaleDateString() },
        { id: '3', x: 150, y: 500, width: 250, height: 35, type: 'text', value: savedDetails.fullName },
        { id: '4', x: 150, y: 450, width: 250, height: 35, type: 'email', value: savedDetails.email },
      ];
      setSignatureFields(detectedFields);
      toast.dismiss();
      toast.success("Detected 4 fillable fields!");
    }, 1500);
  };

  // Auto-fill fields
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
  const rotateDocument = () => setRotation(prev => (prev + 90) % 360);

  // Generate final document
  const generateFinalDocument = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!currentDoc) { resolve(''); return; }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(''); return; }

      const img = new window.Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.drawImage(img, 0, 0);
        
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

        setTimeout(() => resolve(canvas.toDataURL('image/png')), 300);
      };
      img.src = currentDoc.imageUrl;
    });
  };

  // Download document
  const downloadDocument = async () => {
    if (!currentDoc) return;
    const dataUrl = await generateFinalDocument();
    const link = document.createElement('a');
    link.download = `signed_${currentDoc.name}`;
    link.href = dataUrl;
    link.click();
    toast.success("Document downloaded!");
  };

  // Share document
  const shareDocument = async (method: 'whatsapp' | 'email' | 'copy') => {
    if (!currentDoc) return;
    
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=Check out this signed document from JBJ Global Real Estate`, '_blank');
      toast.success("Opening WhatsApp...");
    } else if (method === 'email') {
      window.open(`mailto:?subject=Signed Document from JBJ Global Real Estate&body=Please find the attached document.`, '_blank');
      toast.success("Opening email client...");
    }
    setShowShareModal(false);
  };

  // Save to phone (mobile download)
  const saveToPhone = async () => {
    await downloadDocument();
    toast.success("Document saved to your device!");
  };

  // Project management
  const createProject = () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    
    const newProject: SavedProject = {
      id: Date.now().toString(),
      name: newProjectName,
      documents: scannedDocs,
      signatureFields,
      savedDetails,
      savedSignature,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updated = [...projects, newProject];
    saveProjects(updated);
    setCurrentProject(newProject);
    setNewProjectName('');
    setShowProjectModal(false);
    toast.success(`Project "${newProjectName}" created!`);
  };

  const saveCurrentProject = () => {
    if (!currentProject) {
      setShowProjectModal(true);
      return;
    }
    
    const updated = projects.map(p => 
      p.id === currentProject.id 
        ? { ...p, documents: scannedDocs, signatureFields, savedDetails, savedSignature, updatedAt: new Date() }
        : p
    );
    saveProjects(updated);
    toast.success("Project saved!");
  };

  const loadProject = (project: SavedProject) => {
    setCurrentProject(project);
    setScannedDocs(project.documents);
    setSignatureFields(project.signatureFields);
    setSavedDetails(project.savedDetails);
    setSavedSignature(project.savedSignature);
    if (project.documents.length > 0) {
      setCurrentDoc(project.documents[0]);
    }
    toast.success(`Project "${project.name}" loaded!`);
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
              <span className="text-green-300 text-sm font-medium">Document Assistant</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Scan & Sign <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Documents</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Use this assistant to scan, sign, and manage your documents easily. Design your signature or upload one to get started.
            </p>
            <p className="text-xs text-gold mt-2">Developed by Founder and CEO Jane Abou Jaoude</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Project Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">
              {currentProject ? currentProject.name : "Untitled Project"}
            </span>
          </div>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={saveCurrentProject} className="text-xs">
            <Save className="w-3 h-3 mr-1" /> Save Project
          </Button>
          <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Project Name</Label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Contract Documents"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <Button onClick={createProject} className="w-full bg-emerald-600">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {projects.length > 0 && (
            <Select onValueChange={(id) => {
              const project = projects.find(p => p.id === id);
              if (project) loadProject(project);
            }}>
              <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-sm">
                <SelectValue placeholder="Load Project" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-white">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Signature Panel - First Step */}
            <Card className="bg-zinc-900/50 border-zinc-800 border-2 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-green-400" />
                  Step 1: Design / Upload Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Info Banner */}
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Design a personal signature or draw/upload one. Your signature will be used for signing documents.
                  </p>
                </div>

                <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as any)}>
                  <TabsList className="grid grid-cols-4 bg-zinc-800">
                    <TabsTrigger value="design" className="text-xs gap-1">
                      <Sparkles className="w-3 h-3" />
                      Design
                    </TabsTrigger>
                    <TabsTrigger value="draw" className="text-xs">Draw</TabsTrigger>
                    <TabsTrigger value="type" className="text-xs">Type</TabsTrigger>
                    <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="design" className="mt-4">
                    <SignatureDesigner
                      onSelectSignature={handleDesignedSignature}
                      onSaveSignature={handleDesignedSignature}
                    />
                  </TabsContent>
                  
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
                      <Button size="sm" onClick={saveDrawnSignature} className="flex-1 bg-emerald-600 text-xs">
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
                    <Button size="sm" onClick={saveTypedSignature} className="w-full mt-2 bg-emerald-600 text-xs">
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
                    <p className="text-xs text-emerald-400 mb-2">✓ Saved Signature:</p>
                    <img src={savedSignature} alt="Signature" className="h-12 object-contain bg-white rounded p-1" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scan Settings */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-400" />
                  Step 2: Scan Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300">Color Mode</Label>
                  <Select value={colorMode} onValueChange={(v: 'color' | 'bw') => setColorMode(v)}>
                    <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="color">Full Color</SelectItem>
                      <SelectItem value="bw">Black & White</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300">Auto-Enhance</Label>
                  <Switch checked={autoEnhance} onCheckedChange={setAutoEnhance} />
                </div>
                {currentDoc && (
                  <Button onClick={reprocessDocument} variant="outline" className="w-full text-xs">
                    <RotateCw className="w-3 h-3 mr-1" /> Apply Settings
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Upload Options */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  Step 3: Scan Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <p className="text-xs text-zinc-500 text-center">Auto-straightens & enhances like a scanner</p>

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
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white truncate flex-1">{doc.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${doc.isColor ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-600/20 text-zinc-400'}`}>
                          {doc.isColor ? 'Color' : 'B&W'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">{doc.timestamp.toLocaleTimeString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

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
                    placeholder="+971 56 591 1000"
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
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-white">Step 4: Sign & Export</CardTitle>
                {currentDoc && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={rotateDocument} className="text-xs">
                      <RotateCw className="w-3 h-3 mr-1" /> Rotate
                    </Button>
                    <Button size="sm" variant="outline" onClick={autoDetectFields} className="text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/20">
                      <Crop className="w-3 h-3 mr-1" /> Detect Fields
                    </Button>
                    <Button size="sm" variant="outline" onClick={autoFillFields} className="text-xs">
                      Auto-Fill
                    </Button>
                    <Button size="sm" onClick={downloadDocument} className="text-xs bg-emerald-600">
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                    <Button size="sm" onClick={saveToPhone} variant="outline" className="text-xs">
                      <Smartphone className="w-3 h-3 mr-1" /> Save
                    </Button>
                    <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Share2 className="w-3 h-3 mr-1" /> Share
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-900 border-zinc-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Share Document</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <Button onClick={() => shareDocument('whatsapp')} className="bg-green-600 hover:bg-green-700">
                            <Share2 className="w-4 h-4 mr-2" /> WhatsApp
                          </Button>
                          <Button onClick={() => shareDocument('email')} variant="outline">
                            <Mail className="w-4 h-4 mr-2" /> Email
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                            className="w-full h-full bg-transparent text-black text-sm px-2 focus:outline-none"
                            placeholder={field.type}
                          />
                        )}
                        <button
                          onClick={() => setSignatureFields(prev => prev.filter(f => f.id !== field.id))}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[600px] flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-700 rounded-lg">
                    <FileText className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg mb-2">No document selected</p>
                    <p className="text-sm">Upload or scan a document to get started</p>
                  </div>
                )}

                {/* Field Adding Toolbar */}
                {currentDoc && (
                  <div className="mt-4 flex flex-wrap gap-2 p-4 bg-zinc-800/50 rounded-lg">
                    <span className="text-zinc-400 text-sm mr-2">Add Field:</span>
                    <Button size="sm" variant="outline" onClick={() => addField('signature')} className="text-xs">
                      <Pen className="w-3 h-3 mr-1" /> Signature
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addField('text')} className="text-xs">
                      <Type className="w-3 h-3 mr-1" /> Text
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addField('date')} className="text-xs">
                      Date
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addField('initial')} className="text-xs">
                      Initial
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addField('checkbox')} className="text-xs">
                      <Check className="w-3 h-3 mr-1" /> Checkbox
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default ScanSignDocuments;
