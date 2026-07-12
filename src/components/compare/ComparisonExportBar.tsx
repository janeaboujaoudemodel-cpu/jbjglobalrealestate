import { useState } from "react";
import { Download, FileImage, FileText, Presentation, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { exportComparison, type ExportFormat, type ExportTheme } from "@/utils/exportComparison";

interface Project {
  name: string;
  developer?: { name?: string } | null;
  location?: string | null;
  price_from?: number | null;
  slug?: string | null;
  id?: string;
}

interface Props {
  targetSelector: string;
  projects: Project[];
}

const FORMATS: { key: ExportFormat; label: string; icon: any }[] = [
  { key: "pdf", label: "PDF Document", icon: FileText },
  { key: "png", label: "PNG Image (High-Res)", icon: FileImage },
  { key: "jpg", label: "JPG Image", icon: FileImage },
  { key: "pptx", label: "PowerPoint (PPTX)", icon: Presentation },
];

export default function ComparisonExportBar({ targetSelector, projects }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  const mappedProjects = projects.map((p) => ({
    name: p.name,
    developer: p.developer?.name || "",
    location: p.location || "Dubai",
    price: p.price_from ? `AED ${(p.price_from / 1_000_000).toFixed(1)}M` : "Price on request",
    url: p.slug ? `${window.location.origin}/property/${p.slug}` : (p.id ? `${window.location.origin}/property/${p.id}` : window.location.href),
  }));

  const run = async (format: ExportFormat, theme: ExportTheme) => {
    const key = `${format}-${theme}`;
    setBusy(key);
    try {
      await exportComparison(targetSelector, format, {
        theme,
        projects: mappedProjects,
        filename: `JBJ-Comparison-${theme === "emerald" ? "Emerald" : "White"}-${new Date().toISOString().slice(0,10)}`,
      });
      toast.success(`${format.toUpperCase()} (${theme}) exported`);
    } catch (e) {
      console.error(e);
      toast.error(`Export failed: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const btnEmerald: React.CSSProperties = {
    backgroundImage: "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)",
    color: "#FFFFFF",
    border: "1px solid rgba(255,255,255,0.24)",
    boxShadow: "0 10px 24px -12px rgba(6,78,59,0.7)",
  };

  return (
    <div className="inline-flex gap-2 flex-wrap">
      {(["emerald", "white"] as ExportTheme[]).map((theme) => (
        <DropdownMenu key={theme}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-no-contrast-guard
              data-allow-dark-cta
              className="allow-white inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold rounded-xl"
              style={theme === "emerald" ? btnEmerald : {
                background: "#FFFFFF",
                color: "#064E3B",
                border: "1px solid rgba(6,78,59,0.35)",
                boxShadow: "0 10px 24px -12px rgba(0,0,0,0.15)",
              }}
            >
              {busy?.endsWith(theme) ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme === "emerald" ? "#FFFFFF" : "#064E3B" }} />
              ) : (
                <Download className="w-4 h-4" style={{ color: theme === "emerald" ? "#FFFFFF" : "#064E3B" }} />
              )}
              <span style={{ color: theme === "emerald" ? "#FFFFFF" : "#064E3B" }}>
                Export · {theme === "emerald" ? "Emerald" : "White"}
              </span>
              <ChevronDown className="w-4 h-4" style={{ color: theme === "emerald" ? "#FFFFFF" : "#064E3B" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              {theme === "emerald" ? "Emerald Presentation" : "White Clean Report"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {FORMATS.map(({ key, label, icon: Icon }) => (
              <DropdownMenuItem
                key={key}
                disabled={busy !== null}
                onClick={() => run(key, theme)}
                className="cursor-pointer"
              >
                <Icon className="w-4 h-4 mr-2 text-[#064E3B]" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}
