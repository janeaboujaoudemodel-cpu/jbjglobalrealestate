import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, CheckCircle, XCircle, Loader2, Building2, 
  Briefcase, Trophy, Calendar, Hash, ArrowLeft, Shield
} from "lucide-react";
import { JJLogoImage } from "@/components/JJLogoImage";

interface Certificate {
  id: string;
  certificate_number: string;
  full_name: string;
  track: string;
  company_score: number;
  real_estate_score: number;
  combined_score: number;
  issued_at: string;
  is_revoked: boolean;
  revoked_reason?: string;
}

export default function VerifyCertificate() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      verifyCertificate();
    }
  }, [token]);

  const verifyCertificate = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("hr_certificates")
        .select("id, certificate_number, full_name, track, company_score, real_estate_score, combined_score, issued_at, is_revoked, revoked_reason")
        .eq("verification_token", token)
        .maybeSingle();

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        setError("Certificate not found. The verification link may be invalid.");
        return;
      }

      setCertificate(data as Certificate);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to verify certificate. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gold mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Card className="bg-card border-destructive/50">
            <CardContent className="pt-8 pb-6">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild variant="outline">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isValid = !certificate.is_revoked;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <JJLogoImage className="h-12 mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Certificate Verification</h1>
          <p className="text-muted-foreground">Verify the authenticity of a JBJ Global Real Estate certificate</p>
        </div>

        {/* Status Card */}
        <Card className={`mb-6 ${isValid ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isValid ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {isValid ? (
                  <Shield className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div>
                <Badge className={isValid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                  {isValid ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> VERIFIED</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> REVOKED</>
                  )}
                </Badge>
                <h2 className="text-xl font-semibold text-foreground mt-2">
                  {isValid ? "This certificate is authentic and valid" : "This certificate has been revoked"}
                </h2>
                {certificate.revoked_reason && (
                  <p className="text-sm text-red-500 mt-1">Reason: {certificate.revoked_reason}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Details */}
        <Card className="bg-card border-border">
          <CardHeader className="text-center border-b border-border">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-gold" />
            </div>
            <CardTitle className="text-2xl">{certificate.full_name}</CardTitle>
            <CardDescription>Broker Partner Training Program</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Certificate Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Certificate Number</p>
                  <p className="font-medium text-foreground">{certificate.certificate_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Issue Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(certificate.issued_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Training Scores */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Training Scores</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Building2 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{certificate.company_score}%</p>
                  <p className="text-xs text-muted-foreground">Company Knowledge</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Briefcase className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{certificate.real_estate_score}%</p>
                  <p className="text-xs text-muted-foreground">Real Estate Basics</p>
                </div>
                <div className="text-center p-4 bg-gold/10 rounded-lg border border-gold/30">
                  <Trophy className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gold">{certificate.combined_score}%</p>
                  <p className="text-xs text-muted-foreground">Combined Score</p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Educational content only. Not an accredited training institute.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to JBJ Global Real Estate
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
