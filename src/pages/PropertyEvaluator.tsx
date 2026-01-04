import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Home, Search, TrendingUp, FileText, Download, Upload, Building, MapPin, Calendar, User, Mail, Phone, Sparkles, AlertCircle, CheckCircle, Camera, Image as ImageIcon, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

interface PropertyDetails {
  // Property Info
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
  
  // Add-ons/Renovations
  renovations: string;
  renovationCost: number;
  renovationPhotos: string[];
  
  // Owner Info
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  
  // Property Photos
  propertyPhotos: string[];
}

interface EvaluationResult {
  estimatedValue: number;
  pricePerSqFt: number;
  confidence: 'high' | 'medium' | 'low';
  comparableTransactions: {
    date: string;
    price: number;
    size: number;
    building: string;
  }[];
  marketInsights: string;
  addOnValue: number;
  breakdown: {
    baseValue: number;
    locationPremium: number;
    viewPremium: number;
    floorPremium: number;
    renovationValue: number;
  };
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
  'JBR', 'DIFC', 'Dubai Hills Estate', 'Arabian Ranches', 'Jumeirah',
  'JLT', 'DAMAC Hills', 'Dubai Creek Harbour', 'MBR City', 'JVC',
  'Dubai South', 'Al Barsha', 'Mirdif', 'Dubai Silicon Oasis'
];

const viewOptions = [
  'Sea View', 'Marina View', 'Burj Khalifa View', 'City View',
  'Garden View', 'Pool View', 'Golf View', 'Canal View', 'Palm View'
];

const PropertyEvaluator = () => {
  const [property, setProperty] = useState<PropertyDetails>(defaultProperty);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [activeTab, setActiveTab] = useState('property');
  const [reportGenerated, setReportGenerated] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const renovationPhotoRef = useRef<HTMLInputElement>(null);

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
          setProperty(prev => ({
            ...prev,
            propertyPhotos: [...prev.propertyPhotos, ev.target?.result as string]
          }));
        } else {
          setProperty(prev => ({
            ...prev,
            renovationPhotos: [...prev.renovationPhotos, ev.target?.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} photo(s) added`);
  };

  const removePhoto = (index: number, type: 'property' | 'renovation') => {
    if (type === 'property') {
      setProperty(prev => ({
        ...prev,
        propertyPhotos: prev.propertyPhotos.filter((_, i) => i !== index)
      }));
    } else {
      setProperty(prev => ({
        ...prev,
        renovationPhotos: prev.renovationPhotos.filter((_, i) => i !== index)
      }));
    }
  };

  const evaluateProperty = async () => {
    if (!property.buildingName || !property.community || !property.sizeInternal) {
      toast.error("Please fill in at least building name, community, and size");
      return;
    }

    setIsEvaluating(true);
    toast.loading("AI analyzing property and searching DLD transactions...");

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

    // Create report content
    const reportContent = `
PROPERTY VALUATION REPORT
Generated by JJ Global Capital AI Property Evaluator
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
ESTIMATED MARKET VALUE: AED ${evaluation.estimatedValue.toLocaleString()}
Price per Sq Ft: AED ${evaluation.pricePerSqFt.toLocaleString()}
Confidence Level: ${evaluation.confidence.toUpperCase()}

VALUE BREAKDOWN:
• Base Property Value: AED ${evaluation.breakdown.baseValue.toLocaleString()}
• Location Premium: AED ${evaluation.breakdown.locationPremium.toLocaleString()}
• View Premium: AED ${evaluation.breakdown.viewPremium.toLocaleString()}
• Floor Premium: AED ${evaluation.breakdown.floorPremium.toLocaleString()}
• Renovation Value Add: AED ${evaluation.breakdown.renovationValue.toLocaleString()}

${property.renovations ? `
RENOVATIONS & UPGRADES
──────────────────────
${property.renovations}
Investment Made: AED ${property.renovationCost.toLocaleString()}
Estimated Value Added: AED ${evaluation.addOnValue.toLocaleString()}
` : ''}

COMPARABLE TRANSACTIONS (DLD Data)
──────────────────────────────────
${evaluation.comparableTransactions.map(t => 
  `• ${t.building} - AED ${t.price.toLocaleString()} (${t.size} sq ft) - ${t.date}`
).join('\n')}

MARKET INSIGHTS
───────────────
${evaluation.marketInsights}

OWNER INFORMATION
─────────────────
Name: ${property.ownerName}
Email: ${property.ownerEmail}
Phone: ${property.ownerPhone}

═══════════════════════════════════════════════════════════════

DISCLAIMER
This valuation is an AI-generated estimate based on available market data 
and recent DLD transactions. For the most accurate valuation, we recommend:
• Consulting official DLD resources: https://dubailand.gov.ae
• Using Property Monitor or similar certified platforms
• Engaging a RERA-certified valuer for legal purposes

This report is for informational purposes only and should not be used 
as the sole basis for real estate investment decisions.

Report generated by JJ Global Capital
www.jjglobalcapital.com | info@jjglobalcapital.com
    `;

    // Create downloadable file
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-blue-900/30 border-b border-blue-500/20">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1 mb-4">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">AI-Powered Valuation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Property <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Evaluator</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Get an AI-powered property valuation based on DLD transaction data, comparable sales, and market analysis. Generate comprehensive reports for buyers or brokers.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto bg-zinc-900 mb-8">
            <TabsTrigger value="property">Property Details</TabsTrigger>
            <TabsTrigger value="renovations">Add-ons</TabsTrigger>
            <TabsTrigger value="owner">Owner Info</TabsTrigger>
            <TabsTrigger value="results" disabled={!evaluation}>Results</TabsTrigger>
          </TabsList>

          {/* Property Details Tab */}
          <TabsContent value="property">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-400" />
                    Property Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-400">Building Name *</Label>
                      <Input
                        value={property.buildingName}
                        onChange={(e) => updateProperty('buildingName', e.target.value)}
                        placeholder="e.g., Burj Vista"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Unit Number</Label>
                      <Input
                        value={property.unitNumber}
                        onChange={(e) => updateProperty('unitNumber', e.target.value)}
                        placeholder="e.g., 1505"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-400">Community *</Label>
                      <Select value={property.community} onValueChange={(v) => updateProperty('community', v)}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Select community" />
                        </SelectTrigger>
                        <SelectContent>
                          {dubaiCommunities.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400">Sub-Community</Label>
                      <Input
                        value={property.subCommunity}
                        onChange={(e) => updateProperty('subCommunity', e.target.value)}
                        placeholder="e.g., Tower 2"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-400">Property Type</Label>
                      <Select value={property.propertyType} onValueChange={(v: any) => updateProperty('propertyType', v)}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="penthouse">Penthouse</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400">Developer</Label>
                      <Input
                        value={property.developer}
                        onChange={(e) => updateProperty('developer', e.target.value)}
                        placeholder="e.g., Emaar"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-zinc-400">Views</Label>
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
                          className={`px-3 py-1 text-xs rounded-full border transition-all ${
                            property.views.includes(view)
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-zinc-700 text-zinc-400 hover:border-blue-500'
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
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-zinc-400">Bedrooms</Label>
                      <Input
                        type="number"
                        value={property.bedrooms}
                        onChange={(e) => updateProperty('bedrooms', parseInt(e.target.value))}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Bathrooms</Label>
                      <Input
                        type="number"
                        value={property.bathrooms}
                        onChange={(e) => updateProperty('bathrooms', parseInt(e.target.value))}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Parking</Label>
                      <Input
                        type="number"
                        value={property.parkingSpaces}
                        onChange={(e) => updateProperty('parkingSpaces', parseInt(e.target.value))}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-400">Internal Size (sq ft) *</Label>
                      <Input
                        type="number"
                        value={property.sizeInternal || ''}
                        onChange={(e) => updateProperty('sizeInternal', parseInt(e.target.value))}
                        placeholder="1200"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Balcony (sq ft)</Label>
                      <Input
                        type="number"
                        value={property.balconySize || ''}
                        onChange={(e) => updateProperty('balconySize', parseInt(e.target.value))}
                        placeholder="100"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-400">Carpet Area (sq ft)</Label>
                      <Input
                        type="number"
                        value={property.carpetArea || ''}
                        onChange={(e) => updateProperty('carpetArea', parseInt(e.target.value))}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Floor</Label>
                      <Input
                        type="number"
                        value={property.floor || ''}
                        onChange={(e) => updateProperty('floor', parseInt(e.target.value))}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-400">Service Charge (AED/sq ft)</Label>
                      <Input
                        type="number"
                        value={property.serviceCharge || ''}
                        onChange={(e) => updateProperty('serviceCharge', parseInt(e.target.value))}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Handover Year</Label>
                      <Input
                        type="number"
                        value={property.handoverYear}
                        onChange={(e) => updateProperty('handoverYear', parseInt(e.target.value))}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-zinc-400">Furnished Status</Label>
                    <Select value={property.furnishedStatus} onValueChange={(v: any) => updateProperty('furnishedStatus', v)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unfurnished">Unfurnished</SelectItem>
                        <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                        <SelectItem value="furnished">Fully Furnished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Property Photos */}
              <Card className="bg-zinc-900/50 border-zinc-800 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-400" />
                    Property Photos
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Upload interior photos. If not provided, external building photos will be used in the report.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 'property')}
                  />
                  <div className="flex flex-wrap gap-4">
                    {property.propertyPhotos.map((photo, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden group">
                        <img src={photo} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(i, 'property')}
                          className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <span className="text-white text-xs">Remove</span>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors"
                    >
                      <Camera className="w-6 h-6 text-zinc-500 mb-1" />
                      <span className="text-xs text-zinc-500">Add Photos</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-8">
              <Button onClick={() => setActiveTab('renovations')} className="bg-blue-600 hover:bg-blue-700">
                Next: Add-ons & Renovations →
              </Button>
            </div>
          </TabsContent>

          {/* Renovations Tab */}
          <TabsContent value="renovations">
            <Card className="bg-zinc-900/50 border-zinc-800 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Renovations & Upgrades
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Adding renovations helps us better estimate the property value. Include details about any upgrades you've made.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-zinc-400">Describe renovations/upgrades made</Label>
                  <Textarea
                    value={property.renovations}
                    onChange={(e) => updateProperty('renovations', e.target.value)}
                    placeholder="e.g., Full kitchen renovation with imported Italian marble countertops, upgraded bathroom fixtures, smart home automation system installed, custom built-in wardrobes..."
                    className="bg-zinc-800 border-zinc-700 min-h-[150px] mt-2"
                  />
                </div>

                <div>
                  <Label className="text-zinc-400">Total Renovation Investment (AED)</Label>
                  <Input
                    type="number"
                    value={property.renovationCost || ''}
                    onChange={(e) => updateProperty('renovationCost', parseInt(e.target.value))}
                    placeholder="e.g., 150000"
                    className="bg-zinc-800 border-zinc-700 mt-2"
                  />
                </div>

                <div>
                  <Label className="text-zinc-400">Renovation Photos (receipts/before-after)</Label>
                  <input
                    ref={renovationPhotoRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 'renovation')}
                  />
                  <div className="flex flex-wrap gap-4 mt-2">
                    {property.renovationPhotos.map((photo, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden group">
                        <img src={photo} alt={`Renovation ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(i, 'renovation')}
                          className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <span className="text-white text-xs">Remove</span>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => renovationPhotoRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                      <span className="text-xs text-zinc-500">Add</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    💡 <strong>Tip:</strong> Properties with documented renovations typically command 5-15% premium over base market value.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={() => setActiveTab('property')} variant="outline">
                ← Back
              </Button>
              <Button onClick={() => setActiveTab('owner')} className="bg-blue-600 hover:bg-blue-700">
                Next: Owner Info →
              </Button>
            </div>
          </TabsContent>

          {/* Owner Info Tab */}
          <TabsContent value="owner">
            <Card className="bg-zinc-900/50 border-zinc-800 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Owner Information
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Your details will be included in the property report for professional sharing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Full Name *</Label>
                  <Input
                    value={property.ownerName}
                    onChange={(e) => updateProperty('ownerName', e.target.value)}
                    placeholder="John Smith"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Email *</Label>
                  <Input
                    type="email"
                    value={property.ownerEmail}
                    onChange={(e) => updateProperty('ownerEmail', e.target.value)}
                    placeholder="john@email.com"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Phone *</Label>
                  <Input
                    value={property.ownerPhone}
                    onChange={(e) => updateProperty('ownerPhone', e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={() => setActiveTab('renovations')} variant="outline">
                ← Back
              </Button>
              <Button
                onClick={evaluateProperty}
                disabled={isEvaluating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
              >
                {isEvaluating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Get AI Valuation
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {evaluation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Main Valuation Card */}
                <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-500/30 max-w-3xl mx-auto">
                  <CardContent className="pt-8 text-center">
                    <p className="text-blue-300 text-sm uppercase tracking-wider mb-2">Estimated Market Value</p>
                    <h2 className="text-5xl font-bold text-white mb-2">
                      AED {evaluation.estimatedValue.toLocaleString()}
                    </h2>
                    <p className="text-zinc-400">
                      AED {evaluation.pricePerSqFt.toLocaleString()} per sq ft
                    </p>
                    <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full ${
                      evaluation.confidence === 'high'
                        ? 'bg-green-500/20 text-green-400'
                        : evaluation.confidence === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {evaluation.confidence === 'high' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {evaluation.confidence.toUpperCase()} Confidence
                    </div>
                  </CardContent>
                </Card>

                {/* Value Breakdown */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Value Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Base Property Value</span>
                        <span className="text-white">AED {evaluation.breakdown.baseValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Location Premium</span>
                        <span className="text-green-400">+AED {evaluation.breakdown.locationPremium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">View Premium</span>
                        <span className="text-green-400">+AED {evaluation.breakdown.viewPremium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Floor Premium</span>
                        <span className="text-green-400">+AED {evaluation.breakdown.floorPremium.toLocaleString()}</span>
                      </div>
                      {evaluation.breakdown.renovationValue > 0 && (
                        <div className="flex justify-between pt-2 border-t border-zinc-800">
                          <span className="text-zinc-400">Renovation Value Add</span>
                          <span className="text-blue-400">+AED {evaluation.breakdown.renovationValue.toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Comparable Transactions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {evaluation.comparableTransactions.map((tx, i) => (
                        <div key={i} className="p-3 bg-zinc-800/50 rounded-lg">
                          <p className="text-white font-medium">{tx.building}</p>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-zinc-400">{tx.size} sq ft</span>
                            <span className="text-gold">AED {tx.price.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">{tx.date}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Market Insights */}
                <Card className="bg-zinc-900/50 border-zinc-800 max-w-4xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-300 leading-relaxed">{evaluation.marketInsights}</p>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                  <Button onClick={generatePDFReport} className="bg-gold hover:bg-gold-light text-black">
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Report
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setEvaluation(null);
                    setProperty(defaultProperty);
                    setActiveTab('property');
                  }}>
                    Evaluate Another Property
                  </Button>
                </div>

                {/* Disclaimer */}
                <div className="max-w-4xl mx-auto p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-amber-300 font-medium mb-1">Important Disclaimer</p>
                      <p className="text-sm text-zinc-400">
                        This AI-generated valuation is based on available market data and recent DLD transaction records. 
                        For the most accurate and legally binding valuation, we recommend consulting official government 
                        resources such as <a href="https://dubailand.gov.ae" target="_blank" className="text-blue-400 hover:underline">Dubai Land Department</a> or 
                        certified platforms like Property Monitor. This estimate should be used for informational purposes only.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </section>
  );
};

export default PropertyEvaluator;
