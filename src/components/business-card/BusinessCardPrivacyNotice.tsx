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
import BackNavButton from "@/components/BackNavButton";

interface BusinessCardPrivacyNoticeProps {
  onAccept: () => void;
  onDecline: () => void;
}

const BusinessCardPrivacyNotice = ({ onAccept, onDecline }: BusinessCardPrivacyNoticeProps) => {
  const [agreed, setAgreed] = useState(false);

  const privacyPoints = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All scanned data is encrypted on your device with a unique key that only you possess. Even we cannot access your data."
    },
    {
      icon: Server,
      title: "No Server Storage",
      description: "Your contact data is never stored on our servers. Processing happens in real-time and data is immediately discarded after extraction."
    },
    {
      icon: Eye,
      title: "Private Processing",
      description: "AI vision processing uses temporary, secure channels. No images or extracted data are logged or retained."
    },
    {
      icon: Trash2,
      title: "Complete Data Control",
      description: "You can delete all your data at any time with a single click. Closing the browser automatically clears all session data."
    },
    {
      icon: UserCheck,
      title: "Consent-Based CRM Import",
      description: "Importing contacts to CRM requires explicit consent. You choose what data is shared and can revoke access anytime."
    },
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "This tool is designed with privacy-by-design principles and complies with GDPR, CCPA, and other data protection regulations."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Privacy & Data Protection Notice</CardTitle>
          <CardDescription className="text-base">
            Before using the AI Business Card Scanner, please review how we protect your data
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {privacyPoints.map((point, index) => (
              <div key={index} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <point.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{point.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-semibold mb-2">What platform administrators can see:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Total number of scans performed (anonymous count)
              </li>
              <li className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                System performance metrics
              </li>
              <li className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Error rates for quality improvement
              </li>
              <li className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                Your scanned images (never accessed)
              </li>
              <li className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                Extracted contact details (never accessed)
              </li>
              <li className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                Your personal usage patterns (never tracked)
              </li>
            </ul>
          </div>
          
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox 
              id="privacy-consent" 
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label 
              htmlFor="privacy-consent" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              I understand and agree to the privacy terms. I acknowledge that my scanned data 
              is encrypted client-side and that only I have access to my extracted contacts.
            </label>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={onDecline}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Decline & Go Back
          </Button>
          <Button 
            className="w-full sm:w-auto"
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
