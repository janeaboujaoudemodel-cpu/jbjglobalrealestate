/**
 * AI Description Writer Page
 * Write compelling property descriptions automatically
 */

import { useState } from "react";
import { PenTool, Send, Sparkles, Copy, Check, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContentDark, SelectItemDark, SelectTriggerDark, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AIToolPremiumLayout from "@/components/ai-tools/AIToolPremiumLayout";
import AIToolGuide from "@/components/ai-tools/AIToolGuide";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { Wand2, Sliders } from "lucide-react";

interface DescriptionResult {
  headline?: string;
  shortDescription?: string;
  fullDescription?: string;
  highlights?: string[];
  seoTitle?: string;
  seoDescription?: string;
  alternativeHeadlines?: string[];
}

export default function AIDescriptionWriterPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DescriptionResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [propertyType, setPropertyType] = useState("apartment");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("2");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState("");
  const [views, setViews] = useState("");
  const [style, setStyle] = useState("luxury");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const handleSubmit = async () => {
    if (!location) {
      toast.error("Please enter a location");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-property-analyzer", {
        body: {
          area: location,
          propertyType,
          analysisType: "description",
          propertyDetails: {
            bedrooms,
            size,
            price,
            features,
            views,
            style,
            additionalInfo,
          },
        },
      });

      if (error) throw error;
      if (data?.success) {
        // Parse the description from the full analysis
        const sections = data.sections || {};
        setResult({
          headline: `Stunning ${bedrooms}BR ${propertyType} in ${location}`,
          shortDescription: sections.areaOverview?.substring(0, 200) || data.fullAnalysis?.substring(0, 200),
          fullDescription: data.fullAnalysis,
          highlights: features.split(",").map((f: string) => f.trim()).filter(Boolean),
          seoTitle: `${bedrooms} Bedroom ${propertyType} for Sale in ${location} | JBJ GLOBAL REAL ESTATE`,
          seoDescription: `Discover this beautiful ${bedrooms} bedroom ${propertyType} in ${location}. ${size ? size + " sqft." : ""} ${views ? views + "." : ""} Contact JBJ Global Real Estate.`,
        });
        toast.success("Property description generated!");
      } else {
        throw new Error(data?.error || "Failed to generate");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate description");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AIToolStartGate
      headline="How would you like to write the description?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Draft from Property", Icon: Wand2, desc: "Enter a few details — AI writes a polished, SEO-ready listing description.", bullets: ["One-click draft", "SEO-optimised", "Multiple headlines"], cta: "Draft with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Write with Guided Fields", Icon: Sliders, desc: "Fill every field yourself for full control over tone and structure.", bullets: ["Custom tone", "Field-by-field", "Editable output"], cta: "Fill manually" },
      ]}
    >
    <AIToolPremiumLayout
      title="AI Description Writer"
      subtitle="Write compelling property descriptions that sell"
      icon={<PenTool className="w-8 h-8" />}
      accentColor="lime"
      gradientFrom="from-lime-500"
    >
      <AIToolGuide
        description="Generate professional, engaging property descriptions optimized for listings and SEO."
        steps={[
          "Enter property type and location",
          "Add size, bedrooms, and key features",
          "Select your writing style",
          "Generate compelling copy"
        ]}
        benefits={[
          "Professional listing copy",
          "SEO-optimized descriptions",
          "Multiple headline options",
          "Highlight key selling points"
        ]}
        accentColor="lime"
      />

      <div className="space-y-8">
        {/* Input Form */}
        <Card className="bg-[#FDFBF7]/90 border-lime-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-lime-400" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/85">Property Type</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTriggerDark className="border-lime-500/30 hover:border-lime-500/50">
                    <SelectValue />
                  </SelectTriggerDark>
                  <SelectContentDark className="border-lime-500/30">
                    <SelectItemDark value="apartment">Apartment</SelectItemDark>
                    <SelectItemDark value="villa">Villa</SelectItemDark>
                    <SelectItemDark value="townhouse">Townhouse</SelectItemDark>
                    <SelectItemDark value="penthouse">Penthouse</SelectItemDark>
                    <SelectItemDark value="studio">Studio</SelectItemDark>
                    <SelectItemDark value="duplex">Duplex</SelectItemDark>
                  </SelectContentDark>
                </Select>
              </div>
              <div>
                <Label className="text-white/85">Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Dubai Marina"
                  className="bg-[#F7F2EA] border-lime-500/30 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-white/85">Bedrooms</Label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTriggerDark className="border-lime-500/30 hover:border-lime-500/50">
                    <SelectValue />
                  </SelectTriggerDark>
                  <SelectContentDark className="border-lime-500/30">
                    {["Studio", "1", "2", "3", "4", "5", "6+"].map(n => (
                      <SelectItemDark key={n} value={n}>{n}</SelectItemDark>
                    ))}
                  </SelectContentDark>
                </Select>
              </div>
              <div>
                <Label className="text-white/85">Size (sqft)</Label>
                <Input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="1,200"
                  className="bg-[#F7F2EA] border-lime-500/30 text-white"
                />
              </div>
              <div>
                <Label className="text-white/85">Price (AED)</Label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2,500,000"
                  className="bg-[#F7F2EA] border-lime-500/30 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/85">Key Features (comma-separated)</Label>
              <Input
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="Private pool, smart home, maid's room, private parking..."
                className="bg-[#F7F2EA] border-lime-500/30 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/85">Views</Label>
                <Input
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  placeholder="Sea view, Marina view..."
                  className="bg-[#F7F2EA] border-lime-500/30 text-white"
                />
              </div>
              <div>
                <Label className="text-white/85">Writing Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTriggerDark className="border-lime-500/30 hover:border-lime-500/50">
                    <SelectValue />
                  </SelectTriggerDark>
                  <SelectContentDark className="border-lime-500/30">
                    <SelectItemDark value="luxury">Luxury & Exclusive</SelectItemDark>
                    <SelectItemDark value="professional">Professional</SelectItemDark>
                    <SelectItemDark value="casual">Friendly & Casual</SelectItemDark>
                    <SelectItemDark value="factual">Factual & Concise</SelectItemDark>
                  </SelectContentDark>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white/85">Additional Information</Label>
              <Textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any unique selling points, developer info, nearby amenities..."
                className="bg-[#F7F2EA] border-lime-500/30 text-white"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-lime-500 hover:bg-lime-600 text-[#1A1A1A] font-semibold"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Description...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate Description
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Headline */}
            {result.headline && (
              <Card className="bg-[#FDFBF7]/90 border-lime-500/30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Headline</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result.headline || "")}
                    className="border-lime-500/30 text-lime-400 hover:bg-lime-500/20"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-xl text-white font-semibold">{result.headline}</p>
                </CardContent>
              </Card>
            )}

            {/* Full Description */}
            {result.fullDescription && (
              <Card className="bg-[#FDFBF7]/90 border-lime-500/30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-lime-400" />
                    Full Description
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result.fullDescription || "")}
                    className="border-lime-500/30 text-lime-400 hover:bg-lime-500/20"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-white/85 whitespace-pre-wrap">{result.fullDescription}</p>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {result.highlights && result.highlights.length > 0 && (
              <Card className="bg-[#FDFBF7]/90 border-lime-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Key Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.highlights.map((h, i) => (
                      <span key={i} className="px-3 py-1 bg-lime-500/20 text-lime-300 rounded-full text-sm border border-lime-500/30">
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SEO */}
            {(result.seoTitle || result.seoDescription) && (
              <Card className="bg-lime-500/10 border-lime-500/30">
                <CardHeader>
                  <CardTitle className="text-white">SEO Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.seoTitle && (
                    <div>
                      <Label className="text-lime-400 text-xs uppercase">Title Tag</Label>
                      <p className="text-white/85">{result.seoTitle}</p>
                    </div>
                  )}
                  {result.seoDescription && (
                    <div>
                      <Label className="text-lime-400 text-xs uppercase">Meta Description</Label>
                      <p className="text-white/70 text-sm">{result.seoDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Placeholder */}
        {!result && !loading && (
          <div className="bg-[#FDFBF7]/50 border border-lime-500/20 rounded-xl py-12 text-center">
            <PenTool className="w-12 h-12 text-lime-400/50 mx-auto mb-4" />
            <p className="text-white/70">Enter property details above to generate compelling descriptions</p>
          </div>
        )}
      </div>
    </AIToolPremiumLayout>
    </AIToolStartGate>
  );
}
