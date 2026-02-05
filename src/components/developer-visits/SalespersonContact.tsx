import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Mail, Lock, Building2 } from "lucide-react";

interface SalesContact {
  id: string;
  name: string;
  photo_url: string | null;
  phone: string;
  email: string;
}

interface ApprovedRequest {
  id: string;
  status: string;
  approved_at: string;
}

interface SalespersonContactProps {
  developerId: string;
  developerName: string;
}

export function SalespersonContact({ developerId, developerName }: SalespersonContactProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<SalesContact[]>([]);
  const [approvedRequest, setApprovedRequest] = useState<ApprovedRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);

      // Check for approved visit request
      const { data: requests } = await supabase
        .from("developer_visit_requests")
        .select("id, status, approved_at")
        .eq("user_id", user.id)
        .eq("developer_id", developerId)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(1);

      if (requests && requests.length > 0) {
        setApprovedRequest(requests[0]);

        // Load sales contacts
        const { data: contactsData } = await supabase
          .from("developer_sales_contacts")
          .select("id, name, photo_url, phone, email")
          .eq("developer_id", developerId)
          .eq("is_active", true);

        setContacts(contactsData || []);
      }

      setIsLoading(false);
    };

    loadData();
  }, [user, developerId]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No approved request - show locked state
  if (!approvedRequest) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <User className="h-5 w-5 text-primary" />
            Salesperson Contacts
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {developerName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Contact Details Locked</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Submit a briefing request and get admin approval to unlock salesperson contact information.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Approved - show contacts
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <User className="h-5 w-5 text-primary" />
          Salesperson Contacts
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {developerName}
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-2">
            Approved
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No salesperson contacts available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border"
              >
                <Avatar className="h-14 w-14">
                  <AvatarImage src={contact.photo_url || undefined} alt={contact.name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">{contact.name}</h4>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <a href={`tel:${contact.phone}`}>
                        <Phone className="h-3 w-3 mr-1" />
                        {contact.phone}
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <a href={`mailto:${contact.email}`}>
                        <Mail className="h-3 w-3 mr-1" />
                        {contact.email}
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
