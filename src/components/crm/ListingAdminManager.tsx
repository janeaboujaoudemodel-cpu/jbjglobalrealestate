import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useListingAdminManagement } from "@/hooks/useListingAdmin";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Plus,
  Search,
  User,
  Mail,
  Shield,
  ShieldOff,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";

const ListingAdminManager = () => {
  const {
    listingAdmins,
    isLoading,
    addListingAdmin,
    toggleListingAdminStatus,
    removeListingAdmin,
  } = useListingAdminManagement();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSearching(true);
    setFoundUser(null);

    try {
      // Search in profiles table
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", searchEmail.toLowerCase().trim())
        .single();

      if (error || !profile) {
        toast.error("No user found with this email. They must sign up first.");
        return;
      }

      // Check if already a listing admin
      const existing = listingAdmins.find((la) => la.email === searchEmail.toLowerCase().trim());
      if (existing) {
        toast.error("This user is already a Listing Admin");
        return;
      }

      setFoundUser(profile);
      setDisplayName(profile.full_name || "");
      toast.success("User found!");
    } catch (err) {
      console.error(err);
      toast.error("Error searching for user");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddListingAdmin = async () => {
    if (!foundUser) return;

    setIsAdding(true);
    try {
      await addListingAdmin(foundUser.id, displayName || foundUser.email, foundUser.email, notes);
      toast.success("Listing Admin added successfully!");
      setIsAddDialogOpen(false);
      setFoundUser(null);
      setSearchEmail("");
      setDisplayName("");
      setNotes("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add Listing Admin");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      await toggleListingAdminStatus(adminId, !currentStatus);
      toast.success(`Admin ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleRemove = async (adminId: string, displayName: string) => {
    if (!confirm(`Remove ${displayName} from Listing Admins?`)) return;

    try {
      await removeListingAdmin(adminId);
      toast.success("Listing Admin removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove");
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
      <CardHeader className="border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EFE6D6]/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <CardTitle className="text-white">Listing Admins</CardTitle>
              <p className="text-white/90 text-sm">
                Staff who can add & manage property listings
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="dark">
                <Plus className="w-4 h-4 mr-2" />
                Add Listing Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A]">
              <DialogHeader>
                <DialogTitle className="text-white">Add Listing Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-white/70">Search by Email</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Enter email address..."
                      className="bg-[#F7F2EA] border-[#1A1A1A] text-white"
                      onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                    />
                    <Button
                      onClick={handleSearchUser}
                      disabled={isSearching}
                      className="bg-[#EFE6D6] hover:bg-[#1A1A1A]"
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-white/90 text-xs mt-1">
                    User must have an account first
                  </p>
                </div>

                {foundUser && (
                  <>
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {foundUser.full_name || "No Name"}
                          </p>
                          <p className="text-green-400 text-sm">{foundUser.email}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/70">Display Name</Label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Name to display in the system"
                        className="bg-[#F7F2EA] border-[#1A1A1A] text-white mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-white/70">Notes (optional)</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any notes about this admin..."
                        className="bg-[#F7F2EA] border-[#1A1A1A] text-white mt-1"
                      />
                    </div>

                    <Button
                      onClick={handleAddListingAdmin}
                      disabled={isAdding}
                      className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]-dark text-[#1A1A1A] font-semibold"
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add as Listing Admin
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {listingAdmins.length === 0 ? (
          <div className="text-center py-12 text-white/90">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No Listing Admins yet</p>
            <p className="text-sm">Add staff members who will manage property listings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listingAdmins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 bg-[#F7F2EA]/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      admin.is_active
                        ? "bg-[#EFE6D6]/20 text-[#1A1A1A]"
                        : "bg-[#EFE6D6] text-white/90"
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{admin.display_name}</p>
                      {admin.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-[#EFE6D6] text-white/70 border-[#1A1A1A] text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-white/90 text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {admin.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open("/listing-admin", "_blank")}
                    className="text-white/70 hover:text-white"
                    title="Open Listing Management"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(admin.id, admin.is_active)}
                    className={
                      admin.is_active
                        ? "text-[#1A1A1A] hover:text-amber-300"
                        : "text-green-400 hover:text-green-300"
                    }
                    title={admin.is_active ? "Deactivate" : "Activate"}
                  >
                    {admin.is_active ? (
                      <ShieldOff className="w-4 h-4" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(admin.id, admin.display_name)}
                    className="text-red-400 hover:text-red-300"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingAdminManager;
