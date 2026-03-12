import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
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

  const downloadReport = () => {
    if (!result) return;
    
    const reportContent = `
PROPERTY MEASUREMENT REPORT
Generated by JBJ Global Real Estate AI
================================

Property: ${propertyName || "Unnamed Property"}
Type: ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}
Date: ${new Date().toLocaleDateString()}

TOTAL AREA
----------
${result.totalArea} sq ft
${convertArea(result.totalArea, "sqm")} sq m

ROOM BREAKDOWN
--------------
${result.rooms.map(room => `${room.name}: ${room.area} sq ft (${convertArea(room.area, "sqm")} sq m)${room.dimensions ? ` - ${room.dimensions}` : ''}`).join("\n")}

${result.notes ? `\nNOTES\n-----\n${result.notes}` : ''}

================================
Software developed and implemented by The Founder & CEO, Jane Bou Jaoude
Designed exclusively for JBJ Global Real Estate
jbj.ae
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-measurement-${propertyName || "report"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
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
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 via-black to-emerald-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(20,184,166,0.15),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <Badge className="mb-6 bg-teal-500/20 text-teal-300 border-teal-500/30 px-4 py-2">
              <Ruler className="w-4 h-4 mr-2" />
              FREE AI Tool
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              AI Property{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                Measurement
              </span>
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Verify your property size with AI precision. Upload photos room by room — 
              get accurate measurements in seconds. <span className="text-teal-400 font-semibold">100% Free.</span>
            </p>

            {/* Why Use This Tool - Enhanced */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12">
              <div className="bg-zinc-900/50 border border-teal-500/20 rounded-xl p-4">
                <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-white font-medium">Verify Developer Claims</p>
                <p className="text-zinc-500 text-sm">Check if the property matches the stated size before you buy</p>
              </div>
              <div className="bg-zinc-900/50 border border-teal-500/20 rounded-xl p-4">
                <AlertCircle className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-white font-medium">Check Rental Sizes</p>
                <p className="text-zinc-500 text-sm">Verify apartment sizes before signing a rental agreement</p>
              </div>
              <div className="bg-zinc-900/50 border border-teal-500/20 rounded-xl p-4">
                <Sparkles className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-white font-medium">Secondary Market Check</p>
                <p className="text-zinc-500 text-sm">Verify size claims before viewing a resale property</p>
              </div>
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
                    ? "bg-teal-500 text-white" 
                    : "bg-zinc-800 text-zinc-500"
                }`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 5 && (
                  <div className={`w-8 md:w-12 h-1 ${step > s ? "bg-teal-500" : "bg-zinc-800"}`} />
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
            <Card className="bg-zinc-900/50 border border-teal-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" />
                  Step 1: Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white mb-3 block">Property Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {propertyTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setPropertyType(type.id as PropertyType)}
                        className={`p-4 rounded-xl border transition-all ${
                          propertyType === type.id
                            ? "border-teal-500 bg-teal-500/20 text-teal-300"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        <type.icon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="propertyName" className="text-white">Property Name (Optional)</Label>
                  <Input
                    id="propertyName"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    placeholder="e.g., My Dubai Marina Apartment"
                    className="bg-zinc-800/50 border-zinc-700 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-white mb-3 block">Unit Preference</Label>
                  <div className="flex gap-3">
                    {[
                      { id: "sqft", label: "Square Feet" },
                      { id: "sqm", label: "Square Meters" },
                      { id: "both", label: "Both" },
                    ].map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => setUnitPreference(unit.id as UnitType)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          unitPreference === unit.id
                            ? "border-teal-500 bg-teal-500/20 text-teal-300"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        {unit.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => setStep(2)}
                  disabled={!propertyType}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white py-6"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Instructions */}
        {step === 2 && (
          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-400" />
                  Step 2: How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6">
                  <h3 className="text-teal-300 font-semibold text-lg mb-4">📱 Room-by-Room Guide</h3>
                  <div className="space-y-4 text-zinc-300">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 bg-teal-500/30 rounded-full flex items-center justify-center text-teal-300 font-bold flex-shrink-0">1</span>
                      <div>
                        <p className="font-medium text-white">Select your rooms</p>
                        <p className="text-sm text-zinc-400">We'll suggest rooms based on your property type. Add custom rooms if needed.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 bg-teal-500/30 rounded-full flex items-center justify-center text-teal-300 font-bold flex-shrink-0">2</span>
                      <div>
                        <p className="font-medium text-white">Upload for each room</p>
                        <p className="text-sm text-zinc-400">Choose to upload <strong>photos</strong> (2-3 per room) OR a <strong>video walkthrough</strong> of each specific room.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 bg-teal-500/30 rounded-full flex items-center justify-center text-teal-300 font-bold flex-shrink-0">3</span>
                      <div>
                        <p className="font-medium text-white">Get accurate measurements</p>
                        <p className="text-sm text-zinc-400">AI analyzes each room separately for precise individual and total area calculations.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-300 font-medium flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Important Tips
                  </p>
                  <ul className="text-zinc-400 text-sm mt-2 space-y-1">
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
                    className="border-zinc-700 text-zinc-300"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={initializeRooms}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-6"
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
            <Card className="bg-zinc-900/50 border-zinc-800">
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
                      className={`relative p-4 rounded-xl border transition-all ${
                        room.isComplete 
                          ? "border-teal-500 bg-teal-500/10" 
                          : "border-zinc-700 bg-zinc-800/50"
                      }`}
                    >
                      <button
                        onClick={() => removeRoom(room.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      <p className="text-white font-medium mb-3 pr-6">{room.name}</p>
                      
                      {room.isComplete ? (
                        <div className="flex items-center gap-2 text-teal-300">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm">{room.files.length} file(s) added</span>
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm">No media uploaded</p>
                      )}
                    </div>
                  ))}
                  
                  {/* Add Custom Room */}
                  <button
                    onClick={() => {
                      const name = prompt("Enter room/area name:");
                      if (name) addCustomRoom(name);
                    }}
                    className="p-4 rounded-xl border-2 border-dashed border-zinc-700 hover:border-teal-500/50 bg-zinc-800/30 hover:bg-zinc-800/50 transition-all flex flex-col items-center justify-center gap-2 min-h-[100px]"
                  >
                    <Plus className="w-6 h-6 text-zinc-500" />
                    <span className="text-zinc-400 text-sm">Add Custom Room</span>
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(4)}
                    disabled={roomUploads.length === 0}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-6"
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
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-teal-400" />
                    Step 4: Upload Media for Each Room
                  </CardTitle>
                  <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">
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
                      className={`p-4 rounded-xl border transition-all ${
                        room.isComplete 
                          ? "border-teal-500/50 bg-teal-500/5" 
                          : "border-zinc-700 bg-zinc-800/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {room.isComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-teal-400" />
                          ) : (
                            <Camera className="w-5 h-5 text-zinc-500" />
                          )}
                          <h4 className="text-white font-medium">{room.name}</h4>
                        </div>
                        
                        {/* Media Type Toggle */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRoomMediaType(room.id, "photo")}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                              room.mediaType === "photo"
                                ? "bg-teal-500 text-white"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }`}
                          >
                            <Camera className="w-3 h-3 inline mr-1" />
                            Photos
                          </button>
                          <button
                            onClick={() => setRoomMediaType(room.id, "video")}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                              room.mediaType === "video"
                                ? "bg-teal-500 text-white"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
                            className="block w-full border-2 border-dashed border-zinc-700 hover:border-teal-500/50 rounded-lg p-4 text-center cursor-pointer transition-all hover:bg-zinc-800/30"
                          >
                            {room.mediaType === "photo" ? (
                              <>
                                <Camera className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                <p className="text-zinc-400 text-sm">Click to upload 2-3 photos of <strong>{room.name}</strong></p>
                              </>
                            ) : (
                              <>
                                <Video className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                <p className="text-zinc-400 text-sm">Click to upload video walkthrough of <strong>{room.name}</strong></p>
                              </>
                            )}
                          </label>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {room.files.map((file, i) => (
                                <div key={i} className="relative bg-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2">
                                  {file.type.startsWith("image/") ? (
                                    <Camera className="w-4 h-4 text-teal-400" />
                                  ) : (
                                    <Video className="w-4 h-4 text-teal-400" />
                                  )}
                                  <span className="text-zinc-300 text-sm truncate max-w-[120px]">{file.name}</span>
                                  <button
                                    onClick={() => removeFileFromRoom(room.id, i)}
                                    className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/40"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <label 
                              htmlFor={`upload-${room.id}`}
                              className="text-teal-400 text-sm cursor-pointer hover:underline"
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
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-6 h-6 text-teal-400 animate-pulse" />
                      <p className="text-teal-300 font-medium">AI is analyzing each room...</p>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-zinc-500 text-sm mt-2">{progress}% complete</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep(3)}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300"
                    disabled={isProcessing}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={processWithAI}
                    disabled={completedRoomsCount < 1 || isProcessing}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-6"
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
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-teal-400" />
                    Measurement Complete!
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={`${
                      result.confidence === 'high' 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : result.confidence === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    }`}>
                      {result.confidence || 'medium'} confidence
                    </Badge>
                    <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                      AI Verified
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Total Area */}
                <div className="bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-xl p-6 text-center">
                  <p className="text-zinc-400 mb-2">Total Property Area</p>
                  <p className="text-4xl md:text-5xl font-bold text-white">
                    {result.totalArea.toLocaleString()} <span className="text-teal-400">sq ft</span>
                  </p>
                  <p className="text-xl text-zinc-400 mt-2">
                    ({convertArea(result.totalArea, "sqm").toLocaleString()} sq m)
                  </p>
                </div>

                {/* AI Notes */}
                {result.notes && (
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-zinc-300 font-medium mb-1">AI Analysis Notes</p>
                        <p className="text-zinc-400 text-sm">{result.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Room Breakdown */}
                <div>
                  <h3 className="text-white font-semibold mb-4">Room Breakdown</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {result.rooms.map((room, i) => (
                      <div key={i} className="bg-zinc-800/50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-300">{room.name}</span>
                          <div className="text-right">
                            <span className="text-white font-medium">{room.area} sq ft</span>
                            <span className="text-zinc-500 text-sm ml-2">
                              ({convertArea(room.area, "sqm")} sqm)
                            </span>
                          </div>
                        </div>
                        {room.dimensions && (
                          <p className="text-zinc-500 text-xs mt-1">
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
                    <p className="text-zinc-400 text-sm mt-1">Log in to save your projects and access them anytime.</p>
                    <Link to="/auth">
                      <Button className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-black">
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
                    className="flex-1 border-teal-500/50 text-teal-300 hover:bg-teal-500/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button 
                    onClick={proceedToInteriorDesign}
                    className="flex-1 bg-gradient-to-r from-gold to-amber-600 hover:from-amber-600 hover:to-gold text-black font-semibold"
                  >
                    Continue to Interior Design AI
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <p className="text-center text-zinc-500 text-sm">
                  Your measurement data will be automatically transferred to the Interior Design tool.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PropertyMeasurement;
