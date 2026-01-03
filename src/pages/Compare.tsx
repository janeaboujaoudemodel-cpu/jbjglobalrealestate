import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useShortlist } from "@/hooks/useFavorites";
import { ChevronLeft, Sparkles, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Compare = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: shortlist } = useShortlist();
  const [aiComparison, setAiComparison] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
  });
  const [requestSent, setRequestSent] = useState(false);

  // Fetch project details
  const { data: projects, isLoading } = useQuery({
    queryKey: ["compare-projects", shortlist?.map((s) => s.project_id)],
    queryFn: async () => {
      if (!shortlist?.length) return [];
      const projectIds = shortlist.map((s) => s.project_id);
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(name, slug),
          images:project_images(image_url, alt_text, display_order),
          community:communities(name, slug)
        `)
        .in("id", projectIds);

      if (error) throw error;
      return data;
    },
    enabled: !!shortlist?.length,
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

  // Submit evaluation request
  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!user || !projects?.length) throw new Error("Invalid request");

      const { error } = await supabase.from("evaluation_requests").insert({
        user_id: user.id,
        project_ids: projects.map((p) => p.id),
        user_email: formData.email || user.email,
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

  if (!user) {
    return (
      <section className="min-h-screen bg-zinc-950 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-3xl font-bold mb-4">Sign in to Compare</h1>
          <p className="text-zinc-400 mb-8">
            Please sign in to access property comparison and evaluation features.
          </p>
          <Link to="/auth">
            <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
              Sign In
            </Button>
          </Link>
        </div>
      </section>
    );
  }

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

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Comparison Table */}
          <div className="flex-1">
            <h1 className="text-white text-3xl font-bold mb-8">
              Property Comparison
            </h1>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-4 px-4 text-zinc-500 font-medium border-b border-zinc-800">
                      Feature
                    </th>
                    {projects.map((project) => (
                      <th
                        key={project.id}
                        className="text-left py-4 px-4 border-b border-zinc-800"
                      >
                        <div className="flex flex-col gap-2">
                          <img
                            src={project.images?.[0]?.image_url || "/placeholder.svg"}
                            alt={project.name}
                            className="w-full aspect-video object-cover rounded-lg"
                          />
                          <h3 className="text-white font-semibold">{project.name}</h3>
                          <p className="text-zinc-500 text-sm">{project.developer?.name}</p>
                        </div>
                      </th>
                    ))}
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
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-zinc-800/50">
                      <td className="py-4 px-4 text-zinc-500">{row.label}</td>
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
          </div>

          {/* AI Analysis & Request Form */}
          <div className="lg:w-[400px] space-y-6">
            {/* AI Comparison */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Analysis</h3>
                  <p className="text-zinc-500 text-sm">Powered by Lovable AI</p>
                </div>
              </div>

              {aiComparison ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {aiComparison}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-zinc-400 text-sm mb-4">
                    Get an AI-powered analysis comparing these properties
                  </p>
                  <Button
                    onClick={generateComparison}
                    disabled={isGenerating}
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
                        Generate Analysis
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Request Evaluation */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-white font-semibold mb-2">Request Expert Evaluation</h3>
              <p className="text-zinc-500 text-sm mb-4">
                Our investment specialists will provide a detailed analysis
              </p>

              {requestSent ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-white font-medium">Request Submitted!</p>
                  <p className="text-zinc-400 text-sm mt-2">
                    Our team will contact you within 24 hours
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
                    className="w-full bg-white text-zinc-900 hover:bg-zinc-100"
                  >
                    {submitRequest.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Request
                  </Button>
                </form>
              ) : (
                <Button
                  onClick={() => setShowRequestForm(true)}
                  className="w-full bg-white text-zinc-900 hover:bg-zinc-100"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Request Human Evaluation
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Compare;
