import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  UserCircle2,
  Building2,
  Handshake,
  CheckSquare,
  CalendarDays,
  Phone,
  FileText,
  Megaphone,
  ReceiptText,
} from "lucide-react";

type Item = { slug: string; label: string; icon: React.ComponentType<{ size?: number }> };

const ITEMS: Item[] = [
  { slug: "leads/new", label: "Lead", icon: Target },
  { slug: "contacts/new", label: "Contact", icon: UserCircle2 },
  { slug: "accounts/new", label: "Account", icon: Building2 },
  { slug: "deals/new", label: "Deal", icon: Handshake },
  { slug: "tasks/new", label: "Task", icon: CheckSquare },
  { slug: "meetings/new", label: "Meeting", icon: CalendarDays },
  { slug: "calls/new", label: "Call", icon: Phone },
  { slug: "quotes/new", label: "Quote", icon: FileText },
  { slug: "campaigns/new", label: "Campaign", icon: Megaphone },
  { slug: "invoices/new", label: "Invoice", icon: ReceiptText },
];

type Props = { open: boolean; onClose: () => void };

export default function CrmQuickCreateMenu({ open, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="jc-popover jc-popover--quick" ref={ref} role="menu" aria-label="Quick create">
      <div className="jc-popover__title">Create new</div>
      <ul className="jc-popover__list">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.slug}>
              <Link
                to={`/owner/crm/jbj/${it.slug}`}
                className="jc-popover__row"
                onClick={onClose}
                role="menuitem"
              >
                <span className="jc-popover__icon"><Icon size={16} /></span>
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
