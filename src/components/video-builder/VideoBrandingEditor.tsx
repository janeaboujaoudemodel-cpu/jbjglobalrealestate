import { useState } from "react";
import { 
  Sparkles, ChevronRight, Upload, Image as ImageIcon, 
  Check, Eye, EyeOff, MapPin, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { VideoProject } from "@/pages/VideoBuilder";
import jbjLogo from "@/assets/jbj-fulllogo-dark-bg.png";

interface VideoBrandingEditorProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onNext: () => void;
}

const INTRO_TEMPLATES = [
  { id: "classic", label: "Classic", description: "Logo fade with tagline" },
  { id: "modern", label: "Modern", description: "Dynamic motion animation" },
  { id: "minimal", label: "Minimal", description: "Simple clean reveal" },
  { id: "luxury", label: "Luxury", description: "Elegant gold accents" },
];

const OUTRO_TEMPLATES = [
  { id: "contact", label: "Contact Card", description: "Logo + phone + email" },
  { id: "cta", label: "Call to Action", description: "Logo + 'Contact Us'" },
  { id: "social", label: "Social Links", description: "Logo + social icons" },
  { id: "minimal", label: "Minimal", description: "Logo only" },
];

const VideoBrandingEditor = ({ project, onUpdate, onNext }: VideoBrandingEditorProps) => {
  const [introTemplate, setIntroTemplate] = useState("luxury");
  const [outroTemplate, setOutroTemplate] = useState("contact");

  const handleToggleBranding = (key: keyof typeof project.branding) => {
    onUpdate({
      ...project,
      branding: {
        ...project.branding,
        [key]: !project.branding[key],
      },
    });
  };

  const brandingOptions = [
    {
      key: "showLogo" as const,
      label: "Show Logo",
      description: "Display JBJ Global Real Estate logo",
      icon: ImageIcon,
    },
    {
      key: "showIntro" as const,
      label: "Animated Intro",
      description: "Add branded intro animation",
      icon: Sparkles,
    },
    {
      key: "showOutro" as const,
      label: "Contact Outro",
      description: "End with contact information",
      icon: Check,
    },
    {
      key: "watermark" as const,
      label: "Watermark",
      description: "Subtle corner watermark throughout",
      icon: Eye,
    },
    {
      key: "priceOverlay" as const,
      label: "Price Overlay",
      description: "Show property price and location",
      icon: DollarSign,
    },
  ];

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Branding & Overlays
        </CardTitle>
        <CardDescription>
          Add professional branding elements, logos, and property information overlays.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Preview */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-16 rounded-lg overflow-hidden bg-black flex items-center justify-center p-2">
              <img
                src={jbjLogo}
                alt="JBJ Global Real Estate"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-medium">JBJ Global Real Estate</p>
              <p className="text-sm text-muted-foreground">Default brand logo</p>
            </div>
          </div>
        </div>

        {/* Branding Toggles */}
        <div className="space-y-4">
          <Label>Branding Elements</Label>
          {brandingOptions.map((option) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <option.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
              <Switch
                checked={project.branding[option.key]}
                onCheckedChange={() => handleToggleBranding(option.key)}
              />
            </div>
          ))}
        </div>

        {/* Intro Template */}
        {project.branding.showIntro && (
          <div className="space-y-3">
            <Label>Intro Animation Style</Label>
            <RadioGroup
              value={introTemplate}
              onValueChange={setIntroTemplate}
              className="grid grid-cols-2 gap-3"
            >
              {INTRO_TEMPLATES.map((template) => (
                <Label
                  key={template.id}
                  htmlFor={`intro-${template.id}`}
                  className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                    introTemplate === template.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={template.id} id={`intro-${template.id}`} className="sr-only" />
                  <span className="font-medium text-sm">{template.label}</span>
                  <span className="text-xs text-muted-foreground">{template.description}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Outro Template */}
        {project.branding.showOutro && (
          <div className="space-y-3">
            <Label>Outro Style</Label>
            <RadioGroup
              value={outroTemplate}
              onValueChange={setOutroTemplate}
              className="grid grid-cols-2 gap-3"
            >
              {OUTRO_TEMPLATES.map((template) => (
                <Label
                  key={template.id}
                  htmlFor={`outro-${template.id}`}
                  className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                    outroTemplate === template.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={template.id} id={`outro-${template.id}`} className="sr-only" />
                  <span className="font-medium text-sm">{template.label}</span>
                  <span className="text-xs text-muted-foreground">{template.description}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Property Overlay Preview */}
        {project.branding.priceOverlay && project.property && (
          <div className="space-y-3">
            <Label>Property Overlay Preview</Label>
            <div className="bg-black rounded-lg p-4 relative aspect-video max-w-sm">
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3">
                  <p className="font-semibold text-sm">{project.property.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{project.property.location}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-primary/20 text-primary text-xs">
                      Starting from AED {Math.round(project.property.price_from).toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </div>
              {project.branding.watermark && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-background/80 text-foreground text-xs">
                    JBJ Global
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Active Branding Elements</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(project.branding)
              .filter(([_, enabled]) => enabled)
              .map(([key]) => (
                <Badge key={key} variant="outline" className="bg-primary/10 text-primary">
                  <Check className="h-3 w-3 mr-1" />
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Badge>
              ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onNext}>
            Continue to Preview <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoBrandingEditor;
