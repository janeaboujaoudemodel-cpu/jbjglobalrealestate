import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, Shield, AlertTriangle, Clock, CheckCircle, Edit2, Eye, EyeOff, Zap, Search, Loader2,
} from "lucide-react";

interface BrokerRow {
  id: string;
  user_id: string;
  display_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  is_public: boolean;
  broker_type: string;
  current_tier: string;
  total_points: number;
  custom_title: string | null;
  custom_label: string | null;
  performance_rating: string;
  verification_status: string;
  rera_expiry_date: string | null;
  id_expiry_date: string | null;
  probation_end: string | null;
  probation_skipped: boolean;
  show_contact_public: boolean;
  show_last_name_public: boolean;
}

export function BrokerManagementPanel() {
  const [brokers, setBrokers] = useState<BrokerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editBroker, setEditBroker] = useState<BrokerRow | null>(null);
  const [editForm, setEditForm] = useState({
    custom_title: "",
    custom_label: "",
    performance_rating: "standard",
  });

  useEffect(() => { fetchBrokers(); }, []);

  const fetchBrokers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("broker_profiles")
      .select("id, user_id, display_name, title, email, phone, is_active, is_public, broker_type, current_tier, total_points, custom_title, custom_label, performance_rating, verification_status, rera_expiry_date, id_expiry_date, probation_end, probation_skipped, show_contact_public, show_last_name_public")
      .order("display_name", { ascending: true });

    if (error) {
      toast.error("Failed to load broker profiles");
      console.error(error);
    } else {
      setBrokers((data as BrokerRow[]) || []);
    }
    setLoading(false);
  };

  const updateField = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("broker_profiles")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      toast.error(`Failed to update ${field}`);
      return;
    }
    toast.success("Updated");
    setBrokers(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const skipProbation = async (broker: BrokerRow) => {
    const { error } = await supabase
      .from("broker_profiles")
      .update({ probation_skipped: true, probation_end: null })
      .eq("id", broker.id);

    if (error) {
      toast.error("Failed to skip probation");
      return;
    }
    toast.success(`Probation skipped for ${broker.display_name}`);
    setBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, probation_skipped: true, probation_end: null } : b));
  };

  const saveEdit = async () => {
    if (!editBroker) return;
    const { error } = await supabase
      .from("broker_profiles")
      .update({
        custom_title: editForm.custom_title || null,
        custom_label: editForm.custom_label || null,
        performance_rating: editForm.performance_rating,
      })
      .eq("id", editBroker.id);

    if (error) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Broker profile updated");
    setEditBroker(null);
    fetchBrokers();
  };

  const isDocExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isDocExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 86400000;
  };

  const filtered = brokers.filter(b =>
    b.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" /> Broker Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage broker profiles, verification, probation, and public visibility
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search brokers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
      ) : (
        <Card className="border-gold/30">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Probation</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Public Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{broker.display_name}</p>
                          <p className="text-xs text-muted-foreground">{broker.custom_title || broker.title || "Broker"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                          {broker.current_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            className={
                              broker.verification_status === "verified"
                                ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                                : broker.verification_status === "expired"
                                ? "bg-red-500/20 text-red-600 border-red-500/30"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {broker.verification_status === "verified" ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Verified</>
                            ) : broker.verification_status === "expired" ? (
                              <><AlertTriangle className="w-3 h-3 mr-1" /> Expired</>
                            ) : (
                              "Unverified"
                            )}
                          </Badge>
                          {isDocExpired(broker.rera_expiry_date) && (
                            <p className="text-[10px] text-red-500">RERA expired</p>
                          )}
                          {isDocExpiringSoon(broker.rera_expiry_date) && (
                            <p className="text-[10px] text-amber-500">RERA expiring soon</p>
                          )}
                          {isDocExpired(broker.id_expiry_date) && (
                            <p className="text-[10px] text-red-500">ID expired</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {broker.probation_skipped ? (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                            <Zap className="w-3 h-3 mr-1" /> Skipped
                          </Badge>
                        ) : broker.probation_end ? (
                          <div className="text-xs">
                            <Clock className="w-3 h-3 inline mr-1 text-amber-500" />
                            {new Date(broker.probation_end) > new Date()
                              ? `${Math.ceil((new Date(broker.probation_end).getTime() - Date.now()) / 86400000)}d left`
                              : "Completed"
                            }
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gold text-[10px] h-6 px-2 ml-1"
                              onClick={() => skipProbation(broker)}
                            >
                              Skip
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            broker.performance_rating === "elite"
                              ? "border-amber-500 text-amber-600"
                              : broker.performance_rating === "top_performer"
                              ? "border-emerald-500 text-emerald-600"
                              : "border-muted text-muted-foreground"
                          }
                        >
                          {broker.performance_rating}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={broker.show_contact_public}
                          onCheckedChange={(v) => updateField(broker.id, "show_contact_public", v)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gold h-8"
                          onClick={() => {
                            setEditBroker(broker);
                            setEditForm({
                              custom_title: broker.custom_title || "",
                              custom_label: broker.custom_label || "",
                              performance_rating: broker.performance_rating || "standard",
                            });
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editBroker} onOpenChange={(o) => !o && setEditBroker(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Broker: {editBroker?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Custom Title</Label>
              <Input
                placeholder="e.g. Senior Sales Director"
                value={editForm.custom_title}
                onChange={(e) => setEditForm({ ...editForm, custom_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Label</Label>
              <Input
                placeholder="e.g. Top Performer Q4"
                value={editForm.custom_label}
                onChange={(e) => setEditForm({ ...editForm, custom_label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Performance Rating</Label>
              <Select
                value={editForm.performance_rating}
                onValueChange={(v) => setEditForm({ ...editForm, performance_rating: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="top_performer">Top Performer</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Show Last Name Publicly</Label>
              <Switch
                checked={editBroker?.show_last_name_public || false}
                onCheckedChange={(v) => {
                  if (editBroker) {
                    updateField(editBroker.id, "show_last_name_public", v);
                    setEditBroker({ ...editBroker, show_last_name_public: v });
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditBroker(null)}>Cancel</Button>
              <Button className="bg-gold text-black hover:bg-gold/90" onClick={saveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}