/**
 * Brochure Generator - Create professional PDF brochures from property/profile data
 * Real implementation using pdf-lib for actual PDF generation
 */

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  FileText,
  Upload,
  Download,
  Image as ImageIcon,
  Building2,
  User,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  Palette
} from 'lucide-react';

type BrochureType = 'property' | 'profile' | 'portfolio';

interface PropertyData {
  title: string;
  location: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  description: string;
  features: string[];
  images: string[];
}

interface ProfileData {
  name: string;
  title: string;
  phone: string;
  email: string;
  bio: string;
  specializations: string[];
  photoUrl: string;
}

interface BrochureTheme {
  id: string;
  name: string;
  primaryColor: [number, number, number];
  accentColor: [number, number, number];
}

const THEMES: BrochureTheme[] = [
  { id: 'gold', name: 'Royal Gold', primaryColor: [0.83, 0.69, 0.22], accentColor: [0.1, 0.1, 0.1] },
  { id: 'blue', name: 'Ocean Blue', primaryColor: [0.2, 0.4, 0.7], accentColor: [0.9, 0.95, 1] },
  { id: 'green', name: 'Forest Green', primaryColor: [0.2, 0.5, 0.3], accentColor: [0.95, 1, 0.95] },
  { id: 'black', name: 'Classic Black', primaryColor: [0.1, 0.1, 0.1], accentColor: [1, 1, 1] },
];

const DEFAULT_PROPERTY: PropertyData = {
  title: '',
  location: '',
  price: '',
  bedrooms: '',
  bathrooms: '',
  size: '',
  description: '',
  features: [],
  images: [],
};

const DEFAULT_PROFILE: ProfileData = {
  name: '',
  title: '',
  phone: '',
  email: '',
  bio: '',
  specializations: [],
  photoUrl: '',
};

export default function BrochureGeneratorPage() {
  const [brochureType, setBrochureType] = useState<BrochureType>('property');
  const [propertyData, setPropertyData] = useState<PropertyData>(DEFAULT_PROPERTY);
  const [profileData, setProfileData] = useState<ProfileData>(DEFAULT_PROFILE);
  const [selectedTheme, setSelectedTheme] = useState<string>('gold');
  const [includeQRCode, setIncludeQRCode] = useState(true);
  const [includeContactForm, setIncludeContactForm] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [newSpec, setNewSpec] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePropertyImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPropertyData(prev => ({
          ...prev,
          images: [...prev.images, event.target?.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleProfilePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileData(prev => ({
        ...prev,
        photoUrl: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const addFeature = useCallback(() => {
    if (newFeature.trim()) {
      setPropertyData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  }, [newFeature]);

  const removeFeature = useCallback((index: number) => {
    setPropertyData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  }, []);

  const addSpecialization = useCallback(() => {
    if (newSpec.trim()) {
      setProfileData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpec.trim()]
      }));
      setNewSpec('');
    }
  }, [newSpec]);

  const removeSpecialization = useCallback((index: number) => {
    setProfileData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  }, []);

  const removeImage = useCallback((index: number) => {
    setPropertyData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  }, []);

  const generatePropertyBrochure = async (theme: BrochureTheme): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Page 1 - Cover
    const page1 = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page1.getSize();

    // Header bar
    page1.drawRectangle({
      x: 0, y: height - 120,
      width, height: 120,
      color: rgb(...theme.primaryColor),
    });

    // Title
    page1.drawText(propertyData.title || 'Property Listing', {
      x: 50, y: height - 60,
      size: 28,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    // Location
    page1.drawText(propertyData.location || 'Location', {
      x: 50, y: height - 90,
      size: 14,
      font: helvetica,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Price
    page1.drawText(propertyData.price || 'Price on Request', {
      x: 50, y: height - 150,
      size: 24,
      font: helveticaBold,
      color: rgb(...theme.primaryColor),
    });

    // Property details
    const details = [
      `Bedrooms: ${propertyData.bedrooms || 'N/A'}`,
      `Bathrooms: ${propertyData.bathrooms || 'N/A'}`,
      `Size: ${propertyData.size || 'N/A'}`,
    ];

    let yPos = height - 200;
    details.forEach(detail => {
      page1.drawText(detail, {
        x: 50, y: yPos,
        size: 12,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 25;
    });

    // Description
    if (propertyData.description) {
      page1.drawText('Description', {
        x: 50, y: yPos - 20,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      const descLines = propertyData.description.match(/.{1,80}/g) || [];
      yPos -= 45;
      descLines.slice(0, 6).forEach(line => {
        page1.drawText(line, {
          x: 50, y: yPos,
          size: 11,
          font: helvetica,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 18;
      });
    }

    // Features
    if (propertyData.features.length > 0) {
      page1.drawText('Features & Amenities', {
        x: 50, y: yPos - 20,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      yPos -= 45;
      propertyData.features.forEach(feature => {
        page1.drawText(`• ${feature}`, {
          x: 60, y: yPos,
          size: 11,
          font: helvetica,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 18;
      });
    }

    // Footer
    page1.drawRectangle({
      x: 0, y: 0,
      width, height: 50,
      color: rgb(...theme.primaryColor),
    });

    page1.drawText('JBJ Global Real Estate', {
      x: 50, y: 20,
      size: 12,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    return pdfDoc.save();
  };

  const generateProfileBrochure = async (theme: BrochureTheme): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();

    // Header bar
    page.drawRectangle({
      x: 0, y: height - 150,
      width, height: 150,
      color: rgb(...theme.primaryColor),
    });

    // Name
    page.drawText(profileData.name || 'Agent Name', {
      x: 200, y: height - 70,
      size: 28,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    // Title
    page.drawText(profileData.title || 'Real Estate Professional', {
      x: 200, y: height - 100,
      size: 14,
      font: helvetica,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Contact info
    let yPos = height - 200;
    if (profileData.phone) {
      page.drawText(`Phone: ${profileData.phone}`, {
        x: 50, y: yPos,
        size: 12,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 25;
    }

    if (profileData.email) {
      page.drawText(`Email: ${profileData.email}`, {
        x: 50, y: yPos,
        size: 12,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 40;
    }

    // Bio
    if (profileData.bio) {
      page.drawText('About Me', {
        x: 50, y: yPos,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      const bioLines = profileData.bio.match(/.{1,80}/g) || [];
      yPos -= 25;
      bioLines.slice(0, 8).forEach(line => {
        page.drawText(line, {
          x: 50, y: yPos,
          size: 11,
          font: helvetica,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 18;
      });
    }

    // Specializations
    if (profileData.specializations.length > 0) {
      yPos -= 20;
      page.drawText('Specializations', {
        x: 50, y: yPos,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      yPos -= 25;
      profileData.specializations.forEach(spec => {
        page.drawText(`• ${spec}`, {
          x: 60, y: yPos,
          size: 11,
          font: helvetica,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 18;
      });
    }

    // Footer
    page.drawRectangle({
      x: 0, y: 0,
      width, height: 50,
      color: rgb(...theme.primaryColor),
    });

    page.drawText('JBJ Global Real Estate', {
      x: 50, y: 20,
      size: 12,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    return pdfDoc.save();
  };

  const generateBrochure = useCallback(async () => {
    setProcessing(true);

    try {
      const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];
      
      let pdfBytes: Uint8Array;
      let filename: string;

      if (brochureType === 'property') {
        if (!propertyData.title) {
          toast.error('Please enter a property title');
          setProcessing(false);
          return;
        }
        pdfBytes = await generatePropertyBrochure(theme);
        filename = `property_brochure_${Date.now()}.pdf`;
      } else {
        if (!profileData.name) {
          toast.error('Please enter your name');
          setProcessing(false);
          return;
        }
        pdfBytes = await generateProfileBrochure(theme);
        filename = `agent_profile_${Date.now()}.pdf`;
      }

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(url);
      toast.success('Brochure generated successfully!');

    } catch (error) {
      console.error('Brochure generation error:', error);
      toast.error('Failed to generate brochure');
    } finally {
      setProcessing(false);
    }
  }, [brochureType, propertyData, profileData, selectedTheme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30">
              <FileText className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Brochure Generator
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  FREE
                </Badge>
              </h1>
              <p className="text-slate-400 text-sm">Create professional PDF brochures for properties and profiles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Type & Theme */}
          <div className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Brochure Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={brochureType} onValueChange={(v) => setBrochureType(v as BrochureType)}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-800/50">
                    <RadioGroupItem value="property" id="property" />
                    <Label htmlFor="property" className="flex items-center gap-2 text-white cursor-pointer">
                      <Building2 className="h-4 w-4 text-gold" />
                      Property Listing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-800/50">
                    <RadioGroupItem value="profile" id="profile" />
                    <Label htmlFor="profile" className="flex items-center gap-2 text-white cursor-pointer">
                      <User className="h-4 w-4 text-gold" />
                      Agent Profile
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5 text-gold" />
                  Theme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
                  {THEMES.map(theme => (
                    <div key={theme.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/50">
                      <RadioGroupItem value={theme.id} id={theme.id} />
                      <Label htmlFor={theme.id} className="flex items-center gap-2 text-white cursor-pointer">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: `rgb(${theme.primaryColor.map(c => Math.round(c * 255)).join(',')})` }}
                        />
                        {theme.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Include QR Code</Label>
                  <Switch checked={includeQRCode} onCheckedChange={setIncludeQRCode} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Contact Form</Label>
                  <Switch checked={includeContactForm} onCheckedChange={setIncludeContactForm} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center/Right - Content Form */}
          <div className="lg:col-span-2 space-y-4">
            {brochureType === 'property' ? (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-gold" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-slate-300">Property Title *</Label>
                      <Input
                        value={propertyData.title}
                        onChange={(e) => setPropertyData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Luxury 3BR Apartment in Downtown"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-slate-300">Location</Label>
                      <Input
                        value={propertyData.location}
                        onChange={(e) => setPropertyData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Downtown Dubai, UAE"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Price</Label>
                      <Input
                        value={propertyData.price}
                        onChange={(e) => setPropertyData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="AED 2,500,000"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Size</Label>
                      <Input
                        value={propertyData.size}
                        onChange={(e) => setPropertyData(prev => ({ ...prev, size: e.target.value }))}
                        placeholder="1,800 sq ft"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Bedrooms</Label>
                      <Input
                        value={propertyData.bedrooms}
                        onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: e.target.value }))}
                        placeholder="3"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Bathrooms</Label>
                      <Input
                        value={propertyData.bathrooms}
                        onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: e.target.value }))}
                        placeholder="2"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-slate-300">Description</Label>
                      <Textarea
                        value={propertyData.description}
                        onChange={(e) => setPropertyData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the property..."
                        rows={4}
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <Label className="text-slate-300">Features & Amenities</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature..."
                        className="bg-slate-800 border-slate-600 text-white"
                        onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                      />
                      <Button onClick={addFeature} variant="outline" className="border-slate-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {propertyData.features.map((feature, i) => (
                        <Badge key={i} className="bg-gold/20 text-gold border-gold/30 flex items-center gap-1">
                          {feature}
                          <button onClick={() => removeFeature(i)} className="ml-1 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <Label className="text-slate-300">Property Images</Label>
                    <div className="mt-2">
                      <Button
                        onClick={() => imageInputRef.current?.click()}
                        variant="outline"
                        className="w-full border-slate-600 text-slate-300"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Images
                      </Button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePropertyImageUpload}
                      />
                    </div>
                    {propertyData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {propertyData.images.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt={`Property ${i + 1}`} className="w-full h-16 object-cover rounded" />
                            <button
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 p-1 bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-gold" />
                    Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-slate-300">Full Name *</Label>
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Smith"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-slate-300">Job Title</Label>
                      <Input
                        value={profileData.title}
                        onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Senior Property Consultant"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Phone</Label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+971 50 123 4567"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@jbjglobal.com"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-slate-300">Bio</Label>
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Write about your experience and expertise..."
                        rows={4}
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <Label className="text-slate-300">Specializations</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newSpec}
                        onChange={(e) => setNewSpec(e.target.value)}
                        placeholder="Add specialization..."
                        className="bg-slate-800 border-slate-600 text-white"
                        onKeyDown={(e) => e.key === 'Enter' && addSpecialization()}
                      />
                      <Button onClick={addSpecialization} variant="outline" className="border-slate-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileData.specializations.map((spec, i) => (
                        <Badge key={i} className="bg-gold/20 text-gold border-gold/30 flex items-center gap-1">
                          {spec}
                          <button onClick={() => removeSpecialization(i)} className="ml-1 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Photo */}
                  <div>
                    <Label className="text-slate-300">Profile Photo</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {profileData.photoUrl ? (
                        <img src={profileData.photoUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                      <Button
                        onClick={() => photoInputRef.current?.click()}
                        variant="outline"
                        className="border-slate-600 text-slate-300"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </Button>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePhotoUpload}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateBrochure}
              disabled={processing}
              className="w-full bg-gold hover:bg-gold/90 text-black py-6"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Brochure...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Generate PDF Brochure
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
