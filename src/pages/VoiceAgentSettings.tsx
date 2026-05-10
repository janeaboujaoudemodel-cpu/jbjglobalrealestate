import { useState } from "react";
import { Phone, Building2, FileText, CreditCard, Save, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const VoiceAgentSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    agentName: "JBJ Real Estate Concierge",
    greeting: "Hello! Welcome to JBJ Global Real Estate. How can I help you today?",
    propertyAccessEnabled: true,
    documentGenerationEnabled: true,
    callLoggingEnabled: true,
    businessCardName: "",
    businessCardTitle: "",
    businessCardPhone: "",
    businessCardEmail: "",
    businessCardCompany: "JBJ Global Real Estate",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In production, this would save to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Voice agent settings saved!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      {/* Hero Section */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full mb-6">
            <Phone className="w-5 h-5 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A] font-medium text-sm">Voice Concierge Settings</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Voice Agent <span className="text-[#1A1A1A]">Configuration</span>
          </h1>
          
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Configure your AI voice concierge settings, branding, and integrations.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-8">
        {/* Agent Settings */}
        <div className="bg-[#FDFBF7]/80 border border-[#B89555]/30 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <h2 className="text-xl font-bold text-white">Agent Settings</h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-white/85 mb-2 block">Agent Name</Label>
              <Input
                value={settings.agentName}
                onChange={(e) => setSettings(s => ({ ...s, agentName: e.target.value }))}
                className="bg-[#F7F2EA] border-[#1A1A1A] text-white"
              />
            </div>

            <div>
              <Label className="text-white/85 mb-2 block">Greeting Message</Label>
              <Textarea
                value={settings.greeting}
                onChange={(e) => setSettings(s => ({ ...s, greeting: e.target.value }))}
                className="bg-[#F7F2EA] border-[#1A1A1A] text-white min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-[#FDFBF7]/80 border border-[#B89555]/30 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <h2 className="text-xl font-bold text-white">Integrations</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#F7F2EA] rounded-lg">
              <div>
                <h3 className="font-medium text-white">Property Listing Access</h3>
                <p className="text-sm text-white/70">Allow agent to search and recommend properties</p>
              </div>
              <Switch
                checked={settings.propertyAccessEnabled}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, propertyAccessEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F7F2EA] rounded-lg">
              <div>
                <h3 className="font-medium text-white">Document Generation</h3>
                <p className="text-sm text-white/70">Allow agent to trigger document creation</p>
              </div>
              <Switch
                checked={settings.documentGenerationEnabled}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, documentGenerationEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F7F2EA] rounded-lg">
              <div>
                <h3 className="font-medium text-white">Call Logging</h3>
                <p className="text-sm text-white/70">Log all voice conversations for review</p>
              </div>
              <Switch
                checked={settings.callLoggingEnabled}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, callLoggingEnabled: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Business Card Branding */}
        <div className="bg-[#FDFBF7]/80 border border-[#B89555]/30 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <h2 className="text-xl font-bold text-white">Business Card Branding</h2>
            <span className="text-xs text-white/90">Applied to generated documents</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-white/85 mb-2 block">Your Name</Label>
              <Input
                value={settings.businessCardName}
                onChange={(e) => setSettings(s => ({ ...s, businessCardName: e.target.value }))}
                placeholder="Enter your full name"
                className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
              />
            </div>

            <div>
              <Label className="text-white/85 mb-2 block">Title</Label>
              <Input
                value={settings.businessCardTitle}
                onChange={(e) => setSettings(s => ({ ...s, businessCardTitle: e.target.value }))}
                placeholder="e.g., Senior Property Consultant"
                className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
              />
            </div>

            <div>
              <Label className="text-white/85 mb-2 block">Phone</Label>
              <Input
                value={settings.businessCardPhone}
                onChange={(e) => setSettings(s => ({ ...s, businessCardPhone: e.target.value }))}
                placeholder="+971 XX XXX XXXX"
                className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
              />
            </div>

            <div>
              <Label className="text-white/85 mb-2 block">Email</Label>
              <Input
                value={settings.businessCardEmail}
                onChange={(e) => setSettings(s => ({ ...s, businessCardEmail: e.target.value }))}
                placeholder="your.email@jbjglobal.com"
                className="bg-[#F7F2EA] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-white/85 mb-2 block">Company Name</Label>
              <Input
                value={settings.businessCardCompany}
                onChange={(e) => setSettings(s => ({ ...s, businessCardCompany: e.target.value }))}
                className="bg-[#F7F2EA] border-[#1A1A1A] text-white"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-500 text-[#1A1A1A] font-bold py-6 text-lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VoiceAgentSettings;
