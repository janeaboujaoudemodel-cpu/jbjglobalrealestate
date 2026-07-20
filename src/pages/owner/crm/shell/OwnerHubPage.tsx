import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type OwnerHubInsight = {
  label: string;
  value: ReactNode;
  delta?: string;
};

type OwnerHubPageProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  insights?: OwnerHubInsight[];
  children: ReactNode;
};

/**
 * Zoho-emerald owner backend page shell. Wrap every /owner/crm/jbj/owner-*
 * page in this component to inherit the flat white card header + insights
 * strip. Never use inside Zoho-mirrored CRM pages.
 */
export default function OwnerHubPage({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  actions,
  insights,
  children,
}: OwnerHubPageProps) {
  return (
    <div className="owner-hub-page" data-hub-page="true">
      <header className="owner-hub-page__header">
        <div className="owner-hub-page__header-left">
          {Icon ? (
            <span className="owner-hub-page__icon" aria-hidden="true">
              <Icon size={22} strokeWidth={2} />
            </span>
          ) : null}
          <div style={{ minWidth: 0 }}>
            {eyebrow ? <p className="owner-hub-page__eyebrow">{eyebrow}</p> : null}
            <h1 className="owner-hub-page__title">{title}</h1>
            {subtitle ? <p className="owner-hub-page__subtitle">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div style={{ flexShrink: 0 }}>{actions}</div> : null}
      </header>

      {insights && insights.length > 0 ? (
        <div className="owner-hub-page__insights">
          {insights.map((tile, i) => (
            <div key={i} className="owner-hub-page__insight">
              <p className="owner-hub-page__insight-label">{tile.label}</p>
              <div className="owner-hub-page__insight-value">{tile.value}</div>
              {tile.delta ? <p className="owner-hub-page__insight-delta">{tile.delta}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {children}
    </div>
  );
}
