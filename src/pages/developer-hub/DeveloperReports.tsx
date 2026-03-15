import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, Download, FileText, Users, PartyPopper } from "lucide-react";

const DeveloperReports = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dev-report-stats", user?.id],
    queryFn: async () => {
      const [contacts, events, registration] = await Promise.all([
        supabase.from("developer_contacts").select("*", { count: "exact", head: true }).eq("developer_user_id", user!.id),
        supabase.from("launch_events").select("*", { count: "exact", head: true }).eq("developer_user_id", user!.id),
        supabase.from("developer_registrations").select("status").eq("user_id", user!.id).limit(1).maybeSingle(),
      ]);
      return {
        contactsCount: contacts.count || 0,
        eventsCount: events.count || 0,
        regStatus: registration.data?.status || "none",
      };
    },
    enabled: !!user?.id,
  });

  const exportContactsCSV = async () => {
    const { data } = await supabase.from("developer_contacts").select("*").eq("developer_user_id", user!.id).eq("is_active", true);
    if (!data?.length) { toast.info("No contacts to export."); return; }
    const headers = ["Name", "Position", "Email", "Phone", "Nationality", "Gender", "Years in RE", "Company", "Rating"];
    const rows = data.map(c => [c.full_name, c.position, c.email, c.phone, c.nationality, c.gender, c.years_in_real_estate, c.developer_company, c.rating]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `developer-contacts-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contacts report exported.");
  };

  const exportEventsCSV = async () => {
    const { data } = await supabase.from("launch_events").select("*").eq("developer_user_id", user!.id);
    if (!data?.length) { toast.info("No events to export."); return; }
    const headers = ["Title", "Project", "Date", "Venue", "Status", "Max Attendees"];
    const rows = data.map(e => [e.event_title, e.project_name, e.event_date, e.venue, e.approval_status, e.max_attendees]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `launch-events-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Events report exported.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Exports</h1>
        <p className="text-muted-foreground mt-1">Download reports for your developer data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> CRM Contacts</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats?.contactsCount ?? 0}</p>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={exportContactsCSV}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><PartyPopper className="w-4 h-4" /> Launch Events</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats?.eventsCount ?? 0}</p>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={exportEventsCSV}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><FileText className="w-4 h-4" /> Registration</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-foreground capitalize">{stats?.regStatus || "Not Started"}</p>
            <p className="text-xs text-muted-foreground mt-1">Company registration status</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeveloperReports;
