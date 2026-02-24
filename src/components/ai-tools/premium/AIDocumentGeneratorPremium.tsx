import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FilePlus, Loader2, Copy, Check, Sparkles, FileText,
  Mail, MessageSquare, Share2, Newspaper, Building2, Users, Hash, Instagram, Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import { useAITool } from "../AIToolsProvider";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";
import AIToolGuide from "../AIToolGuide";

// ─── Per-Type Field Configurations ────────────────────────────────────────────

type FieldType = "input" | "textarea" | "select" | "radio";

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  rows?: number;
}

interface DocTypeConfig {
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  fields: FieldConfig[];
  showTone: boolean;
  outputHint: string;
}

const DOCUMENT_TYPE_CONFIGS: Record<string, DocTypeConfig> = {
  "listing": {
    label: "Property Listing",
    description: "A compelling portal listing for Bayut, PropertyFinder & Dubizzle",
    icon: Building2,
    showTone: true,
    outputHint: "Full listing with headline, overview, features & CTA",
    fields: [
      { key: "propertyName", label: "Property / Project Name *", type: "input", placeholder: "e.g. Emaar Beachfront – Marina Vista", required: true },
      { key: "location", label: "Area / Location *", type: "input", placeholder: "e.g. Dubai Marina, JBR", required: true },
      { key: "propertyType", label: "Property Type", type: "select", options: ["Apartment", "Villa", "Townhouse", "Penthouse", "Duplex", "Office", "Retail", "Plot", "Hotel Apartment"] },
      { key: "bedrooms", label: "Bedrooms", type: "select", options: ["Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR+", "Commercial"] },
      { key: "size", label: "Size (sqft)", type: "input", placeholder: "e.g. 1,250 sqft" },
      { key: "price", label: "Price (AED)", type: "input", placeholder: "e.g. AED 2,500,000" },
      { key: "developer", label: "Developer", type: "input", placeholder: "e.g. Emaar Properties" },
      { key: "handover", label: "Handover / Completion", type: "input", placeholder: "e.g. Q4 2026 / Ready Now" },
      { key: "viewType", label: "View Type", type: "select", options: ["Sea View", "Burj Khalifa View", "Golf View", "Park View", "Community View", "City View", "Partial Sea View", "No Specific View"] },
      { key: "amenities", label: "Key Amenities & Features", type: "textarea", placeholder: "Infinity pool, private beach, smart home, 24/7 concierge...", rows: 3 },
      { key: "roi", label: "Expected ROI / Rental Yield", type: "input", placeholder: "e.g. 6–8% annual" },
      { key: "paymentPlan", label: "Payment Plan", type: "input", placeholder: "e.g. 20/80, 10% down payment, post-handover" },
    ],
  },

  "email-follow-up": {
    label: "Follow-up Email",
    description: "Professional follow-up after a viewing or meeting",
    icon: Mail,
    showTone: true,
    outputHint: "Subject line + warm email body with next steps",
    fields: [
      { key: "clientName", label: "Client Name *", type: "input", placeholder: "e.g. Mr. Ahmed Al Mansoori", required: true },
      { key: "clientNationality", label: "Client Nationality / Background", type: "input", placeholder: "e.g. Saudi, British, Russian" },
      { key: "meetingDate", label: "Previous Meeting / Viewing Date", type: "input", placeholder: "e.g. 15 February 2026" },
      { key: "propertiesDiscussed", label: "Properties / Projects Discussed", type: "textarea", placeholder: "e.g. Sobha Hartland 2 villas, Dubai Hills townhouses", rows: 2 },
      { key: "clientBudget", label: "Client Budget", type: "input", placeholder: "e.g. AED 3–5M" },
      { key: "clientRequirements", label: "Key Requirements / Preferences", type: "textarea", placeholder: "e.g. sea view, 3BR, ready to move in, parking", rows: 2 },
      { key: "nextSteps", label: "Proposed Next Steps", type: "input", placeholder: "e.g. Schedule site visit next week, send EOI form" },
      { key: "urgency", label: "Client Urgency", type: "select", options: ["Low – just exploring", "Medium – actively looking", "High – ready to buy this month", "Very High – closing soon"] },
      { key: "agentName", label: "Agent Name (for signature)", type: "input", placeholder: "e.g. Sarah Al Rashidi" },
    ],
  },

  "email-introduction": {
    label: "Introduction Email",
    description: "First contact email to a new potential client",
    icon: Mail,
    showTone: true,
    outputHint: "Subject line + tailored intro email with value proposition",
    fields: [
      { key: "clientName", label: "Client Name *", type: "input", placeholder: "e.g. Mr. James Wilson", required: true },
      { key: "clientNationality", label: "Client Nationality", type: "input", placeholder: "e.g. British, Emirati, Indian" },
      { key: "howTheyFoundUs", label: "How They Found JBJ Global", type: "select", options: ["Bayut / PropertyFinder", "Instagram / Social Media", "Referral from friend", "Walk-in", "Website", "Event / Exhibition", "Google Search", "Other"] },
      { key: "interestedIn", label: "Property Interest", type: "select", options: ["Investment property", "Own use / residence", "Both investment & living", "Commercial space", "Rental property", "Off-plan only", "Ready property only"] },
      { key: "budget", label: "Budget Range", type: "input", placeholder: "e.g. AED 2–4M" },
      { key: "preferredAreas", label: "Preferred Areas / Communities", type: "textarea", placeholder: "e.g. Dubai Marina, Business Bay, Palm Jumeirah", rows: 2 },
      { key: "propertyType", label: "Preferred Property Type", type: "select", options: ["Apartment", "Villa", "Townhouse", "Penthouse", "Commercial", "Any"] },
      { key: "timeline", label: "Purchase Timeline", type: "select", options: ["Immediately", "Within 3 months", "3–6 months", "6–12 months", "Just researching"] },
      { key: "agentName", label: "Agent Name (for signature)", type: "input", placeholder: "e.g. Khalid Al Hamdan" },
    ],
  },

  "sms": {
    label: "SMS / WhatsApp",
    description: "Punchy SMS (160 chars) and WhatsApp (320 chars) messages",
    icon: MessageSquare,
    showTone: false,
    outputHint: "Two versions: SMS ≤160 chars & WhatsApp ≤320 chars",
    fields: [
      { key: "clientName", label: "Client Name", type: "input", placeholder: "e.g. Ahmed" },
      { key: "messagePurpose", label: "Message Purpose *", type: "select", options: ["New property alert", "Follow-up after viewing", "Price drop notification", "Open day invitation", "Payment plan offer", "Exclusive off-plan launch", "Mortgage rate update", "General check-in"], required: true },
      { key: "propertyHighlight", label: "Key Property / Offer Detail", type: "textarea", placeholder: "e.g. 2BR in Dubai Marina, AED 1.2M, 10% down, Q3 2026 handover", rows: 2 },
      { key: "callToAction", label: "Desired Action", type: "select", options: ["Call back", "Reply to this message", "Visit showroom", "Book viewing", "Click link to view", "WhatsApp us"] },
      { key: "includeLink", label: "Include Placeholder Link?", type: "radio", options: ["Yes – include [LINK]", "No – CTA only"] },
      { key: "agentName", label: "Agent Name (optional)", type: "input", placeholder: "e.g. Rania" },
    ],
  },

  "social-media": {
    label: "Social Media Post",
    description: "Platform-optimised posts for Instagram, LinkedIn, TikTok & more",
    icon: Share2,
    showTone: true,
    outputHint: "Post body + 3 hashtag sets + hook + CTA",
    fields: [
      { key: "platform", label: "Platform *", type: "select", options: ["Instagram", "LinkedIn", "TikTok", "Twitter / X", "Facebook", "Threads"], required: true },
      { key: "postGoal", label: "Post Goal", type: "select", options: ["Showcase a property", "Market update / insight", "Client success story", "Agent personal brand", "JBJ brand awareness", "Promote an event / launch", "Educational tip"] },
      { key: "propertyHighlights", label: "Property / Content Highlights *", type: "textarea", placeholder: "e.g. Stunning 3BR villa in Dubai Hills, private pool, AED 4.5M, ready to move in", rows: 3, required: true },
      { key: "includeEmojis", label: "Include Emojis?", type: "radio", options: ["Yes – use emojis", "No – text only"] },
      { key: "hashtagStyle", label: "Hashtag Style", type: "select", options: ["Dubai-focused", "Luxury real estate", "Investment-focused", "General UAE property", "Mix of all"] },
      { key: "callToAction", label: "CTA", type: "select", options: ["DM for details", "Link in bio", "Book a viewing", "WhatsApp us", "Comment below", "Save this post"] },
    ],
  },

  "newsletter": {
    label: "Newsletter",
    description: "Monthly or weekly email newsletter for your client database",
    icon: Newspaper,
    showTone: true,
    outputHint: "Full newsletter with headline, sections & CTA block",
    fields: [
      { key: "newsletterTopic", label: "Main Topic / Theme *", type: "input", placeholder: "e.g. Dubai real estate market update – Q1 2026", required: true },
      { key: "targetSegment", label: "Target Audience", type: "select", options: ["All clients", "Investors only", "Buyers looking for own use", "Rental / tenant leads", "Off-plan buyers", "High-net-worth clients", "International buyers"] },
      { key: "keyProperties", label: "Featured Properties to Highlight", type: "textarea", placeholder: "e.g. Emaar Beachfront 2BR @ AED 2.2M, Creek Harbour 1BR @ AED 1.1M", rows: 3 },
      { key: "marketStat", label: "Market Statistic to Include", type: "input", placeholder: "e.g. Dubai property transactions up 22% YoY in Q1 2026" },
      { key: "specialOffer", label: "Special Offer / Event", type: "input", placeholder: "e.g. Open day at The Palm Residences, Sat 22 Feb" },
      { key: "editionNumber", label: "Edition / Issue Number", type: "input", placeholder: "e.g. Issue #12 – February 2026" },
    ],
  },

  "brochure": {
    label: "Brochure Text",
    description: "Premium brochure copy for a property or development",
    icon: FileText,
    showTone: true,
    outputHint: "Sections: headline, overview, lifestyle, location, features",
    fields: [
      { key: "propertyName", label: "Property / Development Name *", type: "input", placeholder: "e.g. The Residences at Creek Harbour", required: true },
      { key: "developer", label: "Developer *", type: "input", placeholder: "e.g. Emaar Properties", required: true },
      { key: "location", label: "Location / Area", type: "input", placeholder: "e.g. Dubai Creek Harbour" },
      { key: "usps", label: "Unique Selling Points (USPs)", type: "textarea", placeholder: "Waterfront living, Burj Khalifa view, 5-star amenities, RERA approved", rows: 3 },
      { key: "lifestyleDesc", label: "Lifestyle Description", type: "textarea", placeholder: "Describe the lifestyle this property offers – e.g. beachfront, urban chic, family-friendly, serene retreat", rows: 2 },
      { key: "locationAdvantages", label: "Location Advantages", type: "textarea", placeholder: "5 mins to downtown, near metro, walking distance to mall, waterfront promenade", rows: 2 },
      { key: "priceRange", label: "Starting Price / Price Range", type: "input", placeholder: "e.g. From AED 1.8M" },
      { key: "targetBuyer", label: "Target Buyer Profile", type: "select", options: ["Investors", "Families", "Couples / professionals", "Expats", "Luxury buyers", "First-time buyers"] },
    ],
  },

  "client-report": {
    label: "Client Report",
    description: "Personalised property search report for a client",
    icon: Users,
    showTone: true,
    outputHint: "Formal report with summary, listings, and recommendation",
    fields: [
      { key: "clientName", label: "Client Name *", type: "input", placeholder: "e.g. Mr. & Mrs. Al Farsi", required: true },
      { key: "reportDate", label: "Report Date", type: "input", placeholder: "e.g. 18 February 2026" },
      { key: "budget", label: "Client Budget", type: "input", placeholder: "e.g. AED 3–6M" },
      { key: "requirements", label: "Key Requirements", type: "textarea", placeholder: "3BR, villa preferred, good schools nearby, gated community, ready to move in", rows: 3 },
      { key: "propertiesViewed", label: "Properties Viewed / Shortlisted", type: "textarea", placeholder: "1. Sobha Hartland 2 villa – AED 5.2M\n2. Dubai Hills 3BR – AED 4.8M\n3. Arabian Ranches 3 – AED 4.2M", rows: 4 },
      { key: "recommendation", label: "Agent Recommendation", type: "textarea", placeholder: "Based on their requirements, I recommend… because…", rows: 2 },
      { key: "nextSteps", label: "Agreed Next Steps", type: "input", placeholder: "e.g. Site visit scheduled for 22 Feb, EOI to be submitted" },
      { key: "agentName", label: "Agent Name", type: "input", placeholder: "e.g. Mariam Khalil" },
    ],
  },
};

// Quick-pick top 4
const QUICK_TYPES = ["listing", "email-follow-up", "sms", "social-media"];

const TONES = [
  { value: "professional", label: "Professional", desc: "Formal and business-like" },
  { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { value: "luxury", label: "Ultra-Luxury", desc: "Exclusive and sophisticated" },
  { value: "urgent", label: "Urgent", desc: "Time-sensitive and action-oriented" },
  { value: "casual", label: "Casual", desc: "Relaxed and conversational" },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AIDocumentGeneratorPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [documentType, setDocumentType] = useState("listing");
  const [tone, setTone] = useState("professional");
  const [typeFields, setTypeFields] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const config = DOCUMENT_TYPE_CONFIGS[documentType];

  const handleTypeChange = (newType: string) => {
    setDocumentType(newType);
    setTypeFields({});
  };

  const handleFieldChange = (key: string, value: string) => {
    setTypeFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const requiredFields = config.fields.filter((f) => f.required);
    const missing = requiredFields.filter((f) => !typeFields[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label.replace(" *", "")).join(", ")}`);
      return;
    }

    const result = await invokeTool("ai-document-generator", {
      documentType,
      tone: config.showTone ? tone : undefined,
      typeFields,
    });

    if (result?.success) {
      toast.success("Document generated!");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Field Renderer ──────────────────────────────────────────────────────────

  const renderField = (field: FieldConfig) => {
    const value = typeFields[field.key] || "";
    const baseInputClass =
      "bg-zinc-900/50 border-lime-500/30 text-white hover:border-lime-500/50 focus:border-lime-400 transition-colors placeholder:text-zinc-600";

    if (field.type === "input") {
      return (
        <Input
          key={field.key}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className={baseInputClass}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          key={field.key}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          rows={field.rows || 3}
          className={`${baseInputClass} min-h-[80px]`}
        />
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <Select key={field.key} value={value} onValueChange={(v) => handleFieldChange(field.key, v)}>
          <SelectTriggerDark className="border-lime-500/30 hover:border-lime-500/50">
            <SelectValue placeholder={field.placeholder || `Select ${field.label.replace(" *", "")}`} />
          </SelectTriggerDark>
          <SelectContentDark className="border-lime-500/30">
            {field.options.map((opt) => (
              <SelectItemDark key={opt} value={opt}>{opt}</SelectItemDark>
            ))}
          </SelectContentDark>
        </Select>
      );
    }

    if (field.type === "radio" && field.options) {
      return (
        <div key={field.key} className="flex gap-2 flex-wrap">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleFieldChange(field.key, opt)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                value === opt
                  ? "bg-lime-500/20 border-lime-500 text-lime-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  // ── Output Renderer (per type) ──────────────────────────────────────────────

  const renderOutput = () => {
    if (!response) return null;

    return (
      <motion.div
        key="results"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4"
      >
        {/* SMS: two version boxes */}
        {documentType === "sms" && (response.smsVersion || response.whatsappVersion) && (
          <>
            {response.smsVersion && (
              <Card className="bg-lime-900/20 border-lime-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-lime-400" />
                      <span className="text-sm font-semibold text-white">SMS Version</span>
                      <Badge className="bg-zinc-700 text-zinc-300 border-0 text-xs">
                        {response.smsVersion.length} / 160 chars
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(response.smsVersion, "sms")} className="text-zinc-400">
                      {copied === "sms" ? <Check className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="bg-zinc-800/60 p-3 rounded-lg text-zinc-200 text-sm">
                    {response.smsVersion}
                  </div>
                </CardContent>
              </Card>
            )}
            {response.whatsappVersion && (
              <Card className="bg-lime-900/20 border-lime-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-semibold text-white">WhatsApp Version</span>
                      <Badge className="bg-zinc-700 text-zinc-300 border-0 text-xs">
                        {response.whatsappVersion.length} / 320 chars
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(response.whatsappVersion, "wa")} className="text-zinc-400">
                      {copied === "wa" ? <Check className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="bg-zinc-800/60 p-3 rounded-lg text-zinc-200 text-sm">
                    {response.whatsappVersion}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Email: subject + body */}
        {(documentType === "email-follow-up" || documentType === "email-introduction") && response.subject && (
          <Card className="bg-lime-500/10 border-lime-500/30">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wide">Subject Line</p>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{response.subject}</p>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(response.subject, "subject")} className="text-zinc-400">
                  {copied === "subject" ? <Check className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Media: hook + hashtags */}
        {documentType === "social-media" && (
          <>
            {response.hook && (
              <Card className="bg-lime-500/10 border-lime-500/30">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wide">Opening Hook</p>
                  <p className="text-white font-medium italic">"{response.hook}"</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Property Listing: headline */}
        {documentType === "listing" && response.headline && (
          <Card className="bg-lime-500/10 border-lime-500/30">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wide">Listing Headline</p>
              <div className="flex items-center justify-between">
                <p className="font-bold text-white text-lg">{response.headline}</p>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(response.headline, "headline")} className="text-zinc-400">
                  {copied === "headline" ? <Check className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Document Body */}
        {response.document && (
          <Card className="bg-lime-900/20 border-lime-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white">Generated Content</h4>
                  <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
                    {config.label}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {documentType === "listing" && (
                    <Button
                      variant="dark-outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${response.headline || ""}\n\n${response.document}`, "portal")}
                      className="text-xs"
                    >
                      Copy Portal Format
                    </Button>
                  )}
                  <Button variant="dark-outline" size="sm" onClick={() => copyToClipboard(response.document, "main")}>
                    {copied === "main" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[450px] overflow-y-auto leading-relaxed">
                {response.document}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Media: hashtags */}
        {documentType === "social-media" && response.hashtags && response.hashtags.length > 0 && (
          <Card className="bg-lime-900/20 border-lime-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-lime-400" />
                  <span className="text-sm font-semibold text-white">Hashtags</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(response.hashtags.join(" "), "hashtags")} className="text-zinc-400">
                  {copied === "hashtags" ? <Check className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {response.hashtags.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-lime-500/10 border border-lime-500/20 rounded-full text-xs text-lime-400">
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Listing: key features */}
        {documentType === "listing" && response.keyFeatures && response.keyFeatures.length > 0 && (
          <Card className="bg-lime-900/20 border-lime-500/30">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Key Features</h4>
              <ul className="grid grid-cols-2 gap-1.5">
                {response.keyFeatures.map((feat: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Client Report: next steps */}
        {(documentType === "client-report" || documentType === "email-follow-up") && response.nextSteps && response.nextSteps.length > 0 && (
          <Card className="bg-lime-900/20 border-lime-500/30">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Next Steps</h4>
              <ol className="space-y-1">
                {response.nextSteps.map((step: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-lime-400 font-bold mt-0.5">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  };

  const Icon = config.icon;

  return (
    <AIToolPremiumLayout
      title="AI Document Generator"
      subtitle="Smart forms per document type — property listings, emails, SMS, social posts & more"
      icon={<FilePlus className="h-8 w-8 text-lime-400" />}
      accentColor="lime"
      gradientFrom="lime"
      badge="Content Creator"
    >
      <AIToolGuide
        description="Each document type has its own tailored input form. Fill in the relevant fields and the AI generates professional, ready-to-use content optimised for that specific format."
        steps={[
          "Pick your document type from the grid or dropdown",
          "Fill in the smart fields tailored to that type",
          "Hit Generate and get polished, ready-to-use content",
          "Copy the output directly or adapt it as needed"
        ]}
        benefits={[
          "8 document types with unique smart forms",
          "SMS has a dedicated 160 / 320 char output",
          "Listing outputs portal-ready format",
          "Social posts include hashtag sets"
        ]}
        accentColor="lime"
      />

      <div className="space-y-8">
        {/* ── Input Section ── */}
        <Card className="bg-lime-900/20 border-lime-500/30">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-lime-400 mb-2">
              <FilePlus className="h-5 w-5" />
              <span className="font-semibold">Document Setup</span>
            </div>

            {/* Quick-pick type grid */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Document Type *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {QUICK_TYPES.map((typeKey) => {
                  const cfg = DOCUMENT_TYPE_CONFIGS[typeKey];
                  const TypeIcon = cfg.icon;
                  return (
                    <button
                      key={typeKey}
                      onClick={() => handleTypeChange(typeKey)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        documentType === typeKey
                          ? "bg-lime-500/20 border-lime-500/60 text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      <TypeIcon className="h-4 w-4 mb-1" />
                      <span className="text-xs block leading-tight">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
              {/* More types dropdown */}
              <Select value={documentType} onValueChange={handleTypeChange}>
                <SelectTriggerDark className="border-lime-500/30 hover:border-lime-500/50 mt-2">
                  <SelectValue placeholder="More document types..." />
                </SelectTriggerDark>
                <SelectContentDark className="border-lime-500/30">
                  {Object.entries(DOCUMENT_TYPE_CONFIGS).map(([key, cfg]) => (
                    <SelectItemDark key={key} value={key}>{cfg.label}</SelectItemDark>
                  ))}
                </SelectContentDark>
              </Select>
            </div>

            {/* Type description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={documentType}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-start gap-3 bg-lime-500/5 border border-lime-500/20 rounded-lg p-3"
              >
                <Icon className="h-5 w-5 text-lime-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-lime-300">{config.label}</p>
                  <p className="text-xs text-zinc-400">{config.description}</p>
                  <p className="text-xs text-lime-500/70 mt-0.5">Output: {config.outputHint}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Tone selector (hidden for SMS) */}
            {config.showTone && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTriggerDark className="border-lime-500/30 hover:border-lime-500/50">
                    <SelectValue />
                  </SelectTriggerDark>
                  <SelectContentDark className="border-lime-500/30">
                    {TONES.map((t) => (
                      <SelectItemDark key={t.value} value={t.value}>
                        <span>{t.label}</span>
                        <span className="text-xs text-zinc-500 ml-2">{t.desc}</span>
                      </SelectItemDark>
                    ))}
                  </SelectContentDark>
                </Select>
              </div>
            )}

            {/* Dynamic per-type fields */}
            <AnimatePresence mode="wait">
              <motion.div
                key={documentType + "-fields"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {config.fields.map((field) => (
                  <div
                    key={field.key}
                    className={`space-y-1.5 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                  >
                    <Label className="text-zinc-300 text-xs">{field.label}</Label>
                    {renderField(field)}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-lime-600 to-lime-500 hover:from-lime-500 hover:to-lime-400 text-white font-semibold py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating {config.label}...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate {config.label}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── Results Section ── */}
        <AnimatePresence mode="wait">
          {response ? (
            renderOutput()
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-6 rounded-full bg-lime-500/10 mb-4">
                <FilePlus className="h-12 w-12 text-lime-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Ready to Create</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Select a document type, fill in the smart fields, and generate professional content instantly
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIDocumentGeneratorPremium;
