import { useState, useRef } from "react";
import VideoBackground from "@/components/VideoBackground";
import { motion } from "framer-motion";
import { 
  Home, Search, TrendingUp, FileText, Download, Upload, Building, MapPin, 
  Calendar, User, Mail, Phone, Sparkles, AlertCircle, CheckCircle, Camera, 
  Image as ImageIcon, DollarSign, Hammer, Package, Info, ChevronRight,
  HelpCircle, Star, Wrench, Paintbrush, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FounderContent } from "@/components/FounderContent";
import LegalDisclaimer from "@/components/LegalDisclaimer";

interface PropertyDetails {
  buildingName: string;
  unitNumber: string;
  community: string;
  subCommunity: string;
  propertyType: 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'studio';
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  sizeInternal: number;
  balconySize: number;
  carpetArea: number;
  serviceCharge: number;
  handoverYear: number;
  developer: string;
  views: string[];
  floor: number;
  furnishedStatus: 'furnished' | 'semi-furnished' | 'unfurnished';
  hasModifications: 'stock' | 'modified';
  modificationType: 'renovation' | 'fitout' | 'upgrade' | '';
  renovations: string;
  renovationCost: number;
  renovationPhotos: string[];
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  propertyPhotos: string[];
}

interface EvaluationResult {
  estimatedValue: {
    low: number;
    mid: number;
    high: number;
    pricePerSqFt: number;
  };
  premiums: {
    viewPremium: number;
    floorPremium: number;
    locationPremium: number;
    renovationValue: number;
    furnishedPremium: number;
  };
  comparables: {
    date: string;
    price: number;
    size: number;
    building: string;
  }[];
  marketInsights: string;
  confidence: string;
  communityAverage: number;
  disclaimer: string;
  sources?: string;
}

const defaultProperty: PropertyDetails = {
  buildingName: '',
  unitNumber: '',
  community: '',
  subCommunity: '',
  propertyType: 'apartment',
  bedrooms: 2,
  bathrooms: 2,
  parkingSpaces: 1,
  sizeInternal: 0,
  balconySize: 0,
  carpetArea: 0,
  serviceCharge: 0,
  handoverYear: 2020,
  developer: '',
  views: [],
  floor: 0,
  furnishedStatus: 'unfurnished',
  hasModifications: 'stock',
  modificationType: '',
  renovations: '',
  renovationCost: 0,
  renovationPhotos: [],
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  propertyPhotos: []
};

const dubaiCommunities = [
  'Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay',
  'JBR (Jumeirah Beach Residence)', 'DIFC', 'Dubai Hills Estate', 
  'Arabian Ranches', 'Arabian Ranches 2', 'Arabian Ranches 3',
  'Jumeirah', 'Jumeirah Islands', 'Jumeirah Park', 'Jumeirah Village Circle (JVC)',
  'Jumeirah Village Triangle (JVT)', 'Jumeirah Lake Towers (JLT)',
  'DAMAC Hills', 'DAMAC Hills 2', 'Dubai Creek Harbour', 
  'Mohammed Bin Rashid City (MBR City)', 'Sobha Hartland',
  'Dubai South', 'Dubai Production City', 'Dubai Sports City',
  'Al Barsha', 'Al Barsha South', 'Mirdif', 'Dubai Silicon Oasis',
  'Motor City', 'Green Community', 'The Greens', 'The Views',
  'The Springs', 'The Meadows', 'The Lakes', 'Emirates Hills',
  'Al Furjan', 'Discovery Gardens', 'International City',
  'Dubai Investment Park', 'City Walk', 'La Mer', 'Bluewaters Island',
  'Palm Jebel Ali', 'Dubai Islands', 'Emaar Beachfront',
  'Port de La Mer', 'Madinat Jumeirah Living', 'Tilal Al Ghaf',
  'The Valley', 'Town Square', 'Reem', 'Akoya Oxygen',
  // Abu Dhabi
  'Al Reem Island', 'Saadiyat Island', 'Yas Island', 'Al Raha Beach',
  'Al Maryah Island', 'Khalifa City', 'Mohammed Bin Zayed City',
  'Al Reef', 'Al Ghadeer', 'Masdar City',
  // Sharjah & Northern Emirates
  'Al Khan (Sharjah)', 'Al Mamzar (Sharjah)', 'Aljada (Sharjah)',
  'Al Hamra Village (RAK)', 'Mina Al Arab (RAK)',
  'Ajman Downtown', 'Emirates City (Ajman)',
];

const viewOptions = [
  'Sea View', 'Marina View', 'Burj Khalifa View', 'City View',
  'Garden View', 'Pool View', 'Golf View', 'Canal View', 'Palm View'
];

// LOCKED blue theme classes — never use gold hover on evaluator cards
const blueCard = "hover:border-blue-400/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:scale-[1.01] transition-all duration-300";
const blueCardPrimary = `bg-blue-900/20 border-blue-500/30 ${blueCard}`;
const blueCardSecondary = `bg-[#FDFBF7]/50 border-[#1A1A1A] ${blueCard}`;

const PropertyEvaluator = () => {
  const [property, setProperty] = useState<PropertyDetails>(defaultProperty);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [activeTab, setActiveTab] = useState('property');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [communitySearch, setCommunitySearch] = useState('');
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const renovationPhotoRef = useRef<HTMLInputElement>(null);

  const filteredCommunities = dubaiCommunities.filter(c => 
    c.toLowerCase().includes(communitySearch.toLowerCase())
  );

  const updateProperty = (field: keyof PropertyDetails, value: any) => {
    setProperty(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'property' | 'renovation') => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (type === 'property') {
          setProperty(prev => ({ ...prev, propertyPhotos: [...prev.propertyPhotos, ev.target?.result as string] }));
        } else {
          setProperty(prev => ({ ...prev, renovationPhotos: [...prev.renovationPhotos, ev.target?.result as string] }));
        }
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} photo(s) added`);
  };

  const removePhoto = (index: number, type: 'property' | 'renovation') => {
    if (type === 'property') {
      setProperty(prev => ({ ...prev, propertyPhotos: prev.propertyPhotos.filter((_, i) => i !== index) }));
    } else {
      setProperty(prev => ({ ...prev, renovationPhotos: prev.renovationPhotos.filter((_, i) => i !== index) }));
    }
  };

  const evaluateProperty = async () => {
    if (!property.buildingName || !property.community || !property.sizeInternal) {
      toast.error("Please fill in building name, community, and internal size");
      return;
    }
    setIsEvaluating(true);
    toast.loading("AI analyzing property using DLD & RERA data...");
    try {
      const { data, error } = await supabase.functions.invoke('property-evaluation', {
        body: { property }
      });
      if (error) throw error;
      setEvaluation(data);
      setReportGenerated(true);
      toast.dismiss();
      toast.success("Property evaluation complete!");
      setActiveTab('results');
    } catch (error) {
      console.error('Evaluation error:', error);
      toast.dismiss();
      toast.error("Failed to evaluate property. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const generatePDFReport = async () => {
    if (!evaluation) return;
    toast.loading("Generating comprehensive PDF report...");
    const midValue = evaluation.estimatedValue.mid;
    const lowValue = evaluation.estimatedValue.low;
    const highValue = evaluation.estimatedValue.high;
    const pricePerSqFt = evaluation.estimatedValue.pricePerSqFt;

    const reportContent = `
PROPERTY VALUATION REPORT
Generated by JBJ Global Real Estate AI Property Evaluator
Date: ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════════════

PROPERTY OVERVIEW
─────────────────
Building: ${property.buildingName}
Unit: ${property.unitNumber}
Community: ${property.community}, ${property.subCommunity}
Type: ${property.propertyType.toUpperCase()}
Developer: ${property.developer}

SPECIFICATIONS
──────────────
Bedrooms: ${property.bedrooms}
Bathrooms: ${property.bathrooms}
Internal Size: ${property.sizeInternal.toLocaleString()} sq ft
Balcony: ${property.balconySize} sq ft
Parking: ${property.parkingSpaces} space(s)
Floor: ${property.floor}
Views: ${property.views.join(', ') || 'N/A'}
Furnished: ${property.furnishedStatus}
Handover: ${property.handoverYear}
Service Charge: AED ${property.serviceCharge}/sq ft

VALUATION SUMMARY
─────────────────
ESTIMATED MARKET VALUE: AED ${lowValue.toLocaleString()} — AED ${highValue.toLocaleString()}
Mid Estimate: AED ${midValue.toLocaleString()}
Price per Sq Ft: AED ${pricePerSqFt.toLocaleString()}
Confidence Level: ${evaluation.confidence.toUpperCase()}

VALUE PREMIUMS:
• View Premium: AED ${evaluation.premiums.viewPremium.toLocaleString()}
• Floor Premium: AED ${evaluation.premiums.floorPremium.toLocaleString()}
• Location Premium: AED ${evaluation.premiums.locationPremium.toLocaleString()}
• Furnished Premium: AED ${evaluation.premiums.furnishedPremium.toLocaleString()}
${evaluation.premiums.renovationValue > 0 ? `• Modification Value: AED ${evaluation.premiums.renovationValue.toLocaleString()}` : ''}

COMPARABLE TRANSACTIONS (DLD Data)
──────────────────────────────────
${evaluation.comparables.map(t => 
  `• ${t.building} - AED ${t.price.toLocaleString()} (${t.size} sq ft) - ${t.date}`
).join('\n')}

MARKET INSIGHTS
───────────────
${evaluation.marketInsights}

${evaluation.sources ? `SOURCES: ${evaluation.sources}` : ''}

═══════════════════════════════════════════════════════════════

DISCLAIMER
${evaluation.disclaimer}

Report generated by JBJ Global Real Estate
www.jbj.ae | CONTACT@JBJ.AE | +971 56 591 1000
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Property_Valuation_${property.buildingName}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    toast.dismiss();
    toast.success("Report downloaded successfully!");
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Hero Section with Video */}
      <div className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <VideoBackground 
          src="/videos/burj-khalifa-day-to-night.mp4"
          poster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
          opacity={0.3}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-black/70 to-black" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center px-4 py-16"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/40 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 text-sm font-semibold">AI-Powered Valuation</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Property <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Evaluator</span>
          </h1>
          <p className="text-xl text-white/85 max-w-2xl mx-auto mb-2">
            Get an AI-powered property valuation based on DLD transaction data, RERA Rental Index, and institutional market analysis.
          </p>
          <p className="text-sm text-white/90 max-w-xl mx-auto">
            Sources: DLD Public Records · RERA · JBJ Analysis Framework
          </p>
          <FounderContent>
            <div className="text-center mt-4">
              <p className="text-white/85 text-sm font-medium">Jane Bou Jaoude</p>
              <p className="text-blue-400 text-xs mt-0.5">Founder & CEO</p>
              <p className="text-white/90 text-xs mt-0.5">JBJ Global Real Estate</p>
            </div>
          </FounderContent>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto bg-[#FDFBF7] border border-blue-500/30 mb-8">
            <TabsTrigger value="property" className="data-[state=active]:bg-blue-500 data-[state=active]:text-[#1A1A1A] text-white/70">
              Property Details
            </TabsTrigger>
            <TabsTrigger value="modifications" className="data-[state=active]:bg-blue-500 data-[state=active]:text-[#1A1A1A] text-white/70">
              Modifications
            </TabsTrigger>
            <TabsTrigger value="owner" className="data-[state=active]:bg-blue-500 data-[state=active]:text-[#1A1A1A] text-white/70">
              Owner Info
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!evaluation} className="data-[state=active]:bg-blue-500 data-[state=active]:text-[#1A1A1A] text-white/70">
              Results
            </TabsTrigger>
          </TabsList>

          {/* Property Details Tab */}
          <TabsContent value="property">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className={blueCardPrimary}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-400" />
                    Property Information
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Enter your property's basic details for accurate valuation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-white/85 flex items-center gap-1">
                        Building Name <span className="text-blue-400">*</span>
                        <HelpCircle className="w-3 h-3 text-white/90" />
                      </Label>
                      <Input
                        value={property.buildingName}
                        onChange={(e) => updateProperty('buildingName', e.target.value)}
                        placeholder="e.g., Burj Vista Tower 1"
                        className="bg-[#FDFBF7]/50 border-blue-500/30 text-white placeholder:text-[#1A1A1A]/70 hover:border-blue-500/50 focus:border-blue-400"
                      />
                      <p className="text-xs text-white/90">Official building name as registered</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/85 flex items-center gap-1">
                        Unit Number
                        <HelpCircle className="w-3 h-3 text-white/90" />
                      </Label>
                      <Input
                        value={property.unitNumber}
                        onChange={(e) => updateProperty('unitNumber', e.target.value)}
                        placeholder="e.g., 1505 or 15-A"
                        className="bg-[#FDFBF7]/50 border-blue-500/30 text-white placeholder:text-[#1A1A1A]/70 hover:border-blue-500/50 focus:border-blue-400"
                      />
                      <p className="text-xs text-white/90">As shown on title deed</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-white/70 flex items-center gap-1">
                        Community <span className="text-blue-400">*</span>
                        <Search className="w-3 h-3 text-[#1A1A1A]/70" />
                      </Label>
                      <div className="relative">
                        <Input
                          value={communitySearch}
                          onChange={(e) => setCommunitySearch(e.target.value)}
                          placeholder="Search community..."
                          className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 mb-1"
                        />
                        {communitySearch && (
                          <div className="absolute z-50 w-full max-h-48 overflow-y-auto bg-[#F7F2EA] border border-[#1A1A1A] rounded-md shadow-xl">
                            {filteredCommunities.length > 0 ? (
                              filteredCommunities.map(c => (
                                <button
                                  key={c}
                                  onClick={() => {
                                    updateProperty('community', c);
                                    setCommunitySearch('');
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-500/20 transition-colors"
                                >
                                  {c}
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-2 text-sm text-white/90">No communities found</p>
                            )}
                          </div>
                        )}
                        {property.community && !communitySearch && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                            {property.community}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/70">Sub-Community / Tower</Label>
                      <Input
                        value={property.subCommunity}
                        onChange={(e) => updateProperty('subCommunity', e.target.value)}
                        placeholder="e.g., Tower 2, Phase 1"
                        className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70">Property Type</Label>
                      <Select value={property.propertyType} onValueChange={(v: any) => updateProperty('propertyType', v)}>
                        <SelectTrigger className="bg-[#F7F2EA] border-[#1A1A1A] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#F7F2EA] border-[#1A1A1A]">
                          <SelectItem value="studio" className="text-white">Studio</SelectItem>
                          <SelectItem value="apartment" className="text-white">Apartment</SelectItem>
                          <SelectItem value="penthouse" className="text-white">Penthouse</SelectItem>
                          <SelectItem value="townhouse" className="text-white">Townhouse</SelectItem>
                          <SelectItem value="villa" className="text-white">Villa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/70">Developer</Label>
                      <Input
                        value={property.developer}
                        onChange={(e) => updateProperty('developer', e.target.value)}
                        placeholder="e.g., Emaar, DAMAC, Sobha"
                        className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/70">Views (Select all that apply)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {viewOptions.map(view => (
                        <button
                          key={view}
                          onClick={() => {
                            const views = property.views.includes(view)
                              ? property.views.filter(v => v !== view)
                              : [...property.views, view];
                            updateProperty('views', views);
                          }}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                            property.views.includes(view)
                              ? 'bg-blue-500 border-blue-500 text-white font-medium'
                              : 'border-[#1A1A1A] text-white/70 hover:border-blue-500/50 hover:text-blue-400'
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card className={blueCardSecondary}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    Specifications
                  </CardTitle>
                  <CardDescription className="text-white/90">
                    Property measurements and details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white/70 text-sm">Bedrooms</Label>
                      <Input type="number" value={property.bedrooms} onChange={(e) => updateProperty('bedrooms', parseInt(e.target.value) || 0)} className="bg-[#F7F2EA] border-[#1A1A1A] text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Bathrooms</Label>
                      <Input type="number" value={property.bathrooms} onChange={(e) => updateProperty('bathrooms', parseInt(e.target.value) || 0)} className="bg-[#F7F2EA] border-[#1A1A1A] text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Parking</Label>
                      <Input type="number" value={property.parkingSpaces} onChange={(e) => updateProperty('parkingSpaces', parseInt(e.target.value) || 0)} className="bg-[#F7F2EA] border-[#1A1A1A] text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-white/70 text-sm flex items-center gap-1">
                        Internal Size (sq ft) <span className="text-blue-400">*</span>
                      </Label>
                      <Input type="number" value={property.sizeInternal || ''} onChange={(e) => updateProperty('sizeInternal', parseInt(e.target.value) || 0)} placeholder="e.g., 1200" className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70" />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Balcony (sq ft)</Label>
                      <Input type="number" value={property.balconySize || ''} onChange={(e) => updateProperty('balconySize', parseInt(e.target.value) || 0)} placeholder="e.g., 100" className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70 text-sm">Carpet Area (sq ft)</Label>
                      <Input type="number" value={property.carpetArea || ''} onChange={(e) => updateProperty('carpetArea', parseInt(e.target.value) || 0)} className="bg-[#F7F2EA] border-[#1A1A1A] text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Floor Level</Label>
                      <Input type="number" value={property.floor || ''} onChange={(e) => updateProperty('floor', parseInt(e.target.value) || 0)} className="bg-[#F7F2EA] border-[#1A1A1A] text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70 text-sm">Service Charge (AED/sq ft)</Label>
                      <Input type="number" value={property.serviceCharge || ''} onChange={(e) => updateProperty('serviceCharge', parseInt(e.target.value) || 0)} className="bg-[#F7F2EA] border-[#1A1A1A] text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Handover Year</Label>
                      <Input type="number" value={property.handoverYear} onChange={(e) => updateProperty('handoverYear', parseInt(e.target.value) || 2020)} className="bg-[#F7F2EA] border-[#1A1A1A] text-white" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/70 text-sm">Furnished Status</Label>
                    <Select value={property.furnishedStatus} onValueChange={(v: any) => updateProperty('furnishedStatus', v)}>
                      <SelectTrigger className="bg-[#F7F2EA] border-[#1A1A1A] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#F7F2EA] border-[#1A1A1A]">
                        <SelectItem value="unfurnished" className="text-white">Unfurnished</SelectItem>
                        <SelectItem value="semi-furnished" className="text-white">Semi-Furnished</SelectItem>
                        <SelectItem value="furnished" className="text-white">Fully Furnished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Property Photos */}
              <Card className={`${blueCardSecondary} md:col-span-2`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-400" />
                    Property Photos
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    <span className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <span>
                        Upload interior photos to enhance your valuation report. 
                        <strong className="text-white"> If you don't have photos</strong>, 
                        we'll use external building images from public sources for the report.
                      </span>
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'property')} />
                  <div className="flex flex-wrap gap-4">
                    {property.propertyPhotos.map((photo, i) => (
                      <div key={i} className="relative w-28 h-28 rounded-lg overflow-hidden group border border-[#1A1A1A]">
                        <img src={photo} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removePhoto(i, 'property')} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-medium">Remove</span>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => photoInputRef.current?.click()} className="w-28 h-28 border-2 border-dashed border-[#1A1A1A] rounded-lg flex flex-col items-center justify-center hover:border-blue-400/50 transition-colors group">
                      <Camera className="w-6 h-6 text-white/90 group-hover:text-blue-400 mb-1" />
                      <span className="text-xs text-white/90 group-hover:text-blue-400">Add Photos</span>
                    </button>
                  </div>
                  {property.propertyPhotos.length === 0 && (
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-300 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        No photos uploaded - report will include building exterior images
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-8">
              <Button onClick={() => setActiveTab('modifications')} className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8">
                Next: Property Condition & Modifications
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Modifications Tab */}
          <TabsContent value="modifications">
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className={blueCardSecondary}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    Property Condition
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Has your property been modified since the original developer handover?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup 
                    value={property.hasModifications} 
                    onValueChange={(v: 'stock' | 'modified') => {
                      updateProperty('hasModifications', v);
                      if (v === 'stock') {
                        updateProperty('modificationType', '');
                        updateProperty('renovations', '');
                        updateProperty('renovationCost', 0);
                      }
                    }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      property.hasModifications === 'stock' ? 'border-blue-500 bg-blue-500/10' : 'border-[#1A1A1A] hover:border-blue-400/40'
                    }`}>
                      <RadioGroupItem value="stock" className="sr-only" />
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${property.hasModifications === 'stock' ? 'bg-blue-500' : 'bg-[#F7F2EA]'}`}>
                          <Package className={`w-5 h-5 ${property.hasModifications === 'stock' ? 'text-white' : 'text-white/70'}`} />
                        </div>
                        <div>
                          <p className="text-white font-semibold">Original Stock Condition</p>
                          <p className="text-xs text-white/90">As delivered by developer</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/70 mt-2">Property is in the original condition from developer handover.</p>
                      {property.hasModifications === 'stock' && <Badge className="absolute top-2 right-2 bg-blue-500 text-white">Selected</Badge>}
                    </label>

                    <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      property.hasModifications === 'modified' ? 'border-blue-500 bg-blue-500/10' : 'border-[#1A1A1A] hover:border-blue-400/40'
                    }`}>
                      <RadioGroupItem value="modified" className="sr-only" />
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${property.hasModifications === 'modified' ? 'bg-blue-500' : 'bg-[#F7F2EA]'}`}>
                          <Wrench className={`w-5 h-5 ${property.hasModifications === 'modified' ? 'text-white' : 'text-white/70'}`} />
                        </div>
                        <div>
                          <p className="text-white font-semibold">Modified / Upgraded</p>
                          <p className="text-xs text-white/90">Has add-ons or changes</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/70 mt-2">Property has been modified with renovations, fit-outs, or upgrades.</p>
                      {property.hasModifications === 'modified' && <Badge className="absolute top-2 right-2 bg-blue-500 text-white">Selected</Badge>}
                    </label>
                  </RadioGroup>

                  {property.hasModifications === 'stock' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-emerald-300 font-medium">Stock Property Valuation</p>
                          <p className="text-sm text-white/70 mt-1">Your property will be valued at the standard market rate based on DLD comparable transactions.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {property.hasModifications === 'modified' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={blueCardSecondary}>
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Modification Details
                      </CardTitle>
                      <CardDescription className="text-white/70">Documenting modifications can add 5-15% to your property's valuation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="text-white/70 mb-3 block">Type of Modification</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'renovation', label: 'Full Renovation', icon: Hammer, desc: 'Major structural or design changes' },
                            { value: 'fitout', label: 'Custom Fit-Out', icon: Paintbrush, desc: 'Upgraded finishes & fixtures' },
                            { value: 'upgrade', label: 'Smart Upgrades', icon: Star, desc: 'Technology & appliance upgrades' }
                          ].map(type => (
                            <button
                              key={type.value}
                              onClick={() => updateProperty('modificationType', type.value)}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                property.modificationType === type.value ? 'border-blue-500 bg-blue-500/10' : 'border-[#1A1A1A] hover:border-blue-400/40'
                              }`}
                            >
                              <type.icon className={`w-5 h-5 mb-2 ${property.modificationType === type.value ? 'text-blue-400' : 'text-white/70'}`} />
                              <p className={`text-sm font-medium ${property.modificationType === type.value ? 'text-white' : 'text-white/85'}`}>{type.label}</p>
                              <p className="text-xs text-white/90 mt-0.5">{type.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-white/70">Describe the modifications in detail</Label>
                        <Textarea
                          value={property.renovations}
                          onChange={(e) => updateProperty('renovations', e.target.value)}
                          placeholder="e.g., Full kitchen renovation with imported Italian marble countertops..."
                          className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 min-h-[120px] mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-white/70 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Total Investment Made (AED)
                        </Label>
                        <Input type="number" value={property.renovationCost || ''} onChange={(e) => updateProperty('renovationCost', parseInt(e.target.value) || 0)} placeholder="e.g., 150000" className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 mt-2" />
                        <p className="text-xs text-white/90 mt-1">Include all costs: materials, labor, permits, and professional fees</p>
                      </div>

                      <div>
                        <Label className="text-white/70">Upload Before/After Photos or Receipts</Label>
                        <p className="text-xs text-white/90 mb-3">Photos documenting your upgrades help validate the added value</p>
                        <input ref={renovationPhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'renovation')} />
                        <div className="flex flex-wrap gap-4">
                          {property.renovationPhotos.map((photo, i) => (
                            <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden group border border-[#1A1A1A]">
                              <img src={photo} alt={`Renovation ${i + 1}`} className="w-full h-full object-cover" />
                              <button onClick={() => removePhoto(i, 'renovation')} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs">Remove</span>
                              </button>
                            </div>
                          ))}
                          <button onClick={() => renovationPhotoRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-[#1A1A1A] rounded-lg flex flex-col items-center justify-center hover:border-blue-400/50 transition-colors group">
                            <Upload className="w-5 h-5 text-white/90 group-hover:text-blue-400 mb-1" />
                            <span className="text-xs text-white/90 group-hover:text-blue-400">Add</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-blue-300 flex items-start gap-2">
                          <Star className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>
                            <strong>Value Add:</strong> Documented modifications typically add 5-15% to your property's market value. Premium finishes from recognized brands and smart home features command the highest premiums.
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={() => setActiveTab('property')} variant="outline" className="border-[#1A1A1A]">← Back</Button>
              <Button onClick={() => setActiveTab('owner')} className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8">
                Next: Owner Information <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Owner Info Tab */}
          <TabsContent value="owner">
            <Card className={`${blueCardSecondary} max-w-2xl mx-auto`}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Owner Information
                </CardTitle>
                <CardDescription className="text-white/70">Your details will be included in the property valuation report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white/70">Full Name <span className="text-blue-400">*</span></Label>
                  <Input value={property.ownerName} onChange={(e) => updateProperty('ownerName', e.target.value)} placeholder="John Smith" className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70" />
                </div>
                <div>
                  <Label className="text-white/70">Email <span className="text-blue-400">*</span></Label>
                  <Input type="email" value={property.ownerEmail} onChange={(e) => updateProperty('ownerEmail', e.target.value)} placeholder="john@email.com" className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70" />
                </div>
                <div>
                  <Label className="text-white/70">Phone <span className="text-blue-400">*</span></Label>
                  <Input value={property.ownerPhone} onChange={(e) => updateProperty('ownerPhone', e.target.value)} placeholder="+971 50 123 4567" className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70" />
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Your Privacy is Protected</p>
                      <p className="text-sm text-white/70 mt-1">Your contact details are only used in the valuation report and will not be shared with third parties.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={() => setActiveTab('modifications')} variant="outline" className="border-[#1A1A1A]">← Back</Button>
              <Button onClick={evaluateProperty} disabled={isEvaluating} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium px-8">
                {isEvaluating ? (
                  <><Sparkles className="w-4 h-4 mr-2 animate-pulse" />Evaluating Property...</>
                ) : (
                  <><Search className="w-4 h-4 mr-2" />Get AI Valuation</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {evaluation && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Main Valuation Card */}
                <Card className={`bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30 max-w-3xl mx-auto ${blueCard}`}>
                  <CardContent className="pt-8 text-center">
                    <p className="text-blue-400 text-sm uppercase tracking-wider mb-2">Estimated Market Value</p>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-2xl text-price-orange/80">AED {evaluation.estimatedValue.low.toLocaleString()}</span>
                      <span className="text-[#1A1A1A]/70">—</span>
                      <span className="text-5xl font-bold text-price-orange">AED {evaluation.estimatedValue.mid.toLocaleString()}</span>
                      <span className="text-[#1A1A1A]/70">—</span>
                      <span className="text-2xl text-price-orange/80">AED {evaluation.estimatedValue.high.toLocaleString()}</span>
                    </div>
                    <p className="text-white/70">
                      AED {evaluation.estimatedValue.pricePerSqFt.toLocaleString()} per sq ft · Community avg: AED {evaluation.communityAverage.toLocaleString()}/sq ft
                    </p>
                    <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full ${
                      evaluation.confidence === 'High' ? 'bg-green-500/20 text-green-400'
                        : evaluation.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {evaluation.confidence === 'High' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {evaluation.confidence} Confidence
                    </div>
                    
                    {evaluation.premiums.renovationValue > 0 && (
                      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg inline-block">
                        <p className="text-blue-400 text-sm">
                          <Star className="w-4 h-4 inline mr-1" />
                          Modifications added <strong>AED {evaluation.premiums.renovationValue.toLocaleString()}</strong> to your property value
                        </p>
                      </div>
                    )}

                    {evaluation.sources && (
                      <p className="text-xs text-white/90 mt-4">{evaluation.sources}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Value Breakdown */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <Card className={blueCardSecondary}>
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Value Premiums
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/70">View Premium</span>
                        <span className="text-green-400">+AED {evaluation.premiums.viewPremium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Floor Premium</span>
                        <span className="text-green-400">+AED {evaluation.premiums.floorPremium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Location Premium</span>
                        <span className="text-green-400">+AED {evaluation.premiums.locationPremium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Furnished Premium</span>
                        <span className="text-green-400">+AED {evaluation.premiums.furnishedPremium.toLocaleString()}</span>
                      </div>
                      {evaluation.premiums.renovationValue > 0 && (
                        <div className="flex justify-between pt-2 border-t border-[#1A1A1A]">
                          <span className="text-white/70">Modification Value</span>
                          <span className="text-blue-400 font-medium">+AED {evaluation.premiums.renovationValue.toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className={blueCardSecondary}>
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Market Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/70 text-sm leading-relaxed">{evaluation.marketInsights}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparable Transactions */}
                <Card className={`${blueCardSecondary} max-w-4xl mx-auto`}>
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-400" />
                      Comparable Transactions (DLD Data)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {evaluation.comparables.map((t, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-[#F7F2EA]/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{t.building}</p>
                            <p className="text-white/90 text-sm">{t.size} sq ft · {t.date}</p>
                          </div>
                          <p className="text-price-orange font-semibold">AED {t.price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Disclaimer */}
                <div className="max-w-4xl mx-auto p-4 bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-lg">
                  <p className="text-xs text-white/90 text-center">{evaluation.disclaimer}</p>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                  <Button onClick={generatePDFReport} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    onClick={() => {
                      const shareText = `Property Valuation: ${property.buildingName} - AED ${evaluation.estimatedValue.low.toLocaleString()} to ${evaluation.estimatedValue.high.toLocaleString()}`;
                      window.location.href = `https://wa.me/971565911000?text=${encodeURIComponent(shareText)}`;
                    }}
                  >
                    Share with JJ Advisor
                  </Button>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        <LegalDisclaimer variant="ai-tools" className="mt-8" />
        <LegalDisclaimer variant="investment" className="mt-4" />
      </div>
    </section>
  );
};

export default PropertyEvaluator;
