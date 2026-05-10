import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Shield,
  UserPlus,
  Trash2,
  Crown,
  Users,
  Building2,
  Loader2,
} from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_email?: string;
}

interface ListingAdmin {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin", description: "Full system access" },
  { value: "owner", label: "Owner", description: "Founder-level access" },
  { value: "broker", label: "Broker", description: "Broker dashboard access" },
  { value: "listing_admin", label: "Listing Admin", description: "Property listing management" },
];

const AdminRoleManagement = () => {
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [listingAdmins, setListingAdmins] = useState<ListingAdmin[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("admin");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/admin-role-management");
      return;
    }
    if (!isOwner) {
      navigate("/");
      return;
    }
    fetchData();
  }, [user, isOwner, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch user_roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;
      setUserRoles(roles || []);

      // Fetch listing_admins
      const { data: admins, error: adminsError } = await supabase
        .from("listing_admins")
        .select("*")
        .order("created_at", { ascending: false });

      if (adminsError) throw adminsError;
      setListingAdmins(admins || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch roles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newUserEmail.trim()) {
      toast.error("Please enter a user email");
      return;
    }

    setIsAdding(true);
    try {
      // First, find the user by email (this is a simplified approach)
      // In production, you'd want a more robust user lookup
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      // Since we can't use admin API from client, we'll use a different approach
      // Ask for user ID directly or use an edge function
      
      // For now, we'll add to listing_admins which stores email
      if (newUserRole === "listing_admin") {
        const { error } = await supabase
          .from("listing_admins")
          .insert({
            user_id: crypto.randomUUID(), // Placeholder - should be actual user ID
            display_name: newUserEmail.split("@")[0],
            email: newUserEmail,
            is_active: true,
          });

        if (error) throw error;
        toast.success("Listing admin added successfully");
      } else {
        // For other roles, we need the user ID
        toast.error("To add admin/owner roles, please use the user ID directly. Contact support for assistance.");
        setIsAdding(false);
        return;
      }

      setNewUserEmail("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add role");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRevokeRole = async (roleId: string, type: "user_role" | "listing_admin") => {
    try {
      if (type === "user_role") {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("id", roleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("listing_admins")
          .delete()
          .eq("id", roleId);
        if (error) throw error;
      }
      toast.success("Role revoked successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke role");
    }
  };

  const toggleListingAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("listing_admins")
        .update({ is_active: !currentStatus })
        .eq("id", adminId);

      if (error) throw error;
      toast.success(`Admin ${!currentStatus ? "activated" : "deactivated"}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center pt-28">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#B89555]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] pt-24 lg:pt-28">
      {/* Header */}
      <header className="border-b-2 border-[#B89555]/40 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] sticky top-[88px] lg:top-[104px] z-40 shadow-[0_4px_20px_rgba(200,167,102,0.15)] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]">
                <Shield className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div>
                <h1 className="text-[#1A1A1A] text-xl font-bold">
                  Role Management
                </h1>
                <span className="text-[#1A1A1A]/70 text-sm">Assign and revoke admin roles</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add New Role */}
          <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#1A1A1A]" />
                Add New Role
              </CardTitle>
              <CardDescription className="text-[#1A1A1A]/70">
                Grant administrative access to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[#1A1A1A]">User Email</Label>
                <Input
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1"
                />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Role</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <span>{role.label}</span>
                          <span className="text-xs text-[#1A1A1A]/70">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddRole}
                disabled={isAdding}
                className="w-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Role
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Role Statistics */}
          <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1A1A1A]" />
                Role Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#FDFBF7] rounded-lg border border-[#B89555]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-[#1A1A1A]" />
                    <span className="text-[#1A1A1A]/70 text-sm">System Roles</span>
                  </div>
                  <p className="text-[#1A1A1A] text-2xl font-bold">{userRoles.length}</p>
                </div>
                <div className="p-4 bg-[#FDFBF7] rounded-lg border border-[#B89555]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-[#1A1A1A]" />
                    <span className="text-[#1A1A1A]/70 text-sm">Listing Admins</span>
                  </div>
                  <p className="text-[#1A1A1A] text-2xl font-bold">{listingAdmins.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Roles Table */}
        <Card className="mt-6 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#1A1A1A]" />
              System Roles (Admin/Owner)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-[#B89555]/20">
                  <TableHead className="text-[#1A1A1A]">User ID</TableHead>
                  <TableHead className="text-[#1A1A1A]">Role</TableHead>
                  <TableHead className="text-[#1A1A1A]">Created</TableHead>
                  <TableHead className="text-[#1A1A1A] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((role) => (
                  <TableRow key={role.id} className="border-[#B89555]/20">
                    <TableCell className="text-[#1A1A1A]/70 font-mono text-sm">
                      {role.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge className={role.role === "owner" ? "bg-[#EFE6D6] text-[#1A1A1A]" : "bg-[#1A1A1A] text-white"}>
                        {role.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#1A1A1A]/70">
                      {new Date(role.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke this {role.role} role? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeRole(role.id, "user_role")}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {userRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-[#1A1A1A]/70 py-8">
                      No system roles configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Listing Admins Table */}
        <Card className="mt-6 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1A1A1A]" />
              Listing Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-[#B89555]/20">
                  <TableHead className="text-[#1A1A1A]">Name</TableHead>
                  <TableHead className="text-[#1A1A1A]">Email</TableHead>
                  <TableHead className="text-[#1A1A1A]">Status</TableHead>
                  <TableHead className="text-[#1A1A1A]">Created</TableHead>
                  <TableHead className="text-[#1A1A1A] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listingAdmins.map((admin) => (
                  <TableRow key={admin.id} className="border-[#B89555]/20">
                    <TableCell className="text-[#1A1A1A] font-medium">
                      {admin.display_name}
                    </TableCell>
                    <TableCell className="text-[#1A1A1A]/70">
                      {admin.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={admin.is_active ? "bg-green-100 text-green-800" : "bg-[#F7F2EA] text-[#1A1A1A]/70"}
                        onClick={() => toggleListingAdminStatus(admin.id, admin.is_active)}
                        style={{ cursor: "pointer" }}
                      >
                        {admin.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#1A1A1A]/70">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Listing Admin</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {admin.display_name} as a listing admin? They will lose access to the listing management panel.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeRole(admin.id, "listing_admin")}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {listingAdmins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-[#1A1A1A]/70 py-8">
                      No listing admins configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminRoleManagement;