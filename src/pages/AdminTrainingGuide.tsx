import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useListingAdmin } from "@/hooks/useListingAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Home,
  Upload,
  Users,
  AlertTriangle,
  Crown,
  Calendar,
  DollarSign,
  MapPin,
  Image,
  Folder,
  BookOpen,
  Lightbulb,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

const AdminTrainingGuide = () => {
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const { isListingAdmin, isLoading } = useListingAdmin();

  const hasAccess = isListingAdmin || isOwner;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#B89555]" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Card className="bg-[#FDFBF7] border-[#1A1A1A] max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-white/70">This training guide is only available to Listing Admins.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="border-b border-[#1A1A1A] bg-[#FDFBF7]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/listing-admin")}
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-white text-xl font-bold">
                Listing Training Guide
              </h1>
              <p className="text-white/90 text-sm">Complete property listing & verification guide</p>
            </div>
          </div>
          <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30">
            <BookOpen className="w-3 h-3 mr-1" />
            Training Material
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="getting-started" className="space-y-6">
          <TabsList className="bg-[#FDFBF7] border border-[#1A1A1A] p-1 h-auto flex-wrap">
            <TabsTrigger value="getting-started" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="add-property" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
              Adding Properties
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
              Property Categories
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
              Documents & Media
            </TabsTrigger>
            <TabsTrigger value="verification" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
              Client Verification
            </TabsTrigger>
          </TabsList>

          {/* Getting Started */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#1A1A1A]" />
                  Welcome to Listing Administration
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/85 space-y-4">
                <p>
                  As a Listing Admin, you are responsible for maintaining the quality and accuracy of all property listings 
                  on the JBJ Global Real Estate platform. This guide will teach you how to:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Add new property listings from developers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Categorize properties correctly (Off-Plan, Ready, Secondary, Commercial, Rental, Land)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Upload brochures, floor plans, and images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Verify and approve client-submitted listings</span>
                  </li>
                </ul>

                <div className="bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg p-4 mt-6">
                  <h4 className="text-[#1A1A1A] font-semibold mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Quality Standards
                  </h4>
                  <p className="text-white/70 text-sm">
                    All listings must follow JBJ Global Real Estate standards. Use "home-owner" terminology (not investor), 
                    never include investment-advisory language, and ensure all property data is accurate and verified.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#1A1A1A]" />
                  Quick Access Links
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 border-[#1A1A1A] hover:border-[#B89555] hover:bg-[#EFE6D6]/10"
                  onClick={() => navigate("/listing-admin")}
                >
                  <div className="flex items-center gap-2 text-[#1A1A1A]">
                    <Home className="w-5 h-5" />
                    <span className="font-semibold">Listing Management</span>
                  </div>
                  <span className="text-white/70 text-sm text-left">Add and manage property listings</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 border-[#1A1A1A] hover:border-[#B89555] hover:bg-[#EFE6D6]/10"
                  onClick={() => navigate("/admin/developers")}
                >
                  <div className="flex items-center gap-2 text-[#1A1A1A]">
                    <Building2 className="w-5 h-5" />
                    <span className="font-semibold">Developer Management</span>
                  </div>
                  <span className="text-white/70 text-sm text-left">Manage developer profiles</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adding Properties */}
          <TabsContent value="add-property" className="space-y-6">
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#1A1A1A]" />
                  Step-by-Step: Adding a New Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <div className="w-8 h-8 bg-[#EFE6D6] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Go to Listing Management</h4>
                      <p className="text-white/70 text-sm">
                        Navigate to <code className="bg-[#F7F2EA] px-2 py-0.5 rounded">/listing-admin</code> and click 
                        "Add New Project" button.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <div className="w-8 h-8 bg-[#EFE6D6] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Fill in Basic Information</h4>
                      <ul className="text-white/70 text-sm space-y-1 mt-2">
                        <li>• <strong>Name:</strong> Exact project name as per developer</li>
                        <li>• <strong>Developer:</strong> Select the correct developer from dropdown</li>
                        <li>• <strong>Location:</strong> Area/community name (e.g., "Business Bay")</li>
                        <li>• <strong>Emirate:</strong> Dubai, Abu Dhabi, Sharjah, or RAK</li>
                        <li>• <strong>Description:</strong> Copy from developer brochure or write concise description</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <div className="w-8 h-8 bg-[#EFE6D6] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Set Pricing & Unit Details</h4>
                      <ul className="text-white/70 text-sm space-y-1 mt-2">
                        <li>• <strong>Price From:</strong> Starting price in AED (e.g., 1500000)</li>
                        <li>• <strong>Price To:</strong> Maximum price in AED</li>
                        <li>• <strong>Bedrooms:</strong> Min and Max bedroom count</li>
                        <li>• <strong>Payment Plan:</strong> e.g., "60/40", "80/20", "1% monthly"</li>
                        <li>• <strong>Handover Date:</strong> Expected completion (for off-plan)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <div className="w-8 h-8 bg-[#EFE6D6] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Save & Upload Documents</h4>
                      <p className="text-white/70 text-sm">
                        Click Save to create the project, then upload brochures, floor plans, and images 
                        using the document upload section.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Important: Never Do This
                  </h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Never use investment promises like "guaranteed returns" or "high ROI"</li>
                    <li>• Never list inaccurate or unverified pricing</li>
                    <li>• Never use images that don't belong to the project</li>
                    <li>• Never skip developer verification</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property Categories */}
          <TabsContent value="categories" className="space-y-6">
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Folder className="w-5 h-5 text-[#1A1A1A]" />
                  Property Categories Explained
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Off-Plan */}
                  <div className="p-4 bg-gradient-to-br from-gold/20 to-gold/5 border border-[#B89555]/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-[#1A1A1A]" />
                      <h4 className="text-white font-semibold">Off-Plan</h4>
                    </div>
                    <p className="text-white/70 text-sm mb-2">
                      Properties under construction or not yet built. Requires handover date.
                    </p>
                    <ul className="text-xs text-white/90 space-y-1">
                      <li>• Set handover date (future date)</li>
                      <li>• Include payment plan details</li>
                      <li>• Upload project brochure</li>
                    </ul>
                  </div>

                  {/* Ready */}
                  <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <h4 className="text-white font-semibold">Ready to Move</h4>
                    </div>
                    <p className="text-white/70 text-sm mb-2">
                      Completed properties available for immediate occupancy.
                    </p>
                    <ul className="text-xs text-white/90 space-y-1">
                      <li>• Leave handover date empty or past date</li>
                      <li>• Include actual unit photos</li>
                      <li>• Verify availability status</li>
                    </ul>
                  </div>

                  {/* Secondary/Resale */}
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-5 h-5 text-blue-500" />
                      <h4 className="text-white font-semibold">Secondary / Resale</h4>
                    </div>
                    <p className="text-white/70 text-sm mb-2">
                      Properties listed by existing owners (homeowners).
                    </p>
                    <ul className="text-xs text-white/90 space-y-1">
                      <li>• Verify Title Deed</li>
                      <li>• Confirm owner identity (ID/Passport)</li>
                      <li>• Use actual property photos only</li>
                    </ul>
                  </div>

                  {/* Commercial */}
                  <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-purple-500" />
                      <h4 className="text-white font-semibold">Commercial</h4>
                    </div>
                    <p className="text-white/70 text-sm mb-2">
                      Office spaces, retail, warehouses, hotels.
                    </p>
                    <ul className="text-xs text-white/90 space-y-1">
                      <li>• Specify commercial type</li>
                      <li>• Include service charge info</li>
                      <li>• Note any restrictions</li>
                    </ul>
                  </div>

                  {/* Rental */}
                  <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-orange-500" />
                      <h4 className="text-white font-semibold">Rental</h4>
                    </div>
                    <p className="text-white/70 text-sm mb-2">
                      Properties available for lease (yearly or monthly).
                    </p>
                    <ul className="text-xs text-white/90 space-y-1">
                      <li>• Specify annual rent price</li>
                      <li>• Note payment terms (1-4 cheques)</li>
                      <li>• Include furnished status</li>
                    </ul>
                  </div>

                  {/* Land/Plot */}
                  <div className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-amber-500" />
                      <h4 className="text-white font-semibold">Land / Plot</h4>
                    </div>
                    <p className="text-white/70 text-sm mb-2">
                      Vacant land for development or investment.
                    </p>
                    <ul className="text-xs text-white/90 space-y-1">
                      <li>• Specify plot size in sqft</li>
                      <li>• Note zoning/permitted use</li>
                      <li>• Include location coordinates if available</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#1A1A1A]" />
                  Premium Listings
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/85">
                <p className="mb-4">
                  Mark a property as "Premium" when it meets these criteria:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                    <span>High-value property (typically above AED 5,000,000)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                    <span>Prime location (Waterfront, Palm, Downtown, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                    <span>Exclusive or limited availability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                    <span>Featured by management for promotion</span>
                  </li>
                </ul>
                <p className="text-white/90 text-sm mt-4">
                  Premium listings display with a Crown icon and receive priority visibility on the website.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents & Media */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1A1A1A]" />
                  Document Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Brochure</h4>
                    <p className="text-white/70 text-sm">
                      Official project brochure from developer. PDF format preferred. 
                      Should include project overview, amenities, and location info.
                    </p>
                  </div>
                  <div className="p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Floor Plan</h4>
                    <p className="text-white/70 text-sm">
                      Unit layouts showing room dimensions. Upload multiple for different unit types 
                      (Studio, 1BR, 2BR, etc.).
                    </p>
                  </div>
                  <div className="p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Factsheet</h4>
                    <p className="text-white/70 text-sm">
                      Quick reference document with key project details, pricing, and specifications.
                    </p>
                  </div>
                  <div className="p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Payment Plan</h4>
                    <p className="text-white/70 text-sm">
                      Official payment schedule from developer showing installment breakdown.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-[#1A1A1A]" />
                  Image Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-white/85 space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Use high-quality images</span>
                      <p className="text-white/90 text-sm">Minimum 1920x1080 pixels, well-lit and clear</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Include exterior and interior shots</span>
                      <p className="text-white/90 text-sm">Building facade, lobby, amenities, and unit interiors</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">First image is primary</span>
                      <p className="text-white/90 text-sm">Upload the best exterior/hero image first - it will be the thumbnail</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Only use authorized images</span>
                      <p className="text-white/90 text-sm">Images must be from developer or with permission. No stock photos for actual units.</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Verification */}
          <TabsContent value="verification" className="space-y-6">
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1A1A1A]" />
                  Verifying Client-Submitted Listings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-white/85">
                  When a homeowner submits their property through "List Your Property", follow these verification steps:
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <div className="w-8 h-8 bg-[#EFE6D6] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Check Title Deed</h4>
                      <p className="text-white/70 text-sm">
                        Verify the Title Deed matches the property address and the owner's name. 
                        Check that it's a valid Dubai Land Department document.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <div className="w-8 h-8 bg-[#EFE6D6] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Verify Owner Identity</h4>
                      <p className="text-white/70 text-sm">
                        Confirm the submitted ID/Passport matches the name on the Title Deed. 
                        Cross-reference contact details.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <div className="w-8 h-8 bg-[#EFE6D6] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Review Property Details</h4>
                      <p className="text-white/70 text-sm">
                        Verify the listed details (size, bedrooms, price) match the Title Deed and 
                        are reasonable for the area.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#F7F2EA]/50 rounded-lg">
                    <div className="w-8 h-8 bg-[#EFE6D6] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Confirm via WhatsApp</h4>
                      <p className="text-white/70 text-sm">
                        Send a confirmation message to the homeowner via WhatsApp. Confirm their intent to list 
                        and any additional requirements.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      5
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Approve & Publish</h4>
                      <p className="text-white/70 text-sm">
                        Once verified, create the listing in Listing Admin using the client's details. 
                        Mark it appropriately as a Secondary/Resale listing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Red Flags - Do Not Approve
                  </h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Title Deed name doesn't match ID</li>
                    <li>• Documents appear altered or low quality</li>
                    <li>• Owner cannot be reached for verification</li>
                    <li>• Pricing is suspiciously low or high</li>
                    <li>• Multiple listings for same unit from different people</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gold/20 to-gold/5 border-[#B89555]/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#EFE6D6] rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Ready to Start?</h3>
                    <p className="text-white/70 text-sm">
                      Go to Listing Management to begin adding and managing property listings.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="ml-auto"
                    onClick={() => navigate("/listing-admin")}
                  >
                    Open Listing Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminTrainingGuide;
