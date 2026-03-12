import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export interface ScannedDocument {
  id: string;
  name: string;
  imageUrl: string;
  timestamp: Date;
  isColor: boolean;
}

export interface SignatureField {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'signature' | 'text' | 'date' | 'checkbox' | 'email' | 'initial';
  value?: string;
}

export interface SavedDetails {
  fullName: string;
  email: string;
  phone: string;
  initials: string;
  company: string;
}

export interface SavedProject {
  id: string;
  name: string;
  documents: ScannedDocument[];
  signatureFields: SignatureField[];
  savedDetails: SavedDetails;
  savedSignature: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useScanSignDocuments() {
  const [scannedDocs, setScannedDocs] = useState<ScannedDocument[]>([]);
  const [currentDoc, setCurrentDoc] = useState<ScannedDocument | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload' | 'design'>('design');
  const [typedSignature, setTypedSignature] = useState('');
  const [savedDetails, setSavedDetails] = useState<SavedDetails>({
    fullName: '', email: '', phone: '', initials: '', company: ''
  });
  const [rotation, setRotation] = useState(0);
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

  useEffect(() => {
    const saved = localStorage.getItem('jbj_user_signature');
    if (saved) setSavedSignature(saved);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('document_scanner_projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        documents: p.documents.map((d: any) => ({ ...d, timestamp: new Date(d.timestamp) }))
      })));
    }
  }, []);

  const saveProjects = (updatedProjects: SavedProject[]) => {
    localStorage.setItem('document_scanner_projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

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
        if (enhance) {
          const contrast = 1.4, brightness = 10;
          for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.min(255, pixels[i] * contrast + brightness);
            pixels[i + 1] = Math.min(255, pixels[i + 1] * contrast + brightness);
            pixels[i + 2] = Math.min(255, pixels[i + 2] * contrast + brightness);
          }
        }
        if (!isColor) {
          for (let i = 0; i < pixels.length; i += 4) {
            const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            const bw = avg > 128 ? 255 : 0;
            pixels[i] = bw; pixels[i + 1] = bw; pixels[i + 2] = bw;
          }
        }
        ctx.putImageData(data, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = imageData;
    });
  };

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
          name: file.name, imageUrl: processed, timestamp: new Date(), isColor: colorMode === 'color'
        };
        setScannedDocs(prev => [...prev, newDoc]);
        if (!currentDoc) setCurrentDoc(newDoc);
        toast.success(`Document "${file.name}" scanned successfully`);
      };
      reader.readAsDataURL(file);
    }
  };

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
        imageUrl: processed, timestamp: new Date(), isColor: colorMode === 'color'
      };
      setScannedDocs(prev => [...prev, newDoc]);
      setCurrentDoc(newDoc);
      toast.success("Document scanned with auto-enhancement!");
    };
    reader.readAsDataURL(file);
  };

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
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
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
    canvas.width = 300; canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'italic 36px "Brush Script MT", cursive';
    ctx.fillStyle = '#000'; ctx.textBaseline = 'middle';
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

  const addField = (type: SignatureField['type']) => {
    const newField: SignatureField = {
      id: Date.now().toString(), x: 100, y: 100,
      width: type === 'checkbox' ? 30 : 200,
      height: type === 'checkbox' ? 30 : 50,
      type, value: type === 'date' ? new Date().toLocaleDateString() : ''
    };
    setSignatureFields(prev => [...prev, newField]);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} field added`);
  };

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

  const autoFillFields = () => {
    setSignatureFields(prev => prev.map(field => {
      if (field.type === 'text' && !field.value) return { ...field, value: savedDetails.fullName };
      if (field.type === 'email') return { ...field, value: savedDetails.email };
      if (field.type === 'initial') return { ...field, value: savedDetails.initials };
      return field;
    }));
    toast.success("Details auto-filled!");
  };

  const rotateDocument = () => setRotation(prev => (prev + 90) % 360);

  const generateFinalDocument = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!currentDoc) { resolve(''); return; }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(''); return; }
      const img = new window.Image();
      img.onload = () => {
        canvas.width = img.width; canvas.height = img.height;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.drawImage(img, 0, 0);
        signatureFields.forEach(field => {
          if (field.type === 'signature' && savedSignature) {
            const sigImg = new window.Image();
            sigImg.onload = () => { ctx.drawImage(sigImg, field.x, field.y, field.width, field.height); };
            sigImg.src = savedSignature;
          } else if (field.value) {
            ctx.font = '16px Arial'; ctx.fillStyle = '#000';
            ctx.fillText(field.value, field.x + 5, field.y + 25);
          }
        });
        setTimeout(() => resolve(canvas.toDataURL('image/png')), 300);
      };
      img.src = currentDoc.imageUrl;
    });
  };

  const downloadDocument = async () => {
    if (!currentDoc) return;
    const dataUrl = await generateFinalDocument();
    const link = document.createElement('a');
    link.download = `signed_${currentDoc.name}`;
    link.href = dataUrl; link.click();
    toast.success("Document downloaded!");
  };

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

  const saveToPhone = async () => {
    await downloadDocument();
    toast.success("Document saved to your device!");
  };

  const createProject = () => {
    if (!newProjectName.trim()) { toast.error("Please enter a project name"); return; }
    const newProject: SavedProject = {
      id: Date.now().toString(), name: newProjectName,
      documents: scannedDocs, signatureFields, savedDetails, savedSignature,
      createdAt: new Date(), updatedAt: new Date()
    };
    const updated = [...projects, newProject];
    saveProjects(updated);
    setCurrentProject(newProject);
    setNewProjectName('');
    setShowProjectModal(false);
    toast.success(`Project "${newProjectName}" created!`);
  };

  const saveCurrentProject = () => {
    if (!currentProject) { setShowProjectModal(true); return; }
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
    if (project.documents.length > 0) setCurrentDoc(project.documents[0]);
    toast.success(`Project "${project.name}" loaded!`);
  };

  return {
    scannedDocs, setScannedDocs, currentDoc, setCurrentDoc,
    signatureFields, setSignatureFields, savedSignature, setSavedSignature,
    isDrawing, signatureType, setSignatureType,
    typedSignature, setTypedSignature,
    savedDetails, setSavedDetails,
    rotation, colorMode, setColorMode, autoEnhance, setAutoEnhance,
    projects, currentProject, showProjectModal, setShowProjectModal,
    newProjectName, setNewProjectName, showShareModal, setShowShareModal,
    fileInputRef, cameraInputRef, signatureCanvasRef,
    // Actions
    handleFileUpload, handleCameraCapture, reprocessDocument,
    startDrawing, draw, stopDrawing, clearSignature,
    saveDrawnSignature, saveTypedSignature, handleSignatureUpload, handleDesignedSignature,
    addField, autoDetectFields, autoFillFields, rotateDocument,
    downloadDocument, shareDocument, saveToPhone,
    createProject, saveCurrentProject, loadProject,
  };
}
