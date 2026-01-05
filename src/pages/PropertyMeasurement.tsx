import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  LayoutGrid
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

type PropertyType = "apartment" | "villa" | "office" | "land" | "retail" | "";
type UnitType = "sqft" | "sqm" | "both";

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
  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState<PropertyType>("");
  const [propertyName, setPropertyName] = useState("");
  const [unitPreference, setUnitPreference] = useState<UnitType>("both");
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const [redirectToDesign, setRedirectToDesign] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const propertyTypes = [
    { id: "apartment", label: "Apartment", icon: Building2 },
    { id: "villa", label: "Villa / Townhouse", icon: Home },
    { id: "office", label: "Office Space", icon: LayoutGrid },
    { id: "land", label: "Land / Plot", icon: Warehouse },
    { id: "retail", label: "Retail / Commercial", icon: Building2 },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 20) {
      toast.error("Maximum 20 photos allowed");
      return;
    }
    setPhotos(prev => [...prev, ...files]);
    toast.success(`${files.length} photo(s) added`);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video must be under 500MB");
        return;
      }
      setVideo(file);
      toast.success("Video uploaded successfully");
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processWithAI = async () => {
    if (photos.length < 3) {
      toast.error("Please upload at least 3 photos of different rooms/areas");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Convert photos to base64
      setProgress(10);
      toast.info("Preparing images for AI analysis...");
      
      const imagePromises = photos.slice(0, 10).map(file => convertFileToBase64(file));
      const base64Images = await Promise.all(imagePromises);
      
      setProgress(30);
      toast.info("Analyzing property dimensions with AI...");

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('property-measurement', {
        body: {
          images: base64Images,
          propertyType,
          propertyName,
          unitPreference,
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
      setStep(4);
      toast.success(`Measurement complete! Confidence: ${aiResult.confidence || 'medium'}`);
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error instanceof Error ? error.message : "Error processing your images. Please try again.");
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
Generated by JJ Global Capital AI
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
${result.rooms.map(room => `${room.name}: ${room.area} sq ft (${convertArea(room.area, "sqm")} sq m)`).join("\n")}

================================
Powered by JJ Global Capital
Developed by Founder Jane Abou Jaoude
www.jjglobalcapital.com
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
    // Store the measurement data in sessionStorage for the interior design tool
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
              Verify your property size with AI precision. Upload photos and videos — 
              get accurate measurements in seconds. <span className="text-teal-400 font-semibold">100% Free.</span>
            </p>

            {/* Why Use This Tool */}
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
              <div className="bg-zinc-900/50 border border-teal-500/20 rounded-xl p-4">
                <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-white font-medium">Verify Developer Claims</p>
                <p className="text-zinc-500 text-sm">Check if your property matches the stated size</p>
              </div>
              <div className="bg-zinc-900/50 border border-teal-500/20 rounded-xl p-4">
                <Sparkles className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-white font-medium">AI-Powered Accuracy</p>
                <p className="text-zinc-500 text-sm">Advanced computer vision for precise measurements</p>
              </div>
              <div className="bg-zinc-900/50 border border-teal-500/20 rounded-xl p-4">
                <Download className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-white font-medium">Instant Report</p>
                <p className="text-zinc-500 text-sm">Download detailed breakdown in sq ft & sq m</p>
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
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s 
                    ? "bg-teal-500 text-white" 
                    : "bg-zinc-800 text-zinc-500"
                }`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-12 md:w-20 h-1 ${step > s ? "bg-teal-500" : "bg-zinc-800"}`} />
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
            <Card className="bg-zinc-900/50 border-zinc-800">
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

        {/* Step 2: Upload Instructions */}
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
                  Step 2: Photo & Video Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6">
                  <h3 className="text-teal-300 font-semibold text-lg mb-4">📸 For Best Results:</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-zinc-300">
                    <div>
                      <p className="font-medium text-white mb-2">Photos (Required):</p>
                      <ul className="space-y-2 text-sm">
                        <li>• Take photos from each corner of every room</li>
                        <li>• Include the ceiling in some shots for height reference</li>
                        <li>• Photograph windows and doors fully visible</li>
                        <li>• Minimum 3 photos, recommended 10-15</li>
                        <li>• Use good lighting, avoid dark/blurry images</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-white mb-2">Video (Recommended):</p>
                      <ul className="space-y-2 text-sm">
                        <li>• Walk through entire property slowly</li>
                        <li>• Pan camera to show all walls and corners</li>
                        <li>• Keep camera steady (use both hands)</li>
                        <li>• 2-5 minute video is ideal</li>
                        <li>• Include balconies and outdoor areas</li>
                      </ul>
                    </div>
                  </div>
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
                    onClick={() => setStep(3)}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-6"
                  >
                    I Understand, Continue to Upload
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Upload Files */}
        {step === 3 && (
          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-teal-400" />
                  Step 3: Upload Your Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <Label className="text-white mb-3 block">
                    Photos <span className="text-red-400">*</span>
                    <span className="text-zinc-500 text-sm ml-2">({photos.length}/20 uploaded)</span>
                  </Label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-zinc-700 hover:border-teal-500/50 rounded-xl p-8 transition-all bg-zinc-800/30 hover:bg-zinc-800/50"
                  >
                    <Camera className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                    <p className="text-zinc-400">Click to upload photos</p>
                    <p className="text-zinc-600 text-sm mt-1">JPG, PNG up to 20 photos</p>
                  </button>
                  
                  {photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {photos.map((photo, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
                          <img 
                            src={URL.createObjectURL(photo)} 
                            alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div>
                  <Label className="text-white mb-3 block">
                    Video <span className="text-zinc-500 text-sm">(Optional but recommended)</span>
                  </Label>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-zinc-700 hover:border-teal-500/50 rounded-xl p-6 transition-all bg-zinc-800/30 hover:bg-zinc-800/50"
                  >
                    {video ? (
                      <div className="flex items-center justify-center gap-3">
                        <Video className="w-8 h-8 text-teal-400" />
                        <span className="text-teal-300">{video.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setVideo(null); }}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <Video className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
                        <p className="text-zinc-400">Click to upload walkthrough video</p>
                        <p className="text-zinc-600 text-sm mt-1">MP4, MOV up to 500MB</p>
                      </>
                    )}
                  </button>
                </div>

                {/* Processing */}
                {isProcessing && (
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-6 h-6 text-teal-400 animate-pulse" />
                      <p className="text-teal-300 font-medium">AI is analyzing your property...</p>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-zinc-500 text-sm mt-2">{progress}% complete</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300"
                    disabled={isProcessing}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={processWithAI}
                    disabled={photos.length < 3 || isProcessing}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-6"
                  >
                    {isProcessing ? "Processing..." : "Analyze with AI"}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && result && (
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
                    className="flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white"
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

      <Footer />
    </section>
  );
};

export default PropertyMeasurement;
