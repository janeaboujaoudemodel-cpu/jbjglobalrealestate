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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <section className="relative w-full min-h-screen" style={{ background: "#FDFBF7" }}>
      {/* Hero — suppressed when embedded inside a Suite tab */}
      {!embedded && (
        <div className="relative py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-[#FDFBF7]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(184,149,85,0.22),transparent_55%),radial-gradient(circle_at_75%_60%,rgba(184,149,85,0.18),transparent_55%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-[#EFE6D6] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 px-4 py-2">
                <Palette className="w-4 h-4 mr-2" />
                AI-Powered Design
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">
                AI Interior{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B89555] via-[#B89555] to-[#B89555]">
                  Design Studio
                </span>
              </h1>
              <p className="text-[#1A1A1A]/80 text-sm md:text-base max-w-xl mx-auto">
                Upload a photo or describe your space. Our AI generates stunning designs instantly.
              </p>
            </motion.div>
          </div>
        </div>
      )}


      {/* Main Content: Two Panel Layout */}
      <div className="container mx-auto px-4 pb-20">
        {/* Project Name + Mode Chips */}
        <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name (optional)"
            className="bg-[#FDFBF7]/60 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 max-w-xs focus:border-[#B89555]/50"
          />
          <div className="flex gap-2">
            {modeConfig.map(m => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    active
                      ? 'bg-[#EFE6D6]/15 border-[#B89555]/50 text-[#1A1A1A]'
                      : 'bg-[#FDFBF7]/60 border-[#1A1A1A] text-[#1A1A1A]/70 hover:border-[#1A1A1A] hover:text-[#1A1A1A]/85'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT PANEL: Upload + Preview (60%) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upload / Generated Image Area */}
            <div className="bg-[#FDFBF7]/60 border border-[#B89555]/30 rounded-2xl overflow-hidden">
              {generatedImage ? (
                <div className="relative">
                  <Design3DViewer imageUrl={generatedImage} projectName={projectName} />
                  {/* Action buttons */}
                  <div className="p-4 border-t border-[#1A1A1A] flex gap-3">
                    <Button
                      onClick={() => generateDesign()}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/15"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={() => { setGeneratedImage(null); setGeneratedNotes(''); }}
                      variant="outline"
                      className="border-[#1A1A1A] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]"
                    >
                      New Design
                    </Button>
                  </div>
                </div>
              ) : uploadedPhoto ? (
                <div className="relative">
                  <img src={uploadedPhoto} alt="Uploaded" className="w-full h-auto max-h-[500px] object-contain"  loading="lazy" decoding="async" />
                  <button
                    onClick={() => { setUploadedPhoto(null); setUploadedFile(null); }}
                    className="absolute top-3 right-3 p-2 bg-red-500/80 rounded-full text-[#1A1A1A] hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="p-4 border-t border-[#1A1A1A]">
                    <Button
                      onClick={() => generateDesign()}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-[#B89555] to-[#B89555] hover:from-[#B89555] hover:to-[#B89555] text-[#1A1A1A] font-semibold"
                    >
                      {isProcessing ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Generate Design</>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 md:p-12">
                  <div
                    className="border-2 border-dashed border-[#B89555]/30 rounded-xl p-8 md:p-16 text-center cursor-pointer hover:border-[#B89555]/60 hover:bg-[#EFE6D6]/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EFE6D6]/15 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-[#1A1A1A]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                      Upload a Photo
                    </h3>
                    <p className="text-[#1A1A1A]/70 text-sm mb-4">
                      Drag & drop or click to upload a room photo
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/15"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Browse Files
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                        className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/15"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                  {/* Or generate from description */}
                  <div className="mt-6 text-center">
                    <p className="text-[#1A1A1A]/90 text-xs mb-3">— or generate from description only —</p>
                    <Button
                      onClick={() => generateDesign()}
                      disabled={isProcessing || !designStyle}
                      className="bg-gradient-to-r from-[#B89555] to-[#B89555] hover:from-[#B89555] hover:to-[#B89555] text-[#1A1A1A] font-semibold"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Concept
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div className="bg-[#FDFBF7]/60 border border-[#B89555]/30 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#B89555] to-[#B89555] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#1A1A1A] animate-pulse" />
                </div>
                <p className="text-[#1A1A1A] font-medium mb-3">Creating Your Design...</p>
                <Progress value={progress} className="h-2 max-w-xs mx-auto" />
                <p className="text-xs text-[#1A1A1A]/90 mt-2">{progress}%</p>
              </div>
            )}

            {/* History */}
            {user && (
              <DesignHistoryList
                history={history}
                isLoading={historyLoading}
                onDelete={deleteDesign}
                onSelect={handleSelectHistoryItem}
              />
            )}
          </div>

          {/* RIGHT PANEL: Chat + Options (40%) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Style Presets (Collapsible) */}
            <Collapsible open={styleOpen} onOpenChange={setStyleOpen}>
              <div className="bg-[#FDFBF7]/60 border border-[#B89555]/30 rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1A1A1A]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-[#1A1A1A]" />
                    <span className="text-sm font-semibold text-[#1A1A1A]">Design Style</span>
                    {designStyle && (
                      <Badge className="bg-[#EFE6D6]/15 text-[#1A1A1A] border-[#B89555]/30 text-xs">
                        {designStyles.find(s => s.id === designStyle)?.label}
                      </Badge>
                    )}
                  </div>
                  {styleOpen ? <ChevronUp className="w-4 h-4 text-[#1A1A1A]/90" /> : <ChevronDown className="w-4 h-4 text-[#1A1A1A]/90" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {designStyles.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setDesignStyle(style.id)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                          designStyle === style.id
                            ? 'bg-[#EFE6D6]/15 border-[#B89555]/50 text-[#1A1A1A]'
                            : 'bg-[#F7F2EA]/50 border-[#1A1A1A] text-[#1A1A1A]/70 hover:border-[#1A1A1A]'
                        }`}
                      >
                        <span className="mr-1.5">{style.emoji}</span>
                        {style.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Color Palette (Collapsible) */}
            <Collapsible open={paletteOpen} onOpenChange={setPaletteOpen}>
              <div className="bg-[#FDFBF7]/60 border border-[#B89555]/30 rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1A1A1A]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#B89555] via-[#B89555] to-[#B89555]" />
                    <span className="text-sm font-semibold text-[#1A1A1A]">Color Palette</span>
                    {colorPalette && (
                      <Badge className="bg-[#EFE6D6]/15 text-[#1A1A1A] border-[#B89555]/30 text-xs">
                        {colorPalettes.find(p => p.id === colorPalette)?.name}
                      </Badge>
                    )}
                  </div>
                  {paletteOpen ? <ChevronUp className="w-4 h-4 text-[#1A1A1A]/90" /> : <ChevronDown className="w-4 h-4 text-[#1A1A1A]/90" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {colorPalettes.map(palette => (
                      <button
                        key={palette.id}
                        onClick={() => setColorPalette(palette.id)}
                        className={`p-3 rounded-lg border transition-all ${
                          colorPalette === palette.id
                            ? 'bg-[#EFE6D6]/15 border-[#B89555]/50'
                            : 'bg-[#F7F2EA]/50 border-[#1A1A1A] hover:border-[#1A1A1A]'
                        }`}
                      >
                        <div className="flex gap-1 mb-1.5 justify-center">
                          {palette.colors.map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded-full border border-[#1A1A1A]" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className="text-[10px] text-[#1A1A1A]/85">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Inline AI Chat */}
            <div className="bg-[#FDFBF7]/60 border border-[#B89555]/30 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
              {/* Chat Header */}
              <div className="p-3 border-b border-[#1A1A1A] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B89555] to-[#B89555] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] text-sm">Design Assistant</h3>
                  <p className="text-[10px] text-[#1A1A1A]/90">Describe edits or new ideas</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '350px' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-[#EFE6D6]/15' : 'bg-gradient-to-br from-[#B89555] to-[#B89555]'
                    }`}>
                      {msg.role === 'user' ? <User className="w-3 h-3 text-[#1A1A1A]" /> : <Bot className="w-3 h-3 text-[#1A1A1A]" />}
                    </div>
                    <div className={`max-w-[85%] rounded-xl p-3 ${
                      msg.role === 'user' ? 'bg-[#EFE6D6]/15 text-[#1A1A1A]' : 'bg-[#F7F2EA]/80 text-gray-200'
                    }`}>
                      {msg.image && (
                        <img src={msg.image} alt="Design" className="rounded-lg mb-2 max-h-[200px] w-auto"  loading="lazy" decoding="async" />
                      )}
                      <div className="text-xs whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-[#1A1A1A]">
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe changes: 'make the sofa white' or 'add gold accents'..."
                    className="bg-[#F7F2EA]/50 border-[#1A1A1A] text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 min-h-[40px] max-h-[80px] resize-none flex-1 text-xs focus:border-[#B89555]/50"
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={handleChatSend}
                    disabled={isProcessing || !chatInput.trim()}
                    size="icon"
                    className="bg-gradient-to-r from-[#B89555] to-[#B89555] hover:from-[#B89555] hover:to-[#B89555] text-[#1A1A1A] h-10 w-10"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-[#1A1A1A]/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-[#FDFBF7]/60 border border-[#B89555]/30 rounded-2xl p-4">
              <label className="text-xs font-medium text-[#1A1A1A]/70 mb-2 block">Additional Notes (Optional)</label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Floor-to-ceiling windows, marble floors, specific furniture..."
                className="bg-[#F7F2EA]/50 border-[#1A1A1A] text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 min-h-[60px] text-xs focus:border-[#B89555]/50"
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
    <ToolAnimatedFrame theme={toolThemes.violet}>{body}</ToolAnimatedFrame>
  );
};

export default InteriorDesignAI;
