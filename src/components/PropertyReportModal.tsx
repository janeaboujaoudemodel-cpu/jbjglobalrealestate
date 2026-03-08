import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Mail, Send, MessageCircle, FileText, Loader2, Check, Phone, Eye, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PropertyReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    slug: string;
    developer?: { name: string } | null;
    location?: string | null;
    emirate?: string | null;
    community?: { name: string } | null;
    description?: string | null;
    price_from?: number | null;
    price_to?: number | null;
    bedrooms_min?: number | null;
    bedrooms_max?: number | null;
    size_min?: number | null;
    size_max?: number | null;
    handover_date?: string | null;
    payment_plan?: string | null;
    amenities?: string[] | null;
    facilities?: string[] | null;
    views?: string[] | null;
    furnished_status?: string | null;
    floors?: number | null;
    service_charge?: string | null;
    images?: Array<{ image_url: string; alt_text?: string | null }> | null;
    documents?: Array<{ file_url: string; file_name: string; document_type: string }> | null;
  };
}

const WHATSAPP_NUMBER = "971565911000";
const JJ_EMAIL = "Contact@JBJ.ae";

const PropertyReportModal = ({ open, onOpenChange, project }: PropertyReportModalProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);

  const generateReport = async () => {
    const projectData = {
      id: project.id,
      name: project.name,
      developer: project.developer?.name,
      location: project.location,
      emirate: project.emirate,
      community: project.community?.name,
      description: project.description,
      priceFrom: project.price_from,
      priceTo: project.price_to,
      bedroomsMin: project.bedrooms_min,
      bedroomsMax: project.bedrooms_max,
      sizeMin: project.size_min,
      sizeMax: project.size_max,
      handover: project.handover_date,
      paymentPlan: project.payment_plan,
      amenities: project.amenities,
      facilities: project.facilities,
      views: project.views,
      furnishedStatus: project.furnished_status,
      floors: project.floors,
      serviceCharge: project.service_charge,
      images: project.images?.map(img => ({ image_url: img.image_url, alt_text: img.alt_text })),
      documents: project.documents?.map(doc => ({ file_url: doc.file_url, file_name: doc.file_name, document_type: doc.document_type })),
    };

    const response = await supabase.functions.invoke("generate-property-report", {
      body: { project: projectData },
    });

    if (response.error) throw response.error;
    return response.data.html;
  };

  const handleViewReport = async () => {
    setIsGenerating(true);
    setActiveAction("view");
    try {
      const html = await generateReport();
      setReportHtml(html);
      setShowReportViewer(true);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    setActiveAction("download");
    try {
      const html = reportHtml || await generateReport();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JBJ-Global-Real-Estate-${project.name.replace(/\s+/g, '-')}-Report.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Property report downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleShareWhatsApp = () => {
    const projectUrl = `${window.location.origin}/project/${project.slug}`;
    const message = encodeURIComponent(
      `Hi, I'm interested in *${project.name}*\n\n` +
      `Location: ${project.location || 'Dubai'}\n` +
      `Price: From AED ${project.price_from ? (project.price_from / 1000000).toFixed(2) + 'M' : 'Contact for pricing'}\n` +
      `Bedrooms: ${project.bedrooms_min || 0} - ${project.bedrooms_max || 0}\n\n` +
      `View full details: ${projectUrl}\n\n` +
      `Please share more information about this property.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
    toast.success("Opening WhatsApp...");
  };

  const handleSendToJJ = () => {
    const projectUrl = `${window.location.origin}/project/${project.slug}`;
    const subject = encodeURIComponent(`Property Inquiry: ${project.name}`);
    const body = encodeURIComponent(
      `Hi JBJ Global Real Estate Team,\n\n` +
      `I am interested in the following property:\n\n` +
      `Property: ${project.name}\n` +
      `Location: ${project.location || 'Dubai'}\n` +
      `Developer: ${project.developer?.name || 'N/A'}\n` +
      `Starting Price: AED ${project.price_from ? (project.price_from / 1000000).toFixed(2) + 'M' : 'Contact for pricing'}\n\n` +
      `View details: ${projectUrl}\n\n` +
      `Please contact me with more information.\n\n` +
      `Best regards`
    );
    window.open(`mailto:${JJ_EMAIL}?subject=${subject}&body=${body}`, "_blank");
    toast.success("Opening email client...");
  };

  const handleShareToEmail = () => {
    if (!userEmail || !userEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    const projectUrl = `${window.location.origin}/project/${project.slug}`;
    const subject = encodeURIComponent(`Check out this property: ${project.name}`);
    const body = encodeURIComponent(
      `Hi,\n\n` +
      `I thought you might be interested in this property:\n\n` +
      `${project.name}\n` +
      `Location: ${project.location || 'Dubai'}\n` +
      `Starting from: AED ${project.price_from ? (project.price_from / 1000000).toFixed(2) + 'M' : 'Contact for pricing'}\n\n` +
      `View full details: ${projectUrl}\n\n` +
      `Powered by JBJ Global Real Estate`
    );
    window.open(`mailto:${userEmail}?subject=${subject}&body=${body}`, "_blank");
    toast.success("Opening email client...");
    setUserEmail("");
  };

  const handleCall = () => {
    window.open(`tel:+${WHATSAPP_NUMBER}`, "_self");
  };

  // Report Viewer Dialog
  if (showReportViewer && reportHtml) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowReportViewer(false);
          setReportHtml(null);
        }
        onOpenChange(isOpen);
      }}>
        <DialogContent className="bg-white border-zinc-200 max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
          {/* Report Viewer Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReportViewer(false);
                  setReportHtml(null);
                }}
                className="text-zinc-600 hover:text-zinc-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <span className="text-zinc-900 font-semibold">{project.name} - Report</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleShareWhatsApp}
                size="sm"
                variant="outline"
                className="border-green-500/30 text-green-600 hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4 mr-1 text-green-500" />
                Share
              </Button>
              <Button
                onClick={handleDownload}
                size="sm"
                variant="dark"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Report Content */}
          <div className="flex-1 overflow-y-auto">
            <iframe
              srcDoc={reportHtml}
              className="w-full h-full min-h-[600px] border-0"
              title="Property Report"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-zinc-200 text-black max-w-lg max-h-[85vh] overflow-y-auto my-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-3 text-black">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <FileText className="w-5 h-5 text-gold" />
            </div>
            Property Report & Share
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            View the complete property report or share it with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Property Info Summary */}
          <div className="bg-zinc-100 rounded-lg p-4 border border-zinc-200">
            <h3 className="font-semibold text-black mb-1">{project.name}</h3>
            <p className="text-sm text-zinc-500">
              {project.location || 'Dubai'} • {project.developer?.name || 'Premium Developer'}
            </p>
            <p className="text-gold font-medium mt-2">
              From AED {project.price_from ? (project.price_from / 1000000).toFixed(2) + 'M' : 'Contact for pricing'}
            </p>
          </div>

          {/* View Report Button - Primary */}
          <Button
            onClick={handleViewReport}
            disabled={isGenerating}
            variant="dark"
            className="w-full font-semibold h-12"
          >
            {isGenerating && activeAction === "view" ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 mr-2" />
                View Full Property Report
              </>
            )}
          </Button>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShareWhatsApp}
              variant="outline"
              className="bg-green-50 border-green-500/30 text-green-600 hover:bg-green-100 hover:text-green-700 h-12"
            >
              <MessageCircle className="w-5 h-5 mr-2 text-green-500" />
              WhatsApp
            </Button>
            <Button
              onClick={handleCall}
              variant="outline"
              className="bg-blue-50 border-blue-500/30 text-blue-600 hover:bg-blue-100 hover:text-blue-700 h-12"
            >
              <Phone className="w-5 h-5 mr-2 text-blue-500" />
              Call Now
            </Button>
          </div>

          {/* Send to Email */}
          <div className="space-y-2">
            <Label className="text-zinc-600 text-sm">Share via Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="bg-white border-zinc-300 text-black placeholder:text-zinc-400 flex-1"
              />
              <Button
                onClick={handleShareToEmail}
                variant="outline"
                className="border-zinc-300 text-black hover:bg-zinc-100"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Send to JBJ Global Real Estate */}
          <a href={`mailto:${JJ_EMAIL}?subject=${encodeURIComponent(`Property Inquiry: ${project.name}`)}&body=${encodeURIComponent(`Hi JBJ Global Real Estate Team,\n\nI am interested in the following property:\n\nProperty: ${project.name}\nLocation: ${project.location || 'Dubai'}\nDeveloper: ${project.developer?.name || 'N/A'}\nStarting Price: AED ${project.price_from ? (project.price_from / 1000000).toFixed(2) + 'M' : 'Contact for pricing'}\n\nPlease contact me with more information.\n\nBest regards`)}`}>
            <Button
              variant="outline"
              className="w-full border-gold text-gold hover:bg-gold/10 h-12"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact JBJ Global Real Estate Advisor
            </Button>
          </a>

          {/* Individual Documents */}
          {project.documents && project.documents.length > 0 && (
            <div className="pt-4 border-t border-zinc-200">
              <Label className="text-zinc-600 text-sm mb-3 block">Individual Materials</Label>
              <div className="space-y-2">
                {project.documents.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => window.open(doc.file_url, "_blank")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors text-left border border-zinc-200"
                  >
                    <div className="w-8 h-8 rounded bg-black flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-black text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-zinc-500 text-xs capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                    </div>
                    <Download className="w-4 h-4 text-gold" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyReportModal;
