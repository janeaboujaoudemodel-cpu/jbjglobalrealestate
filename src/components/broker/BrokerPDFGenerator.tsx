import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Plus,
  X,
  Download,
  Eye,
  EyeOff,
  Upload,
  User,
  Building,
  Phone,
  Mail,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Subscription {
  id: string;
  tier: string;
  status: string;
  ai_credits_used: number;
  ai_credits_limit: number | null;
  pdf_downloads: number;
}

interface Project {
  id: string;
  name: string;
  location: string | null;
  price_from: number | null;
  price_to: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
}

interface BrokerPDFGeneratorProps {
  subscription: Subscription;
}

export default function BrokerPDFGenerator({ subscription }: BrokerPDFGeneratorProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBrandingOptions, setShowBrandingOptions] = useState(false);

  // Branding options
  const [brokerInfo, setBrokerInfo] = useState({
    name: "",
    phone: "",
    email: user?.email || "",
    company: "",
    photoUrl: "",
    logoUrl: "",
  });
  const [hidePrices, setHidePrices] = useState(false);
  const [hideJJBranding, setHideJJBranding] = useState(false);
  const [addAIRecommendation, setAddAIRecommendation] = useState(false);

  const canCustomBrand = subscription.tier !== "starter";
  const canUseAI = subscription.ai_credits_limit === null || 
    subscription.ai_credits_used < subscription.ai_credits_limit;

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchProjects();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchProjects = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, location, price_from, price_to, bedrooms_min, bedrooms_max")
        .ilike("name", `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching projects:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addProject = (project: Project) => {
    if (selectedProjects.find(p => p.id === project.id)) {
      toast.error("Project already added");
      return;
    }
    if (selectedProjects.length >= 5) {
      toast.error("Maximum 5 projects per PDF");
      return;
    }
    setSelectedProjects([...selectedProjects, project]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeProject = (projectId: string) => {
    setSelectedProjects(selectedProjects.filter(p => p.id !== projectId));
  };

  const handleGeneratePDF = async () => {
    if (selectedProjects.length === 0) {
      toast.error("Please select at least one project");
      return;
    }

    setIsGenerating(true);
    try {
      // For now, show a message about manual generation
      // In production, this would call an edge function to generate the PDF
      
      toast.success(
        "PDF generation request submitted! Our team will prepare your custom PDF and send it to your email within 24 hours.",
        { duration: 5000 }
      );

      // Record the export request
      await supabase.from("broker_pdf_exports").insert({
        user_id: user?.id,
        subscription_id: subscription.id,
        project_ids: selectedProjects.map(p => p.id),
        hide_prices: hidePrices,
        broker_name: brokerInfo.name,
        broker_phone: brokerInfo.phone,
        broker_email: brokerInfo.email,
        broker_company: brokerInfo.company,
        broker_photo_url: brokerInfo.photoUrl,
        broker_logo_url: brokerInfo.logoUrl,
        custom_branding: canCustomBrand && hideJJBranding ? { hideJJBranding: true } : null,
        ai_recommendation: addAIRecommendation ? "pending" : null,
      });

      // Update PDF download count
      await supabase
        .from("broker_subscriptions")
        .update({ pdf_downloads: subscription.pdf_downloads + 1 })
        .eq("id", subscription.id);

      // Send notification email
      await supabase.functions.invoke("send-market-report-email", {
        body: {
          to: "Contact@JBJ.ae",
          subject: `Broker PDF Request - ${brokerInfo.name || user?.email}`,
          html: `
            <h2>New Broker PDF Generation Request</h2>
            <p><strong>Broker:</strong> ${brokerInfo.name || "N/A"}</p>
            <p><strong>Email:</strong> ${brokerInfo.email}</p>
            <p><strong>Phone:</strong> ${brokerInfo.phone || "N/A"}</p>
            <p><strong>Company:</strong> ${brokerInfo.company || "N/A"}</p>
            <p><strong>Projects:</strong> ${selectedProjects.map(p => p.name).join(", ")}</p>
            <p><strong>Hide Prices:</strong> ${hidePrices ? "Yes" : "No"}</p>
            <p><strong>Custom Branding:</strong> ${hideJJBranding ? "Yes" : "No"}</p>
            <p><strong>AI Recommendation:</strong> ${addAIRecommendation ? "Yes" : "No"}</p>
            <p><strong>Subscription Tier:</strong> ${subscription.tier}</p>
          `,
        },
      });

      setSelectedProjects([]);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to submit PDF request. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return `AED ${(price / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#1A1A1A]" />
          Search Properties
        </h3>
        
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name..."
            className="bg-[#1A1A1A] border-[#1A1A1A] text-white"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#1A1A1A]" />
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 border border-[#1A1A1A] rounded-lg overflow-hidden">
            {searchResults.map((project) => (
              <button
                key={project.id}
                onClick={() => addProject(project)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#1A1A1A] transition-colors border-b border-[#1A1A1A] last:border-0 text-left"
              >
                <div>
                  <p className="text-white font-medium">{project.name}</p>
                  <p className="text-white/70 text-sm">{project.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/70 text-sm">
                    {formatPrice(project.price_from)} - {formatPrice(project.price_to)}
                  </span>
                  <Plus className="w-5 h-5 text-[#1A1A1A]" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Projects */}
      {selectedProjects.length > 0 && (
        <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1A1A1A]" />
            Selected Properties ({selectedProjects.length}/5)
          </h3>
          
          <div className="space-y-3">
            {selectedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-[#1A1A1A]/50 border border-[#1A1A1A] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A]">{index + 1}</Badge>
                  <div>
                    <p className="text-white font-medium">{project.name}</p>
                    <p className="text-white/70 text-sm">
                      {project.location} • {project.bedrooms_min}-{project.bedrooms_max} BR
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/70 text-sm">
                    {hidePrices ? "Price Hidden" : `${formatPrice(project.price_from)} - ${formatPrice(project.price_to)}`}
                  </span>
                  <button
                    onClick={() => removeProject(project.id)}
                    className="p-1 hover:bg-[#1A1A1A] rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* PDF Options */}
      <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1A1A1A]" />
          PDF Options
        </h3>

        <div className="space-y-4">
          {/* Price Visibility */}
          <div className="flex items-center justify-between p-4 bg-[#1A1A1A]/50 rounded-lg">
            <div className="flex items-center gap-3">
              {hidePrices ? (
                <EyeOff className="w-5 h-5 text-white/70" />
              ) : (
                <Eye className="w-5 h-5 text-green-400" />
              )}
              <div>
                <p className="text-white font-medium">Price Visibility</p>
                <p className="text-white/70 text-sm">Show or hide property prices</p>
              </div>
            </div>
            <Checkbox
              checked={!hidePrices}
              onCheckedChange={(checked) => setHidePrices(!checked)}
            />
          </div>

          {/* AI Recommendation */}
          {canUseAI && (
            <div className="flex items-center justify-between p-4 bg-[#1A1A1A]/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-white font-medium">AI Recommendation</p>
                  <p className="text-white/70 text-sm">Include AI-powered property recommendation</p>
                </div>
              </div>
              <Checkbox
                checked={addAIRecommendation}
                onCheckedChange={(checked) => setAddAIRecommendation(!!checked)}
              />
            </div>
          )}

          {/* Custom Branding Toggle */}
          {canCustomBrand && (
            <div className="flex items-center justify-between p-4 bg-[#1A1A1A]/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-[#1A1A1A]" />
                <div>
                  <p className="text-white font-medium">Custom Branding</p>
                  <p className="text-white/70 text-sm">Add your own branding and contact info</p>
                </div>
              </div>
              <Checkbox
                checked={showBrandingOptions}
                onCheckedChange={(checked) => setShowBrandingOptions(!!checked)}
              />
            </div>
          )}

          {!canCustomBrand && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-200 text-sm">
                <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] mr-2">Professional</Badge>
                Upgrade to Professional or Enterprise to add custom branding
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Branding Options */}
      {showBrandingOptions && canCustomBrand && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#1A1A1A]" />
            Your Branding
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Your Name</Label>
              <Input
                value={brokerInfo.name}
                onChange={(e) => setBrokerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-white">Company Name</Label>
              <Input
                value={brokerInfo.company}
                onChange={(e) => setBrokerInfo(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Your brokerage company"
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-white">Phone Number</Label>
              <Input
                value={brokerInfo.phone}
                onChange={(e) => setBrokerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+971 XX XXX XXXX"
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-white">Email</Label>
              <Input
                value={brokerInfo.email}
                onChange={(e) => setBrokerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-white">Photo URL</Label>
              <Input
                value={brokerInfo.photoUrl}
                onChange={(e) => setBrokerInfo(prev => ({ ...prev, photoUrl: e.target.value }))}
                placeholder="https://example.com/photo.jpg"
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-white">Logo URL</Label>
              <Input
                value={brokerInfo.logoUrl}
                onChange={(e) => setBrokerInfo(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Checkbox
              checked={hideJJBranding}
              onCheckedChange={(checked) => setHideJJBranding(!!checked)}
            />
            <Label className="text-white/85">Remove JBJ Global Real Estate branding (white-label)</Label>
          </div>
        </motion.div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGeneratePDF}
          disabled={isGenerating || selectedProjects.length === 0}
          className="bg-gradient-to-r from-gold via-gold to-gold-dark text-[#1A1A1A] hover:brightness-110 py-6 px-8 text-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Generate Property PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Add Settings icon to lucide imports
const Settings = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
