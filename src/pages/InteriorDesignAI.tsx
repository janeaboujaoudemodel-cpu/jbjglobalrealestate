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
  { id: 'neutral', name: 'Neutral & Warm', colors: ['#F5F5DC', '#D2B48C', '#8B7355'] },
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

  return (
    <section className="relative w-full min-h-screen" style={{ background: "#0D0C08" }}>
      {/* Hero — suppressed when embedded inside a Suite tab */}
      {!embedded && (
        <div className="relative py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/15 via-[#0D0C08] to-amber-900/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(184,148,62,0.12),transparent_50%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-gold/15 text-gold border-gold/30 px-4 py-2">
                <Palette className="w-4 h-4 mr-2" />
                AI-Powered Design
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                AI Interior{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-400">
                  Design Studio
                </span>
              </h1>
              <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
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
            className="bg-zinc-900/60 border-gold/30 text-white placeholder:text-zinc-500 max-w-xs focus:border-gold/50"
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
                      ? 'bg-gold/15 border-gold/50 text-gold'
                      : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
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
            <div className="bg-zinc-900/60 border border-gold/30 rounded-2xl overflow-hidden">
              {generatedImage ? (
                <div className="relative">
                  <Design3DViewer imageUrl={generatedImage} projectName={projectName} />
                  {/* Action buttons */}
                  <div className="p-4 border-t border-zinc-800 flex gap-3">
                    <Button
                      onClick={() => generateDesign()}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-gold/40 text-gold hover:bg-gold/15"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={() => { setGeneratedImage(null); setGeneratedNotes(''); }}
                      variant="outline"
                      className="border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                    >
                      New Design
                    </Button>
                  </div>
                </div>
              ) : uploadedPhoto ? (
                <div className="relative">
                  <img src={uploadedPhoto} alt="Uploaded" className="w-full h-auto max-h-[500px] object-contain" />
                  <button
                    onClick={() => { setUploadedPhoto(null); setUploadedFile(null); }}
                    className="absolute top-3 right-3 p-2 bg-red-500/80 rounded-full text-white hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="p-4 border-t border-zinc-800">
                    <Button
                      onClick={() => generateDesign()}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-gold to-amber-600 hover:from-amber-600 hover:to-gold text-black font-semibold"
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
                    className="border-2 border-dashed border-gold/30 rounded-xl p-8 md:p-16 text-center cursor-pointer hover:border-gold/60 hover:bg-gold/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/15 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Upload a Photo
                    </h3>
                    <p className="text-zinc-400 text-sm mb-4">
                      Drag & drop or click to upload a room photo
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/20"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Browse Files
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                        className="border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/20"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                  {/* Or generate from description */}
                  <div className="mt-6 text-center">
                    <p className="text-zinc-500 text-xs mb-3">— or generate from description only —</p>
                    <Button
                      onClick={() => generateDesign()}
                      disabled={isProcessing || !designStyle}
                      className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white"
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
              <div className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
                <p className="text-white font-medium mb-3">Creating Your Design...</p>
                <Progress value={progress} className="h-2 max-w-xs mx-auto" />
                <p className="text-xs text-zinc-500 mt-2">{progress}%</p>
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
              <div className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-fuchsia-400" />
                    <span className="text-sm font-semibold text-white">Design Style</span>
                    {designStyle && (
                      <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 text-xs">
                        {designStyles.find(s => s.id === designStyle)?.label}
                      </Badge>
                    )}
                  </div>
                  {styleOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {designStyles.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setDesignStyle(style.id)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                          designStyle === style.id
                            ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-white'
                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
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
              <div className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500" />
                    <span className="text-sm font-semibold text-white">Color Palette</span>
                    {colorPalette && (
                      <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 text-xs">
                        {colorPalettes.find(p => p.id === colorPalette)?.name}
                      </Badge>
                    )}
                  </div>
                  {paletteOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {colorPalettes.map(palette => (
                      <button
                        key={palette.id}
                        onClick={() => setColorPalette(palette.id)}
                        className={`p-3 rounded-lg border transition-all ${
                          colorPalette === palette.id
                            ? 'bg-fuchsia-500/20 border-fuchsia-500/50'
                            : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex gap-1 mb-1.5 justify-center">
                          {palette.colors.map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded-full border border-zinc-600" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className="text-[10px] text-zinc-300">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Inline AI Chat */}
            <div className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
              {/* Chat Header */}
              <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Design Assistant</h3>
                  <p className="text-[10px] text-zinc-500">Describe edits or new ideas</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '350px' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-fuchsia-500/20' : 'bg-gradient-to-br from-fuchsia-500 to-purple-500'
                    }`}>
                      {msg.role === 'user' ? <User className="w-3 h-3 text-fuchsia-300" /> : <Bot className="w-3 h-3 text-white" />}
                    </div>
                    <div className={`max-w-[85%] rounded-xl p-3 ${
                      msg.role === 'user' ? 'bg-fuchsia-500/20 text-white' : 'bg-zinc-800/80 text-zinc-200'
                    }`}>
                      {msg.image && (
                        <img src={msg.image} alt="Design" className="rounded-lg mb-2 max-h-[200px] w-auto" />
                      )}
                      <div className="text-xs whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-zinc-800">
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe changes: 'make the sofa white' or 'add gold accents'..."
                    className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 min-h-[40px] max-h-[80px] resize-none flex-1 text-xs focus:border-fuchsia-500/50"
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={handleChatSend}
                    disabled={isProcessing || !chatInput.trim()}
                    size="icon"
                    className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white h-10 w-10"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl p-4">
              <label className="text-xs font-medium text-zinc-400 mb-2 block">Additional Notes (Optional)</label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Floor-to-ceiling windows, marble floors, specific furniture..."
                className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 min-h-[60px] text-xs focus:border-fuchsia-500/50"
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
};

export default InteriorDesignAI;
