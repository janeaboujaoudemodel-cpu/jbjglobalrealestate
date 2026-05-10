import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Search,
  RefreshCw,
  Download,
  Eye,
  Mail,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface BrokerSubscription {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  rera_number: string | null;
  tier: string;
  status: string;
  price_usd: number;
  currency: string;
  ai_credits_used: number;
  ai_credits_limit: number | null;
  pdf_downloads: number;
  created_at: string;
  expires_at: string | null;
  user_role: string | null;
}

const STATUS_COLORS: { [key: string]: string } = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  trial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending: "bg-amber-500/20 text-[#1A1A1A] border-amber-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  expired: "bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30",
};

const TIER_COLORS: { [key: string]: string } = {
  starter: "bg-[#1A1A1A] text-[#1A1A1A]/70",
  professional: "bg-[#EFE6D6]/20 text-[#1A1A1A]",
  enterprise: "bg-purple-500/20 text-purple-400",
};

export default function BrokerSubscriptionsDashboard() {
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const [subscriptions, setSubscriptions] = useState<BrokerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] = useState<BrokerSubscription | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [hasLoggedPageView, setHasLoggedPageView] = useState(false);
  const [detailViewCount, setDetailViewCount] = useState(0);
  const [detailViewStartTime, setDetailViewStartTime] = useState<number | null>(null);
  const [afterHoursAlertSent, setAfterHoursAlertSent] = useState(false);

  // Check if current time is after-hours in Dubai (9 PM - 8 AM, UTC+4)
  const isAfterHoursDubai = useCallback(() => {
    const now = new Date();
    // Get Dubai time (UTC+4)
    const dubaiOffset = 4 * 60; // minutes
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const dubaiMinutes = (utcMinutes + dubaiOffset) % (24 * 60);
    const dubaiHour = Math.floor(dubaiMinutes / 60);
    // After-hours: 9 PM (21:00) to 8 AM (08:00)
    return dubaiHour >= 21 || dubaiHour < 8;
  }, []);

  // Send after-hours access alert
  const sendAfterHoursAlert = useCallback(async (accessType: string) => {
    if (afterHoursAlertSent) return;
    
    try {
      const now = new Date();
      const dubaiOffset = 4 * 60;
      const dubaiTime = new Date(now.getTime() + dubaiOffset * 60 * 1000);
      const dubaiTimeStr = dubaiTime.toISOString().replace('T', ' ').substring(0, 19) + ' (Dubai)';
      
      await supabase.functions.invoke("send-security-alert", {
        body: {
          alertType: "after_hours_access",
          adminEmail: user?.email,
          adminName: user?.user_metadata?.full_name || user?.email,
          details: {
            resourceType: "broker_subscriptions",
            accessType,
            dubaiTime: dubaiTimeStr,
            additionalInfo: `Sensitive data accessed outside business hours (9 PM - 8 AM Dubai time)`,
          },
        },
      });
      setAfterHoursAlertSent(true);
    } catch (error) {
      console.error("Failed to send after-hours alert:", error);
    }
  }, [afterHoursAlertSent, user]);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("broker_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);

      // Log page view for sensitive data access (only once per session)
      if (!hasLoggedPageView && data && data.length > 0) {
        await logAction({
          actionType: "read",
          resourceType: "subscription",
          description: `Owner accessed broker subscriptions dashboard (${data.length} records)`,
          details: {
            recordCount: data.length,
            accessType: "list_view",
          },
        });
        setHasLoggedPageView(true);

        // Check for after-hours access
        if (isAfterHoursDubai()) {
          sendAfterHoursAlert("dashboard_view");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  }, [logAction, hasLoggedPageView, isAfterHoursDubai, sendAfterHoursAlert]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleViewDetails = async (subscription: BrokerSubscription) => {
    setSelectedSubscription(subscription);
    setViewDialogOpen(true);

    // Track rapid detail views for unusual access detection
    const now = Date.now();
    if (!detailViewStartTime) {
      setDetailViewStartTime(now);
      setDetailViewCount(1);
    } else {
      const timeSinceStart = now - detailViewStartTime;
      const newCount = detailViewCount + 1;
      setDetailViewCount(newCount);

      // If more than 10 detail views in 2 minutes, flag as unusual access
      if (newCount >= 10 && timeSinceStart < 120000) {
        try {
          await supabase.functions.invoke("send-security-alert", {
            body: {
              alertType: "bulk_access",
              adminEmail: user?.email,
              adminName: user?.user_metadata?.full_name || user?.email,
              details: {
                recordCount: newCount,
                resourceType: "broker_subscriptions",
                additionalInfo: `Viewed ${newCount} records in ${Math.round(timeSinceStart / 1000)} seconds`,
              },
            },
          });
          // Reset after sending alert
          setDetailViewStartTime(null);
          setDetailViewCount(0);
        } catch (alertError) {
          console.error("Failed to send bulk access alert:", alertError);
        }
      }

      // Reset window after 2 minutes
      if (timeSinceStart >= 120000) {
        setDetailViewStartTime(now);
        setDetailViewCount(1);
      }
    }

    // Log detailed view of sensitive data
    await logAction({
      actionType: "read",
      resourceType: "subscription",
      resourceId: subscription.id,
      description: `Admin viewed detailed broker subscription for ${subscription.email}`,
      details: {
        accessType: "detail_view",
        email: subscription.email,
        tier: subscription.tier,
        status: subscription.status,
        sensitiveFieldsAccessed: ["email", "phone", "rera_number", "company_name"],
      },
    });
  };

  const exportToCSV = async () => {
    if (subscriptions.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Log export action for sensitive data
    await logAction({
      actionType: "export",
      resourceType: "subscription",
      description: `Admin exported ${filteredSubscriptions.length} broker subscription records`,
      details: {
        exportFormat: "csv",
        recordCount: filteredSubscriptions.length,
        filters: { status: statusFilter, tier: tierFilter, search: searchQuery },
      },
    });

    // Send security alert email notification
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        const isAfterHours = isAfterHoursDubai();
        await supabase.functions.invoke("send-security-alert", {
          body: {
            alertType: "data_export",
            adminEmail: user?.email,
            adminName: user?.user_metadata?.full_name || user?.email,
            details: {
              recordCount: filteredSubscriptions.length,
              resourceType: "broker_subscriptions",
              filters: { status: statusFilter, tier: tierFilter, search: searchQuery },
              additionalInfo: `Exported ${filteredSubscriptions.length} of ${subscriptions.length} total records${isAfterHours ? " (AFTER-HOURS ACCESS)" : ""}`,
            },
          },
        });
        
        // Also send after-hours alert if applicable
        if (isAfterHours) {
          sendAfterHoursAlert("data_export");
        }
      }
    } catch (alertError) {
      console.error("Failed to send security alert:", alertError);
      // Don't block export if alert fails
    }

    let csvContent = "Name,Email,Phone,Company,RERA,Tier,Status,Price,Credits Used,PDF Downloads,Created,Expires\n";
    filteredSubscriptions.forEach((sub) => {
      csvContent += `"${sub.full_name || ""}","${sub.email}","${sub.phone || ""}","${sub.company_name || ""}","${sub.rera_number || ""}","${sub.tier}","${sub.status}","${sub.price_usd} ${sub.currency}","${sub.ai_credits_used}/${sub.ai_credits_limit || "∞"}","${sub.pdf_downloads}","${format(new Date(sub.created_at), "yyyy-MM-dd")}","${sub.expires_at ? format(new Date(sub.expires_at), "yyyy-MM-dd") : "N/A"}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `broker-subscriptions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Export completed");
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      (sub.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.company_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (sub.rera_number?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesTier = tierFilter === "all" || sub.tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  // Stats
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter((s) => s.status === "active").length;
  const trialSubscriptions = subscriptions.filter((s) => s.status === "trial").length;
  const totalRevenue = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.price_usd, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 bg-[#1A1A1A]" />
          ))}
        </div>
        <Skeleton className="h-96 bg-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice - Champagne theme */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-amber-800 font-medium text-sm">Sensitive Data Access</p>
          <p className="text-amber-700 text-xs mt-1">
            All access to broker subscription data is logged for security and compliance purposes.
            This includes viewing, exporting, and any modifications to records.
          </p>
        </div>
      </div>

      {/* Stats Cards - Champagne theme */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A]/70 text-sm">Total Subscriptions</span>
          </div>
          <p className="text-[#1A1A1A] text-3xl font-bold">{totalSubscriptions}</p>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-[#1A1A1A]/70 text-sm">Active</span>
          </div>
          <p className="text-[#1A1A1A] text-3xl font-bold">{activeSubscriptions}</p>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-[#1A1A1A]/70 text-sm">On Trial</span>
          </div>
          <p className="text-[#1A1A1A] text-3xl font-bold">{trialSubscriptions}</p>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A]/70 text-sm">Active Revenue</span>
          </div>
          <p className="text-[#1A1A1A] text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
        </Card>
      </div>

      {/* Filters and Actions - Champagne theme */}
      <div className="bg-[#FDFBF7] border-2 border-[#B89555]/30 rounded-xl p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]" />
            <Input
              placeholder="Search by name, email, company, or RERA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border-[#B89555]/30">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-36 bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border-[#B89555]/30">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            onClick={fetchSubscriptions}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table - Champagne theme */}
      <div className="bg-[#FDFBF7] border-2 border-[#B89555]/30 rounded-xl overflow-hidden shadow-lg">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader className="bg-gradient-to-r from-[#FDFBF7] to-[#F7F2EA] sticky top-0">
              <TableRow className="border-[#B89555]/20">
                <TableHead className="text-[#1A1A1A] font-semibold">Broker</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Contact</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Company</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Tier</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Status</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Usage</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Created</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[#1A1A1A]/70 py-10">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-t border-[#1A1A1A] hover:bg-[#1A1A1A]/50">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{sub.full_name || "—"}</p>
                        <p className="text-[#1A1A1A]/70 text-xs">{sub.user_role || "broker"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#1A1A1A]/70 text-sm">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-40">{sub.email}</span>
                        </div>
                        {sub.phone && (
                          <div className="flex items-center gap-2 text-[#1A1A1A]/70 text-xs">
                            <Phone className="w-3 h-3" />
                            {sub.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#1A1A1A]/70 text-sm">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-32">{sub.company_name || "—"}</span>
                        </div>
                        {sub.rera_number && (
                          <p className="text-[#1A1A1A]/70 text-xs">RERA: {sub.rera_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={TIER_COLORS[sub.tier] || "bg-[#1A1A1A]"}>
                        {sub.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[sub.status] || "bg-[#1A1A1A]"}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-[#1A1A1A]/70 text-xs space-y-1">
                        <p>AI: {sub.ai_credits_used}/{sub.ai_credits_limit || "∞"}</p>
                        <p>PDFs: {sub.pdf_downloads}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-[#1A1A1A]/70 text-sm">
                        {format(new Date(sub.created_at), "MMM d, yyyy")}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(sub)}
                        className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A1A1A]">
              Broker Subscription Details
            </DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[#1A1A1A]/70 text-xs uppercase">Full Name</p>
                  <p className="text-white">{selectedSubscription.full_name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#1A1A1A]/70 text-xs uppercase">Email</p>
                  <p className="text-white">{selectedSubscription.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#1A1A1A]/70 text-xs uppercase">Phone</p>
                  <p className="text-white">{selectedSubscription.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#1A1A1A]/70 text-xs uppercase">Company</p>
                  <p className="text-white">{selectedSubscription.company_name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#1A1A1A]/70 text-xs uppercase">RERA Number</p>
                  <p className="text-white">{selectedSubscription.rera_number || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#1A1A1A]/70 text-xs uppercase">User Role</p>
                  <p className="text-white capitalize">{selectedSubscription.user_role || "broker"}</p>
                </div>
              </div>

              <div className="border-t border-[#1A1A1A] pt-4">
                <h4 className="text-sm font-medium text-[#1A1A1A]/70 mb-3">Subscription Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[#1A1A1A]/70 text-xs uppercase">Tier</p>
                    <Badge className={TIER_COLORS[selectedSubscription.tier] || "bg-[#1A1A1A]"}>
                      {selectedSubscription.tier}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#1A1A1A]/70 text-xs uppercase">Status</p>
                    <Badge className={STATUS_COLORS[selectedSubscription.status] || "bg-[#1A1A1A]"}>
                      {selectedSubscription.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#1A1A1A]/70 text-xs uppercase">Price</p>
                    <p className="text-white">
                      ${selectedSubscription.price_usd} {selectedSubscription.currency}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#1A1A1A]/70 text-xs uppercase">Expires</p>
                    <p className="text-white">
                      {selectedSubscription.expires_at
                        ? format(new Date(selectedSubscription.expires_at), "PPP")
                        : "No expiration"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1A1A1A] pt-4">
                <h4 className="text-sm font-medium text-[#1A1A1A]/70 mb-3">Usage Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#1A1A1A] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{selectedSubscription.ai_credits_used}</p>
                    <p className="text-xs text-[#1A1A1A]/70">AI Credits Used</p>
                  </div>
                  <div className="bg-[#1A1A1A] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {selectedSubscription.ai_credits_limit || "∞"}
                    </p>
                    <p className="text-xs text-[#1A1A1A]/70">Credit Limit</p>
                  </div>
                  <div className="bg-[#1A1A1A] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{selectedSubscription.pdf_downloads}</p>
                    <p className="text-xs text-[#1A1A1A]/70">PDF Downloads</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1A1A1A] pt-4">
                <p className="text-xs text-[#1A1A1A]/70">
                  Subscription ID: <code className="text-[#1A1A1A]/70">{selectedSubscription.id}</code>
                </p>
                <p className="text-xs text-[#1A1A1A]/70">
                  User ID: <code className="text-[#1A1A1A]/70">{selectedSubscription.user_id}</code>
                </p>
                <p className="text-xs text-[#1A1A1A]/70 mt-2">
                  Created: {format(new Date(selectedSubscription.created_at), "PPpp")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
