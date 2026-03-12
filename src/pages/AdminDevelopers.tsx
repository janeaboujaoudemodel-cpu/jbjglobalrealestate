import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Phone, 
  Mail,
  ArrowLeft,
  Users,
  Search,
  MessageCircle,
  ExternalLink,
  Globe,
  Filter,
  Download,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { ProvidentSyncButton } from "@/components/admin/ProvidentSyncButton";
import BriefingManagement from "@/components/admin/BriefingManagement";

interface Developer {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  location_city: string;
  location_emirate: string;
  description: string | null;
  website_url: string | null;
  is_active: boolean;
}

interface SalesRep {
  id: string;
  developer_id: string;
  full_name: string;
  title: string;
  phone_e164: string;
  email: string | null;
  whatsapp_number: string | null;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
}

const AdminDevelopers = () => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [titleFilter, setTitleFilter] = useState("all");
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [isDevDialogOpen, setIsDevDialogOpen] = useState(false);
  const [isRepDialogOpen, setIsRepDialogOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);
  const [editingRep, setEditingRep] = useState<SalesRep | null>(null);
  
  const [devForm, setDevForm] = useState({
    name: "",
    slug: "",
    location_city: "Dubai",
    location_emirate: "Dubai",
    description: "",
    website_url: ""
  });
  
  const [repForm, setRepForm] = useState({
    full_name: "",
    title: "Sales Representative",
    phone_e164: "",
    email: "",
    whatsapp_number: "",
    is_primary: false,
    notes: ""
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [devRes, repRes] = await Promise.all([
        supabase.from('uae_developers').select('*').order('name'),
        supabase.from('developer_sales_reps').select('*').order('full_name')
      ]);
      if (devRes.data) setDevelopers(devRes.data);
      if (repRes.data) setSalesReps(repRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDeveloper = async () => {
    if (!devForm.name || !devForm.slug) {
      toast.error("Name and slug are required");
      return;
    }
    try {
      if (editingDev) {
        const { error } = await supabase.from('uae_developers').update(devForm).eq('id', editingDev.id);
        if (error) throw error;
        toast.success("Developer updated");
      } else {
        const { error } = await supabase.from('uae_developers').insert([devForm]);
        if (error) throw error;
        toast.success("Developer added");
      }
      setIsDevDialogOpen(false);
      setEditingDev(null);
      setDevForm({ name: "", slug: "", location_city: "Dubai", location_emirate: "Dubai", description: "", website_url: "" });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Error saving developer");
    }
  };

  const handleSaveRep = async () => {
    if (!repForm.full_name || !repForm.phone_e164 || !selectedDeveloper) {
      toast.error("Name and phone are required");
      return;
    }
    try {
      const data = { ...repForm, developer_id: selectedDeveloper.id };
      if (editingRep) {
        const { error } = await supabase.from('developer_sales_reps').update(data).eq('id', editingRep.id);
        if (error) throw error;
        toast.success("Sales rep updated");
      } else {
        const { error } = await supabase.from('developer_sales_reps').insert([data]);
        if (error) throw error;
        toast.success("Sales rep added");
      }
      setIsRepDialogOpen(false);
      setEditingRep(null);
      setRepForm({ full_name: "", title: "Sales Representative", phone_e164: "", email: "", whatsapp_number: "", is_primary: false, notes: "" });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Error saving sales rep");
    }
  };

  const handleDeleteDeveloper = async (id: string) => {
    if (!confirm("Delete this developer and all their sales reps?")) return;
    try {
      const { error } = await supabase.from('uae_developers').delete().eq('id', id);
      if (error) throw error;
      toast.success("Developer deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Error deleting developer");
    }
  };

  const handleDeleteRep = async (id: string) => {
    if (!confirm("Delete this sales representative?")) return;
    try {
      const { error } = await supabase.from('developer_sales_reps').delete().eq('id', id);
      if (error) throw error;
      toast.success("Sales rep deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Error deleting sales rep");
    }
  };

  const openEditDeveloper = (dev: Developer) => {
    setEditingDev(dev);
    setDevForm({
      name: dev.name,
      slug: dev.slug,
      location_city: dev.location_city || "Dubai",
      location_emirate: dev.location_emirate || "Dubai",
      description: dev.description || "",
      website_url: dev.website_url || ""
    });
    setIsDevDialogOpen(true);
  };

  const openEditRep = (rep: SalesRep) => {
    setEditingRep(rep);
    setRepForm({
      full_name: rep.full_name,
      title: rep.title,
      phone_e164: rep.phone_e164,
      email: rep.email || "",
      whatsapp_number: rep.whatsapp_number || "",
      is_primary: rep.is_primary,
      notes: rep.notes || ""
    });
    setIsRepDialogOpen(true);
  };

  const filteredDevelopers = developers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.location_emirate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dubaiDevelopers = filteredDevelopers.filter(d => d.location_emirate === "Dubai");
  const getDeveloperReps = (devId: string) => {
    let reps = salesReps.filter(r => r.developer_id === devId);
    if (titleFilter !== 'all') {
      reps = reps.filter(r => r.title === titleFilter);
    }
    return reps;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)] text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] backdrop-blur-md border-b-2 border-gold/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">UAE Developers</h1>
              <p className="text-sm text-muted-foreground">Manage developers and sales representatives</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingDev(null);
              setDevForm({ name: "", slug: "", location_city: "Dubai", location_emirate: "Dubai", description: "", website_url: "" });
              setIsDevDialogOpen(true);
            }}
            className="bg-gold hover:bg-gold/90 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Developer
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search developers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gold/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={titleFilter} onValueChange={setTitleFilter}>
              <SelectTrigger className="w-[180px] bg-white border-gold/20">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="COO">COO</SelectItem>
                <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                <SelectItem value="Channel Partner">Channel Partner</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gold">{developers.length}</div>
              <p className="text-sm text-muted-foreground">Total Developers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{dubaiDevelopers.length}</div>
              <p className="text-sm text-muted-foreground">Dubai Developers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{salesReps.length}</div>
              <p className="text-sm text-muted-foreground">Sales Reps</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-600">
                {salesReps.filter(r => r.is_primary).length}
              </div>
              <p className="text-sm text-muted-foreground">Primary Contacts</p>
            </CardContent>
          </Card>
        </div>

        {/* Provident Sync */}
        <div className="mb-8">
          <ProvidentSyncButton />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dubai" className="space-y-6">
          <TabsList className="bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border-2 border-gold/30">
            <TabsTrigger value="dubai" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              Dubai ({dubaiDevelopers.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              All UAE ({filteredDevelopers.length})
            </TabsTrigger>
            <TabsTrigger value="briefings" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              📅 Briefings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dubai" className="space-y-4">
            {dubaiDevelopers.map(dev => (
              <DeveloperCard
                key={dev.id}
                developer={dev}
                reps={getDeveloperReps(dev.id)}
                onEdit={() => openEditDeveloper(dev)}
                onDelete={() => handleDeleteDeveloper(dev.id)}
                onAddRep={() => {
                  setSelectedDeveloper(dev);
                  setEditingRep(null);
                  setRepForm({ full_name: "", title: "Sales Representative", phone_e164: "", email: "", whatsapp_number: "", is_primary: false, notes: "" });
                  setIsRepDialogOpen(true);
                }}
                onEditRep={(rep) => {
                  setSelectedDeveloper(dev);
                  openEditRep(rep);
                }}
                onDeleteRep={handleDeleteRep}
              />
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {filteredDevelopers.map(dev => (
              <DeveloperCard
                key={dev.id}
                developer={dev}
                reps={getDeveloperReps(dev.id)}
                onEdit={() => openEditDeveloper(dev)}
                onDelete={() => handleDeleteDeveloper(dev.id)}
                onAddRep={() => {
                  setSelectedDeveloper(dev);
                  setEditingRep(null);
                  setRepForm({ full_name: "", title: "Sales Representative", phone_e164: "", email: "", whatsapp_number: "", is_primary: false, notes: "" });
                  setIsRepDialogOpen(true);
                }}
                onEditRep={(rep) => {
                  setSelectedDeveloper(dev);
                  openEditRep(rep);
                }}
                onDeleteRep={handleDeleteRep}
              />
            ))}
          </TabsContent>

          <TabsContent value="briefings" className="space-y-4">
            <BriefingManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Developer Dialog */}
      <Dialog open={isDevDialogOpen} onOpenChange={setIsDevDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDev ? "Edit Developer" : "Add Developer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Developer Name *</Label>
                <Input value={devForm.name} onChange={(e) => setDevForm(f => ({ ...f, name: e.target.value }))} placeholder="Emaar Properties" className="bg-white border-gold/20" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={devForm.slug} onChange={(e) => setDevForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="emaar" className="bg-white border-gold/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={devForm.location_city} onChange={(e) => setDevForm(f => ({ ...f, location_city: e.target.value }))} placeholder="Dubai" className="bg-white border-gold/20" />
              </div>
              <div>
                <Label>Emirate</Label>
                <Input value={devForm.location_emirate} onChange={(e) => setDevForm(f => ({ ...f, location_emirate: e.target.value }))} placeholder="Dubai" className="bg-white border-gold/20" />
              </div>
            </div>
            <div>
              <Label>Website URL</Label>
              <Input value={devForm.website_url} onChange={(e) => setDevForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://emaar.com" className="bg-white border-gold/20" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={devForm.description} onChange={(e) => setDevForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." className="bg-white border-gold/20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDevDialogOpen(false)} className="border-gold/30">Cancel</Button>
            <Button onClick={handleSaveDeveloper} className="bg-gold hover:bg-gold/90 text-black">
              {editingDev ? "Update" : "Add Developer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Rep Dialog */}
      <Dialog open={isRepDialogOpen} onOpenChange={setIsRepDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRep ? "Edit Sales Rep" : "Add Sales Rep"}
              {selectedDeveloper && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  for {selectedDeveloper.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={repForm.full_name} onChange={(e) => setRepForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Ahmed Khan" className="bg-white border-gold/20" />
              </div>
              <div>
                <Label>Title</Label>
                <Input value={repForm.title} onChange={(e) => setRepForm(f => ({ ...f, title: e.target.value }))} placeholder="Sales Representative" className="bg-white border-gold/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone Number *</Label>
                <Input value={repForm.phone_e164} onChange={(e) => setRepForm(f => ({ ...f, phone_e164: e.target.value }))} placeholder="+971 50 123 4567" className="bg-white border-gold/20" />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={repForm.whatsapp_number} onChange={(e) => setRepForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="+971 50 123 4567" className="bg-white border-gold/20" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={repForm.email} onChange={(e) => setRepForm(f => ({ ...f, email: e.target.value }))} placeholder="ahmed@developer.com" type="email" className="bg-white border-gold/20" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={repForm.notes} onChange={(e) => setRepForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes..." className="bg-white border-gold/20" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_primary" checked={repForm.is_primary} onChange={(e) => setRepForm(f => ({ ...f, is_primary: e.target.checked }))} className="rounded border-gold/30" />
              <Label htmlFor="is_primary" className="cursor-pointer">Primary Contact</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRepDialogOpen(false)} className="border-gold/30">Cancel</Button>
            <Button onClick={handleSaveRep} className="bg-gold hover:bg-gold/90 text-black">
              {editingRep ? "Update" : "Add Sales Rep"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Developer Card Component — Reps always expanded
interface DeveloperCardProps {
  developer: Developer;
  reps: SalesRep[];
  onEdit: () => void;
  onDelete: () => void;
  onAddRep: () => void;
  onEditRep: (rep: SalesRep) => void;
  onDeleteRep: (id: string) => void;
}

const DeveloperCard = ({ developer, reps, onEdit, onDelete, onAddRep, onEditRep, onDeleteRep }: DeveloperCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/10 border border-gold/30 flex items-center justify-center overflow-hidden">
              {developer.logo_url ? (
                <img src={developer.logo_url} alt={developer.name} className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 className="w-6 h-6 text-gold" />
              )}
            </div>
            <div>
              <CardTitle className="text-foreground text-lg">{developer.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-gold/10 text-gold border border-gold/20 text-xs">
                  {developer.location_emirate}
                </Badge>
                <span className="text-xs text-muted-foreground">{reps.length} sales reps</span>
                {developer.website_url && (
                  <a href={developer.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onAddRep} className="text-gold hover:text-gold hover:bg-gold/10">
              <Plus className="w-4 h-4 mr-1" /> Add Rep
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} className="text-muted-foreground hover:text-foreground">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {developer.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{developer.description}</p>
        )}
      </CardHeader>
      
      {/* Reps always visible */}
      {reps.length > 0 && (
        <CardContent className="pt-0">
          <div className="border-t border-gold/20 pt-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sales Representatives</p>
            {reps.map(rep => (
              <div
                key={rep.id}
                className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-gold/15"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{rep.full_name}</span>
                      {rep.is_primary && (
                        <Badge className="bg-gold/20 text-gold border border-gold/30 text-[10px]">Primary</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{rep.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a href={`tel:${rep.phone_e164}`} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title={rep.phone_e164}>
                    <Phone className="w-4 h-4" />
                  </a>
                  {rep.whatsapp_number && (
                    <a href={`https://wa.me/${rep.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                  {rep.email && (
                    <a href={`mailto:${rep.email}`} className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors" title={rep.email}>
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onEditRep(rep)} className="text-muted-foreground hover:text-foreground h-8 w-8">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteRep(rep.id)} className="text-red-400 hover:text-red-600 h-8 w-8">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AdminDevelopers;
