import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Bot, 
  Sparkles, 
  Palette, 
  FileSpreadsheet, 
  Download,
  GraduationCap,
  Target,
  Users,
  TrendingUp,
  BookOpen,
  Zap,
  Award,
  Headphones,
  Video,
  UserCheck,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface Addon {
  id: string;
  name: string;
  description: string | null;
  price_usd: number;
  price_aed: number;
  category: string;
  included_in_tiers: string[];
}

interface AddonSelectorProps {
  selectedTier: string;
  selectedAddons: string[];
  onAddonsChange: (addons: string[]) => void;
  currency: "USD" | "AED";
}

const ADDON_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf_generator: FileText,
  ai_comparison: Bot,
  ai_recommendation: Sparkles,
  custom_branding: Palette,
  excel_export: FileSpreadsheet,
  bulk_download: Download,
  closing_course: Target,
  objection_course: Users,
  lead_gen_course: TrendingUp,
  lead_mgmt_course: BookOpen,
  prospecting_course: Zap,
  market_course: Award,
  priority_support: Headphones,
  live_qa: Video,
  mentorship: UserCheck,
};

export default function AddonSelector({ 
  selectedTier, 
  selectedAddons, 
  onAddonsChange,
  currency 
}: AddonSelectorProps) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const { data, error } = await supabase
        .from("addon_tools")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (error) throw error;
      setAddons(data || []);
    } catch (error) {
      console.error("Error fetching addons:", error);
    } finally {
      setLoading(false);
    }
  };

  const isIncludedInTier = (addon: Addon) => {
    return addon.included_in_tiers.includes(selectedTier);
  };

  const toggleAddon = (addonId: string) => {
    const addon = addons.find(a => a.id === addonId);
    if (!addon || isIncludedInTier(addon)) return;

    if (selectedAddons.includes(addonId)) {
      onAddonsChange(selectedAddons.filter(id => id !== addonId));
    } else {
      onAddonsChange([...selectedAddons, addonId]);
    }
  };

  const getPrice = (addon: Addon) => {
    return currency === "USD" ? addon.price_usd : addon.price_aed;
  };

  const getCurrencySymbol = () => {
    return currency === "USD" ? "$" : "AED ";
  };

  const calculateTotal = () => {
    return selectedAddons.reduce((total, addonId) => {
      const addon = addons.find(a => a.id === addonId);
      if (addon && !isIncludedInTier(addon)) {
        return total + getPrice(addon);
      }
      return total;
    }, 0);
  };

  const groupedAddons = addons.reduce((acc, addon) => {
    if (!acc[addon.category]) {
      acc[addon.category] = [];
    }
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, Addon[]>);

  const categoryLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    tools: { label: "AI-Powered Tools", icon: Sparkles },
    courses: { label: "Training Courses", icon: GraduationCap },
    support: { label: "Support & Mentorship", icon: Headphones },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Customize Your Package</h3>
        <p className="text-[#1A1A1A]/70 text-sm">
          Add individual tools or courses to your plan. Items included in your tier are marked.
        </p>
      </div>

      {Object.entries(groupedAddons).map(([category, categoryAddons]) => {
        const categoryInfo = categoryLabels[category] || { label: category, icon: Sparkles };
        const CategoryIcon = categoryInfo.icon;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <CategoryIcon className="w-4 h-4 text-[#1A1A1A]" />
              {categoryInfo.label}
            </div>
            
            <div className="grid gap-2">
              {categoryAddons.map((addon) => {
                const AddonIcon = ADDON_ICONS[addon.id] || Sparkles;
                const isIncluded = isIncludedInTier(addon);
                const isSelected = selectedAddons.includes(addon.id) || isIncluded;

                return (
                  <motion.div
                    key={addon.id}
                    whileHover={{ scale: isIncluded ? 1 : 1.01 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isIncluded
                        ? "border-green-500/30 bg-green-500/5 cursor-default"
                        : isSelected
                        ? "border-[#B89555]/50 bg-[#EFE6D6]/5 cursor-pointer"
                        : "border-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
                    }`}
                    onClick={() => !isIncluded && toggleAddon(addon.id)}
                  >
                    {!isIncluded && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleAddon(addon.id)}
                        className="border-[#1A1A1A]"
                      />
                    )}
                    {isIncluded && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    <AddonIcon className={`w-5 h-5 ${isIncluded ? "text-green-400" : "text-[#1A1A1A]/70"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${isIncluded ? "text-green-300" : "text-white"}`}>
                          {addon.name}
                        </span>
                        {isIncluded && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            Included
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!isIncluded && (
                      <span className="text-[#1A1A1A] font-medium text-sm">
                        +{getCurrencySymbol()}{getPrice(addon)}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {calculateTotal() > 0 && (
        <div className="border-t border-[#1A1A1A] pt-4 mt-4">
          <div className="flex items-center justify-between text-lg">
            <span className="text-[#1A1A1A]/70">Add-ons Total:</span>
            <span className="text-[#1A1A1A] font-bold">
              +{getCurrencySymbol()}{calculateTotal()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
