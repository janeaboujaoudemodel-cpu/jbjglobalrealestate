import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Palette, Sparkles, Camera, Upload, X, Send, Bot, User,
  RefreshCw, ChevronDown, ChevronUp, Sofa, Wand2, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useContactGating } from "@/hooks/useContactGating";
import ContactGatingModal from "@/components/ContactGatingModal";
import InquiryFormModal from "@/components/InquiryFormModal";
import Design3DViewer from "@/components/interior-design/Design3DViewer";
import DesignHistoryList from "@/components/interior-design/DesignHistoryList";
import { useInteriorDesignHistory, DesignInput, DesignResult, DesignHistoryItem } from "@/hooks/useInteriorDesignHistory";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ToolAnimatedFrame } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";

// Data arrays
const designStyles = [
  { id: 'modern', label: 'Modern', emoji: '' },
  { id: 'classic', label: 'Classic', emoji: '' },
  { id: 'minimalist', label: 'Minimalist', emoji: '' },
  { id: 'luxury', label: 'Luxury', emoji: '' },
  { id: 'industrial', label: 'Industrial', emoji: '' },
  { id: 'bohemian', label: 'Bohemian', emoji: '' },
  { id: 'scandinavian', label: 'Scandinavian', emoji: '' },
  { id: 'art_deco', label: 'Art Deco', emoji: '' },
  { id: 'corporate', label: 'Corporate', emoji: '' },
  { id: 'premium', label: 'Premium', emoji: '' },
];

const colorPalettes = [
  { id: 'neutral', name: 'Neutral & Warm', colors: ['#F5F5DC', '#D2B48C', '#8A7356'] },
  { id: 'cool', name: 'Cool & Serene', colors: ['#E0E5EC', '#B0C4DE', '#708090'] },
  { id: 'bold', name: 'Bold & Vibrant', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'] },
  { id: 'earthy', name: 'Earthy & Natural', colors: ['#8B7765', '#6B8E23', '#DEB887'] },
  { id: 'monochrome', name: 'Monochrome', colors: ['#2C2C2C', '#808080', '#F0F0F0'] },
  { id: 'luxury', name: 'Luxury Gold', colors: ['#A8925A', '#1C1C1C', '#F5F5F5'] },
];

type DesignMode = 'concept' | 'redesign' | 'staging';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

interface InteriorDesignAIProps { embedded?: boolean; }

const InteriorDesignAI = ({ embedded = false }: InteriorDesignAIProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    showGatingModal, triggerSource, requireGating,
    handleGatingComplete, closeGatingModal, isGatingCompleted
  } = useContactGating();
  const { history, isLoading: historyLoading, isSaving, saveDesign, deleteDesign } = useInteriorDesignHistory();

  // Core state
  const [projectName, setProjectName] = useState('');
  const [mode, setMode] = useState<DesignMode>('concept');
  const [designStyle, setDesignStyle] = useState('');
  const [colorPalette, setColorPalette] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  // Collapsible state
  const [styleOpen, setStyleOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1', role: 'assistant',
      content: `Hello! I'm your AI Interior Design Assistant.\n\nUpload a photo or describe your dream space, then click Generate. You can also refine results by chatting with me.`,
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length <= 1) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Import measurement data
  useEffect(() => {
    const measurementData = sessionStorage.getItem("propertyMeasurement");
    if (measurementData) {
      try {
        const data = JSON.parse(measurementData);
        setProjectName(data.propertyName || '');
        sessionStorage.removeItem("propertyMeasurement");
        toast.success("Property measurements imported!");
      } catch (e) { console.error(e); }
    }
    sessionStorage.removeItem("return_to_interior_design");
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    const dataUrl = await fileToDataUrl(file);
    setUploadedPhoto(dataUrl);
    setUploadedFile(file);
    toast.success('Photo uploaded! Choose style and generate.');
  };

  const generateDesign = async (chatPrompt?: string) => {
    if (!isGatingCompleted()) {
      requireGating('interior_design', () => generateDesign(chatPrompt));
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    const startTime = Date.now();

    try {
      let photosData: string[] = [];
      if (uploadedPhoto) photosData = [uploadedPhoto];
      setProgress(20);

      const styleLabel = designStyles.find(s => s.id === designStyle)?.label || designStyle || 'modern';
      const colorLabel = colorPalettes.find(p => p.id === colorPalette)?.name || colorPalette || 'neutral';

      let prompt = chatPrompt || '';
      if (!chatPrompt) {
        switch (mode) {
          case 'concept':
            prompt = `Create a ${styleLabel} interior design concept. Color palette: ${colorLabel}. ${customNotes || ''}`;
            break;
          case 'redesign':
            prompt = `Redesign this room in ${styleLabel} style with ${colorLabel} colors. ${customNotes || ''}`;
            break;
          case 'staging':
            prompt = `Stage this empty room with ${styleLabel} furniture. Add realistic decor and styling. ${customNotes || ''}`;
            break;
        }
      }

      const { data, error } = await supabase.functions.invoke("interior-design-generate", {
        body: {
          mode,
          propertyName: projectName,
          designStyle,
          colorPalette,
          customNotes: prompt,
          photos: photosData,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Design generation failed");

      setProgress(90);

      const result: DesignResult = {
        images: data.result.images || [],
        notes: data.result.notes || '',
        createdAt: data.result.createdAt || new Date().toISOString(),
      };

      if (result.images[0]) {
        setGeneratedImage(result.images[0]);
        setGeneratedNotes(result.notes);

        // Add assistant message with result
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.notes || 'Your design is ready. You can ask me to modify it.',
          image: result.images[0],
          timestamp: new Date(),
        }]);
      }

      // Save to history
      if (user?.id) {
        const input: DesignInput = {
          mode, projectName, roomName: '', propertyType: '',
          designStyle, colorPalette, purpose: '', customNotes: prompt,
        };
        await saveDesign(input, result, Date.now() - startTime);
      }

      setProgress(100);
      toast.success("Your AI design is ready!");
    } catch (error) {
      console.error("Design generation error:", error);
      toast.error(error instanceof Error ? error.message : "Error generating design.");
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant',
        content: '❌ Generation failed. Please try again or adjust your prompt.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user',
      content: chatInput, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    const processingMsg: ChatMessage = {
      id: (Date.now() + 1).toString(), role: 'assistant',
      content: 'Generating your updated design...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, processingMsg]);

    generateDesign(chatInput);
    setChatInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
  };

  const handleSelectHistoryItem = (item: DesignHistoryItem) => {
    if (item.imageUrl) {
      setGeneratedImage(item.imageUrl);
      setGeneratedNotes(item.notes);
      setProjectName(item.projectName);
    }
  };

  const modeConfig = [
    { id: 'concept' as DesignMode, label: 'Concept', icon: Sparkles, desc: 'Create from scratch' },
    { id: 'redesign' as DesignMode, label: 'Redesign', icon: Camera, desc: 'Transform a photo' },
    { id: 'staging' as DesignMode, label: 'Staging', icon: Sofa, desc: 'Furnish empty rooms' },
  ];

  const body = (
    <section
      data-interior-design-ai
      data-allow-dark-cta
      data-no-contrast-guard
      data-surface="dark"
      className="allow-white relative w-full min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(180deg, #021610 0%, #010A07 60%, #000000 100%)", color: "#FFFFFF" }}
    >
      <style>{`
        [data-interior-design-ai],
        [data-interior-design-ai] :is(h1,h2,h3,h4,p,span,label,small,strong,button,textarea,input,div):not([class*="bg-clip-text"]) {
          color: #FFFFFF;
          -webkit-text-fill-color: #FFFFFF;
        }
        [data-interior-design-ai] .id-text-muted {
          color: rgba(255,255,255,0.82) !important;
          -webkit-text-fill-color: rgba(255,255,255,0.82) !important;
        }
        /* Cards: FULL emerald with white content */
        [data-interior-design-ai] .id-panel {
          background: linear-gradient(140deg, #0A6B53 0%, #065F46 55%, #054E3A 100%) !important;
          border: 1px solid rgba(255,255,255,0.28) !important;
          box-shadow: 0 22px 60px -30px rgba(0,0,0,0.55), inset 0 0 30px rgba(255,255,255,0.04) !important;
        }
        [data-interior-design-ai] .id-panel-soft {
          background: linear-gradient(140deg, rgba(10,107,83,0.72) 0%, rgba(6,95,70,0.72) 55%, rgba(5,78,58,0.72) 100%) !important;
          border: 1px solid rgba(255,255,255,0.30) !important;
        }
        [data-interior-design-ai] .id-input,
        [data-interior-design-ai] .id-input:focus,
        [data-interior-design-ai] .id-input:focus-visible {
          background: rgba(0,0,0,0.28) !important;
          border: 1px solid rgba(255,255,255,0.38) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          caret-color: #FFFFFF !important;
          box-shadow: none !important;
        }
        [data-interior-design-ai] .id-input::placeholder {
          color: rgba(255,255,255,0.65) !important;
          -webkit-text-fill-color: rgba(255,255,255,0.65) !important;
          opacity: 1 !important;
        }
        [data-interior-design-ai] .id-primary {
          background-image: linear-gradient(135deg, #0A6B53 0%, #043024 58%, #000000 100%) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          border: 1px solid rgba(255,255,255,0.42) !important;
        }
        /* Do NOT cascade background-image into children — that was painting the icon as a white/emerald block */
        [data-interior-design-ai] .id-primary > * {
          background-image: none !important;
          background: transparent !important;
        }
        [data-interior-design-ai] .id-primary:disabled,
        [data-interior-design-ai] .id-primary[disabled] {
          opacity: 0.72 !important;
        }
        [data-interior-design-ai] .id-outline {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.42) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        [data-interior-design-ai] .id-choice,
        [data-interior-design-ai] .id-choice * {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        [data-interior-design-ai] .id-choice {
          min-width: 0 !important;
          overflow-wrap: anywhere !important;
          border-color: rgba(255,255,255,0.38) !important;
        }
        [data-interior-design-ai] .id-outline:hover,
        [data-interior-design-ai] .id-choice:hover {
          background: rgba(255,255,255,0.10) !important;
          border-color: rgba(255,255,255,0.62) !important;
        }
        [data-interior-design-ai] .id-choice-active {
          background: linear-gradient(135deg, #10B981 0%, #059669 55%, #064E3B 100%) !important;
          border-color: rgba(255,255,255,0.72) !important;
          box-shadow: 0 0 22px rgba(16,185,129,0.42) !important;
        }
        /* Icons: line-art white, never filled block */
        [data-interior-design-ai] svg {
          background: transparent !important;
          background-image: none !important;
          fill: none !important;
          color: #FFFFFF !important;
        }
        [data-interior-design-ai] svg * {
          background: transparent !important;
          background-image: none !important;
          fill: none !important;
          stroke: #FFFFFF !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        /* Responsive safety — content must never overflow cards */
        [data-interior-design-ai] .id-panel, [data-interior-design-ai] .id-panel-soft { min-width: 0 !important; }
        [data-interior-design-ai] .id-panel * { min-width: 0; }
      `}</style>


      {!embedded && (
        <div className="relative py-16 md:py-24 overflow-hidden" data-hero-dark>
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #010604 0%, #020F0A 60%, #011008 100%)" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.06),transparent_42%),radial-gradient(circle_at_78%_68%,rgba(16,185,129,0.10),transparent_48%)]" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="id-primary mb-5 px-4 py-2 rounded-full border text-[11px] uppercase tracking-[0.2em] font-semibold">
                <Palette className="w-4 h-4 mr-2" />
                Free AI Tool
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                AI Interior Design Studio
              </h1>
              <p className="id-text-muted text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
                Upload a room photo or describe your space. Generate premium concepts, redesigns, staging ideas, and refinements inside one JBJ emerald workspace.
              </p>
            </motion.div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 md:py-12 pb-20">
        <div className="max-w-6xl mx-auto mb-6 grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-4 items-stretch">
          <div className="id-panel rounded-2xl p-4">
            <label className="block text-[11px] uppercase tracking-[0.22em] font-semibold mb-2">Project name</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Optional project name"
              className="id-input h-12 rounded-xl"
            />
          </div>
          <div className="id-panel rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-3">Design mode</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {modeConfig.map(m => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`id-choice ${active ? "id-choice-active" : "id-panel-soft"} min-h-[72px] rounded-xl p-3 text-left transition-all border`}
                    aria-pressed={active}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{m.label}</span>
                    </div>
                    <span className="id-text-muted text-xs">{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-3 space-y-4 min-w-0">
            <div className="id-panel rounded-2xl overflow-hidden">
              {generatedImage ? (
                <div className="relative">
                  <Design3DViewer imageUrl={generatedImage} projectName={projectName} />
                  <div className="p-4 border-t flex flex-col sm:flex-row gap-3" style={{ borderColor: "rgba(184,149,85,0.42)" }}>
                    <Button onClick={() => generateDesign()} disabled={isProcessing} className="id-primary flex-1">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button onClick={() => { setGeneratedImage(null); setGeneratedNotes(''); }} className="id-outline flex-1">
                      New Design
                    </Button>
                  </div>
                </div>
              ) : uploadedPhoto ? (
                <div className="relative">
                  <div className="bg-black/40">
                    <img src={uploadedPhoto} alt="Uploaded room reference" className="w-full h-auto max-h-[520px] object-contain" loading="lazy" decoding="async" />
                  </div>
                  <button
                    type="button"
                    aria-label="Remove uploaded photo"
                    onClick={() => { setUploadedPhoto(null); setUploadedFile(null); }}
                    className="id-primary absolute top-3 right-3 h-10 w-10 rounded-full inline-flex items-center justify-center border"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="p-4 border-t" style={{ borderColor: "rgba(184,149,85,0.42)" }}>
                    <Button onClick={() => generateDesign()} disabled={isProcessing} className="id-primary w-full min-h-12">
                      {isProcessing ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Generate Design</>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-5 md:p-8">
                  <div
                    role="button"
                    tabIndex={0}
                    className="id-panel-soft rounded-2xl p-8 md:p-14 text-center cursor-pointer transition-all"
                    style={{ borderStyle: "dashed" }}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                  >
                    <div className="id-primary w-16 h-16 mx-auto mb-4 rounded-2xl border flex items-center justify-center">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Upload a room photo</h3>
                    <p className="id-text-muted text-sm mb-5 max-w-md mx-auto">Drag and drop or choose a room image to redesign, stage, or use as visual reference.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="id-outline">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Browse Files
                      </Button>
                      <Button type="button" onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className="id-outline">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="id-text-muted text-xs mb-3">Generate from description only</p>
                    <Button onClick={() => generateDesign()} disabled={isProcessing || !designStyle} className="id-primary min-h-12 px-8">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Concept
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="id-panel rounded-2xl p-6 text-center">
                <div className="id-primary w-12 h-12 mx-auto mb-4 rounded-2xl border flex items-center justify-center">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <p className="font-semibold mb-3">Creating your design</p>
                <Progress value={progress} className="h-2 max-w-xs mx-auto" />
                <p className="id-text-muted text-xs mt-2">{progress}%</p>
              </div>
            )}

            {user && (
              <div className="id-panel rounded-2xl p-4">
                <DesignHistoryList history={history} isLoading={historyLoading} onDelete={deleteDesign} onSelect={handleSelectHistoryItem} />
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4 min-w-0">
            <Collapsible open={styleOpen} onOpenChange={setStyleOpen}>
              <div className="id-panel rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wand2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold">Design Style</span>
                    {designStyle && (
                      <Badge className="id-outline rounded-full text-xs truncate max-w-[140px]">
                        {designStyles.find(s => s.id === designStyle)?.label}
                      </Badge>
                    )}
                  </div>
                  {styleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {designStyles.map(style => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setDesignStyle(style.id)}
                        className={`id-choice ${designStyle === style.id ? "id-choice-active" : "id-panel-soft"} min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <Collapsible open={paletteOpen} onOpenChange={setPaletteOpen}>
              <div className="id-panel rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: "linear-gradient(135deg,#B89555,#EFE6D6)" }} />
                    <span className="text-sm font-semibold">Color Palette</span>
                    {colorPalette && (
                      <Badge className="id-outline rounded-full text-xs truncate max-w-[150px]">
                        {colorPalettes.find(p => p.id === colorPalette)?.name}
                      </Badge>
                    )}
                  </div>
                  {paletteOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {colorPalettes.map(palette => (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => setColorPalette(palette.id)}
                        className={`id-choice ${colorPalette === palette.id ? "id-choice-active" : "id-panel-soft"} min-h-[78px] rounded-xl border p-3 transition-all`}
                      >
                        <div className="flex gap-1 mb-2 justify-center">
                          {palette.colors.map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded-full border" style={{ backgroundColor: c, borderColor: "rgba(255,255,255,0.72)" }} />
                          ))}
                        </div>
                        <span className="block text-[10px] font-semibold leading-tight">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <div className="id-panel rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: '420px' }}>
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(184,149,85,0.42)" }}>
                <div className="id-primary w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">Design Assistant</h3>
                  <p className="id-text-muted text-[11px]">Describe edits or new ideas</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '350px' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`${msg.role === 'user' ? 'id-choice-active' : 'id-primary'} w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0`}>
                      {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </div>
                    <div className={`${msg.role === 'user' ? 'id-choice-active' : 'id-panel-soft'} max-w-[85%] rounded-xl border p-3`}>
                      {msg.image && <img src={msg.image} alt="Generated interior design" className="rounded-lg mb-2 max-h-[200px] w-auto" loading="lazy" decoding="async" />}
                      <div className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t" style={{ borderColor: "rgba(184,149,85,0.42)" }}>
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe changes: make it brighter, add marble, change sofa..."
                    className="id-input min-h-[44px] max-h-[90px] resize-none flex-1 text-xs rounded-xl"
                    disabled={isProcessing}
                  />
                  <Button onClick={handleChatSend} disabled={isProcessing || !chatInput.trim()} size="icon" className="id-primary h-11 w-11 rounded-xl">
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="id-panel rounded-2xl p-4">
              <label className="text-xs font-semibold mb-2 block">Additional Notes (Optional)</label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Floor-to-ceiling windows, marble floors, specific furniture..."
                className="id-input min-h-[72px] text-xs rounded-xl"
                maxLength={500}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handlePhotoUpload} accept="image/*" capture="environment" className="hidden" />

      {/* Modals */}
      <ContactGatingModal isOpen={showGatingModal} onClose={closeGatingModal} onComplete={handleGatingComplete} triggerSource={triggerSource} />
      <InquiryFormModal isOpen={isInquiryOpen} onClose={() => setIsInquiryOpen(false)} propertyName={projectName || "Interior Design Revision"} source="interior_design" />
    </section>
  );

  return embedded ? body : (
    <ToolAnimatedFrame theme={toolThemes.emerald}>{body}</ToolAnimatedFrame>
  );
};

export default InteriorDesignAI;
