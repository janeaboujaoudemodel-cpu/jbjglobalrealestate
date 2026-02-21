import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Loader2, CheckCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PREFERENCE_CATEGORIES = [
  { id: "new_launches", label: "New Project Launches", description: "Off-plan & ready projects" },
  { id: "market_intelligence", label: "Market Intelligence", description: "Reports, data & insights" },
  { id: "investment_opportunities", label: "Investment Opportunities", description: "ROI-focused opportunities" },
  { id: "developer_promotions", label: "Developer Promotions", description: "Price drops, limited offers" },
  { id: "platform_updates", label: "Platform Updates", description: "AI tools, calculators & features" },
  { id: "event_invitations", label: "Event Invitations", description: "VIP events & property viewings" },
];

const EmailPreferences = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(true);
  const [preferences, setPreferences] = useState<string[]>(
    PREFERENCE_CATEGORIES.map(c => c.id)
  );

  useEffect(() => {
    const loadPreferences = async () => {
      if (!token) { setLoading(false); return; }
      
      try {
        // We need to load current preferences - use the subscribe table
        // Token-based lookup will happen server-side; for now just show defaults
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [token]);

  const togglePreference = (id: string) => {
    setPreferences(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("update-email-preferences", {
        body: {
          token,
          preferences,
          marketing_enabled: marketingEnabled,
          source: "preferences_page",
        },
      });
      if (error) throw error;
      setSaved(true);
      toast.success("Preferences saved successfully");
    } catch {
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-2xl border border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))] p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-2xl font-bold text-gold tracking-widest font-serif">JBJ GLOBAL</p>
          <p className="text-xs tracking-[0.3em] text-muted-foreground mb-4">REAL ESTATE</p>
          <div className="flex items-center justify-center gap-2">
            <Settings className="w-5 h-5 text-gold" />
            <h1 className="text-xl font-bold text-foreground">Manage Your Email Preferences</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Choose what updates you'd like to receive
          </p>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gold/30 bg-gold/5">
          <div>
            <p className="font-semibold text-foreground">Receive Marketing Emails</p>
            <p className="text-sm text-muted-foreground">Master switch for all email communications</p>
          </div>
          <Switch
            checked={marketingEnabled}
            onCheckedChange={(checked) => { setMarketingEnabled(checked); setSaved(false); }}
          />
        </div>

        {/* Category Checkboxes */}
        <div className={`space-y-3 transition-opacity ${marketingEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {PREFERENCE_CATEGORIES.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-gold/40 cursor-pointer transition-colors bg-card/50"
            >
              <input
                type="checkbox"
                checked={preferences.includes(cat.id)}
                onChange={() => togglePreference(cat.id)}
                className="w-4 h-4 rounded border-gold/50 text-gold focus:ring-gold/30 accent-[hsl(var(--gold))]"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Save Button */}
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSave}
          disabled={saving || saved}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
        </Button>

        <div className="pt-4 border-t border-border text-center">
          <Link to="/" className="text-sm text-gold hover:underline">
            ← Back to JBJ Global Real Estate
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailPreferences;
