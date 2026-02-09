import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Palette, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useContactGating } from "@/hooks/useContactGating";
import ContactGatingModal from "@/components/ContactGatingModal";
import InquiryFormModal from "@/components/InquiryFormModal";

// New components
import DesignModeSelector, { DesignMode } from "@/components/interior-design/DesignModeSelector";
import DesignProjectHeader from "@/components/interior-design/DesignProjectHeader";
import ConceptRenderForm from "@/components/interior-design/ConceptRenderForm";
import PhotoRedesignForm from "@/components/interior-design/PhotoRedesignForm";
import VirtualStagingForm from "@/components/interior-design/VirtualStagingForm";
import DesignChatAssistant from "@/components/interior-design/DesignChatAssistant";
import DesignResultsGallery from "@/components/interior-design/DesignResultsGallery";
import DesignHistoryList from "@/components/interior-design/DesignHistoryList";
import { useInteriorDesignHistory, DesignInput, DesignResult, DesignHistoryItem } from "@/hooks/useInteriorDesignHistory";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

type Step = 'mode' | 'project' | 'form' | 'processing' | 'results';

const InteriorDesignAI = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    showGatingModal, 
    triggerSource, 
    requireGating, 
    handleGatingComplete, 
    closeGatingModal,
    isGatingCompleted 
  } = useContactGating();
  
  const { history, isLoading: historyLoading, isSaving, saveDesign, deleteDesign, fetchHistory } = useInteriorDesignHistory();

  // UI State
  const [step, setStep] = useState<Step>('mode');
  const [selectedMode, setSelectedMode] = useState<DesignMode | null>(null);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  // Project data
  const [projectName, setProjectName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [propertySize, setPropertySize] = useState('');
  const [hasMeasurementData, setHasMeasurementData] = useState(false);

  // Form data
  const [designStyle, setDesignStyle] = useState('');
  const [colorPalette, setColorPalette] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [roomType, setRoomType] = useState('');
  const [furnitureStyle, setFurnitureStyle] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Result state
  const [designResult, setDesignResult] = useState<DesignResult | null>(null);
  const [chatGeneratedImage, setChatGeneratedImage] = useState<string | undefined>();
  const [chatGeneratedNotes, setChatGeneratedNotes] = useState<string | undefined>();

  // Check for measurement data from the measurement tool
  useEffect(() => {
    const measurementData = sessionStorage.getItem("propertyMeasurement");
    if (measurementData) {
      try {
        const data = JSON.parse(measurementData);
        setPropertySize(data.totalArea?.toString() || '');
        setPropertyType(data.propertyType || '');
        setProjectName(data.propertyName || '');
        setHasMeasurementData(true);
        sessionStorage.removeItem("propertyMeasurement");
        toast.success("Property measurements imported!");
      } catch (e) {
        console.error('Failed to parse measurement data:', e);
      }
    }

    // Check if returning from measurement tool
    const returnFlag = sessionStorage.getItem("return_to_interior_design");
    if (returnFlag) {
      sessionStorage.removeItem("return_to_interior_design");
    }
  }, []);

  // Handle mode selection
  const handleModeSelect = (mode: DesignMode) => {
    setSelectedMode(mode);
    
    // For chat mode, go directly to form
    if (mode === 'chat') {
      setStep('form');
    } else {
      setStep('project');
    }
  };

  // Navigate between steps
  const handleContinueToForm = () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    setStep('form');
  };

  const handleBackToMode = () => {
    setSelectedMode(null);
    setStep('mode');
  };

  const handleBackToProject = () => {
    setStep('project');
  };

  // Check if we can generate
  const canGenerate = useCallback((): boolean => {
    if (!projectName.trim()) return false;
    
    switch (selectedMode) {
      case 'concept':
        return !!designStyle;
      case 'redesign':
        return photos.length > 0 && !!designStyle;
      case 'staging':
        return photos.length > 0 && !!roomType && !!furnitureStyle;
      case 'chat':
        return true;
      default:
        return false;
    }
  }, [projectName, selectedMode, designStyle, photos.length, roomType, furnitureStyle]);

  // Main generation function
  const generateDesign = async (chatPrompt?: string, chatPhotos?: string[]) => {
    // Check gating first
    if (!isGatingCompleted()) {
      requireGating('interior_design', () => generateDesign(chatPrompt, chatPhotos));
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setStep('processing');

    const startTime = Date.now();

    try {
      // Prepare photos
      let photosData: string[] = [];
      
      if (chatPhotos?.length) {
        photosData = chatPhotos;
      } else if (photos.length) {
        photosData = await Promise.all(photos.slice(0, 4).map(fileToDataUrl));
      }

      setProgress(20);

      // Build prompt based on mode
      let prompt = '';
      const modeContext = selectedMode || 'chat';
      
      if (chatPrompt) {
        prompt = chatPrompt;
      } else {
        const styleLabel = designStyle || furnitureStyle || 'modern';
        const colorLabel = colorPalette || 'neutral';
        const roomLabel = roomName || roomType || 'living room';
        
        switch (modeContext) {
          case 'concept':
            prompt = `Create a ${styleLabel} interior design concept for a ${propertyType || 'property'} ${roomLabel}. 
Color palette: ${colorLabel}. Size: ${propertySize || 'standard'} sqft. Purpose: ${purpose || 'residential'}.
${customNotes ? `Additional requirements: ${customNotes}` : ''}`;
            break;
          case 'redesign':
            prompt = `Redesign this room in ${styleLabel} style with ${colorLabel} colors. ${customNotes || ''}`;
            break;
          case 'staging':
            prompt = `Stage this empty ${roomLabel} with ${styleLabel} furniture. Add realistic furniture, decor, and styling. ${customNotes || ''}`;
            break;
          default:
            prompt = customNotes || 'Create a beautiful luxury interior design';
        }
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke("interior-design-generate", {
        body: {
          mode: modeContext,
          propertyType,
          propertyName: projectName,
          propertySize,
          designStyle: designStyle || furnitureStyle,
          colorPalette,
          purpose,
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

      const processingTime = Date.now() - startTime;

      // Save to history if user is logged in
      if (user?.id) {
        const input: DesignInput = {
          mode: modeContext as 'concept' | 'redesign' | 'staging' | 'chat',
          projectName,
          roomName: roomName || roomType,
          propertyType,
          propertySize,
          designStyle: designStyle || furnitureStyle,
          colorPalette,
          purpose,
          customNotes: prompt,
        };
        
        await saveDesign(input, result, processingTime);
      }

      setProgress(100);
      setDesignResult(result);
      
      // For chat mode, update chat state
      if (modeContext === 'chat') {
        setChatGeneratedImage(result.images[0]);
        setChatGeneratedNotes(result.notes);
        setStep('form'); // Stay on chat
      } else {
        setStep('results');
      }
      
      toast.success("Your AI design is ready!");
    } catch (error) {
      console.error("Design generation error:", error);
      toast.error(error instanceof Error ? error.message : "Error generating design. Please try again.");
      setStep('form');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Handle chat generation
  const handleChatGenerate = (prompt: string, chatPhotos: string[]) => {
    generateDesign(prompt, chatPhotos);
  };

  // Reset and generate another
  const handleGenerateAnother = () => {
    setDesignResult(null);
    setPhotos([]);
    setCustomNotes('');
    setStep('form');
  };

  // Request revision
  const handleRequestRevision = () => {
    setIsInquiryOpen(true);
  };

  // View history item
  const handleSelectHistoryItem = (item: DesignHistoryItem) => {
    if (item.imageUrl) {
      setDesignResult({
        images: [item.imageUrl],
        notes: item.notes,
        createdAt: item.createdAt,
      });
      setProjectName(item.projectName);
      setStep('results');
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/30 via-black to-purple-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(192,38,211,0.15),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <Badge className="mb-6 bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 px-4 py-2">
              <Palette className="w-4 h-4 mr-2" />
              AI-Powered Design
            </Badge>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              AI Interior{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                Design Studio
              </span>
            </h1>
            
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
              Transform your space with AI-generated interior designs. Concept renders, room redesigns, and virtual staging — all free.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        {/* Back Navigation */}
        {step !== 'mode' && step !== 'processing' && (
          <div className="max-w-4xl mx-auto mb-6">
            <Button
              variant="ghost"
              onClick={step === 'form' && selectedMode !== 'chat' ? handleBackToProject : handleBackToMode}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 'form' && selectedMode !== 'chat' ? 'Back to Project Setup' : 'Back to Mode Selection'}
            </Button>
          </div>
        )}

        {/* Step: Mode Selection */}
        {step === 'mode' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <DesignModeSelector
              selectedMode={selectedMode}
              onSelectMode={handleModeSelect}
            />
            
            {/* History Section */}
            {user && (
              <DesignHistoryList
                history={history}
                isLoading={historyLoading}
                onDelete={deleteDesign}
                onSelect={handleSelectHistoryItem}
              />
            )}
          </motion.div>
        )}

        {/* Step: Project Setup */}
        {step === 'project' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <DesignProjectHeader
              projectName={projectName}
              onProjectNameChange={setProjectName}
              roomName={roomName}
              onRoomNameChange={setRoomName}
              propertyType={propertyType}
              onPropertyTypeChange={setPropertyType}
              propertySize={propertySize}
              onPropertySizeChange={setPropertySize}
              hasMeasurementData={hasMeasurementData}
            />
            
            <div className="flex justify-center">
              <Button
                onClick={handleContinueToForm}
                disabled={!projectName.trim()}
                size="lg"
                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-8"
              >
                Continue to Design
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step: Design Form (varies by mode) */}
        {step === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {selectedMode === 'concept' && (
              <ConceptRenderForm
                designStyle={designStyle}
                onDesignStyleChange={setDesignStyle}
                colorPalette={colorPalette}
                onColorPaletteChange={setColorPalette}
                purpose={purpose}
                onPurposeChange={setPurpose}
                customNotes={customNotes}
                onCustomNotesChange={setCustomNotes}
                onGenerate={() => generateDesign()}
                isProcessing={isProcessing}
                canGenerate={canGenerate()}
              />
            )}
            
            {selectedMode === 'redesign' && (
              <PhotoRedesignForm
                photos={photos}
                onPhotosChange={setPhotos}
                designStyle={designStyle}
                onDesignStyleChange={setDesignStyle}
                colorPalette={colorPalette}
                onColorPaletteChange={setColorPalette}
                customNotes={customNotes}
                onCustomNotesChange={setCustomNotes}
                onGenerate={() => generateDesign()}
                isProcessing={isProcessing}
                canGenerate={canGenerate()}
              />
            )}
            
            {selectedMode === 'staging' && (
              <VirtualStagingForm
                photos={photos}
                onPhotosChange={setPhotos}
                roomType={roomType}
                onRoomTypeChange={setRoomType}
                furnitureStyle={furnitureStyle}
                onFurnitureStyleChange={setFurnitureStyle}
                customNotes={customNotes}
                onCustomNotesChange={setCustomNotes}
                onGenerate={() => generateDesign()}
                isProcessing={isProcessing}
                canGenerate={canGenerate()}
              />
            )}
            
            {selectedMode === 'chat' && (
              <DesignChatAssistant
                onGenerateFromChat={handleChatGenerate}
                isProcessing={isProcessing}
                generatedImage={chatGeneratedImage}
                generatedNotes={chatGeneratedNotes}
              />
            )}
          </motion.div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">
              Creating Your Design
            </h3>
            
            <p className="text-zinc-400 mb-8">
              Our AI is generating a premium interior design based on your preferences...
            </p>
            
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-zinc-500">{progress}% complete</p>
            </div>
          </motion.div>
        )}

        {/* Step: Results */}
        {step === 'results' && designResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DesignResultsGallery
              images={designResult.images}
              notes={designResult.notes}
              projectName={projectName}
              onRequestRevision={handleRequestRevision}
              onGenerateAnother={handleGenerateAnother}
              isSaving={isSaving}
            />
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <ContactGatingModal
        isOpen={showGatingModal}
        onClose={closeGatingModal}
        onComplete={handleGatingComplete}
        triggerSource={triggerSource}
      />

      <InquiryFormModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        propertyName={projectName || "Interior Design Revision"}
        source="interior_design"
      />
    </section>
  );
};

export default InteriorDesignAI;
