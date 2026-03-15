import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Users, Plus, Search, Star, Clock, Download } from "lucide-react";

const POSITIONS = ["COO", "Admin", "Sales Representative", "Channel Partner", "Marketing Manager", "Project Manager"];
const GENDERS = ["Male", "Female", "Other"];

const DeveloperCRM = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterGender, setFilterGender] = useState("all");

  const [form, setForm] = useState({
    full_name: "", position: "", email: "", phone: "", nationality: "",
    gender: "", years_in_real_estate: "", developer_company: "", feedback: "", notes: "",
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["dev-contacts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_contacts")
        .select("*")
        .eq("developer_user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("developer_contacts").insert({
        developer_user_id: user!.id,
        full_name: form.full_name,
        position: form.position || null,
        email: form.email || null,
        phone: form.phone || null,
        nationality: form.nationality || null,
        gender: form.gender || null,
        years_in_real_estate: form.years_in_real_estate ? parseInt(form.years_in_real_estate) : null,
        developer_company: form.developer_company || null,
        feedback: form.feedback || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-contacts"] });
      setShowCreate(false);
      setForm({ full_name: "", position: "", email: "", phone: "", nationality: "", gender: "", years_in_real_estate: "", developer_company: "", feedback: "", notes: "" });
      toast.success("Contact added.");
    },
    onError: () => toast.error("Failed to add contact."),
  });

  const filtered = contacts.filter((c: any) => {
    const matchSearch = !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchPos = filterPosition === "all" || c.position === filterPosition;
    const matchGender = filterGender === "all" || c.gender === filterGender;
    return matchSearch && matchPos && matchGender;
  });

  const exportCSV = () => {
    const headers = ["Name", "Position", "Email", "Phone", "Nationality", "Gender", "Years in RE", "Company"];
    const rows = filtered.map((c: any) => [c.full_name, c.position, c.email, c.phone, c.nationality, c.gender, c.years_in_real_estate, c.developer_company]);
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `developer-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Developer CRM</h1>
          <p className="text-muted-foreground mt-1">Manage your developer contacts and relationships.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Add Contact</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Position</Label>
                    <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Nationality</Label><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
                <div><Label>Years in Real Estate</Label><Input type="number" value={form.years_in_real_estate} onChange={(e) => setForm({ ...form, years_in_real_estate: e.target.value })} /></div>
                <div><Label>Developer Company</Label><Input value={form.developer_company} onChange={(e) => setForm({ ...form, developer_company: e.target.value })} /></div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.full_name}>Add Contact</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterPosition} onValueChange={setFilterPosition}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Position" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterGender} onValueChange={setFilterGender}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center p-12"><Clock className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No contacts found. Add your first contact to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{c.position || "—"}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{c.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{c.phone || "—"}</TableCell>
                    <TableCell className="text-xs">{c.developer_company || "—"}</TableCell>
                    <TableCell>
                      {c.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs">{c.rating}</span>
                        </div>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-right">{filtered.length} contact{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
};

export default DeveloperCRM;
