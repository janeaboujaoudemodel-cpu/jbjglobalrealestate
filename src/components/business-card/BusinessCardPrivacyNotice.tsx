import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

// Rose neon palette (matches the Business Card Scanner tool theme)
const ACCENT = "#fb7185"; // rose-400
const ACCENT_SOFT = "rgba(251,113,133,0.14)";
const ACCENT_BORDER = "rgba(251,113,133,0.45)";
const ACCENT_GLOW = "0 0 0 1px rgba(251,113,133,0.35), 0 18px 60px -22px rgba(251,113,133,0.55)";

const BusinessCardPrivacyNotice = ({ onAccept, onDecline }: BusinessCardPrivacyNoticeProps) => {
  const [agreed, setAgreed] = useState(false);
  const { saveAgreement } = useAgreementSaver();

  const privacyPoints = [
    { icon: Lock, title: "End-to-End Encryption", description: "All scanned data is encrypted on your device with a unique key that only you possess." },
    { icon: Server, title: "No Server Storage", description: "Your contact data is never stored on our servers. Processing happens in real-time." },
    { icon: Eye, title: "Private Processing", description: "AI vision processing uses temporary, secure channels. No images or data are retained." },
    { icon: Trash2, title: "Complete Data Control", description: "You can delete all your data at any time. Closing the browser clears all session data." },
    { icon: UserCheck, title: "Consent-Based CRM Import", description: "Importing contacts to CRM requires explicit consent. You choose what data is shared." },
    { icon: Shield, title: "GDPR Compliant", description: "This tool complies with GDPR, CCPA, and other data protection regulations." },
  ];

  return (
    <div
      data-no-contrast-guard
      data-allow-dark-cta
      className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% -10%, rgba(251,113,133,0.18), transparent 60%), linear-gradient(180deg, #050912 0%, #07101F 60%, #04070D 100%)",
      }}
    >
      <div
        className="max-w-2xl w-full rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,16,31,0.92) 0%, rgba(4,7,13,0.96) 100%)",
          border: `1px solid ${ACCENT_BORDER}`,
          boxShadow: ACCENT_GLOW,
        }}
      >
        <div className="text-center px-6 pt-8 pb-4">
          <div className="flex justify-center mb-4">
            <div
              className="p-4 rounded-full"
              style={{ background: ACCENT_SOFT, border: `1px solid ${ACCENT_BORDER}` }}
            >
              <Shield className="h-12 w-12 allow-white" style={{ color: ACCENT }} />
            </div>
          </div>
          <h2 className="text-2xl font-semibold allow-white" style={{ color: "#FFFFFF" }}>
            Privacy &amp; Data Protection
          </h2>
          <p className="text-base mt-2 allow-white" style={{ color: "rgba(255,255,255,0.72)" }}>
            Before using the AI Business Card Scanner, please review how we protect your data
          </p>
        </div>

        <div className="px-6 pb-6 space-y-6">
          <div className="grid gap-3">
            {privacyPoints.map((point, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${ACCENT_BORDER}`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="p-2 rounded-full"
                    style={{ background: ACCENT_SOFT, border: `1px solid ${ACCENT_BORDER}` }}
                  >
                    <point.icon className="h-5 w-5 allow-white" style={{ color: ACCENT }} />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm allow-white" style={{ color: "#FFFFFF" }}>
                    {point.title}
                  </h4>
                  <p className="text-sm mt-1 allow-white" style={{ color: "rgba(255,255,255,0.72)" }}>
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-start space-x-3 pt-4"
            style={{ borderTop: `1px solid ${ACCENT_BORDER}` }}
          >
            <Checkbox
              id="privacy-consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="border-rose-400/60 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
            />
            <label
              htmlFor="privacy-consent"
              className="text-sm leading-relaxed cursor-pointer allow-white"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              I understand and agree to the privacy terms.
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 px-6 pb-6 pt-2">
          <Button
            variant="outline"
            data-allow-dark-cta
            data-no-contrast-guard
            className="allow-white w-full sm:w-auto"
            style={{
              background: "transparent",
              border: `1px solid ${ACCENT_BORDER}`,
              color: "#FFFFFF",
            }}
            onClick={onDecline}
          >
            <XCircle className="h-4 w-4 mr-2 allow-white" />
            Decline &amp; Go Back
          </Button>
          <Button
            data-allow-dark-cta
            data-no-contrast-guard
            className="allow-white w-full sm:flex-1 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #9f1239 100%)`,
              color: "#FFFFFF",
              border: `1px solid ${ACCENT_BORDER}`,
              boxShadow: "0 12px 30px -12px rgba(251,113,133,0.55)",
            }}
            disabled={!agreed}
            onClick={async () => {
              await saveAgreement({
                agreementType: "business_card_privacy",
                agreementSnapshot: {
                  title: "AI Business Card Scanner - Privacy & Data Protection",
                  points: privacyPoints.map((p) => ({ title: p.title, description: p.description })),
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
  );
};

export default BusinessCardPrivacyNotice;
