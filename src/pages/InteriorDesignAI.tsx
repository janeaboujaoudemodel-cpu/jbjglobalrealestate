import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { PDFDocument, StandardFonts } from "pdf-lib";
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
import { supabase } from "@/integrations/supabase/client";
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

type DesignResult = {
  images: string[];
  notes: string;
  createdAt: string;
};

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

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getMimeFromDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.*?);base64,/);
  return match?.[1] || "application/octet-stream";
};

const isDataUrl = (value: string) => value.startsWith("data:");

const getMimeFromUrlGuess = (url: string) => {
  const clean = url.toLowerCase().split("?")[0].split("#")[0];
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
};

const fetchBytes = async (url: string) => {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch image (${resp.status})`);
  const arrayBuffer = await resp.arrayBuffer();
  const mime = resp.headers.get("content-type") || getMimeFromUrlGuess(url);
  return { bytes: new Uint8Array(arrayBuffer), mime };
};

const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid data URL");
  const base64 = dataUrl.slice(commaIndex + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const getImageBytes = async (src: string) => {
  if (isDataUrl(src)) {
    return { bytes: dataUrlToUint8Array(src), mime: getMimeFromDataUrl(src) };
  }
  return fetchBytes(src);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const inferExtension = (mime: string) => {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "bin";
};

const notesToBullets = (notes: string) =>
  notes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-•\u2022]\s*/, ""));

const wrapText = (text: string, maxChars: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const InteriorDesignAI = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const canBypassPayment = isAdmin || import.meta.env.DEV;
  
  // Load saved state from sessionStorage
  const getSavedState = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = sessionStorage.getItem(`interior-design-${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [step, setStep] = useState(() => getSavedState("step", 1));
  const [showComparison, setShowComparison] = useState(() => getSavedState("showComparison", true));
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  
  // Form data - all persisted
  const [propertyType, setPropertyType] = useState<PropertyType>(() => getSavedState("propertyType", ""));
  const [propertyName, setPropertyName] = useState(() => getSavedState("propertyName", ""));
  const [propertySize, setPropertySize] = useState(() => getSavedState("propertySize", ""));
  const [knowsSize, setKnowsSize] = useState<boolean | null>(() => getSavedState("knowsSize", null));
  const [designStyle, setDesignStyle] = useState<DesignStyle>(() => getSavedState("designStyle", ""));
  const [colorPalette, setColorPalette] = useState(() => getSavedState("colorPalette", ""));
  const [purpose, setPurpose] = useState<Purpose>(() => getSavedState("purpose", ""));
  const [customNotes, setCustomNotes] = useState(() => getSavedState("customNotes", ""));
  const [selectedPackage, setSelectedPackage] = useState(() => getSavedState("selectedPackage", ""));
  const [photos, setPhotos] = useState<File[]>([]);
  const [floorPlan, setFloorPlan] = useState<File | null>(null);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [designResult, setDesignResult] = useState<DesignResult | null>(() => getSavedState("designResult", null));
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const floorPlanRef = useRef<HTMLInputElement>(null);
  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("interior-design-step", JSON.stringify(step));
    sessionStorage.setItem("interior-design-showComparison", JSON.stringify(showComparison));
    sessionStorage.setItem("interior-design-propertyType", JSON.stringify(propertyType));
    sessionStorage.setItem("interior-design-propertyName", JSON.stringify(propertyName));
    sessionStorage.setItem("interior-design-propertySize", JSON.stringify(propertySize));
    sessionStorage.setItem("interior-design-knowsSize", JSON.stringify(knowsSize));
    sessionStorage.setItem("interior-design-designStyle", JSON.stringify(designStyle));
    sessionStorage.setItem("interior-design-colorPalette", JSON.stringify(colorPalette));
    sessionStorage.setItem("interior-design-purpose", JSON.stringify(purpose));
    sessionStorage.setItem("interior-design-customNotes", JSON.stringify(customNotes));
    sessionStorage.setItem("interior-design-selectedPackage", JSON.stringify(selectedPackage));
    sessionStorage.setItem("interior-design-designResult", JSON.stringify(designResult));
  }, [step, showComparison, propertyType, propertyName, propertySize, knowsSize, designStyle, colorPalette, purpose, customNotes, selectedPackage, designResult]);

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
    setProgress(5);

    try {
      const photosData = await Promise.all(photos.slice(0, 4).map(fileToDataUrl));
      const floorPlanData = floorPlan ? await fileToDataUrl(floorPlan) : undefined;

      setProgress(20);

      const { data, error } = await supabase.functions.invoke("interior-design-generate", {
        body: {
          propertyType,
          propertyName,
          propertySize,
          designStyle,
          colorPalette,
          purpose,
          customNotes,
          photos: photosData,
          floorPlan: floorPlanData,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Design generation failed");

      setProgress(95);
      setDesignResult(data.result as DesignResult);
      setStep(6);
      toast.success("Your AI-generated design is ready!");
    } catch (error) {
      console.error("interior-design generate error:", error);
      toast.error(error instanceof Error ? error.message : "Error generating design. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

const downloadImages = async () => {
  if (!designResult?.images?.length) return;
  try {
    const first = designResult.images[0];
    const { bytes, mime } = await getImageBytes(first);
    const ext = inferExtension(mime);
    // Cast buffer for Blob compatibility
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mime });
    downloadBlob(blob, `interior-design-${propertyName || "design"}.${ext}`);
    toast.success("Image downloaded!");
  } catch (e) {
    console.error(e);
    toast.error("Couldn't download the image.");
  }
};

const downloadPdf = async () => {
  if (!designResult) return;

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 40;

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - margin;

    page.drawText("JJ Global Capital — AI Interior Design", {
      x: margin,
      y,
      size: 16,
      font: titleFont,
    });
    y -= 22;

    const meta = `Property: ${propertyName || "Your Property"}   •   Created: ${new Date(
      designResult.createdAt,
    ).toLocaleString()}`;
    page.drawText(meta, { x: margin, y, size: 10, font: bodyFont });
    y -= 18;

    const imgSrc = designResult.images?.[0];
    if (imgSrc) {
      const { bytes, mime } = await getImageBytes(imgSrc);

      if (mime.includes("webp")) {
        throw new Error("This image format can't be embedded in a PDF yet. Please download the image instead.");
      }

      const embedded = mime.includes("png") ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

      const maxW = width - margin * 2;
      const maxH = 360;
      const scale = Math.min(maxW / embedded.width, maxH / embedded.height);
      const imgW = embedded.width * scale;
      const imgH = embedded.height * scale;

      y -= imgH;
      page.drawImage(embedded, {
        x: margin + (maxW - imgW) / 2,
        y,
        width: imgW,
        height: imgH,
      });
      y -= 20;
    }

    const bullets = notesToBullets(designResult.notes).slice(0, 6);
    if (bullets.length) {
      page.drawText("Key design choices", { x: margin, y, size: 12, font: titleFont });
      y -= 18;

      for (const b of bullets) {
        const lines = wrapText(b, 90);
        for (const line of lines) {
          page.drawText(`• ${line}`, { x: margin, y, size: 10, font: bodyFont });
          y -= 14;
          if (y < margin + 20) break;
        }
        if (y < margin + 20) break;
      }
    }

    const pdfBytes = await pdfDoc.save();
    downloadBlob(
      new Blob([new Uint8Array(pdfBytes) as BlobPart], { type: "application/pdf" }),
      `interior-design-${propertyName || "design"}.pdf`,
    );
    toast.success("PDF downloaded!");
  } catch (e) {
    console.error(e);
    toast.error(e instanceof Error ? e.message : "Couldn't generate the PDF.");
  }
};

  const requestRevision = () => {
    if (!designResult) return;
    setIsInquiryOpen(true);
    toast.info("Tell us what you'd like to change, and we'll handle the revision.");
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
              <Card className="bg-gradient-to-br from-fuchsia-950/60 to-purple-950/60 border-2 border-fuchsia-400/60 relative overflow-hidden shadow-2xl shadow-fuchsia-500/30">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white font-bold shadow-lg">RECOMMENDED</Badge>
                </div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <span className="text-xl font-bold">AI Design Studio</span>
                      <p className="text-fuchsia-300/70 text-sm font-normal">Instant results powered by AI</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white">
                      <Zap className="w-5 h-5 text-fuchsia-400" />
                      <span>Results in <span className="text-fuchsia-300 font-bold">seconds</span>, not weeks</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <DollarSign className="w-5 h-5 text-fuchsia-400" />
                      <span>Affordable packages from <span className="text-fuchsia-300 font-bold">$99</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <CheckCircle2 className="w-5 h-5 text-fuchsia-400" />
                      <span>AI trained on <span className="text-fuchsia-300 font-bold">1M+ premium designs</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <Clock className="w-5 h-5 text-fuchsia-400" />
                      <span>Instant updates & multiple revisions</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowComparison(false)}
                    className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white py-6 mt-4 shadow-xl shadow-fuchsia-500/30 font-bold text-base"
                  >
                    Design with AI
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Human Designer */}
              <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-2 border-zinc-600/80 relative overflow-hidden shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-zinc-500/50">
                      <User className="w-7 h-7 text-zinc-300" />
                    </div>
                    <div>
                      <span className="text-xl font-bold">Professional Designer</span>
                      <p className="text-zinc-400 text-sm font-normal">Human expertise & consultation</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-zinc-200">
                      <Clock className="w-5 h-5 text-zinc-400" />
                      <span>Takes more time for personalized results</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-200">
                      <DollarSign className="w-5 h-5 text-zinc-400" />
                      <span>Custom pricing based on project scope</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-200">
                      <User className="w-5 h-5 text-zinc-400" />
                      <span>Personal consultation & human expertise</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-200">
                      <CheckCircle2 className="w-5 h-5 text-zinc-400" />
                      <span>Ideal for complex, large-scale projects</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setIsInquiryOpen(true)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-zinc-500/50 py-6 mt-4 font-bold text-base"
                  >
                    Contact Designer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick AI Packages Section */}
            <div className="mt-12">
              <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-6">
                Or Choose a Quick AI Package
              </h3>
              <p className="text-zinc-400 text-center mb-8 max-w-2xl mx-auto">
                Get instant designs with our ready-to-go packages. Pay once, download immediately.
              </p>
              
              <div className="grid md:grid-cols-4 gap-4">
                {packages.map((pkg) => (
                  <Card 
                    key={pkg.id}
                    className={`relative cursor-pointer transition-all hover:scale-105 ${
                      pkg.recommended 
                        ? "bg-gradient-to-br from-fuchsia-900/40 to-purple-900/40 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/20" 
                        : "bg-zinc-900/50 border-zinc-700 hover:border-zinc-500"
                    }`}
                    onClick={() => {
                      if (pkg.id === "enterprise") {
                        setIsInquiryOpen(true);
                      } else {
                        setSelectedPackage(pkg.id);
                        setShowComparison(false);
                      }
                    }}
                  >
                    {pkg.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-fuchsia-500 text-white text-xs">POPULAR</Badge>
                      </div>
                    )}
                    <CardContent className="pt-6 text-center">
                      <h4 className="text-white font-semibold mb-2">{pkg.name}</h4>
                      <p className="text-zinc-500 text-xs mb-3">{pkg.sizeRange}</p>
                      <p className="text-2xl font-bold text-fuchsia-400 mb-3">
                        {pkg.price > 0 ? `$${pkg.price}` : "Get Quote"}
                      </p>
                      <ul className="text-xs text-zinc-400 space-y-1 text-left">
                        {pkg.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-fuchsia-400 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className={`w-full mt-4 ${
                          pkg.recommended 
                            ? "bg-fuchsia-500 hover:bg-fuchsia-600 text-white" 
                            : "bg-zinc-800 hover:bg-zinc-700 text-white"
                        }`}
                        size="sm"
                      >
                        {pkg.price > 0 ? "Select" : "Contact Us"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                      
                      
                      <Button 
                        onClick={generateDesign}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white py-6"
                      >
                        {isProcessing ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Creating Your Design...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Design
                          </>
                        )}
                      </Button>
                      
                      {/* Payment info */}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                        <p className="text-blue-300 text-sm">
                          ℹ️ Payment will be enabled soon. Preview mode can generate designs without payment.
                        </p>
                      </div>

                      {/* Clear session button for testing */}
                      {canBypassPayment && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            Object.keys(sessionStorage).forEach(key => {
                              if (key.startsWith('interior-design-')) {
                                sessionStorage.removeItem(key);
                              }
                            });
                            setStep(1);
                            setShowComparison(true);
                            setPropertyType("");
                            setPropertyName("");
                            setPropertySize("");
                            setKnowsSize(null);
                            setDesignStyle("");
                            setColorPalette("");
                            setPurpose("");
                            setCustomNotes("");
                            setSelectedPackage("");
                            setDesignResult(null);
                            toast.success("Session cleared for fresh testing");
                          }}
                          className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-300"
                        >
                          Clear Session & Start Over
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
                  {/* Design Render Preview */}
                  <div className="rounded-xl overflow-hidden border border-fuchsia-500/20 bg-zinc-950">
                    {designResult.images?.[0] ? (
                      <img
                        src={designResult.images[0]}
                        alt={`AI interior design render for ${propertyName || "your property"}`}
                        className="w-full aspect-video object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-fuchsia-900/30 to-purple-900/30 flex items-center justify-center">
                        <div className="text-center">
                          <Sparkles className="w-16 h-16 text-fuchsia-400 mx-auto mb-4" />
                          <p className="text-white font-medium text-lg">Design Preview</p>
                          <p className="text-zinc-500 text-sm mt-2">
                            Your AI-generated interior design for {propertyName || "Your Property"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={downloadPdf}
                      className="border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadImages}
                      className="border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Images
                    </Button>
                    <Button
                      onClick={requestRevision}
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
