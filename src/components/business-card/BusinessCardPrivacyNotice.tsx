import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  XCircle
} from "lucide-react";
import { useAgreementSaver } from "@/hooks/useAgreementSaver";


interface BusinessCardPrivacyNoticeProps {
  onAccept: () => void;
  onDecline: () => void;
}

const BusinessCardPrivacyNotice = ({ onAccept, onDecline }: BusinessCardPrivacyNoticeProps) => {
  const [agreed, setAgreed] = useState(false);
  const { saveAgreement } = useAgreementSaver();

  const privacyPoints = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All scanned data is encrypted on your device with a unique key that only you possess."
    },
    {
      icon: Server,
      title: "No Server Storage",
      description: "Your contact data is never stored on our servers. Processing happens in real-time."
    },
    {
      icon: Eye,
      title: "Private Processing",
      description: "AI vision processing uses temporary, secure channels. No images or data are retained."
    },
    {
      icon: Trash2,
      title: "Complete Data Control",
      description: "You can delete all your data at any time. Closing the browser clears all session data."
    },
    {
      icon: UserCheck,
      title: "Consent-Based CRM Import",
      description: "Importing contacts to CRM requires explicit consent. You choose what data is shared."
    },
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "This tool complies with GDPR, CCPA, and other data protection regulations."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-zinc-900/80 border-2 border-teal-500/30">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-teal-500/20 rounded-full border border-teal-500/40">
              <Shield className="h-12 w-12 text-teal-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Privacy & Data Protection</CardTitle>
          <CardDescription className="text-base text-zinc-400">
            Before using the AI Business Card Scanner, please review how we protect your data
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-3">
            {privacyPoints.map((point, index) => (
              <div key={index} className="flex gap-4 p-4 bg-zinc-800/50 border border-teal-500/20 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-teal-500/20 rounded-full border border-teal-500/30">
                    <point.icon className="h-5 w-5 text-teal-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">{point.title}</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-start space-x-3 pt-4 border-t border-zinc-700/50">
            <Checkbox 
              id="privacy-consent" 
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="border-teal-500/50 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
            />
            <label 
              htmlFor="privacy-consent" 
              className="text-sm leading-relaxed cursor-pointer text-zinc-300"
            >
              I understand and agree to the privacy terms.
            </label>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            onClick={onDecline}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Decline & Go Back
          </Button>
          <Button 
            className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white"
            disabled={!agreed}
            onClick={onAccept}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Accept & Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BusinessCardPrivacyNotice;
