import type { FormData, TemplateConfig } from "./coverLetterTypes";
import type { TypographySettings } from "./DocumentTypographyControls";
import type { StampSignatureData } from "./DocumentStampIntegration";
import type { HeaderFooterSettings } from "./DocumentHeaderFooterBuilder";

interface LetterPreviewProps {
  form: FormData;
  letter: string;
  templateCfg: TemplateConfig;
  logoUrl: string;
  logoSize: number;
  stampData: StampSignatureData;
  typo: TypographySettings;
  headerFooter: HeaderFooterSettings;
  dividerStyle: string;
  scale?: number;
}

export default function LetterPreview({
  form, letter, templateCfg, logoUrl, logoSize, stampData, typo, headerFooter, dividerStyle, scale = 1,
}: LetterPreviewProps) {
  const cfg = templateCfg;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const paragraphs = letter.split(/\n{2,}/).filter(Boolean);
  const fs = (n: number) => n * scale;
  const sp = (n: number) => n * scale;

  const dividerBorder = dividerStyle === "dashed" ? "dashed" : dividerStyle === "double" ? "double" : "solid";
  const dividerW = dividerStyle === "double" ? 3 : 2;
  const divColor = dividerStyle === "gold" ? "#c8a45a" : cfg.dividerColor;

  return (
    <div
      style={{
        background: cfg.id === "dark" ? "#1a1a2e" : "#ffffff",
        fontFamily: typo.fontFamily || cfg.bodyFont,
        fontSize: fs(typo.fontSize || 11),
        color: cfg.textColor,
        minHeight: sp(560),
        boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
        borderRadius: sp(6),
        overflow: "hidden",
        lineHeight: 1.65,
      }}
    >
      {/* Header band */}
      <div style={{
        background: cfg.headerBg,
        padding: `${sp(22)}px ${sp(28)}px ${sp(18)}px`,
        borderBottom: `${dividerW}px ${dividerBorder} ${divColor}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            {headerFooter.showHeader && headerFooter.companyName ? (
              <>
                <h1 style={{ margin: 0, fontSize: fs(17), fontWeight: 700, color: cfg.accentColor, letterSpacing: -0.3 }}>
                  {headerFooter.companyName}
                </h1>
                {headerFooter.companyTagline && (
                  <p style={{ margin: `${sp(2)}px 0 0`, fontSize: fs(8), color: cfg.accentColor, opacity: 0.6, letterSpacing: 1 }}>
                    {headerFooter.companyTagline}
                  </p>
                )}
                {headerFooter.contactLine && (
                  <p style={{ margin: `${sp(4)}px 0 0`, fontSize: fs(8), color: cfg.textColor, opacity: 0.5 }}>
                    {headerFooter.contactLine}
                  </p>
                )}
              </>
            ) : (
              <>
                <h1 style={{ margin: 0, fontSize: fs(17), fontWeight: 700, color: cfg.accentColor, letterSpacing: -0.3 }}>
                  {form.yourName || "Your Name"}
                </h1>
                {form.yourTitle && (
                  <p style={{ margin: `${sp(2)}px 0 0`, fontSize: fs(9.5), color: cfg.accentColor, opacity: 0.7, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
                    {form.yourTitle}
                  </p>
                )}
                <div style={{ marginTop: sp(8), display: "flex", gap: sp(12), flexWrap: "wrap" }}>
                  {form.yourEmail && <span style={{ fontSize: fs(8.5), color: cfg.textColor, opacity: 0.65 }}>{form.yourEmail}</span>}
                  {form.yourPhone && <span style={{ fontSize: fs(8.5), color: cfg.textColor, opacity: 0.65 }}>{form.yourPhone}</span>}
                </div>
              </>
            )}
          </div>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" style={{ height: sp(logoSize * 0.45), maxWidth: sp(90), objectFit: "contain", borderRadius: sp(4) }} />
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: `${sp(20)}px ${sp(28)}px ${sp(24)}px` }}>
        <p style={{ fontSize: fs(9), color: cfg.textColor, opacity: 0.5, marginBottom: sp(14) }}>{today}</p>

        {form.recipientName && (
          <p style={{ fontSize: fs(10.5), marginBottom: sp(4), fontWeight: 500 }}>Dear {form.recipientName},</p>
        )}
        {!form.recipientName && (
          <p style={{ fontSize: fs(10.5), marginBottom: sp(4), fontWeight: 500 }}>Dear Hiring Manager,</p>
        )}

        {form.jobTitle && form.companyName && (
          <p style={{ fontSize: fs(9), opacity: 0.55, marginBottom: sp(14), fontStyle: "italic" }}>
            Re: <strong style={{ fontStyle: "normal" }}>{form.jobTitle}</strong> — {form.companyName}
          </p>
        )}

        {letter ? (
          paragraphs.map((para, i) => (
            <p key={i} style={{
              margin: `0 0 ${sp(12)}px`,
              textAlign: typo.textAlign,
              lineHeight: 1.7,
              fontSize: fs(typo.fontSize || 10.5),
              fontWeight: typo.bold ? 700 : 400,
              fontStyle: typo.italic ? "italic" : "normal",
              textDecoration: typo.underline ? "underline" : "none",
            }}>
              {para.trim()}
            </p>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: `${sp(40)}px 0`, opacity: 0.3 }}>
            <p style={{ fontSize: fs(11) }}>✦ Your document will appear here ✦</p>
          </div>
        )}

        {/* Sign-off */}
        {letter && (
          <div style={{ marginTop: sp(16) }}>
            <p style={{ fontSize: fs(10.5) }}>Yours sincerely,</p>
            {stampData.signatureUrl ? (
              <img src={stampData.signatureUrl} alt="Signature" style={{
                height: sp(44), maxWidth: sp(180), objectFit: "contain", display: "block",
                margin: `${sp(6)}px 0 ${sp(4)}px`, filter: "contrast(1.2)",
              }} />
            ) : (
              <div style={{ marginTop: sp(10), borderTop: `1px solid ${cfg.dividerColor}`, width: sp(140) }} />
            )}
            <p style={{ fontSize: fs(12), fontWeight: 700, color: cfg.accentColor, marginTop: sp(stampData.signatureUrl ? 2 : 8) }}>
              {form.yourName || "Your Name"}
            </p>
            {form.yourTitle && <p style={{ fontSize: fs(9), opacity: 0.6, marginTop: sp(2) }}>{form.yourTitle}</p>}

            {/* Stamp */}
            {stampData.stampUrl && (
              <img src={stampData.stampUrl} alt="Stamp" style={{
                height: sp(60), objectFit: "contain", display: "block", marginTop: sp(8), opacity: 0.85,
              }} />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {headerFooter.showFooter && (
        <div style={{
          borderTop: `1px solid ${divColor}`,
          padding: `${sp(8)}px ${sp(28)}px`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: fs(7), color: cfg.textColor, opacity: 0.4 }}>
            {headerFooter.copyrightText || "© 2026"}
          </span>
          {headerFooter.footerLinks && (
            <span style={{ fontSize: fs(7), color: cfg.accentColor, opacity: 0.5 }}>
              {headerFooter.footerLinks}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
