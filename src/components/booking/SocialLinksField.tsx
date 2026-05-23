/**
 * SocialLinksField — structured social link rows: platform dropdown + URL input.
 */
import { Plus, X, Linkedin, Instagram, Facebook, Youtube, Globe2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type SocialLink = { platform: string; url: string };

const PLATFORMS = [
  { value: "linkedin",  label: "LinkedIn",   icon: Linkedin },
  { value: "instagram", label: "Instagram",  icon: Instagram },
  { value: "facebook",  label: "Facebook",   icon: Facebook },
  { value: "youtube",   label: "YouTube",    icon: Youtube },
  { value: "x",         label: "X / Twitter", icon: Globe2 },
  { value: "tiktok",    label: "TikTok",     icon: Globe2 },
  { value: "other",     label: "Other",      icon: Globe2 },
];

interface Props {
  value: SocialLink[];
  onChange: (next: SocialLink[]) => void;
}

export function SocialLinksField({ value, onChange }: Props) {
  const rows = value.length ? value : [{ platform: "linkedin", url: "" }];

  const update = (i: number, patch: Partial<SocialLink>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  };
  const add = () => onChange([...rows, { platform: "instagram", url: "" }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const platform = PLATFORMS.find((p) => p.value === row.platform) ?? PLATFORMS[0];
        const Icon = platform.icon;
        return (
          <div key={i} className="flex items-center gap-2">
            <Select value={row.platform} onValueChange={(v) => update(i, { platform: v })}>
              <SelectTrigger className="w-[140px] bg-white border-[#B89555]/30">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-[#B89555]" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <p.icon className="w-3.5 h-3.5" />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={row.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder={`https://${row.platform === "other" ? "" : row.platform + ".com/"}…`}
              className="bg-white border-[#B89555]/30 flex-1"
            />
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-2 text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                aria-label="Remove link"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
      {rows.length < 5 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add social link
        </Button>
      )}
    </div>
  );
}
