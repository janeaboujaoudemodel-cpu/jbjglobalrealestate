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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MessageCircle
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
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [isDevDialogOpen, setIsDevDialogOpen] = useState(false);
  const [isRepDialogOpen, setIsRepDialogOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);
  const [editingRep, setEditingRep] = useState<SalesRep | null>(null);
  
  // Form states
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
        const { error } = await supabase
          .from('uae_developers')
          .update(devForm)
          .eq('id', editingDev.id);
        
        if (error) throw error;
        toast.success("Developer updated");
      } else {
        const { error } = await supabase
          .from('uae_developers')
          .insert([devForm]);
        
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
      const data = {
        ...repForm,
        developer_id: selectedDeveloper.id
      };

      if (editingRep) {
        const { error } = await supabase
          .from('developer_sales_reps')
          .update(data)
          .eq('id', editingRep.id);
        
        if (error) throw error;
        toast.success("Sales rep updated");
      } else {
        const { error } = await supabase
          .from('developer_sales_reps')
          .insert([data]);
        
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
      const { error } = await supabase
        .from('uae_developers')
        .delete()
        .eq('id', id);
      
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
      const { error } = await supabase
        .from('developer_sales_reps')
        .delete()
        .eq('id', id);
      
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
  const otherDevelopers = filteredDevelopers.filter(d => d.location_emirate !== "Dubai");

  const getDeveloperReps = (devId: string) => salesReps.filter(r => r.developer_id === devId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">UAE Developers</h1>
              <p className="text-sm text-zinc-500">Manage developers and sales representatives</p>
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
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search developers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gold">{developers.length}</div>
              <p className="text-sm text-zinc-500">Total Developers</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-400">{dubaiDevelopers.length}</div>
              <p className="text-sm text-zinc-500">Dubai Developers</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-400">{salesReps.length}</div>
              <p className="text-sm text-zinc-500">Sales Reps</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-400">
                {salesReps.filter(r => r.is_primary).length}
              </div>
              <p className="text-sm text-zinc-500">Primary Contacts</p>
            </CardContent>
          </Card>
        </div>

        {/* Provident Sync */}
        <div className="mb-8">
          <ProvidentSyncButton />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dubai" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-700">
            <TabsTrigger value="dubai" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              Dubai ({dubaiDevelopers.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              All UAE ({filteredDevelopers.length})
            </TabsTrigger>
            <TabsTrigger value="briefings" className="data-[state=active]:bg-gold data-[state=active]:text-black">
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
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDev ? "Edit Developer" : "Add Developer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Developer Name *</Label>
                <Input
                  value={devForm.name}
                  onChange={(e) => setDevForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Emaar Properties"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input
                  value={devForm.slug}
                  onChange={(e) => setDevForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="emaar"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={devForm.location_city}
                  onChange={(e) => setDevForm(f => ({ ...f, location_city: e.target.value }))}
                  placeholder="Dubai"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label>Emirate</Label>
                <Input
                  value={devForm.location_emirate}
                  onChange={(e) => setDevForm(f => ({ ...f, location_emirate: e.target.value }))}
                  placeholder="Dubai"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <div>
              <Label>Website URL</Label>
              <Input
                value={devForm.website_url}
                onChange={(e) => setDevForm(f => ({ ...f, website_url: e.target.value }))}
                placeholder="https://emaar.com"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={devForm.description}
                onChange={(e) => setDevForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDevDialogOpen(false)} className="border-zinc-600">
              Cancel
            </Button>
            <Button onClick={handleSaveDeveloper} variant="dark">
              {editingDev ? "Update" : "Add Developer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Rep Dialog */}
      <Dialog open={isRepDialogOpen} onOpenChange={setIsRepDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRep ? "Edit Sales Rep" : "Add Sales Rep"}
              {selectedDeveloper && (
                <span className="text-sm font-normal text-zinc-400 ml-2">
                  for {selectedDeveloper.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={repForm.full_name}
                  onChange={(e) => setRepForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Ahmed Khan"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={repForm.title}
                  onChange={(e) => setRepForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Sales Representative"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={repForm.phone_e164}
                  onChange={(e) => setRepForm(f => ({ ...f, phone_e164: e.target.value }))}
                  placeholder="+971 50 123 4567"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={repForm.whatsapp_number}
                  onChange={(e) => setRepForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                  placeholder="+971 50 123 4567"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={repForm.email}
                onChange={(e) => setRepForm(f => ({ ...f, email: e.target.value }))}
                placeholder="ahmed@developer.com"
                type="email"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={repForm.notes}
                onChange={(e) => setRepForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={repForm.is_primary}
                onChange={(e) => setRepForm(f => ({ ...f, is_primary: e.target.checked }))}
                className="rounded border-zinc-600"
              />
              <Label htmlFor="is_primary" className="cursor-pointer">Primary Contact</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRepDialogOpen(false)} className="border-zinc-600">
              Cancel
            </Button>
            <Button onClick={handleSaveRep} variant="dark">
              {editingRep ? "Update" : "Add Sales Rep"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Developer Card Component
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/10 border border-gold/30 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gold" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{developer.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                  {developer.location_emirate}
                </Badge>
                <span className="text-xs text-zinc-500">{reps.length} sales reps</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddRep}
              className="text-gold hover:text-gold hover:bg-gold/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Rep
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="text-zinc-400 hover:text-white"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {reps.length > 0 && (
        <CardContent>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gold hover:text-gold/80 mb-3"
          >
            {isExpanded ? 'Hide' : 'Show'} Sales Representatives ({reps.length})
          </button>
          
          {isExpanded && (
            <div className="space-y-2">
              {reps.map(rep => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                      <Users className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{rep.full_name}</span>
                        {rep.is_primary && (
                          <Badge className="bg-gold/20 text-gold text-xs">Primary</Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{rep.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Quick Contact Buttons */}
                    <a
                      href={`tel:${rep.phone_e164}`}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    {rep.whatsapp_number && (
                      <a
                        href={`https://wa.me/${rep.whatsapp_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      >
                        <MessageCircle className="w-4 h-4 text-green-400" />
                      </a>
                    )}
                    {rep.email && (
                      <a
                        href={`mailto:${rep.email}`}
                        className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditRep(rep)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteRep(rep.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AdminDevelopers;
