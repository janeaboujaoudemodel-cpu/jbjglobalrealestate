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
import SignatureDesigner from "@/components/referral/SignatureDesigner";
import { useScanSignDocuments } from "@/pages/useScanSignDocuments";

const ScanSignDocuments = () => {
  const h = useScanSignDocuments();

  return (
    <section className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/30 via-green-800/20 to-green-900/30 border-b border-green-500/20">
        <div className="container mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-1 mb-4">
              <FileText className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">Document Assistant</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Scan & Sign <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Documents</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">Use this assistant to scan, sign, and manage your documents easily. Design your signature or upload one to get started.</p>
            <p className="text-xs text-gold mt-2">Powered by JBJ Global Real Estate</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Project Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">{h.currentProject ? h.currentProject.name : "Untitled Project"}</span>
          </div>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={h.saveCurrentProject} className="text-xs"><Save className="w-3 h-3 mr-1" /> Save Project</Button>
          <Dialog open={h.showProjectModal} onOpenChange={h.setShowProjectModal}>
            <DialogTrigger asChild><Button size="sm" variant="outline" className="text-xs"><Plus className="w-3 h-3 mr-1" /> New Project</Button></DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-700">
              <DialogHeader><DialogTitle className="text-white">Create New Project</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label className="text-zinc-400">Project Name</Label><Input value={h.newProjectName} onChange={(e) => h.setNewProjectName(e.target.value)} placeholder="My Contract Documents" className="bg-zinc-800 border-zinc-700" /></div>
                <Button onClick={h.createProject} className="w-full bg-emerald-600">Create Project</Button>
              </div>
            </DialogContent>
          </Dialog>
          {h.projects.length > 0 && (
            <Select onValueChange={(id) => { const project = h.projects.find(p => p.id === id); if (project) h.loadProject(project); }}>
              <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-sm"><SelectValue placeholder="Load Project" /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {h.projects.map(p => <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Signature Panel */}
            <Card className="bg-zinc-900/50 border-zinc-800 border-2 border-green-500/30">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><PenTool className="w-5 h-5 text-green-400" />Step 1: Design / Upload Signature</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">Design a personal signature or draw/upload one. Your signature will be used for signing documents.</p>
                </div>
                <Tabs value={h.signatureType} onValueChange={(v) => h.setSignatureType(v as any)}>
                  <TabsList className="grid grid-cols-4 bg-zinc-800">
                    <TabsTrigger value="design" className="text-xs gap-1"><Sparkles className="w-3 h-3" />Design</TabsTrigger>
                    <TabsTrigger value="draw" className="text-xs">Draw</TabsTrigger>
                    <TabsTrigger value="type" className="text-xs">Type</TabsTrigger>
                    <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
                  </TabsList>
                  <TabsContent value="design" className="mt-4"><SignatureDesigner onSelectSignature={h.handleDesignedSignature} onSaveSignature={h.handleDesignedSignature} /></TabsContent>
                  <TabsContent value="draw" className="mt-4">
                    <canvas ref={h.signatureCanvasRef} width={250} height={80} className="w-full bg-white rounded-lg cursor-crosshair" onMouseDown={h.startDrawing} onMouseMove={h.draw} onMouseUp={h.stopDrawing} onMouseLeave={h.stopDrawing} />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={h.clearSignature} className="flex-1 text-xs"><Trash2 className="w-3 h-3 mr-1" /> Clear</Button>
                      <Button size="sm" onClick={h.saveDrawnSignature} className="flex-1 bg-emerald-600 text-xs"><Save className="w-3 h-3 mr-1" /> Save</Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="type" className="mt-4">
                    <Input placeholder="Type your name..." value={h.typedSignature} onChange={(e) => h.setTypedSignature(e.target.value)} className="bg-white text-black font-signature text-2xl italic text-center h-16" style={{ fontFamily: '"Brush Script MT", cursive' }} />
                    <Button size="sm" onClick={h.saveTypedSignature} className="w-full mt-2 bg-emerald-600 text-xs">Create Signature</Button>
                  </TabsContent>
                  <TabsContent value="upload" className="mt-4">
                    <input type="file" accept="image/png,image/jpeg" className="hidden" id="sig-upload" onChange={h.handleSignatureUpload} />
                    <label htmlFor="sig-upload" className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-zinc-600 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                      <Image className="w-6 h-6 text-zinc-500 mb-1" /><span className="text-xs text-zinc-500">Upload PNG signature</span>
                    </label>
                  </TabsContent>
                </Tabs>
                {h.savedSignature && (
                  <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                    <p className="text-xs text-emerald-400 mb-2">✓ Saved Signature:</p>
                    <img src={h.savedSignature} alt="Signature" className="h-12 object-contain bg-white rounded p-1" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scan Settings */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Palette className="w-5 h-5 text-emerald-400" />Step 2: Scan Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300">Color Mode</Label>
                  <Select value={h.colorMode} onValueChange={(v: 'color' | 'bw') => h.setColorMode(v)}>
                    <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="color">Full Color</SelectItem>
                      <SelectItem value="bw">Black & White</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300">Auto-Enhance</Label>
                  <Switch checked={h.autoEnhance} onCheckedChange={h.setAutoEnhance} />
                </div>
                {h.currentDoc && <Button onClick={h.reprocessDocument} variant="outline" className="w-full text-xs"><RotateCw className="w-3 h-3 mr-1" /> Apply Settings</Button>}
              </CardContent>
            </Card>

            {/* Upload Options */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Upload className="w-5 h-5 text-emerald-400" />Step 3: Scan Document</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <input ref={h.cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={h.handleCameraCapture} />
                <Button onClick={() => h.cameraInputRef.current?.click()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"><Camera className="w-4 h-4 mr-2" />Capture with Camera</Button>
                <p className="text-xs text-zinc-500 text-center">Auto-straightens & enhances like a scanner</p>
                <input ref={h.fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={h.handleFileUpload} />
                <Button onClick={() => h.fileInputRef.current?.click()} variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"><Upload className="w-4 h-4 mr-2" />Upload PDF/Image</Button>
              </CardContent>
            </Card>

            {/* Document List */}
            {h.scannedDocs.length > 0 && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader><CardTitle className="text-white text-sm">My Documents ({h.scannedDocs.length})</CardTitle></CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                  {h.scannedDocs.map(doc => (
                    <div key={doc.id} onClick={() => h.setCurrentDoc(doc)} className={`p-3 rounded-lg cursor-pointer transition-all ${h.currentDoc?.id === doc.id ? 'bg-emerald-600/20 border border-emerald-500/50' : 'bg-zinc-800/50 hover:bg-zinc-800'}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white truncate flex-1">{doc.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${doc.isColor ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-600/20 text-zinc-400'}`}>{doc.isColor ? 'Color' : 'B&W'}</span>
                      </div>
                      <p className="text-xs text-zinc-500">{doc.timestamp.toLocaleTimeString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Saved Details */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader><CardTitle className="text-white text-sm">Auto-Fill Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "fullName" as const, label: "Full Name", placeholder: "John Doe" },
                  { key: "email" as const, label: "Email", placeholder: "john@email.com" },
                  { key: "phone" as const, label: "Phone", placeholder: "+971 56 591 1000" },
                  { key: "initials" as const, label: "Initials", placeholder: "JD" },
                ].map(f => (
                  <div key={f.key}>
                    <Label className="text-xs text-zinc-400">{f.label}</Label>
                    <Input value={h.savedDetails[f.key]} onChange={(e) => h.setSavedDetails(prev => ({ ...prev, [f.key]: e.target.value }))} className="h-8 text-sm bg-zinc-800 border-zinc-700" placeholder={f.placeholder} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Center - Document Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900/50 border-zinc-800 h-full">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-white">Step 4: Sign & Export</CardTitle>
                {h.currentDoc && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={h.rotateDocument} className="text-xs"><RotateCw className="w-3 h-3 mr-1" /> Rotate</Button>
                    <Button size="sm" variant="outline" onClick={h.autoDetectFields} className="text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/20"><Crop className="w-3 h-3 mr-1" /> Detect Fields</Button>
                    <Button size="sm" variant="outline" onClick={h.autoFillFields} className="text-xs">Auto-Fill</Button>
                    <Button size="sm" onClick={h.downloadDocument} className="text-xs bg-emerald-600"><Download className="w-3 h-3 mr-1" /> Download</Button>
                    <Button size="sm" onClick={h.saveToPhone} variant="outline" className="text-xs"><Smartphone className="w-3 h-3 mr-1" /> Save</Button>
                    <Dialog open={h.showShareModal} onOpenChange={h.setShowShareModal}>
                      <DialogTrigger asChild><Button size="sm" variant="outline" className="text-xs"><Share2 className="w-3 h-3 mr-1" /> Share</Button></DialogTrigger>
                      <DialogContent className="bg-zinc-900 border-zinc-700">
                        <DialogHeader><DialogTitle className="text-white">Share Document</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <Button onClick={() => h.shareDocument('whatsapp')} className="bg-green-600 hover:bg-green-700"><Share2 className="w-4 h-4 mr-2" /> WhatsApp</Button>
                          <Button onClick={() => h.shareDocument('email')} variant="outline"><Mail className="w-4 h-4 mr-2" /> Email</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {h.currentDoc ? (
                  <div className="relative bg-zinc-800 rounded-lg overflow-hidden min-h-[600px]">
                    <img src={h.currentDoc.imageUrl} alt={h.currentDoc.name} className="w-full h-auto" style={{ transform: `rotate(${h.rotation}deg)` }} />
                    {h.signatureFields.map(field => (
                      <div key={field.id} className="absolute border-2 border-dashed border-emerald-500/50 rounded cursor-move group" style={{ left: field.x, top: field.y, width: field.width, height: field.height }}>
                        {field.type === 'signature' && h.savedSignature ? (
                          <img src={h.savedSignature} alt="Signature" className="w-full h-full object-contain" />
                        ) : field.type === 'checkbox' ? (
                          <div className="w-full h-full flex items-center justify-center"><Check className="w-4 h-4 text-emerald-400" /></div>
                        ) : (
                          <span className="text-xs text-emerald-400 p-1">{field.value || field.type}</span>
                        )}
                        <button onClick={() => h.setSignatureFields(prev => prev.filter(f => f.id !== field.id))} className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[600px] text-center">
                    <div className="w-24 h-24 rounded-2xl bg-emerald-500/10 border-2 border-dashed border-emerald-500/30 flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-emerald-400/50" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">No Document Selected</h3>
                    <p className="text-zinc-500 text-sm mb-4">Scan or upload a document to get started</p>
                    <div className="flex gap-3">
                      <Button onClick={() => h.cameraInputRef.current?.click()} className="bg-emerald-600"><Camera className="w-4 h-4 mr-2" />Scan</Button>
                      <Button onClick={() => h.fileInputRef.current?.click()} variant="outline"><Upload className="w-4 h-4 mr-2" />Upload</Button>
                    </div>
                  </div>
                )}

                {/* Add Field buttons */}
                {h.currentDoc && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(['signature', 'text', 'date', 'email', 'initial', 'checkbox'] as const).map(type => (
                      <Button key={type} size="sm" variant="outline" onClick={() => h.addField(type)} className="text-xs capitalize">
                        <Plus className="w-3 h-3 mr-1" /> {type}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScanSignDocuments;
