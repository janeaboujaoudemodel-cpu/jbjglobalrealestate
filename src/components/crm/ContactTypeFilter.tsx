import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Briefcase, Building, TrendingUp, Package, HelpCircle } from "lucide-react";

export type ContactType = 'all' | 'client' | 'broker' | 'developer' | 'investor' | 'vendor' | 'other';

interface ContactTypeFilterProps {
  value: ContactType;
  onChange: (value: ContactType) => void;
}

const CONTACT_TYPES: { value: ContactType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'all', label: 'All Contacts', icon: <Users className="h-4 w-4" />, color: 'text-muted-foreground' },
  { value: 'client', label: 'Clients', icon: <Users className="h-4 w-4" />, color: 'text-blue-600' },
  { value: 'broker', label: 'Brokers', icon: <Briefcase className="h-4 w-4" />, color: 'text-purple-600' },
  { value: 'developer', label: 'Developers', icon: <Building className="h-4 w-4" />, color: 'text-orange-600' },
  { value: 'investor', label: 'Investors', icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-600' },
  { value: 'vendor', label: 'Vendors', icon: <Package className="h-4 w-4" />, color: 'text-amber-600' },
  { value: 'other', label: 'Other', icon: <HelpCircle className="h-4 w-4" />, color: 'text-gray-600' },
];

const ContactTypeFilter = ({ value, onChange }: ContactTypeFilterProps) => {
  const selected = CONTACT_TYPES.find(t => t.value === value) || CONTACT_TYPES[0];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className={selected.color}>{selected.icon}</span>
            <span>{selected.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CONTACT_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <div className="flex items-center gap-2">
              <span className={type.color}>{type.icon}</span>
              <span>{type.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ContactTypeFilter;
