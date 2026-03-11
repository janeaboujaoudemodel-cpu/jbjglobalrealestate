import { useState } from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, 
  Scale, 
  AlertTriangle, 
  FileCheck,
  Lock
} from "lucide-react";
import { useAgreementSaver } from "@/hooks/useAgreementSaver";

interface ContentTermsAcceptanceProps {
  onAcceptanceChange: (accepted: boolean) => void;
  isAccepted: boolean;
}

const CONTENT_LICENSE_SNAPSHOT = {
  title: "JBJ Global Real Estate - Content License Agreement",
  version: "1.0",
  sections: [
    "PERSONAL LICENSE: Non-transferable, non-exclusive license for personal professional development only.",
    "PROHIBITED ACTIONS: No sharing credentials, downloading, copying, redistributing, screen recording, or reselling.",
    "SECURITY MONITORING: Device fingerprinting, session tracking, and watermarking employed.",
    "LEGAL CONSEQUENCES: Violations subject to UAE Federal Law No. 38 of 2021 and Federal Decree-Law No. 5 of 2012. Fines up to AED 500,000, imprisonment up to 2 years.",
    "SINGLE DEVICE POLICY: Subscription restricted to a single device at any time.",
    "INTELLECTUAL PROPERTY: All content is exclusive property of JBJ Global Real Estate.",
  ],
  legal_basis: "UAE Federal Law No. 38 of 2021 (Copyright), UAE Federal Decree-Law No. 5 of 2012 (Cybercrimes)",
};

export default function ContentTermsAcceptance({ 
  onAcceptanceChange, 
  isAccepted 
}: ContentTermsAcceptanceProps) {
  const [termsExpanded, setTermsExpanded] = useState(false);
  const { saveAgreement } = useAgreementSaver();

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/80 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <h4 className="font-semibold text-white">Content Protection Notice</h4>
            <p className="text-sm text-zinc-400">
              All materials, courses, and content provided through the Broker Toolkit are 
              <span className="text-amber-400 font-medium"> exclusively licensed for your personal use</span>.
            </p>

            <div className="grid gap-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gold" />
                <span>Content is encrypted and watermarked with your unique ID</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                <span>Access restricted to one device per account</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-gold" />
                <span>Violations subject to UAE Federal Law No. 38 of 2021</span>
              </div>
            </div>

            <button
              onClick={() => setTermsExpanded(!termsExpanded)}
              className="text-gold text-sm underline hover:no-underline"
            >
              {termsExpanded ? "Hide full terms" : "Read full terms and conditions"}
            </button>

            {termsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-zinc-800/50 rounded-lg p-4 text-xs text-zinc-400 space-y-3 max-h-60 overflow-y-auto"
              >
                <h5 className="font-semibold text-white">CONTENT LICENSE AGREEMENT</h5>
                
                <p>
                  <strong className="text-white">1. PERSONAL LICENSE:</strong> This subscription grants you a 
                  non-transferable, non-exclusive license to access the educational content, tools, and 
                  materials ("Content") for your personal professional development only.
                </p>

                <p>
                  <strong className="text-white">2. PROHIBITED ACTIONS:</strong> You are strictly prohibited from:
                </p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Sharing your login credentials with any third party</li>
                  <li>Downloading, copying, or redistributing any Content</li>
                  <li>Screen recording, capturing, or photographing Content</li>
                  <li>Sharing Content via messaging apps, email, or any platform</li>
                  <li>Reselling or sublicensing access to the Content</li>
                </ul>

                <p>
                  <strong className="text-white">3. SECURITY MONITORING:</strong> Our system employs advanced 
                  security measures including device fingerprinting, session tracking, and watermarking. 
                  Any unauthorized sharing will be detected and traced back to your account.
                </p>

                <p>
                  <strong className="text-white">4. LEGAL CONSEQUENCES:</strong> Violation of these terms 
                  constitutes copyright infringement under UAE Federal Law No. 38 of 2021 (Copyright and 
                  Related Rights) and UAE Federal Decree-Law No. 5 of 2012 (Combating Cybercrimes). 
                  Violators may face:
                </p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Immediate account termination without refund</li>
                  <li>Civil liability for damages (minimum AED 250,000)</li>
                  <li>Criminal prosecution with fines up to AED 500,000</li>
                  <li>Imprisonment for up to 2 years</li>
                </ul>

                <p>
                  <strong className="text-white">5. SINGLE DEVICE POLICY:</strong> Your subscription is 
                  restricted to a single device at any time. Accessing from multiple devices simultaneously 
                  will trigger a security alert and may result in account suspension.
                </p>

                <p>
                  <strong className="text-white">6. INTELLECTUAL PROPERTY:</strong> All Content is the 
                  exclusive property of JBJ Global Real Estate and is protected by international copyright laws. 
                  The Content includes proprietary methodologies, training materials, and trade secrets.
                </p>

                <p>
                  <strong className="text-white">7. ACCEPTANCE:</strong> By checking the box below, you 
                  acknowledge that you have read, understood, and agree to be bound by these terms. You 
                  understand that this is a legally binding agreement enforceable under UAE law.
                </p>

                <div className="pt-3 border-t border-zinc-700">
                  <p className="text-zinc-500">
                    © {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
                    <br />
                    For copyright inquiries: LEGAL@JBJ.AE
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all bg-zinc-900/50 border-zinc-700 hover:border-zinc-600">
        <Checkbox
          checked={isAccepted}
          onCheckedChange={(checked) => onAcceptanceChange(checked === true)}
          className="mt-0.5"
        />
        <div className="text-sm">
          <span className="text-white font-medium">
            I accept the Content License Agreement
          </span>
          <p className="text-zinc-400 mt-1">
            I understand that this content is for my personal use only. I agree not to share, 
            copy, or distribute any materials, and I acknowledge the legal consequences of 
            violation under UAE law.
          </p>
        </div>
      </label>
    </div>
  );
}
