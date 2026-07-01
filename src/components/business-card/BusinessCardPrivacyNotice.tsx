import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Shield,
  Lock,
  Eye,
  Trash2,
  Server,
  UserCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAgreementSaver } from "@/hooks/useAgreementSaver";

interface BusinessCardPrivacyNoticeProps {
  onAccept: () => void;
  onDecline: () => void;
}

// Emerald scanner palette: emerald CTAs, pure-white ink, white hairlines — no gold.
const ACCENT = "#FFFFFF";
const CTA_GRADIENT = "linear-gradient(135deg, #065F46 0%, #04231A 58%, #022c1c 100%)";
const ACCENT_SOFT = "rgba(255,255,255,0.14)";
const ACCENT_BORDER = "rgba(255,255,255,0.45)";
const ACCENT_GLOW =
  "0 0 0 1px rgba(255,255,255,0.35), 0 18px 60px -22px rgba(255,255,255,0.55)";

const BusinessCardPrivacyNotice = ({
  onAccept,
  onDecline,
}: BusinessCardPrivacyNoticeProps) => {
  const [agreed, setAgreed] = useState(false);
  const { saveAgreement } = useAgreementSaver();

  const privacyPoints = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Encrypted on your device with a unique key only you possess.",
    },
    {
      icon: Server,
      title: "No Server Storage",
      description: "Contact data is never stored on our servers. Real-time only.",
    },
    {
      icon: Eye,
      title: "Private Processing",
      description: "AI vision uses temporary, secure channels. Nothing retained.",
    },
    {
      icon: Trash2,
      title: "Complete Data Control",
      description: "Delete anytime. Closing the browser clears all session data.",
    },
    {
      icon: UserCheck,
      title: "Consent-Based CRM Import",
      description: "Importing to CRM requires explicit consent — you choose.",
    },
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "Complies with GDPR, CCPA, and other data protection regulations.",
    },
  ];

  return (
    <div
      data-no-contrast-guard
      data-allow-dark-cta
      className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4 py-6"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% -10%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(180deg, #050912 0%, #07101F 60%, #04070D 100%)",
      }}
    >
      <div
        className="max-w-3xl w-full rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,16,31,0.94) 0%, rgba(4,7,13,0.97) 100%)",
          border: `1px solid ${ACCENT_BORDER}`,
          boxShadow: ACCENT_GLOW,
        }}
      >
        {/* Compact header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{
              background: ACCENT_SOFT,
              border: `1px solid ${ACCENT_BORDER}`,
            }}
          >
            <Shield className="h-5 w-5 allow-white" style={{ color: ACCENT }} />
          </div>
          <div className="min-w-0">
            <h2
              className="text-lg font-semibold leading-tight allow-white"
              style={{ color: "#FFFFFF" }}
            >
              Privacy &amp; Data Protection
            </h2>
            <p
              className="text-xs mt-0.5 allow-white"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              Review how we protect your data before using the AI Business Card
              Scanner.
            </p>
          </div>
        </div>

        {/* Compact 2-column grid */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {privacyPoints.map((point, index) => (
              <div
                key={index}
                className="flex gap-2.5 p-3 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: `1px solid ${ACCENT_BORDER}`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="p-1.5 rounded-md"
                    style={{
                      background: ACCENT_SOFT,
                      border: `1px solid ${ACCENT_BORDER}`,
                    }}
                  >
                    <point.icon
                      className="h-4 w-4 allow-white"
                      style={{ color: ACCENT }}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <h4
                    className="font-semibold text-[13px] leading-tight allow-white"
                    style={{ color: "#FFFFFF" }}
                  >
                    {point.title}
                  </h4>
                  <p
                    className="text-[12px] mt-0.5 leading-snug allow-white"
                    style={{ color: "rgba(255,255,255,0.78)" }}
                  >
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compact footer row: consent + CTAs */}
        <div
          className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ borderTop: `1px solid ${ACCENT_BORDER}` }}
        >
          <label
            htmlFor="privacy-consent"
            className="flex items-center gap-2 cursor-pointer flex-1 allow-white"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            <button
              type="button"
              role="checkbox"
              id="privacy-consent"
              aria-checked={agreed}
              onClick={(e) => {
                e.preventDefault();
                setAgreed((v) => !v);
              }}
              data-no-contrast-guard
              data-allow-dark-cta
              className="bcs-consent-box peer h-5 w-5 shrink-0 rounded-[5px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07101F]"
              style={{
                backgroundColor: agreed ? "#FFFFFF" : "rgba(255,255,255,0.06)",
                border: `1.5px solid ${agreed ? "#FFFFFF" : ACCENT_BORDER}`,
                padding: 0,
              }}
            >
              {agreed && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "#000000", display: "block" }}
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <span className="text-sm leading-snug">
              I understand and agree to the privacy terms.
            </span>
          </label>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white h-10 px-4"
              style={{
                background: "transparent",
                border: `1px solid ${ACCENT_BORDER}`,
                color: "#FFFFFF",
              }}
              onClick={onDecline}
            >
              <XCircle className="h-4 w-4 mr-2 allow-white" />
              Decline
            </Button>
            <Button
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white h-10 px-5 disabled:opacity-50"
              style={{
                background: CTA_GRADIENT,
                color: "#FFFFFF",
                border: `1px solid ${ACCENT_BORDER}`,
                boxShadow: "0 12px 30px -12px rgba(6,95,70,0.78)",
              }}
              disabled={!agreed}
              onClick={async () => {
                await saveAgreement({
                  agreementType: "business_card_privacy",
                  agreementSnapshot: {
                    title:
                      "AI Business Card Scanner - Privacy & Data Protection",
                    points: privacyPoints.map((p) => ({
                      title: p.title,
                      description: p.description,
                    })),
                    consent_text: "I understand and agree to the privacy terms.",
                  },
                });
                onAccept();
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2 allow-white" />
              Accept &amp; Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCardPrivacyNotice;
