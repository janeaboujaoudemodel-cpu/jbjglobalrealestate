import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Briefcase,
  Smartphone,
  FileText,
  Lock
} from "lucide-react";
import { ScannedContact } from "@/utils/businessCardEncryption";

interface BusinessCardResultsProps {
  contacts: ScannedContact[];
  onDelete: (id: string) => void;
  showEncrypted: boolean;
  onUpdateContact: (id: string, updates: Partial<ScannedContact>) => void;
}

const BusinessCardResults = ({ 
  contacts, 
  onDelete, 
  showEncrypted,
  onUpdateContact 
}: BusinessCardResultsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ScannedContact>>({});

  const startEditing = (contact: ScannedContact) => {
    setEditingId(contact.id);
    setEditData({ ...contact });
  };

  const saveEdit = () => {
    if (editingId && editData) {
      onUpdateContact(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const maskData = (value: string | undefined): string => {
    if (!value) return "—";
    if (showEncrypted) {
      // Show encrypted-looking data
      return "●".repeat(Math.min(value.length, 20));
    }
    return value;
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Lock className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="font-medium">No contacts scanned yet</p>
        <p className="text-sm mt-1">
          Scan business cards to see extracted contacts here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {contacts.map((contact) => (
        <Card 
          key={contact.id} 
          className="border-border/50 hover:border-primary/30 transition-colors"
        >
          <CardContent className="p-4">
            {editingId === contact.id ? (
              // Edit Mode
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Job Title</label>
                    <Input
                      value={editData.jobTitle || ''}
                      onChange={(e) => setEditData({ ...editData, jobTitle: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Company</label>
                    <Input
                      value={editData.company || ''}
                      onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Phone</label>
                    <Input
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Mobile</label>
                    <Input
                      value={editData.mobile || ''}
                      onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Address</label>
                    <Input
                      value={editData.address || ''}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Website</label>
                    <Input
                      value={editData.website || ''}
                      onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Notes</label>
                    <Input
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEdit}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{maskData(contact.name)}</h4>
                      {contact.jobTitle && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {maskData(contact.jobTitle)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        contact.confidence >= 0.9 
                          ? 'border-green-500 text-green-600' 
                          : contact.confidence >= 0.7 
                            ? 'border-yellow-500 text-yellow-600'
                            : 'border-red-500 text-red-600'
                      }`}
                    >
                      {Math.round(contact.confidence * 100)}%
                    </Badge>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7"
                      onClick={() => startEditing(contact)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(contact.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {contact.company && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{maskData(contact.company)}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{maskData(contact.email)}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{maskData(contact.phone)}</span>
                    </div>
                  )}
                  {contact.mobile && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Smartphone className="h-3 w-3" />
                      <span>{maskData(contact.mobile)}</span>
                    </div>
                  )}
                  {contact.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{maskData(contact.website)}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{maskData(contact.address)}</span>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{maskData(contact.notes)}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>Scanned {new Date(contact.scannedAt).toLocaleString()}</span>
                  <Lock className="h-3 w-3" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BusinessCardResults;
