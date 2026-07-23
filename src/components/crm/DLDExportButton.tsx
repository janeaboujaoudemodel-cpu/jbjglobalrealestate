/**
 * DLDExportButton — always-visible Export dropdown for DLD-classified lists.
 * Exports the currently filtered rows as CSV or branded XLSX. Column set matches
 * the DLD public list per segment.
 */
import { ExportMenu, type ExportFormat } from "@/components/crm/ExportMenu";
import { exportPremiumXlsx } from "@/utils/exportXlsx";

export type DLDExportSegment = "developer" | "brokerage" | "broker";

interface Props {
  segment: DLDExportSegment;
  rows: Record<string, any>[];
  filenameSuffix?: string;
  disabled?: boolean;
}

const COLUMN_SETS: Record<
  DLDExportSegment,
  { key: string; label: string; width?: number }[]
> = {
  broker: [
    { key: "broker_no", label: "Broker No.", width: 14 },
    { key: "name_en", label: "Name (EN)", width: 32 },
    { key: "name_ar", label: "Name (AR)", width: 28 },
    { key: "office_name", label: "Office", width: 32 },
    { key: "mobile", label: "Mobile", width: 18 },
    { key: "email", label: "Email", width: 30 },
    { key: "license_category", label: "Category", width: 16 },
    { key: "area", label: "Area", width: 20 },
    { key: "license_expiry", label: "License Expiry", width: 16 },
  ],
  brokerage: [
    { key: "office_no", label: "Office No.", width: 14 },
    { key: "name_en", label: "Name (EN)", width: 34 },
    { key: "name_ar", label: "Name (AR)", width: 30 },
    { key: "manager", label: "Manager", width: 24 },
    { key: "phone", label: "Phone", width: 18 },
    { key: "email", label: "Email", width: 30 },
    { key: "area", label: "Area", width: 20 },
    { key: "license_expiry", label: "License Expiry", width: 16 },
  ],
  developer: [
    { key: "developer_no", label: "Developer No.", width: 14 },
    { key: "name_en", label: "Name (EN)", width: 34 },
    { key: "name_ar", label: "Name (AR)", width: 30 },
    { key: "license_no", label: "License No.", width: 18 },
    { key: "phone", label: "Phone", width: 18 },
    { key: "email", label: "Email", width: 30 },
    { key: "status", label: "Status", width: 14 },
  ],
};

/** Map a live DB row from any of the three segments into the DLD-style column set. */
function toDLDShape(segment: DLDExportSegment, r: Record<string, any>): Record<string, any> {
  if (segment === "broker") {
    return {
      broker_no: r.dld_broker_no ?? r.broker_no ?? r.rera_license ?? "",
      name_en: r.full_name ?? r.name_en ?? "",
      name_ar: r.name_ar ?? "",
      office_name: r.current_company ?? r.office_name ?? "",
      mobile: r.phone_e164 ?? r.mobile ?? "",
      email: r.email_lower ?? r.email ?? "",
      license_category: r.dld_license_category ?? r.license_category ?? "",
      area: r.dld_area ?? r.area ?? "",
      license_expiry: r.license_expiry ?? "",
    };
  }
  if (segment === "brokerage") {
    return {
      office_no: r.dld_office_no ?? r.office_no ?? r.license_number ?? "",
      name_en: r.company_name ?? r.name_en ?? "",
      name_ar: r.name_arabic ?? r.name_ar ?? "",
      manager: r.manager ?? r.manager_name ?? "",
      phone: r.phone ?? r.phone_number ?? "",
      email: r.email ?? "",
      area: r.dld_area ?? r.area ?? "",
      license_expiry: r.license_expiry ?? "",
    };
  }
  return {
    developer_no: r.developer_no ?? r.license_number ?? "",
    name_en: r.developer_name ?? r.name ?? r.name_en ?? "",
    name_ar: r.name_ar ?? "",
    license_no: r.license_no ?? r.license_number ?? "",
    phone: r.phone ?? r.phone_number ?? "",
    email: r.developer_email ?? r.email ?? "",
    status: r.status ?? r.relationship_status ?? "",
  };
}

function toCsv(cols: { key: string; label: string }[], rows: Record<string, any>[]): string {
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.map((c) => esc(c.label)).join(",");
  const body = rows
    .map((r) => cols.map((c) => esc(r[c.key])).join(","))
    .join("\n");
  return `\uFEFF${head}\n${body}`;
}

const SEGMENT_TITLE: Record<DLDExportSegment, string> = {
  broker: "DLD Brokers",
  brokerage: "DLD Brokerages",
  developer: "DLD Developers",
};

export function DLDExportButton({ segment, rows, filenameSuffix, disabled }: Props) {
  const columns = COLUMN_SETS[segment];
  const shaped = rows.map((r) => toDLDShape(segment, r));

  const doExport = (fmt: ExportFormat) => {
    if (!shaped.length) return;
    const base = `${segment}-dld${filenameSuffix ? `-${filenameSuffix}` : ""}`;
    if (fmt === "csv") {
      const csv = toCsv(columns, shaped);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }
    // xlsx (branded)
    exportPremiumXlsx(shaped, {
      filename: base,
      sheetName: SEGMENT_TITLE[segment],
      title: "JBJ GLOBAL REAL ESTATE",
      subtitle: `${SEGMENT_TITLE[segment]} · filtered export`,
      columns,
    });
  };

  return (
    <ExportMenu
      onExport={doExport}
      formats={["xlsx", "csv"]}
      disabled={disabled || rows.length === 0}
      label={`Export (${rows.length})`}
    />
  );
}

export default DLDExportButton;
