import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ToolAnimatedFrame } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Ruler, 
  Camera, 
  Video, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  Info,
  Download,
  Sparkles,
  Home,
  Building2,
  Warehouse,
  LayoutGrid,
  Plus,
  X,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

type PropertyType = "apartment" | "villa" | "office" | "land" | "retail" | "";
type UnitType = "sqft" | "sqm" | "both";
type MediaType = "photo" | "video";

interface RoomUpload {
  id: string;
  name: string;
  mediaType: MediaType;
  files: File[];
  isComplete: boolean;
}

interface RoomMeasurement {
  name: string;
  area: number;
  dimensions?: string;
}

interface MeasurementResult {
  totalArea: number;
  rooms: RoomMeasurement[];
  unit: UnitType;
  confidence?: string;
  notes?: string;
}

const PropertyMeasurement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState<PropertyType>("");
  const [propertyName, setPropertyName] = useState("");
  const [unitPreference, setUnitPreference] = useState<UnitType>("both");
  const [roomUploads, setRoomUploads] = useState<RoomUpload[]>([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const propertyTypes = [
    { id: "apartment", label: "Apartment", icon: Building2 },
    { id: "villa", label: "Villa / Townhouse", icon: Home },
    { id: "office", label: "Office Space", icon: LayoutGrid },
    { id: "land", label: "Land / Plot", icon: Warehouse },
    { id: "retail", label: "Retail / Commercial", icon: Building2 },
  ];

  // Room presets based on property type
  const getRoomPresets = (type: PropertyType): string[] => {
    switch (type) {
      case "apartment":
        return ["Living Room", "Master Bedroom", "Bedroom 2", "Kitchen", "Bathroom 1", "Bathroom 2", "Balcony"];
      case "villa":
        return ["Living Room", "Master Bedroom", "Bedroom 2", "Bedroom 3", "Kitchen", "Bathroom 1", "Bathroom 2", "Garden", "Garage"];
      case "office":
        return ["Reception", "Main Office Area", "Meeting Room", "Manager Office", "Kitchen/Pantry", "Restroom"];
      case "retail":
        return ["Main Floor", "Storage Room", "Restroom", "Office Area"];
      case "land":
        return ["Plot Area"];
      default:
        return [];
    }
  };

  const initializeRooms = () => {
    const presets = getRoomPresets(propertyType);
    const rooms: RoomUpload[] = presets.map((name, i) => ({
      id: `room-${i}`,
      name,
      mediaType: "photo",
      files: [],
      isComplete: false,
    }));
    setRoomUploads(rooms);
    setCurrentRoomIndex(0);
    setStep(3);
  };

  const addCustomRoom = (name: string) => {
    if (!name.trim()) return;
    const newRoom: RoomUpload = {
      id: `room-${Date.now()}`,
      name: name.trim(),
      mediaType: "photo",
      files: [],
      isComplete: false,
    };
    setRoomUploads(prev => [...prev, newRoom]);
    toast.success(`Added "${name}" to your property`);
  };

  const removeRoom = (id: string) => {
    setRoomUploads(prev => prev.filter(r => r.id !== id));
    toast.info("Room removed");
  };

  const handleRoomMediaUpload = (files: FileList | null, roomId: string) => {
    if (!files) return;
    const fileArray = Array.from(files);
    
    setRoomUploads(prev => prev.map(room => {
      if (room.id === roomId) {
        const newFiles = [...room.files, ...fileArray].slice(0, 10);
        return { ...room, files: newFiles, isComplete: newFiles.length > 0 };
      }
      return room;
    }));
    
    toast.success(`${fileArray.length} file(s) added`);
  };

  const removeFileFromRoom = (roomId: string, fileIndex: number) => {
    setRoomUploads(prev => prev.map(room => {
      if (room.id === roomId) {
        const newFiles = room.files.filter((_, i) => i !== fileIndex);
        return { ...room, files: newFiles, isComplete: newFiles.length > 0 };
      }
      return room;
    }));
  };

  const setRoomMediaType = (roomId: string, type: MediaType) => {
    setRoomUploads(prev => prev.map(room => 
      room.id === roomId ? { ...room, mediaType: type, files: [] } : room
    ));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processWithAI = async () => {
    const roomsWithMedia = roomUploads.filter(r => r.files.length > 0);
    if (roomsWithMedia.length < 1) {
      toast.error("Please upload at least 1 room with photos or video");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      setProgress(10);
      toast.info("Preparing media for AI analysis...");

      // Prepare all images with room labels
      const allImages: string[] = [];
      const roomLabels: string[] = [];
      
      for (const room of roomsWithMedia) {
        for (const file of room.files.slice(0, 3)) {
          if (file.type.startsWith("image/")) {
            const base64 = await convertFileToBase64(file);
            allImages.push(base64);
            roomLabels.push(room.name);
          }
        }
      }

      if (allImages.length === 0) {
        throw new Error("No valid images found. Please upload photos of each room.");
      }

      setProgress(30);
      toast.info("Analyzing each room with AI...");

      // Build enhanced prompt with room labels
      const roomListText = roomsWithMedia.map(r => r.name).join(", ");
      
      const { data, error } = await supabase.functions.invoke('property-measurement', {
        body: {
          images: allImages,
          propertyType,
          propertyName,
          unitPreference,
          roomLabels,
          roomList: roomListText,
        }
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to analyze property");
      }

      if (!data.success) {
        throw new Error(data.error || "Measurement failed");
      }

      setProgress(90);

      const aiResult: MeasurementResult = {
        totalArea: data.result.totalArea,
        rooms: data.result.rooms,
        unit: unitPreference,
        confidence: data.result.confidence,
        notes: data.result.notes,
      };

      setResult(aiResult);
      setProgress(100);
      setStep(5);
      toast.success(`Measurement complete! Confidence: ${aiResult.confidence || 'medium'}`);
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error instanceof Error ? error.message : "Error processing. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const convertArea = (area: number, to: "sqft" | "sqm") => {
    if (to === "sqm") return Math.round(area * 0.0929);
    return area;
  };

  const downloadReport = async () => {
    if (!result) return;
    try {
      const { exportMeasurementReport } = await import("@/lib/measurement/exportMeasurementReport");
      exportMeasurementReport({
        propertyName,
        propertyType,
        totalArea: result.totalArea,
        rooms: result.rooms,
        confidence: result.confidence,
        notes: result.notes,
      });
      toast.success("Branded PDF report downloaded");
    } catch (e) {
      console.error("PDF export failed", e);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const proceedToInteriorDesign = () => {
    if (result) {
      sessionStorage.setItem("propertyMeasurement", JSON.stringify({
        totalArea: result.totalArea,
        rooms: result.rooms,
        propertyType,
        propertyName,
      }));
    }
    navigate("/interior-design-ai");
  };

  const completedRoomsCount = roomUploads.filter(r => r.isComplete).length;
  const currentRoom = roomUploads[currentRoomIndex];

  return (
    <ToolAnimatedFrame theme={toolThemes.emerald}>
    <section
      data-allow-dark-cta
      data-no-contrast-guard
      data-on-dark
      data-surface="dark"
      className="pm-root allow-white relative w-full min-h-screen bg-[#0A0F0C]"
    >
      {/* Page-local style: hard-locks readable contrast inside Property Measurement.
          The site-wide contrast engines must NEVER strip the white text on this dark page. */}
      <style>{`
        @keyframes jbjEmeraldFlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(16,185,129,0.55), 0 0 28px rgba(16,185,129,0.35), inset 0 0 24px rgba(16,185,129,0.10); }
          50%      { box-shadow: 0 0 0 2px rgba(52,211,153,0.85), 0 0 48px rgba(16,185,129,0.55), inset 0 0 36px rgba(16,185,129,0.18); }
        }
        .jbj-emerald-ring { animation: jbjEmeraldFlow 3.2s ease-in-out infinite; }
        @keyframes jbjEmeraldEdge {
          0%, 100% { box-shadow: 0 0 0 1px rgba(16,185,129,0.45), 0 0 14px rgba(16,185,129,0.25); }
          50%      { box-shadow: 0 0 0 2px rgba(52,211,153,0.75), 0 0 22px rgba(16,185,129,0.45); }
        }
        .jbj-emerald-edge { animation: jbjEmeraldEdge 2.6s ease-in-out infinite; }

        /* === HARD CONTRAST LOCK for /property-measurement ===
           Forces readable ombre-white on every text node so no global contrast
           engine can flip text to ink on this dark page. */
        .pm-root h1, .pm-root h2, .pm-root h3,
        .pm-root .pm-text-strong {
          color: #F6FBF8 !important;
          -webkit-text-fill-color: #F6FBF8 !important;
        }
        .pm-root p, .pm-root label,
        .pm-root .pm-text {
          color: rgba(246,251,248,0.92) !important;
          -webkit-text-fill-color: rgba(246,251,248,0.92) !important;
        }
        .pm-root .pm-text-dim {
          color: rgba(246,251,248,0.72) !important;
          -webkit-text-fill-color: rgba(246,251,248,0.72) !important;
        }
        .pm-root .pm-text-accent {
          color: #6EE7B7 !important;
          -webkit-text-fill-color: #6EE7B7 !important;
        }
        /* Gradient headline must stay transparent so the bg-clip-text gradient shows */
        .pm-root [class*="bg-clip-text"] {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }
        /* Ombre card: green → black with soft emerald hairline */
        .pm-card {
          background: linear-gradient(135deg, #0C4F38 0%, #06301F 45%, #050B08 100%) !important;
          border: 1px solid rgba(16,185,129,0.32) !important;
          color: #F6FBF8 !important;
          -webkit-text-fill-color: #F6FBF8 !important;
        }
          .pm-card-active {
          background: linear-gradient(135deg, #065F46 0%, #04231A 45%, #04140C 100%) !important;
            border: 1px solid rgba(255,255,255,0.52) !important;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.18), 0 10px 36px rgba(16,185,129,0.35), inset 0 0 30px rgba(16,185,129,0.22) !important;
          color: #ECFDF5 !important;
          -webkit-text-fill-color: #ECFDF5 !important;
        }
        .pm-card svg, .pm-card-active svg { color: #FFFFFF !important; }
        .pm-input {
          background: linear-gradient(135deg, rgba(8,40,28,0.7), rgba(2,8,5,0.8)) !important;
          border: 1px solid rgba(16,185,129,0.4) !important;
          color: #F6FBF8 !important;
          -webkit-text-fill-color: #F6FBF8 !important;
        }
        .pm-input::placeholder {
          color: rgba(246,251,248,0.55) !important;
          -webkit-text-fill-color: rgba(246,251,248,0.55) !important;
        }
        .pm-step-inactive {
          background: rgba(16,185,129,0.10) !important;
          color: rgba(246,251,248,0.78) !important;
          border: 1px solid rgba(16,185,129,0.30) !important;
        }
      `}</style>

      {/* Hero Section — ink-emerald gradient (global brand dark surface) */}
      <div
        data-ink-emerald
        data-hero-dark
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ backgroundImage: "var(--gradient-ink)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br /40 via-transparent /30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.18),transparent_55%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <span
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white inline-flex items-center mb-6 px-4 py-2 rounded-full text-sm font-semibold select-none"
              style={{
                background: "linear-gradient(135deg, #065F46 0%, #04231A 55%, #064E3B 100%)",
                border: "1px solid rgba(184,149,85,0.55)",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(6,78,59,0.35), inset 0 0 12px rgba(255,255,255,0.08)",
              }}
            >
              <Ruler className="w-4 h-4 mr-2" style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>FREE AI Tool</span>
            </span>

            <h1 className="allow-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: "rgba(255,255,255,0.96)" }}>
              Property{" "}
              <span className="text-[#B89555]">
                Measurement
              </span>
            </h1>

            <p className="allow-white text-lg md:text-xl max-w-2xl mx-auto mb-8" style={{ color: "rgba(255,255,255,0.82)" }}>
              Verify your property size with AI precision. Upload photos room by room — 
              get accurate measurements in seconds. <span className="font-semibold" style={{ color: "#6EE7B7" }}>100% Free.</span>
            </p>

            {/* Why Use This Tool */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12">
              {[
                { Icon: CheckCircle2, title: "Verify Developer Claims", body: "Check if the property matches the stated size before you buy" },
                { Icon: AlertCircle,  title: "Check Rental Sizes",      body: "Verify apartment sizes before signing a rental agreement" },
                { Icon: Sparkles,     title: "Secondary Market Check",  body: "Verify size claims before viewing a resale property" },
              ].map(({ Icon, title, body }) => (
                <div
                  key={title}
                  data-allow-dark-cta
                  data-no-contrast-guard
                  className="allow-white rounded-xl p-4"
                  style={{
                    background: "linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000 100%)",
                    border: "1px solid rgba(16,185,129,0.32)",
                  }}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: "#6EE7B7" }} />
                  <p className="font-medium" style={{ color: "rgba(255,255,255,0.94)" }}>{title}</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
 step >= s 
 ? "jj-surface-emerald text-white shadow-[0_0_16px_rgba(16,185,129,0.55)]" 
 : "bg-white/10 text-white/70 border border-white/15"
 }`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 5 && (
                  <div className={`w-8 md:w-12 h-1 rounded-full ${step > s ? "jj-surface-emerald" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Property Info */}
        {step === 1 && (
          <motion.div 
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div id="pm-step1-ink-scope" className="jbj-emerald-ring rounded-2xl" data-allow-dark-cta data-no-contrast-guard data-surface="emerald">
              <Card
                data-allow-dark-cta
                data-no-contrast-guard
                data-surface="emerald"
                data-emerald-ok="card"
                className="allow-white !border-0 rounded-2xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #065F46 0%, #04231A 55%, #000000 100%)",
                  border: "1px solid rgba(255,255,255,0.42)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.45), inset 0 0 24px rgba(16,185,129,0.14)",
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: "#FFFFFF" }}>
                    <Building2 className="w-5 h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    <span style={{ color: "#FFFFFF" }}>Step 1: Property Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block" style={{ color: "#1A1A1A", fontWeight: 600 }}>Property Type</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {propertyTypes.map((type) => {
                        const active = propertyType === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            data-allow-dark-cta
                            data-no-contrast-guard
                            onClick={() => setPropertyType(type.id as PropertyType)}
                            className="allow-white relative p-4 rounded-xl text-left transition-all duration-300"
                            style={{
                              background: active
                                ? "linear-gradient(135deg, #065F46 0%, #04231A 45%, #000000 100%)"
                                : "linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%)",
                              border: active
                                ? "1px solid rgba(255,255,255,0.52)"
                              : "1px solid rgba(255,255,255,0.34)",
                              boxShadow: active
                                ? "0 0 0 1px rgba(255,255,255,0.18), 0 8px 28px rgba(16,185,129,0.28), inset 0 0 24px rgba(16,185,129,0.18)"
                                : "inset 0 0 0 1px rgba(255,255,255,0.04)",
                            }}
                          >
                            <type.icon
                              className="w-6 h-6 mx-auto mb-2"
                              style={{ color: active ? "#FFFFFF" : "rgba(255,255,255,0.85)" }}
                            />
                            <p
                              className="text-sm font-medium text-center"
                              style={{ color: active ? "#D1FAE5" : "rgba(255,255,255,0.92)" }}
                            >
                              {type.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="propertyName" style={{ color: "#1A1A1A", fontWeight: 600 }}>Property Name (Optional)</Label>
                    <Input
                      id="propertyName"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      placeholder="e.g., My Dubai Marina Apartment"
                      data-surface="dark"
                      data-jbj-field="dark"
                      data-allow-dark-cta
                      data-no-contrast-guard
                      className="property-measurement-name-input allow-white mt-2 focus-visible:ring-emerald-400 placeholder:!text-[rgba(246,251,248,0.55)] placeholder:!opacity-100 !text-[#FFFFFF]"
                      style={{
                        background: "linear-gradient(135deg, rgba(4,40,28,0.85), rgba(0,0,0,0.85))",
                        border: "1px solid rgba(255,255,255,0.42)",
                        color: "#FFFFFF",
                        WebkitTextFillColor: "#FFFFFF",
                        opacity: 1,
                        caretColor: "#FFFFFF",
                        fontWeight: 500,
                      }}
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block" style={{ color: "#1A1A1A", fontWeight: 600 }}>Unit Preference</Label>
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { id: "sqft", label: "Square Feet" },
                        { id: "sqm", label: "Square Meters" },
                        { id: "both", label: "Both" },
                      ].map((unit) => {
                        const active = unitPreference === unit.id;
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            data-allow-dark-cta
                            data-no-contrast-guard
                            onClick={() => setUnitPreference(unit.id as UnitType)}
                            className="allow-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{
                              background: active
                                ? "linear-gradient(135deg, #065F46 0%, #04231A 55%, #000000 100%)"
                                : "linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%)",
                              border: active
                                ? "1px solid rgba(255,255,255,0.52)"
                                : "1px solid rgba(255,255,255,0.34)",
                              color: active ? "#ECFDF5" : "rgba(255,255,255,0.85)",
                              boxShadow: active ? "0 0 18px rgba(16,185,129,0.35)" : "none",
                            }}
                          >
                            {unit.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!propertyType}
                    data-allow-dark-cta
                    data-no-contrast-guard
                    className="allow-white w-full py-6"
                    style={{
                      background:
                        "linear-gradient(135deg, #065F46 0%, #04231A 55%, #022c1c 100%)",
                      color: "rgba(255,255,255,0.96)",
                      boxShadow: "0 0 28px rgba(16,185,129,0.45)",
                      border: "1px solid rgba(255,255,255,0.46)",
                    }}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Step 2: Instructions */}
        {step === 2 && (
          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              data-surface="emerald"
              data-emerald-ok="card"
              className="jj-surface-emerald rounded-2xl overflow-hidden"
            >
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-400" />
                  Step 2: How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="jj-surface-emerald-soft border border-[color:var(--emerald-1)]/30/30 rounded-xl p-6">
                  <h3 className="text-[color:var(--emerald-on)] font-semibold text-lg mb-4">📱 Room-by-Room Guide</h3>
                  <div className="space-y-4 text-white/85">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 jj-surface-emerald-soft rounded-full flex items-center justify-center text-[color:var(--emerald-on)] font-bold flex-shrink-0">1</span>
                      <div>
                        <p className="font-medium text-white">Select your rooms</p>
                        <p className="text-sm text-white/70">We'll suggest rooms based on your property type. Add custom rooms if needed.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 jj-surface-emerald-soft rounded-full flex items-center justify-center text-[color:var(--emerald-on)] font-bold flex-shrink-0">2</span>
                      <div>
                        <p className="font-medium text-white">Upload for each room</p>
                        <p className="text-sm text-white/70">Choose to upload <strong>photos</strong> (2-3 per room) OR a <strong>video walkthrough</strong> of each specific room.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 jj-surface-emerald-soft rounded-full flex items-center justify-center text-[color:var(--emerald-on)] font-bold flex-shrink-0">3</span>
                      <div>
                        <p className="font-medium text-white">Get accurate measurements</p>
                        <p className="text-sm text-white/70">AI analyzes each room separately for precise individual and total area calculations.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-300 font-medium flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Important Tips
                  </p>
                  <ul className="text-white/70 text-sm mt-2 space-y-1">
                    <li>• When uploading for "Kitchen", only upload kitchen photos/video</li>
                    <li>• Include doors and windows in shots for scale reference</li>
                    <li>• For best accuracy, capture all corners of each room</li>
                    <li>• Good lighting helps AI measure more accurately</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="border-[#1A1A1A] text-white/85"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={initializeRooms}
                    className="flex-1 jj-surface-emerald hover:jj-surface-emerald text-white py-6"
                  >
                    Start Adding Rooms
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Room Selection & Setup */}
        {step === 3 && (
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              data-surface="emerald"
              data-emerald-ok="card"
              className="jj-surface-emerald rounded-2xl overflow-hidden"
            >
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-teal-400" />
                  Step 3: Your Rooms ({roomUploads.length} total)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Room Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roomUploads.map((room) => (
                    <div
                      key={room.id}
                      data-allow-dark-cta
                      data-no-contrast-guard
                      className={`pm-card relative p-4 rounded-xl transition-all ${room.isComplete ? "pm-card-active" : ""}`}
                    >
                      <button
                        onClick={() => removeRoom(room.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <p className="pm-text-strong font-medium mb-3 pr-6">{room.name}</p>

                      {room.isComplete ? (
                        <div className="flex items-center gap-2 pm-text-accent">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm">{room.files.length} file(s) added</span>
                        </div>
                      ) : (
                        <p className="pm-text-dim text-sm">No media uploaded</p>
                      )}
                    </div>
                  ))}

                  {/* Add Custom Room */}
                  <button
                    data-allow-dark-cta
                    data-no-contrast-guard
                    onClick={() => {
                      const name = prompt("Enter room/area name:");
                      if (name) addCustomRoom(name);
                    }}
                    className="pm-card p-4 rounded-xl border-dashed transition-all flex flex-col items-center justify-center gap-2 min-h-[100px] hover:opacity-90"
                    style={{ borderStyle: "dashed" }}
                  >
                    <Plus className="w-6 h-6" style={{ color: "#FFFFFF" }} />
                    <span className="pm-text-dim text-sm">Add Custom Room</span>
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="border-[#1A1A1A] text-white/85"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(4)}
                    disabled={roomUploads.length === 0}
                    className="flex-1 jj-surface-emerald hover:jj-surface-emerald text-white py-6"
                  >
                    Continue to Upload Media
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Upload Media for Each Room */}
        {step === 4 && (
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              data-surface="emerald"
              data-emerald-ok="card"
              className="jj-surface-emerald rounded-2xl overflow-hidden"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-teal-400" />
                    Step 4: Upload Media for Each Room
                  </CardTitle>
                  <Badge className="jj-surface-emerald-soft text-[color:var(--emerald-on)] border-[color:var(--emerald-1)]/30/30">
                    {completedRoomsCount}/{roomUploads.length} Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Room Upload Cards */}
                <div className="space-y-4">
                  {roomUploads.map((room) => (
                    <div
                      key={room.id}
                      data-allow-dark-cta
                      data-no-contrast-guard
                      className={`pm-card p-4 rounded-xl transition-all ${room.isComplete ? "pm-card-active" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {room.isComplete ? (
                            <CheckCircle2 className="w-5 h-5" style={{ color: "#FFFFFF" }} />
                          ) : (
                            <Camera className="w-5 h-5" style={{ color: "#FFFFFF" }} />
                          )}
                          <h4 className="pm-text-strong font-medium">{room.name}</h4>
                        </div>

                        {/* Media Type Toggle */}
                        <div className="flex gap-2">
                          <button
                            data-allow-dark-cta
                            data-no-contrast-guard
                            onClick={() => setRoomMediaType(room.id, "photo")}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
 room.mediaType === "photo" ? "pm-card-active" : "pm-card"
 }`}
                          >
                            <Camera className="w-3 h-3 inline mr-1" />
                            Photos
                          </button>
                          <button
                            data-allow-dark-cta
                            data-no-contrast-guard
                            onClick={() => setRoomMediaType(room.id, "video")}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
 room.mediaType === "video" ? "pm-card-active" : "pm-card"
 }`}
                          >
                            <Video className="w-3 h-3 inline mr-1" />
                            Video
                          </button>
                        </div>
                      </div>

                      {/* Upload Area */}
                      <div>
                        <input
                          type="file"
                          accept={room.mediaType === "photo" ? "image/*" : "video/*"}
                          multiple={room.mediaType === "photo"}
                          onChange={(e) => handleRoomMediaUpload(e.target.files, room.id)}
                          className="hidden"
                          id={`upload-${room.id}`}
                        />

                        {room.files.length === 0 ? (
                          <label
                            htmlFor={`upload-${room.id}`}
                            data-allow-dark-cta
                            data-no-contrast-guard
                            className="pm-card block w-full rounded-lg p-4 text-center cursor-pointer transition-all hover:opacity-90"
                            style={{ borderStyle: "dashed" }}
                          >
                            {room.mediaType === "photo" ? (
                              <>
                                <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: "#FFFFFF" }} />
                                <p className="pm-text-dim text-sm">Click to upload 2-3 photos of <strong className="pm-text-strong">{room.name}</strong></p>
                              </>
                            ) : (
                              <>
                                <Video className="w-8 h-8 mx-auto mb-2" style={{ color: "#FFFFFF" }} />
                                <p className="pm-text-dim text-sm">Click to upload video walkthrough of <strong className="pm-text-strong">{room.name}</strong></p>
                              </>
                            )}
                          </label>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {room.files.map((file, i) => (
                                <div
                                  key={i}
                                  data-allow-dark-cta
                                  data-no-contrast-guard
                                  className="pm-card relative rounded-lg px-3 py-2 flex items-center gap-2"
                                >
                                  {file.type.startsWith("image/") ? (
                                    <Camera className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                                  ) : (
                                    <Video className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                                  )}
                                  <span className="pm-text-strong text-sm truncate max-w-[120px]">{file.name}</span>
                                  <button
                                    onClick={() => removeFileFromRoom(room.id, i)}
                                    className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center text-red-300 hover:bg-red-500/40"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <label
                              htmlFor={`upload-${room.id}`}
                              className="pm-text-accent text-sm cursor-pointer hover:underline"
                            >
                              + Add more
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="jj-surface-emerald-soft border border-[color:var(--emerald-1)]/30/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-6 h-6 text-teal-400 animate-pulse" />
                      <p className="text-[color:var(--emerald-on)] font-medium">AI is analyzing each room...</p>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-white/90 text-sm mt-2">{progress}% complete</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep(3)}
                    variant="outline"
                    className="border-[#1A1A1A] text-white/85"
                    disabled={isProcessing}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={processWithAI}
                    disabled={completedRoomsCount < 1 || isProcessing}
                    className="flex-1 jj-surface-emerald hover:jj-surface-emerald text-white py-6"
                  >
                    {isProcessing ? "Analyzing..." : `Analyze ${completedRoomsCount} Room(s) with AI`}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Results */}
        {step === 5 && result && (
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white !border-[#B89555]/40 !border bg-[#0A0A0A]"
            >
              <CardHeader className="border-b border-[#B89555]/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 allow-white">
                    <CheckCircle2 className="w-6 h-6 text-white allow-white" />
                    Measurement Complete!
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-white/15 text-white border-white/30 allow-white">
                      {result.confidence || 'medium'} confidence
                    </Badge>
                    <Badge className="bg-white/15 text-white border-white/30 allow-white">
                      AI Verified
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Total Area */}
                <div
                  data-allow-dark-cta
                  data-no-contrast-guard
                  className="allow-white jj-surface-emerald border border-[color:var(--emerald-1)]/30/40 rounded-xl p-6 text-center shadow-[0_0_24px_rgba(16,185,129,0.35)]"
                >
                  <p className="text-white/90 mb-2 allow-white">Total Property Area</p>
                  <p className="text-4xl md:text-5xl font-bold text-white allow-white">
                    {result.totalArea.toLocaleString()} <span className="text-white allow-white">sq ft</span>
                  </p>
                  <p className="text-xl text-white/90 mt-2 allow-white">
                    ({convertArea(result.totalArea, "sqm").toLocaleString()} sq m)
                  </p>
                </div>

                {/* AI Notes */}
                {result.notes && (
                  <div
                    data-allow-dark-cta
                    data-no-contrast-guard
                    className="allow-white jj-surface-emerald/80 border border-[color:var(--emerald-1)]/30/30 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-white mt-0.5 flex-shrink-0 allow-white" />
                      <div>
                        <p className="text-white font-medium mb-1 allow-white">AI Analysis Notes</p>
                        <p className="text-white/85 text-sm allow-white">{result.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Room Breakdown */}
                <div>
                  <h3 className="text-white font-semibold mb-4 allow-white">Room Breakdown</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {result.rooms.map((room, i) => (
                      <div
                        key={i}
                        data-allow-dark-cta
                        data-no-contrast-guard
                        className="allow-white jj-surface-emerald/70 border border-[color:var(--emerald-1)]/30/30 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white allow-white">{room.name}</span>
                          <div className="text-right">
                            <span className="text-white font-medium allow-white">{room.area} sq ft</span>
                            <span className="text-white/85 text-sm ml-2 allow-white">
                              ({convertArea(room.area, "sqm")} sqm)
                            </span>
                          </div>
                        </div>
                        {room.dimensions && (
                          <p className="text-white/80 text-xs mt-1 allow-white">
                            Estimated: {room.dimensions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>


                {/* Save Project CTA */}
                {!user && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                    <p className="text-yellow-300 font-medium">Want to save this measurement?</p>
                    <p className="text-white/70 text-sm mt-1">Log in to save your projects and access them anytime.</p>
                    <Link to="/auth">
                      <Button className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-[#1A1A1A]">
                        Log In to Save
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    onClick={downloadReport}
                    variant="outline"
                    className="flex-1 border-[color:var(--emerald-1)]/30/50 text-[color:var(--emerald-on)] hover:jj-surface-emerald-soft"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button 
                    onClick={proceedToInteriorDesign}
                    className="flex-1 bg-gradient-to-r from-gold to-amber-600 hover:from-amber-600 hover:to-gold text-[#1A1A1A] font-semibold"
                  >
                    Continue to Interior Design AI
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <p className="text-center text-white/90 text-sm">
                  Your measurement data will be automatically transferred to the Interior Design tool.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
    </ToolAnimatedFrame>
  );
};

export default PropertyMeasurement;
