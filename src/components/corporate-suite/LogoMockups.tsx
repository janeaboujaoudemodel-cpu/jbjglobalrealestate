/**
 * LogoMockups — Business Card + Letterhead mockups with selectable layouts and color reflection.
 */
import { useState } from "react";
import { LogoPreview, type LogoData, svgToPng, triggerDownload } from "./logoCreatorTypes";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface Props {
  logo: LogoData;
  colors: { primary: string; secondary: string; accent: string };
  name: string;
  font: string;
}

type CardLayout = "horizontal" | "vertical" | "centered" | "minimal";
type LetterheadLayout = "logo-left" | "logo-center" | "logo-right";

export default function LogoMockups({ logo, colors, name, font }: Props) {
  const [cardLayout, setCardLayout] = useState<CardLayout>("horizontal");
  const [letterLayout, setLetterLayout] = useState<LetterheadLayout>("logo-left");

  const companyName = name || "Company Name";

  const downloadLetterheadPdf = async () => {
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      // Header bar
      pdf.setFillColor(colors.primary);
      pdf.rect(0, 0, 210, 25, "F");
      // Company name
      pdf.setTextColor("#ffffff");
      pdf.setFontSize(16);
      const textX = letterLayout === "logo-center" ? 105 : letterLayout === "logo-right" ? 180 : 20;
      const align = letterLayout === "logo-center" ? "center" : letterLayout === "logo-right" ? "right" : "left";
      pdf.text(companyName, textX, 16, { align });
      // Divider
      pdf.setDrawColor(colors.accent);
      pdf.setLineWidth(0.5);
      pdf.line(15, 28, 195, 28);
      // Body placeholder
      pdf.setTextColor("#374151");
      pdf.setFontSize(11);
      pdf.text("Dear Sir/Madam,", 20, 45);
      pdf.text("[Your letter content here]", 20, 55);
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor("#9ca3af");
      pdf.text(`${companyName} | www.company.com | info@company.com`, 105, 285, { align: "center" });
      pdf.save(`${companyName.replace(/\s+/g, "-")}-letterhead.pdf`);
      toast.success("Letterhead PDF downloaded");
    } catch {
      toast.error("PDF generation failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Card Mockup */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Business Card</p>
        {/* Layout Selector */}
        <div className="flex gap-1.5">
          {(["horizontal", "vertical", "centered", "minimal"] as const).map(l => (
            <button key={l} onClick={() => setCardLayout(l)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-semibold capitalize border-2 transition-all ${cardLayout === l ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}>
              {l}
            </button>
          ))}
        </div>
        {/* Card Preview */}
        <div className="flex justify-center">
          <BusinessCardPreview logo={logo} colors={colors} name={companyName} font={font} layout={cardLayout} />
        </div>
      </div>

      {/* Letterhead Mockup */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Letterhead</p>
        <div className="flex gap-1.5">
          {(["logo-left", "logo-center", "logo-right"] as const).map(l => (
            <button key={l} onClick={() => setLetterLayout(l)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-semibold capitalize border-2 transition-all ${letterLayout === l ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}>
              {l.replace("logo-", "")}
            </button>
          ))}
        </div>
        <LetterheadPreview logo={logo} colors={colors} name={companyName} font={font} layout={letterLayout} />
        <Button onClick={downloadLetterheadPdf} variant="outline" className="w-full gap-2 text-xs">
          <Download size={12} /> Download Letterhead PDF
        </Button>
      </div>
    </div>
  );
}

function BusinessCardPreview({ logo, colors, name, font, layout }: {
  logo: LogoData; colors: { primary: string; secondary: string; accent: string }; name: string; font: string; layout: CardLayout;
}) {
  const w = 350;
  const h = 200;

  if (layout === "vertical") {
    return (
      <div className="rounded-xl overflow-hidden shadow-lg flex flex-col" style={{ width: w, height: h + 60, background: colors.secondary }}>
        <div className="flex-shrink-0 p-4 flex justify-center" style={{ background: colors.primary }}>
          <LogoPreview svgContent={logo.svgContent} size={48} />
        </div>
        <div className="flex-1 p-4 flex flex-col justify-center items-center text-center">
          <p className="font-bold text-sm" style={{ color: colors.primary, fontFamily: font }}>{name}</p>
          <p className="text-[10px] mt-1" style={{ color: colors.accent }}>Professional Services</p>
          <div className="h-px w-12 my-2" style={{ background: colors.accent }} />
          <p className="text-[9px]" style={{ color: colors.primary + "99" }}>info@company.com</p>
          <p className="text-[9px]" style={{ color: colors.primary + "99" }}>+1 (555) 000-0000</p>
        </div>
      </div>
    );
  }

  if (layout === "centered") {
    return (
      <div className="rounded-xl overflow-hidden shadow-lg flex flex-col items-center justify-center p-6" style={{ width: w, height: h, background: colors.primary }}>
        <LogoPreview svgContent={logo.svgContent} size={48} />
        <p className="font-bold text-sm mt-3" style={{ color: colors.secondary, fontFamily: font }}>{name}</p>
        <div className="h-px w-16 my-2" style={{ background: colors.accent }} />
        <p className="text-[9px]" style={{ color: colors.secondary + "aa" }}>www.company.com</p>
      </div>
    );
  }

  if (layout === "minimal") {
    return (
      <div className="rounded-xl overflow-hidden shadow-lg flex items-center gap-4 p-6" style={{ width: w, height: h, background: "#ffffff", border: `2px solid ${colors.primary}22` }}>
        <LogoPreview svgContent={logo.svgContent} size={40} />
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: colors.primary, fontFamily: font }}>{name}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#9ca3af" }}>Professional Services</p>
          <div className="h-px w-8 my-2" style={{ background: colors.accent }} />
          <p className="text-[9px]" style={{ color: "#6b7280" }}>info@company.com</p>
        </div>
      </div>
    );
  }

  // Default: horizontal
  return (
    <div className="rounded-xl overflow-hidden shadow-lg flex" style={{ width: w, height: h, background: colors.primary }}>
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div><LogoPreview svgContent={logo.svgContent} size={48} /></div>
        <div>
          <p className="font-bold text-sm" style={{ color: colors.secondary, fontFamily: font }}>{name}</p>
          <p className="text-xs mt-0.5" style={{ color: colors.secondary + "b3" }}>Professional Services</p>
        </div>
      </div>
      <div className="w-24 flex flex-col justify-center items-center gap-1 p-2" style={{ borderLeft: `1px solid ${colors.accent}33` }}>
        <div className="text-[9px] text-center" style={{ color: colors.secondary + "99" }}>www.company.com</div>
        <div className="text-[9px] text-center" style={{ color: colors.secondary + "99" }}>info@company.com</div>
      </div>
    </div>
  );
}

function LetterheadPreview({ logo, colors, name, font, layout }: {
  logo: LogoData; colors: { primary: string; secondary: string; accent: string }; name: string; font: string; layout: LetterheadLayout;
}) {
  const logoEl = <LogoPreview svgContent={logo.svgContent} size={36} />;
  const nameEl = (
    <div>
      <p className="font-bold text-xs" style={{ color: colors.primary, fontFamily: font }}>{name}</p>
      <p className="text-[9px]" style={{ color: "#9ca3af" }}>www.company.com</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-5 space-y-3" style={{ maxWidth: 420 }}>
      {/* Header */}
      <div className={`flex items-center pb-3 border-b-2 ${
        layout === "logo-center" ? "flex-col gap-2 text-center" : layout === "logo-right" ? "flex-row-reverse" : ""
      }`} style={{ borderColor: colors.primary, justifyContent: layout === "logo-center" ? "center" : "space-between" }}>
        {logoEl}
        {nameEl}
      </div>
      {/* Body lines */}
      <div className="space-y-1.5 pt-2">
        <div className="h-2 rounded bg-gray-100 w-full" />
        <div className="h-2 rounded bg-gray-100 w-4/5" />
        <div className="h-2 rounded bg-gray-100 w-3/4" />
        <div className="h-2 rounded bg-gray-100 w-5/6 mt-3" />
        <div className="h-2 rounded bg-gray-100 w-2/3" />
      </div>
      {/* Footer */}
      <div className="pt-3 border-t" style={{ borderColor: colors.accent + "40" }}>
        <p className="text-[8px] text-center" style={{ color: "#9ca3af" }}>
          {name} | info@company.com | +1 (555) 000-0000 | 123 Business Ave
        </p>
      </div>
    </div>
  );
}
