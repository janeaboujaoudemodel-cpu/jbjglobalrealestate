import { useState, useEffect, useRef } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Palette, 
  Camera, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Home,
  Building2,
  Clock,
  DollarSign,
  Zap,
  User,
  Download,
  CreditCard,
  Ruler,
  ArrowLeft,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import InquiryFormModal from "@/components/InquiryFormModal";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

type PropertyType = "villa" | "apartment" | "office" | "retail" | "penthouse" | "";
type DesignStyle = "modern" | "classic" | "minimalist" | "luxury" | "industrial" | "bohemian" | "";
type Purpose = "personal" | "business" | "rental" | "hospitality" | "";

interface PackagePricing {
  id: string;
  name: string;
  price: number;
  features: string[];
  sizeRange: string;
  recommended?: boolean;
}

const packages: PackagePricing[] = [
  {
    id: "starter",
    name: "Starter",
    price: 99,
    sizeRange: "Up to 500 sq ft",
    features: [
      "3 room designs",
      "Basic 3D visualization",
      "1 revision",
      "PDF download",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 299,
    sizeRange: "500 - 2,000 sq ft",
    recommended: true,
    features: [
      "Full property design",
      "High-quality 3D renders",
      "3 revisions",
      "Furniture recommendations",
      "Color palette guide",
      "PDF + Image downloads",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 599,
    sizeRange: "2,000 - 5,000 sq ft",
    features: [
      "Complete property design",
      "Photorealistic 3D renders",
      "Unlimited revisions",
      "Shopping list with links",
      "Material specifications",
      "Contractor-ready plans",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise / Villa",
    price: 0,
    sizeRange: "5,000+ sq ft",
    features: [
      "Custom quotation",
      "Dedicated design team",
      "On-site consultation option",
      "Full project management",
      "Premium materials sourcing",
      "VIP concierge service",
    ],
  },
];

const colorOptions = [
  { id: "neutral", name: "Neutral & Warm", colors: ["#F5F5DC", "#D2B48C", "#8B7355"] },
  { id: "cool", name: "Cool & Serene", colors: ["#E0E5EC", "#B0C4DE", "#708090"] },
  { id: "bold", name: "Bold & Vibrant", colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"] },
  { id: "earthy", name: "Earthy & Natural", colors: ["#8B7765", "#6B8E23", "#DEB887"] },
  { id: "monochrome", name: "Monochrome Elegance", colors: ["#2C2C2C", "#808080", "#F0F0F0"] },
  { id: "luxury", name: "Luxury Gold", colors: ["#A8925A", "#1C1C1C", "#F5F5F5"] },
];

const InteriorDesignAI = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [showComparison, setShowComparison] = useState(true);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  
  // Form data
  const [propertyType, setPropertyType] = useState<PropertyType>("");
  const [propertyName, setPropertyName] = useState("");
  const [propertySize, setPropertySize] = useState("");
  const [knowsSize, setKnowsSize] = useState<boolean | null>(null);
  const [designStyle, setDesignStyle] = useState<DesignStyle>("");
  const [colorPalette, setColorPalette] = useState("");
  const [purpose, setPurpose] = useState<Purpose>("");
  const [customNotes, setCustomNotes] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [floorPlan, setFloorPlan] = useState<File | null>(null);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [designResult, setDesignResult] = useState<string | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const floorPlanRef = useRef<HTMLInputElement>(null);

  // Check for measurement data from the measurement tool
  useEffect(() => {
    const measurementData = sessionStorage.getItem("propertyMeasurement");
    if (measurementData) {
      try {
        const data = JSON.parse(measurementData);
        setPropertySize(data.totalArea.toString());
        setPropertyType(data.propertyType || "");
        setPropertyName(data.propertyName || "");
        setKnowsSize(true);
        sessionStorage.removeItem("propertyMeasurement");
        toast.success("Property measurements imported successfully!");
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  // Check if user is admin (for preview access)
  const isAdmin = user?.email === "jane@jjglobalcapital.com" || user?.email === "invest@jjglobalcapital.com";

  const propertyTypes = [
    { id: "apartment", label: "Apartment", icon: Building2 },
    { id: "villa", label: "Villa / Townhouse", icon: Home },
    { id: "penthouse", label: "Penthouse", icon: Building2 },
    { id: "office", label: "Office Space", icon: Building2 },
    { id: "retail", label: "Retail / Commercial", icon: Building2 },
  ];

  const designStyles = [
    { id: "modern", label: "Modern Contemporary" },
    { id: "classic", label: "Classic Traditional" },
    { id: "minimalist", label: "Minimalist" },
    { id: "luxury", label: "Luxury Opulent" },
    { id: "industrial", label: "Industrial Chic" },
    { id: "bohemian", label: "Bohemian Eclectic" },
  ];

  const purposes = [
    { id: "personal", label: "Personal Residence", icon: Home },
    { id: "business", label: "Business / Office", icon: Building2 },
    { id: "rental", label: "Investment / Rental", icon: DollarSign },
    { id: "hospitality", label: "Hospitality / Hotel", icon: Users },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 20));
    toast.success(`${files.length} photo(s) added`);
  };

  const handleFloorPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFloorPlan(file);
      toast.success("Floor plan uploaded");
    }
  };

  const generateDesign = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate AI processing
      for (let i = 0; i <= 100; i += 2) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setProgress(i);
      }

      // Mock result - in production this would call an edge function with image generation
      setDesignResult("generated");
      setStep(6);
      toast.success("Your AI-generated design is ready!");
    } catch (error) {
      toast.error("Error generating design. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    if (packageId === "enterprise") {
      setIsInquiryOpen(true);
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-20 md:py-28 overflow-hidden">
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
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              AI Interior{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                Design Studio
              </span>
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Transform your space with AI-generated interior designs. Get professional-quality 3D renders in minutes, not weeks.
            </p>
          </motion.div>
        </div>
      </div>

      {/* AI vs Human Comparison */}
      {showComparison && step === 1 && (
        <div className="container mx-auto px-4 pb-16">
          <motion.div 
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              Choose Your Design Path
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* AI Design */}
              <Card className="bg-gradient-to-br from-fuchsia-900/30 to-purple-900/30 border-fuchsia-500/30 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-fuchsia-500 text-white">RECOMMENDED</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-fuchsia-400" />
                    </div>
                    AI Design Studio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-zinc-300">
                      <Zap className="w-5 h-5 text-fuchsia-400" />
                      <span>Results in <span className="text-fuchsia-400 font-bold">seconds</span>, not weeks</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300">
                      <DollarSign className="w-5 h-5 text-fuchsia-400" />
                      <span>Starting from <span className="text-fuchsia-400 font-bold">$99</span> (90% cheaper)</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300">
                      <CheckCircle2 className="w-5 h-5 text-fuchsia-400" />
                      <span>AI trained on <span className="text-fuchsia-400 font-bold">1M+ premium designs</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300">
                      <Clock className="w-5 h-5 text-fuchsia-400" />
                      <span>Unlimited revisions with instant updates</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowComparison(false)}
                    className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white py-6 mt-4"
                  >
                    Design with AI
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Human Designer */}
              <Card className="bg-zinc-900/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                      <User className="w-6 h-6 text-zinc-400" />
                    </div>
                    Professional Designer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Clock className="w-5 h-5" />
                      <span>2-4 weeks delivery time</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <DollarSign className="w-5 h-5" />
                      <span>Starting from $2,000+</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <User className="w-5 h-5" />
                      <span>Human touch & consultation</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Limited revisions per project</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setIsInquiryOpen(true)}
                    variant="outline"
                    className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800 py-6 mt-4"
                  >
                    Contact Designer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Form Flow */}
      {!showComparison && (
        <div className="container mx-auto px-4 pb-20">
          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-2 md:gap-4">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    step >= s 
                      ? "bg-fuchsia-500 text-white" 
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  {s < 6 && (
                    <div className={`w-6 md:w-12 h-1 ${step > s ? "bg-fuchsia-500" : "bg-zinc-800"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Property Size Check */}
          {step === 1 && (
            <motion.div 
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-fuchsia-400" />
                    Do you know your property size?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { setKnowsSize(true); setStep(2); }}
                      className="p-6 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10 transition-all text-center"
                    >
                      <CheckCircle2 className="w-10 h-10 text-fuchsia-400 mx-auto mb-3" />
                      <p className="text-white font-medium">Yes, I know the size</p>
                      <p className="text-zinc-500 text-sm mt-1">Enter dimensions manually</p>
                    </button>
                    <button
                      onClick={() => navigate("/property-measurement")}
                      className="p-6 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:border-teal-500/50 hover:bg-teal-500/10 transition-all text-center"
                    >
                      <Ruler className="w-10 h-10 text-teal-400 mx-auto mb-3" />
                      <p className="text-white font-medium">No, measure it first</p>
                      <p className="text-zinc-500 text-sm mt-1">Use our FREE AI measurement tool</p>
                    </button>
                  </div>

                  <Button 
                    onClick={() => setShowComparison(true)}
                    variant="ghost"
                    className="w-full text-zinc-500 hover:text-zinc-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to comparison
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <motion.div 
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-fuchsia-400" />
                    Property Details
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
                              ? "border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300"
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
                    <Label htmlFor="propertyName" className="text-white">Project Name</Label>
                    <Input
                      id="propertyName"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      placeholder="e.g., My Dream Living Room"
                      className="bg-zinc-800/50 border-zinc-700 text-white mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="propertySize" className="text-white">Property Size (sq ft)</Label>
                    <Input
                      id="propertySize"
                      type="number"
                      value={propertySize}
                      onChange={(e) => setPropertySize(e.target.value)}
                      placeholder="e.g., 1200"
                      className="bg-zinc-800/50 border-zinc-700 text-white mt-2"
                    />
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
                      disabled={!propertyType || !propertySize}
                      className="flex-1 bg-fuchsia-500 hover:bg-fuchsia-600 text-white py-6"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Style Preferences */}
          {step === 3 && (
            <motion.div 
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-fuchsia-400" />
                    Design Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-white mb-3 block">Design Style</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {designStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setDesignStyle(style.id as DesignStyle)}
                          className={`p-4 rounded-xl border transition-all ${
                            designStyle === style.id
                              ? "border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300"
                              : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          <p className="font-medium">{style.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-3 block">Color Palette</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {colorOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setColorPalette(option.id)}
                          className={`p-4 rounded-xl border transition-all ${
                            colorPalette === option.id
                              ? "border-fuchsia-500 bg-fuchsia-500/20"
                              : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                          }`}
                        >
                          <div className="flex gap-1 mb-2 justify-center">
                            {option.colors.map((color, i) => (
                              <div 
                                key={i}
                                className="w-6 h-6 rounded-full border border-white/20"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <p className={`text-sm ${colorPalette === option.id ? "text-fuchsia-300" : "text-zinc-400"}`}>
                            {option.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-3 block">Purpose</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {purposes.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPurpose(p.id as Purpose)}
                          className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                            purpose === p.id
                              ? "border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300"
                              : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          <p.icon className="w-5 h-5" />
                          <span className="font-medium">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customNotes" className="text-white">Additional Notes (Optional)</Label>
                    <Textarea
                      id="customNotes"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Tell us more about your preferences, specific rooms to focus on, inspiration sources, etc."
                      className="bg-zinc-800/50 border-zinc-700 text-white mt-2 min-h-[100px]"
                    />
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
                      disabled={!designStyle || !colorPalette || !purpose}
                      className="flex-1 bg-fuchsia-500 hover:bg-fuchsia-600 text-white py-6"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Upload Photos */}
          {step === 4 && (
            <motion.div 
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-fuchsia-400" />
                    Upload Your Space
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Photos */}
                  <div>
                    <Label className="text-white mb-3 block">
                      Current Photos <span className="text-zinc-500 text-sm">({photos.length}/20)</span>
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
                      className="w-full border-2 border-dashed border-zinc-700 hover:border-fuchsia-500/50 rounded-xl p-8 transition-all bg-zinc-800/30 hover:bg-zinc-800/50"
                    >
                      <Camera className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                      <p className="text-zinc-400">Click to upload photos of your space</p>
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

                  {/* Floor Plan */}
                  <div>
                    <Label className="text-white mb-3 block">
                      Floor Plan <span className="text-zinc-500 text-sm">(Optional)</span>
                    </Label>
                    <input
                      ref={floorPlanRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFloorPlanUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => floorPlanRef.current?.click()}
                      className="w-full border-2 border-dashed border-zinc-700 hover:border-fuchsia-500/50 rounded-xl p-6 transition-all bg-zinc-800/30 hover:bg-zinc-800/50"
                    >
                      {floorPlan ? (
                        <div className="flex items-center justify-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-fuchsia-400" />
                          <span className="text-fuchsia-300">{floorPlan.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                          <p className="text-zinc-400">Upload floor plan if available</p>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setStep(3)}
                      variant="outline"
                      className="border-zinc-700 text-zinc-300"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={() => setStep(5)}
                      className="flex-1 bg-fuchsia-500 hover:bg-fuchsia-600 text-white py-6"
                    >
                      Continue to Pricing
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Pricing */}
          {step === 5 && (
            <motion.div 
              className="max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
                Select Your Package
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {packages.map((pkg) => (
                  <Card 
                    key={pkg.id}
                    className={`cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? "bg-fuchsia-900/30 border-fuchsia-500"
                        : pkg.recommended
                          ? "bg-zinc-900/80 border-fuchsia-500/50"
                          : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                    }`}
                    onClick={() => handlePackageSelect(pkg.id)}
                  >
                    {pkg.recommended && (
                      <div className="bg-fuchsia-500 text-white text-xs font-bold py-1 text-center">
                        MOST POPULAR
                      </div>
                    )}
                    <CardContent className="pt-6 space-y-4">
                      <div className="text-center">
                        <h3 className="text-white font-bold text-lg">{pkg.name}</h3>
                        <p className="text-zinc-500 text-sm">{pkg.sizeRange}</p>
                        <p className="text-3xl font-bold text-white mt-2">
                          {pkg.price === 0 ? "Custom" : `$${pkg.price}`}
                        </p>
                      </div>
                      
                      <ul className="space-y-2">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                            <CheckCircle2 className="w-4 h-4 text-fuchsia-400 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button 
                        className={`w-full ${
                          selectedPackage === pkg.id
                            ? "bg-fuchsia-500 hover:bg-fuchsia-600 text-white"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {pkg.price === 0 ? "Get Quote" : "Select"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedPackage && selectedPackage !== "enterprise" && (
                <div className="max-w-md mx-auto">
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Package:</span>
                        <span className="text-white font-medium">
                          {packages.find(p => p.id === selectedPackage)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-lg">
                        <span className="text-zinc-400">Total:</span>
                        <span className="text-fuchsia-400 font-bold">
                          ${packages.find(p => p.id === selectedPackage)?.price}
                        </span>
                      </div>
                      
                      {isAdmin ? (
                        <Button 
                          onClick={generateDesign}
                          className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white py-6"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Design (Admin Preview)
                        </Button>
                      ) : (
                        <Button 
                          className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white py-6"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Proceed to Payment
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Processing Modal */}
              {isProcessing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                  <Card className="bg-zinc-900 border-fuchsia-500/30 max-w-md w-full mx-4">
                    <CardContent className="pt-8 pb-8 text-center space-y-6">
                      <Sparkles className="w-16 h-16 text-fuchsia-400 mx-auto animate-pulse" />
                      <h3 className="text-xl font-bold text-white">Creating Your Design</h3>
                      <p className="text-zinc-400">Our AI is generating your personalized interior design...</p>
                      <Progress value={progress} className="h-2" />
                      <p className="text-fuchsia-400 font-medium">{progress}% Complete</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 6: Results */}
          {step === 6 && designResult && (
            <motion.div 
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-fuchsia-400" />
                      Your Design is Ready!
                    </CardTitle>
                    <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                      AI Generated
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Mock 3D Render Preview */}
                  <div className="aspect-video bg-gradient-to-br from-fuchsia-900/30 to-purple-900/30 rounded-xl flex items-center justify-center border border-fuchsia-500/20">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 text-fuchsia-400 mx-auto mb-4" />
                      <p className="text-white font-medium text-lg">3D Design Preview</p>
                      <p className="text-zinc-500 text-sm mt-2">
                        Your AI-generated interior design for {propertyName || "Your Property"}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline"
                      className="border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Images
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white"
                    >
                      Request Revision
                    </Button>
                  </div>

                  <div className="text-center pt-4 border-t border-zinc-800">
                    <p className="text-zinc-500 text-sm">
                      Powered by JJ Global Capital AI • Developed by Founder Jane Abou Jaoude
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Inquiry Modal */}
      <InquiryFormModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        source="Interior Design AI"
        propertyName={propertyName || "Interior Design Consultation"}
      />

      <Footer />
    </section>
  );
};

export default InteriorDesignAI;
