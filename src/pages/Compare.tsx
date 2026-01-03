import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useShortlist } from "@/hooks/useFavorites";
import { useGuestShortlist } from "@/hooks/useGuestFavorites";
import { ChevronLeft, Sparkles, Send, Loader2, CheckCircle, Download, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

const Compare = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: authShortlist } = useShortlist();
  const { shortlist: guestShortlist, getBadge } = useGuestShortlist();
  const [aiComparison, setAiComparison] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
  });
  const [requestSent, setRequestSent] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Use auth shortlist if logged in, otherwise guest shortlist
  const shortlist = user ? authShortlist : guestShortlist;
  const shortlistIds = shortlist?.map((s) => s.project_id) || [];

  // Fetch project details
  const { data: projects, isLoading } = useQuery({
    queryKey: ["compare-projects", shortlistIds],
    queryFn: async () => {
      if (!shortlistIds.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(name, slug),
          images:project_images(image_url, alt_text, display_order),
          community:communities(name, slug)
        `)
        .in("id", shortlistIds);

      if (error) throw error;
      return data;
    },
    enabled: shortlistIds.length > 0,
  });

  // Generate AI comparison
  const generateComparison = async () => {
    if (!projects?.length) return;
    
    setIsGenerating(true);
    try {
      const projectSummaries = projects.map((p) => ({
        name: p.name,
        developer: p.developer?.name,
        location: p.location,
        emirate: p.emirate,
        priceFrom: p.price_from,
        priceTo: p.price_to,
        bedrooms: `${p.bedrooms_min}-${p.bedrooms_max}`,
        sizeRange: `${p.size_min}-${p.size_max} sqft`,
        handover: p.handover_date,
        amenities: p.amenities,
        views: p.views,
        paymentPlan: p.payment_plan,
      }));

      const response = await supabase.functions.invoke("compare-projects", {
        body: { projects: projectSummaries },
      });

      if (response.error) throw response.error;
      setAiComparison(response.data.comparison);
    } catch (error) {
      console.error("Failed to generate comparison:", error);
      toast.error("Failed to generate AI comparison. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download comparison table as image
  const downloadTable = async () => {
    if (!tableRef.current || !projects?.length) return;
    
    // Create a styled HTML table for download
    const userName = formData.name || user?.email?.split("@")[0] || "Investor";
    const dateStr = new Date().toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const tableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Property Comparison - JJ Global Capital</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 40px; background: #fff; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #A8925A; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; }
          .gold { color: #A8925A; }
          .subtitle { color: #666; margin-top: 10px; }
          .user-info { margin-top: 15px; font-size: 14px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
          th { background: #1a1a1a; color: #fff; }
          .badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .top1 { background: #fef3c7; color: #92400e; }
          .top2 { background: #e5e7eb; color: #374151; }
          .top3 { background: #fed7aa; color: #9a3412; }
          .rating { color: #A8925A; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">JJ <span class="gold">Global Capital</span></div>
          <p class="subtitle">Premium Property Investment Advisory</p>
          <p class="user-info">Prepared for: <strong>${userName}</strong> | Date: ${dateStr}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Property</th>
              ${projects.map(p => {
                const badge = !user ? getBadge(p.id) : null;
                const badgeHtml = badge ? `<span class="badge ${badge}">${badge === 'top1' ? '🥇 Top 1' : badge === 'top2' ? '🥈 Top 2' : '🥉 Top 3'}</span>` : '';
                return `<th>${p.name} ${badgeHtml}</th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            <tr><td>Developer</td>${projects.map(p => `<td>${p.developer?.name || '-'}</td>`).join('')}</tr>
            <tr><td>Location</td>${projects.map(p => `<td>${p.location || '-'}</td>`).join('')}</tr>
            <tr><td>Emirate</td>${projects.map(p => `<td>${p.emirate || '-'}</td>`).join('')}</tr>
            <tr><td>Price From</td>${projects.map(p => `<td>AED ${((p.price_from || 0) / 1000000).toFixed(1)}M</td>`).join('')}</tr>
            <tr><td>Price To</td>${projects.map(p => `<td>${p.price_to ? `AED ${(p.price_to / 1000000).toFixed(1)}M` : '-'}</td>`).join('')}</tr>
            <tr><td>Bedrooms</td>${projects.map(p => `<td>${p.bedrooms_min} - ${p.bedrooms_max} BR</td>`).join('')}</tr>
            <tr><td>Size Range</td>${projects.map(p => `<td>${p.size_min?.toLocaleString() || '-'} - ${p.size_max?.toLocaleString() || '-'} sqft</td>`).join('')}</tr>
            <tr><td>Handover</td>${projects.map(p => `<td>${p.handover_date || 'Ready'}</td>`).join('')}</tr>
            <tr><td>Payment Plan</td>${projects.map(p => `<td>${p.payment_plan || '-'}</td>`).join('')}</tr>
            <tr><td>Views</td>${projects.map(p => `<td>${p.views?.join(', ') || '-'}</td>`).join('')}</tr>
            <tr><td>Rating</td>${projects.map(p => `<td class="rating">${'★'.repeat(Math.min(5, Math.ceil((p.price_from || 0) / 10000000)))}</td>`).join('')}</tr>
          </tbody>
        </table>
        ${aiComparison ? `<div style="margin-top: 30px;"><h3>AI Analysis</h3><p style="white-space: pre-wrap; color: #333; line-height: 1.6;">${aiComparison}</p></div>` : ''}
        <div class="footer">
          <p>© ${new Date().getFullYear()} JJ Global Capital | Premium Property Investment Advisory</p>
          <p>Contact: investor@jjglobalcapital.com | www.jjglobalcapital.com</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([tableHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JJ-Global-Capital-Comparison-${userName.replace(/\s+/g, '-')}-${dateStr.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Comparison table downloaded!");
  };

  // Submit evaluation request
  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!projects?.length) throw new Error("No projects to compare");

      const { error } = await supabase.from("evaluation_requests").insert({
        user_id: user?.id || null,
        project_ids: projects.map((p) => p.id),
        user_email: formData.email,
        user_name: formData.name,
        user_phone: formData.phone,
        ai_comparison: aiComparison,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setRequestSent(true);
      toast.success("Evaluation request sent! Our team will contact you shortly.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to submit request. Please try again.");
    },
  });

  if (isLoading) {
    return (
      <section className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </section>
    );
  }

  if (!projects?.length) {
    return (
      <section className="min-h-screen bg-zinc-950 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-3xl font-bold mb-4">No Properties to Compare</h1>
          <p className="text-zinc-400 mb-8">
            Add properties to your shortlist to compare them.
          </p>
          <Link to="/">
            <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
              Browse Properties
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-950 py-8 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Properties</span>
        </Link>

        <div className="flex flex-col gap-8">
          {/* Title and Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">
                Property Comparison
              </h1>
              <p className="text-zinc-400">
                Compare {projects.length} properties side by side
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={downloadTable}
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Comparison
              </Button>
            </div>
          </div>

          {/* Comparison Table */}
          <div ref={tableRef} className="overflow-x-auto bg-zinc-900 rounded-2xl border border-zinc-800">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4 text-zinc-500 font-medium border-b border-zinc-800 sticky left-0 bg-zinc-900 z-10">
                    Feature
                  </th>
                  {projects.map((project) => {
                    const badge = !user ? getBadge(project.id) : null;
                    return (
                      <th
                        key={project.id}
                        className="text-left py-4 px-4 border-b border-zinc-800 min-w-[250px]"
                      >
                        <div className="flex flex-col gap-2">
                          {badge && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold w-fit ${
                              badge === 'top1' ? 'bg-yellow-500/20 text-yellow-400' :
                              badge === 'top2' ? 'bg-gray-400/20 text-gray-300' :
                              'bg-orange-600/20 text-orange-400'
                            }`}>
                              {badge === 'top1' ? '🥇 Top 1' : badge === 'top2' ? '🥈 Top 2' : '🥉 Top 3'}
                            </span>
                          )}
                          <img
                            src={project.images?.[0]?.image_url || "/placeholder.svg"}
                            alt={project.name}
                            className="w-full aspect-video object-cover rounded-lg"
                          />
                          <h3 className="text-white font-semibold">{project.name}</h3>
                          <p className="text-zinc-500 text-sm">{project.developer?.name}</p>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Location", key: "location" },
                  { label: "Emirate", key: "emirate" },
                  { label: "Price From", key: "price_from", format: (v: number) => `AED ${(v / 1000000).toFixed(1)}M` },
                  { label: "Price To", key: "price_to", format: (v: number) => v ? `AED ${(v / 1000000).toFixed(1)}M` : "-" },
                  { label: "Bedrooms", key: "bedrooms", format: (_: any, p: any) => `${p.bedrooms_min} - ${p.bedrooms_max} BR` },
                  { label: "Size Range", key: "size", format: (_: any, p: any) => `${p.size_min?.toLocaleString() || "-"} - ${p.size_max?.toLocaleString() || "-"} sqft` },
                  { label: "Handover", key: "handover_date", format: (v: string) => v || "Ready" },
                  { label: "Payment Plan", key: "payment_plan", format: (v: string) => v || "-" },
                  { label: "Furnished", key: "furnished_status" },
                  { label: "Views", key: "views", format: (v: string[]) => v?.join(", ") || "-" },
                  { label: "Rating", key: "rating", format: (_: any, p: any) => {
                    const stars = Math.min(5, Math.ceil((p.price_from || 0) / 10000000));
                    return (
                      <span className="text-gold">
                        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
                      </span>
                    );
                  }},
                ].map((row) => (
                  <tr key={row.label} className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-zinc-500 sticky left-0 bg-zinc-900">{row.label}</td>
                    {projects.map((project) => {
                      const value = project[row.key as keyof typeof project];
                      const displayValue = row.format 
                        ? row.format(value as any, project)
                        : (value as string) || "-";
                      return (
                        <td key={project.id} className="py-4 px-4 text-white">
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Comparison */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Comparison</h3>
                  <p className="text-zinc-500 text-sm">Powered by Advanced AI</p>
                </div>
              </div>

              {aiComparison ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                    {aiComparison}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-zinc-400 text-sm mb-4">
                    Get an AI-powered analysis comparing these properties with star ratings and recommendations
                  </p>
                  <Button
                    onClick={generateComparison}
                    disabled={isGenerating || projects.length < 2}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Expert Consultation */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                  <Users className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Expert Consultation</h3>
                  <p className="text-zinc-500 text-sm">Complimentary Professional Evaluation</p>
                </div>
              </div>

              {requestSent ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-white font-medium">Request Submitted!</p>
                  <p className="text-zinc-400 text-sm mt-2">
                    Our investment specialists will contact you within 24 hours
                  </p>
                </div>
              ) : showRequestForm ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitRequest.mutate();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-zinc-400 text-sm mb-1 block">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm mb-1 block">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm mb-1 block">Phone (optional)</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="+971..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitRequest.isPending}
                    className="w-full bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90"
                  >
                    {submitRequest.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Request Expert Evaluation
                  </Button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-zinc-400 text-sm mb-4">
                    Our investment specialists will provide a detailed analysis and personalized recommendations
                  </p>
                  <Button
                    onClick={() => setShowRequestForm(true)}
                    className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Request Free Consultation
                  </Button>
                  <p className="text-zinc-600 text-xs mt-3">
                    Or contact us directly via our{" "}
                    <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      inquiry form
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Compare;
