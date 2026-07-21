import { useEffect, useRef } from "react";
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
  type LucideIcon,
} from "lucide-react";

type Item = { slug: string; label: string; icon: LucideIcon };

/**
 * Slugs here MUST match keys used by `moduleSchemas.ts` and `CRM_MODULE_MAP`
 * so the inline sheet can resolve the correct field schema.
 */
const ITEMS: Item[] = [
  { slug: "leads", label: "Lead", icon: Target },
  { slug: "contacts", label: "Contact", icon: UserCircle2 },
  { slug: "accounts", label: "Account", icon: Building2 },
  { slug: "deals", label: "Deal", icon: Handshake },
  { slug: "tasks", label: "Task", icon: CheckSquare },
  { slug: "meetings", label: "Meeting", icon: CalendarDays },
  { slug: "calls", label: "Call", icon: Phone },
  { slug: "quotes", label: "Quote", icon: FileText },
  { slug: "campaigns", label: "Campaign", icon: Megaphone },
  { slug: "invoices", label: "Invoice", icon: ReceiptText },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (slug: string) => void;
};

export default function CrmQuickCreateMenu({ open, onClose, onSelect }: Props) {
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
              <button
                type="button"
                className="jc-popover__row"
                role="menuitem"
                onClick={() => {
                  onSelect(it.slug);
                  onClose();
                }}
              >
                <span className="jc-popover__icon"><Icon size={16} /></span>
                <span>{it.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
