import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileEdit, MessageCircle, ArrowRight } from "lucide-react";

export default function RequestReportSection() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <FileEdit className="w-5 h-5 text-[#1A1A1A]" />
        Request a Report
      </h2>

      <Card className="border-2 border-[#B89555]/30 bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black text-white">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-semibold mb-3">
                Need a Specific Report?
              </h3>
              <p className="text-[#1A1A1A]/70 mb-6 max-w-lg">
                If you require a specific area analysis, asset comparison, or briefing not currently 
                available, you may request a custom report through our advisory team. Custom reports 
                are tailored to your investment interests and requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link to="/contact?subject=custom-report">
                  <Button variant="primary" size="lg" className="gap-2 w-full sm:w-auto">
                    <FileEdit className="w-5 h-5" />
                    Request a Custom Report
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="secondary" size="lg" className="gap-2 w-full sm:w-auto">
                    <MessageCircle className="w-5 h-5" />
                    Speak With an Advisor
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex w-32 h-32 bg-[#EFE6D6]/10 rounded-full items-center justify-center flex-shrink-0">
              <FileEdit className="w-16 h-16 text-[#1A1A1A]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
