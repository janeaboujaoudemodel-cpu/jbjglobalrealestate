import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface FeaturedCard {
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
}

export interface Testimonial {
  name: string;
  role: string;
  text: string;
}

export interface LandingPageData {
  heroBio: string;
  socialLinks: SocialLink[];
  featuredCards: FeaturedCard[];
  testimonials: Testimonial[];
}

const DEFAULT_SOCIAL_PLATFORMS = [
  { platform: "LinkedIn", icon: "🔗" },
  { platform: "Instagram", icon: "📸" },
  { platform: "Twitter / X", icon: "𝕏" },
  { platform: "Facebook", icon: "📘" },
  { platform: "YouTube", icon: "▶️" },
  { platform: "TikTok", icon: "🎵" },
  { platform: "WhatsApp", icon: "💬" },
  { platform: "Telegram", icon: "✈️" },
];

export const EMPTY_LANDING_PAGE: LandingPageData = {
  heroBio: "",
  socialLinks: [],
  featuredCards: [],
  testimonials: [],
};

interface Props {
  data: LandingPageData;
  onChange: (data: LandingPageData) => void;
  primaryColor: string;
}

export default function DigitalLandingPageEditor({ data, onChange, primaryColor }: Props) {
  const [openSection, setOpenSection] = useState<string>("bio");

  const update = (partial: Partial<LandingPageData>) => onChange({ ...data, ...partial });

  const addSocialLink = () => {
    const unused = DEFAULT_SOCIAL_PLATFORMS.find(
      p => !data.socialLinks.some(s => s.platform === p.platform)
    );
    update({
      socialLinks: [
        ...data.socialLinks,
        { platform: unused?.platform || "Other", url: "", icon: unused?.icon || "🔗" },
      ],
    });
  };

  const updateSocial = (idx: number, partial: Partial<SocialLink>) => {
    const updated = data.socialLinks.map((s, i) => (i === idx ? { ...s, ...partial } : s));
    update({ socialLinks: updated });
  };

  const removeSocial = (idx: number) => {
    update({ socialLinks: data.socialLinks.filter((_, i) => i !== idx) });
  };

  const addFeaturedCard = () => {
    update({
      featuredCards: [
        ...data.featuredCards,
        { title: "", subtitle: "", imageUrl: "", link: "" },
      ],
    });
  };

  const updateFeatured = (idx: number, partial: Partial<FeaturedCard>) => {
    const updated = data.featuredCards.map((c, i) => (i === idx ? { ...c, ...partial } : c));
    update({ featuredCards: updated });
  };

  const removeFeatured = (idx: number) => {
    update({ featuredCards: data.featuredCards.filter((_, i) => i !== idx) });
  };

  const addTestimonial = () => {
    update({
      testimonials: [
        ...data.testimonials,
        { name: "", role: "", text: "" },
      ],
    });
  };

  const updateTestimonial = (idx: number, partial: Partial<Testimonial>) => {
    const updated = data.testimonials.map((t, i) => (i === idx ? { ...t, ...partial } : t));
    update({ testimonials: updated });
  };

  const removeTestimonial = (idx: number) => {
    update({ testimonials: data.testimonials.filter((_, i) => i !== idx) });
  };

  const sectionBtn = (id: string, label: string, count?: number) => (
    <button
      onClick={() => setOpenSection(openSection === id ? "" : id)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        openSection === id
          ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
          : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-[hsl(var(--muted-foreground))]">
        Landing Page Sections
      </p>

      {/* Hero Bio */}
      {sectionBtn("bio", "✨ Hero Bio")}
      {openSection === "bio" && (
        <div className="space-y-2 pl-1">
          <Label className="text-[10px] text-[hsl(var(--muted-foreground))]">Short biography / tagline (displayed below the card)</Label>
          <textarea
            value={data.heroBio}
            onChange={e => update({ heroBio: e.target.value })}
            placeholder="Passionate real estate professional with 10+ years of experience helping clients find their dream homes in Dubai..."
            rows={3}
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] resize-none"
          />
        </div>
      )}

      {/* Social Links */}
      {sectionBtn("social", "🔗 Social Links", data.socialLinks.length)}
      {openSection === "social" && (
        <div className="space-y-2 pl-1">
          {data.socialLinks.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={link.platform}
                onChange={e => {
                  const match = DEFAULT_SOCIAL_PLATFORMS.find(p => p.platform === e.target.value);
                  updateSocial(idx, { platform: e.target.value, icon: match?.icon || "🔗" });
                }}
                className="w-28 shrink-0 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-[11px] text-[hsl(var(--foreground))]"
              >
                {DEFAULT_SOCIAL_PLATFORMS.map(p => (
                  <option key={p.platform} value={p.platform}>{p.icon} {p.platform}</option>
                ))}
                <option value="Other">🔗 Other</option>
              </select>
              <Input
                value={link.url}
                onChange={e => updateSocial(idx, { url: e.target.value })}
                placeholder="https://..."
                className="h-8 text-xs flex-1"
              />
              <button onClick={() => removeSocial(idx)} className="text-[hsl(var(--destructive))] hover:opacity-70">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {data.socialLinks.length < 8 && (
            <Button variant="outline" size="sm" onClick={addSocialLink} className="w-full text-xs gap-1">
              <Plus size={12} /> Add Social Link
            </Button>
          )}
        </div>
      )}

      {/* Featured Cards */}
      {sectionBtn("featured", "🏢 Featured Projects / Listings", data.featuredCards.length)}
      {openSection === "featured" && (
        <div className="space-y-3 pl-1">
          {data.featuredCards.map((card, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">Card #{idx + 1}</span>
                <button onClick={() => removeFeatured(idx)} className="text-[hsl(var(--destructive))] hover:opacity-70">
                  <Trash2 size={12} />
                </button>
              </div>
              <Input
                value={card.title}
                onChange={e => updateFeatured(idx, { title: e.target.value })}
                placeholder="Property / Project name"
                className="h-8 text-xs"
              />
              <Input
                value={card.subtitle}
                onChange={e => updateFeatured(idx, { subtitle: e.target.value })}
                placeholder="Starting from AED 1.2M · Dubai Marina"
                className="h-8 text-xs"
              />
              <Input
                value={card.imageUrl}
                onChange={e => updateFeatured(idx, { imageUrl: e.target.value })}
                placeholder="Image URL (https://...)"
                className="h-8 text-xs"
              />
              <Input
                value={card.link}
                onChange={e => updateFeatured(idx, { link: e.target.value })}
                placeholder="Link URL (optional)"
                className="h-8 text-xs"
              />
            </div>
          ))}
          {data.featuredCards.length < 6 && (
            <Button variant="outline" size="sm" onClick={addFeaturedCard} className="w-full text-xs gap-1">
              <Plus size={12} /> Add Featured Card
            </Button>
          )}
        </div>
      )}

      {/* Testimonials */}
      {sectionBtn("testimonials", "⭐ Testimonials", data.testimonials.length)}
      {openSection === "testimonials" && (
        <div className="space-y-3 pl-1">
          {data.testimonials.map((t, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">Testimonial #{idx + 1}</span>
                <button onClick={() => removeTestimonial(idx)} className="text-[hsl(var(--destructive))] hover:opacity-70">
                  <Trash2 size={12} />
                </button>
              </div>
              <textarea
                value={t.text}
                onChange={e => updateTestimonial(idx, { text: e.target.value })}
                placeholder="What did the client say?"
                rows={2}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] resize-none"
              />
              <div className="flex gap-2">
                <Input
                  value={t.name}
                  onChange={e => updateTestimonial(idx, { name: e.target.value })}
                  placeholder="Client name"
                  className="h-8 text-xs"
                />
                <Input
                  value={t.role}
                  onChange={e => updateTestimonial(idx, { role: e.target.value })}
                  placeholder="e.g. Buyer"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          ))}
          {data.testimonials.length < 6 && (
            <Button variant="outline" size="sm" onClick={addTestimonial} className="w-full text-xs gap-1">
              <Plus size={12} /> Add Testimonial
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
