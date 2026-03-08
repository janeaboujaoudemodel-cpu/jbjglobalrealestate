/**
 * AI Social Media Page
 * Generate engaging social media content for real estate
 */

import { useState } from "react";
import { Share2, Send, Sparkles, Copy, Check, Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AIToolPremiumLayout from "@/components/ai-tools/AIToolPremiumLayout";
import AIToolGuide from "@/components/ai-tools/AIToolGuide";

interface SocialResult {
  mainPost?: string;
  caption?: string;
  hashtags?: string[];
  callToAction?: string;
  hook?: string;
  imagePrompt?: string;
  bestTimeToPost?: string;
  storyContent?: {
    slide1: string;
    slide2: string;
    slide3: string;
  };
  alternativeVersions?: string[];
  engagementTips?: string[];
}

export default function AISocialMediaPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [platform, setPlatform] = useState("instagram");
  const [contentType, setContentType] = useState("property-listing");
  const [propertyTitle, setPropertyTitle] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [features, setFeatures] = useState("");
  const [highlights, setHighlights] = useState("");
  const [tone, setTone] = useState("professional");

  const platforms = [
    { value: "instagram", label: "Instagram", icon: Instagram },
    { value: "facebook", label: "Facebook", icon: Facebook },
    { value: "twitter", label: "Twitter/X", icon: Twitter },
    { value: "linkedin", label: "LinkedIn", icon: Linkedin },
    { value: "tiktok", label: "TikTok", icon: Share2 },
  ];

  const contentTypes = [
    { value: "property-listing", label: "Property Listing" },
    { value: "market-update", label: "Market Update" },
    { value: "success-story", label: "Success Story" },
    { value: "tips", label: "Tips & Advice" },
    { value: "behind-scenes", label: "Behind the Scenes" },
    { value: "testimonial", label: "Client Testimonial" },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-social-media", {
        body: {
          platform,
          contentType,
          propertyDetails: {
            title: propertyTitle,
            location,
            price,
            bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
            features: features.split(",").map(f => f.trim()).filter(Boolean),
            highlights,
          },
          tone,
        },
      });

      if (error) throw error;
      if (data?.success) {
        setResult(data);
        toast.success("Social content generated!");
      } else {
        throw new Error(data?.error || "Failed to generate");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate social content");
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

  const PlatformIcon = platforms.find(p => p.value === platform)?.icon || Share2;

  return (
    <AIToolPremiumLayout
      title="AI Social Media"
      subtitle="Generate engaging social media content for property listings and more"
      icon={<Share2 className="w-8 h-8" />}
      accentColor="pink"
      gradientFrom="from-pink-500"
    >
      <AIToolGuide
        description="Create platform-optimized social media posts with hashtags, stories, and engagement tips."
        steps={[
          "Select your target platform",
          "Choose the content type",
          "Enter property or topic details",
          "Set your preferred tone",
          "Generate and customize content"
        ]}
        benefits={[
          "Platform-optimized content",
          "Auto-generated hashtags",
          "Story slide content",
          "Best posting time recommendations"
        ]}
        accentColor="pink"
      />

      <div className="space-y-8">
        {/* Input Form */}
        <Card className="bg-zinc-900/90 border-pink-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PlatformIcon className="w-5 h-5 text-pink-400" />
              Content Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Platform Selection */}
            <div>
              <Label className="text-zinc-300 mb-2 block">Platform</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map(p => {
                  const Icon = p.icon;
                  return (
                    <Badge
                      key={p.value}
                      variant={platform === p.value ? "default" : "outline"}
                      className={`cursor-pointer flex items-center gap-1 ${
                        platform === p.value 
                          ? "bg-pink-500 text-black hover:bg-pink-400" 
                          : "border-pink-500/30 text-zinc-300 hover:bg-pink-500/20"
                      }`}
                      onClick={() => setPlatform(p.value)}
                    >
                      <Icon className="w-3 h-3" />
                      {p.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="bg-zinc-800 border-pink-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="bg-zinc-800 border-pink-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual & Fun</SelectItem>
                    <SelectItem value="luxury">Luxury & Exclusive</SelectItem>
                    <SelectItem value="urgent">Urgent & Exciting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300">Property Title</Label>
                <Input
                  value={propertyTitle}
                  onChange={(e) => setPropertyTitle(e.target.value)}
                  placeholder="Luxury 2BR with Sea View"
                  className="bg-zinc-800 border-pink-500/30 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-300">Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Dubai Marina"
                  className="bg-zinc-800 border-pink-500/30 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300">Price</Label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="AED 2,500,000"
                  className="bg-zinc-800 border-pink-500/30 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-300">Bedrooms</Label>
                <Input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  placeholder="2"
                  className="bg-zinc-800 border-pink-500/30 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-300">Key Features (comma-separated)</Label>
              <Input
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="Sea view, private pool, smart home..."
                className="bg-zinc-800 border-pink-500/30 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">Highlights / Key Message</Label>
              <Textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="What makes this special? Any unique selling points..."
                className="bg-zinc-800 border-pink-500/30 text-white"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 text-black font-semibold"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Main Post */}
            <Card className="bg-zinc-900/90 border-pink-500/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <PlatformIcon className="w-5 h-5 text-pink-400" />
                  Main Post
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.mainPost || "")}
                  className="border-pink-500/30 text-pink-400 hover:bg-pink-500/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.hook && (
                  <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/20">
                    <Label className="text-pink-400 text-xs uppercase">Hook</Label>
                    <p className="text-white font-medium">{result.hook}</p>
                  </div>
                )}
                
                {result.mainPost && (
                  <p className="text-zinc-300 whitespace-pre-wrap">{result.mainPost}</p>
                )}

                {result.callToAction && (
                  <p className="text-pink-300 font-medium">{result.callToAction}</p>
                )}

                {result.hashtags && result.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.hashtags.map((tag, i) => (
                      <span key={i} className="text-blue-400 text-sm">#{tag}</span>
                    ))}
                  </div>
                )}

                {result.bestTimeToPost && (
                  <p className="text-zinc-500 text-sm">Best time to post: {result.bestTimeToPost}</p>
                )}
              </CardContent>
            </Card>

            {/* Story Content */}
            {result.storyContent && (
              <Card className="bg-zinc-900/90 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-pink-400" />
                    Story Slides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(result.storyContent).map(([key, value]) => (
                      <div key={key} className="bg-zinc-800/50 rounded-lg p-4 border border-pink-500/20 text-center">
                        <Label className="text-pink-400 text-xs uppercase">{key}</Label>
                        <p className="text-zinc-300 text-sm mt-2">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image Prompt */}
            {result.imagePrompt && (
              <Card className="bg-zinc-900/90 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Suggested Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400 text-sm">{result.imagePrompt}</p>
                </CardContent>
              </Card>
            )}

            {/* Engagement Tips */}
            {result.engagementTips && result.engagementTips.length > 0 && (
              <Card className="bg-zinc-900/90 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-400" />
                    Engagement Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.engagementTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-300 text-sm">
                        <span className="text-pink-400">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Placeholder */}
        {!result && !loading && (
          <div className="bg-zinc-900/50 border border-pink-500/20 rounded-xl py-12 text-center">
            <Share2 className="w-12 h-12 text-pink-400/50 mx-auto mb-4" />
            <p className="text-zinc-400">Configure your post above to generate engaging social content</p>
          </div>
        )}
      </div>
    </AIToolPremiumLayout>
  );
}
