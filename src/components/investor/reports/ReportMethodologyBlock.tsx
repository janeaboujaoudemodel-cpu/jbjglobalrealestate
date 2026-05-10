import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, ExternalLink, CheckCircle2 } from "lucide-react";

export default function ReportMethodologyBlock() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Shield className="w-5 h-5 text-[#1A1A1A]" />
        Report Methodology Transparency
      </h2>

      <Card className="border-2 border-[#B89555]/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <p className="text-foreground mb-4">
                All reports available here are based on official government data, regulator disclosures, 
                and verified market records. Methodology references are included inside each report where applicable.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Official DLD Data
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  RERA Verified
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Dubai REST API
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  JBJ Analysis Framework
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link to="/market-intelligence/methodology">
                <Button variant="secondary" className="gap-2">
                  View Report Methodology
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
