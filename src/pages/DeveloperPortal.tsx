import { useState, useRef } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Upload, Building2, PartyPopper, FileText, Loader2, CheckCircle, X } from "lucide-react";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

const DeveloperPortal = () => {
  // Event form state
  const [eventForm, setEventForm] = useState({
    developer_name: "",
    developer_email: "",
    developer_phone: "",
    event_title: "",
    event_date: "",
    event_location: "",
    event_description: "",
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventSuccess, setEventSuccess] = useState(false);

  // Launch form state
  const [launchForm, setLaunchForm] = useState({
    developer_name: "",
    developer_email: "",
    project_name: "",
    project_description: "",
    location: "",
    launch_date: "",
  });
  const [launchFiles, setLaunchFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [launchSubmitting, setLaunchSubmitting] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.developer_name || !eventForm.developer_email || !eventForm.event_title) {
      toast.error("Please fill in all required fields");
      return;
    }
    setEventSubmitting(true);
    try {
      const { error } = await supabase.from("developer_submissions").insert({
        developer_name: eventForm.developer_name,
        developer_email: eventForm.developer_email,
        developer_phone: eventForm.developer_phone || null,
        submission_type: "event_invitation",
        event_title: eventForm.event_title,
        event_date: eventForm.event_date ? new Date(eventForm.event_date).toISOString() : null,
        event_location: eventForm.event_location || null,
        event_description: eventForm.event_description || null,
      } as any);
      if (error) throw error;
      setEventSuccess(true);
      toast.success("Event invitation submitted successfully!");
      setEventForm({ developer_name: "", developer_email: "", developer_phone: "", event_title: "", event_date: "", event_location: "", event_description: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFiles(true);
    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const path = `developer-uploads/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("documents").upload(path, file);
        if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type });
      } catch { toast.error(`Error uploading ${file.name}`); }
    }
    setLaunchFiles(prev => [...prev, ...uploaded]);
    setUploadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setLaunchFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLaunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!launchForm.developer_name || !launchForm.developer_email || !launchForm.project_name) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (launchFiles.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }
    setLaunchSubmitting(true);
    try {
      const { error } = await supabase.from("developer_launch_uploads").insert({
        developer_name: launchForm.developer_name,
        developer_email: launchForm.developer_email,
        project_name: launchForm.project_name,
        project_description: launchForm.project_description || null,
        location: launchForm.location || null,
        launch_date: launchForm.launch_date || null,
        uploaded_files: launchFiles,
      } as any);
      if (error) throw error;
      setLaunchSuccess(true);
      toast.success("New launch materials submitted successfully!");
      setLaunchForm({ developer_name: "", developer_email: "", project_name: "", project_description: "", location: "", launch_date: "" });
      setLaunchFiles([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setLaunchSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Developer Portal | JBJ Global Real Estate"
        description="Submit event invitations, new launch materials, and marketing collateral to JBJ Global Real Estate."
      />
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Hero */}
        <div className="relative py-16 md:py-24 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
            <Badge className="mb-4 bg-gold/20 text-gold border-gold/30 text-sm">For Real Estate Developers</Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Developer Portal</h1>
            <p className="text-lg md:text-xl text-white/70">
              Submit event invitations, new launch details, and marketing materials directly to our team.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Tabs defaultValue="event" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/30 rounded-xl h-14">
              <TabsTrigger value="event" className="text-sm md:text-base font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <PartyPopper className="w-4 h-4 mr-2" />
                Event / Invitation
              </TabsTrigger>
              <TabsTrigger value="launch" className="text-sm md:text-base font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <Building2 className="w-4 h-4 mr-2" />
                New Launch
              </TabsTrigger>
            </TabsList>

            {/* EVENT SUBMISSION TAB */}
            <TabsContent value="event" className="mt-6">
              {eventSuccess ? (
                <Card className="border-2 border-green-300 bg-green-50">
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h3 className="text-2xl font-bold text-green-800 mb-2">Submission Received!</h3>
                    <p className="text-green-700 mb-6">Your event invitation has been submitted. Our team will review it shortly.</p>
                    <Button onClick={() => setEventSuccess(false)} variant="outline">Submit Another</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Calendar className="w-5 h-5 text-gold" />
                      Submit Event Invitation
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Invite us to your launch event, networking session, or support gathering.</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEventSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Developer / Company Name *</Label>
                          <Input value={eventForm.developer_name} onChange={e => setEventForm(p => ({ ...p, developer_name: e.target.value }))} placeholder="e.g. Emaar Properties" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Email Address *</Label>
                          <Input type="email" value={eventForm.developer_email} onChange={e => setEventForm(p => ({ ...p, developer_email: e.target.value }))} placeholder="contact@developer.com" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input value={eventForm.developer_phone} onChange={e => setEventForm(p => ({ ...p, developer_phone: e.target.value }))} placeholder="+971 50 123 4567" />
                        </div>
                        <div className="space-y-2">
                          <Label>Event Title *</Label>
                          <Input value={eventForm.event_title} onChange={e => setEventForm(p => ({ ...p, event_title: e.target.value }))} placeholder="Grand Launch: Marina Heights" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Event Date</Label>
                          <Input type="datetime-local" value={eventForm.event_date} onChange={e => setEventForm(p => ({ ...p, event_date: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Event Location</Label>
                          <Input value={eventForm.event_location} onChange={e => setEventForm(p => ({ ...p, event_location: e.target.value }))} placeholder="Address Fountain Views, Downtown Dubai" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Event Description</Label>
                        <Textarea value={eventForm.event_description} onChange={e => setEventForm(p => ({ ...p, event_description: e.target.value }))} placeholder="Tell us about the event, what to expect, dress code, etc." rows={4} />
                      </div>
                      <Button type="submit" disabled={eventSubmitting} className="w-full bg-gradient-to-r from-[#D4B896] to-[#C4A87A] hover:from-[#C4A87A] hover:to-[#B4986A] text-black font-bold h-12">
                        {eventSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Event Invitation"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* NEW LAUNCH TAB */}
            <TabsContent value="launch" className="mt-6">
              {launchSuccess ? (
                <Card className="border-2 border-green-300 bg-green-50">
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h3 className="text-2xl font-bold text-green-800 mb-2">Materials Received!</h3>
                    <p className="text-green-700 mb-6">Your new launch materials have been submitted. We will process and generate the listing automatically.</p>
                    <Button onClick={() => setLaunchSuccess(false)} variant="outline">Submit Another Project</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Building2 className="w-5 h-5 text-gold" />
                      Submit New Launch Materials
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Upload PDFs, renders, brochures, and fact sheets for your new project. Our system will automatically generate a listing.</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLaunchSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Developer / Company Name *</Label>
                          <Input value={launchForm.developer_name} onChange={e => setLaunchForm(p => ({ ...p, developer_name: e.target.value }))} placeholder="e.g. Damac Properties" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Email Address *</Label>
                          <Input type="email" value={launchForm.developer_email} onChange={e => setLaunchForm(p => ({ ...p, developer_email: e.target.value }))} placeholder="marketing@developer.com" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Project Name *</Label>
                          <Input value={launchForm.project_name} onChange={e => setLaunchForm(p => ({ ...p, project_name: e.target.value }))} placeholder="The Residences at Marina" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input value={launchForm.location} onChange={e => setLaunchForm(p => ({ ...p, location: e.target.value }))} placeholder="Dubai Marina, Dubai" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Launch Date</Label>
                        <Input type="date" value={launchForm.launch_date} onChange={e => setLaunchForm(p => ({ ...p, launch_date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Project Description</Label>
                        <Textarea value={launchForm.project_description} onChange={e => setLaunchForm(p => ({ ...p, project_description: e.target.value }))} placeholder="Brief overview of the project, unit types, price range, etc." rows={3} />
                      </div>

                      {/* File Upload */}
                      <div className="space-y-3">
                        <Label>Marketing Materials *</Label>
                        <div
                          className="border-2 border-dashed border-gold/40 rounded-xl p-8 text-center hover:border-gold/70 transition-colors cursor-pointer bg-white/50"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-10 h-10 mx-auto text-gold/60 mb-3" />
                          <p className="text-sm font-medium text-foreground">Click to upload or drag & drop</p>
                          <p className="text-xs text-muted-foreground mt-1">PDFs, images, brochures, renders, fact sheets (up to 100MB each)</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.pptx"
                            onChange={handleFileUpload}
                          />
                        </div>
                        {uploadingFiles && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading files...
                          </div>
                        )}
                        {launchFiles.length > 0 && (
                          <div className="space-y-2">
                            {launchFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gold/20">
                                <FileText className="w-4 h-4 text-gold shrink-0" />
                                <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                                <button type="button" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button type="submit" disabled={launchSubmitting || launchFiles.length === 0} className="w-full bg-gradient-to-r from-[#D4B896] to-[#C4A87A] hover:from-[#C4A87A] hover:to-[#B4986A] text-black font-bold h-12">
                        {launchSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit New Launch Materials"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default DeveloperPortal;
